import { test, expect } from '@playwright/test';

// Second no-JS sweep (following the compare-page audit in
// no-js-compare.spec.ts): the Family Quiz's answered/reveal states and the
// nav's two search comboboxes, both flagged as "expected to degrade inertly
// but never actually confirmed" by that same run's closing note.
//
// Auditing the quiz page found a real bug: QuizScript.astro only unhides
// `#quiz-score` (`scoreBar.hidden = false`) once it runs, so a no-JS reader
// should never see it - but quiz.astro/hr/quiz.astro's own `.quiz__score`
// rule sets `display: flex` unconditionally, and an author rule beats the
// UA stylesheet's `[hidden] { display: none }` at equal specificity. Without
// JavaScript, the sticky score bar ("Score: 0 / 47") and its dead "Restart
// quiz" button (QuizScript.astro never runs to wire up its click listener)
// were permanently pinned under the header on every page load. Fixed with a
// `.quiz__score[hidden] { display: none }` override in both quiz pages - the
// same pattern TournamentTable.astro's filtered rows and three of Nav.astro's
// own script-driven elements already use for this exact CSS pitfall.
//
// The two search comboboxes (#team-search-input/#player-search-input in
// Nav.astro) turned out already safe: they're plain `<input>`s with no
// wrapping `<form>` and their filtering is entirely driven by a `fetch()` in
// an external script, so without JavaScript they're inert (typing does
// nothing, the listbox never loses its `hidden` attribute) rather than
// misleading - no default/wrong state is ever shown, unlike the compare
// page's bug. Covered here as a regression guard, not because a bug was
// found.
test.use({ javaScriptEnabled: false });

test.describe('quiz page without JavaScript', () => {
  test('score bar and per-question "check" controls stay hidden; reveal still works', async ({
    page,
  }) => {
    await page.goto('quiz');
    await expect(page.locator('#quiz-score')).toBeHidden();
    await expect(page.locator('.quiz-card__check:visible')).toHaveCount(0);

    const firstCard = page.locator('.quiz-card').first();
    await firstCard.locator('.quiz-card__reveal summary').click();
    await expect(firstCard.locator('.quiz-card__reveal p')).not.toBeEmpty();
  });

  test('order-challenge cards also hide their "check" control and keep reveal working', async ({
    page,
  }) => {
    await page.goto('quiz');
    const orderCard = page
      .locator('.quiz-order__items')
      .first()
      .locator('xpath=ancestor::*[contains(@class, "quiz-card")]');
    await expect(orderCard.locator('.quiz-order__check:visible')).toHaveCount(0);
    await orderCard.locator('.quiz-card__reveal summary').click();
    await expect(orderCard.locator('.quiz-card__reveal p')).not.toBeEmpty();
  });

  test('/hr/quiz shows the same hidden score bar and check controls', async ({ page }) => {
    await page.goto('hr/quiz');
    await expect(page.locator('#quiz-score')).toBeHidden();
    await expect(page.locator('.quiz-card__check:visible')).toHaveCount(0);
  });
});

test.describe('nav search comboboxes without JavaScript', () => {
  test('the "find a team" combobox is visible but inert, never opens its listbox', async ({
    page,
  }) => {
    await page.goto('');
    const input = page.locator('#team-search-input');
    await expect(input).toBeVisible();
    await input.fill('Brazil');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
    await expect(page.locator('#team-search-status')).toHaveText('');
  });

  test('the "find a player" combobox is visible but inert, never opens its listbox', async ({
    page,
  }) => {
    await page.goto('');
    const input = page.locator('#player-search-input');
    await expect(input).toBeVisible();
    await input.fill('Messi');
    await expect(page.locator('#player-search-listbox')).toBeHidden();
    await expect(page.locator('#player-search-status')).toHaveText('');
  });

  test('/hr both comboboxes stay visible but inert too', async ({ page }) => {
    await page.goto('hr');
    await expect(page.locator('#team-search-input')).toBeVisible();
    await expect(page.locator('#player-search-input')).toBeVisible();
    await page.locator('#team-search-input').fill('Hrvatska');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
  });
});
