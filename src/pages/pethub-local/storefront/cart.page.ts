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
    this.cartItems = page
      .locator('main section')
      .first()
      .locator('.row-between')
      .nth(1)
      .locator('xpath=ancestor::section//div[contains(@class, "row-between")]');
    this.emptyMessage = page.getByText('Your cart is currently empty');
  }

  async goto(): Promise<void> {
    await this.visit('/shop/cart');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async assertItemVisible(itemName: string): Promise<void> {
    await expect(this.page.getByText(itemName).first()).toBeVisible();
  }

  async assertEmpty(): Promise<void> {
    await expect(this.emptyMessage).toBeVisible();
  }

  async removeItem(itemName: string): Promise<void> {
    const row = this.page
      .locator('section.panel')
      .filter({ hasText: itemName })
      .locator('form[action="/shop/cart/remove"]');
    await row.getByRole('button', { name: 'Remove' }).first().click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutLink.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingLink.click();
  }
}
