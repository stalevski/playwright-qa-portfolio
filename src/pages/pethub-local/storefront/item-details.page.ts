import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class StorefrontItemDetailsPage extends BasePage {
  readonly itemHeading: Locator;
  readonly backLink: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemHeading = page.locator('section.hero h1').first();
    this.backLink = page.getByRole('link', { name: 'Back to products' });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
  }

  async goto(itemId: number): Promise<void> {
    await this.visit(`/shop/item/${itemId}`);
  }

  async assertLoaded(itemName: string): Promise<void> {
    await expect(this.itemHeading).toContainText(itemName);
    await expect(this.backLink).toBeVisible();
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async goBackToInventory(): Promise<void> {
    await this.backLink.click();
  }
}
