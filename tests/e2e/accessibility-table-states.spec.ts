import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The main accessibility.spec.ts sweep loads every NAV_LINKS page exactly
// once, in its untouched initial DOM state - and mobile.spec.ts's filter/sort
// coverage never runs those states through axe. That leaves every
// TournamentTable's own client-driven states unaudited: the "no editions
// match those filters" empty state (which was never covered by ANY test,
// functional or accessibility - `#{id}-empty` sat `hidden` in the DOM on
// every page load every prior test ever exercised), and a combined
// filtered+re-sorted state (rows hidden by the filter AND reordered by the
// sort script at once). docs/PROJECT_STATUS.md's "Left for a future pass"
// notes have repeatedly pointed at "a concrete gap... rather than a broad,
// likely-low-yield sweep" for accessibility/performance follow-ups - this is
// that gap, closed the same way accessibility-quiz-states.spec.ts and
// accessibility-compare-states.spec.ts closed the equivalent gap for those
// two pages.

const TABLE_IDS = [
  'world-cup',
  'euro',
  'copa-america',
  'nations-league',
  'ballon-dor',
  'golden-boot-world-cup',
  'golden-boot-euro',
];

const TABLE_PAGES: Record<string, string> = {
  'world-cup': 'competitions/world-cup',
  euro: 'competitions/euro',
  'copa-america': 'competitions/copa-america',
  'nations-league': 'competitions/nations-league',
  'ballon-dor': 'competitions/ballon-dor',
  'golden-boot-world-cup': 'competitions/golden-boot',
  'golden-boot-euro': 'competitions/golden-boot',
};

async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
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

// Finds a winner/year combination that matches zero rows, read straight from
// the table's own live dataset rather than guessed - so this can never
// flake if a future content edit changes which winner/year pairs exist.
async function findNoResultsCombo(page: Page, id: string) {
  return page.evaluate((tableId) => {
    const rows = Array.from(document.querySelectorAll(`#${tableId}-table tbody tr`)) as HTMLElement[];
    const winnerSel = document.getElementById(`${tableId}-winner`) as HTMLSelectElement;
    const yearSel = document.getElementById(`${tableId}-year`) as HTMLSelectElement;
    const winners = Array.from(winnerSel.options)
      .map((o) => o.value)
      .filter(Boolean);
    const years = Array.from(yearSel.options)
      .map((o) => o.value)
      .filter(Boolean);
    for (const winner of winners) {
      for (const year of years) {
        const matches = rows.some((r) => r.dataset.winner === winner && r.dataset.year === year);
        if (!matches) return { winner, year };
      }
    }
    return null;
  }, id);
}

for (const id of TABLE_IDS) {
  test.describe(`${id} table states (/${TABLE_PAGES[id]})`, () => {
    test('no-results state has no WCAG violations and is keyboard-recoverable', async ({ page }) => {
      await page.goto(TABLE_PAGES[id]);
      const combo = await findNoResultsCombo(page, id);
      expect(combo, 'expected at least one non-matching winner/year combination').not.toBeNull();

      await page.selectOption(`#${id}-winner`, combo!.winner);
      await page.selectOption(`#${id}-year`, combo!.year);

      const empty = page.locator(`#${id}-empty`);
      await expect(empty).toBeVisible();
      const visibleRows = page.locator(`#${id}-table tbody tr:not([hidden])`);
      await expect(visibleRows).toHaveCount(0);

      await runAxe(page);

      // The empty state's own "Clear filters" button must be a real,
      // keyboard-operable way back to results - not a dead end.
      const emptyReset = page.locator(`#${id}-empty-reset`);
      await expect(emptyReset).toBeVisible();
      await emptyReset.focus();
      await page.keyboard.press('Enter');
      await expect(empty).toBeHidden();
      await expect(page.locator(`#${id}-winner`)).toHaveValue('');
      await expect(page.locator(`#${id}-year`)).toHaveValue('');
    });

    test('filtered + re-sorted state has no WCAG violations', async ({ page }) => {
      await page.goto(TABLE_PAGES[id]);

      const winnerSel = page.locator(`#${id}-winner`);
      const firstWinner = await winnerSel.locator('option').nth(1).getAttribute('value');
      expect(firstWinner).toBeTruthy();
      await winnerSel.selectOption(firstWinner!);

      const sortSel = page.locator(`#${id}-sort`);
      if ((await sortSel.count()) > 0) {
        const options = await sortSel.locator('option').all();
        const currentValue = await sortSel.inputValue();
        for (const option of options) {
          const value = await option.getAttribute('value');
          if (value && value !== currentValue) {
            await sortSel.selectOption(value);
            break;
          }
        }
      }

      const status = page.locator(`#${id}-status`);
      await expect(status).toContainText(String(firstWinner));

      await runAxe(page);
    });
  });
}

// Canary coverage in the Croatian translation and dark color scheme - the
// underlying filter/sort/empty logic is locale-agnostic (same script, same
// element ids), but the rendered labels and theme colors differ, so one
// representative table (world-cup, which carries the full winner/year/host/
// team/sort filter set) is re-checked in that combination rather than
// re-running all seven tables a second and third time.
test.describe('world-cup table states, Croatian, dark color scheme', () => {
  test.use({ colorScheme: 'dark' });

  test('no-results state has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/world-cup');
    const combo = await findNoResultsCombo(page, 'world-cup');
    expect(combo).not.toBeNull();

    await page.selectOption('#world-cup-winner', combo!.winner);
    await page.selectOption('#world-cup-year', combo!.year);

    await expect(page.locator('#world-cup-empty')).toBeVisible();
    await runAxe(page);
  });
});
