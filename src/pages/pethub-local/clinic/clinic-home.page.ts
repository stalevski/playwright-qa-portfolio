import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The PetHub Clinic landing page: hero, stats and service/vet listings. */
export class ClinicHomePage extends BasePage {
  readonly bookCta: Locator;
  readonly appointmentsCta: Locator;
  readonly servicesList: Locator;
  readonly vetsList: Locator;

  constructor(page: Page) {
    super(page);
    this.bookCta = page.getByTestId('clinic-book-cta');
    this.appointmentsCta = page.getByTestId('clinic-appointments-cta');
    this.servicesList = page.getByTestId('clinic-services-list');
    this.vetsList = page.getByTestId('clinic-vets-list');
  }

  async goto(): Promise<void> {
    await this.visit('/clinic');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.bookCta);
  }

  async startBooking(): Promise<void> {
    await this.click(this.bookCta);
  }
}
