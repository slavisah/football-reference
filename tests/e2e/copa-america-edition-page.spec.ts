import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// Per-edition pages for Copa América (src/pages/competitions/copa-america/
// [year].astro and its Croatian sibling) - the second competition to get
// edition pages after the FIFA World Cup (tests/e2e/edition-page.spec.ts).
// The one real difference this suite exists to cover: Copa América played
// two tournaments in 1959 (Argentina-hosted, then Ecuador-hosted), so
// buildEditionProfiles() disambiguates that pair's slugs by host
// ("1959-argentina"/"1959-ecuador") - see src/lib/editionProfile.ts.

test.describe('Copa América edition page', () => {
  test('a normal (non-duplicate) year links straight through, same as World Cup', async ({ page }) => {
    await page.goto('competitions/copa-america');
    const yearLink = page.locator('tbody tr[data-year="2024"] a', { hasText: '2024' });
    await expect(yearLink).toHaveAttribute('href', /\/competitions\/copa-america\/2024\/?$/);
    await yearLink.click();
    await expect(page).toHaveURL(/\/competitions\/copa-america\/2024\/?$/);
    await expect(page.locator('h1')).toHaveText('2024 Copa América');
  });

  test('both 1959 rows link to their own host-disambiguated page, not the same one', async ({ page }) => {
    await page.goto('competitions/copa-america');
    const argentinaRow = page.locator('tbody tr[data-year="1959"][data-host="Argentina"] a', {
      hasText: '1959',
    });
    const ecuadorRow = page.locator('tbody tr[data-year="1959"][data-host="Ecuador"] a', {
      hasText: '1959',
    });
    await expect(argentinaRow).toHaveAttribute('href', /\/competitions\/copa-america\/1959-argentina\/?$/);
    await expect(ecuadorRow).toHaveAttribute('href', /\/competitions\/copa-america\/1959-ecuador\/?$/);
  });

  test('each 1959 page shows its own champion, distinguished by host in the title', async ({ page }) => {
    await page.goto('competitions/copa-america/1959-argentina');
    await expect(page.locator('h1')).toHaveText('1959 (Argentina) Copa América');
    await expect(page.locator('.edition__fact', { hasText: 'Champion' })).toContainText('Argentina');

    await page.goto('competitions/copa-america/1959-ecuador');
    await expect(page.locator('h1')).toHaveText('1959 (Ecuador) Copa América');
    await expect(page.locator('.edition__fact', { hasText: 'Champion' })).toContainText('Uruguay');
    await expect(page.locator('.edition__fact a', { hasText: 'Uruguay' })).toHaveAttribute(
      'href',
      /\/teams\/uruguay\/?$/,
    );
  });

  test('the pager between the two 1959 editions shows the host, and links correctly', async ({ page }) => {
    await page.goto('competitions/copa-america/1959-argentina');
    // Previous (1957) is unambiguous and shows no disambiguator; next (the
    // other 1959 tournament) shows "1959 (Ecuador)" so the two aren't
    // indistinguishable in the pager.
    await expect(page.locator('.edition__pager-link:not(.edition__pager-link--next)')).toContainText('1957');
    await expect(page.locator('.edition__pager-link--next')).toContainText('1959 (Ecuador)');
    await page.locator('.edition__pager-link--next').click();
    await expect(page).toHaveURL(/\/competitions\/copa-america\/1959-ecuador\/?$/);

    // From the Ecuador edition, previous points back to Argentina's, and next
    // moves on to the real following edition (1963) with no disambiguator.
    await expect(page.locator('.edition__pager-link:not(.edition__pager-link--next)')).toContainText(
      '1959 (Argentina)',
    );
    await expect(page.locator('.edition__pager-link--next')).toContainText('1963');
  });

  test('links back to the full competition table', async ({ page }) => {
    await page.goto('competitions/copa-america/1959-argentina');
    const back = page.locator('.edition__back a');
    await expect(back).toContainText('All Copa América editions');
    await expect(back).toHaveAttribute('href', /\/competitions\/copa-america\/?$/);
  });

  test('has no horizontal page overflow at 360px on either 1959 page', async ({ page }) => {
    for (const slug of ['1959-argentina', '1959-ecuador']) {
      await page.goto(`competitions/copa-america/${slug}`);
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/copa-america/1959-ecuador');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the matching Croatian edition page', async ({ page }) => {
    await page.goto('competitions/copa-america/1959-ecuador');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/copa-america\/1959-ecuador\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('competitions/copa-america/1959-argentina');
    const link = page.locator('a[download][href$="downloads/edition-copa-america-1959-argentina.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Croatian Copa América edition page', () => {
  test('renders translated chrome with the host disambiguator carried through', async ({ page }) => {
    await page.goto('hr/competitions/copa-america/1959-argentina');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('1959. (Argentina) Copa América');
    await expect(page.locator('.edition__fact', { hasText: 'Prvak' })).toContainText('Argentina');
  });

  test('the Croatian competition table links both 1959 rows to their own Croatian edition page', async ({
    page,
  }) => {
    await page.goto('hr/competitions/copa-america');
    const ecuadorRow = page.locator('tbody tr[data-year="1959"][data-host="Ecuador"] a', {
      hasText: '1959',
    });
    await expect(ecuadorRow).toHaveAttribute('href', /\/hr\/competitions\/copa-america\/1959-ecuador\/?$/);
  });

  test('the pager uses Croatian copy alongside the host disambiguator', async ({ page }) => {
    await page.goto('hr/competitions/copa-america/1959-argentina');
    await expect(page.locator('.edition__pager-link--next')).toContainText('Sljedeće izdanje');
    await expect(page.locator('.edition__pager-link--next')).toContainText('1959 (Ecuador)');
  });

  test('the language switcher returns to the matching English edition page', async ({ page }) => {
    await page.goto('hr/competitions/copa-america/1959-ecuador');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/copa-america\/1959-ecuador\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/copa-america/1959-ecuador');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('hr/competitions/copa-america/1959-argentina');
    const link = page.locator('a[download][href$="downloads/edition-copa-america-1959-argentina-hr.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});
