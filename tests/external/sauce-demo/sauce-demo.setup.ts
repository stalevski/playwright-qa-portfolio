/**
 * Authentication setup for the Sauce Demo target.
 *
 * Runs before any spec in the `sauce-demo-ui-*` projects, logs in once
 * as `standard_user`, and saves the resulting browser state (cookies +
 * localStorage) to disk. Each Sauce Demo UI project then uses that
 * `storageState` so individual tests start already authenticated and
 * skip the redundant login flow.
 *
 * Tests that need a logged-out browser (login flow specs, session-
 * protection specs, multi-user buggy-flow specs) opt out per describe
 * block via:
 *   test.use({ storageState: { cookies: [], origins: [] } });
 *
 * The output file is gitignored.
 */
import { test as setup } from '@playwright/test';
import { sauceDemoPassword, sauceDemoUsers } from '@helpers/test-data';
import { SauceDemoInventoryPage } from '@pages/sauce-demo/inventory.page';
import { SauceDemoLoginPage } from '@pages/sauce-demo/login.page';

const STORAGE_STATE_FILE = 'playwright/.auth/sauce-demo-standard.json';

setup('authenticate as standard_user', async ({ page }) => {
  const loginPage = new SauceDemoLoginPage(page);
  const inventoryPage = new SauceDemoInventoryPage(page);

  await loginPage.goto();
  await loginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
  await inventoryPage.assertLoaded();

  await page.context().storageState({ path: STORAGE_STATE_FILE });
});
