import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PetRecord } from './database';

/**
 * Cross-cutting "platform" capabilities that exist purely to give QA engineers
 * additional, deterministic surfaces to test: authentication & RBAC, request
 * validation, pagination/filtering/sorting/search, rate limiting, asynchronous
 * jobs, idempotency, observability, and a security sandbox.
 *
 * Everything here is intentionally deterministic so the local target stays a
 * reliable, repeatable test bed:
 *  - tokens are signed with a fixed secret (HMAC-SHA256),
 *  - rate-limit buckets are keyed by a client-supplied id so tests are isolated,
 *  - async jobs advance by *poll count* rather than wall-clock time,
 *  - idempotency keys are remembered for the lifetime of the process.
 */

// ---------------------------------------------------------------------------
// Build / version info
// ---------------------------------------------------------------------------

export const APP_VERSION = '2.0.0';
export const APP_NAME = 'pethub-local';
const startedAt = new Date().toISOString();

export type VersionInfo = {
  name: string;
  version: string;
  apiVersions: string[];
  node: string;
  startedAt: string;
};

export const getVersionInfo = (): VersionInfo => ({
  name: APP_NAME,
  version: APP_VERSION,
  apiVersions: ['v1', 'v2'],
  node: process.version,
  startedAt,
});

// ---------------------------------------------------------------------------
// Authentication & role-based access control
// ---------------------------------------------------------------------------

export type PlatformRole = 'admin' | 'editor' | 'viewer';

export type AuthUser = {
  username: string;
  password: string;
  role: PlatformRole;
};

/**
 * Fixed credential set used by the bearer-token auth surface. Kept separate
 * from the storefront/app users so auth tests do not interfere with CRUD tests.
 */
export const authUsers: readonly AuthUser[] = [
  { username: 'admin', password: 'Admin#12345', role: 'admin' },
  { username: 'editor', password: 'Editor#12345', role: 'editor' },
  { username: 'viewer', password: 'Viewer#12345', role: 'viewer' },
];

const TOKEN_SECRET = 'pethub-local-signing-secret';
const TOKEN_TTL_SECONDS = 60 * 60;

const base64UrlEncode = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sign = (data: string): string =>
  createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export type TokenPayload = {
  sub: string;
  role: PlatformRole;
  iat: number;
  exp: number;
};

export type IssuedToken = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  role: PlatformRole;
  username: string;
};

export const authenticate = (username: string, password: string): AuthUser | undefined =>
  authUsers.find((candidate) => candidate.username === username && candidate.password === password);

export const issueToken = (user: AuthUser): IssuedToken => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.username,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);
  return {
    tokenType: 'Bearer',
    accessToken: `${header}.${body}.${signature}`,
    expiresIn: TOKEN_TTL_SECONDS,
    role: user.role,
    username: user.username,
  };
};

export type TokenVerification =
  { ok: true; payload: TokenPayload } | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' };

