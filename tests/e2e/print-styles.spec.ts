import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PRINT_CONTENT_WIDTH_PX } from '../../scripts/check-print-width.mjs';

// AGENTS.md rule 7 requires accessible print styles, and the site has had a
// dedicated `@media print` sheet (src/styles/global.css) since Milestone 1 -
// A4 landscape, on-screen-filtered rows forced back to visible, the mobile
// card layout reverted to a real <table>, interactive chrome hidden, and
// colors flipped to pure black-on-white. None of that had ever been driven
// through an actual test: every existing Playwright spec (mobile.spec.ts,
// accessibility*.spec.ts) only ever renders the default screen media. This
// file closes that gap - it's a genuinely different rendering path from
// everything else in the suite, not a duplicate of the screen-media
// filter/sort/theme-toggle interaction-state coverage already added
// elsewhere, and print correctness is exactly what the six downloadable
// per-competition PDFs (scripts/generate-pdfs.mjs) depend on, even though
// that script itself has no accessibility assertions of its own.

async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice', 'experimental', 'ACT', 'review-item'])
    .disableRules(['region', 'color-contrast-enhanced'])
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

const PRINT_PAGES = [
  { label: 'English World Cup', path: 'competitions/world-cup' },
  { label: 'Croatian World Cup', path: 'hr/competitions/world-cup' },
  { label: 'English Golden Boot (two tables)', path: 'competitions/golden-boot' },
  { label: 'Croatian Golden Boot (two tables)', path: 'hr/competitions/golden-boot' },
  { label: 'English EURO', path: 'competitions/euro' },
  { label: 'Croatian EURO', path: 'hr/competitions/euro' },
  { label: 'English Copa América', path: 'competitions/copa-america' },
  { label: 'Croatian Copa América', path: 'hr/competitions/copa-america' },
  { label: 'English Nations League', path: 'competitions/nations-league' },
  { label: 'Croatian Nations League', path: 'hr/competitions/nations-league' },
  { label: "English Ballon d'Or", path: 'competitions/ballon-dor' },
  { label: "Croatian Ballon d'Or", path: 'hr/competitions/ballon-dor' },
];

for (const { label, path } of PRINT_PAGES) {
  test.describe(`${label} (/${path}) in print media`, () => {
    test('has no WCAG violations when rendered for print', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });
      await runAxe(page);
    });

    test('hides interactive chrome that makes no sense on paper', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      for (const selector of ['.site-header', '.site-footer', '.theme-toggle', '.skip-link']) {
        const locator = page.locator(selector).first();
        await expect(locator).toBeHidden();
      }
    });

    test('flips to pure black-on-white body colors', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      const { background, color } = await page.evaluate(() => {
        const style = getComputedStyle(document.body);
        return { background: style.backgroundColor, color: style.color };
      });
      expect(background).toBe('rgb(255, 255, 255)');
      expect(color).toBe('rgb(0, 0, 0)');
    });

    test('reverts the mobile card table back to a real <table> layout', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      const cellDisplay = await page
        .locator('.t-table tbody td')
        .first()
        .evaluate((el) => getComputedStyle(el).display);
      // On screen at the suite's 360px viewport this is 'grid' (the mobile
      // card layout); print must revert it to a real table cell so the PDF
      // export reads as an actual table, not stacked label/value pairs.
      expect(cellDisplay).toBe('table-cell');
    });
  });
}

test.describe('a screen-filtered row still prints', () => {
  test('World Cup: rows hidden by the on-screen winner filter reappear under print media', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    const winnerSel = page.locator('#world-cup-winner');
    const options = await winnerSel.locator('option').all();
    let filterValue = '';
    for (const option of options) {
      const value = await option.getAttribute('value');
      if (value) {
        filterValue = value;
        break;
      }
    }
    await winnerSel.selectOption(filterValue);

    const hiddenRow = page.locator('#world-cup-table tbody tr[hidden]').first();
    await expect(hiddenRow).toHaveCount(1);
    // Confirm the on-screen filter really did hide it before checking print.
    await expect(hiddenRow).toBeHidden();

    await page.emulateMedia({ media: 'print' });
    const printDisplay = await hiddenRow.evaluate((el) => getComputedStyle(el).display);
    expect(printDisplay).not.toBe('none');
    await expect(hiddenRow).toBeVisible();

    await runAxe(page);
  });
});

