import { test } from '@pethub-local-fixtures';
import { assertNoSeriousA11yViolations } from '@helpers/a11y';

const standardUser = 'standard_user';
const password = 'secret_sauce';

test.describe('PetHub Local storefront a11y', { tag: '@a11y' }, () => {
  test('login page has no critical or serious WCAG violations', async ({ storefrontLoginPage, page }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.assertLoaded();

    await assertNoSeriousA11yViolations(page);
  });

  test('inventory page has no critical or serious WCAG violations', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    page,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.assertLoaded();

    await assertNoSeriousA11yViolations(page);
  });

  test('item details page has no critical or serious WCAG violations', async ({
    storefrontLoginPage,
    storefrontItemDetailsPage,
    page,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    // 1010 = African Grey Parrot in the canonical seed data (see apps/pethub-local/database.seed.ts)
    await storefrontItemDetailsPage.goto(1010);

    await assertNoSeriousA11yViolations(page);
  });

  test('cart page with items has no critical or serious WCAG violations', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCartPage,
    page,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.assertLoaded();
    // 'African Grey Parrot' = pet 1010 in canonical seed data (apps/pethub-local/database.seed.ts)
    await storefrontInventoryPage.addItemToCart('African Grey Parrot');
    await storefrontCartPage.goto();

    await assertNoSeriousA11yViolations(page);
  });

  test('checkout page has no critical or serious WCAG violations', async ({
    storefrontLoginPage,
    storefrontInventoryPage,
    storefrontCheckoutPage,
    page,
  }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.assertLoaded();
    await storefrontInventoryPage.addItemToCart('African Grey Parrot');
    await storefrontCheckoutPage.goto();

    await assertNoSeriousA11yViolations(page);
  });
});
