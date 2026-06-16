import { test, expect } from '@pethub-local-fixtures';
import { pethubLocalPassword, pethubLocalUsers } from '@helpers/test-data';

/**
 * Focused coverage for storefront product-card selection — the journey from
 * picking pets on the inventory grid to what the cart actually records.
 *
 * The broad storefront flow (login, sort, single-item checkout, theme) is
 * already covered by `storefront-ui.spec.ts`, which only ever adds one pet.
 * This spec drills into the selection behaviour that was previously untested:
 * counting distinct selections, accumulating quantity for a repeated pet, the
 * cart subtotal, selecting from the item-details page, and the rule that sold
 * pets are never offered as selectable cards.
 */
test.describe('PetHub Storefront cart selection', () => {
  const standardUser = pethubLocalUsers.standard;
  const password = pethubLocalPassword;

  // Seeded pets whose status is `sold` and therefore must never appear on the
  // storefront grid (see `apps/pethub-local/database.seed.ts`).
  const soldPets = ['Persian Cat', 'Cockatiel'];

  test.beforeEach(async ({ storefrontLoginPage, storefrontInventoryPage }) => {
    await storefrontLoginPage.goto();
    await storefrontLoginPage.login(standardUser, password);
    await storefrontInventoryPage.assertLoaded();
  });

  test(
    'increments the cart badge once per distinct pet selected',
    { tag: '@critical' },
    async ({ storefrontInventoryPage }) => {
      const [first, second, third] = await storefrontInventoryPage.getItemNames();
      const startCount = await storefrontInventoryPage.getItemCount();

      await storefrontInventoryPage.addItemToCart(first);
      await storefrontInventoryPage.assertCartBadgeCount(1);

      await storefrontInventoryPage.addItemToCart(second);
      await storefrontInventoryPage.assertCartBadgeCount(2);

      await storefrontInventoryPage.addItemToCart(third);
      await storefrontInventoryPage.assertCartBadgeCount(3);

      // Selecting pets never removes their cards from the grid.
      expect(await storefrontInventoryPage.getItemCount()).toBe(startCount);
    },
  );

  test('re-selecting the same pet keeps one line and increases its quantity', async ({
    storefrontInventoryPage,
    storefrontCartPage,
  }) => {
    const [pet] = await storefrontInventoryPage.getItemNames();

    await storefrontInventoryPage.addItemToCart(pet);
    await storefrontInventoryPage.assertCartBadgeCount(1);

    // The badge counts distinct lines, so selecting the same pet again leaves it at 1.
    await storefrontInventoryPage.addItemToCart(pet);
    await storefrontInventoryPage.assertCartBadgeCount(1);

    await storefrontInventoryPage.openCart();
    await storefrontCartPage.assertLoaded();
    await storefrontCartPage.assertLineCount(1);
    expect(await storefrontCartPage.getQuantity(pet)).toBe(2);

    const unitPrice = await storefrontCartPage.getUnitPrice(pet);
    expect(await storefrontCartPage.getLineTotal(pet)).toBeCloseTo(unitPrice * 2, 2);
  });

  test('cart subtotal equals the sum of the selected pet line totals', async ({
    storefrontInventoryPage,
    storefrontCartPage,
  }) => {
    const [first, second] = await storefrontInventoryPage.getItemNames();

    await storefrontInventoryPage.addItemToCart(first);
    await storefrontInventoryPage.addItemToCart(second);

    await storefrontInventoryPage.openCart();
    await storefrontCartPage.assertLoaded();
    await storefrontCartPage.assertLineCount(2);

    const firstLineTotal = await storefrontCartPage.getLineTotal(first);
    const secondLineTotal = await storefrontCartPage.getLineTotal(second);
    // Each pet was selected once, so its line total equals its unit price.
    expect(firstLineTotal).toBeCloseTo(await storefrontCartPage.getUnitPrice(first), 2);
    expect(await storefrontCartPage.getSubtotal()).toBeCloseTo(firstLineTotal + secondLineTotal, 2);
  });

  test('adds the open pet to the cart from its details page', async ({
    storefrontInventoryPage,
    storefrontItemDetailsPage,
    storefrontCartPage,
  }) => {
    const [pet] = await storefrontInventoryPage.getItemNames();

    await storefrontInventoryPage.openItemDetails(pet);
    await storefrontItemDetailsPage.assertLoaded(pet);
    await storefrontItemDetailsPage.addToCart();

    // Adding from the details page redirects back to the grid with the cart updated.
    await storefrontInventoryPage.assertLoaded();
    await storefrontInventoryPage.assertCartBadgeCount(1);

    await storefrontInventoryPage.openCart();
    await storefrontCartPage.assertItemVisible(pet);
  });

  test('does not offer sold pets as selectable cards', async ({ storefrontInventoryPage }) => {
    const names = await storefrontInventoryPage.getItemNames();

    for (const sold of soldPets) {
      expect(names).not.toContain(sold);
    }

    // Every listed pet is selectable, i.e. exposes its own Add to cart button.
    const cardCount = await storefrontInventoryPage.inventoryItems.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let index = 0; index < cardCount; index++) {
      await expect(
        storefrontInventoryPage.inventoryItems.nth(index).getByRole('button', { name: 'Add to cart' }),
      ).toBeVisible();
    }
  });
});
