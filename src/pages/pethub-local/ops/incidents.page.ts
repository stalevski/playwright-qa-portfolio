import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class OpsIncidentsPage extends BasePage {
  readonly heading: Locator;
  readonly incidentLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Known incident patterns' });
    this.incidentLinks = page.getByRole('link', { name: 'Open detail' });
  }

  async goto(): Promise<void> {
    await this.visit('/ops/incidents');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.incidentLinks.first()).toBeVisible();
  }

  async getIncidentCount(): Promise<number> {
    return this.incidentLinks.count();
  }

  async openIncident(title: string): Promise<void> {
    const card = this.page.locator('main section').filter({ hasText: title }).first();
    await card.getByRole('link', { name: 'Open detail' }).click();
  }
}
