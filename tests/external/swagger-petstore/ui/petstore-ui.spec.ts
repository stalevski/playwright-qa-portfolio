import { test, expect } from '@swagger-petstore-fixtures';
import { createPetDto } from '@helpers/test-data';

test.describe('Petstore Swagger UI', () => {
  test('loads the landing page and core sections', { tag: '@smoke' }, async ({ homePage }) => {
    await homePage.goto();
    await homePage.assertLoaded();
    await homePage.assertTagVisible('pet');
    await homePage.assertTagVisible('store');
    await homePage.assertTagVisible('user');
  });

  test('shows expected operations for pet and store tags', async ({ homePage }) => {
    await homePage.goto();
    await homePage.assertLoaded();
    await homePage.assertOperationsVisible([
      'Find pet by ID',
      'Add a new pet to the store',
      'Returns pet inventories by status',
      'Place an order for a pet',
    ]);
  });

  test('keeps authorize control accessible', async ({ homePage }) => {
    await homePage.goto();
    await homePage.assertLoaded();
    await homePage.openAuthorizeModal();
    await expect(homePage.authModalHeading).toBeVisible();
    await homePage.closeAuthorizeModal();
    await expect(homePage.authorizeButton).toBeVisible();
  });

  test('creates a pet from the web UI and verifies it from the web UI', async ({ homePage }) => {
    const pet = createPetDto();

    await homePage.goto();
    await homePage.assertLoaded();
    await homePage.createPetViaUi(pet);
    await homePage.findPetByIdViaUi(pet.id);
    await homePage.assertPetDetailsVisible(pet);
  });
});
