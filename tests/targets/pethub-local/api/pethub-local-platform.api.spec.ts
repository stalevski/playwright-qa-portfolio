import { test, expect } from '@pethub-local-fixtures';
import { RandomDataGenerator } from '@helpers/random-data-generator';
import type {
  AuthTokenDto,
  JobAcceptedDto,
  JobStateDto,
  PaginatedPetsDto,
  ValidationFailureDto,
} from '@helpers/api-clients/pethub-local-platform.client';

/**
 * Exercises the PetHub Local "platform" testing surfaces. Each describe block
 * targets a distinct *type* of API testing: contract/observability, auth & RBAC,
 * input validation, pagination/filter/sort/search, idempotency, rate limiting,
 * security, and asynchronous job polling.
 */
test.describe('Local Petstore platform surfaces', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Observability & contract', () => {
    test('exposes version metadata', { tag: ['@smoke'] }, async ({ localPlatformApiClient }) => {
      const version = await localPlatformApiClient.getVersion();

      expect(version.name).toBe('pethub-local');
      expect(version.apiVersions).toContain('v2');
      expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('reports readiness', { tag: ['@smoke'] }, async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.getReady();

      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ status: 'ready', checks: { database: 'up' } });
    });

    test('publishes Prometheus metrics', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.getMetrics();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/plain');
      const body = await response.text();
      expect(body).toContain('# TYPE pethub_pets_total gauge');
      expect(body).toMatch(/pethub_pets_total \d+/);
    });

    test('serves an OpenAPI document', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.getOpenApi();

      expect(response.status()).toBe(200);
      const doc = (await response.json()) as { openapi: string; paths: Record<string, unknown> };
      expect(doc.openapi).toBe('3.0.3');
      expect(doc.paths['/v2/pets']).toBeDefined();
      expect(doc.paths['/auth/login']).toBeDefined();
    });
  });

  test.describe('Authentication & RBAC', () => {
    test('issues a bearer token for valid credentials', { tag: ['@critical'] }, async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.login('admin', 'Admin#12345');

      expect(response.status()).toBe(200);
      const token = (await response.json()) as AuthTokenDto;
      expect(token.tokenType).toBe('Bearer');
      expect(token.role).toBe('admin');
      expect(token.accessToken.split('.')).toHaveLength(3);
    });

    test('rejects invalid credentials with 401', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.login('admin', 'wrong-password');

      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ message: 'Invalid credentials' });
    });

    test('protects /auth/me without a token (401)', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.me(undefined);

      expect(response.status()).toBe(401);
    });

    test('rejects a tampered token (401)', async ({ localPlatformApiClient }) => {
      const token = await localPlatformApiClient.loginAs('viewer', 'Viewer#12345');
      const response = await localPlatformApiClient.me(`${token.accessToken}tampered`);

      expect(response.status()).toBe(401);
    });

    test('returns identity for a valid token', async ({ localPlatformApiClient }) => {
      const token = await localPlatformApiClient.loginAs('editor', 'Editor#12345');
      const identity = await localPlatformApiClient.identity(token.accessToken);

      expect(identity.username).toBe('editor');
      expect(identity.role).toBe('editor');
    });

    test('forbids a non-admin from deleting a pet (403)', async ({ localApiClient, localPlatformApiClient }) => {
      const pet = RandomDataGenerator.createLocalPet({ status: 'available' });
      await localApiClient.createPet(pet);
      const viewer = await localPlatformApiClient.loginAs('viewer', 'Viewer#12345');

      const response = await localPlatformApiClient.deletePetV2(pet.id, viewer.accessToken);

      expect(response.status()).toBe(403);
    });

    test('allows an admin to delete a pet (204)', async ({ localApiClient, localPlatformApiClient }) => {
      const pet = RandomDataGenerator.createLocalPet({ status: 'available' });
      await localApiClient.createPet(pet);
      const admin = await localPlatformApiClient.loginAs('admin', 'Admin#12345');

      const response = await localPlatformApiClient.deletePetV2(pet.id, admin.accessToken);

      expect(response.status()).toBe(204);
    });

    test('rejects an unauthenticated delete (401)', async ({ localApiClient, localPlatformApiClient }) => {
      const pet = RandomDataGenerator.createLocalPet({ status: 'available' });
      await localApiClient.createPet(pet);

      const response = await localPlatformApiClient.deletePetV2(pet.id, undefined);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Input validation (negative testing)', () => {
    test('rejects an empty payload with 422 and field errors', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.createPetV2({});

      expect(response.status()).toBe(422);
      const body = (await response.json()) as ValidationFailureDto;
      const fields = body.errors.map((error) => error.field);
      expect(fields).toEqual(expect.arrayContaining(['name', 'category', 'status', 'price']));
      expect(body.errors.every((error) => error.code === 'required')).toBeTruthy();
    });

    test('rejects an invalid status enum value', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.createPetV2({
        name: 'Rex',
        category: 'Dogs',
        status: 'flying',
        price: 10,
      });

      expect(response.status()).toBe(422);
      const body = (await response.json()) as ValidationFailureDto;
      expect(body.errors).toContainEqual(expect.objectContaining({ field: 'status', code: 'enum' }));
    });

    test('rejects a negative price (boundary)', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.createPetV2({
        name: 'Rex',
        category: 'Dogs',
        status: 'available',
        price: -1,
      });

      expect(response.status()).toBe(422);
      const body = (await response.json()) as ValidationFailureDto;
      expect(body.errors).toContainEqual(expect.objectContaining({ field: 'price', code: 'min' }));
    });

    test('accepts a valid payload with 201', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.createPetV2({
        name: `Valid-${Date.now()}`,
        category: 'Dogs',
        status: 'available',
        price: 199,
      });

      expect(response.status()).toBe(201);
      expect((await response.json()).id).toBeGreaterThan(0);
    });
  });

  test.describe('Pagination, filtering, sorting & search', () => {
    test('returns a paginated envelope with metadata', async ({ localPlatformApiClient }) => {
      const page1 = await localPlatformApiClient.listPets({ page: 1, limit: 5 });

      expect(page1.data.length).toBeLessThanOrEqual(5);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.limit).toBe(5);
      expect(page1.pagination.total).toBeGreaterThanOrEqual(page1.data.length);
      expect(page1.pagination.hasPrev).toBe(false);
    });

    test('paginates without overlap between pages', async ({ localPlatformApiClient }) => {
      const page1 = await localPlatformApiClient.listPets({ page: 1, limit: 3, sort: 'id', order: 'asc' });
      const page2 = await localPlatformApiClient.listPets({ page: 2, limit: 3, sort: 'id', order: 'asc' });

      const overlap = page1.data.filter((pet) => page2.data.some((other) => other.id === pet.id));
      expect(overlap).toHaveLength(0);
    });

    test('sorts by price ascending', async ({ localPlatformApiClient }) => {
      const result = await localPlatformApiClient.listPets({ sort: 'price', order: 'asc', limit: 100 });
      const prices = result.data.map((pet) => pet.price);
      const sorted = [...prices].sort((a, b) => a - b);

      expect(prices).toEqual(sorted);
    });

    test('filters by status', async ({ localPlatformApiClient }) => {
      const result = await localPlatformApiClient.listPets({ status: 'available', limit: 100 });

      expect(result.data.every((pet) => pet.status === 'available')).toBeTruthy();
    });

    test('searches by name fragment', async ({ localApiClient, localPlatformApiClient }) => {
      const pet = RandomDataGenerator.createLocalPet({ status: 'available' });
      pet.name = `Zinzanthorpe-${Date.now()}`;
      await localApiClient.createPet(pet);

      const result: PaginatedPetsDto = await localPlatformApiClient.listPets({ q: 'Zinzanthorpe', limit: 100 });

      expect(result.data.some((candidate) => candidate.id === pet.id)).toBeTruthy();
    });
  });

  test.describe('Idempotency', () => {
    test('replays the same order for a repeated Idempotency-Key', async ({
      localApiClient,
      localPlatformApiClient,
    }) => {
      const pet = RandomDataGenerator.createLocalPet({ status: 'available' });
      const user = RandomDataGenerator.createLocalUser({ role: 'customer' });
      await localApiClient.createPet(pet);
      await localApiClient.createUser(user);
      const key = `idem-${Date.now()}`;
      const body = { petId: pet.id, userId: user.id, quantity: 1, totalAmount: pet.price };

      const first = await localPlatformApiClient.createOrderV2(body, key);
      const second = await localPlatformApiClient.createOrderV2(body, key);

      expect(first.status()).toBe(201);
      expect(second.status()).toBe(200);
      const firstOrder = await first.json();
      const secondOrder = await second.json();
      expect(secondOrder.id).toBe(firstOrder.id);
      expect(secondOrder.idempotentReplay).toBe(true);
    });

    test('creates distinct orders for different keys', async ({ localApiClient, localPlatformApiClient }) => {
      const pet = RandomDataGenerator.createLocalPet({ status: 'available' });
      const user = RandomDataGenerator.createLocalUser({ role: 'customer' });
      await localApiClient.createPet(pet);
      await localApiClient.createUser(user);
      const body = { petId: pet.id, userId: user.id, quantity: 1, totalAmount: pet.price };

      const first = await localPlatformApiClient.createOrderV2(body, `idem-${Date.now()}-a`);
      const second = await localPlatformApiClient.createOrderV2(body, `idem-${Date.now()}-b`);

      expect((await first.json()).id).not.toBe((await second.json()).id);
    });
  });

  test.describe('Rate limiting', () => {
    test('returns 429 with Retry-After once the window is exhausted', async ({ localPlatformApiClient }) => {
      const clientId = `rl-${Date.now()}`;

      const first = await localPlatformApiClient.rateLimited(clientId);
      const second = await localPlatformApiClient.rateLimited(clientId);
      const third = await localPlatformApiClient.rateLimited(clientId);
      const fourth = await localPlatformApiClient.rateLimited(clientId);

      expect(first.status()).toBe(200);
      expect(second.status()).toBe(200);
      expect(third.status()).toBe(200);
      expect(fourth.status()).toBe(429);
      expect(Number(fourth.headers()['retry-after'])).toBeGreaterThan(0);
    });

    test('isolates buckets per client id', async ({ localPlatformApiClient }) => {
      const other = await localPlatformApiClient.rateLimited(`rl-isolated-${Date.now()}`);

      expect(other.status()).toBe(200);
      expect(other.headers()['x-ratelimit-limit']).toBe('3');
    });
  });

  test.describe('Security sandbox', () => {
    test('HTML-escapes reflected input to prevent XSS', async ({ localPlatformApiClient }) => {
      const payload = '<script>alert(1)</script>';
      const response = await localPlatformApiClient.echo(payload);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.raw).toBe(payload);
      expect(body.escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(body.escaped).not.toContain('<script>');
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
    });
  });

  test.describe('Asynchronous jobs', () => {
    test('progresses queued → running → completed across polls', async ({ localPlatformApiClient }) => {
      const accepted = await localPlatformApiClient.enqueueJob('inventory-report');
      expect(accepted.status()).toBe(202);
      const { jobId, status } = (await accepted.json()) as JobAcceptedDto;
      expect(status).toBe('queued');

      const firstPoll = (await (await localPlatformApiClient.getJob(jobId)).json()) as JobStateDto;
      expect(firstPoll.status).toBe('running');

      const secondPoll = (await (await localPlatformApiClient.getJob(jobId)).json()) as JobStateDto;
      expect(secondPoll.status).toBe('completed');
      expect(secondPoll.result).not.toBeNull();
    });

    test('returns 404 for an unknown job', async ({ localPlatformApiClient }) => {
      const response = await localPlatformApiClient.getJob('job-does-not-exist');

      expect(response.status()).toBe(404);
    });
  });
});
