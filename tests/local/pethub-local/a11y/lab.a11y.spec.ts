import { test } from '@pethub-local-fixtures';
import { assertNoSeriousA11yViolations } from '@helpers/a11y';

/**
 * Accessibility baseline for the QA Test Lab's static surfaces. Pages are
 * checked in their initial rendered state against WCAG 2.0/2.1 A + AA; any
 * critical or serious violation fails the suite.
 */
test.describe('QA Test Lab accessibility', () => {
  const pages: { name: string; path: string }[] = [
    { name: 'overview', path: '/lab' },
    { name: 'forms', path: '/lab/forms' },
    { name: 'dynamic content', path: '/lab/dynamic' },
    { name: 'dialogs', path: '/lab/dialogs' },
    { name: 'tables', path: '/lab/tables' },
    { name: 'widgets', path: '/lab/widgets' },
    { name: 'menus', path: '/lab/menus' },
    { name: 'popups and layers', path: '/lab/overlays' },
    { name: 'frames', path: '/lab/frames' },
    { name: 'shadow DOM', path: '/lab/shadow-dom' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page meets the a11y baseline`, async ({ page }) => {
      await page.goto(path);
      await assertNoSeriousA11yViolations(page);
    });
  }
});
