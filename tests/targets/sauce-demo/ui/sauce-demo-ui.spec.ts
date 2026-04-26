import { test, expect } from '@sauce-demo-fixtures';
import { sauceDemoPassword, sauceDemoProducts, sauceDemoUsers } from '@helpers/test-data';

test.describe('Sauce Demo UI', () => {
  test.describe('Login', () => {
    test('logs in successfully with the standard user', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.assertLoaded();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();
      expect(await sauceDemoInventoryPage.getItemCount()).toBeGreaterThan(0);
    });

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

  test.describe('Inventory', () => {
    test('opens product details from inventory', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.assertLoaded(sauceDemoProducts.backpack);
    });

    test('sorts inventory by name A to Z', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('az');
      const names = await sauceDemoInventoryPage.getItemNames();
      const expected = [...names].sort((left, right) => left.localeCompare(right));
      expect(names).toEqual(expected);
    });

    test('sorts inventory by name Z to A', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('za');
      const names = await sauceDemoInventoryPage.getItemNames();
      const expected = [...names].sort((left, right) => right.localeCompare(left));
      expect(names).toEqual(expected);
    });

    test('sorts inventory by price low to high', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('lohi');
      const prices = await sauceDemoInventoryPage.getPrices();
      const expected = [...prices].sort((left, right) => left - right);
      expect(prices).toEqual(expected);
    });

    test('sorts inventory by price high to low', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('hilo');
      const prices = await sauceDemoInventoryPage.getPrices();
      const expected = [...prices].sort((left, right) => right - left);
      expect(prices).toEqual(expected);
    });

    test('adds and removes products from the cart and updates the badge', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.assertCartBadgeCount(2);
      await sauceDemoInventoryPage.removeItemFromCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.removeItemFromCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });
  });

  test.describe('Product details page', () => {
    test('adds the item to the cart from the details page', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.addToCart();
      await sauceDemoProductDetailsPage.backToProducts();
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
    });

    test('removes the item from the cart via the details page', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.removeFromCart();
      await sauceDemoProductDetailsPage.backToProducts();
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });

    test('back-to-products returns to the inventory', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.backToProducts();
      await sauceDemoInventoryPage.assertLoaded();
    });
  });

  test.describe('Cart page', () => {
    test('removes an item from the cart page and clears the badge', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
      await sauceDemoCartPage.removeItem(sauceDemoProducts.backpack);
      expect(await sauceDemoCartPage.getItemCount()).toBe(0);
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });

    test('continue shopping returns to the inventory with the cart intact', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.continueShopping();
      await sauceDemoInventoryPage.assertLoaded();
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
    });
  });

  test.describe('Checkout', () => {
    test('completes checkout for a single item', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
      sauceDemoCheckoutCompletePage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Ivan', 'Stalevski', '1000');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      const itemTotal = await sauceDemoCheckoutOverviewPage.getItemTotal();
      const tax = await sauceDemoCheckoutOverviewPage.getTax();
      const total = await sauceDemoCheckoutOverviewPage.getTotal();
      expect(total).toBeCloseTo(itemTotal + tax, 2);
      await sauceDemoCheckoutOverviewPage.finish();
      await sauceDemoCheckoutCompletePage.assertLoaded();
      await sauceDemoCheckoutCompletePage.backHome();
      await sauceDemoInventoryPage.assertLoaded();
    });

    test('multi-item checkout sums line prices into the item total', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack, sauceDemoProducts.bikeLight]);
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Ivan', 'Stalevski', '1000');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      const lineTotals = await sauceDemoCheckoutOverviewPage.getItemPrices();
      const itemTotal = await sauceDemoCheckoutOverviewPage.getItemTotal();
      const tax = await sauceDemoCheckoutOverviewPage.getTax();
      const total = await sauceDemoCheckoutOverviewPage.getTotal();
      const sumOfLines = lineTotals.reduce((sum, value) => sum + value, 0);
      expect(lineTotals).toHaveLength(2);
      expect(itemTotal).toBeCloseTo(sumOfLines, 2);
      expect(total).toBeCloseTo(itemTotal + tax, 2);
    });

    for (const scenario of [
      { firstName: '', lastName: '', postalCode: '', error: 'First Name is required' },
      { firstName: 'Ivan', lastName: '', postalCode: '', error: 'Last Name is required' },
      { firstName: 'Ivan', lastName: 'Stalevski', postalCode: '', error: 'Postal Code is required' },
    ]) {
      test(`checkout information requires ${scenario.error.replace(' is required', '')}`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
        sauceDemoCartPage,
        sauceDemoCheckoutInformationPage,
      }) => {
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
        await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
        await sauceDemoInventoryPage.openCart();
        await sauceDemoCartPage.checkout();
        await sauceDemoCheckoutInformationPage.fillInformation(
          scenario.firstName,
          scenario.lastName,
          scenario.postalCode,
        );
        await sauceDemoCheckoutInformationPage.continue();
        await sauceDemoCheckoutInformationPage.assertErrorContains(scenario.error);
      });
    }

    test('cancel on information page returns to cart with items intact', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.cancel();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
    });

    test('cancel on overview page returns to the inventory', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Ivan', 'Stalevski', '1000');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      await sauceDemoCheckoutOverviewPage.cancel();
      await sauceDemoInventoryPage.assertLoaded();
    });
  });

  test.describe('Menu', () => {
    test('resets app state from the menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.menu.resetAppState();
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });

    test('logs out from the burger menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.menu.logout();
      await sauceDemoLoginPage.assertLoaded();
    });
  });

  test.describe('Session protection', () => {
    test('blocks direct access to /inventory.html without a session', async ({ page, sauceDemoInventoryPage }) => {
      await page.goto('/inventory.html');
      await expect(sauceDemoInventoryPage.inventoryContainer).toBeHidden();
    });
  });
});