export const verifyToken = (token: string): TokenVerification => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { ok: false, reason: 'malformed' };
  }
  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);
  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (provided.length !== computed.length || !timingSafeEqual(provided, computed)) {
    return { ok: false, reason: 'bad-signature' };
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (payload.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
};

/** Extracts a bearer token from an `Authorization` header value. */
export const extractBearerToken = (header: string | undefined): string | undefined => {
  if (!header) {
    return undefined;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : undefined;
};

// ---------------------------------------------------------------------------
// Validation (structured, field-level errors for negative testing)
// ---------------------------------------------------------------------------

export type ValidationError = {
  field: string;
  code: 'required' | 'type' | 'enum' | 'min' | 'max' | 'maxLength';
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

const PET_STATUSES = ['available', 'pending', 'sold'] as const;

export type PetInput = {
  name?: unknown;
  category?: unknown;
  status?: unknown;
  price?: unknown;
  notes?: unknown;
};

/**
 * Strict validation for the v2 pet-create surface. Returns every violation so
 * tests can assert on field-level error codes (a common API-testing pattern).
 */
export const validatePetInput = (input: PetInput): ValidationResult => {
  const errors: ValidationError[] = [];

  if (input.name === undefined || input.name === null || input.name === '') {
    errors.push({ field: 'name', code: 'required', message: 'name is required' });
  } else if (typeof input.name !== 'string') {
    errors.push({ field: 'name', code: 'type', message: 'name must be a string' });
  } else if (input.name.length > 60) {
    errors.push({ field: 'name', code: 'maxLength', message: 'name must be 60 characters or fewer' });
  }

  if (input.category === undefined || input.category === null || input.category === '') {
    errors.push({ field: 'category', code: 'required', message: 'category is required' });
  } else if (typeof input.category !== 'string') {
    errors.push({ field: 'category', code: 'type', message: 'category must be a string' });
  }

  if (input.status === undefined || input.status === null || input.status === '') {
    errors.push({ field: 'status', code: 'required', message: 'status is required' });
  } else if (!PET_STATUSES.includes(input.status as (typeof PET_STATUSES)[number])) {
    errors.push({
      field: 'status',
      code: 'enum',
      message: `status must be one of: ${PET_STATUSES.join(', ')}`,
    });
  }

  if (input.price === undefined || input.price === null || input.price === '') {
    errors.push({ field: 'price', code: 'required', message: 'price is required' });
  } else if (typeof input.price !== 'number' || Number.isNaN(input.price)) {
    errors.push({ field: 'price', code: 'type', message: 'price must be a number' });
  } else if (input.price < 0) {
    errors.push({ field: 'price', code: 'min', message: 'price must be >= 0' });
  } else if (input.price > 100000) {
    errors.push({ field: 'price', code: 'max', message: 'price must be <= 100000' });
  }

  if (input.notes !== undefined && typeof input.notes !== 'string') {
    errors.push({ field: 'notes', code: 'type', message: 'notes must be a string' });
  }

  return { valid: errors.length === 0, errors };
};

// ---------------------------------------------------------------------------
// Pagination, filtering, sorting & search
// ---------------------------------------------------------------------------

export type PetQueryOptions = {
  page: number;
  limit: number;
  sort: 'id' | 'name' | 'price' | 'status';
  order: 'asc' | 'desc';
  category?: string;
  status?: PetRecord['status'];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: Pagination;
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const parsePetQuery = (query: Record<string, unknown>): PetQueryOptions => {
  const toNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const page = Math.max(1, Math.floor(toNumber(query.page) ?? 1));
  const rawLimit = Math.floor(toNumber(query.limit) ?? DEFAULT_LIMIT);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const sortRaw = String(query.sort ?? 'id');
  const sort: PetQueryOptions['sort'] =
    sortRaw === 'name' || sortRaw === 'price' || sortRaw === 'status' ? sortRaw : 'id';
  const order: PetQueryOptions['order'] = String(query.order ?? 'asc') === 'desc' ? 'desc' : 'asc';
  const statusRaw = query.status ? String(query.status) : undefined;
  const status =
    statusRaw && PET_STATUSES.includes(statusRaw as PetRecord['status'])
      ? (statusRaw as PetRecord['status'])
      : undefined;

  return {
    page,
    limit,
    sort,
    order,
    category: query.category ? String(query.category) : undefined,
    status,
    minPrice: toNumber(query.minPrice),
    maxPrice: toNumber(query.maxPrice),
    search: query.q ? String(query.q) : undefined,
  };
};

export const queryPets = (pets: readonly PetRecord[], options: PetQueryOptions): PaginatedResult<PetRecord> => {
  let filtered = [...pets];

  if (options.category) {
    const needle = options.category.toLowerCase();
    filtered = filtered.filter((pet) => pet.category.toLowerCase() === needle);
  }
  if (options.status) {
    filtered = filtered.filter((pet) => pet.status === options.status);
  }
  if (options.minPrice !== undefined) {
    filtered = filtered.filter((pet) => pet.price >= options.minPrice!);
  }
  if (options.maxPrice !== undefined) {
    filtered = filtered.filter((pet) => pet.price <= options.maxPrice!);
  }
  if (options.search) {
    const needle = options.search.toLowerCase();
    filtered = filtered.filter(
      (pet) => pet.name.toLowerCase().includes(needle) || pet.category.toLowerCase().includes(needle),
    );
  }

  filtered.sort((left, right) => {
    let comparison: number;
    switch (options.sort) {
      case 'name':
        comparison = left.name.localeCompare(right.name);
        break;
      case 'price':
        comparison = left.price - right.price;
        break;
      case 'status':
        comparison = left.status.localeCompare(right.status);
        break;
      default:
        comparison = left.id - right.id;
    }
    return options.order === 'desc' ? -comparison : comparison;
  });

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / options.limit);
  const start = (options.page - 1) * options.limit;
  const data = filtered.slice(start, start + options.limit);

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1 && total > 0,
    },
  };
};

// ---------------------------------------------------------------------------
// Rate limiting (fixed window, keyed by client id for test isolation)
// ---------------------------------------------------------------------------

export const RATE_LIMIT_MAX = 3;
export const RATE_LIMIT_WINDOW_MS = 60_000;

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
};

export const consumeRateLimit = (clientId: string): RateLimitDecision => {
  const now = Date.now();
  const existing = rateBuckets.get(clientId);
  if (!existing || existing.resetAt <= now) {
    const bucket: RateBucket = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(clientId, bucket);
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - 1,
      resetSeconds: RATE_LIMIT_WINDOW_MS / 1000,
    };
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: RATE_LIMIT_MAX,
    remaining: RATE_LIMIT_MAX - existing.count,
    resetSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
};

// ---------------------------------------------------------------------------
// Asynchronous jobs (state advances by poll count → deterministic)
// ---------------------------------------------------------------------------

export type JobStatus = 'queued' | 'running' | 'completed';

