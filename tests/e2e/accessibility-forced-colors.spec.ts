import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// First-ever forced-colors (Windows/OS high-contrast theme) coverage of any
// kind - nothing in src/ or tests/ referenced `forced-colors` before this
// run. docs/PROJECT_STATUS.md's many accessibility passes cover
// prefers-reduced-motion, prefers-color-scheme (light/dark, both emulated
// and live-toggled), and print media, but never this OS-level mode, which a
// real low-vision Windows reader can have active independent of either of
// those. In forced-colors mode the browser replaces most author
// background/color/border-color with a small fixed system palette, so any
// element whose only signal was a background tint or accent text color (not
// a border, not a non-color text style) silently loses that signal. This
// file both documents the one real gap that class of stripping caused
// (TournamentTable's `.is-winner` cell relied on `color`/`background` alone)
// and pins the fix (global.css's `@media (forced-colors: active)` block,
// plus the cell's new `text-decoration: underline`) so it can't regress.

async function runAxe(page: Page) {
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

test.describe('forced-colors mode, World Cup competition page', () => {
  test('is-winner cells keep a non-color signal and the page stays WCAG-clean', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    const winnerCell = page.locator('#world-cup-table td.is-winner').first();
    await expect(winnerCell).toBeVisible();

    // Baseline, before emulating forced-colors: confirm the fixture itself
    // (not just the media query) actually applies the underline, so this
    // test can't pass vacuously if the selector or class name ever drifts.
    await expect(winnerCell).toHaveCSS('text-decoration-line', 'underline');

    await page.emulateMedia({ forcedColors: 'active' });

    // The underline is a plain (non-`forced-colors`-scoped) rule, so it must
    // survive unchanged once forced-colors is active - this is the actual
    // signal a high-contrast-mode reader depends on once the accent color
    // and background tint are both overridden by the OS palette.
    await expect(winnerCell).toHaveCSS('text-decoration-line', 'underline');

    // 360px is this project's only viewport (playwright.config.ts); confirm
    // forced-colors emulation didn't introduce new horizontal overflow (e.g.
    // from a system-color border adding unexpected width).
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await runAxe(page);
  });
});

test.describe('forced-colors mode, home page skip link', () => {
  test('the focused skip link keeps a real, non-transparent border', async ({ page }) => {
    await page.goto('');
    await page.emulateMedia({ forcedColors: 'active' });

    const skipLink = page.locator('.skip-link');
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    // The base rule's border-color is `transparent` by design (invisible in
    // every normal theme); forced-colors mode is documented to leave a
    // literal `transparent` value untouched, so without the global.css
    // override this would still measure as a zero-effect border. Assert the
    // resolved color is a real, opaque one instead of transparent.
    const borderColor = await skipLink.evaluate(
      (el) => getComputedStyle(el).borderTopColor,
    );
    expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(borderColor).not.toBe('transparent');

    await runAxe(page);
  });
});

test.describe('forced-colors mode, quiz answer states', () => {
  test('answered is-correct/is-incorrect choices have no WCAG violations', async ({ page }) => {
    await page.goto('quiz');
    await page.emulateMedia({ forcedColors: 'active' });

    const cards = page.locator('.quiz-card').filter({ has: page.locator('input[type="radio"]') });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 2; i += 1) {
      const card = cards.nth(i);
      const answerIndex = Number(await card.getAttribute('data-answer-index'));
      const radios = card.locator('input[type="radio"]');
      const radioCount = await radios.count();
      const pick = i === 0 ? answerIndex : (answerIndex + 1) % radioCount;
      await radios.nth(pick).check();
      await card.locator('.quiz-card__check').click();
    }

    await expect(page.locator('.quiz-card__choice.is-correct').first()).toBeVisible();
    await expect(page.locator('.quiz-card__choice.is-incorrect').first()).toBeVisible();

    // Unlike the winner cell, correct/incorrect here already carries a real
    // text badge (see QuizCard.astro's `.quiz-card__result-badge` comment) -
    // this test exists to confirm that stays true, not to fix a new gap.
    const correctBadge = page.locator('.quiz-card__choice.is-correct .quiz-card__result-badge').first();
    await expect(correctBadge).not.toHaveText('');

    await runAxe(page);
  });
});
