import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';
import { SauceDemoMenuComponent } from './components/menu.component';

export class SauceDemoInventoryPage extends BasePage {
  readonly inventoryContainer: Locator;
  readonly inventoryItems: Locator;
  readonly inventoryItemNames: Locator;
  readonly inventoryItemPrices: Locator;
  readonly shoppingCartLink: Locator;
  readonly shoppingCartBadge: Locator;
  readonly sortDropdown: Locator;
  readonly menu: SauceDemoMenuComponent;

  constructor(page: Page) {
    super(page);
    this.inventoryContainer = page.getByTestId('inventory-container');
    this.inventoryItems = page.getByTestId('inventory-item');
    this.inventoryItemNames = page.getByTestId('inventory-item-name');
    this.inventoryItemPrices = page.getByTestId('inventory-item-price');
    this.shoppingCartLink = page.getByTestId('shopping-cart-link');
    this.shoppingCartBadge = page.getByTestId('shopping-cart-badge');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.menu = new SauceDemoMenuComponent(page);
  }

  async assertLoaded(): Promise<void> {
    await expect(this.inventoryContainer).toBeVisible();
    await expect(this.shoppingCartLink).toBeVisible();
  }

  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  async getItemNames(): Promise<string[]> {
    const values = await this.inventoryItemNames.allTextContents();
    return values.map((value) => value.trim()).filter(Boolean);
  }

  async getPrices(): Promise<number[]> {
    const values = await this.inventoryItemPrices.allTextContents();
    return values.map((value) => Number(value.trim().replace('$', '')));
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(value);
  }

  async addItemToCart(itemName: string): Promise<void> {
    await this.inventoryItems.filter({ hasText: itemName }).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeItemFromCart(itemName: string): Promise<void> {
    await this.inventoryItems.filter({ hasText: itemName }).getByRole('button', { name: 'Remove' }).click();
  }

  async openItemDetails(itemName: string): Promise<void> {
    await this.inventoryItemNames.filter({ hasText: itemName }).first().click();
  }

  async openCart(): Promise<void> {
    await this.shoppingCartLink.click();
  }

  async assertCartBadgeCount(count: number): Promise<void> {
    await expect(this.shoppingCartBadge).toHaveText(String(count));
  }

  async assertCartBadgeHidden(): Promise<void> {
    await expect(this.shoppingCartBadge).toHaveCount(0);
  }
}
