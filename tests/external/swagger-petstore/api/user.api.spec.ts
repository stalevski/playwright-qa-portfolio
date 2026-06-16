import { test, expect } from '@swagger-petstore-fixtures';
import { createUserDto } from '@helpers/test-data';

test.describe('Petstore API - User endpoints', () => {
  test('creates users with array input', async ({ apiClient }) => {
    const users = [createUserDto(), createUserDto()];
    users[1].username = `${users[1].username}-array`;
    users[1].email = `${users[1].username}@example.com`;

    const response = await apiClient.createUsersWithArray(users);

    expect(response.message).toContain('ok');
  });

  test('creates users with list input', async ({ apiClient }) => {
    const users = [createUserDto(), createUserDto()];
    users[1].username = `${users[1].username}-list`;
    users[1].email = `${users[1].username}@example.com`;

    const response = await apiClient.createUsersWithList(users);

    expect(response.message).toContain('ok');
  });

  test('gets user by user name', async ({ apiClient }) => {
    const user = createUserDto();
    await apiClient.createUser(user);

    const foundUser = await apiClient.getUser(user.username);

    expect(foundUser.username).toBe(user.username);
    expect(foundUser.email).toBe(user.email);
  });

  test('updates user', async ({ apiClient }) => {
    const user = createUserDto();
    await apiClient.createUser(user);

    const updatedUser = {
      ...user,
      firstName: 'Updated',
      lastName: 'User',
    };

    const response = await apiClient.updateUser(user.username, updatedUser);

    expect(response.message).toContain(String(user.id));

    const foundUser = await apiClient.getUser(user.username);
    expect(foundUser.firstName).toBe('Updated');
  });

  test('deletes user', async ({ apiClient }) => {
    const user = createUserDto();
    await apiClient.createUser(user);

    const deleteResponse = await apiClient.deleteUser(user.username);

    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('logs user into the system', { tag: '@smoke' }, async ({ apiClient }) => {
    const user = createUserDto();
    await apiClient.createUser(user);

    const response = await apiClient.loginUser(user.username, user.password);

    expect(response.message).toContain('logged in user session');
  });

  test('creates user', { tag: '@smoke' }, async ({ apiClient }) => {
    const user = createUserDto();

    const response = await apiClient.createUser(user);

    expect(response.message).toContain(String(user.id));
  });

  test('logs out current logged in user session', async ({ apiClient }) => {
    const response = await apiClient.logoutUser();

    expect(response.message).toContain('ok');
  });

  /**
   * Each test below pins a defect documented in `docs/swagger-petstore/bugs.md`.
   * They assert the **current buggy behaviour**, so they pass today and will
   * start failing if the API is ever fixed.
   */
  test.describe('Known defects', () => {
    for (const scenario of [
      { label: 'wrong password', url: (u: string) => `user/login?username=${u}&password=WRONG-${Date.now()}` },
      { label: 'non-existent user', url: () => `user/login?username=ghost-user-${Date.now()}&password=anything` },
      { label: 'empty params', url: () => 'user/login' },
    ] as const) {
      test(`AUTH-2: GET /user/login returns success for ${scenario.label}`, async ({ apiClient, request }) => {
        const user = createUserDto();
        await apiClient.createUser(user);

        const response = await request.get(scenario.url(user.username));
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('logged in user session');
      });
    }

    test('VAL-7: POST /user accepts an empty body', async ({ request }) => {
      const response = await request.post('user', { data: {} });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.code).toBe(200);
      // The "message" field is repurposed as the new user id (see DATA-4); for
      // an empty body it is the literal string "0".
      expect(body.message).toBe('0');
    });

    test('VAL-7: POST /user silently overwrites a duplicate username', async ({ apiClient, request }) => {
      const user = createUserDto();
      await apiClient.createUser(user);

      const response = await request.post('user', { data: { ...user, firstName: 'Duplicate' } });
      expect(response.status()).toBe(200);

      const fetched = await apiClient.getUser(user.username);
      expect(fetched.firstName).toBe('Duplicate');
    });

    test('VAL-7: POST /user accepts special characters (slash / asterisk / exclamation) in username', async ({
      request,
    }) => {
      const specialUsername = `diag user/with*chars!${Date.now()}`;
      const userBody = {
        id: Math.floor(Math.random() * 10_000_000),
        username: specialUsername,
        firstName: 'Diag',
        lastName: 'Nostic',
        email: `${specialUsername}@example.com`,
        password: 'secret',
        phone: '555-0100',
        userStatus: 1,
      };
      const postResponse = await request.post('user', { data: userBody });
      expect(postResponse.status()).toBe(200);

      const getResponse = await request.get(`user/${encodeURIComponent(specialUsername)}`);
      expect(getResponse.status()).toBe(200);
      const fetched = await getResponse.json();
      expect(fetched.username).toBe(specialUsername);

      await request.delete(`user/${encodeURIComponent(specialUsername)}`);
    });

    test('VAL-8: POST /user/createWithArray accepts an empty array', async ({ request }) => {
      const response = await request.post('user/createWithArray', { data: [] });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.message).toContain('ok');
    });

    test('VAL-8: POST /user/createWithList accepts an empty array', async ({ request }) => {
      const response = await request.post('user/createWithList', { data: [] });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.message).toContain('ok');
    });

    test('SEM-2: PUT /user/{nonexistent} silently creates the user (upsert)', async ({ request }) => {
      const orphanUsername = `orphan_user_${Date.now()}_${Math.floor(Math.random() * 10_000)}`;
      const orphanBody = {
        id: Math.floor(Math.random() * 10_000_000),
        username: orphanUsername,
        firstName: 'Orphan',
        lastName: 'Upserted',
        email: `${orphanUsername}@example.com`,
        password: 'secret',
        phone: '555-0100',
        userStatus: 1,
      };

      const putResponse = await request.put(`user/${orphanUsername}`, { data: orphanBody });
      expect(putResponse.status()).toBe(200);

      const getResponse = await request.get(`user/${orphanUsername}`);
      expect(getResponse.status()).toBe(200);
      const body = await getResponse.json();
      expect(body.username).toBe(orphanUsername);
      expect(body.firstName).toBe('Orphan');

      await request.delete(`user/${orphanUsername}`);
    });

    test('SEM-3: DELETE /user/{username} second call is non-deterministic (200 or 404)', async ({
      apiClient,
      request,
    }) => {
      const user = createUserDto();
      await apiClient.createUser(user);

      const first = await request.delete(`user/${user.username}`);
      expect(first.status()).toBe(200);

      // Non-deterministic: the diagnostic captured 200 (the buggy outcome — NOT
      // idempotent), but the API sometimes returns 404 (correct REST). Either is
      // permitted by the current implementation; the inconsistency itself is the
      // defect because clients cannot rely on the contract.
      const second = await request.delete(`user/${user.username}`);
      expect([200, 404]).toContain(second.status());
    });

    test('DATA-4: POST /user returns the new user id encoded as a string in the message field', async ({ request }) => {
      const username = `data4_${Date.now()}_${Math.floor(Math.random() * 10_000)}`;
      const userBody = {
        id: Math.floor(Math.random() * 10_000_000),
        username,
        firstName: 'Diag',
        lastName: 'Nostic',
        email: `${username}@example.com`,
        password: 'secret',
        phone: '555-0100',
        userStatus: 1,
      };
      const response = await request.post('user', { data: userBody });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ code: 200, type: 'unknown' });
      // The auto-assigned id is exposed as a numeric string in `message`.
      expect(body.message).toMatch(/^\d+$/);

      await request.delete(`user/${username}`);
    });
  });
});
