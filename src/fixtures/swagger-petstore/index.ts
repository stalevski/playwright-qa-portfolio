import { test as base } from '@playwright/test';
import { PetStoreHomePage } from '@pages/swagger-petstore/home.page';
import { PetStoreApiClient } from '@helpers/api-clients/swagger-petstore-api.client';

type AppFixtures = {
  homePage: PetStoreHomePage;
  apiClient: PetStoreApiClient;
};

export const test = base.extend<AppFixtures>({
  homePage: async ({ page }, use) => {
    await use(new PetStoreHomePage(page));
  },
  apiClient: async ({ request }, use) => {
    await use(new PetStoreApiClient(request));
  },
});

export { expect } from '@playwright/test';
