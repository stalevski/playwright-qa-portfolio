import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class SauceDemoProductDetailsPage extends BasePage {
  readonly itemName: Locator;
  readonly itemDescription: Locator;
  readonly itemPrice: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemName = page.getByTestId('inventory-item-name');
    this.itemDescription = page.getByTestId('inventory-item-desc');
    this.itemPrice = page.getByTestId('inventory-item-price');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.backToProductsButton = page.getByTestId('back-to-products');
  }

  async assertLoaded(itemName: string): Promise<void> {
    await expect(this.itemName).toContainText(itemName);
    await expect(this.itemDescription).toBeVisible();
    await expect(this.itemPrice).toBeVisible();
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
