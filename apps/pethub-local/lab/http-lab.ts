import { createHash } from 'node:crypto';
import type { Request } from 'express';

/**
 * Pure helpers for the HTTP "lab" — an httpbin/reqres-style set of stateless
 * utility endpoints that let QA engineers practice HTTP-mechanics testing
 * (status codes, redirects, headers, cookies, auth schemes, encoding, caching,
 * content negotiation, latency) without any petstore domain coupling.
 *
 * Everything here is deterministic and side-effect free so the serial local
 * suite stays repeatable.
 */

// ---------------------------------------------------------------------------
// Status codes
// ---------------------------------------------------------------------------

/** Clamps an arbitrary value to a valid HTTP status code, defaulting to 400. */
export const clampStatusCode = (raw: unknown): number => {
  const code = Number(raw);
  if (!Number.isInteger(code) || code < 100 || code > 599) {
    return 400;
  }
  return code;
};

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  418: "I'm a teapot",
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

export const statusText = (code: number): string => STATUS_TEXT[code] ?? 'Unknown';

// ---------------------------------------------------------------------------
// Delay
// ---------------------------------------------------------------------------

/** Clamps a requested delay (in seconds) to a small, test-safe range [0, max]. */
export const clampDelaySeconds = (raw: unknown, max = 3): number => {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0;
  }
  return Math.min(seconds, max);
};

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Request reflection ("/anything")
// ---------------------------------------------------------------------------

export type AnythingResponse = {
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: unknown;
  contentType: string | null;
};

const collectHeaders = (request: Request): Record<string, string> => {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) {
      continue;
    }
    headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return headers;
};

/** Builds an httpbin-style reflection of the incoming request. */
export const buildAnythingResponse = (request: Request): AnythingResponse => ({
  method: request.method,
  path: request.originalUrl,
  query: { ...request.query },
  headers: collectHeaders(request),
  body: request.body ?? null,
  contentType: request.headers['content-type'] ?? null,
});

// ---------------------------------------------------------------------------
// Auth schemes
// ---------------------------------------------------------------------------

export type BasicCredentials = { user: string; pass: string };

/** Parses an `Authorization: Basic base64(user:pass)` header. */
export const parseBasicAuth = (header: string | undefined): BasicCredentials | undefined => {
  if (!header) {
    return undefined;
  }
  const match = /^Basic\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return undefined;
  }
  let decoded: string;
  try {
    decoded = Buffer.from(match[1], 'base64').toString('utf8');
  } catch {
    return undefined;
  }
  const separator = decoded.indexOf(':');
  if (separator === -1) {
    return undefined;
  }
  return { user: decoded.slice(0, separator), pass: decoded.slice(separator + 1) };
};

/** Parses an `Authorization: Bearer <token>` header. */
export const parseBearerToken = (header: string | undefined): string | undefined => {
  if (!header) {
    return undefined;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : undefined;
};

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

export const encodeBase64 = (value: string): string => Buffer.from(value, 'utf8').toString('base64');

export type Base64Decode = { ok: true; decoded: string } | { ok: false };

export const decodeBase64 = (value: string): Base64Decode => {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    // Round-trip guard: reject input that is not valid base64.
    if (Buffer.from(decoded, 'utf8').toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) {
      return { ok: false };
    }
    return { ok: true, decoded };
  } catch {
    return { ok: false };
  }
};

// ---------------------------------------------------------------------------
// Caching (ETag)
// ---------------------------------------------------------------------------

/** Computes a stable, weak-free ETag for a JSON-serialisable payload. */
export const computeEtag = (payload: unknown): string =>
  `"${createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 16)}"`;

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

export const parseCookieHeader = (header: string | undefined): Record<string, string> => {
  if (!header) {
    return {};
  }
  return header.split(';').reduce<Record<string, string>>((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) {
      return cookies;
    }
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
};

// ---------------------------------------------------------------------------
// Content negotiation samples
// ---------------------------------------------------------------------------

export type SamplePayload = {
  id: number;
  title: string;
  active: boolean;
  tags: string[];
};

export const samplePayload = (): SamplePayload => ({
  id: 1,
  title: 'QA Lab sample',
  active: true,
  tags: ['alpha', 'beta'],
});

/** Serialises the sample payload as a small XML document for negotiation tests. */
export const sampleXml = (payload: SamplePayload): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sample>',
    `  <id>${payload.id}</id>`,
    `  <title>${payload.title}</title>`,
    `  <active>${payload.active}</active>`,
    `  <tags>${payload.tags.map((tag) => `<tag>${tag}</tag>`).join('')}</tags>`,
    '</sample>',
  ].join('\n');
