import { test, expect, type Page } from '@playwright/test';

// src/styles/global.css resolves its color tokens (--bg, --text, etc.) two
// different ways: the `prefers-color-scheme: dark` media query (the OS
// default, used before any JS runs or when a reader never touches the
// toggle) and the `[data-theme='light']`/`[data-theme='dark']` attribute
// selectors (ThemeToggle.astro's explicit override, persisted in
// localStorage). Nothing before this file asserted the two mechanisms
// actually agree. They drifted once already: a --danger contrast fix landed
// only in the media-query block, so a reader who let the OS pick dark mode
// got the WCAG-AA-passing red while a reader who clicked the toggle to dark
// kept the ~2.65:1 failing one (see the --danger comments in global.css).
// This test pins both paths to the same computed values so a future
// single-block edit fails loudly instead of silently shipping split themes.

const TOKENS = [
  '--bg',
  '--bg-elevated',
  '--bg-subtle',
  '--text',
  '--text-muted',
  '--border',
  '--accent',
  '--accent-contrast',
  '--highlight',
  '--focus',
  '--danger',
  '--shadow',
] as const;

async function readTokens(page: Page): Promise<Record<string, string>> {
  return page.evaluate((tokens) => {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim()]));
  }, TOKENS);
}

test.describe('theme token parity between OS preference and the explicit toggle', () => {
  test('dark: prefers-color-scheme default and the toggle-forced override match', async ({
    browser,
  }) => {
    const osDarkContext = await browser.newContext({ colorScheme: 'dark' });
    const osDarkPage = await osDarkContext.newPage();
    await osDarkPage.goto('');
    const osDarkTokens = await readTokens(osDarkPage);
    await osDarkContext.close();

    const toggledContext = await browser.newContext({ colorScheme: 'light' });
    const toggledPage = await toggledContext.newPage();
    await toggledPage.goto('');
    await toggledPage.locator('#theme-toggle').click();
    await expect(toggledPage.locator('html')).toHaveAttribute('data-theme', 'dark');
    const toggledDarkTokens = await readTokens(toggledPage);
    await toggledContext.close();

    expect(toggledDarkTokens).toEqual(osDarkTokens);
  });

  test('light: prefers-color-scheme default and the toggle-forced override match', async ({
    browser,
  }) => {
    const osLightContext = await browser.newContext({ colorScheme: 'light' });
    const osLightPage = await osLightContext.newPage();
    await osLightPage.goto('');
    const osLightTokens = await readTokens(osLightPage);
    await osLightContext.close();

    const toggledContext = await browser.newContext({ colorScheme: 'dark' });
    const toggledPage = await toggledContext.newPage();
    await toggledPage.goto('');
    await toggledPage.locator('#theme-toggle').click();
    await expect(toggledPage.locator('html')).toHaveAttribute('data-theme', 'light');
    const toggledLightTokens = await readTokens(toggledPage);
    await toggledContext.close();

    expect(toggledLightTokens).toEqual(osLightTokens);
  });
});