// Records, Compare, Sources, the home page and 404 don't use TournamentTable's
// mobile-card layout, so they don't need the "reverts to a real <table>" check
// above, but they still need the shared WCAG-under-print and chrome-hiding
// guarantees. Until now only the three English pages here had ever been
// driven through print media at all - their Croatian counterparts, and the
// home page in either language, had zero print coverage (the six competition
// pages and Quiz are the only other pages with any print testing, both
// checked separately below/above). This closes that gap, the same
// "does this page actually work end-to-end, not just assumed-clean because
// the CSS is shared" angle that has found real bugs elsewhere in this file
// and in this test suite generally (see e.g. the Croatian-PDF and nav
// aria-label bugs recorded in docs/PROJECT_STATUS.md).
//
// The /teams directory (index + one representative profile page per
// language) joined this list once it shipped (docs/PROJECT_STATUS.md,
// 2026-08-17) but was never actually added here - like Records/Compare it
// has no TournamentTable, so the same "no table revert" exemption applies.
//
// The /players directory (index + one representative profile page per
// language, added 2026-08-20) had the identical gap and was never added at
// all - same "no TournamentTable" exemption as /teams.
//
// /compare-players (Croatian localization added 2026-08-21) is added here
// too - it also has no TournamentTable, same exemption as /compare, /teams
// and /players.
//
// /glossary (added 2026-08-22) joins the list for the same reason - a
// definition list, no TournamentTable.
const OTHER_PRINT_PAGES = [
  { label: 'English Home', path: '' },
  { label: 'Croatian Home', path: 'hr/' },
  { label: 'English Records', path: 'records' },
  { label: 'Croatian Records', path: 'hr/records' },
  { label: 'English Compare', path: 'compare' },
  { label: 'Croatian Compare', path: 'hr/compare' },
  { label: 'English Sources', path: 'about/sources' },
  { label: 'Croatian Sources', path: 'hr/about/sources' },
  { label: 'English Teams index', path: 'teams' },
  { label: 'Croatian Teams index', path: 'hr/teams' },
  { label: 'English Team profile (Brazil)', path: 'teams/brazil' },
  { label: 'Croatian Team profile (Brazil)', path: 'hr/teams/brazil' },
  { label: 'English Players index', path: 'players' },
  { label: 'Croatian Players index', path: 'hr/players' },
  { label: 'English Player profile (Gerd Muller)', path: 'players/gerd-muller' },
  { label: 'Croatian Player profile (Gerd Muller)', path: 'hr/players/gerd-muller' },
  { label: 'English Compare Players', path: 'compare-players' },
  { label: 'Croatian Compare Players', path: 'hr/compare-players' },
  { label: 'English Glossary', path: 'glossary' },
  { label: 'Croatian Glossary', path: 'hr/glossary' },
];

for (const { label, path } of OTHER_PRINT_PAGES) {
  test.describe(`${label} (/${path}) in print media`, () => {
    test('has no WCAG violations when rendered for print', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });
      await runAxe(page);
    });

    test('hides interactive chrome that makes no sense on paper', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      for (const selector of ['.site-header', '.site-footer', '.theme-toggle', '.skip-link']) {
        const locator = page.locator(selector).first();
        await expect(locator).toBeHidden();
      }
    });

    test('flips to pure black-on-white body colors', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      const { background, color } = await page.evaluate(() => {
        const style = getComputedStyle(document.body);
        return { background: style.backgroundColor, color: style.color };
      });
      expect(background).toBe('rgb(255, 255, 255)');
      expect(color).toBe('rgb(0, 0, 0)');
    });
  });
}

const TEAM_PROFILE_PAGES = [
  { label: 'English', path: 'teams/brazil' },
  { label: 'Croatian', path: 'hr/teams/brazil' },
];

for (const { label, path } of TEAM_PROFILE_PAGES) {
  test.describe(`${label} Team profile (/${path}) in print media`, () => {
    test('hides the "Compare against another team" link, which is meaningless on paper', async ({
      page,
    }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      await expect(page.locator('.team-profile__compare-link').first()).toBeHidden();
    });
  });
}

const COMPARE_PAGES = [
  { label: 'English', path: 'compare' },
  { label: 'Croatian', path: 'hr/compare' },
];

for (const { label, path } of COMPARE_PAGES) {
  test.describe(`${label} Compare (/${path}) in print media`, () => {
    test('hides the team-picker controls, which are meaningless on paper', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      await expect(page.locator('.compare__picker').first()).toBeHidden();
    });
  });
}

