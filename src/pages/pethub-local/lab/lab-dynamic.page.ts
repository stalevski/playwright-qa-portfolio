import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The dynamic-content challenge page (loading, add/remove, enable/disable). */
export class LabDynamicPage extends BasePage {
  readonly start: Locator;
  readonly loading: Locator;
  readonly content: Locator;
  readonly addElement: Locator;
  readonly elements: Locator;
  readonly addedElements: Locator;
  readonly toggleEnable: Locator;
  readonly input: Locator;
  readonly enableState: Locator;

  constructor(page: Page) {
    super(page);
    this.start = page.getByTestId('dynamic-start');
    this.loading = page.getByTestId('dynamic-loading');
    this.content = page.getByTestId('dynamic-content');
    this.addElement = page.getByTestId('add-element');
    this.elements = page.getByTestId('elements-container');
    this.addedElements = page.getByTestId('added-element');
    this.toggleEnable = page.getByTestId('toggle-enable');
    this.input = page.getByTestId('dynamic-input');
    this.enableState = page.getByTestId('enable-state');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/dynamic');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.start);
  }

  async loadContent(): Promise<void> {
    await this.click(this.start);
  }

  async addRow(): Promise<void> {
    await this.click(this.addElement);
  }

  async toggleInput(): Promise<void> {
    await this.click(this.toggleEnable);
  }
}
