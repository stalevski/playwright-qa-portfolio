import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class StorefrontCheckoutPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly submitButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.submitButton = page.getByRole('button', { name: /place|checkout|continue/i });
    this.errorBanner = page.getByTestId('error');
  }

  async goto(): Promise<void> {
    await this.visit('/shop/checkout');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.postalCodeInput).toBeVisible();
  }

  async fillInformation(info: { firstName: string; lastName: string; postalCode: string }): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    await Promise.race([
      this.page.waitForURL(/\/shop\/complete(?:\?.*)?$/),
      this.errorBanner.waitFor({ state: 'visible' }),
    ]);
  }

  async assertErrorContains(text: string): Promise<void> {
    await expect(this.errorBanner).toContainText(text);
  }
}