// /compare-players reuses the exact same .compare__picker/.no-print markup
// as /compare (same component shape, different data), so it needs the same
// dedicated "picker is meaningless on paper" check as its own case, not just
// the generic WCAG/hide-chrome checks OTHER_PRINT_PAGES already runs on it.
const COMPARE_PLAYERS_PAGES = [
  { label: 'English', path: 'compare-players' },
  { label: 'Croatian', path: 'hr/compare-players' },
];

for (const { label, path } of COMPARE_PLAYERS_PAGES) {
  test.describe(`${label} Compare Players (/${path}) in print media`, () => {
    test('hides the player-picker controls, which are meaningless on paper', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      await expect(page.locator('.compare__picker').first()).toBeHidden();
    });
  });
}

// GitHub Pages serves dist/404.html for any unmatched path under the base
// path, in either language (see mobile.spec.ts's "404 page on a 360px
// phone" block) - it shows both languages on the same page rather than
// picking one, so there's only ever one version of it to check here.
test.describe('404 page in print media', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('this-page-definitely-does-not-exist');
  });

  test('has no WCAG violations when rendered for print', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await runAxe(page);
  });

  test('hides interactive chrome that makes no sense on paper', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });

    for (const selector of ['.site-header', '.site-footer', '.theme-toggle', '.skip-link']) {
      await expect(page.locator(selector).first()).toBeHidden();
    }
  });

  test('flips to pure black-on-white body colors', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });

    const { background, color } = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(background).toBe('rgb(255, 255, 255)');
    expect(color).toBe('rgb(0, 0, 0)');
  });
});

// Regression coverage for a real bug this pass found: the quiz's "Just show
// me the answer" <details> disclosure shared the `no-print` class with the
// JS-only "Check answer" controls, so it was fully hidden on paper too -
// contradicting the documented "no-JS visitor sees a clean answer-key quiz
// sheet (also print-friendly)" design. A printed/no-JS quiz had no way to
// see any answer at all. Fixed in QuizCard.astro/QuizOrderCard.astro (dropped
// `no-print` from `.quiz-card__reveal`) plus a new global.css print rule that
// forces the <details> content visible regardless of its open/closed state,
// since a printed page can't reflect that interactive state either way.
// Parameterized over both locales - the Croatian quiz (/hr/quiz) shares the
// exact same QuizCard/QuizOrderCard/global.css print rules, but had never
// actually been driven through print media itself until now.
const QUIZ_PAGES = [
  { label: 'English', path: 'quiz' },
  { label: 'Croatian', path: 'hr/quiz' },
];

for (const { label, path } of QUIZ_PAGES) {
  test.describe(`${label} Quiz (/${path}) in print media`, () => {
    test('has no WCAG violations when rendered for print', async ({ page }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });
      await runAxe(page);
    });

    test('hides interactive chrome and JS-only controls, but keeps the answer key visible', async ({
      page,
    }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      for (const selector of ['.site-header', '.site-footer', '.theme-toggle', '.skip-link']) {
        await expect(page.locator(selector).first()).toBeHidden();
      }

      // JS-only chrome: the score bar and each card's "Check answer" button +
      // live feedback region stay hidden - there's no interpreter on paper to
      // drive them.
      await expect(page.locator('#quiz-score')).toBeHidden();
      await expect(page.locator('.quiz-card__controls').first()).toBeHidden();

      // The answer-key disclosure itself, and its answer text, must render.
      const reveal = page.locator('.quiz-card__reveal').first();
      await expect(reveal).toBeVisible();
      await expect(reveal.locator('p')).toBeVisible();
      await expect(reveal.locator('p')).not.toBeEmpty();
    });

    test('the chronological-order challenge card also keeps its answer key visible', async ({
      page,
    }) => {
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      const orderSection = page.locator('.quiz__order-section');
      const reveal = orderSection.locator('.quiz-card__reveal').first();
      await expect(reveal).toBeVisible();
      await expect(reveal.locator('p')).toBeVisible();
      // The correct order text renders as "Team A → Team B → ..." - just
      // confirm it's non-empty real content, not asserting the exact chain.
      await expect(reveal.locator('p')).not.toBeEmpty();
    });
  });
}

