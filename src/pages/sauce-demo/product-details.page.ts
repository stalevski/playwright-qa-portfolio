import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class SauceDemoProductDetailsPage extends BasePage {
  readonly itemName: Locator;
  readonly itemDescription: Locator;
  readonly itemPrice: Locator;

  constructor(page: Page) {
    super(page);
    this.itemName = page.getByTestId('inventory-item-name');
    this.itemDescription = page.getByTestId('inventory-item-desc');
    this.itemPrice = page.getByTestId('inventory-item-price');
  }

  async assertLoaded(itemName: string): Promise<void> {
    await expect(this.itemName).toContainText(itemName);
    await expect(this.itemDescription).toBeVisible();
    await expect(this.itemPrice).toBeVisible();
  }
}
