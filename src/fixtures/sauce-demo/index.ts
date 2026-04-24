import { test as base } from '@playwright/test';
import { SauceDemoCartPage } from '@pages/sauce-demo/cart.page';
import { SauceDemoCheckoutCompletePage } from '@pages/sauce-demo/checkout-complete.page';
import { SauceDemoCheckoutInformationPage } from '@pages/sauce-demo/checkout-information.page';
import { SauceDemoCheckoutOverviewPage } from '@pages/sauce-demo/checkout-overview.page';
import { SauceDemoInventoryPage } from '@pages/sauce-demo/inventory.page';
import { SauceDemoLoginPage } from '@pages/sauce-demo/login.page';
import { SauceDemoProductDetailsPage } from '@pages/sauce-demo/product-details.page';

type SauceDemoFixtures = {
  sauceDemoLoginPage: SauceDemoLoginPage;
  sauceDemoInventoryPage: SauceDemoInventoryPage;
  sauceDemoProductDetailsPage: SauceDemoProductDetailsPage;
  sauceDemoCartPage: SauceDemoCartPage;
  sauceDemoCheckoutInformationPage: SauceDemoCheckoutInformationPage;
  sauceDemoCheckoutOverviewPage: SauceDemoCheckoutOverviewPage;
  sauceDemoCheckoutCompletePage: SauceDemoCheckoutCompletePage;
};

export const test = base.extend<SauceDemoFixtures>({
  sauceDemoLoginPage: async ({ page }, use) => {
    await use(new SauceDemoLoginPage(page));
  },
  sauceDemoInventoryPage: async ({ page }, use) => {
    await use(new SauceDemoInventoryPage(page));
  },
  sauceDemoProductDetailsPage: async ({ page }, use) => {
    await use(new SauceDemoProductDetailsPage(page));
  },
  sauceDemoCartPage: async ({ page }, use) => {
    await use(new SauceDemoCartPage(page));
  },
  sauceDemoCheckoutInformationPage: async ({ page }, use) => {
    await use(new SauceDemoCheckoutInformationPage(page));
  },
  sauceDemoCheckoutOverviewPage: async ({ page }, use) => {
    await use(new SauceDemoCheckoutOverviewPage(page));
  },
  sauceDemoCheckoutCompletePage: async ({ page }, use) => {
    await use(new SauceDemoCheckoutCompletePage(page));
  },
});

export { expect } from '@playwright/test';
