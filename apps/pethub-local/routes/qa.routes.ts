import { Router, type NextFunction, type Request, type Response } from 'express';
import { createOrderCommand, createPetCommand, deletePetCommand } from '../commands';
import { getEventsQuery, getOrdersQuery, getPetsQuery, getUsersQuery, nextOrderIdQuery } from '../queries';
import {
  authenticate,
  buildOpenApiDocument,
  consumeRateLimit,
  createJob,
  escapeHtml,
  extractBearerToken,
  getIdempotentResponse,
  getVersionInfo,
  issueToken,
  parsePetQuery,
  pollJob,
  queryPets,
  rememberIdempotentResponse,
  renderMetrics,
  validatePetInput,
  verifyToken,
  type PlatformRole,
  type TokenPayload,
} from '../platform';

export const qaRouter = Router();

// ---------------------------------------------------------------------------
// Observability & contract
// ---------------------------------------------------------------------------

qaRouter.get('/ready', async (_request: Request, response: Response) => {
  try {
    await getPetsQuery();
    response.json({ status: 'ready', checks: { database: 'up' } });
  } catch {
    response.status(503).json({ status: 'not-ready', checks: { database: 'down' } });
  }
});

qaRouter.get('/version', (_request: Request, response: Response) => {
  response.json(getVersionInfo());
});

qaRouter.get('/metrics', async (_request: Request, response: Response) => {
  const [pets, users, orders, events] = await Promise.all([
    getPetsQuery(),
    getUsersQuery(),
    getOrdersQuery(),
    getEventsQuery(),
  ]);
  response
    .type('text/plain; version=0.0.4')
    .send(renderMetrics({ pets: pets.length, users: users.length, orders: orders.length, events: events.length }));
});

qaRouter.get('/openapi.json', (_request: Request, response: Response) => {
  response.json(buildOpenApiDocument());
});

// ---------------------------------------------------------------------------
// Authentication & RBAC
// ---------------------------------------------------------------------------

qaRouter.post('/auth/login', (request: Request, response: Response) => {
  const username = String(request.body?.username ?? '');
  const password = String(request.body?.password ?? '');
  const user = authenticate(username, password);
  if (!user) {
    response.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  response.json(issueToken(user));
});

type AuthedRequest = Request & { auth?: TokenPayload };

const requireAuth =
  (roles?: PlatformRole[]) =>
  (request: AuthedRequest, response: Response, next: NextFunction): void => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      response.status(401).json({ message: 'Missing bearer token' });
      return;
    }
    const verification = verifyToken(token);
    if (!verification.ok) {
      response.status(401).json({ message: `Invalid token: ${verification.reason}` });
      return;
    }
    if (roles && !roles.includes(verification.payload.role)) {
      response.status(403).json({ message: `Requires role: ${roles.join(' or ')}` });
      return;
    }
    request.auth = verification.payload;
    next();
  };

qaRouter.get('/auth/me', requireAuth(), (request: AuthedRequest, response: Response) => {
  response.json({ username: request.auth!.sub, role: request.auth!.role, expiresAt: request.auth!.exp });
});

// ---------------------------------------------------------------------------
// v2 pets: pagination / filter / sort / search + strict validation
// ---------------------------------------------------------------------------

qaRouter.get('/v2/pets', async (request: Request, response: Response) => {
  const pets = await getPetsQuery();
  const options = parsePetQuery(request.query as Record<string, unknown>);
  response.json(queryPets(pets, options));
});

qaRouter.post('/v2/pets', async (request: Request, response: Response) => {
  const validation = validatePetInput(request.body ?? {});
  if (!validation.valid) {
    response.status(422).json({ message: 'Validation failed', errors: validation.errors });
    return;
  }

  const pets = await getPetsQuery();
  const nextId = pets.reduce((max, pet) => Math.max(max, pet.id), 0) + 1;
  const created = await createPetCommand({
    id: nextId,
    name: String(request.body.name),
    category: String(request.body.category),
    status: request.body.status,
    price: Number(request.body.price),
    notes: request.body.notes ? String(request.body.notes) : '',
    photoUrls: Array.isArray(request.body.photoUrls) ? request.body.photoUrls.map(String) : [],
    tags: Array.isArray(request.body.tags) ? request.body.tags : [],
  });
  response.status(201).json(created);
});

qaRouter.delete('/v2/pets/:id', requireAuth(['admin']), async (request: Request, response: Response) => {
  const deleted = await deletePetCommand(Number(request.params.id));
  response.status(deleted ? 204 : 404).send();
});

// ---------------------------------------------------------------------------
// v2 orders: idempotent creation
// ---------------------------------------------------------------------------

qaRouter.post('/v2/orders', async (request: Request, response: Response) => {
  const idempotencyKey = request.headers['idempotency-key'];
  const key = typeof idempotencyKey === 'string' && idempotencyKey.trim() ? idempotencyKey.trim() : undefined;

  if (key) {
    const replayed = getIdempotentResponse<{ id: number; petId: number; userId: number }>(key);
    if (replayed) {
      response.status(200).json({ ...replayed, idempotentReplay: true });
      return;
    }
  }

  const id = await nextOrderIdQuery();
  const order = await createOrderCommand({
    id,
    petId: Number(request.body.petId),
    userId: Number(request.body.userId),
    quantity: Number(request.body.quantity ?? 1),
    status: request.body.status ?? 'placed',
    totalAmount: Number(request.body.totalAmount ?? 0),
  });

  if (key) {
    rememberIdempotentResponse(key, order);
  }
  response.status(201).json({ ...order, idempotentReplay: false });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

qaRouter.get('/v2/rate-limited', (request: Request, response: Response) => {
  const clientId = String(request.headers['x-client-id'] ?? request.ip ?? 'anonymous');
  const decision = consumeRateLimit(clientId);
  response.setHeader('X-RateLimit-Limit', String(decision.limit));
  response.setHeader('X-RateLimit-Remaining', String(decision.remaining));
  if (!decision.allowed) {
    response.setHeader('Retry-After', String(decision.resetSeconds));
    response.status(429).json({ message: 'Too many requests', retryAfter: decision.resetSeconds });
    return;
  }
  response.json({ ok: true, remaining: decision.remaining });
});

// ---------------------------------------------------------------------------
// Security sandbox: reflected input is HTML-escaped
// ---------------------------------------------------------------------------

qaRouter.get('/v2/echo', (request: Request, response: Response) => {
  const raw = String(request.query.q ?? '');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.json({ raw, escaped: escapeHtml(raw) });
});

// ---------------------------------------------------------------------------
// Asynchronous jobs (poll-driven, deterministic)
// ---------------------------------------------------------------------------

qaRouter.post('/jobs', (request: Request, response: Response) => {
  const type = String(request.body?.type ?? 'inventory-report');
  const job = createJob(type);
  response.status(202).json({ jobId: job.id, status: job.status, type: job.type });
});

qaRouter.get('/jobs/:id', async (request: Request, response: Response) => {
  const job = pollJob(String(request.params.id), () => ({ generatedAt: new Date().toISOString(), records: 0 }));
  if (!job) {
    response.status(404).json({ message: 'Job not found' });
    return;
  }
  response.json({
    jobId: job.id,
    type: job.type,
    status: job.status,
    pollCount: job.pollCount,
    result: job.result ?? null,
  });
});
