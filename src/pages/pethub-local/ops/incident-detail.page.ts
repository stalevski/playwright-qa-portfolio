import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class OpsIncidentDetailPage extends BasePage {
  readonly heroHeading: Locator;
  readonly briefHeading: Locator;
  readonly liveDataHeading: Locator;
  readonly validationPathHeading: Locator;
  readonly validationTable: Locator;

  constructor(page: Page) {
    super(page);
    this.heroHeading = page.locator('section.hero h1');
    this.briefHeading = page.getByRole('heading', { name: 'Investigation brief' });
    this.liveDataHeading = page.getByRole('heading', { name: 'Relevant live data' });
    this.validationPathHeading = page.getByRole('heading', { name: 'Suggested validation path' });
    this.validationTable = this.validationPathHeading.locator('..').locator('table');
  }

  async goto(slug: string): Promise<void> {
    await this.visit(`/ops/incidents/${slug}`);
  }

  async assertLoaded(title: string): Promise<void> {
    await expect(this.heroHeading).toHaveText(title);
    await expect(this.briefHeading).toBeVisible();
    await expect(this.liveDataHeading).toBeVisible();
    await expect(this.validationTable).toBeVisible();
  }
}
