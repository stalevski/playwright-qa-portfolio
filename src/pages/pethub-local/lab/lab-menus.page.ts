import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/ui/base.page';

type CustomPriority = 'low' | 'medium' | 'high' | 'critical';
type ActionItem = 'edit' | 'duplicate' | 'archive' | 'delete';
type ContextItem = 'cut' | 'copy' | 'paste';
type FlyoutMenu = 'products' | 'services';
type SplitItem = 'close' | 'draft' | 'new';

/**
 * The menus-and-dropdowns challenge page: native single/multiple selects,
 * dependent dropdowns, a custom ARIA listbox, an action menu, a right-click
 * context menu, a flyout navigation menu, a hamburger menu and a split button.
 */
export class LabMenusPage extends BasePage {
  readonly nativeSelect: Locator;
  readonly nativeResult: Locator;
  readonly multiSelect: Locator;
  readonly multiResult: Locator;
  readonly countrySelect: Locator;
  readonly citySelect: Locator;
  readonly cascadeResult: Locator;
  readonly customDropdown: Locator;
  readonly customListbox: Locator;
  readonly customLabel: Locator;
  readonly customResult: Locator;
  readonly actionMenuButton: Locator;
  readonly actionMenu: Locator;
  readonly actionResult: Locator;
  readonly contextTarget: Locator;
  readonly contextMenu: Locator;
  readonly contextResult: Locator;
  readonly flyoutResult: Locator;
  readonly hamburgerToggle: Locator;
  readonly hamburgerMenu: Locator;
  readonly splitPrimary: Locator;
  readonly splitToggle: Locator;
  readonly splitMenu: Locator;
  readonly splitResult: Locator;

  constructor(page: Page) {
    super(page);
    this.nativeSelect = page.getByTestId('native-select');
    this.nativeResult = page.getByTestId('native-select-result');
    this.multiSelect = page.getByTestId('multi-select');
    this.multiResult = page.getByTestId('multi-select-result');
    this.countrySelect = page.getByTestId('country-select');
    this.citySelect = page.getByTestId('city-select');
    this.cascadeResult = page.getByTestId('cascade-result');
    this.customDropdown = page.getByTestId('custom-dropdown');
    this.customListbox = page.getByTestId('custom-listbox');
    this.customLabel = page.getByTestId('custom-dropdown-label');
    this.customResult = page.getByTestId('custom-dropdown-result');
    this.actionMenuButton = page.getByTestId('action-menu-button');
    this.actionMenu = page.getByTestId('action-menu');
    this.actionResult = page.getByTestId('action-menu-result');
    this.contextTarget = page.getByTestId('context-target');
    this.contextMenu = page.getByTestId('context-menu');
    this.contextResult = page.getByTestId('context-menu-result');
    this.flyoutResult = page.getByTestId('flyout-result');
    this.hamburgerToggle = page.getByTestId('hamburger-toggle');
    this.hamburgerMenu = page.getByTestId('hamburger-menu');
    this.splitPrimary = page.getByTestId('split-primary');
    this.splitToggle = page.getByTestId('split-toggle');
    this.splitMenu = page.getByTestId('split-menu');
    this.splitResult = page.getByTestId('split-result');
  }

  async goto(): Promise<void> {
    await this.visit('/lab/menus');
  }

  async assertLoaded(): Promise<void> {
    await this.expectVisible(this.nativeSelect);
  }

  async selectNative(value: string): Promise<void> {
    await this.nativeSelect.selectOption(value);
  }

  async selectMultiple(values: string[]): Promise<void> {
    await this.multiSelect.selectOption(values);
  }

  async chooseCountry(value: string): Promise<void> {
    await this.countrySelect.selectOption(value);
  }

  async chooseCity(value: string): Promise<void> {
    await this.citySelect.selectOption(value);
  }

  customOption(priority: CustomPriority): Locator {
    return this.page.getByTestId(`custom-option-${priority}`);
  }

  async pickCustomPriority(priority: CustomPriority): Promise<void> {
    await this.click(this.customDropdown);
    await this.click(this.customOption(priority));
  }

  actionItem(action: ActionItem): Locator {
    return this.page.getByTestId(`action-menu-item-${action}`);
  }

  async chooseAction(action: ActionItem): Promise<void> {
    await this.click(this.actionMenuButton);
    await this.click(this.actionItem(action));
  }

  contextItem(action: ContextItem): Locator {
    return this.page.getByTestId(`context-menu-item-${action}`);
  }

  async openContextMenu(): Promise<void> {
    await this.contextTarget.click({ button: 'right' });
  }

  menuTop(menu: FlyoutMenu): Locator {
    return this.page.getByTestId(`menu-top-${menu}`);
  }

  submenu(menu: FlyoutMenu): Locator {
    return this.page.getByTestId(`submenu-${menu}`);
  }

  submenuItem(name: string): Locator {
    return this.page.getByTestId(`submenu-item-${name}`);
  }

  async openHamburger(): Promise<void> {
    await this.click(this.hamburgerToggle);
  }

  splitItem(item: SplitItem): Locator {
    return this.page.getByTestId(`split-item-${item}`);
  }

  async chooseSplitOption(item: SplitItem): Promise<void> {
    await this.click(this.splitToggle);
    await this.click(this.splitItem(item));
  }
}
