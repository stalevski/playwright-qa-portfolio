import { test } from '@sauce-demo-fixtures';
import { sauceDemoProducts } from '@helpers/test-data';

test.describe('Sauce Demo - Menu', () => {
  test('resets app state from the menu', async ({ sauceDemoInventoryPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
    await sauceDemoInventoryPage.assertCartBadgeCount(1);
    await sauceDemoInventoryPage.menu.resetAppState();
    await sauceDemoInventoryPage.assertCartBadgeHidden();
  });

  test('logs out from the burger menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.menu.logout();
    await sauceDemoLoginPage.assertLoaded();
  });
});
