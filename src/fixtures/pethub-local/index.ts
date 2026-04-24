import { test as base } from '@playwright/test';
import { LocalPetStoreApiClient } from '@helpers/api-clients/pethub-local-api.client';
import { LocalPetStorePage } from '@pages/pethub-local/home.page';

type LocalFixtures = {
  localHomePage: LocalPetStorePage;
  localApiClient: LocalPetStoreApiClient;
};

export const test = base.extend<LocalFixtures>({
  localHomePage: async ({ page }, use) => {
    await use(new LocalPetStorePage(page));
  },
  localApiClient: async ({ request }, use) => {
    await use(new LocalPetStoreApiClient(request));
  },
});

export { expect } from '@playwright/test';
