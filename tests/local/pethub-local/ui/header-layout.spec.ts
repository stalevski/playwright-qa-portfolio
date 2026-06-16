import { test, expect } from '@pethub-local-fixtures';
import type { Page } from '@playwright/test';

/**
 * Visual-layout regression guard for the shared two-tier header (the global app
 * bar plus each surface's section nav). It locks in the two toolbar bugs that
 * were fixed: the header used to shift when the theme was toggled (the
 * "Light mode" / "Dark mode" label resized the toggle button and reflowed the
 * row), and header buttons could overlap each other at tighter widths.
 *
 * These are geometric assertions (bounding-box maths) rather than pixel
 * snapshots, so they stay deterministic across operating systems, browser
 * engines, and font stacks instead of producing flaky image diffs.
 */

type Box = { x: number; y: number; width: number; height: number };

const surfaces = [
  { name: 'admin', path: '/' },
  { name: 'storefront', path: '/shop' },
  { name: 'operations', path: '/ops' },
  { name: 'clinic', path: '/clinic' },
  { name: 'test lab', path: '/lab' },
] as const;

// Desktop down to small-tablet — the widths where the app bar and the section
// nav begin to wrap, which is exactly where overlap used to appear.
const widths = [1440, 1024, 768, 560] as const;

const boxesOf = (page: Page, selector: string): Promise<Box[]> =>
  page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );

/** The largest overlap (px) between any two boxes; 0 when nothing meaningfully overlaps. */
const maxOverlap = (boxes: Box[]): number => {
  let max = 0;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      // Ignore sub-pixel touching; only count a real overlap on both axes.
      if (overlapX > 1 && overlapY > 1) {
        max = Math.max(max, Math.round(Math.min(overlapX, overlapY)));
      }
    }
  }
  return max;
};

const headerHeight = (page: Page): Promise<number> =>
  page.locator('.site-header').evaluate((el) => Math.round(el.getBoundingClientRect().height));

const toggleWidth = (page: Page): Promise<number> =>
  page.getByTestId('theme-toggle').evaluate((el) => Math.round(el.getBoundingClientRect().width));

test.describe('Two-tier header layout', () => {
  for (const surface of surfaces) {
    test(`${surface.name} header never overlaps or shifts on theme toggle`, async ({ page }) => {
      await page.goto(surface.path);
      const toggle = page.getByTestId('theme-toggle');
      await expect(toggle).toBeVisible();

      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });

        // No two cross-app pills / the toggle overlap, and no two section tabs
        // overlap, at this width. (Admin has no section nav, so that set is empty.)
        expect(maxOverlap(await boxesOf(page, '.app-switcher a, .theme-toggle')), `app bar overlap @ ${width}px`).toBe(
          0,
        );
        expect(maxOverlap(await boxesOf(page, '.section-nav a')), `section nav overlap @ ${width}px`).toBe(0);

        // Toggling the theme must not resize the toggle or change the header
        // height, which would shove the page content below it up or down.
        const heightBefore = await headerHeight(page);
        const toggleBefore = await toggleWidth(page);
        await toggle.click();
        expect(
          Math.abs((await headerHeight(page)) - heightBefore),
          `header height shift @ ${width}px`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs((await toggleWidth(page)) - toggleBefore),
          `toggle width shift @ ${width}px`,
        ).toBeLessThanOrEqual(1);

        // Restore the starting theme so each width begins from the same state.
        await toggle.click();
      }
    });
  }
});
