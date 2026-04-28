/**
 * Accessibility test helper.
 *
 * Wraps `@axe-core/playwright` with the standard WCAG 2.0/2.1 A + AA rule
 * sets and a single assertion that fails the test if any `critical` or
 * `serious` violations are found. Lower-impact issues (`moderate`,
 * `minor`) are surfaced by Axe but not enforced - they need design or
 * content judgement and would otherwise produce noisy CI runs.
 *
 * Usage:
 *   import { assertNoSeriousA11yViolations } from '@helpers/a11y';
 *
 *   test('inventory page meets a11y baseline', async ({ page }) => {
 *     await page.goto('/shop/inventory');
 *     await assertNoSeriousA11yViolations(page);
 *   });
 *
 * Why these tags?
 *   wcag2a / wcag2aa  - Web Content Accessibility Guidelines 2.0 levels A and AA
 *   wcag21a / wcag21aa - WCAG 2.1 levels A and AA (adds touch targets, etc.)
 *
 * AA is the conformance level most public-sector and enterprise procurement
 * standards reference (e.g. EU Accessibility Act, US ADA, UK PSBAR).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export const assertNoSeriousA11yViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
};
