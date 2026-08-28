import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// Per-edition pages (src/pages/competitions/euro/[year].astro and its
// Croatian sibling): one page per UEFA European Championship edition,
// reached by tapping a year in the competition table - third competition to
// get edition pages after the FIFA World Cup and Copa América.

test.describe('EURO edition page', () => {
  test('the Year column links each edition to its own page', async ({ page }) => {
    await page.goto('competitions/euro');
    const yearLink = page.locator('tbody tr[data-year="2016"] a', { hasText: '2016' });
    await expect(yearLink).toHaveAttribute('href', /\/competitions\/euro\/2016\/?$/);
    await yearLink.click();
    await expect(page).toHaveURL(/\/competitions\/euro\/2016\/?$/);
    await expect(page.locator('h1')).toHaveText('2016 UEFA European Championship');
  });

  test('shows every placing, with team columns linked to team profiles', async ({ page }) => {
    await page.goto('competitions/euro/2016');

    const facts = page.locator('.edition__fact');
    await expect(facts.filter({ hasText: 'Winner' })).toContainText('Portugal');
    await expect(facts.filter({ hasText: 'Runner-up' })).toContainText('France');

    // The champion links to its team profile.
    await expect(page.locator('.edition__fact a', { hasText: 'Portugal' })).toHaveAttribute(
      'href',
      /\/teams\/portugal\/?$/,
    );
    // The host is a country name too, but it is not a placing - it must not link.
    await expect(page.locator('.edition__fact', { hasText: 'Host' }).locator('a')).toHaveCount(0);
  });

  test("shows that edition's top scorer, joined in from the Golden Boot data", async ({ page }) => {
    await page.goto('competitions/euro/2016');
    await expect(page.locator('.edition__fact', { hasText: 'Top scorer' })).toContainText('Antoine Griezmann');
  });

  test('the prev/next pager moves between adjacent editions', async ({ page }) => {
    await page.goto('competitions/euro/2016');
    // 2016's next edition is 2020; its previous is 2012.
    await page.locator('.edition__pager-link--next').click();
    await expect(page).toHaveURL(/\/competitions\/euro\/2020\/?$/);
    await expect(page.locator('h1')).toHaveText('2020 UEFA European Championship');
  });

  test('the oldest edition has no previous link', async ({ page }) => {
    await page.goto('competitions/euro/1960');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toHaveCount(0);
    await expect(page.locator('.edition__pager-link--next')).toBeVisible();
  });

  test('links back to the full competition table', async ({ page }) => {
    await page.goto('competitions/euro/2016');
    const back = page.locator('.edition__back a');
    await expect(back).toContainText('All UEFA European Championship editions');
    await expect(back).toHaveAttribute('href', /\/competitions\/euro\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('competitions/euro/2016');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/euro/2016');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the Croatian edition page', async ({ page }) => {
    await page.goto('competitions/euro/2016');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/euro\/2016\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('competitions/euro/2016');
    const link = page.locator('a[download][href$="downloads/edition-euro-2016.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Croatian EURO edition page', () => {
  test('renders translated chrome, with placings still linked to team profiles', async ({ page }) => {
    await page.goto('hr/competitions/euro/2016');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('UEFA Europsko prvenstvo 2016.');
    await expect(page.locator('.edition__fact', { hasText: 'Prvak' })).toContainText('Portugal');
    await expect(page.locator('.edition__fact a', { hasText: 'Portugal' })).toHaveAttribute(
      'href',
      /\/hr\/teams\/portugal\/?$/,
    );
  });

  test('the Croatian competition table links each year to the Croatian edition page', async ({ page }) => {
    await page.goto('hr/competitions/euro');
    const yearLink = page.locator('tbody tr[data-year="2016"] a', { hasText: '2016' });
    await expect(yearLink).toHaveAttribute('href', /\/hr\/competitions\/euro\/2016\/?$/);
  });

  test('the back link and pager use Croatian copy', async ({ page }) => {
    await page.goto('hr/competitions/euro/2016');
    await expect(page.locator('.edition__back a')).toContainText('Sva izdanja natjecanja');
    await expect(page.locator('.edition__pager-link--next')).toContainText('Sljedeće izdanje');
  });

  test('the language switcher returns to the English edition page', async ({ page }) => {
    await page.goto('hr/competitions/euro/2016');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/euro\/2016\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/euro/2016');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('hr/competitions/euro/2016');
    const link = page.locator('a[download][href$="downloads/edition-euro-2016-hr.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});
