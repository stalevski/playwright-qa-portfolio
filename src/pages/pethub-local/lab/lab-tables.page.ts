import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The searchable, sortable data-table challenge page. */
export class LabTablesPage extends BasePage {
  readonly table: Locator;
  readonly search: Locator;
  readonly rows: Locator;
  readonly empty: Locator;
  readonly sortName: Locator;
  readonly sortRole: Locator;
  readonly sortAmount: Locator;

  constructor(page: Page) {
    super(page);
    this.table = page.getByTestId('data-table');
    this.search = page.getByTestId('table-search');
    this.rows = page.getByTestId('table-row');
    this.empty = page.getByTestId('table-empty');
    this.sortName = page.getByTestId('sort-name');
    this.sortRole = page.getByTestId('sort-role');
    this.sortAmount = page.getByTestId('sort-amount');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/tables');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.table);
  }

  async filter(term: string): Promise<void> {
    await this.search.fill(term);
  }

  visibleNames(): Promise<string[]> {
    return this.textContents(this.rows.locator('[data-test="cell-name"]').filter({ visible: true }));
  }

  async amounts(): Promise<number[]> {
    const values = await this.textContents(this.rows.locator('[data-test="cell-amount"]'));
    return values.map(Number);
  }

  async sortByName(): Promise<void> {
    await this.click(this.sortName);
  }

  async sortByAmount(): Promise<void> {
    await this.click(this.sortAmount);
  }
}
