import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The main accessibility.spec.ts sweep loads every page once per color scheme
// via Playwright's `colorScheme` emulation - it never actually clicks the
// theme-toggle button itself. That leaves the one truly interactive,
// client-side state change on every page of the site (`ThemeToggle.astro`)
// with zero test coverage of any kind before this run - not a Vitest unit
// test (there is no pure function here, it's a DOM script), not a Playwright
// functional test, not an axe pass. docs/PROJECT_STATUS.md's prior
// "Left for a future pass" note named exactly this gap: "the theme-toggle
// button's actual click interaction... has not been driven through axe as a
// live state change."

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

test.describe('theme toggle, English home page', () => {
  test('click toggles theme, aria-pressed, label text, and persists via localStorage', async ({
    page,
  }) => {
    await page.goto('');

    const toggle = page.locator('#theme-toggle');
    const label = page.locator('#theme-toggle .theme-toggle__label');

    // Fresh visit, no saved preference: the client script's sync() runs once
    // on load and falls back to the emulated OS color scheme (Playwright's
    // default is 'light', per playwright.config.ts not overriding it here),
    // so both the label and aria-pressed already reflect "light" before any
    // click - not the static "Theme" text that only appears in the
    // server-rendered markup for a split second before hydration.
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(label).toHaveText('Light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(label).toHaveText('Dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    // The click itself introduces no new DOM, but the whole page's rendered
    // colors are now driven by the dark palette - confirm that live state
    // still meets WCAG, not just the emulated colorScheme in
    // accessibility.spec.ts.
    await runAxe(page);

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(label).toHaveText('Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    await runAxe(page);
  });

  test('is keyboard-operable and the saved choice survives a reload', async ({ page }) => {
    await page.goto('');

    const toggle = page.locator('#theme-toggle');
    await toggle.focus();
    await expect(toggle).toBeFocused();

    // Native <button> elements activate on both Enter and Space; a reader
    // relying on a keyboard alone must be able to use either.
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    // Reloading re-runs BaseLayout's before-paint inline script, which reads
    // localStorage - the saved choice must survive a real navigation, not
    // just live in the current page's in-memory DOM state.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#theme-toggle .theme-toggle__label')).toHaveText('Dark');
  });
});

// Canary coverage in the Croatian translation, confirming the toggle's
// localized labels (data-light-label/data-dark-label, wired through
// ThemeToggle's `locale` prop) actually reach the live-updated label text -
// not just the initial server render, which the main accessibility.spec.ts
// sweep already covers.
test.describe('theme toggle, Croatian home page', () => {
  test('click toggles the Croatian label text', async ({ page }) => {
    await page.goto('hr/');

    const toggle = page.locator('#theme-toggle');
    const label = page.locator('#theme-toggle .theme-toggle__label');

    // Same sync()-on-load reasoning as the English test: the label starts at
    // the Croatian "light" word, not the static "Tema" heading text.
    await expect(label).toHaveText('Svijetla');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(label).toHaveText('Tamna');
    await runAxe(page);

    await toggle.click();
    await expect(label).toHaveText('Svijetla');
  });
});
