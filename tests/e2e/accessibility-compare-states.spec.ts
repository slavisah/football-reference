import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The main accessibility.spec.ts sweep loads every NAV_LINKS page exactly
// once, in its untouched initial DOM state. That misses /compare's own
// client-driven interactive state: picking a different Team A/B pair or
// clicking Swap rewrites the head-to-head panel's heading and table cells in
// place via textContent, the same "silent DOM update" shape that hid the
// quiz page's earlier aria-live gaps (see accessibility-quiz-states.spec.ts
// and docs/PROJECT_STATUS.md) - so this file closes the same class of gap
// for /compare specifically, for both languages and both color schemes.
//
// /compare-players (added 2026-08-21, after this file already existed) uses
// the identical #compare-a/#compare-b/#compare-swap/#compare-status/
// #compare-a-name/#compare-b-name DOM shape - see
// src/pages/compare-players.astro - so it belongs in this same sweep. It was
// never added when it shipped, leaving its own re-selected/swapped states
// untested for exactly the gap this file exists to catch.

const COMPARE_PAGES = [
  { label: 'English', path: 'compare' },
  { label: 'Croatian', path: 'hr/compare' },
  { label: 'English players', path: 'compare-players' },
  { label: 'Croatian players', path: 'hr/compare-players' },
];
const COLOR_SCHEMES = ['light', 'dark'] as const;

async function runAxe(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['region'])
    .analyze();
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

type AxeViolations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

function formatViolations(violations: AxeViolations): string {
  if (violations.length === 0) return '';
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
      return `${violation.id} (${violation.impact}): ${violation.help}\n  affected: ${targets}\n  see: ${violation.helpUrl}`;
    })
    .join('\n\n');
}

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    for (const { label, path } of COMPARE_PAGES) {
      test.describe(`${label} compare (/${path})`, () => {
        test('re-selected team-A state has no WCAG violations and announces the change', async ({
          page,
        }) => {
          await page.goto(path);
          const status = page.locator('#compare-status');
          const before = await status.textContent();

          const selectA = page.locator('#compare-a');
          const options = await selectA.locator('option').all();
          const currentValue = await selectA.inputValue();
          let nextValue = currentValue;
          let nextLabel = '';
          for (const option of options) {
            const value = await option.getAttribute('value');
            if (value && value !== currentValue) {
              nextValue = value;
              nextLabel = (await option.textContent()) ?? '';
              break;
            }
          }
          await selectA.selectOption(nextValue);

          // The panel heading and the live-region status text must both
          // reflect the new selection - a sighted user sees the heading
          // change instantly, but a screen-reader user (focus stays on the
          // <select>) only learns about it if the status region announces
          // it too.
          await expect(page.locator('#compare-a-name')).toHaveText(nextLabel);
          await expect(status).not.toHaveText(before ?? '');

          await runAxe(page);
        });

        test('swapped state has no WCAG violations and announces the change', async ({ page }) => {
          await page.goto(path);
          const status = page.locator('#compare-status');
          const before = await status.textContent();
          const nameABefore = await page.locator('#compare-a-name').textContent();
          const nameBBefore = await page.locator('#compare-b-name').textContent();

          await page.locator('#compare-swap').click();

          await expect(page.locator('#compare-a-name')).toHaveText(nameBBefore ?? '');
          await expect(page.locator('#compare-b-name')).toHaveText(nameABefore ?? '');
          await expect(status).not.toHaveText(before ?? '');

          await runAxe(page);
        });
      });
    }
  });
}
