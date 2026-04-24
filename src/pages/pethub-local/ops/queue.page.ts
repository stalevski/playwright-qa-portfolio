import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class OpsQueuePage extends BasePage {
  readonly heading: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Work queue', exact: true });
    this.table = page.locator('main table').first();
    this.rows = this.table.locator('tbody tr');
  }

  async goto(): Promise<void> {
    await this.visit('/ops/queue');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.table).toBeVisible();
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async assertColumnsVisible(columns: string[]): Promise<void> {
    const headerRow = this.table.locator('thead tr');
    for (const column of columns) {
      await expect(headerRow.getByText(column, { exact: true })).toBeVisible();
    }
  }
}
