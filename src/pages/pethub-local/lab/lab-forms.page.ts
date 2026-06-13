import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The forms-and-validation challenge page. */
export class LabFormsPage extends BasePage {
  readonly form: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly terms: Locator;
  readonly submit: Locator;
  readonly result: Locator;
  readonly success: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.getByTestId('lab-form');
    this.name = page.getByTestId('form-name');
    this.email = page.getByTestId('form-email');
    this.password = page.getByTestId('form-password');
    this.terms = page.getByTestId('form-terms');
    this.submit = page.getByTestId('form-submit');
    this.result = page.getByTestId('form-result');
    this.success = page.getByTestId('form-success');
    this.error = page.getByTestId('form-error');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/forms');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.form);
  }

  async fillValid(values: { name: string; email: string; password: string }): Promise<void> {
    await this.name.fill(values.name);
    await this.email.fill(values.email);
    await this.password.fill(values.password);
    await this.terms.check();
  }

  async submitForm(): Promise<void> {
    await this.click(this.submit);
  }
}
