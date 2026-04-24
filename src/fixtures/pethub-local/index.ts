import { test as base } from '@playwright/test';
import { LocalPetStoreApiClient } from '@helpers/api-clients/pethub-local-api.client';
import { LocalPetStorePage } from '@pages/pethub-local/home.page';
import { OpsComparisonsPage } from '@pages/pethub-local/ops/comparisons.page';
import { OpsIncidentDetailPage } from '@pages/pethub-local/ops/incident-detail.page';
import { OpsIncidentsPage } from '@pages/pethub-local/ops/incidents.page';
import { OpsOverviewPage } from '@pages/pethub-local/ops/overview.page';
import { OpsQueuePage } from '@pages/pethub-local/ops/queue.page';
import { StorefrontCartPage } from '@pages/pethub-local/storefront/cart.page';
import { StorefrontCheckoutPage } from '@pages/pethub-local/storefront/checkout.page';
import { StorefrontCompletePage } from '@pages/pethub-local/storefront/complete.page';
import { StorefrontInventoryPage } from '@pages/pethub-local/storefront/inventory.page';
import { StorefrontItemDetailsPage } from '@pages/pethub-local/storefront/item-details.page';
import { StorefrontLoginPage } from '@pages/pethub-local/storefront/login.page';

type LocalFixtures = {
  localHomePage: LocalPetStorePage;
  localApiClient: LocalPetStoreApiClient;
  storefrontLoginPage: StorefrontLoginPage;
  storefrontInventoryPage: StorefrontInventoryPage;
  storefrontItemDetailsPage: StorefrontItemDetailsPage;
  storefrontCartPage: StorefrontCartPage;
  storefrontCheckoutPage: StorefrontCheckoutPage;
  storefrontCompletePage: StorefrontCompletePage;
  opsOverviewPage: OpsOverviewPage;
  opsQueuePage: OpsQueuePage;
  opsComparisonsPage: OpsComparisonsPage;
  opsIncidentsPage: OpsIncidentsPage;
  opsIncidentDetailPage: OpsIncidentDetailPage;
};

export const test = base.extend<LocalFixtures>({
  localHomePage: async ({ page }, use) => {
    await use(new LocalPetStorePage(page));
  },
  localApiClient: async ({ request }, use) => {
    await use(new LocalPetStoreApiClient(request));
  },
  storefrontLoginPage: async ({ page }, use) => {
    await use(new StorefrontLoginPage(page));
  },
  storefrontInventoryPage: async ({ page }, use) => {
    await use(new StorefrontInventoryPage(page));
  },
  storefrontItemDetailsPage: async ({ page }, use) => {
    await use(new StorefrontItemDetailsPage(page));
  },
  storefrontCartPage: async ({ page }, use) => {
    await use(new StorefrontCartPage(page));
  },
  storefrontCheckoutPage: async ({ page }, use) => {
    await use(new StorefrontCheckoutPage(page));
  },
  storefrontCompletePage: async ({ page }, use) => {
    await use(new StorefrontCompletePage(page));
  },
  opsOverviewPage: async ({ page }, use) => {
    await use(new OpsOverviewPage(page));
  },
  opsQueuePage: async ({ page }, use) => {
    await use(new OpsQueuePage(page));
  },
  opsComparisonsPage: async ({ page }, use) => {
    await use(new OpsComparisonsPage(page));
  },
  opsIncidentsPage: async ({ page }, use) => {
    await use(new OpsIncidentsPage(page));
  },
  opsIncidentDetailPage: async ({ page }, use) => {
    await use(new OpsIncidentDetailPage(page));
  },
});

export { expect } from '@playwright/test';
