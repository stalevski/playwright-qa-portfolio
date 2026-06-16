import { test } from '@sauce-demo-fixtures';
import { sauceDemoProducts } from '@helpers/test-data';

test.describe('Sauce Demo - Product details page', () => {
  test('adds the item to the cart from the details page', async ({
    sauceDemoInventoryPage,
    sauceDemoProductDetailsPage,
  }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
    await sauceDemoProductDetailsPage.addToCart();
    await sauceDemoProductDetailsPage.backToProducts();
    await sauceDemoInventoryPage.assertCartBadgeCount(1);
  });

  test('removes the item from the cart via the details page', async ({
    sauceDemoInventoryPage,
    sauceDemoProductDetailsPage,
  }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
    await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
    await sauceDemoProductDetailsPage.removeFromCart();
    await sauceDemoProductDetailsPage.backToProducts();
    await sauceDemoInventoryPage.assertCartBadgeHidden();
  });

  test('back-to-products returns to the inventory', async ({ sauceDemoInventoryPage, sauceDemoProductDetailsPage }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
    await sauceDemoProductDetailsPage.backToProducts();
    await sauceDemoInventoryPage.assertLoaded();
  });
});
