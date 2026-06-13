import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The shadow-DOM challenge page with an open shadow root custom element. */
export class LabShadowDomPage extends BasePage {
  readonly host: Locator;
  readonly heading: Locator;
  readonly button: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    super(page);
    this.host = page.getByTestId('shadow-host');
    // Playwright pierces open shadow roots automatically for getByTestId.
    this.heading = page.getByTestId('shadow-heading');
    this.button = page.getByTestId('shadow-button');
    this.message = page.getByTestId('shadow-message');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/shadow-dom');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.heading);
  }

  async revealMessage(): Promise<void> {
    await this.click(this.button);
  }
}
