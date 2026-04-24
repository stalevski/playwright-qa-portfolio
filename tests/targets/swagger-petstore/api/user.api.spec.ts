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

  test('logs user into the system', async ({ apiClient }) => {
    const user = createUserDto();
    await apiClient.createUser(user);

    const response = await apiClient.loginUser(user.username, user.password);

    expect(response.message).toContain('logged in user session');
  });

  test('creates user', async ({ apiClient }) => {
    const user = createUserDto();

    const response = await apiClient.createUser(user);

    expect(response.message).toContain(String(user.id));
  });

  test('logs out current logged in user session', async ({ apiClient }) => {
    const response = await apiClient.logoutUser();

    expect(response.message).toContain('ok');
  });
});
