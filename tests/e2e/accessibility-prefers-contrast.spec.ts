import { test, expect, type Page } from '@playwright/test';
import { openMenu } from './menu';

// First-ever dedicated `prefers-contrast: more` coverage. global.css's new
// --light-contrast-border/--dark-contrast-border and
// --light-contrast-text-muted/--dark-contrast-text-muted tokens replace the
// deliberately subtle --border (a near-invisible ~1.3:1 card/table divider in
// both themes) and --text-muted with much higher-contrast versions for a
// reader whose OS asks for more contrast - see the comment above those tokens
// in global.css for the measured ratios.
//
// `contrast` isn't a `test.use()`-able PlaywrightTestOption in the pinned
// Playwright version here (unlike `colorScheme`) - only
// `page.emulateMedia()`/`browser.newContext({ contrast })` expose it, the
// same reason `accessibility-reduced-motion.spec.ts` and
// `accessibility-forced-colors.spec.ts` emulate per-test rather than using
// `test.use()`.
//
// global.css resolves --border/--text-muted through four blocks (default,
// `prefers-color-scheme: dark`, `[data-theme='light']`,
// `[data-theme='dark']`) and the contrast override mirrors all four exactly,
// for the same reason `theme-token-parity.spec.ts` pins the color-scheme
// blocks against each other: a fix landing in only one of the four already
// caused a real split-theme bug once (see the --danger comment in
// global.css). This test covers all four contrast x color-scheme
// combinations rather than just the default light one.

async function readBorderAndMuted(page: Page): Promise<{ border: string; textMuted: string }> {
  return page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      border: styles.getPropertyValue('--border').trim(),
      textMuted: styles.getPropertyValue('--text-muted').trim(),
    };
  });
}

test.describe('prefers-contrast: more', () => {
  test('OS light + no explicit theme resolves the light contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#5c6b7a');
    expect(tokens.textMuted).toBe('#3b4652');
  });

  test('OS dark + no explicit theme resolves the dark contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#7d92ab');
    expect(tokens.textMuted).toBe('#c7d2e0');
  });

  test('OS dark + toggled to light resolves the light contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    await openMenu(page);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#5c6b7a');
    expect(tokens.textMuted).toBe('#3b4652');
  });

  test('OS light + toggled to dark resolves the dark contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    await openMenu(page);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#7d92ab');
    expect(tokens.textMuted).toBe('#c7d2e0');
  });
});

test.describe('no prefers-contrast preference (baseline)', () => {
  test('the light theme keeps its normal, subtle --border/--text-muted', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#d7dde5');
    expect(tokens.textMuted).toBe('#56636f');
  });

  test('the dark theme keeps its normal, subtle --border/--text-muted', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#2b3a4f');
    expect(tokens.textMuted).toBe('#a3b0c0');
  });
});
