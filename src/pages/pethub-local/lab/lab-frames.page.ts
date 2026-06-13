import { type FrameLocator, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The iframe challenge page. */
export class LabFramesPage extends BasePage {
  readonly iframe: Locator;

  constructor(page: Page) {
    super(page);
    this.iframe = page.getByTestId('lab-iframe');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/frames');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.iframe);
  }

  frame(): FrameLocator {
    return this.page.frameLocator('[data-test="lab-iframe"]');
  }

  innerButton(): Locator {
    return this.frame().getByTestId('inner-button');
  }

  innerMessage(): Locator {
    return this.frame().getByTestId('inner-message');
  }

  async clickInnerButton(): Promise<void> {
    await this.innerButton().click();
  }
}
