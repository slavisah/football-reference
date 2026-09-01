import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { NAV_LINKS } from '../../src/lib/routes';
import { TRANSLATED_PATHS } from '../../src/lib/i18n';

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
// file both documents the two real gaps that class of stripping caused
// (TournamentTable's `.is-winner` cell relied on `color`/`background` alone;
// the skip link relied on its `background` alone for shape) and pins the
// fixes (global.css's `@media (forced-colors: active)` block, plus the
// cell's new `text-decoration: underline`) so they can't regress.

// 'color-contrast' is disabled here (on top of the site-wide 'region'
// exclusion) for a forced-colors-specific reason, confirmed by hand while
// building the full-site sweep below: axe-core's contrast checker reports a
// false positive for any element whose color/background is set via a CSS
// custom property (e.g. `.btn--primary { background: var(--accent); color:
// var(--accent-contrast); }`, used site-wide for the theme tokens) - it
// flags the *pre-forced-colors* custom-property value pair (e.g.
// `--dark-accent-contrast` #05130d on black) as insufficient contrast, even
// though `getComputedStyle` on the exact same element, at the exact same
// point in the exact same test, confirms the browser actually painted a
// valid system-color pair (e.g. yellow on black) - forced-colors mode's
// whole purpose is to guarantee that pairing is always AA-compliant, so
// there is no real bug for this rule to catch here in the first place.
// Testing this by hand: temporarily re-enabling the rule and diffing
// axe's reported color against `getComputedStyle(el).color` on the flagged
// node reproduces the mismatch on every custom-property-driven button, not
// just one page - a known class of axe-core/forced-colors false positive,
// not a site bug. The three targeted tests below (and every path in the
// full-site sweep) still get every other WCAG 2.1/2.2 A/AA rule, including the
// checks that already caught the two real bugs this file exists to guard.
async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .disableRules(['region', 'color-contrast'])
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

// The full-site sweep below (SWEPT_PATHS) only enumerates NAV_LINKS/
// TRANSLATED_PATHS - the fixed top-level pages, including /teams itself -
// so it already covers the teams *index*. It has no way to reach the 40
// individual dynamic /teams/<slug> profile pages (src/pages/teams/[slug].astro,
// added 2026-08-17), which render the same .team-profile__list/.is-title
// cards on every page but were never driven through forced-colors at all.
// Spot-checked the same way the three targeted describes above spot-check
// TournamentTable/quiz, rather than generating one test per team.
test.describe('forced-colors mode, team profile page', () => {
  test('the champion "is-title" list item keeps a non-color signal and the page stays WCAG-clean', async ({
    page,
  }) => {
    await page.goto('teams/brazil');

    const titleItem = page.locator('.team-profile__list li.is-title').first();
    await expect(titleItem).toBeVisible();

    await page.emulateMedia({ forcedColors: 'active' });

    // Unlike TournamentTable's is-winner cell (fixed via an underline
    // because it had no other signal), a title item already carries a
    // trophy emoji plus the "Champion" text - both survive forced-colors on
    // their own, so this only needs to confirm the page is still clean, not
    // pin a CSS fix of its own.
    await expect(titleItem.locator('.team-profile__role')).toHaveText('Champion');

    await runAxe(page);
  });

  test('the Croatian team profile page is also WCAG-clean under forced-colors', async ({ page }) => {
    await page.goto('hr/teams/brazil');
    await page.emulateMedia({ forcedColors: 'active' });
    await runAxe(page);
  });
});

// The same gap the block above closed for /teams/<slug> applies identically
// to the 98 individual dynamic /players/<slug> profile pages
// (src/pages/players/[slug].astro, added 2026-08-20): they were never driven
// through forced-colors at all. Unlike the team profile's role text
// ("Champion"/"Runner-up"), every /players/<slug> list entry is a win - there
// is no role distinction to lose - so there is no equivalent CSS fix to pin
// here; this only confirms the page (its accent-colored year and
// accent-bordered award cards) stays WCAG-clean once forced-colors overrides
// those custom-property colors. Spot-checked the same representative player
// (Gerd Muller) the main WCAG sweep in accessibility.spec.ts uses.
test.describe('forced-colors mode, player profile page', () => {
  test('the English player profile page is WCAG-clean under forced-colors', async ({ page }) => {
    await page.goto('players/gerd-muller');
    await page.emulateMedia({ forcedColors: 'active' });
    await runAxe(page);
  });

  test('the Croatian player profile page is also WCAG-clean under forced-colors', async ({ page }) => {
    await page.goto('hr/players/gerd-muller');
    await page.emulateMedia({ forcedColors: 'active' });
    await runAxe(page);
  });
});

// The three targeted tests above pin the exact bugs this mode surfaced and
// their fixes; they don't answer whether forced-colors is clean everywhere
// else. This sweep runs the same whole-site axe pass accessibility.spec.ts
// already runs per color-scheme, but with `forcedColors: 'active'` emulated
// instead - same page list (every NAV_LINKS destination plus every Croatian
// translation, deduped, plus the 404 page, matching accessibility.spec.ts's
// SWEPT_PATHS exactly so a newly added page can't silently go unswept in
// either mode), same axe config. `prefers-color-scheme` still resolves
// underneath forced-colors (the site's own light/dark tokens still apply
// where forced-colors doesn't override them), so this sweeps both color
// schemes rather than assuming they'd behave identically once the OS
// palette is layered on top.
const ENGLISH_PATHS = NAV_LINKS.map((link) => link.path);
const CROATIAN_PATHS = Object.values(TRANSLATED_PATHS);
const ALL_PATHS = [...new Set([...ENGLISH_PATHS, ...CROATIAN_PATHS])];
const SWEPT_PATHS = [...ALL_PATHS, 'this-page-definitely-does-not-exist'];
const COLOR_SCHEMES = ['light', 'dark'] as const;

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`forced-colors mode, full site sweep - ${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    for (const path of SWEPT_PATHS) {
      test(`${path || '/'} has no WCAG 2.1/2.2 A/AA violations under forced-colors`, async ({
        page,
      }) => {
        const target = path === '/' ? '' : path.replace(/^\//, '');
        await page.goto(target);
        await page.emulateMedia({ forcedColors: 'active' });

        await runAxe(page);
      });
    }
  });
}