// A competition table's "tap a year to reveal a short story" <details>
// (src/components/TournamentTable.astro, joined via buildYearStories() in
// src/lib/editions.ts) shares the same print-visibility need as the quiz's
// answer-key reveal above, and the same fix: a `.story-reveal::details-content`
// rule in global.css forces its content visible on paper regardless of the
// on-screen open/closed state.
test.describe('World Cup story reveal in print media', () => {
  test('the story disclosure renders its text on paper without being tapped open', async ({ page }) => {
    await page.goto('competitions/world-cup');
    await page.emulateMedia({ media: 'print' });

    const reveal = page.locator('tbody tr[data-year="2026"] .story-reveal');
    await expect(reveal).toBeVisible();
    await expect(reveal.locator('p')).toBeVisible();
    await expect(reveal.locator('p')).toContainText('Spain won its second title in 2026.');
  });
});

// Regression coverage for a real bug the seventy-third intensive run found
// by direct inspection, not by any existing automated check: `.t-wrap`'s
// screen-only `overflow-x: auto` (the small-screen horizontal scrollbar) had
// no paper equivalent, and every wide `.t-table` (7+ columns, e.g. World Cup's
// Year/Host(s)/Teams/Winner/Runner-up/Third/Fourth/Final/Final date/Top
// scorer/Story) rendered wider than the printable A4-landscape page - so
// content past the page's right edge was silently clipped in the actual
// downloaded PDF, not just scrollable as it is on screen. `pnpm check:pdfs`
// only ever hashed source content for freshness, and every other test in
// this file runs at the suite's default 360px mobile viewport, which is
// narrower than the print stylesheet's own mobile-card breakpoint and so
// never exercised the real table layout at all - neither one could ever have
// caught this. This test approximates the actual print-to-PDF layout width
// (scripts/generate-pdfs.mjs's `@page` rule: A4 landscape, 297mm wide, 12mm
// margins each side = 273mm of usable content) by setting the viewport to
// that same width before emulating print media, then confirms every element
// on the page fits inside it - the same measurement approach the site's own
// filter-`<select>`-width fix (docs/ROADMAP.md, seventieth intensive run)
// already established for a different clipping bug. `PRINT_CONTENT_WIDTH_PX`
// is imported from `scripts/check-print-width.mjs`, the shared source of
// truth `tests/unit/checkPrintWidth.test.ts` already pins to 1032, rather
// than re-derived here - keeping the formula in one place so a future
// `@page` geometry change can't silently desync this spec's viewport from
// that script's own full-site sweep.

// The seventy-third run's own fix (`.t-wrap`/`.t-table` in global.css) is
// global, but its regression list only covered the eight page/table shapes
// that were confirmed clipped at the time (World Cup, EURO, one language
// each of Nations League/Copa América, and /records) - Ballon d'Or, Golden
// Boot, and the other language of Nations League/Copa América all share the
// exact same `TournamentTable`/`.t-table` markup and were just as capable of
// clipping, but had zero regression coverage of their own. Widened to every
// competition/award page in both languages, plus /compare and
// /compare-players' "All national teams"/"All players" table
// (`.compare__table--all`, also wrapped in `.t-wrap` per that page's own
// styles) - a different table class from `.t-table` that the original fix's
// `table-layout: fixed` rule never actually touched, so it needed checking
// on its own merits rather than assumed covered by the same fix.
const WIDE_TABLE_PRINT_PAGES = [
  'competitions/world-cup',
  'hr/competitions/world-cup',
  'competitions/euro',
  'hr/competitions/euro',
  'competitions/nations-league',
  'hr/competitions/nations-league',
  'competitions/copa-america',
  'hr/competitions/copa-america',
  'competitions/ballon-dor',
  'hr/competitions/ballon-dor',
  'competitions/golden-boot',
  'hr/competitions/golden-boot',
  'records',
  'hr/records',
  'compare',
  'hr/compare',
  'compare-players',
  'hr/compare-players',
];

test.describe('Wide tables fit the printable page width, not just the screen', () => {
  for (const path of WIDE_TABLE_PRINT_PAGES) {
    test(`/${path} has no element wider than the printable A4-landscape page`, async ({ page }) => {
      await page.setViewportSize({ width: PRINT_CONTENT_WIDTH_PX, height: 1000 });
      await page.goto(path);
      await page.emulateMedia({ media: 'print' });

      const overflowing = await page.evaluate((maxRight) => {
        return [...document.querySelectorAll('body *')]
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            if (getComputedStyle(el).display === 'none') return false;
            return rect.right > maxRight + 2;
          })
          .map((el) => `${el.tagName}.${el.className}`);
      }, PRINT_CONTENT_WIDTH_PX);

      expect(overflowing).toEqual([]);
    });
  }
});
