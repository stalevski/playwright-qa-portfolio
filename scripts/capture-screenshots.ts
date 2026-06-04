/**
 * Captures README screenshots of the PetHub Local app using Playwright.
 *
 * Prerequisites:
 *   1. Start the app in another terminal: `npm run app:start`
 *   2. Run this script:                   `npm run screenshots`
 *
 * Output: PNGs are written to `docs/screenshots/`. Existing files are overwritten.
 *
 * The script resets the database before capturing so the screenshots reflect
 * the canonical seed data, then walks an authenticated storefront flow that
 * exercises inventory -> item details -> cart -> checkout -> order confirmed.
 */

import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { pethubLocalPassword, pethubLocalUsers } from '@helpers/test-data';

const BASE_URL = process.env.APP_URL ?? 'http://127.0.0.1:3000';
const OUTPUT_DIR = resolve(process.cwd(), 'docs/screenshots');
const VIEWPORT = { width: 1440, height: 900 };
const STOREFRONT_USER = { username: pethubLocalUsers.standard, password: pethubLocalPassword };

const log = (message: string): void => {
  // eslint-disable-next-line no-console -- intentional progress output
  console.log(message);
};

const ensureAppReachable = async (): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }
  } catch (error) {
    log(`Cannot reach app at ${BASE_URL}.`);
    log('Start it first with: npm run app:start');
    log(`Underlying error: ${(error as Error).message}`);
    process.exit(1);
  }
};

const resetDatabase = async (): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/admin/reset`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Database reset failed with status ${response.status}`);
  }
};

const takeShot = async (page: Page, name: string, fullPage = false): Promise<void> => {
  const path = resolve(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage, animations: 'disabled' });
  log(`  saved ${name}.png`);
};

const setTheme =
  (theme: 'dark' | 'light') =>
  async (page: Page): Promise<void> => {
    await page.addInitScript((value) => {
      window.localStorage.setItem('pethub-theme', value);
    }, theme);
  };

const captureAdmin = async (browser: Browser): Promise<void> => {
  log('Capturing admin dashboard...');

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await setTheme('dark')(page);
  await page.goto(`${BASE_URL}/`);
  await page.getByRole('heading', { name: 'PetHub Local', exact: true }).waitFor();
  await takeShot(page, '01-admin-dashboard', true);
  await context.close();
};

const captureStorefront = async (browser: Browser): Promise<void> => {
  log('Capturing storefront flow...');

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await setTheme('dark')(page);

  // 03 — login page (no session)
  await page.goto(`${BASE_URL}/shop`);
  await page.locator('[data-test="login-button"]').waitFor();
  await takeShot(page, '03-storefront-login');

  // sign in
  await page.locator('[data-test="username"]').fill(STOREFRONT_USER.username);
  await page.locator('[data-test="password"]').fill(STOREFRONT_USER.password);
  await page.locator('[data-test="login-button"]').click();
  await page.locator('[data-test="inventory-container"]').waitFor();

  // 04 — inventory (default sort A->Z)
  await takeShot(page, '04-storefront-inventory');

  // 05 — inventory sorted by price low-to-high
  await page.goto(`${BASE_URL}/shop/inventory?sort=lohi`);
  await page.locator('[data-test="inventory-container"]').waitFor();
  await takeShot(page, '05-storefront-inventory-sorted');

  // 06 — item details (African Grey Parrot, id 1010 from seed)
  await page.goto(`${BASE_URL}/shop/item/1010`);
  await page.getByRole('heading', { name: 'African Grey Parrot' }).waitFor();
  await takeShot(page, '06-storefront-item-details');

  // add three different pets to the cart so the cart screenshot shows variety
  for (const petId of [1010, 1004, 1007]) {
    await page.goto(`${BASE_URL}/shop/inventory`);
    await page
      .locator(`[data-test="inventory-item"]:has(a[href="/shop/item/${petId}"]) form[action="/shop/cart/add"] button`)
      .click();
    await page.locator('[data-test="inventory-container"]').waitFor();
  }

  // 07 — cart with 3 items
  await page.goto(`${BASE_URL}/shop/cart`);
  await page.locator('[data-test="checkout"]').waitFor();
  await takeShot(page, '07-storefront-cart');

  // proceed through checkout to capture the confirmation
  await page.locator('[data-test="checkout"]').click();
  await page.locator('[data-test="firstName"]').fill('Stefan');
  await page.locator('[data-test="lastName"]').fill('Tester');
  await page.locator('[data-test="postalCode"]').fill('1000');
  await page.locator('[data-test="continue"]').click();

  // 08 — order complete
  await page.getByRole('heading', { name: /thank/i }).waitFor();
  await takeShot(page, '08-storefront-complete');

  await context.close();
};

const captureOps = async (browser: Browser): Promise<void> => {
  log('Capturing ops portal...');

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await setTheme('dark')(page);

  await page.goto(`${BASE_URL}/ops`);
  await page.getByRole('heading', { name: /investigation playground/i }).waitFor();
  await takeShot(page, '09-ops-overview', true);

  await page.goto(`${BASE_URL}/ops/comparisons`);
  await page.getByRole('heading', { name: /cross-system comparisons/i }).waitFor();
  await takeShot(page, '10-ops-comparisons', true);

  await context.close();
};

const main = async (): Promise<void> => {
  await ensureAppReachable();
  await mkdir(OUTPUT_DIR, { recursive: true });

  log(`Resetting database via POST ${BASE_URL}/api/admin/reset...`);
  await resetDatabase();

  const browser = await chromium.launch();
  try {
    await captureAdmin(browser);
    await captureStorefront(browser);
    await captureOps(browser);
  } finally {
    await browser.close();
  }

  log(`\nAll screenshots written to ${OUTPUT_DIR}`);
};

main().catch((error: Error) => {
  // eslint-disable-next-line no-console -- intentional error output
  console.error(error);
  process.exit(1);
});
