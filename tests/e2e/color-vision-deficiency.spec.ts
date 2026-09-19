import { test, expect, type Page } from '@playwright/test';

// This site's three color-conveyed states (the quiz's answered choices, a
// TournamentTable "winner" cell, a PodiumCards rank) each already carry a
// non-color signal - real DOM text, `text-decoration: underline`, or
// document order plus a `visually-hidden` label - fixed one at a time by
// earlier runs auditing WCAG 1.4.1 (use of color) with contrast math and
// axe-core. No prior run had actually *rendered* the page the way a
// colorblind reader sees it, the same gap the hundred-and-twenty-sixth run's
// manual-screenshot method closed for 320px reflow and print output. This
// spec closes it for color vision: Chromium supports emulating each
// medically-recognized deficiency via the CDP `Emulation.
// setEmulatedVisionDeficiency` call (there's no Playwright-level
// `page.emulateVisionDeficiency()` wrapper for it - that's a Puppeteer API,
// confirmed absent from this project's pinned playwright-core@1.63.0 by
// grepping its own type declarations), which was used to actually render
// and screenshot all three states under protanopia/deuteranopia/tritanopia/
// achromatopsia in both themes during the hundred-and-forty-first run's
// investigation: all three stayed genuinely readable - the emoji medals in
// PodiumCards do lose their gold/silver/bronze hue distinction under
// achromatopsia, but rank there was never color-dependent to begin with
// (document order plus the fourth place's plain "4." with no medal).
//
// The assertions below don't re-derive that from pixels (CDP vision-
// deficiency emulation is a rendering-only filter; it doesn't change
// `getComputedStyle` values, so a pixel-diff would only re-test Chromium's
// own filter, not this site's markup) - they instead pin the actual
// non-color signal each fix relies on, wrapped in the same emulated
// contexts, so a future change that quietly deletes one while "only"
// touching color has a permanent guard.

const DEFICIENCIES = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;

async function withVisionDeficiency<T>(
  page: Page,
  type: (typeof DEFICIENCIES)[number],
  fn: () => Promise<T>,
): Promise<T> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
  try {
    return await fn();
  } finally {
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
    await cdp.detach();
  }
}

test.describe('color-vision-deficiency emulation: every color-conveyed state keeps a non-color signal', () => {
  for (const deficiency of DEFICIENCIES) {
    test(`quiz answered state (${deficiency}): correct/incorrect badges stay distinct text, not just color`, async ({
      page,
    }) => {
      await page.goto('quiz');
      const firstCard = page.locator('.quiz-card').first();
      const answerIndex = Number(await firstCard.getAttribute('data-answer-index'));
      const wrongIndex = answerIndex === 0 ? 1 : 0;

      await withVisionDeficiency(page, deficiency, async () => {
        await firstCard.locator('input[type="radio"]').nth(wrongIndex).check();
        await firstCard.locator('.quiz-card__check').click();

        const correctBadge = firstCard.locator('.quiz-card__choice.is-correct .quiz-card__result-badge');
        const incorrectBadge = firstCard.locator('.quiz-card__choice.is-incorrect .quiz-card__result-badge');
        const [correctText, incorrectText] = await Promise.all([
          correctBadge.textContent(),
          incorrectBadge.textContent(),
        ]);
        expect(correctText?.trim()).toBe('✓ correct');
        expect(incorrectText?.trim()).toBe('✗ your answer');
      });
    });

    test(`competition table winner cell (${deficiency}): stays underlined and bold, not just recolored`, async ({
      page,
    }) => {
      await page.goto('competitions/world-cup');

      await withVisionDeficiency(page, deficiency, async () => {
        const winnerCell = page.locator('.t-table td.is-winner').first();
        await expect(winnerCell).toBeVisible();
        const styles = await winnerCell.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { textDecorationLine: cs.textDecorationLine, fontWeight: cs.fontWeight };
        });
        expect(styles.textDecorationLine).toContain('underline');
        expect(Number(styles.fontWeight)).toBeGreaterThanOrEqual(700);
      });
    });

    test(`podium rank (${deficiency}): champion/runner-up/third/fourth stay distinguishable by text and order, not medal color alone`, async ({
      page,
    }) => {
      await page.goto('competitions/world-cup');

      await withVisionDeficiency(page, deficiency, async () => {
        const firstPodiumCard = page.locator('.podium__card').first();
        const ranks = firstPodiumCard.locator('.podium__rank');
        const labels = await ranks.locator('.visually-hidden').allTextContents();
        // Every rank present carries its own non-empty, distinct label -
        // the signal a screen reader (unaffected by any visual filter) and
        // a sighted colorblind reader relying on the same DOM order both
        // get, independent of the medal emoji's now-similar hue.
        expect(labels.length).toBeGreaterThanOrEqual(3);
        expect(new Set(labels).size).toBe(labels.length);
        expect(labels[0]).toBe('Champion:');
      });
    });
  }
});
