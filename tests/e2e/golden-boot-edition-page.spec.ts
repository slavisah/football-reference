import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// Per-edition pages for the Golden Boot (src/pages/competitions/golden-boot/
// world-cup/[year].astro, .../euro/[year].astro and their Croatian
// siblings) - the last competition on the site to get edition pages (see
// docs/PROJECT_STATUS.md). Two things set Golden Boot apart from every
// earlier edition-page family: (1) one content file holds two tables
// sharing years (World Cup, EURO), so it gets two route trees instead of
// one, both linking back to the single shared /competitions/golden-boot
// table page; (2) ties have multiple joint winners ("; "-separated names),
// which `EditionFact.parts` now splits into one linked name per player/team,
// index-aligned - covered here via 1958 (a single, untied winner, to prove
// the old single-fact shape is unaffected), 1994 (a clean two-way tie) and
// 1962 (a six-way tie whose Team column falls back to the unlinked
// "Multiple" placeholder instead of naming a team per player).

test.describe('Golden Boot edition page (FIFA World Cup)', () => {
  test('the Year column links each World Cup Golden Boot edition to its own page', async ({ page }) => {
    await page.goto('competitions/golden-boot');
    const yearLink = page.locator('#golden-boot-world-cup-table tbody tr[data-year="1958"] a', { hasText: '1958' });
    await expect(yearLink).toHaveAttribute('href', /\/competitions\/golden-boot\/world-cup\/1958\/?$/);
    await yearLink.click();
    await expect(page).toHaveURL(/\/competitions\/golden-boot\/world-cup\/1958\/?$/);
    await expect(page.locator('h1')).toHaveText('1958 FIFA World Cup Golden Boot');
  });

  test('a single, untied winner links to their player and team profiles separately', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1958');
    const facts = page.locator('.edition__fact');
    await expect(facts.filter({ hasText: 'Player(s)' })).toContainText('Just Fontaine');
    await expect(page.locator('.edition__fact a', { hasText: 'Just Fontaine' })).toHaveAttribute(
      'href',
      /\/players\/just-fontaine\/?$/,
    );
    await expect(page.locator('.edition__fact a', { hasText: 'France' })).toHaveAttribute(
      'href',
      /\/teams\/france\/?$/,
    );
  });

  test('a two-way tie links each player to their own team, index-aligned', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1994');
    await expect(page.locator('h1')).toHaveText('1994 FIFA World Cup Golden Boot');

    const stoichkov = page.locator('.edition__fact a', { hasText: 'Hristo Stoichkov' });
    await expect(stoichkov).toHaveAttribute('href', /\/players\/hristo-stoichkov\/?$/);
    const salenko = page.locator('.edition__fact a', { hasText: 'Oleg Salenko' });
    await expect(salenko).toHaveAttribute('href', /\/players\/oleg-salenko\/?$/);

    const bulgaria = page.locator('.edition__fact a', { hasText: 'Bulgaria' });
    await expect(bulgaria).toHaveAttribute('href', /\/teams\/bulgaria\/?$/);
    const russia = page.locator('.edition__fact a', { hasText: 'Russia' });
    await expect(russia).toHaveAttribute('href', /\/teams\/russia\/?$/);
  });

  test('a six-way tie links every player, but the "Multiple" team placeholder stays plain text', async ({
    page,
  }) => {
    await page.goto('competitions/golden-boot/world-cup/1962');
    const winnerFact = page.locator('.edition__fact', { hasText: 'Player(s)' });
    await expect(winnerFact.locator('a')).toHaveCount(6);
    await expect(page.locator('.edition__fact a', { hasText: 'Garrincha' })).toHaveAttribute(
      'href',
      /\/players\/garrincha\/?$/,
    );

    const teamFact = page.locator('.edition__fact', { hasText: 'Team' });
    await expect(teamFact).toContainText('Multiple');
    await expect(teamFact.locator('a')).toHaveCount(0);
  });

  test('the prev/next pager moves between adjacent World Cup Golden Boot editions', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1994');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toContainText('1990');
    await page.locator('.edition__pager-link--next').click();
    await expect(page).toHaveURL(/\/competitions\/golden-boot\/world-cup\/1998\/?$/);
  });

  test('the oldest edition has no previous link', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1930');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toHaveCount(0);
    await expect(page.locator('.edition__pager-link--next')).toBeVisible();
  });

  test('links back to the shared Golden Boot page, not a non-existent World Cup sub-index', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1958');
    const back = page.locator('.edition__back a');
    await expect(back).toHaveAttribute('href', /\/competitions\/golden-boot\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1994');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1994');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the Croatian edition page', async ({ page }) => {
    await page.goto('competitions/golden-boot/world-cup/1958');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/golden-boot\/world-cup\/1958\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('competitions/golden-boot/world-cup/1994');
    const link = page.locator('a[download][href$="downloads/edition-golden-boot-world-cup-1994.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Golden Boot edition page (UEFA EURO)', () => {
  test('the Year column links each EURO Golden Boot edition to its own page, a separate route from the World Cup race', async ({
    page,
  }) => {
    await page.goto('competitions/golden-boot');
    const yearLink = page.locator('#golden-boot-euro-table tbody tr[data-year="1996"] a', { hasText: '1996' });
    await expect(yearLink).toHaveAttribute('href', /\/competitions\/golden-boot\/euro\/1996\/?$/);
    await yearLink.click();
    await expect(page).toHaveURL(/\/competitions\/golden-boot\/euro\/1996\/?$/);
    await expect(page.locator('h1')).toHaveText('1996 UEFA EURO Golden Boot');
  });

  test('a tie count mismatch between Player(s) and Team leaves Team unlinked rather than guessing', async ({
    page,
  }) => {
    // 1964: three tied players (two of them both playing for Hungary) but
    // only two Team names - the real data point that first exposed why a
    // count mismatch has to be left as plain text, not a guessed pairing.
    await page.goto('competitions/golden-boot/euro/1964');
    const winnerFact = page.locator('.edition__fact', { hasText: 'Player(s)' });
    await expect(winnerFact.locator('a')).toHaveCount(3);
    const teamFact = page.locator('.edition__fact', { hasText: 'Team' });
    await expect(teamFact).toContainText('Hungary; Spain');
    await expect(teamFact.locator('a')).toHaveCount(0);
  });

  test('links back to the shared Golden Boot page', async ({ page }) => {
    await page.goto('competitions/golden-boot/euro/1996');
    const back = page.locator('.edition__back a');
    await expect(back).toHaveAttribute('href', /\/competitions\/golden-boot\/?$/);
  });

  test('the oldest EURO edition has no previous link', async ({ page }) => {
    await page.goto('competitions/golden-boot/euro/1960');
    await expect(page.locator('.edition__pager-link', { hasText: 'Previous edition' })).toHaveCount(0);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('competitions/golden-boot/euro/1996');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    await page.goto('competitions/golden-boot/euro/1996');
    const link = page.locator('a[download][href$="downloads/edition-golden-boot-euro-1996.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Croatian Golden Boot edition page', () => {
  test('renders translated chrome, with a tied scorer linked to their profile', async ({ page }) => {
    await page.goto('hr/competitions/golden-boot/world-cup/1994');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('Zlatna kopačka Svjetskog prvenstva 1994.');
    await expect(page.locator('.edition__fact a', { hasText: 'Hristo Stoichkov' })).toHaveAttribute(
      'href',
      /\/hr\/players\/hristo-stoichkov\/?$/,
    );
    await expect(page.locator('.edition__fact a', { hasText: 'Bulgaria' })).toHaveAttribute(
      'href',
      /\/hr\/teams\/bulgaria\/?$/,
    );
  });

  test('the Croatian table links each year to the Croatian edition page', async ({ page }) => {
    await page.goto('hr/competitions/golden-boot');
    const yearLink = page.locator('#golden-boot-euro-table tbody tr[data-year="1996"] a', { hasText: '1996' });
    await expect(yearLink).toHaveAttribute('href', /\/hr\/competitions\/golden-boot\/euro\/1996\/?$/);
  });

  test('the back link uses Croatian copy and points at the shared Croatian Golden Boot page', async ({ page }) => {
    await page.goto('hr/competitions/golden-boot/euro/1996');
    const back = page.locator('.edition__back a');
    await expect(back).toContainText('Sva izdanja natjecanja');
    await expect(back).toHaveAttribute('href', /\/hr\/competitions\/golden-boot\/?$/);
  });

  test('the language switcher returns to the English edition page', async ({ page }) => {
    await page.goto('hr/competitions/golden-boot/world-cup/1958');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/golden-boot\/world-cup\/1958\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/competitions/golden-boot/world-cup/1994');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('offers a downloadable print PDF that actually resolves, for both the World Cup and EURO races', async ({
    page,
    request,
  }) => {
    await page.goto('hr/competitions/golden-boot/world-cup/1994');
    const worldCupLink = page.locator('a[download][href$="downloads/edition-golden-boot-world-cup-1994-hr.pdf"]');
    await expect(worldCupLink).toBeVisible();
    const worldCupHref = await worldCupLink.getAttribute('href');
    const worldCupResponse = await request.get(new URL(worldCupHref!, page.url()).toString());
    expect(worldCupResponse.ok()).toBe(true);
    expect(worldCupResponse.headers()['content-type']).toContain('pdf');

    await page.goto('hr/competitions/golden-boot/euro/1996');
    const euroLink = page.locator('a[download][href$="downloads/edition-golden-boot-euro-1996-hr.pdf"]');
    await expect(euroLink).toBeVisible();
    const euroHref = await euroLink.getAttribute('href');
    const euroResponse = await request.get(new URL(euroHref!, page.url()).toString());
    expect(euroResponse.ok()).toBe(true);
    expect(euroResponse.headers()['content-type']).toContain('pdf');
  });
});
