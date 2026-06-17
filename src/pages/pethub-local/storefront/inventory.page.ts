import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export type StorefrontSort = 'az' | 'za' | 'lohi' | 'hilo';

export class StorefrontInventoryPage extends BasePage {
  readonly heading: Locator;
  readonly sortDropdown: Locator;
  readonly inventoryItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Available pets', exact: true });
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.inventoryItems = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByRole('link', { name: /^Cart/ });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  async goto(): Promise<void> {
    await this.visit('/shop/inventory');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.sortDropdown).toBeVisible();
  }

  async getItemCount(): Promise<number> {
    return this.itemNames.count();
  }

  async getItemNames(): Promise<string[]> {
    const values = await this.itemNames.allTextContents();
    return values.map((value) => value.trim()).filter(Boolean);
  }

  async getPrices(): Promise<number[]> {
    const values = await this.itemPrices.allTextContents();
    return values.map((value) => Number(value.trim().replace('$', '')));
  }

  async sortBy(value: StorefrontSort): Promise<void> {
    await Promise.all([
      this.page.waitForURL(new RegExp(`[?&]sort=${value}\\b`)),
      this.sortDropdown.selectOption(value),
    ]);
  }

  async addItemToCart(itemName: string): Promise<void> {
    const card = this.inventoryItems.filter({ hasText: itemName });
    await Promise.all([
      this.page.waitForURL(/\/shop\/inventory(?:\?.*)?$/),
      card.getByRole('button', { name: 'Add to cart' }).click(),
    ]);
  }

  async openItemDetails(itemName: string): Promise<void> {
    await this.itemNames.filter({ hasText: itemName }).first().click();
  }

  /** First inventory card whose category pill matches `category` (e.g. `Birds`). */
  cardOfCategory(category: string): Locator {
    return this.inventoryItems.filter({ has: this.page.getByText(category, { exact: true }) }).first();
  }

  /** Clicks "Add to cart" on the first inventory card of the given category. */
  async addFirstItemInCategory(category: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/shop\/inventory(?:\?.*)?$/),
      this.cardOfCategory(category).getByRole('button', { name: 'Add to cart' }).click(),
    ]);
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async assertCartBadgeCount(count: number): Promise<void> {
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async logout(): Promise<void> {
    await Promise.all([this.page.waitForURL(/\/shop\/?$/), this.logoutButton.click()]);
  }
}
