import { test } from '@pethub-local-fixtures';
import { assertNoSeriousA11yViolations } from '@helpers/a11y';

test.describe('PetHub Local ops portal a11y', { tag: '@a11y' }, () => {
  test('overview page has no critical or serious WCAG violations', async ({ opsOverviewPage, page }) => {
    await opsOverviewPage.goto();

    await assertNoSeriousA11yViolations(page);
  });

  test('queue page has no critical or serious WCAG violations', async ({ opsQueuePage, page }) => {
    await opsQueuePage.goto();

    await assertNoSeriousA11yViolations(page);
  });

  test('comparisons page has no critical or serious WCAG violations', async ({ opsComparisonsPage, page }) => {
    await opsComparisonsPage.goto();

    await assertNoSeriousA11yViolations(page);
  });

  test('incidents page has no critical or serious WCAG violations', async ({ opsIncidentsPage, page }) => {
    await opsIncidentsPage.goto();

    await assertNoSeriousA11yViolations(page);
  });
});
