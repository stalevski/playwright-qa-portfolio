import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export class OpsComparisonsPage extends BasePage {
  readonly heading: Locator;
  readonly sourceOrdersHeading: Locator;
  readonly readModelLedgerHeading: Locator;
  readonly billingReplicaHeading: Locator;
  readonly signalsTable: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Cross-system comparisons' });
    this.sourceOrdersHeading = page.getByRole('heading', { name: 'Source orders' });
    this.readModelLedgerHeading = page.getByRole('heading', { name: 'Read model ledger' });
    this.billingReplicaHeading = page.getByRole('heading', { name: 'Billing replica' });
    this.signalsTable = page.getByRole('heading', { name: 'Signals to investigate' }).locator('..').locator('table');
  }

  async goto(): Promise<void> {
    await this.visit('/ops/comparisons');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.sourceOrdersHeading).toBeVisible();
    await expect(this.readModelLedgerHeading).toBeVisible();
    await expect(this.billingReplicaHeading).toBeVisible();
    await expect(this.signalsTable).toBeVisible();
  }

  async assertSignalPresent(signalName: string): Promise<void> {
    await expect(this.signalsTable).toContainText(signalName);
  }
}
