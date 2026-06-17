import { test, expect } from '@pethub-local-fixtures';
import { pethubLocalPassword, pethubLocalUsers } from '@helpers/test-data';

/**
 * The storefront ships "defect" personas modelled on Sauce Demo so the local
 * app is a faithful, self-hosted target for exploratory + automation practice.
 * These specs pin the *intentional* broken behaviour, so they pass while the
 * defects exist and would start failing if a persona were ever made healthy.
 *
 *   problem_user      - sort never reorders, Birds add-to-cart is a no-op, and
 *                       checkout always fails "Last Name is required".
 *   performance_user  - browsing responses are artificially slowed down.
 *
 * `standard_user` stays the happy path (covered by the other storefront specs);
 * nothing here touches it.
 */
test.describe('PetHub Storefront persona defects', () => {
  const password = pethubLocalPassword;

  test.describe('problem_user', () => {
    test.beforeEach(async ({ storefrontLoginPage, storefrontInventoryPage }) => {
      await storefrontLoginPage.goto();
      await storefrontLoginPage.login(pethubLocalUsers.problem, password);
      await storefrontInventoryPage.assertLoaded();
    });

    test('the inventory sort control is accepted but never reorders the grid', async ({ storefrontInventoryPage }) => {
      const initialNames = await storefrontInventoryPage.getItemNames();
      const initialPrices = await storefrontInventoryPage.getPrices();
      expect(initialNames.length).toBeGreaterThan(1);
      // Sanity: there is a real order to disturb, so an unchanged result is meaningful.
      expect(initialNames).not.toEqual([...initialNames].reverse());

      await storefrontInventoryPage.sortBy('za');
      expect(await storefrontInventoryPage.getItemNames()).toEqual(initialNames);

      await storefrontInventoryPage.sortBy('hilo');
      expect(await storefrontInventoryPage.getPrices()).toEqual(initialPrices);

      await storefrontInventoryPage.sortBy('lohi');
      expect(await storefrontInventoryPage.getPrices()).toEqual(initialPrices);
    });

    test('adding a Birds listing silently fails while other categories still work', async ({
      storefrontInventoryPage,
    }) => {
      await storefrontInventoryPage.assertCartBadgeCount(0);

      // The success toast still appears, but the Bird never lands in the cart.
      await storefrontInventoryPage.addFirstItemInCategory('Birds');
      await storefrontInventoryPage.assertCartBadgeCount(0);

      // A healthy category proves the no-op is specific to the broken one.
      await storefrontInventoryPage.addFirstItemInCategory('Dogs');
      await storefrontInventoryPage.assertCartBadgeCount(1);
    });

    test('checkout always fails on Last Name even when every field is filled', async ({ storefrontCheckoutPage }) => {
      await storefrontCheckoutPage.goto();
      await storefrontCheckoutPage.assertLoaded();

      await storefrontCheckoutPage.fillInformation({ firstName: 'Pat', lastName: 'Riley', postalCode: '1000' });
      await storefrontCheckoutPage.submit();

      await storefrontCheckoutPage.assertErrorContains('Last Name is required');
    });
  });

  test.describe('performance_user', () => {
    test('browsing the inventory is noticeably slowed down', async ({
      storefrontLoginPage,
      storefrontInventoryPage,
    }) => {
      await storefrontLoginPage.goto();
      await storefrontLoginPage.login(pethubLocalUsers.performance, password);
      await storefrontInventoryPage.assertLoaded();

      const start = Date.now();
      await storefrontInventoryPage.goto();
      await storefrontInventoryPage.assertLoaded();
      const elapsed = Date.now() - start;

      // The server sleeps PERFORMANCE_GLITCH_DELAY_MS (1500ms) before responding,
      // so a fresh inventory load is reliably well above this floor. Only the
      // lower bound is asserted to stay non-flaky under CI jitter.
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });
  });
});
