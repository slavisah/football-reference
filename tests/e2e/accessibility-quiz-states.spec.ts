import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The main accessibility.spec.ts sweep loads every NAV_LINKS page exactly
// once, in its untouched initial DOM state. That misses the quiz page's
// interactive states entirely: answered choices (is-correct/is-incorrect
// classes, aria-live feedback text, disabled inputs), the order-challenge's
// own answered state, and the native <details> "just show me the answer"
// fallback expanded. docs/PROJECT_STATUS.md's "Left for a future pass" note
// named exactly this gap - quiz question states sitting outside the main
// sweep's NAV_LINKS coverage - so this file closes it, one state at a time,
// for both languages and both color schemes (the site's accent colors are
// tuned per-theme, same reasoning the main sweep's file comment gives).

const QUIZ_PAGES = [
  { label: 'English', path: 'quiz' },
  { label: 'Croatian', path: 'hr/quiz' },
];
const COLOR_SCHEMES = ['light', 'dark'] as const;

// Answers every multiple-choice card with a deliberate mix of correct and
// incorrect picks (alternating by index) so the resulting DOM exercises both
// the is-correct and is-incorrect branches - and every non-empty aria-live
// feedback string - at once, rather than only ever the all-correct path.
async function answerAllChoiceCards(page: Page) {
  const cards = page.locator('.quiz-card').filter({ has: page.locator('input[type="radio"]') });
  const count = await cards.count();
  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const answerIndex = Number(await card.getAttribute('data-answer-index'));
    const radios = card.locator('input[type="radio"]');
    const radioCount = await radios.count();
    // Even cards answered correctly, odd cards deliberately answered wrong
    // (picking the option after the correct one, wrapping around).
    const pick = i % 2 === 0 ? answerIndex : (answerIndex + 1) % radioCount;
    await radios.nth(pick).check();
    await card.locator('.quiz-card__check').click();
  }
}

// Same idea for the ranking cards: the first gets every rank correct, the
// second (if present) gets its first two ranks swapped, so both
// is-correct/is-incorrect item states and both feedback strings render.
async function answerAllOrderCards(page: Page) {
  const orderCards = page.locator('.quiz-card:has(.quiz-order__items)');
  const count = await orderCards.count();
  for (let i = 0; i < count; i += 1) {
    const card = orderCards.nth(i);
    const selects = card.locator('.quiz-order__rank');
    const rankCount = await selects.count();
    const correctRanks = ((await card.getAttribute('data-correct-ranks')) ?? '')
      .split(',')
      .map(Number);
    const ranks = [...correctRanks];
    if (i % 2 === 1 && ranks.length >= 2) {
      [ranks[0], ranks[1]] = [ranks[1], ranks[0]];
    }
    for (let j = 0; j < rankCount; j += 1) {
      await selects.nth(j).selectOption(String(ranks[j]));
    }
    await card.locator('.quiz-order__check').click();
  }
}

async function expandAllReveals(page: Page) {
  const summaries = page.locator('.quiz-card__reveal summary');
  const count = await summaries.count();
  for (let i = 0; i < count; i += 1) {
    await summaries.nth(i).click();
  }
}

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

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    for (const { label, path } of QUIZ_PAGES) {
      test.describe(`${label} quiz (/${path})`, () => {
        test('answered state (mixed correct/incorrect, choice and order cards, reveals open) has no WCAG violations', async ({
          page,
        }) => {
          await page.goto(path);
          await answerAllChoiceCards(page);
          await answerAllOrderCards(page);
          await expandAllReveals(page);

          // Sanity checks that the "answered" state actually happened, so a
          // future markup change that silently breaks the quiz script can't
          // make this test pass vacuously by auditing an unchanged page.
          await expect(page.locator('.quiz-card__choice.is-correct').first()).toBeVisible();
          await expect(page.locator('.quiz-card__choice.is-incorrect').first()).toBeVisible();
          await expect(page.locator('.quiz-order__item.is-correct').first()).toBeVisible();

          await runAxe(page);
        });

        test('restarted-after-answering state has no WCAG violations', async ({ page }) => {
          await page.goto(path);
          await answerAllChoiceCards(page);
          await answerAllOrderCards(page);
          await page.locator('#quiz-restart').click();

          await expect(page.locator('#quiz-score-value')).toHaveText('0');
          await runAxe(page);
        });
      });
    }
  });
}
