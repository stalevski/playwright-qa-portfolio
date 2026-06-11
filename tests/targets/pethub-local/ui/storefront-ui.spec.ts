import { test, expect } from '@pethub-local-fixtures';
import { testTargets } from '@config';
import { pethubLocalPassword, pethubLocalUsers } from '@helpers/test-data';

test.describe('PetHub Storefront UI', () => {
  const standardUser = pethubLocalUsers.standard;
  const lockedOutUser = pethubLocalUsers.lockedOut;
  const password = pethubLocalPassword;

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

  test(
    'logs in a standard user and lists available inventory',
    { tag: '@smoke' },
    async ({ storefrontLoginPage, storefrontInventoryPage }) => {
      await storefrontLoginPage.goto();
      await storefrontLoginPage.login(standardUser, password);
      await storefrontInventoryPage.assertLoaded();
      expect(await storefrontInventoryPage.getItemCount()).toBeGreaterThan(0);
    },
  );

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

  test(
    'adds an item to the cart and shows the cart badge',
    { tag: '@critical' },
    async ({ storefrontLoginPage, storefrontInventoryPage }) => {
      await storefrontLoginPage.goto();
      await storefrontLoginPage.login(standardUser, password);
      const [firstItem] = await storefrontInventoryPage.getItemNames();
      await storefrontInventoryPage.addItemToCart(firstItem);
      await storefrontInventoryPage.assertCartBadgeCount(1);
    },
  );

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

  test(
    'completes a checkout flow and records a new order',
    { tag: ['@smoke', '@critical'] },
    async ({
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
    },
  );

  test('checkout summary total equals item total + tax', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCartPage,
    storefrontCheckoutPage,
    page,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.addItemToCart(firstItem);
    await storefrontInventoryPage.openCart();
    await storefrontCartPage.proceedToCheckout();
    await storefrontCheckoutPage.assertLoaded();

    const parseAmount = (text: string | null): number => Number(String(text ?? '').replace(/[^0-9.]/g, ''));
    const subtotal = parseAmount(await page.getByTestId('subtotal-label').textContent());
    const tax = parseAmount(await page.getByTestId('tax-label').textContent());
    const total = parseAmount(await page.getByTestId('total-label').textContent());

    expect(subtotal).toBeGreaterThan(0);
    expect(tax).toBeGreaterThan(0);
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('storefront order is attributed to the logged-in user, not a hardcoded id', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCartPage,
    storefrontCheckoutPage,
    storefrontCompletePage,
    request,
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

    // `standard_user` storefront persona maps to seeded API user `buyer01` (id 2002).
    // Before the bug fix, every storefront order was hardcoded under userId 2002 regardless
    // of who logged in - this assertion now ties the order back to the persona's mapped user.
    // We hit the API directly (absolute URL) because this UI project's baseURL does not include `/api`.
    const orderUrl = `${testTargets.pethubLocal.apiBaseUrl}orders/${orderId}/relations`;
    const response = await request.get(orderUrl);
    expect(response.ok(), `Expected 2xx for ${orderUrl}, got ${response.status()}`).toBeTruthy();
    const order = (await response.json()) as { userId: number; user?: { username: string } };
    expect(order.userId).toBe(2002);
    expect(order.user?.username).toBe('buyer01');
  });

  test('sorts inventory by name Z to A', async ({ storefrontLoginPage, storefrontInventoryPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.sortBy('za');
    const names = await storefrontInventoryPage.getItemNames();
    const expected = [...names].sort((left, right) => right.localeCompare(left));
    expect(names).toEqual(expected);
  });

  test('sorts inventory by price high to low', async ({ storefrontLoginPage, storefrontInventoryPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.sortBy('hilo');
    const prices = await storefrontInventoryPage.getPrices();
    const expected = [...prices].sort((left, right) => right - left);
    expect(prices).toEqual(expected);
  });

  test('shows a confirmation toast after adding an item to the cart', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    page,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.addItemToCart(firstItem);
    await expect(page.getByTestId('toast')).toContainText(`${firstItem} added to cart`);
  });

  test('removes an item from the cart and shows the empty cart message', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCartPage,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    const [firstItem] = await storefrontInventoryPage.getItemNames();
    await storefrontInventoryPage.addItemToCart(firstItem);
    await storefrontInventoryPage.assertCartBadgeCount(1);
    await storefrontInventoryPage.openCart();
    await storefrontCartPage.assertLoaded();
    await storefrontCartPage.removeItem(firstItem);
    await storefrontCartPage.assertEmpty();
  });

  test('logs the user out and returns to the login page', async ({ storefrontLoginPage, storefrontInventoryPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.logout();
    await storefrontLoginPage.assertLoaded();
  });
});

test.describe('PetHub Storefront theme toggle', () => {
  const standardUser = pethubLocalUsers.standard;
  const password = pethubLocalPassword;

  test('toggles between dark and light themes and persists across reloads', async ({ storefrontLoginPage, page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);

    const html = page.locator('html');
    const toggle = page.getByTestId('theme-toggle').first();

    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.getByTestId('theme-toggle').first().click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('theme-toggle').first()).toHaveAttribute('aria-pressed', 'false');
  });

  test('respects the prefers-color-scheme media query when no choice is stored', async ({
    storefrontLoginPage,
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
