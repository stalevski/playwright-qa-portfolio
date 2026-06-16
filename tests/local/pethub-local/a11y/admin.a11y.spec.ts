import { test } from '@pethub-local-fixtures';
import { assertNoSeriousA11yViolations } from '@helpers/a11y';

test.describe('PetHub Local admin a11y', { tag: '@a11y' }, () => {
  test('admin dashboard has no critical or serious WCAG violations', async ({ localHomePage, page }) => {
    await localHomePage.goto();
    await localHomePage.assertLoaded();

    await assertNoSeriousA11yViolations(page);
  });
});
