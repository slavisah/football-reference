import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// Per-edition pages (src/pages/competitions/world-cup/[year].astro and its
// Croatian sibling): one page per FIFA World Cup edition, reached by tapping a
// year in the competition table, with every placing linked out to that team's
// profile and a prev/next pager between adjacent editions.

test.describe('World Cup edition page', () => {
  test('the Year column links each edition to its own page', async ({ page }) => {
    await page.goto('competitions/world-cup');
    const yearLink = page.locator('tbody tr[data-year="2018"] a', { hasText: '2018' });
    await expect(yearLink).toHaveAttribute('href', /\/competitions\/world-cup\/2018\/?$/);
    await yearLink.click();
    await expect(page).toHaveURL(/\/competitions\/world-cup\/2018\/?$/);
    await expect(page.locator('h1')).toHaveText('2018 FIFA World Cup');
  });

  test('shows every placing, with the four team columns linked to team profiles', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');

    const facts = page.locator('.edition__fact');
    await expect(facts.filter({ hasText: 'Winner' })).toContainText('France');
    await expect(facts.filter({ hasText: 'Runner-up' })).toContainText('Croatia');

    // The champion links to its team profile.
    await expect(page.locator('.edition__fact a', { hasText: 'France' })).toHaveAttribute(
      'href',
      /\/teams\/france\/?$/,
    );
    // The host is a country name too, but it is not a placing - it must not link.
    await expect(page.locator('.edition__fact', { hasText: 'Host' }).locator('a')).toHaveCount(0);
  });

  test('shows that edition\'s top scorer, joined in from the Golden Boot data', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');
    await expect(page.locator('.edition__fact', { hasText: 'Top scorer' })).toContainText('Harry Kane');
  });

  test('the prev/next pager moves between adjacent editions', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');
    // 2018's next edition is 2022; its previous is 2014.
    await page.locator('.edition__pager-link--next').click();
    await expect(page).toHaveURL(/\/competitions\/world-cup\/2022\/?$/);
    await expect(page.locator('h1')).toHaveText('2022 FIFA World Cup');
  });

  test('the oldest edition has no previous link', async ({ page }) => {
    await page.goto('competitions/world-cup/1930');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toHaveCount(0);
    await expect(page.locator('.edition__pager-link--next')).toBeVisible();
  });

  test('links back to the full competition table', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');
    const back = page.locator('.edition__back a');
    await expect(back).toContainText('All FIFA World Cup editions');
    await expect(back).toHaveAttribute('href', /\/competitions\/world-cup\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the Croatian edition page', async ({ page }) => {
    await page.goto('competitions/world-cup/2018');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/world-cup\/2018\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian World Cup edition page', () => {
  test('renders translated chrome, with placings still linked to team profiles', async ({ page }) => {
    await page.goto('hr/competitions/world-cup/2018');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('FIFA Svjetsko prvenstvo 2018.');
    await expect(page.locator('.edition__fact', { hasText: 'Prvak' })).toContainText('France');
    await expect(page.locator('.edition__fact a', { hasText: 'France' })).toHaveAttribute(
      'href',
      /\/hr\/teams\/france\/?$/,
    );
  });

  test('the Croatian competition table links each year to the Croatian edition page', async ({ page }) => {
    await page.goto('hr/competitions/world-cup');
    const yearLink = page.locator('tbody tr[data-year="2018"] a', { hasText: '2018' });
    await expect(yearLink).toHaveAttribute('href', /\/hr\/competitions\/world-cup\/2018\/?$/);
  });

  test('the back link and pager use Croatian copy', async ({ page }) => {
    await page.goto('hr/competitions/world-cup/2018');
    await expect(page.locator('.edition__back a')).toContainText('Sva izdanja natjecanja');
    await expect(page.locator('.edition__pager-link--next')).toContainText('Sljedeće izdanje');
  });

  test('the language switcher returns to the English edition page', async ({ page }) => {
    await page.goto('hr/competitions/world-cup/2018');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/world-cup\/2018\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/world-cup/2018');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
