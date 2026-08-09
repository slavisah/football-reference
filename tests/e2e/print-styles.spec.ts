import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

const PRINT_PAGES = [
  { label: 'English World Cup', path: 'competitions/world-cup' },
  { label: 'Croatian World Cup', path: 'hr/competitions/world-cup' },
  { label: 'English Golden Boot (two tables)', path: 'competitions/golden-boot' },
  { label: 'English EURO', path: 'competitions/euro' },
  { label: 'English Copa América', path: 'competitions/copa-america' },
  { label: 'English Nations League', path: 'competitions/nations-league' },
  { label: "English Ballon d'Or", path: 'competitions/ballon-dor' },
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

// Records, Compare, Sources and Quiz don't use TournamentTable's mobile-card
// layout, so they don't need the "reverts to a real <table>" check above, but
// they still need the shared WCAG-under-print and chrome-hiding guarantees -
// none of the four had ever been driven through print media before.
const OTHER_PRINT_PAGES = [
  { label: 'English Records', path: 'records' },
  { label: 'English Compare', path: 'compare' },
  { label: 'English Sources', path: 'about/sources' },
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

test.describe('Compare (/compare) in print media', () => {
  test('hides the team-picker controls, which are meaningless on paper', async ({ page }) => {
    await page.goto('compare');
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.compare__picker').first()).toBeHidden();
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
test.describe('Quiz (/quiz) in print media', () => {
  test('has no WCAG violations when rendered for print', async ({ page }) => {
    await page.goto('quiz');
    await page.emulateMedia({ media: 'print' });
    await runAxe(page);
  });

  test('hides interactive chrome and JS-only controls, but keeps the answer key visible', async ({
    page,
  }) => {
    await page.goto('quiz');
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
    await page.goto('quiz');
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
