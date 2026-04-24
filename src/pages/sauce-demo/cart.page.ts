import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class SauceDemoCartPage extends BasePage {
  readonly cartItemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async assertContainsItems(itemNames: string[]): Promise<void> {
    for (const itemName of itemNames) {
      await expect(this.cartItemNames.filter({ hasText: itemName })).toBeVisible();
    }
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
