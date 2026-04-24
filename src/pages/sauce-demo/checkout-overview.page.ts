import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class SauceDemoCheckoutOverviewPage extends BasePage {
  readonly summaryContainer: Locator;
  readonly finishButton: Locator;
  readonly itemTotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.summaryContainer = page.getByTestId('checkout-summary-container');
    this.finishButton = page.getByTestId('finish');
    this.itemTotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.summaryContainer).toBeVisible();
  }

  async getItemTotal(): Promise<number> {
    const text = await this.itemTotalLabel.textContent();
    return Number(text?.replace('Item total: $', '') ?? '0');
  }

  async getTax(): Promise<number> {
    const text = await this.taxLabel.textContent();
    return Number(text?.replace('Tax: $', '') ?? '0');
  }

  async getTotal(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return Number(text?.replace('Total: $', '') ?? '0');
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
