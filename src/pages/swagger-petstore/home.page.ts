import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';
import type { PetDto } from '@models/api/pet.dto';

type TagName = 'pet' | 'store' | 'user';

export class PetStoreHomePage extends BasePage {
  readonly title: Locator;
  readonly authorizeButton: Locator;
  readonly cookieAcceptButton: Locator;
  readonly operationDescriptions: Locator;
  readonly authModalHeading: Locator;
  readonly authModalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { level: 1, name: /swagger petstore/i });
    this.authorizeButton = page.getByRole('button', { name: 'Authorize' });
    this.cookieAcceptButton = page.getByRole('button', { name: /allow all/i }).or(page.locator('#ch2-allow-all-btn'));
    this.operationDescriptions = page.locator('.opblock-summary-description');
    this.authModalHeading = page.getByRole('heading', { name: 'Available authorizations' });
    this.authModalCloseButton = page.getByRole('button', { name: 'Close' }).first();
  }

  async goto(): Promise<void> {
    await this.visit('/');
    await this.dismissCookieBanner();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.title).toContainText('Swagger Petstore');
    await this.expectVisible(this.authorizeButton);
  }

  async expandTag(tag: TagName): Promise<void> {
    await this.dismissCookieBanner();
    await this.tagToggle(tag).click();
  }

  async assertTagVisible(tag: TagName): Promise<void> {
    const section = this.tagSection(tag);
    await expect(section).toBeVisible();
  }

  async assertOperationVisible(operationSummary: string): Promise<void> {
    await expect(this.operationDescriptions.filter({ hasText: operationSummary }).first()).toBeVisible();
  }

  async openAuthorizeModal(): Promise<void> {
    await this.dismissCookieBanner();
    await this.authorizeButton.click();

    if (!(await this.authModalHeading.isVisible().catch(() => false))) {
      await this.dismissCookieBanner();
      await this.authorizeButton.click();
    }

    await expect(this.authModalHeading).toBeVisible();
  }

  async closeAuthorizeModal(): Promise<void> {
    await this.dismissCookieBanner();
    await this.authModalCloseButton.click();
    await expect(this.authorizeButton).toBeVisible();
  }

  async assertOperationsVisible(operationSummaries: string[]): Promise<void> {
    for (const operationSummary of operationSummaries) {
      await this.assertOperationVisible(operationSummary);
    }
  }

  async createPetViaUi(pet: PetDto): Promise<void> {
    const operation = this.page.locator('#operations-pet-addPet').or(this.operationBlock('Add a new pet to the store'));
    const responseContainer = operation.locator('.responses-inner');
    const tryItOutButton = operation.getByRole('button', { name: 'Try it out' });
    const executeButton = operation.getByRole('button', { name: 'Execute' });

    await this.openOperation(operation);
    await this.dismissCookieBanner();
    await tryItOutButton.click();
    await operation.locator('textarea.body-param__text').fill(JSON.stringify(pet, null, 2));
    await this.dismissCookieBanner();
    await executeButton.click();

    await expect(responseContainer).toContainText('200');
    await expect(responseContainer).toContainText(`"id": ${pet.id}`);
    await expect(responseContainer).toContainText(`"name": "${pet.name}"`);
  }

  async findPetByIdViaUi(petId: number): Promise<void> {
    const operation = this.page.locator('#operations-pet-getPetById').or(this.operationBlock('Find pet by ID'));
    const tryItOutButton = operation.getByRole('button', { name: 'Try it out' });
    const executeButton = operation.getByRole('button', { name: 'Execute' });

    await this.openOperation(operation);
    await this.dismissCookieBanner();
    await tryItOutButton.click();
    await operation.getByPlaceholder('petId').fill(String(petId));
    await this.dismissCookieBanner();
    await executeButton.click();
  }

  async assertPetDetailsVisible(pet: PetDto): Promise<void> {
    const operation = this.page.locator('#operations-pet-getPetById').or(this.operationBlock('Find pet by ID'));
    const responseContainer = operation.locator('.responses-inner');

    await expect(responseContainer).toContainText('200');
    await expect(responseContainer).toContainText(`"id": ${pet.id}`);
    await expect(responseContainer).toContainText(`"name": "${pet.name}"`);
    await expect(responseContainer).toContainText(`"status": "${pet.status}"`);
  }

  async dismissCookieBanner(): Promise<void> {
    const knownConsentButtons = [
      this.cookieAcceptButton,
      this.page.getByRole('button', { name: /allow all/i }),
      this.page.getByRole('button', { name: /accept/i }),
    ];

    for (const button of knownConsentButtons) {
      if (await button.isVisible().catch(() => false)) {
        await button.click().catch(() => undefined);
      }
    }

    // Remove any banner currently in the DOM AND inject a stylesheet so it
    // stays hidden if the consent script re-renders it. The ch2 banner is
    // known to lazy-render on Chromium and intercept clicks on the Authorize
    // button between dismissal and the next action.
    await this.page.evaluate(() => {
      document.querySelectorAll('.ch2, .ch2-region-eu, .ch2-container').forEach((element) => {
        element.remove();
      });
      if (!document.getElementById('cookie-banner-suppressor')) {
        const style = document.createElement('style');
        style.id = 'cookie-banner-suppressor';
        style.textContent =
          '.ch2, .ch2-region-eu, .ch2-container { display: none !important; pointer-events: none !important; visibility: hidden !important; }';
        document.head.appendChild(style);
      }
    });
  }

  private tagSection(tag: TagName): Locator {
    return this.page.locator(`.opblock-tag-section [data-tag="${tag}"]`).locator('..').first();
  }

  private tagToggle(tag: TagName): Locator {
    return this.page.locator(`.opblock-tag[data-tag="${tag}"]`);
  }

  private operationBlock(summary: string): Locator {
    return this.page
      .locator('.opblock')
      .filter({ has: this.page.locator('.opblock-summary-description', { hasText: summary }) })
      .first();
  }

  private async openOperation(operation: Locator): Promise<void> {
    await this.dismissCookieBanner();
    await expect(operation).toBeVisible();
    await operation.scrollIntoViewIfNeeded();

    const tryItOutButton = operation.getByRole('button', { name: 'Try it out' });
    const operationBody = operation.locator('.opblock-body');
    const operationToggle = operation
      .locator('.opblock-summary-control')
      .or(operation.locator('.opblock-control-arrow'));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (await operationBody.isVisible().catch(() => false)) {
        break;
      }

      await operationToggle.first().click().catch(() => undefined);
      await this.dismissCookieBanner();
    }

    await expect(operationBody).toBeVisible();
    await expect(tryItOutButton).toBeVisible();
  }
}
