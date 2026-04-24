import { test, expect } from '@pethub-local-fixtures';

test.describe('PetHub Storefront UI', () => {
  const standardUser = 'standard_user';
  const lockedOutUser = 'locked_out_user';
  const password = 'secret_sauce';

  test('rejects login with empty credentials', async ({ storefrontLoginPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.assertLoaded();
    await storefrontLoginPage.login('', '');
    await storefrontLoginPage.assertErrorContains('Username is required');
  });

  test('rejects login for a locked out user', async ({ storefrontLoginPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(lockedOutUser, password);
    await storefrontLoginPage.assertErrorContains('this user has been locked out');
  });

  test('rejects unknown username/password combinations', async ({ storefrontLoginPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, 'wrong_password');
    await storefrontLoginPage.assertErrorContains('do not match any user');
  });

  test('logs in a standard user and lists available inventory', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.assertLoaded();
    expect(await storefrontInventoryPage.getItemCount()).toBeGreaterThan(0);
  });

  test('sorts inventory by name A to Z', async ({ storefrontLoginPage, storefrontInventoryPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.sortBy('az');
    const names = await storefrontInventoryPage.getItemNames();
    const expected = [...names].sort((left, right) => left.localeCompare(right));
    expect(names).toEqual(expected);
  });

  test('sorts inventory by price low to high', async ({ storefrontLoginPage, storefrontInventoryPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.sortBy('lohi');
    const prices = await storefrontInventoryPage.getPrices();
    const sorted = [...prices].sort((left, right) => left - right);
    expect(prices).toEqual(sorted);
  });

  test('adds an item to the cart and shows the cart badge', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.addItemToCart(firstItem);
    await storefrontInventoryPage.assertCartBadgeCount(1);
  });

  test('opens item details from the inventory and allows returning back', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontItemDetailsPage,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.openItemDetails(firstItem);
    await storefrontItemDetailsPage.assertLoaded(firstItem);
    await storefrontItemDetailsPage.goBackToInventory();
    await storefrontInventoryPage.assertLoaded();
  });

  test('blocks checkout when required information is missing', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCartPage,
    storefrontCheckoutPage,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.addItemToCart(firstItem);
    await storefrontInventoryPage.openCart();
    await storefrontCartPage.proceedToCheckout();
    await storefrontCheckoutPage.assertLoaded();
    await storefrontCheckoutPage.submit();
    await storefrontCheckoutPage.assertErrorContains('First Name is required');
  });

  test('completes a checkout flow and records a new order', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCartPage,
    storefrontCheckoutPage,
    storefrontCompletePage,
    localHomePage,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.addItemToCart(firstItem);
    await storefrontInventoryPage.openCart();
    await storefrontCartPage.proceedToCheckout();
    await storefrontCheckoutPage.fillInformation({
      firstName: 'Pat',
      lastName: 'Shopper',
      postalCode: '1000',
    });
    await storefrontCheckoutPage.submit();
    await storefrontCompletePage.assertLoaded();
    const orderId = await storefrontCompletePage.getOrderId();
    expect(orderId).toBeGreaterThan(0);
    await localHomePage.goto();
    await localHomePage.assertOrderRelationVisible(String(orderId));
  });
});