export type Job = {
  id: string;
  type: string;
  status: JobStatus;
  pollCount: number;
  createdAt: string;
  result?: Record<string, unknown>;
};

const jobs = new Map<string, Job>();
let jobSequence = 0;

export const createJob = (type: string): Job => {
  jobSequence += 1;
  const job: Job = {
    id: `job-${jobSequence}`,
    type,
    status: 'queued',
    pollCount: 0,
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  return job;
};

/**
 * Returns the job, advancing it one step per poll: queued → running →
 * completed. On completion a synthetic result payload is attached. Deterministic
 * so a retry/poll loop test always sees the same number of transitions.
 */
export const pollJob = (id: string, resultFactory: () => Record<string, unknown>): Job | undefined => {
  const job = jobs.get(id);
  if (!job) {
    return undefined;
  }
  job.pollCount += 1;
  if (job.status === 'queued') {
    job.status = 'running';
  } else if (job.status === 'running') {
    job.status = 'completed';
    job.result = resultFactory();
  }
  return job;
};

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

const idempotencyStore = new Map<string, unknown>();

export const getIdempotentResponse = <T>(key: string): T | undefined => idempotencyStore.get(key) as T | undefined;

export const rememberIdempotentResponse = (key: string, value: unknown): void => {
  idempotencyStore.set(key, value);
};

// ---------------------------------------------------------------------------
// Security sandbox
// ---------------------------------------------------------------------------

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes HTML-significant characters so reflected input cannot inject markup. */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------

export type MetricCounts = {
  pets: number;
  users: number;
  orders: number;
  events: number;
};

/** Renders metrics in Prometheus text exposition format. */
export const renderMetrics = (counts: MetricCounts): string =>
  [
    '# HELP pethub_pets_total Number of pets in the catalog.',
    '# TYPE pethub_pets_total gauge',
    `pethub_pets_total ${counts.pets}`,
    '# HELP pethub_users_total Number of registered users.',
    '# TYPE pethub_users_total gauge',
    `pethub_users_total ${counts.users}`,
    '# HELP pethub_orders_total Number of orders placed.',
    '# TYPE pethub_orders_total gauge',
    `pethub_orders_total ${counts.orders}`,
    '# HELP pethub_events_total Number of domain events emitted.',
    '# TYPE pethub_events_total counter',
    `pethub_events_total ${counts.events}`,
    '',
  ].join('\n');

// ---------------------------------------------------------------------------
// OpenAPI document (contract-testing surface)
// ---------------------------------------------------------------------------

export const buildOpenApiDocument = (): Record<string, unknown> => ({
  openapi: '3.0.3',
  info: {
    title: 'PetHub Local API',
    version: APP_VERSION,
    description: 'Deterministic local QA target exposing CRUD, CQRS and platform testing surfaces.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/health': { get: { summary: 'Liveness probe', responses: { '200': { description: 'Service is alive' } } } },
    '/ready': {
      get: {
        summary: 'Readiness probe',
        responses: { '200': { description: 'Ready' }, '503': { description: 'Not ready' } },
      },
    },
    '/version': { get: { summary: 'Build/version info', responses: { '200': { description: 'Version info' } } } },
    '/metrics': { get: { summary: 'Prometheus metrics', responses: { '200': { description: 'Metrics text' } } } },
    '/auth/login': {
      post: {
        summary: 'Issue a bearer token',
        responses: { '200': { description: 'Token issued' }, '401': { description: 'Bad credentials' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current token identity',
        responses: { '200': { description: 'Identity' }, '401': { description: 'Missing/invalid token' } },
      },
    },
    '/v2/pets': {
      get: {
        summary: 'List pets with pagination/filter/sort/search',
        responses: { '200': { description: 'Paginated pets' } },
      },
      post: {
        summary: 'Create a pet with strict validation',
        responses: { '201': { description: 'Created' }, '422': { description: 'Validation failed' } },
      },
    },
    '/v2/pets/{id}': {
      delete: {
        summary: 'Delete a pet (admin only)',
        responses: {
          '204': { description: 'Deleted' },
          '401': { description: 'Unauthenticated' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/v2/orders': {
      post: {
        summary: 'Create an order (idempotent via Idempotency-Key)',
        responses: { '201': { description: 'Created' }, '200': { description: 'Replayed' } },
      },
    },
    '/v2/rate-limited': {
      get: {
        summary: 'Rate-limited endpoint',
        responses: { '200': { description: 'OK' }, '429': { description: 'Too many requests' } },
      },
    },
    '/v2/echo': {
      get: { summary: 'Reflects HTML-escaped input', responses: { '200': { description: 'Echoed value' } } },
    },
    '/jobs': { post: { summary: 'Enqueue an async job', responses: { '202': { description: 'Accepted' } } } },
    '/jobs/{id}': {
      get: {
        summary: 'Poll an async job',
        responses: { '200': { description: 'Job state' }, '404': { description: 'Unknown job' } },
      },
    },
  },
});
