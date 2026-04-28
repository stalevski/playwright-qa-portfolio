import { test, expect } from '@sauce-demo-fixtures';

test.describe('Sauce Demo - Session protection', () => {
  // Asserts that direct navigation without a session does NOT show inventory.
  // Must start logged out, so override the project-level `storageState`.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('blocks direct access to /inventory.html without a session', async ({ page, sauceDemoInventoryPage }) => {
    await page.goto('/inventory.html');
    await expect(sauceDemoInventoryPage.inventoryContainer).toBeHidden();
  });
});
