import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// Per-edition pages (src/pages/competitions/ballon-dor/[year].astro and its
// Croatian sibling): one page per Men's Ballon d'Or edition, reached by
// tapping a year in the award table - the first individual-award edition
// pages on the site (every prior edition-page family was a team
// competition). The "Winner" column links to a `/players/` profile instead
// of a `/teams/` one, and "National team" links to `/teams/` separately -
// see src/lib/editionProfile.ts's `individualAward` option. Also covers the
// 2020 "Not awarded" row, a real placeholder value the page must render
// without a broken link.

test.describe('Ballon d\'Or edition page', () => {
  test('the Year column links each edition to its own page', async ({ page }) => {
    await page.goto('competitions/ballon-dor');
    const yearLink = page.locator('tbody tr[data-year="2018"] a', { hasText: '2018' });
    await expect(yearLink).toHaveAttribute('href', /\/competitions\/ballon-dor\/2018\/?$/);
    await yearLink.click();
    await expect(page).toHaveURL(/\/competitions\/ballon-dor\/2018\/?$/);
    await expect(page.locator('h1')).toHaveText("2018 Men's Ballon d'Or");
  });

  test('shows the winner linked to their player profile and their team linked separately', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2018');

    const facts = page.locator('.edition__fact');
    await expect(facts.filter({ hasText: 'Winner' })).toContainText('Luka Modrić');
    await expect(facts.filter({ hasText: 'National team' })).toContainText('Croatia');

    await expect(page.locator('.edition__fact a', { hasText: 'Luka Modrić' })).toHaveAttribute(
      'href',
      /\/players\/luka-modric\/?$/,
    );
    await expect(page.locator('.edition__fact a', { hasText: 'Croatia' })).toHaveAttribute(
      'href',
      /\/teams\/croatia\/?$/,
    );
  });

  test('the "Not awarded" 2020 edition renders with no broken winner link', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2020');
    await expect(page.locator('h1')).toHaveText("2020 Men's Ballon d'Or");
    const winnerFact = page.locator('.edition__fact', { hasText: 'Winner' });
    await expect(winnerFact).toContainText('Not awarded');
    await expect(winnerFact.locator('a')).toHaveCount(0);
  });

  test('the prev/next pager moves between adjacent editions', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2018');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toContainText('2017');
    await page.locator('.edition__pager-link--next').click();
    await expect(page).toHaveURL(/\/competitions\/ballon-dor\/2019\/?$/);
    await expect(page.locator('h1')).toHaveText("2019 Men's Ballon d'Or");
  });

  test('the oldest edition has no previous link', async ({ page }) => {
    await page.goto('competitions/ballon-dor/1956');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toHaveCount(0);
    await expect(page.locator('.edition__pager-link--next')).toBeVisible();
  });

  test('links back to the full award table', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2018');
    const back = page.locator('.edition__back a');
    await expect(back).toContainText("All Men's Ballon d'Or editions");
    await expect(back).toHaveAttribute('href', /\/competitions\/ballon-dor\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2018');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2018');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the Croatian edition page', async ({ page }) => {
    await page.goto('competitions/ballon-dor/2018');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/ballon-dor\/2018\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('competitions/ballon-dor/2018');
    const link = page.locator('a[download][href$="downloads/edition-ballon-dor-2018.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe("Croatian Ballon d'Or edition page", () => {
  test('renders translated chrome, with the winner and team linked to their profiles', async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor/2018');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('Zlatna lopta 2018.');
    await expect(page.locator('.edition__fact', { hasText: 'Pobjednik' })).toContainText('Luka Modrić');
    await expect(page.locator('.edition__fact a', { hasText: 'Luka Modrić' })).toHaveAttribute(
      'href',
      /\/hr\/players\/luka-modric\/?$/,
    );
    await expect(page.locator('.edition__fact a', { hasText: 'Croatia' })).toHaveAttribute(
      'href',
      /\/hr\/teams\/croatia\/?$/,
    );
  });

  test('the "Not awarded" 2020 edition reads correctly in Croatian', async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor/2020');
    await expect(page.locator('h1')).toHaveText('Zlatna lopta 2020.');
    const winnerFact = page.locator('.edition__fact', { hasText: 'Pobjednik' });
    await expect(winnerFact).toContainText('Not awarded');
    await expect(winnerFact.locator('a')).toHaveCount(0);
  });

  test('the Croatian award table links each year to the Croatian edition page', async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor');
    const yearLink = page.locator('tbody tr[data-year="2018"] a', { hasText: '2018' });
    await expect(yearLink).toHaveAttribute('href', /\/hr\/competitions\/ballon-dor\/2018\/?$/);
  });

  test('the back link and pager use Croatian copy', async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor/2018');
    await expect(page.locator('.edition__back a')).toContainText('Sva izdanja natjecanja');
    await expect(page.locator('.edition__pager-link--next')).toContainText('Sljedeće izdanje');
  });

  test('the language switcher returns to the English edition page', async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor/2018');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/ballon-dor\/2018\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('hr/competitions/ballon-dor/2018');
    const link = page.locator('a[download][href$="downloads/edition-ballon-dor-2018-hr.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor/2018');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
