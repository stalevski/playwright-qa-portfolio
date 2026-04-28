import { test, expect } from '@sauce-demo-fixtures';
import { sauceDemoProducts } from '@helpers/test-data';

test.describe('Sauce Demo - Cart page', () => {
  test('removes an item from the cart page and clears the badge', async ({
    sauceDemoInventoryPage,
    sauceDemoCartPage,
  }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
    await sauceDemoInventoryPage.openCart();
    await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
    await sauceDemoCartPage.removeItem(sauceDemoProducts.backpack);
    expect(await sauceDemoCartPage.getItemCount()).toBe(0);
    await sauceDemoInventoryPage.assertCartBadgeHidden();
  });

  test('continue shopping returns to the inventory with the cart intact', async ({
    sauceDemoInventoryPage,
    sauceDemoCartPage,
  }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
    await sauceDemoInventoryPage.openCart();
    await sauceDemoCartPage.continueShopping();
    await sauceDemoInventoryPage.assertLoaded();
    await sauceDemoInventoryPage.assertCartBadgeCount(1);
  });
});
