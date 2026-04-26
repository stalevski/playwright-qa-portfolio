import { test, expect } from '@sauce-demo-fixtures';
import { sauceDemoPassword, sauceDemoProductIds, sauceDemoProducts, sauceDemoUsers } from '@helpers/test-data';

test.describe('Sauce Demo UI', () => {
  test.describe('Login', () => {
    test('logs in successfully with the standard user', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.assertLoaded();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();
      expect(await sauceDemoInventoryPage.getItemCount()).toBeGreaterThan(0);
    });

    test('shows an error for a locked out user', async ({ sauceDemoLoginPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.lockedOut, sauceDemoPassword);
      await sauceDemoLoginPage.assertErrorContains('Sorry, this user has been locked out.');
    });

    test('shows an error for invalid credentials', async ({ sauceDemoLoginPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login('unknown_user', 'wrong_password');
      await sauceDemoLoginPage.assertErrorContains('Username and password do not match any user in this service');
    });

    test('requires username when password is empty', async ({ sauceDemoLoginPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login('', '');
      await sauceDemoLoginPage.assertErrorContains('Username is required');
    });

    test('requires password when username is filled', async ({ sauceDemoLoginPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, '');
      await sauceDemoLoginPage.assertErrorContains('Password is required');
    });

    test('problem_user still reaches the inventory page', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.problem, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();
    });

    test('performance_glitch_user eventually reaches the inventory page', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
    }) => {
      test.slow();
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.performanceGlitch, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();
    });
  });

  test.describe('Inventory', () => {
    test('opens product details from inventory', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.assertLoaded(sauceDemoProducts.backpack);
    });

    test('sorts inventory by name A to Z', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('az');
      const names = await sauceDemoInventoryPage.getItemNames();
      const expected = [...names].sort((left, right) => left.localeCompare(right));
      expect(names).toEqual(expected);
    });

    test('sorts inventory by name Z to A', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('za');
      const names = await sauceDemoInventoryPage.getItemNames();
      const expected = [...names].sort((left, right) => right.localeCompare(left));
      expect(names).toEqual(expected);
    });

    test('sorts inventory by price low to high', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('lohi');
      const prices = await sauceDemoInventoryPage.getPrices();
      const expected = [...prices].sort((left, right) => left - right);
      expect(prices).toEqual(expected);
    });

    test('sorts inventory by price high to low', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.sortBy('hilo');
      const prices = await sauceDemoInventoryPage.getPrices();
      const expected = [...prices].sort((left, right) => right - left);
      expect(prices).toEqual(expected);
    });

    test('adds and removes products from the cart and updates the badge', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.assertCartBadgeCount(2);
      await sauceDemoInventoryPage.removeItemFromCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.removeItemFromCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });
  });

  test.describe('Product details page', () => {
    test('adds the item to the cart from the details page', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.addToCart();
      await sauceDemoProductDetailsPage.backToProducts();
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
    });

    test('removes the item from the cart via the details page', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.removeFromCart();
      await sauceDemoProductDetailsPage.backToProducts();
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });

    test('back-to-products returns to the inventory', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoProductDetailsPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.backpack);
      await sauceDemoProductDetailsPage.backToProducts();
      await sauceDemoInventoryPage.assertLoaded();
    });
  });

  test.describe('Cart page', () => {
    test('removes an item from the cart page and clears the badge', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
      await sauceDemoCartPage.removeItem(sauceDemoProducts.backpack);
      expect(await sauceDemoCartPage.getItemCount()).toBe(0);
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });

    test('continue shopping returns to the inventory with the cart intact', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.continueShopping();
      await sauceDemoInventoryPage.assertLoaded();
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
    });
  });

  test.describe('Checkout', () => {
    test('completes checkout for a single item', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
      sauceDemoCheckoutCompletePage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Ivan', 'Stalevski', '1000');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      const itemTotal = await sauceDemoCheckoutOverviewPage.getItemTotal();
      const tax = await sauceDemoCheckoutOverviewPage.getTax();
      const total = await sauceDemoCheckoutOverviewPage.getTotal();
      expect(total).toBeCloseTo(itemTotal + tax, 2);
      await sauceDemoCheckoutOverviewPage.finish();
      await sauceDemoCheckoutCompletePage.assertLoaded();
      await sauceDemoCheckoutCompletePage.backHome();
      await sauceDemoInventoryPage.assertLoaded();
    });

    test('multi-item checkout sums line prices into the item total', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.bikeLight);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack, sauceDemoProducts.bikeLight]);
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Ivan', 'Stalevski', '1000');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      const lineTotals = await sauceDemoCheckoutOverviewPage.getItemPrices();
      const itemTotal = await sauceDemoCheckoutOverviewPage.getItemTotal();
      const tax = await sauceDemoCheckoutOverviewPage.getTax();
      const total = await sauceDemoCheckoutOverviewPage.getTotal();
      const sumOfLines = lineTotals.reduce((sum, value) => sum + value, 0);
      expect(lineTotals).toHaveLength(2);
      expect(itemTotal).toBeCloseTo(sumOfLines, 2);
      expect(total).toBeCloseTo(itemTotal + tax, 2);
    });

    for (const scenario of [
      { firstName: '', lastName: '', postalCode: '', error: 'First Name is required' },
      { firstName: 'Ivan', lastName: '', postalCode: '', error: 'Last Name is required' },
      { firstName: 'Ivan', lastName: 'Stalevski', postalCode: '', error: 'Postal Code is required' },
    ]) {
      test(`checkout information requires ${scenario.error.replace(' is required', '')}`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
        sauceDemoCartPage,
        sauceDemoCheckoutInformationPage,
      }) => {
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
        await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
        await sauceDemoInventoryPage.openCart();
        await sauceDemoCartPage.checkout();
        await sauceDemoCheckoutInformationPage.fillInformation(
          scenario.firstName,
          scenario.lastName,
          scenario.postalCode,
        );
        await sauceDemoCheckoutInformationPage.continue();
        await sauceDemoCheckoutInformationPage.assertErrorContains(scenario.error);
      });
    }

    test('cancel on information page returns to cart with items intact', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.cancel();
      await sauceDemoCartPage.assertContainsItems([sauceDemoProducts.backpack]);
    });

    test('cancel on overview page returns to the inventory', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Ivan', 'Stalevski', '1000');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      await sauceDemoCheckoutOverviewPage.cancel();
      await sauceDemoInventoryPage.assertLoaded();
    });
  });

  test.describe('Menu', () => {
    test('resets app state from the menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.assertCartBadgeCount(1);
      await sauceDemoInventoryPage.menu.resetAppState();
      await sauceDemoInventoryPage.assertCartBadgeHidden();
    });

    test('logs out from the burger menu', async ({ sauceDemoLoginPage, sauceDemoInventoryPage }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.standard, sauceDemoPassword);
      await sauceDemoInventoryPage.menu.logout();
      await sauceDemoLoginPage.assertLoaded();
    });
  });

  test.describe('Session protection', () => {
    test('blocks direct access to /inventory.html without a session', async ({ page, sauceDemoInventoryPage }) => {
      await page.goto('/inventory.html');
      await expect(sauceDemoInventoryPage.inventoryContainer).toBeHidden();
    });
  });

  test.describe('Known defects', () => {
    /**
     * Each test below pins a defect documented in `docs/sauce-demo-bugs.md`.
     * They assert the **current buggy behaviour**, so they pass today and will
     * start failing if the live site is ever fixed — at which point the test
     * (and the catalogue) need updating.
     */

    // PU-2 + EU-1: inventory sort dropdown does not reorder items
    for (const username of [sauceDemoUsers.problem, sauceDemoUsers.error] as const) {
      test(`${username}: inventory sort dropdown does not actually reorder items (PU-2 / EU-1)`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
      }) => {
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(username, sauceDemoPassword);
        await sauceDemoInventoryPage.assertLoaded();

        const initialNames = await sauceDemoInventoryPage.getItemNames();
        const initialPrices = await sauceDemoInventoryPage.getPrices();
        expect(initialNames.length).toBeGreaterThan(1);
        expect(initialNames).not.toEqual([...initialNames].reverse());

        await sauceDemoInventoryPage.sortBy('za');
        expect(await sauceDemoInventoryPage.getItemNames()).toEqual(initialNames);

        await sauceDemoInventoryPage.sortBy('az');
        expect(await sauceDemoInventoryPage.getItemNames()).toEqual(initialNames);

        await sauceDemoInventoryPage.sortBy('hilo');
        expect(await sauceDemoInventoryPage.getPrices()).toEqual(initialPrices);

        await sauceDemoInventoryPage.sortBy('lohi');
        expect(await sauceDemoInventoryPage.getPrices()).toEqual(initialPrices);
      });
    }

    // CU-1: Reset App State leaves per-item Remove buttons stale on every user that can log in.
    // For problem_user / error_user, only the 3 items whose Add button works are pinned
    // (Backpack, Bike Light, Onesie); the other 3 silently fail to add (PU-4 / EU-4).
    const allProducts = Object.values(sauceDemoProducts);
    const workingForBuggy = [sauceDemoProducts.backpack, sauceDemoProducts.bikeLight, sauceDemoProducts.onesie];
    const itemsAddableByUser = {
      [sauceDemoUsers.standard]: allProducts,
      [sauceDemoUsers.visual]: allProducts,
      [sauceDemoUsers.problem]: workingForBuggy,
      [sauceDemoUsers.error]: workingForBuggy,
    } as const;

    for (const [username, addableItems] of Object.entries(itemsAddableByUser)) {
      test(`${username}: reset app state does not clear per-item button state (CU-1)`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
      }) => {
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(username, sauceDemoPassword);
        await sauceDemoInventoryPage.assertLoaded();

        for (const item of addableItems) {
          await sauceDemoInventoryPage.cartButtonOf(item).click();
          await sauceDemoInventoryPage.assertItemInCart(item);
        }
        await sauceDemoInventoryPage.assertCartBadgeCount(addableItems.length);

        await sauceDemoInventoryPage.menu.resetAppState();
        await sauceDemoInventoryPage.assertCartBadgeHidden();

        for (const item of addableItems) {
          await sauceDemoInventoryPage.assertItemInCart(item);
        }
      });
    }

    // PU-3: typing into Last Name on the checkout-information page writes into
    // First Name (cross-binding) for problem_user. First Name typing does NOT
    // bleed into Last Name (binding is one-directional).
    test('problem_user: checkout last-name input clobbers the first-name field (PU-3)', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.problem, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();

      await sauceDemoCheckoutInformationPage.firstNameInput.fill('Diag');
      await expect(sauceDemoCheckoutInformationPage.firstNameInput).toHaveValue('Diag');

      await sauceDemoCheckoutInformationPage.lastNameInput.fill('Nostic');

      // Bug: typing into lastName actually wrote into firstName, and lastName stayed empty.
      await expect(sauceDemoCheckoutInformationPage.firstNameInput).toHaveValue('Nostic');
      await expect(sauceDemoCheckoutInformationPage.lastNameInput).toHaveValue('');

      // Sanity: the cross-binding is one-directional. Typing into firstName does not bleed back into lastName.
      await sauceDemoCheckoutInformationPage.lastNameInput.fill('');
      await sauceDemoCheckoutInformationPage.firstNameInput.fill('Cross');
      await expect(sauceDemoCheckoutInformationPage.lastNameInput).toHaveValue('');

      // And a full submission with all fields filled still fails on Last Name validation.
      await sauceDemoCheckoutInformationPage.fillInformation('Diag', 'Nostic', '12345');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutInformationPage.assertErrorContains('Last Name is required');
      await expect(sauceDemoCheckoutInformationPage.continueButton).toBeVisible();
    });

    // PU-4 + EU-4: Add to cart silently fails on Bolt T-Shirt, Fleece Jacket, TATT.
    for (const username of [sauceDemoUsers.problem, sauceDemoUsers.error] as const) {
      test(`${username}: Add to cart silently fails on Bolt T-Shirt / Fleece Jacket / TATT (PU-4 / EU-4)`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
      }) => {
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(username, sauceDemoPassword);
        await sauceDemoInventoryPage.assertLoaded();

        const broken = [
          sauceDemoProducts.boltTShirt,
          sauceDemoProducts.fleeceJacket,
          sauceDemoProducts.testAllTheThings,
        ];
        for (const item of broken) {
          await sauceDemoInventoryPage.cartButtonOf(item).click();
          await sauceDemoInventoryPage.assertItemNotInCart(item);
        }
        await sauceDemoInventoryPage.assertCartBadgeHidden();

        // Sanity: the three items that DO work (Backpack, Bike Light, Onesie) still flip to Remove.
        const working = [sauceDemoProducts.backpack, sauceDemoProducts.bikeLight, sauceDemoProducts.onesie];
        for (const item of working) {
          await sauceDemoInventoryPage.cartButtonOf(item).click();
          await sauceDemoInventoryPage.assertItemInCart(item);
        }
        await sauceDemoInventoryPage.assertCartBadgeCount(working.length);
      });
    }

    // PU-5 + EU-5: Remove button on inventory page is non-functional.
    for (const username of [sauceDemoUsers.problem, sauceDemoUsers.error] as const) {
      test(`${username}: Remove button on inventory page is non-functional (PU-5 / EU-5)`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
      }) => {
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(username, sauceDemoPassword);
        await sauceDemoInventoryPage.assertLoaded();

        // Add the three items that DO add successfully on these users.
        for (const item of [sauceDemoProducts.backpack, sauceDemoProducts.bikeLight, sauceDemoProducts.onesie]) {
          await sauceDemoInventoryPage.cartButtonOf(item).click();
          await sauceDemoInventoryPage.assertItemInCart(item);
        }
        await sauceDemoInventoryPage.assertCartBadgeCount(3);

        // Now click Remove on each. Bug: button stays as Remove, badge stays at 3.
        for (const item of [sauceDemoProducts.backpack, sauceDemoProducts.bikeLight, sauceDemoProducts.onesie]) {
          await sauceDemoInventoryPage.cartButtonOf(item).click();
          await sauceDemoInventoryPage.assertItemInCart(item);
        }
        await sauceDemoInventoryPage.assertCartBadgeCount(3);
      });
    }

    // PU-6: 5 of 6 inventory item titles navigate to the NEXT item's id (id+1).
    const offByOneItems = [
      { name: sauceDemoProducts.bikeLight, expectedStandardId: 0, observedClickId: 1 },
      { name: sauceDemoProducts.boltTShirt, expectedStandardId: 1, observedClickId: 2 },
      { name: sauceDemoProducts.onesie, expectedStandardId: 2, observedClickId: 3 },
      { name: sauceDemoProducts.testAllTheThings, expectedStandardId: 3, observedClickId: 4 },
      { name: sauceDemoProducts.backpack, expectedStandardId: 4, observedClickId: 5 },
    ] as const;

    for (const item of offByOneItems) {
      test(`problem_user: clicking '${item.name}' opens id=${item.observedClickId} instead of id=${item.expectedStandardId} (PU-6)`, async ({
        sauceDemoLoginPage,
        sauceDemoInventoryPage,
        page,
      }) => {
        expect(sauceDemoProductIds[item.name]).toBe(item.expectedStandardId);
        await sauceDemoLoginPage.goto();
        await sauceDemoLoginPage.login(sauceDemoUsers.problem, sauceDemoPassword);
        await sauceDemoInventoryPage.assertLoaded();
        await sauceDemoInventoryPage.openItemDetails(item.name);
        await page.waitForURL('**/inventory-item.html**');
        await expect(page).toHaveURL(new RegExp(`id=${item.observedClickId}\\b`));
        await expect(page).not.toHaveURL(new RegExp(`id=${item.expectedStandardId}\\b`));
      });
    }

    // PU-6 edge: clicking Fleece Jacket (id=5) rolls into id=6 which doesn't exist; the 404 placeholder image is rendered.
    test("problem_user: clicking 'Sauce Labs Fleece Jacket' opens id=6 and renders the 404 placeholder (PU-6 edge)", async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      page,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.problem, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();
      await sauceDemoInventoryPage.openItemDetails(sauceDemoProducts.fleeceJacket);
      await page.waitForURL('**/inventory-item.html**');
      await expect(page).toHaveURL(/id=6\b/);
      await expect(page.locator('.inventory_details_img').first()).toHaveAttribute('src', /sl-404\./);
    });

    // EU-2 / EU-6: error_user form skips Last Name validation entirely and advances with empty lastName.
    test('error_user: checkout form skips last-name validation and advances with empty lastName (EU-2 / EU-6)', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
      page,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.error, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();

      // EU-6: filling only First Name jumps straight to Postal Code error (Last Name skipped).
      await sauceDemoCheckoutInformationPage.firstNameInput.fill('Diag');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutInformationPage.assertErrorContains('Postal Code is required');

      // EU-2: filling all three fields advances even though lastName silently failed to persist.
      await sauceDemoCheckoutInformationPage.fillInformation('Diag', 'Nostic', '12345');
      await expect(sauceDemoCheckoutInformationPage.lastNameInput).toHaveValue('');
      await sauceDemoCheckoutInformationPage.continue();
      await page.waitForURL('**/checkout-step-two.html');
      await sauceDemoCheckoutOverviewPage.assertLoaded();
    });

    // EU-3: Finish on error_user throws a deliberate JS error and never reaches checkout-complete.
    test('error_user: clicking Finish triggers a JS error and never lands on checkout-complete (EU-3)', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      sauceDemoCartPage,
      sauceDemoCheckoutInformationPage,
      sauceDemoCheckoutOverviewPage,
      page,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.error, sauceDemoPassword);
      await sauceDemoInventoryPage.addItemToCart(sauceDemoProducts.backpack);
      await sauceDemoInventoryPage.openCart();
      await sauceDemoCartPage.checkout();
      await sauceDemoCheckoutInformationPage.fillInformation('Diag', 'Nostic', '12345');
      await sauceDemoCheckoutInformationPage.continue();
      await sauceDemoCheckoutOverviewPage.assertLoaded();
      await expect(page).toHaveURL(/\/checkout-step-two\.html/);

      // Race the page error against navigation. Bug: pageerror always wins.
      const pageErrorPromise = page.waitForEvent('pageerror', { timeout: 5_000 });
      await sauceDemoCheckoutOverviewPage.finish();
      const error = await pageErrorPromise;

      expect(error.message).toMatch(/is not a function/i);
      await expect(page).toHaveURL(/\/checkout-step-two\.html/);
    });

    // VU-1: visual_user inventory shows the Backpack with the 404 placeholder; the other 5 are correct.
    test('visual_user: first inventory item image is the 404 placeholder (VU-1)', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.visual, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();

      const backpackSrc = await sauceDemoInventoryPage.getItemImageSrc(sauceDemoProducts.backpack);
      expect(backpackSrc).toMatch(/sl-404\./);

      const allSrcs = await sauceDemoInventoryPage.getItemImageSrcs();
      const otherSrcs = allSrcs.filter((src) => !src.includes('sl-404'));
      expect(otherSrcs.length).toBe(allSrcs.length - 1);
    });

    // VU-2: visual_user inventory prices are randomised on every render.
    test('visual_user: inventory prices change between renders (VU-2)', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
      page,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.visual, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();

      const standardPrices = [29.99, 9.99, 15.99, 49.99, 7.99, 15.99];
      const renders: number[][] = [];
      for (let i = 0; i < 3; i += 1) {
        await page.reload();
        await sauceDemoInventoryPage.assertLoaded();
        renders.push(await sauceDemoInventoryPage.getPrices());
      }

      // None of the renders should match the real prices, and the renders should differ from each other.
      for (const r of renders) {
        expect(r).not.toEqual(standardPrices);
      }
      expect(renders[0]).not.toEqual(renders[1]);
    });

    // VU-3: visual_user sort uses real prices for ordering but renders random prices alongside each item.
    test('visual_user: sort uses real prices for ordering but displays random prices (VU-3)', async ({
      sauceDemoLoginPage,
      sauceDemoInventoryPage,
    }) => {
      await sauceDemoLoginPage.goto();
      await sauceDemoLoginPage.login(sauceDemoUsers.visual, sauceDemoPassword);
      await sauceDemoInventoryPage.assertLoaded();

      const expectedLowToHighOrder = [
        sauceDemoProducts.onesie,
        sauceDemoProducts.bikeLight,
        sauceDemoProducts.boltTShirt,
        sauceDemoProducts.testAllTheThings,
        sauceDemoProducts.backpack,
        sauceDemoProducts.fleeceJacket,
      ];

      await sauceDemoInventoryPage.sortBy('lohi');
      const namesLoHi = await sauceDemoInventoryPage.getItemNames();
      const pricesLoHi = await sauceDemoInventoryPage.getPrices();

      expect(namesLoHi).toEqual(expectedLowToHighOrder);

      // Bug: the displayed prices are NOT monotonically non-decreasing.
      const monotonicNonDecreasing = pricesLoHi.every((value, index, arr) => index === 0 || value >= arr[index - 1]);
      expect(monotonicNonDecreasing).toBeFalsy();
    });
  });
});
