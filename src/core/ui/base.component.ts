import type { Locator, Page } from '@playwright/test';

export abstract class BaseComponent {
  protected constructor(protected readonly page: Page) {}

  protected async forceClickIfVisible(locator: Locator): Promise<void> {
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ force: true }).catch(() => undefined);
    }
  }
}
