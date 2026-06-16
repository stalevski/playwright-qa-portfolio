import { test, expect } from '@sauce-demo-fixtures';
import { sauceDemoProducts } from '@helpers/test-data';

test.describe('Sauce Demo - Checkout', () => {
  test(
    'completes checkout for a single item',
    { tag: ['@smoke', '@critical'] },
    async ({
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
      sauceDemoCheckoutCompletePage,
    }) => {
      await sauceDemoInventoryPage.goto();
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
    },
  );

  test('multi-item checkout sums line prices into the item total', async ({
    sauceDemoInventoryPage,
    sauceDemoCartPage,
    sauceDemoCheckoutInformationPage,
    sauceDemoCheckoutOverviewPage,
  }) => {
    await sauceDemoInventoryPage.goto();
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
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
    }) => {
      await sauceDemoInventoryPage.goto();
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
    sauceDemoInventoryPage,
    sauceDemoCartPage,
    sauceDemoCheckoutInformationPage,
  }) => {
    await sauceDemoInventoryPage.goto();
    await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
    await sauceDemoInventoryPage.openCart();
    await sauceDemoCartPage.checkout();
    await sauceDemoCheckoutInformationPage.cancel();
    await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
  });

  test('cancel on overview page returns to the inventory', async ({
    sauceDemoInventoryPage,
    sauceDemoCartPage,
    sauceDemoCheckoutInformationPage,
    sauceDemoCheckoutOverviewPage,
  }) => {
    await sauceDemoInventoryPage.goto();
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
