import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

/** The interactive-widgets challenge page (tabs, accordion, modal, etc.). */
export class LabWidgetsPage extends BasePage {
  readonly openModal: Locator;
  readonly modal: Locator;
  readonly closeModal: Locator;
  readonly progressStart: Locator;
  readonly progressBar: Locator;
  readonly progressValue: Locator;
  readonly showToast: Locator;
  readonly copyButton: Locator;
  readonly copyStatus: Locator;
  readonly hoverTarget: Locator;
  readonly tooltip: Locator;
  readonly keyInput: Locator;
  readonly keyDisplay: Locator;

  constructor(page: Page) {
    super(page);
    this.openModal = page.getByTestId('open-modal');
    this.modal = page.getByTestId('modal');
    this.closeModal = page.getByTestId('close-modal');
    this.progressStart = page.getByTestId('progress-start');
    this.progressBar = page.getByTestId('progress-bar');
    this.progressValue = page.getByTestId('progress-value');
    this.showToast = page.getByTestId('show-toast');
    this.copyButton = page.getByTestId('copy-button');
    this.copyStatus = page.getByTestId('copy-status');
    this.hoverTarget = page.getByTestId('hover-target');
    this.tooltip = page.getByTestId('tooltip');
    this.keyInput = page.getByTestId('key-input');
    this.keyDisplay = page.getByTestId('key-display');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/widgets');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.openModal);
  }

  tab(index: 1 | 2 | 3): Locator {
    return this.page.getByTestId(`tab-${index}`);
  }

  panel(index: 1 | 2 | 3): Locator {
    return this.page.getByTestId(`panel-${index}`);
  }

  accordionTrigger(index: 1 | 2): Locator {
    return this.page.getByTestId(`accordion-${index}`);
  }

  accordionPanel(index: 1 | 2): Locator {
    return this.page.getByTestId(`accordion-panel-${index}`);
  }

  async selectTab(index: 1 | 2 | 3): Promise<void> {
    await this.click(this.tab(index));
  }

  async startProgress(): Promise<void> {
    await this.click(this.progressStart);
  }
}
