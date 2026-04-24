import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class StorefrontCompletePage extends BasePage {
  readonly orderHeading: Locator;
  readonly backHomeLink: Locator;

  constructor(page: Page) {
    super(page);
    this.orderHeading = page.getByRole('heading', { name: /^Order #\d+/ });
    this.backHomeLink = page.getByRole('link', { name: 'Back home' });
  }

  async assertLoaded(): Promise<void> {
    await expect(this.orderHeading).toBeVisible();
    await expect(this.backHomeLink).toBeVisible();
  }

  async getOrderId(): Promise<number> {
    const text = (await this.orderHeading.textContent()) ?? '';
    const match = text.match(/Order #(\d+)/);
    if (!match) {
      throw new Error(`Could not parse order id from heading "${text}"`);
    }
    return Number(match[1]);
  }
}
