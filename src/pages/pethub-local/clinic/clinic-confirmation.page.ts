import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The post-booking confirmation page showing the reference and a summary. */
export class ClinicConfirmationPage extends BasePage {
  readonly panel: Locator;
  readonly reference: Locator;
  readonly service: Locator;
  readonly vet: Locator;
  readonly datetime: Locator;
  readonly owner: Locator;
  readonly pet: Locator;
  readonly email: Locator;
  readonly viewAppointments: Locator;
  readonly bookAnother: Locator;
  readonly notFound: Locator;

  constructor(page: Page) {
    super(page);
    this.panel = page.getByTestId('clinic-confirmation');
    this.reference = page.getByTestId('clinic-reference');
    this.service = page.getByTestId('clinic-confirm-service');
    this.vet = page.getByTestId('clinic-confirm-vet');
    this.datetime = page.getByTestId('clinic-confirm-datetime');
    this.owner = page.getByTestId('clinic-confirm-owner');
    this.pet = page.getByTestId('clinic-confirm-pet');
    this.email = page.getByTestId('clinic-confirm-email');
    this.viewAppointments = page.getByTestId('clinic-view-appointments');
    this.bookAnother = page.getByTestId('clinic-book-another');
    this.notFound = page.getByTestId('clinic-not-found');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.panel);
  }

  async referenceText(): Promise<string> {
    return (await this.reference.textContent())?.trim() ?? '';
  }
}
