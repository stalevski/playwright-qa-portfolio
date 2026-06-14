import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

type ZCard = 'a' | 'b' | 'c';

/**
 * The popups-and-layers challenge page: an anchored popover, an auto-dismissing
 * notification stack, a cookie-consent banner, a slide-in drawer, nested modals
 * and a reorderable z-index stack.
 */
export class LabOverlaysPage extends BasePage {
  readonly popoverTrigger: Locator;
  readonly popover: Locator;
  readonly popoverClose: Locator;
  readonly notifyButton: Locator;
  readonly notifyClear: Locator;
  readonly notifyCount: Locator;
  readonly toastStack: Locator;
  readonly toasts: Locator;
  readonly cookieShow: Locator;
  readonly cookieBanner: Locator;
  readonly cookieChoice: Locator;
  readonly cookieAccept: Locator;
  readonly cookieDecline: Locator;
  readonly drawerOpen: Locator;
  readonly drawer: Locator;
  readonly drawerBackdrop: Locator;
  readonly drawerClose: Locator;
  readonly layerOpen1: Locator;
  readonly layerOpen2: Locator;
  readonly layerClose1: Locator;
  readonly layerClose2: Locator;
  readonly layerModal1: Locator;
  readonly layerModal2: Locator;
  readonly layerDepth: Locator;
  readonly zstack: Locator;
  readonly zstackFront: Locator;

  constructor(page: Page) {
    super(page);
    this.popoverTrigger = page.getByTestId('popover-trigger');
    this.popover = page.getByTestId('popover');
    this.popoverClose = page.getByTestId('popover-close');
    this.notifyButton = page.getByTestId('notify-button');
    this.notifyClear = page.getByTestId('notify-clear');
    this.notifyCount = page.getByTestId('notify-count');
    this.toastStack = page.getByTestId('toast-stack');
    this.toasts = page.getByTestId('toast');
    this.cookieShow = page.getByTestId('cookie-show');
    this.cookieBanner = page.getByTestId('cookie-banner');
    this.cookieChoice = page.getByTestId('cookie-choice');
    this.cookieAccept = page.getByTestId('cookie-accept');
    this.cookieDecline = page.getByTestId('cookie-decline');
    this.drawerOpen = page.getByTestId('drawer-open');
    this.drawer = page.getByTestId('drawer');
    this.drawerBackdrop = page.getByTestId('drawer-backdrop');
    this.drawerClose = page.getByTestId('drawer-close');
    this.layerOpen1 = page.getByTestId('layer-open-1');
    this.layerOpen2 = page.getByTestId('layer-open-2');
    this.layerClose1 = page.getByTestId('layer-close-1');
    this.layerClose2 = page.getByTestId('layer-close-2');
    this.layerModal1 = page.getByTestId('layer-modal-1');
    this.layerModal2 = page.getByTestId('layer-modal-2');
    this.layerDepth = page.getByTestId('layer-depth');
    this.zstack = page.getByTestId('zstack');
    this.zstackFront = page.getByTestId('zstack-front');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/overlays');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.popoverTrigger);
  }

  async togglePopover(): Promise<void> {
    await this.click(this.popoverTrigger);
  }

  async notify(): Promise<void> {
    await this.click(this.notifyButton);
  }

  async dismissAllToasts(): Promise<void> {
    await this.click(this.notifyClear);
  }

  async openDrawer(): Promise<void> {
    await this.click(this.drawerOpen);
  }

  async openFirstModal(): Promise<void> {
    await this.click(this.layerOpen1);
  }

  async openSecondModal(): Promise<void> {
    await this.click(this.layerOpen2);
  }

  zcard(card: ZCard): Locator {
    return this.page.getByTestId(`zcard-${card}`);
  }

  async bringToFront(card: ZCard): Promise<void> {
    await this.click(this.page.getByTestId(`zfront-${card}`));
  }

  /** Returns the `data-test` of the card painted on top at the stack centre. */
  async topmostCardAtCentre(): Promise<string | null> {
    // The stack is the last panel on a long page; scroll it into the viewport
    // first so the viewport-relative hit-test below targets an on-screen point.
    await this.zstack.scrollIntoViewIfNeeded();
    return this.zstack.evaluate((stack) => {
      const rect = stack.getBoundingClientRect();
      const element = document.elementFromPoint(rect.left + 150, rect.top + 90);
      const card = element?.closest('[data-test^="zcard-"]');
      return card ? card.getAttribute('data-test') : null;
    });
  }
}
