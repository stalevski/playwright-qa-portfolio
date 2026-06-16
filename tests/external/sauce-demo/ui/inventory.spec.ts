import { test, expect } from '@sauce-demo-fixtures';
import { sauceDemoProducts } from '@helpers/test-data';

test.describe('Sauce Demo - Inventory', () => {
  test('opens product details from inventory', async ({ sauceDemoInventoryPage, sauceDemoProductDetailsPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
    await sauceDemoProductDetailsPage.assertLoaded(sauceDemoProducts.backpack);
  });

  test('sorts inventory by name A to Z', async ({ sauceDemoInventoryPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.sortBy('az');
    const names = await sauceDemoInventoryPage.getItemNames();
    const expected = [...names].sort((left, right) => left.localeCompare(right));
    expect(names).toEqual(expected);
  });

  test('sorts inventory by name Z to A', async ({ sauceDemoInventoryPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.sortBy('za');
    const names = await sauceDemoInventoryPage.getItemNames();
    const expected = [...names].sort((left, right) => right.localeCompare(left));
    expect(names).toEqual(expected);
  });

  test('sorts inventory by price low to high', async ({ sauceDemoInventoryPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.sortBy('lohi');
    const prices = await sauceDemoInventoryPage.getPrices();
    const expected = [...prices].sort((left, right) => left - right);
    expect(prices).toEqual(expected);
  });

  test('sorts inventory by price high to low', async ({ sauceDemoInventoryPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.sortBy('hilo');
    const prices = await sauceDemoInventoryPage.getPrices();
    const expected = [...prices].sort((left, right) => right - left);
    expect(prices).toEqual(expected);
  });

  test(
    'adds and removes products from the cart and updates the badge',
    { tag: '@smoke' },
    async ({ sauceDemoInventoryPage }) => {
      await sauceDemoInventoryPage.goto();
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.assertCartBadgeCount(2);
      await sauceDemoInventoryPage.removeItemFromCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.removeItemFromCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    },
  );
});
