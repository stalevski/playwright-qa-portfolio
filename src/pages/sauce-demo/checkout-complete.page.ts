import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class SauceDemoCheckoutCompletePage extends BasePage {
  readonly completeHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.completeHeader).toContainText('Thank you for your order');
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
