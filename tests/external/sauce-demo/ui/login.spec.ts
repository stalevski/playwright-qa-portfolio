import { test, expect } from '@sauce-demo-fixtures';
import { sauceDemoPassword, sauceDemoUsers } from '@helpers/test-data';

test.describe('Sauce Demo - Login', () => {
  // The login describe verifies the login flow itself, so each test must start logged out.
  // This overrides the project-level `storageState` set by `playwright.config.ts`.
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'logs in successfully with the standard user',
    { tag: ['@smoke', '@critical'] },
    async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.assertLoaded();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();
      expect(await sauceDemoInventoryPage.getItemCount()).toBeGreaterThan(0);
    },
  );

  test('shows an error for a locked out user', async ({ sauceDemoLoginPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(sauceDemoUsers.lockedOut, sauceDemoPassword);
    await sauceDemoLoginPage.assertErrorContains('Sorry, this user has been locked out.');
  });

  test('shows an error for invalid credentials', async ({ sauceDemoLoginPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login('unknown_user', 'wrong_password');
    await sauceDemoLoginPage.assertErrorContains('Username and password do not match any user in this service');
  });

  test('requires username when password is empty', async ({ sauceDemoLoginPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login('', '');
    await sauceDemoLoginPage.assertErrorContains('Username is required');
  });

  test('requires password when username is filled', async ({ sauceDemoLoginPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(sauceDemoUsers.standard, '');
    await sauceDemoLoginPage.assertErrorContains('Password is required');
  });

  test('problem_user still reaches the inventory page', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(sauceDemoUsers.problem, sauceDemoPassword);
    await sauceDemoInventoryPage.assertLoaded();
  });

  test('performance_glitch_user eventually reaches the inventory page', async ({
    sauceDemoLoginPage,
    sauceDemoInventoryPage,
  }) => {
    test.slow();
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(sauceDemoUsers.performanceGlitch, sauceDemoPassword);
    await sauceDemoInventoryPage.assertLoaded();
  });
});
