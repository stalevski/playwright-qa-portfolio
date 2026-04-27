import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class LocalPetStorePage extends BasePage {
  readonly title: Locator;
  readonly petsHeading: Locator;
  readonly petsTable: Locator;
  readonly createPetSection: Locator;
  readonly createPetButton: Locator;
  readonly updatePetWithFormSection: Locator;
  readonly petRows: Locator;
  readonly ordersHeading: Locator;
  readonly ordersTable: Locator;
  readonly auditHeading: Locator;
  readonly auditTable: Locator;
  readonly explorerHeading: Locator;
  readonly readModelsHeading: Locator;
  readonly downstreamSystemsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'PetHub Local', exact: true });
    this.petsHeading = page.getByRole('heading', { name: 'Pets', exact: true });
    this.petsTable = this.petsHeading.locator('..').locator('table');
    this.createPetSection = page.getByRole('heading', { name: 'Create Pet', exact: true }).locator('..');
    this.createPetButton = page.getByRole('button', { name: 'Create pet' });
    this.updatePetWithFormSection = page
      .getByRole('heading', { name: 'Update Pet With Form Data', exact: true })
      .locator('..');
    this.petRows = this.petsTable.locator('tbody tr');
    this.ordersHeading = page.getByRole('heading', { name: 'Orders', exact: true });
    this.ordersTable = this.ordersHeading.locator('..').locator('table');
    this.auditHeading = page.getByRole('heading', { name: 'Audit Log', exact: true });
    this.auditTable = this.auditHeading.locator('..').locator('table');
    this.explorerHeading = page.getByRole('heading', { name: 'Swagger-style Explorer', exact: true });
    this.readModelsHeading = page.getByRole('heading', { name: 'Read Models Database', exact: true });
    this.downstreamSystemsHeading = page.getByRole('heading', { name: 'Downstream Systems Database', exact: true });
  }

  async goto(): Promise<void> {
    await this.visit('/');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.petsHeading).toBeVisible();
    await expect(this.ordersHeading).toBeVisible();
    await expect(this.auditHeading).toBeVisible();
    await expect(this.explorerHeading).toBeVisible();
    await expect(this.readModelsHeading).toBeVisible();
    await expect(this.downstreamSystemsHeading).toBeVisible();
  }

  async createPet(pet: {
    id: number;
    name: string;
    category: string;
    status: 'available' | 'pending' | 'sold';
    price: number;
    notes: string;
  }): Promise<void> {
    await this.createPetSection.getByPlaceholder('Pet ID').fill(String(pet.id));
    await this.createPetSection.getByPlaceholder('Pet name').fill(pet.name);
    await this.createPetSection.getByPlaceholder('Category').fill(pet.category);
    await this.createPetSection.locator('select[name="status"]').selectOption(pet.status);
    await this.createPetSection.getByPlaceholder('Price').fill(String(pet.price));
    await this.createPetSection.getByPlaceholder('Notes').fill(pet.notes);
    await Promise.all([
      this.page.waitForResponse(
        (response) => /\/pets(?:\?.*)?$/.test(response.url()) && response.request().method() === 'POST',
      ),
      this.createPetSection.getByRole('button', { name: 'Create pet' }).click(),
    ]);
    await this.page.waitForLoadState('domcontentloaded');
    await this.assertLoaded();
  }

  async updatePetWithFormData(pet: {
    id: number;
    name: string;
    status: 'available' | 'pending' | 'sold';
  }): Promise<void> {
    await this.updatePetWithFormSection.getByPlaceholder('Pet ID').fill(String(pet.id));
    await this.updatePetWithFormSection.getByPlaceholder('Updated name').fill(pet.name);
    await this.updatePetWithFormSection.locator('select[name="status"]').selectOption(pet.status);
    await Promise.all([
      this.page.waitForResponse((response) => response.url().endsWith('/api/pets/form-update')),
      this.updatePetWithFormSection.getByRole('button', { name: 'Execute' }).click(),
    ]);
    await this.page.waitForLoadState('domcontentloaded');
    await this.assertLoaded();
  }

  async assertPetVisible(pet: { id: number; name: string; category: string; status: string }): Promise<void> {
    const row = this.petRows.filter({ hasText: `${pet.id}` }).first();
    await expect(row).toContainText(pet.name);
    await expect(row).toContainText(pet.category);
    await expect(row).toContainText(pet.status);
  }

  async assertAuditEntryVisible(text: string): Promise<void> {
    await expect(this.auditTable).toContainText(text);
  }

  async assertOrderRelationVisible(text: string): Promise<void> {
    await expect(this.ordersTable).toContainText(text);
  }
}
