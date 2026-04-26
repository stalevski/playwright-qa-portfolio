import { expect, type Locator, type Page } from '@playwright/test';

export class SauceDemoMenuComponent {
  readonly burgerMenuButton: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(private readonly page: Page) {
    this.burgerMenuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  async open(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.burgerMenuButton.click();

      try {
        await expect(this.logoutLink).toBeVisible({ timeout: 1_000 });
        return;
      } catch {
        // retry
      }
    }

    await expect(this.logoutLink).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.open();
    await expect(this.logoutLink).toBeVisible();
    await this.logoutLink.evaluate((element) => {
      (element as HTMLElement).click();
    });
  }

  async resetAppState(): Promise<void> {
    await this.open();
    await expect(this.resetAppStateLink).toBeVisible();
    await this.resetAppStateLink.evaluate((element) => {
      (element as HTMLElement).click();
    });
  }
}
