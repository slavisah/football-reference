import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// Per-edition pages (src/pages/competitions/nations-league/[year].astro and
// its Croatian sibling): one page per UEFA Nations League Finals edition,
// reached by tapping a season in the competition table - fourth competition
// to get edition pages, and the first with no Golden Boot top-scorer join
// (that award only tracks the FIFA World Cup and UEFA EURO). Season labels
// use an en dash in the source table ("2022–23") but a plain-hyphen slug in
// the URL ("2022-23") - see src/lib/editionProfile.ts's editionSlug().

test.describe('Nations League edition page', () => {
  test('the Season column links each edition to its own page', async ({ page }) => {
    await page.goto('competitions/nations-league');
    const seasonLink = page.locator('tbody tr[data-year="2022–23"] a', { hasText: '2022' });
    await expect(seasonLink).toHaveAttribute('href', /\/competitions\/nations-league\/2022-23\/?$/);
    await seasonLink.click();
    await expect(page).toHaveURL(/\/competitions\/nations-league\/2022-23\/?$/);
    await expect(page.locator('h1')).toHaveText('2022–23 UEFA Nations League Finals');
  });

  test('shows every placing, with team columns linked to team profiles', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');

    const facts = page.locator('.edition__fact');
    await expect(facts.filter({ hasText: 'Winner' })).toContainText('Spain');
    await expect(facts.filter({ hasText: 'Runner-up' })).toContainText('Croatia');

    await expect(page.locator('.edition__fact a', { hasText: 'Spain' })).toHaveAttribute(
      'href',
      /\/teams\/spain\/?$/,
    );
    await expect(page.locator('.edition__fact a', { hasText: 'Croatia' })).toHaveAttribute(
      'href',
      /\/teams\/croatia\/?$/,
    );
    // The Finals host is a country name too, but it is not a placing - it must not link.
    await expect(page.locator('.edition__fact', { hasText: 'Finals host' }).locator('a')).toHaveCount(0);
  });

  test('has no top-scorer fact - Nations League is not a Golden Boot competition', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');
    await expect(page.locator('.edition__fact', { hasText: 'Top scorer' })).toHaveCount(0);
  });

  test('the prev/next pager moves between adjacent editions', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');
    // 2022-23's next edition is 2024-25; its previous is 2020-21.
    await page.locator('.edition__pager-link--next').click();
    await expect(page).toHaveURL(/\/competitions\/nations-league\/2024-25\/?$/);
    await expect(page.locator('h1')).toHaveText('2024–25 UEFA Nations League Finals');
  });

  test('the oldest edition has no previous link', async ({ page }) => {
    await page.goto('competitions/nations-league/2018-19');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toHaveCount(0);
    await expect(page.locator('.edition__pager-link--next')).toBeVisible();
  });

  test('links back to the full competition table', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');
    const back = page.locator('.edition__back a');
    await expect(back).toContainText('All UEFA Nations League editions');
    await expect(back).toHaveAttribute('href', /\/competitions\/nations-league\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the Croatian edition page', async ({ page }) => {
    await page.goto('competitions/nations-league/2022-23');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/nations-league\/2022-23\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('competitions/nations-league/2022-23');
    const link = page.locator('a[download][href$="downloads/edition-nations-league-2022-23.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Croatian Nations League edition page', () => {
  test('renders translated chrome, with placings still linked to team profiles', async ({ page }) => {
    await page.goto('hr/competitions/nations-league/2022-23');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('Final Four UEFA Liga nacija 2022–23.');
    await expect(page.locator('.edition__fact', { hasText: 'Prvak' })).toContainText('Spain');
    await expect(page.locator('.edition__fact a', { hasText: 'Spain' })).toHaveAttribute(
      'href',
      /\/hr\/teams\/spain\/?$/,
    );
  });

  test('the Croatian competition table links each season to the Croatian edition page', async ({ page }) => {
    await page.goto('hr/competitions/nations-league');
    const seasonLink = page.locator('tbody tr[data-year="2022–23"] a', { hasText: '2022' });
    await expect(seasonLink).toHaveAttribute('href', /\/hr\/competitions\/nations-league\/2022-23\/?$/);
  });

  test('the back link and pager use Croatian copy', async ({ page }) => {
    await page.goto('hr/competitions/nations-league/2022-23');
    await expect(page.locator('.edition__back a')).toContainText('Sva izdanja natjecanja');
    await expect(page.locator('.edition__pager-link--next')).toContainText('Sljedeće izdanje');
  });

  test('the language switcher returns to the English edition page', async ({ page }) => {
    await page.goto('hr/competitions/nations-league/2022-23');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/nations-league\/2022-23\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('hr/competitions/nations-league/2022-23');
    const link = page.locator('a[download][href$="downloads/edition-nations-league-2022-23-hr.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/nations-league/2022-23');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
