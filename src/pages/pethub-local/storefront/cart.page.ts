import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class StorefrontCartPage extends BasePage {
  readonly heading: Locator;
  readonly continueShoppingLink: Locator;
  readonly checkoutLink: Locator;
  readonly cartItems: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Cart items', exact: true });
    this.continueShoppingLink = page.getByTestId('continue-shopping');
    this.checkoutLink = page.getByTestId('checkout');
    this.cartItems = page.getByTestId('cart-item');
    this.emptyMessage = page.getByTestId('empty-cart');
  }

  async goto(): Promise<void> {
    await this.visit('/shop/cart');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async assertItemVisible(itemName: string): Promise<void> {
    await expect(this.cartItems.filter({ hasText: itemName })).toBeVisible();
  }

  async assertEmpty(): Promise<void> {
    await expect(this.emptyMessage).toBeVisible();
  }

  async removeItem(itemName: string): Promise<void> {
    const row = this.cartItems.filter({ hasText: itemName });
    await Promise.all([
      this.page.waitForURL(/\/shop\/cart(?:\?.*)?$/),
      row.getByRole('button', { name: 'Remove' }).first().click(),
    ]);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutLink.click();
    await this.page.waitForURL(/\/shop\/checkout(?:\?.*)?$/);
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingLink.click();
  }
}
