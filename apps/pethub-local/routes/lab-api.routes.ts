import { gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import {
  buildAnythingResponse,
  clampDelaySeconds,
  clampStatusCode,
  computeEtag,
  decodeBase64,
  encodeBase64,
  parseBasicAuth,
  parseBearerToken,
  parseCookieHeader,
  sampleXml,
  samplePayload,
  statusText,
  wait,
} from '../lab/http-lab';

/**
 * HTTP "lab" — stateless httpbin/reqres-style utilities mounted at `/api/lab`.
 * These have no petstore coupling; they exist purely to widen the set of
 * HTTP-mechanics scenarios QA can automate.
 */
export const labApiRouter = Router();

// --- Request reflection ----------------------------------------------------

labApiRouter.all('/anything', (request: Request, response: Response) => {
  response.json(buildAnythingResponse(request));
});

labApiRouter.get('/headers', (request: Request, response: Response) => {
  response.json({ headers: buildAnythingResponse(request).headers });
});

labApiRouter.get('/ip', (request: Request, response: Response) => {
  response.json({ ip: request.ip ?? 'unknown' });
});

labApiRouter.get('/user-agent', (request: Request, response: Response) => {
  response.json({ 'user-agent': request.headers['user-agent'] ?? null });
});

labApiRouter.get('/uuid', (_request: Request, response: Response) => {
  response.json({ uuid: randomUUID() });
});

// --- Status codes ----------------------------------------------------------

labApiRouter.all('/status/:code', (request: Request, response: Response) => {
  const code = clampStatusCode(request.params.code);
  if (code === 204 || code === 304) {
    response.status(code).end();
    return;
  }
  response.status(code).json({ status: code, statusText: statusText(code) });
});

// --- Latency ---------------------------------------------------------------

labApiRouter.get('/delay/:seconds', async (request: Request, response: Response) => {
  const seconds = clampDelaySeconds(request.params.seconds);
  await wait(seconds * 1000);
  response.json({ delayedSeconds: seconds });
});

// --- Redirects -------------------------------------------------------------

labApiRouter.get('/redirect/:n', (request: Request, response: Response) => {
  const remaining = Math.max(0, Math.min(10, Math.floor(Number(request.params.n) || 0)));
  if (remaining <= 1) {
    response.redirect(302, '/api/lab/anything');
    return;
  }
  response.redirect(302, `/api/lab/redirect/${remaining - 1}`);
});

// --- Auth schemes ----------------------------------------------------------

labApiRouter.get('/basic-auth/:user/:pass', (request: Request, response: Response) => {
  const credentials = parseBasicAuth(request.headers.authorization);
  if (!credentials || credentials.user !== request.params.user || credentials.pass !== request.params.pass) {
    response.setHeader('WWW-Authenticate', 'Basic realm="qa-lab"');
    response.status(401).json({ authenticated: false });
    return;
  }
  response.json({ authenticated: true, user: credentials.user });
});

labApiRouter.get('/bearer', (request: Request, response: Response) => {
  const token = parseBearerToken(request.headers.authorization);
  if (!token) {
    response.setHeader('WWW-Authenticate', 'Bearer');
    response.status(401).json({ authenticated: false });
    return;
  }
  response.json({ authenticated: true, token });
});

// --- Cookies ---------------------------------------------------------------

labApiRouter.get('/cookies', (request: Request, response: Response) => {
  response.json({ cookies: parseCookieHeader(request.headers.cookie) });
});

labApiRouter.get('/cookies/set', (request: Request, response: Response) => {
  const name = String(request.query.name ?? '').trim();
  const value = String(request.query.value ?? '');
  if (!name) {
    response.status(400).json({ message: 'name query parameter is required' });
    return;
  }
  response.setHeader('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`);
  response.json({ set: { [name]: value } });
});

labApiRouter.get('/cookies/delete', (request: Request, response: Response) => {
  const name = String(request.query.name ?? '').trim();
  if (!name) {
    response.status(400).json({ message: 'name query parameter is required' });
    return;
  }
  response.setHeader('Set-Cookie', `${name}=; Path=/; SameSite=Lax; Max-Age=0`);
  response.json({ deleted: name });
});

// --- Encoding --------------------------------------------------------------

labApiRouter.get('/base64/encode', (request: Request, response: Response) => {
  const value = String(request.query.value ?? '');
  response.json({ value, encoded: encodeBase64(value) });
});

labApiRouter.get('/base64/decode', (request: Request, response: Response) => {
  const value = String(request.query.value ?? '');
  const result = decodeBase64(value);
  if (!result.ok) {
    response.status(400).json({ message: 'value is not valid base64' });
    return;
  }
  response.json({ value, decoded: result.decoded });
});

// --- Caching ---------------------------------------------------------------

labApiRouter.get('/cache', (request: Request, response: Response) => {
  const payload = samplePayload();
  const etag = computeEtag(payload);
  response.setHeader('ETag', etag);
  response.setHeader('Cache-Control', 'public, max-age=60');
  if (request.headers['if-none-match'] === etag) {
    response.status(304).end();
    return;
  }
  response.json(payload);
});

// --- Compression -----------------------------------------------------------

labApiRouter.get('/gzip', (_request: Request, response: Response) => {
  const body = gzipSync(Buffer.from(JSON.stringify({ ...samplePayload(), gzipped: true }), 'utf8'));
  response.setHeader('Content-Encoding', 'gzip');
  response.setHeader('Content-Type', 'application/json');
  response.send(body);
});

// --- Content negotiation ---------------------------------------------------

labApiRouter.get('/json', (_request: Request, response: Response) => {
  response.json(samplePayload());
});

labApiRouter.get('/xml', (_request: Request, response: Response) => {
  response.type('application/xml').send(sampleXml(samplePayload()));
});

labApiRouter.get('/html', (_request: Request, response: Response) => {
  const payload = samplePayload();
  response
    .type('text/html')
    .send(`<!doctype html><html lang="en"><body><h1 data-test="lab-html-title">${payload.title}</h1></body></html>`);
});
