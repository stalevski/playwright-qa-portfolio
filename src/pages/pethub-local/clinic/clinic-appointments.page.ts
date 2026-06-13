import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The appointments list page: every booked appointment in a table. */
export class ClinicAppointmentsPage extends BasePage {
  readonly table: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.table = page.getByTestId('clinic-appointments-table');
    this.rows = page.getByTestId('clinic-appointment-row');
    this.emptyState = page.getByTestId('clinic-appointments-empty');
  }

  async goto(): Promise<void> {
    await this.visit('/clinic/appointments');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.table);
  }

  rowByReference(reference: string): Locator {
    return this.page.locator(`[data-test="clinic-appointment-row"][data-reference="${reference}"]`);
  }

  async references(): Promise<string[]> {
    return this.textContents(this.page.getByTestId('clinic-appointment-reference'));
  }
}
