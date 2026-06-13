import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The JavaScript-dialogs challenge page (alert/confirm/prompt). */
export class LabDialogsPage extends BasePage {
  readonly alertButton: Locator;
  readonly confirmButton: Locator;
  readonly promptButton: Locator;
  readonly result: Locator;

  constructor(page: Page) {
    super(page);
    this.alertButton = page.getByTestId('dialog-alert');
    this.confirmButton = page.getByTestId('dialog-confirm');
    this.promptButton = page.getByTestId('dialog-prompt');
    this.result = page.getByTestId('dialog-result');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/dialogs');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.result);
  }

  async triggerAlert(): Promise<void> {
    await this.click(this.alertButton);
  }

  async triggerConfirm(): Promise<void> {
    await this.click(this.confirmButton);
  }

  async triggerPrompt(): Promise<void> {
    await this.click(this.promptButton);
  }
}
