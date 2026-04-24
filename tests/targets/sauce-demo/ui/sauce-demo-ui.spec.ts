import { test, expect } from '@sauce-demo-fixtures';

test.describe('Sauce Demo UI', () => {
  const standardUser = 'standard_user';
  const lockedOutUser = 'locked_out_user';
  const password = 'secret_sauce';
  const backpack = 'Sauce Labs Backpack';
  const bikeLight = 'Sauce Labs Bike Light';

  test('logs in successfully with the standard user', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.assertLoaded();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.assertLoaded();
    await expect(await sauceDemoInventoryPage.getItemCount()).toBeGreaterThan(0);
  });

  test('shows an error for a locked out user', async ({ sauceDemoLoginPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(lockedOutUser, password);
    await sauceDemoLoginPage.assertErrorContains('Sorry, this user has been locked out.');
  });

  test('validates empty login credentials', async ({ sauceDemoLoginPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login('', '');
    await sauceDemoLoginPage.assertErrorContains('Username is required');
  });

  test('opens product details from inventory', async ({ sauceDemoLoginPage, sauceDemoInventoryPage, sauceDemoProductDetailsPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.openItemDetails(backpack);
    await sauceDemoProductDetailsPage.assertLoaded(backpack);
  });

  test('sorts inventory by name A to Z', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.sortBy('az');
    const names = await sauceDemoInventoryPage.getItemNames();
    const expected = [...names].sort((left, right) => left.localeCompare(right));
    expect(names).toEqual(expected);
  });

  test('sorts inventory by name Z to A', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.sortBy('za');
    const names = await sauceDemoInventoryPage.getItemNames();
    const expected = [...names].sort((left, right) => right.localeCompare(left));
    expect(names).toEqual(expected);
  });

  test('sorts inventory by price low to high', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.sortBy('lohi');
    const prices = await sauceDemoInventoryPage.getPrices();
    const expected = [...prices].sort((left, right) => left - right);
    expect(prices).toEqual(expected);
  });

  test('sorts inventory by price high to low', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.sortBy('hilo');
    const prices = await sauceDemoInventoryPage.getPrices();
    const expected = [...prices].sort((left, right) => right - left);
    expect(prices).toEqual(expected);
  });

  test('adds and removes products from the cart and updates the badge', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.addItemToCart(backpack);
    await sauceDemoInventoryPage.assertCartBadgeCount(1);
    await sauceDemoInventoryPage.addItemToCart(bikeLight);
    await sauceDemoInventoryPage.assertCartBadgeCount(2);
    await sauceDemoInventoryPage.removeItemFromCart(backpack);
    await sauceDemoInventoryPage.assertCartBadgeCount(1);
    await sauceDemoInventoryPage.removeItemFromCart(bikeLight);
    await sauceDemoInventoryPage.assertCartBadgeHidden();
  });

  test('completes checkout for a single item', async ({ sauceDemoLoginPage, sauceDemoInventoryPage, sauceDemoCartPage, sauceDemoCheckoutInformationPage, sauceDemoCheckoutOverviewPage, sauceDemoCheckoutCompletePage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.addItemToCart(backpack);
    await sauceDemoInventoryPage.openCart();
    await sauceDemoCartPage.assertContainsItems([backpack]);
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

  test('validates required checkout fields', async ({ sauceDemoLoginPage, sauceDemoInventoryPage, sauceDemoCartPage, sauceDemoCheckoutInformationPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.addItemToCart(backpack);
    await sauceDemoInventoryPage.openCart();
    await sauceDemoCartPage.checkout();
    await sauceDemoCheckoutInformationPage.continue();
    await sauceDemoCheckoutInformationPage.assertErrorContains('First Name is required');
  });

  test('resets app state from the menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.addItemToCart(backpack);
    await sauceDemoInventoryPage.assertCartBadgeCount(1);
    await sauceDemoInventoryPage.menu.resetAppState();
    await sauceDemoInventoryPage.assertCartBadgeHidden();
  });

  test('logs out from the burger menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoLoginPage.goto();
    await sauceDemoLoginPage.login(standardUser, password);
    await sauceDemoInventoryPage.menu.logout();
    await sauceDemoLoginPage.assertLoaded();
  });
});
