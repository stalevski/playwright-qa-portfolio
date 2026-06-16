import { test, expect } from '@pethub-local-fixtures';

/**
 * Exercises the HTTP "lab" utilities at `/api/lab`. Each describe block targets
 * a distinct HTTP-mechanics concern QA commonly automates: request reflection,
 * status codes, latency, redirects, auth schemes, cookies, encoding, caching,
 * compression, and content negotiation. No petstore domain coupling.
 */
test.describe('Local HTTP lab utilities', () => {
  test.describe('Request reflection', () => {
    test('echoes method, body, query and headers', { tag: ['@smoke'] }, async ({ localLabApiClient }) => {
      const response = await localLabApiClient.anything('post', { hello: 'world' });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.method).toBe('POST');
      expect(body.body).toMatchObject({ hello: 'world' });
      expect(body.headers).toHaveProperty('content-type');
    });

    test('returns request headers', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.getHeaders({ 'X-Custom-Header': 'qa-lab' });

      expect(response.status()).toBe(200);
      expect((await response.json()).headers['x-custom-header']).toBe('qa-lab');
    });

    test('generates a unique uuid each call', async ({ localLabApiClient }) => {
      const first = await localLabApiClient.uuid();
      const second = await localLabApiClient.uuid();

      expect(first.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(first.uuid).not.toBe(second.uuid);
    });
  });

  test.describe('Status codes', () => {
    for (const code of [200, 201, 400, 404, 418, 500] as const) {
      test(`returns ${code} on demand`, async ({ localLabApiClient }) => {
        const response = await localLabApiClient.status(code);
        expect(response.status()).toBe(code);
      });
    }

    test('clamps an invalid status code to 400', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.status(999);
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Latency', () => {
    test('delays the response by the requested seconds', async ({ localLabApiClient }) => {
      const start = Date.now();
      const response = await localLabApiClient.delay(1);

      expect(response.status()).toBe(200);
      expect(Date.now() - start).toBeGreaterThanOrEqual(900);
      expect((await response.json()).delayedSeconds).toBe(1);
    });
  });

  test.describe('Redirects', () => {
    test('follows a redirect chain to the final resource', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.redirect(3);

      expect(response.status()).toBe(200);
      expect(response.url()).toContain('/api/lab/anything');
    });

    test('returns a 302 with Location when not followed', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.redirect(3, 0);

      expect(response.status()).toBe(302);
      expect(response.headers().location).toContain('/api/lab/redirect/2');
    });
  });

  test.describe('Auth schemes', () => {
    test('challenges basic auth without credentials (401)', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.basicAuth('qa', 'secret');

      expect(response.status()).toBe(401);
      expect(response.headers()['www-authenticate']).toContain('Basic');
    });

    test('accepts matching basic auth credentials', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.basicAuth('qa', 'secret', { user: 'qa', pass: 'secret' });

      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ authenticated: true, user: 'qa' });
    });

    test('rejects a missing bearer token (401)', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.bearer();
      expect(response.status()).toBe(401);
    });

    test('echoes a provided bearer token', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.bearer('token-123');

      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ authenticated: true, token: 'token-123' });
    });
  });

  test.describe('Cookies', () => {
    test('reflects cookies sent on the request', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.getCookies('session=abc; theme=dark');

      expect(await response.json()).toMatchObject({ cookies: { session: 'abc', theme: 'dark' } });
    });

    test('sets a cookie via Set-Cookie', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.setCookie('flavor', 'vanilla');

      expect(response.status()).toBe(200);
      expect(response.headers()['set-cookie']).toContain('flavor=vanilla');
    });
  });

  test.describe('Encoding', () => {
    test('encodes a value to base64', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.base64Encode('qa-lab');

      expect((await response.json()).encoded).toBe('cWEtbGFi');
    });

    test('decodes a base64 value', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.base64Decode('cWEtbGFi');

      expect((await response.json()).decoded).toBe('qa-lab');
    });

    test('rejects an invalid base64 value (400)', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.base64Decode('not valid base64!!');

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Caching', () => {
    test('returns 200 with an ETag, then 304 when revalidated', async ({ localLabApiClient }) => {
      const first = await localLabApiClient.cache();
      expect(first.status()).toBe(200);
      const etag = first.headers().etag;
      expect(etag).toBeTruthy();

      const second = await localLabApiClient.cache(etag);
      expect(second.status()).toBe(304);
    });
  });

  test.describe('Compression', () => {
    test('serves a gzip-encoded JSON body', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.gzip();

      expect(response.status()).toBe(200);
      // Playwright transparently decompresses; assert the decoded payload.
      expect(await response.json()).toMatchObject({ gzipped: true });
    });
  });

  test.describe('Content negotiation', () => {
    test('serves JSON', async ({ localLabApiClient }) => {
      const payload = await localLabApiClient.json();
      expect(payload).toMatchObject({ id: 1, active: true });
    });

    test('serves XML', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.xml();

      expect(response.headers()['content-type']).toContain('application/xml');
      expect(await response.text()).toContain('<title>QA Lab sample</title>');
    });

    test('serves HTML', async ({ localLabApiClient }) => {
      const response = await localLabApiClient.html();

      expect(response.headers()['content-type']).toContain('text/html');
      expect(await response.text()).toContain('data-test="lab-html-title"');
    });
  });
});
