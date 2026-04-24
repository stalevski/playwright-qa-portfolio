import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class OpsOverviewPage extends BasePage {
  readonly heading: Locator;
  readonly statsGrid: Locator;
  readonly recentOrdersHeading: Locator;
  readonly recentOrdersTable: Locator;
  readonly latestEventsHeading: Locator;
  readonly queueNavLink: Locator;
  readonly comparisonsNavLink: Locator;
  readonly incidentsNavLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Local workflow investigation playground' });
    this.statsGrid = page.locator('.grid.stats');
    this.recentOrdersHeading = page.getByRole('heading', { name: 'Recent workflow items' });
    this.recentOrdersTable = this.recentOrdersHeading.locator('..').locator('table');
    this.latestEventsHeading = page.getByRole('heading', { name: 'Latest events' });
    this.queueNavLink = page.getByRole('link', { name: 'Work Queue' });
    this.comparisonsNavLink = page.getByRole('link', { name: 'Comparisons' });
    this.incidentsNavLink = page.getByRole('link', { name: 'Incidents' });
  }

  async goto(): Promise<void> {
    await this.visit('/ops');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.statsGrid).toBeVisible();
    await expect(this.recentOrdersHeading).toBeVisible();
    await expect(this.latestEventsHeading).toBeVisible();
  }

  async assertStatLabelsVisible(labels: string[]): Promise<void> {
    for (const label of labels) {
      await expect(this.statsGrid.getByText(label, { exact: true })).toBeVisible();
    }
  }

  async openQueue(): Promise<void> {
    await this.queueNavLink.click();
  }

  async openComparisons(): Promise<void> {
    await this.comparisonsNavLink.click();
  }

  async openIncidents(): Promise<void> {
    await this.incidentsNavLink.click();
  }
}
