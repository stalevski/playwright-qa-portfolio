import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type SqlPrimitive = string | number | boolean | null;
type RowContext = Record<string, Record<string, unknown>>;

type SelectField = {
  kind: 'field';
  source: string;
  alias: string;
};

type CountField = {
  kind: 'count';
  alias: string;
};

type SelectExpression = SelectField | CountField;

type Condition = {
  left: string;
  right: SqlPrimitive;
};

type JoinDefinition = {
  table: string;
  onLeft: string;
  onRight: string;
};

type ParsedQuery = {
  select: SelectExpression[];
  from: string;
  join?: JoinDefinition;
  where: Condition[];
};

const selectRegex = /^select\s+(.+?)\s+from\s+([a-zA-Z_][\w]*)(?:\s+inner\s+join\s+([a-zA-Z_][\w]*)\s+on\s+(.+?))?(?:\s+where\s+(.+))?$/is;
const countRegex = /^count\(\*\)(?:\s+as\s+([a-zA-Z_][\w]*))?$/i;
const fieldRegex = /^([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)(?:\s+as\s+([a-zA-Z_][\w]*))?$/i;
const joinRegex = /^([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)\s*=\s*([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)$/i;

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const splitCommaSeparated = (value: string): string[] => value.split(',').map((part) => part.trim()).filter(Boolean);

const stripQuotes = (value: string): string => value.replace(/^'(.*)'$/s, '$1').replace(/^"(.*)"$/s, '$1');

const toPrimitive = (token: string, params: SqlPrimitive[]): SqlPrimitive => {
  const normalized = token.trim();
  if (normalized === '?') {
    if (params.length === 0) {
      throw new Error('Missing SQL parameter value.');
    }
    return params.shift() ?? null;
  }
  if (/^null$/i.test(normalized)) {
    return null;
  }
  if (/^true$/i.test(normalized)) {
    return true;
  }
  if (/^false$/i.test(normalized)) {
    return false;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }
  return stripQuotes(normalized);
};

const resolveIdentifier = (identifier: string, context: RowContext): unknown => {
  const parts = identifier.split('.');
  if (parts.length === 1) {
    const matches = Object.values(context)
      .filter((row) => Object.prototype.hasOwnProperty.call(row, parts[0]))
      .map((row) => row[parts[0]]);

    if (matches.length !== 1) {
      throw new Error(`Ambiguous SQL identifier: ${identifier}`);
    }

    return matches[0];
  }

  const [tableName, fieldName] = parts;
  const row = context[tableName];
  if (!row) {
    throw new Error(`Unknown SQL table reference: ${tableName}`);
  }

  return row[fieldName];
};

const parseSelect = (source: string): SelectExpression[] => splitCommaSeparated(source).map((entry) => {
  const countMatch = entry.match(countRegex);
  if (countMatch) {
    return {
      kind: 'count',
      alias: countMatch[1] ?? 'count',
    } satisfies CountField;
  }

  const fieldMatch = entry.match(fieldRegex);
  if (!fieldMatch) {
    throw new Error(`Unsupported SELECT field: ${entry}`);
  }

  const sourceIdentifier = fieldMatch[1];
  const alias = fieldMatch[2] ?? sourceIdentifier.split('.').at(-1) ?? sourceIdentifier;
  return {
    kind: 'field',
    source: sourceIdentifier,
    alias,
  } satisfies SelectField;
});

const parseJoin = (table: string | undefined, source: string | undefined): JoinDefinition | undefined => {
  if (!table || !source) {
    return undefined;
  }

  const match = source.match(joinRegex);
  if (!match) {
    throw new Error(`Unsupported JOIN clause: ${source}`);
  }

  return {
    table,
    onLeft: match[1],
    onRight: match[2],
  };
};

const parseWhere = (source: string | undefined, params: SqlPrimitive[]): Condition[] => {
  if (!source) {
    return [];
  }

  return source
    .split(/\s+and\s+/i)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause) => {
      const [left, right] = clause.split('=').map((part) => part.trim());
      if (!left || right === undefined) {
        throw new Error(`Unsupported WHERE clause: ${clause}`);
      }
      return {
        left,
        right: toPrimitive(right, params),
      } satisfies Condition;
    });
};

const parseQuery = (sql: string, params: SqlPrimitive[]): ParsedQuery => {
  const normalized = normalizeWhitespace(sql).replace(/;$/, '');
  const match = normalized.match(selectRegex);
  if (!match) {
    throw new Error(`Unsupported SQL query: ${sql}`);
  }

  return {
    select: parseSelect(match[1]),
    from: match[2],
    join: parseJoin(match[3], match[4]),
    where: parseWhere(match[5], params),
  };
};

const matchesWhere = (context: RowContext, conditions: Condition[]): boolean => conditions.every((condition) => resolveIdentifier(condition.left, context) === condition.right);

const mapRow = (context: RowContext, select: SelectExpression[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const expression of select) {
    if (expression.kind === 'field') {
      result[expression.alias] = resolveIdentifier(expression.source, context);
    }
  }
  return result;
};

export class JsonSqlDatabase {
  constructor(private readonly relativeFilePath: string) {}

  async query<T extends Record<string, unknown>>(sql: string, parameters: SqlPrimitive[] = []): Promise<T[]> {
    const parameterQueue = [...parameters];
    const parsed = parseQuery(sql, parameterQueue);
    const filePath = resolve(process.cwd(), this.relativeFilePath);
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, Array<Record<string, unknown>>>;
    const baseRows = data[parsed.from];

    if (!Array.isArray(baseRows)) {
      throw new Error(`SQL table not found in JSON database: ${parsed.from}`);
    }

    const joinedRows = parsed.join ? data[parsed.join.table] : undefined;
    if (parsed.join && !Array.isArray(joinedRows)) {
      throw new Error(`SQL table not found in JSON database: ${parsed.join.table}`);
    }

    const contexts: RowContext[] = [];

    for (const baseRow of baseRows) {
      if (!parsed.join) {
        contexts.push({ [parsed.from]: baseRow });
        continue;
      }

      for (const joinedRow of joinedRows ?? []) {
        const context: RowContext = {
          [parsed.from]: baseRow,
          [parsed.join.table]: joinedRow,
        };

        if (resolveIdentifier(parsed.join.onLeft, context) === resolveIdentifier(parsed.join.onRight, context)) {
          contexts.push(context);
        }
      }
    }

    const filtered = contexts.filter((context) => matchesWhere(context, parsed.where));
    const hasCount = parsed.select.some((expression) => expression.kind === 'count');

    if (hasCount) {
      const countField = parsed.select.find((expression): expression is CountField => expression.kind === 'count');
      if (!countField) {
        throw new Error('Invalid COUNT(*) expression.');
      }
      return [{ [countField.alias]: filtered.length } as T];
    }

    return filtered.map((context) => mapRow(context, parsed.select) as T);
  }
}
