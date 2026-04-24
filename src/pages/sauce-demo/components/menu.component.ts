import { expect, type Locator, type Page } from '@playwright/test';

export class SauceDemoMenuComponent {
  readonly burgerMenuButton: Locator;
  readonly burgerMenuPanel: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(private readonly page: Page) {
    this.burgerMenuButton = page.getByRole('button', { name: 'Open Menu' });
    this.burgerMenuPanel = page.locator('.bm-menu-wrap');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  async open(): Promise<void> {
    await this.burgerMenuButton.click();
    await expect(this.burgerMenuPanel).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.open();
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.open();
    await this.resetAppStateLink.click();
  }
}
