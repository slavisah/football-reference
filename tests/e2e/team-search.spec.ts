import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The global "find a team" quick-jump widget (Nav.astro, both languages,
// every one of the 27 built pages) - an editable ARIA 1.2 combobox that
// filters a lazily-fetched team-name index (/team-index.json) as the reader
// types and sends Enter/click to /compare?a=<id>, the same shareable param
// /compare's own two <select> pickers already read/write. See
// docs/PROJECT_STATUS.md's "left for a future pass" note (2026-08-17 run)
// for why this widget exists and what it deliberately doesn't cover yet.
//
// Every "navigates to /compare?a=<id>" assertion below matches with a plain
// `.toContain()`/regex-without-end-anchor rather than an exact URL, because
// landing on /compare with only `?a=` set still runs that page's own
// existing client script, which immediately re-derives Team B from its
// second <select>'s default value and appends `&b=<id>` via
// `history.replaceState` - real, already-tested behavior of /compare
// itself (see src/pages/compare.astro's `writeParams`), not something this
// widget controls or should assert away.

async function openAndType(page: import('@playwright/test').Page, query: string) {
  const input = page.locator('#team-search-input');
  await input.click();
  await input.fill(query);
  await expect(page.locator('#team-search-status')).not.toHaveText('Loading teams…');
}

test.describe('Find a team (English)', () => {
  test('is present, closed, on the home page', async ({ page }) => {
    await page.goto('');
    const input = page.locator('#team-search-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Find a team…');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('is present on a non-home page too (shared Nav.astro)', async ({ page }) => {
    await page.goto('quiz');
    await expect(page.locator('#team-search-input')).toBeVisible();
  });

  test('typing filters the fetched team list and shows matching options', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'braz');
    await expect(page.locator('#team-search-listbox')).toBeVisible();
    const options = page.locator('#team-search-listbox [role="option"]');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveText('Brazil');
  });

  test('matching is case- and diacritic-insensitive', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'TURKIYE');
    const options = page.locator('#team-search-listbox [role="option"]');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveText('Türkiye');
  });

  test('an unmatched query shows the translated no-results message, not a stale list', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'zzzznotateam');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
    await expect(page.locator('#team-search-status')).toHaveText('No teams match “zzzznotateam”.');
  });

  test('clearing the input closes the listbox again', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'brazil');
    await expect(page.locator('#team-search-listbox')).toBeVisible();
    await page.locator('#team-search-input').fill('');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
  });

  test('Escape closes an open listbox without navigating', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'brazil');
    await expect(page.locator('#team-search-listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
    await expect(page).toHaveURL(/\/football-reference\/?$/);
  });

  test('ArrowDown then Enter selects the active option and navigates to /compare?a=<id>', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'braz');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#team-search-listbox [role="option"].is-active')).toHaveText('Brazil');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/compare\?a=brazil(&|$)/);
    await expect(page.locator('#compare-a')).toHaveValue('brazil');
    await expect(page.locator('#compare-a-name')).toHaveText('Brazil');
  });

  test('clicking an option navigates to /compare?a=<id> the same way', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'argentina');
    await page.locator('#team-search-listbox [role="option"]', { hasText: 'Argentina' }).click();
    await expect(page).toHaveURL(/\/compare\?a=argentina(&|$)/);
    await expect(page.locator('#compare-a')).toHaveValue('argentina');
  });

  test('ArrowUp wraps from the first (auto-active) option to the last, ArrowDown wraps back', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'a');
    const options = page.locator('#team-search-listbox [role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(1);
    const active = page.locator('#team-search-listbox [role="option"].is-active');

    // Rendering a result set auto-activates its first option (so Enter works
    // immediately without pressing an arrow key first) - confirm that before
    // relying on it for the wrap assertions below.
    const first = await options.first().textContent();
    await expect(active).toHaveText(first ?? '');

    const last = await options.nth(count - 1).textContent();
    await page.keyboard.press('ArrowUp');
    expect(await active.textContent()).toBe(last);

    await page.keyboard.press('ArrowDown');
    expect(await active.textContent()).toBe(first);
  });

  test('clicking outside the widget closes the listbox', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'brazil');
    await expect(page.locator('#team-search-listbox')).toBeVisible();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#team-search-listbox')).toBeHidden();
  });
});

test.describe('Find a team (Croatian)', () => {
  test('uses the Croatian label/placeholder and still navigates to the Croatian compare page', async ({
    page,
  }) => {
    await page.goto('hr/');
    const input = page.locator('#team-search-input');
    await expect(input).toHaveAttribute('placeholder', 'Pronađi reprezentaciju…');
    await expect(page.locator('label[for="team-search-input"]')).toHaveText('Pronađi reprezentaciju');

    await openAndType(page, 'brazil');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/hr\/compare\?a=brazil(&|$)/);
    await expect(page.locator('#compare-a')).toHaveValue('brazil');
  });

  test('no-results message is in Croatian', async ({ page }) => {
    await page.goto('hr/');
    await openAndType(page, 'zzzznotateam');
    await expect(page.locator('#team-search-listbox')).toBeHidden();
    await expect(page.locator('#team-search-status')).toHaveText(
      'Nijedna reprezentacija ne odgovara upitu „zzzznotateam”.',
    );
  });
});

test.describe('Find a team accessibility', () => {
  const COLOR_SCHEMES = ['light', 'dark'] as const;

  for (const colorScheme of COLOR_SCHEMES) {
    test(`open listbox with an active option has no WCAG violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('');
      await openAndType(page, 'braz');
      await page.keyboard.press('ArrowDown');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['region'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('combobox exposes the expected ARIA wiring while open', async ({ page }) => {
    await page.goto('');
    const input = page.locator('#team-search-input');
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-controls', 'team-search-listbox');

    await openAndType(page, 'braz');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const activeId = await page.locator('#team-search-listbox [role="option"].is-active').getAttribute('id');
    await expect(input).toHaveAttribute('aria-activedescendant', activeId ?? '');
    await expect(page.locator('#team-search-listbox')).toHaveAttribute('role', 'listbox');
  });
});
