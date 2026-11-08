import Ajv, { type ValidateFunction } from 'ajv';

const ajv = new Ajv({ allErrors: true });

// Schemas are compiled once and cached; the data differs per call, the schema
// definition does not.
const compiled = new Map<object, ValidateFunction>();

/**
 * Compiles a JSON Schema (once) and validates `data` against it.
 *
 * Returns human-readable errors; an empty array means the payload satisfies the
 * contract. `BaseApiClient` turns a non-empty result into a failure at the call
 * site, so a response-shape regression names the exact instance path that broke.
 */
export function validateAgainstSchema(schema: object, data: unknown): string[] {
  let validate = compiled.get(schema);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schema, validate);
  }
  validate(data);
  return (validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message ?? 'invalid'}`);
}
