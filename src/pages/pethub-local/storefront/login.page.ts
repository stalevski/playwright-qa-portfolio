import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class StorefrontLoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorBanner = page.getByTestId('error');
  }

  async goto(): Promise<void> {
    await this.visit('/shop');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await Promise.race([
      this.page.waitForURL(/\/shop\/inventory(?:\?.*)?$/),
      this.errorBanner.waitFor({ state: 'visible' }),
    ]);
  }

  async assertErrorContains(text: string): Promise<void> {
    await expect(this.errorBanner).toContainText(text);
  }
}
