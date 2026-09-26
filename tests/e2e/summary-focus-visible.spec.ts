import { test, expect, type Page } from '@playwright/test';

// global.css's shared `:focus-visible` rule (the single place every
// interactive element's keyboard focus ring is defined, via the `--focus`
// design token) listed `a`, `button`, `select`, `input` and `[tabindex]` -
// but never `summary`, even though `<summary>` is a real, natively
// keyboard-focusable element and this site uses it as the trigger for every
// `<details>` disclosure it has: the quiz's "Just show me the answer" cards
// (QuizCard.astro/QuizOrderCard.astro) and TournamentTable.astro's
// per-edition "story reveal" rows. Without the selector, a keyboard user
// tabbing to one of those triggers fell through to the browser's own
// unstyled `outline: auto` ring instead of the site's `--focus` token like
// every other control - not just a style inconsistency, but a real contrast
// gap in dark mode specifically: Chromium's own default ring renders as a
// near-black outline (measured here at rgb(16, 16, 16)) against
// `--dark-bg` (#0f1520), a contrast ratio of roughly 1.04:1, while
// `--dark-focus` (#6ba6ff) exists precisely to stay visible against that
// same background. Fixed by adding `summary:focus-visible` to the shared
// rule. This file pins both `<details>` call sites, both color schemes and
// both languages so a future edit can't quietly drop `summary` from the
// selector list again.

const FOCUS_LIGHT = 'rgb(31, 111, 235)'; // --light-focus: #1f6feb
const FOCUS_DARK = 'rgb(107, 166, 255)'; // --dark-focus: #6ba6ff

async function focusStyles(locator: ReturnType<Page['locator']>) {
  await locator.focus();
  return locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor };
  });
}

test.describe('every <summary> disclosure trigger gets the site focus ring, not the browser default', () => {
  test('quiz "Just show me the answer" summary (light)', async ({ page }) => {
    await page.goto('quiz');
    const summary = page.locator('.quiz-card__reveal summary').first();
    const styles = await focusStyles(summary);
    expect(styles.outlineStyle).toBe('solid');
    expect(styles.outlineWidth).toBe('3px');
    expect(styles.outlineColor).toBe(FOCUS_LIGHT);
  });

  test('quiz "Just show me the answer" summary (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('quiz');
    const summary = page.locator('.quiz-card__reveal summary').first();
    const styles = await focusStyles(summary);
    expect(styles.outlineColor).toBe(FOCUS_DARK);
  });

  test('Croatian quiz summary keeps the same indicator', async ({ page }) => {
    await page.goto('hr/quiz');
    const summary = page.locator('.quiz-card__reveal summary').first();
    const styles = await focusStyles(summary);
    expect(styles.outlineStyle).toBe('solid');
    expect(styles.outlineColor).toBe(FOCUS_LIGHT);
  });

  test('TournamentTable "story reveal" summary (light)', async ({ page }) => {
    await page.goto('competitions/world-cup');
    const summary = page.locator('.story-reveal summary').first();
    await expect(summary).toBeVisible();
    const styles = await focusStyles(summary);
    expect(styles.outlineStyle).toBe('solid');
    expect(styles.outlineWidth).toBe('3px');
    expect(styles.outlineColor).toBe(FOCUS_LIGHT);
  });

  test('TournamentTable "story reveal" summary (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('competitions/world-cup');
    const summary = page.locator('.story-reveal summary').first();
    await expect(summary).toBeVisible();
    const styles = await focusStyles(summary);
    expect(styles.outlineColor).toBe(FOCUS_DARK);
  });

  test('Croatian TournamentTable story-reveal summary keeps the same indicator', async ({ page }) => {
    await page.goto('hr/competitions/world-cup');
    const summary = page.locator('.story-reveal summary').first();
    await expect(summary).toBeVisible();
    const styles = await focusStyles(summary);
    expect(styles.outlineStyle).toBe('solid');
    expect(styles.outlineColor).toBe(FOCUS_LIGHT);
  });
});
