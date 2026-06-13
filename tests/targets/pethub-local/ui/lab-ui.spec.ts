import { test, expect } from '@pethub-local-fixtures';

/**
 * UI coverage for the QA Test Lab. Each describe targets one challenge page and
 * exercises the interaction patterns automation engineers practise most:
 * client validation, async loading, dialogs, table search/sort, widgets,
 * iframes and shadow DOM.
 */
test.describe('QA Test Lab UI', () => {
  test.describe('Overview', () => {
    test('lists every challenge and navigates to one', { tag: '@smoke' }, async ({ labHomePage, page }) => {
      await labHomePage.goto();
      await labHomePage.assertLoaded();
      await labHomePage.openCard('forms');
      await expect(page).toHaveURL(/\/lab\/forms$/);
    });
  });

  test.describe('Forms', () => {
    test('shows a success banner when valid', async ({ labFormsPage }) => {
      await labFormsPage.goto();
      await labFormsPage.assertLoaded();
      await labFormsPage.fillValid({ name: 'Ada', email: 'ada@example.com', password: 'secret1' });
      await labFormsPage.submitForm();
      await expect(labFormsPage.success).toBeVisible();
      await expect(labFormsPage.success).toHaveText('Form submitted successfully');
    });

    test('reports validation errors when incomplete', async ({ labFormsPage }) => {
      await labFormsPage.goto();
      await labFormsPage.submitForm();
      await expect(labFormsPage.error).toBeVisible();
      await expect(labFormsPage.result).toContainText('Name is required');
    });
  });

  test.describe('Dynamic content', () => {
    test('loads deferred content after a spinner', async ({ labDynamicPage }) => {
      await labDynamicPage.goto();
      await labDynamicPage.loadContent();
      await expect(labDynamicPage.loading).toBeVisible();
      await expect(labDynamicPage.content).toBeVisible();
      await expect(labDynamicPage.loading).toBeHidden();
    });

    test('adds and removes elements', async ({ labDynamicPage }) => {
      await labDynamicPage.goto();
      await labDynamicPage.addRow();
      await labDynamicPage.addRow();
      await expect(labDynamicPage.addedElements).toHaveCount(2);
      await labDynamicPage.addedElements.first().click();
      await expect(labDynamicPage.addedElements).toHaveCount(1);
    });

    test('enables a disabled input', async ({ labDynamicPage }) => {
      await labDynamicPage.goto();
      await expect(labDynamicPage.input).toBeDisabled();
      await labDynamicPage.toggleInput();
      await expect(labDynamicPage.input).toBeEnabled();
      await expect(labDynamicPage.enableState).toHaveText('enabled');
    });
  });

  test.describe('Dialogs', () => {
    test('handles an alert', async ({ labDialogsPage, page }) => {
      await labDialogsPage.goto();
      page.once('dialog', (dialog) => dialog.accept());
      await labDialogsPage.triggerAlert();
      await expect(labDialogsPage.result).toHaveText('You clicked an alert');
    });

    test('handles a dismissed confirm', async ({ labDialogsPage, page }) => {
      await labDialogsPage.goto();
      page.once('dialog', (dialog) => dialog.dismiss());
      await labDialogsPage.triggerConfirm();
      await expect(labDialogsPage.result).toHaveText('You chose Cancel');
    });

    test('handles a prompt with text', async ({ labDialogsPage, page }) => {
      await labDialogsPage.goto();
      page.once('dialog', (dialog) => dialog.accept('hello lab'));
      await labDialogsPage.triggerPrompt();
      await expect(labDialogsPage.result).toHaveText('You entered: hello lab');
    });
  });

  test.describe('Tables', () => {
    test('filters rows by search term', async ({ labTablesPage }) => {
      await labTablesPage.goto();
      await labTablesPage.filter('Engineer');
      const names = await labTablesPage.visibleNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('Ada Lovelace');
      expect(names).not.toContain('Grace Hopper');
    });

    test('sorts by amount ascending', async ({ labTablesPage }) => {
      await labTablesPage.goto();
      await labTablesPage.sortByAmount();
      const numeric = await labTablesPage.amounts();
      expect(numeric).toEqual([...numeric].sort((a, b) => a - b));
    });

    test('shows an empty state when nothing matches', async ({ labTablesPage }) => {
      await labTablesPage.goto();
      await labTablesPage.filter('zzz-nothing');
      await expect(labTablesPage.empty).toBeVisible();
    });
  });

  test.describe('Widgets', () => {
    test('switches tabs', async ({ labWidgetsPage }) => {
      await labWidgetsPage.goto();
      await expect(labWidgetsPage.panel(1)).toBeVisible();
      await labWidgetsPage.selectTab(2);
      await expect(labWidgetsPage.panel(2)).toBeVisible();
      await expect(labWidgetsPage.panel(1)).toBeHidden();
      await expect(labWidgetsPage.tab(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('opens and closes the modal', async ({ labWidgetsPage }) => {
      await labWidgetsPage.goto();
      await labWidgetsPage.openModal.click();
      await expect(labWidgetsPage.modal).toBeVisible();
      await labWidgetsPage.closeModal.click();
      await expect(labWidgetsPage.modal).toBeHidden();
    });

    test('drives the progress bar to 100%', async ({ labWidgetsPage }) => {
      await labWidgetsPage.goto();
      await labWidgetsPage.startProgress();
      await expect(labWidgetsPage.progressValue).toHaveText('100');
      await expect(labWidgetsPage.progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    test('reveals a tooltip on hover', async ({ labWidgetsPage }) => {
      await labWidgetsPage.goto();
      await expect(labWidgetsPage.tooltip).toBeHidden();
      await labWidgetsPage.hoverTarget.hover();
      await expect(labWidgetsPage.tooltip).toBeVisible();
    });

    test('captures the last key press', async ({ labWidgetsPage }) => {
      await labWidgetsPage.goto();
      await labWidgetsPage.keyInput.click();
      await labWidgetsPage.keyInput.press('a');
      await expect(labWidgetsPage.keyDisplay).toHaveText('a');
    });
  });

  test.describe('Menus and dropdowns', () => {
    test('reflects native single and multiple selections', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await labMenusPage.assertLoaded();
      await labMenusPage.selectNative('cat');
      await expect(labMenusPage.nativeResult).toHaveText('cat');
      await labMenusPage.selectMultiple(['grooming', 'training']);
      await expect(labMenusPage.multiResult).toHaveText('grooming, training');
    });

    test('repopulates the dependent city dropdown', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await labMenusPage.chooseCountry('us');
      await expect(labMenusPage.cascadeResult).toHaveText('New York, US');
      await labMenusPage.chooseCity('Austin');
      await expect(labMenusPage.cascadeResult).toHaveText('Austin, US');
    });

    test('selects from a custom ARIA listbox and closes it', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await labMenusPage.pickCustomPriority('high');
      await expect(labMenusPage.customLabel).toHaveText('High');
      await expect(labMenusPage.customResult).toHaveText('High');
      await expect(labMenusPage.customListbox).toBeHidden();
      await expect(labMenusPage.customDropdown).toHaveAttribute('aria-expanded', 'false');
    });

    test('runs an action from the action menu', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await labMenusPage.chooseAction('archive');
      await expect(labMenusPage.actionResult).toHaveText('Archive');
      await expect(labMenusPage.actionMenu).toBeHidden();
    });

    test('opens a context menu on right-click', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await expect(labMenusPage.contextMenu).toBeHidden();
      await labMenusPage.openContextMenu();
      await expect(labMenusPage.contextMenu).toBeVisible();
      await labMenusPage.contextItem('copy').click();
      await expect(labMenusPage.contextResult).toHaveText('Copy');
      await expect(labMenusPage.contextMenu).toBeHidden();
    });

    test('navigates through a flyout submenu', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await labMenusPage.menuTop('products').click();
      await expect(labMenusPage.submenu('products')).toBeVisible();
      await labMenusPage.submenuItem('dogs').click();
      await expect(labMenusPage.flyoutResult).toHaveText('Dogs');
      await expect(labMenusPage.submenu('products')).toBeHidden();
    });

    test('toggles the hamburger menu', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await expect(labMenusPage.hamburgerMenu).toBeHidden();
      await labMenusPage.openHamburger();
      await expect(labMenusPage.hamburgerMenu).toBeVisible();
      await expect(labMenusPage.hamburgerToggle).toHaveAttribute('aria-expanded', 'true');
      await labMenusPage.openHamburger();
      await expect(labMenusPage.hamburgerMenu).toBeHidden();
    });

    test('runs the default and alternate split-button actions', async ({ labMenusPage }) => {
      await labMenusPage.goto();
      await labMenusPage.splitPrimary.click();
      await expect(labMenusPage.splitResult).toHaveText('Save');
      await labMenusPage.chooseSplitOption('draft');
      await expect(labMenusPage.splitResult).toHaveText('Save as draft');
      await expect(labMenusPage.splitMenu).toBeHidden();
    });
  });

  test.describe('Frames', () => {
    test('interacts with content inside the iframe', async ({ labFramesPage }) => {
      await labFramesPage.goto();
      await labFramesPage.assertLoaded();
      await expect(labFramesPage.innerMessage()).toHaveText('Initial frame message');
      await labFramesPage.clickInnerButton();
      await expect(labFramesPage.innerMessage()).toHaveText('Updated from inside the frame');
    });
  });

  test.describe('Shadow DOM', () => {
    test('reaches into an open shadow root', async ({ labShadowDomPage }) => {
      await labShadowDomPage.goto();
      await labShadowDomPage.assertLoaded();
      await expect(labShadowDomPage.heading).toHaveText('Inside shadow DOM');
      await labShadowDomPage.revealMessage();
      await expect(labShadowDomPage.message).toHaveText('Shadow message revealed');
    });
  });
});
