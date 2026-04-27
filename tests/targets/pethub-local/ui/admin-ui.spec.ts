import { test, expect } from '@pethub-local-fixtures';
import { RandomDataGenerator } from '@helpers/random-data-generator';

const localPet = RandomDataGenerator.createLocalPet({
  category: 'Dogs',
  status: 'available',
});

test.describe('Local Petstore UI', () => {
  test('loads the admin dashboard', async ({ localHomePage }) => {
    await localHomePage.goto();
    await localHomePage.assertLoaded();
    await localHomePage.assertOrderRelationVisible('buyer01');
  });

  test('shows Swagger-style explorer and derived databases', async ({ localHomePage, page }) => {
    await localHomePage.goto();
    await localHomePage.assertLoaded();

    await expect(page.getByText('/api/read-models')).toBeVisible();
    await expect(page.getByText('/api/downstream-systems')).toBeVisible();
    await expect(page.getByText('Inventory Replica')).toBeVisible();
    await expect(page.getByText('Pet Catalog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Execute' }).first()).toBeVisible();
  });

  test('creates a pet and shows an audit entry', async ({ localHomePage }) => {
    await localHomePage.goto();
    await localHomePage.assertLoaded();
    await localHomePage.createPet(localPet);
    await localHomePage.assertPetVisible(localPet);
    await localHomePage.assertAuditEntryVisible(`Pet ${localPet.name} created`);
  });

  test('updates a created pet through the homepage form-update flow', async ({ localHomePage }) => {
    const createdPet = RandomDataGenerator.createLocalPet({
      category: 'Cats',
      status: 'available',
    });
    const updatedPet = {
      ...createdPet,
      name: `${createdPet.name} Updated`,
      status: 'sold' as const,
    };

    await localHomePage.goto();
    await localHomePage.assertLoaded();
    await localHomePage.createPet(createdPet);
    await localHomePage.assertPetVisible(createdPet);

    await localHomePage.updatePetWithFormData({
      id: createdPet.id,
      name: updatedPet.name,
      status: updatedPet.status,
    });

    await localHomePage.assertPetVisible(updatedPet);
  });

  test('admin dashboard exposes the shared theme toggle and reacts to clicks', async ({ localHomePage, page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await localHomePage.goto();
    await localHomePage.assertLoaded();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});
