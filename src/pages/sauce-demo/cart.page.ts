import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class SauceDemoCartPage extends BasePage {
  readonly cartItems: Locator;
  readonly cartItemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = page.locator('.cart_item');
    this.cartItemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async assertContainsItems(itemNames: string[]): Promise<void> {
    for (const itemName of itemNames) {
      await expect(this.cartItemNames.filter({ hasText: itemName })).toBeVisible();
    }
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async removeItem(itemName: string): Promise<void> {
    await this.cartItems.filter({ hasText: itemName }).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
