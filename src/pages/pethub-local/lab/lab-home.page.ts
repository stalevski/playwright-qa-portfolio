import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** Landing page for the QA Test Lab listing every challenge. */
export class LabHomePage extends BasePage {
  readonly title: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('lab-title');
    this.cards = page.getByTestId('lab-cards');
  }

  async goto(): Promise<void> {
    await this.visit('/lab');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.title);
  }

  card(slug: string): Locator {
    return this.page.getByTestId(`lab-card-${slug}`);
  }

  async openCard(slug: string): Promise<void> {
    await this.click(this.card(slug));
  }
}
