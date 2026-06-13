import { test, expect } from '@pethub-local-fixtures';

/**
 * Verifies the shared app switcher makes every primary surface mutually
 * reachable. Each surface links to all others (via stable `app-nav-<id>`
 * hooks) and never to itself, and the Storefront ↔ Test Lab round-trip works.
 */
const surfaces = [
  { name: 'admin', path: '/', self: 'admin' },
  { name: 'storefront', path: '/shop', self: 'shop' },
  { name: 'operations', path: '/ops', self: 'ops' },
  { name: 'clinic', path: '/clinic', self: 'clinic' },
  { name: 'test lab', path: '/lab', self: 'lab' },
] as const;

const allIds = ['admin', 'shop', 'ops', 'clinic', 'lab'] as const;

test.describe('Cross-app navigation', () => {
  for (const surface of surfaces) {
    test(`${surface.name} links to every other surface`, async ({ page }) => {
      await page.goto(surface.path);
      const others = allIds.filter((id) => id !== surface.self);
      for (const id of others) {
        await expect(page.getByTestId(`app-nav-${id}`).first()).toBeVisible();
      }
      await expect(page.getByTestId(`app-nav-${surface.self}`)).toHaveCount(0);
    });
  }

  test('reaches the Test Lab from the storefront and back', { tag: ['@smoke'] }, async ({ page }) => {
    await page.goto('/shop');
    await page.getByTestId('app-nav-lab').click();
    await expect(page).toHaveURL(/\/lab$/);
    await page.getByTestId('app-nav-shop').click();
    await expect(page).toHaveURL(/\/shop$/);
  });
});
