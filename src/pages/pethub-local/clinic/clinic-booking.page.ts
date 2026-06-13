import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

export type ClinicBookingDetails = {
  serviceId: string;
  vetId: string;
  date: string;
  time: string;
  ownerName: string;
  petName: string;
  email: string;
  phone?: string;
  notes?: string;
};

const slotTestId = (time: string): string => `clinic-slot-${time.replace(':', '')}`;

/** The four-step appointment-booking wizard (service & vet, date & time, details, review). */
export class ClinicBookingPage extends BasePage {
  readonly form: Locator;
  readonly stepIndicator: Locator;
  readonly wizardError: Locator;
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly confirmButton: Locator;
  readonly vetSelect: Locator;
  readonly dateInput: Locator;
  readonly ownerInput: Locator;
  readonly petInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly notesInput: Locator;
  readonly reviewService: Locator;
  readonly reviewVet: Locator;
  readonly reviewDatetime: Locator;
  readonly reviewOwner: Locator;
  readonly reviewPet: Locator;
  readonly reviewEmail: Locator;
  readonly serverError: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.getByTestId('clinic-booking-form');
    this.stepIndicator = page.getByTestId('clinic-step-indicator');
    this.wizardError = page.getByTestId('clinic-wizard-error');
    this.backButton = page.getByTestId('clinic-back');
    this.nextButton = page.getByTestId('clinic-next');
    this.confirmButton = page.getByTestId('clinic-confirm');
    this.vetSelect = page.getByTestId('clinic-vet-select');
    this.dateInput = page.getByTestId('clinic-date');
    this.ownerInput = page.getByTestId('clinic-owner');
    this.petInput = page.getByTestId('clinic-pet');
    this.emailInput = page.getByTestId('clinic-email');
    this.phoneInput = page.getByTestId('clinic-phone');
    this.notesInput = page.getByTestId('clinic-notes');
    this.reviewService = page.getByTestId('clinic-review-service');
    this.reviewVet = page.getByTestId('clinic-review-vet');
    this.reviewDatetime = page.getByTestId('clinic-review-datetime');
    this.reviewOwner = page.getByTestId('clinic-review-owner');
    this.reviewPet = page.getByTestId('clinic-review-pet');
    this.reviewEmail = page.getByTestId('clinic-review-email');
    this.serverError = page.getByTestId('clinic-error');
  }

  async goto(): Promise<void> {
    await this.visit('/clinic/book');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.nextButton);
  }

  step(index: 1 | 2 | 3 | 4): Locator {
    return this.page.getByTestId(`clinic-step-${index}`);
  }

  serviceRadio(serviceId: string): Locator {
    return this.page.getByTestId(`clinic-service-${serviceId}`);
  }

  slotRadio(time: string): Locator {
    return this.page.getByTestId(slotTestId(time));
  }

  async selectService(serviceId: string): Promise<void> {
    await this.click(this.serviceRadio(serviceId));
  }

  async selectVet(vetId: string): Promise<void> {
    await this.vetSelect.selectOption(vetId);
  }

  async fillDate(date: string): Promise<void> {
    await this.dateInput.fill(date);
  }

  async chooseSlot(time: string): Promise<void> {
    await this.click(this.slotRadio(time));
  }

  async next(): Promise<void> {
    await this.click(this.nextButton);
  }

  async back(): Promise<void> {
    await this.click(this.backButton);
  }

  async confirm(): Promise<void> {
    await this.click(this.confirmButton);
  }

  /** Walks the full wizard from step 1 to confirmation and submits the form. */
  async book(details: ClinicBookingDetails): Promise<void> {
    await this.selectService(details.serviceId);
    await this.selectVet(details.vetId);
    await this.next();
    await this.fillDate(details.date);
    await this.chooseSlot(details.time);
    await this.next();
    await this.ownerInput.fill(details.ownerName);
    await this.petInput.fill(details.petName);
    await this.emailInput.fill(details.email);
    if (details.phone) {
      await this.phoneInput.fill(details.phone);
    }
    if (details.notes) {
      await this.notesInput.fill(details.notes);
    }
    await this.next();
    await this.confirm();
  }
}
