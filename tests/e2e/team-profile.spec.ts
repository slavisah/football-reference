import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The /teams directory: an A-to-Z index (src/pages/teams/index.astro) plus
// one full year-by-year profile page per national team
// (src/pages/teams/[slug].astro) - every World Cup/EURO/Copa América/Nations
// League title, runner-up finish, and third/fourth-place or semifinal finish
// a team has ever recorded, generated from the same edition tables /compare
// and /records already load. Now localized (src/pages/hr/teams/index.astro,
// src/pages/hr/teams/[slug].astro) - see the "Croatian /teams" describes
// below.

test.describe('Teams index', () => {
  test('lists teams A to Z, each linking to its own profile page', async ({ page }) => {
    await page.goto('teams');
    await expect(page.locator('h1')).toHaveText('National Teams');
    const brazilLink = page.locator('.teams__link', { hasText: 'Brazil' });
    await expect(brazilLink).toBeVisible();
    await expect(brazilLink).toHaveAttribute('href', /\/teams\/brazil\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('teams');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('teams');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Team profile page', () => {
  test('shows combined totals and a per-competition, year-by-year appearance list', async ({ page }) => {
    await page.goto('teams/brazil');
    await expect(page.locator('h1')).toHaveText('Brazil');

    // Brazil has won the FIFA World Cup, so its "Titles" total is non-zero
    // and its World Cup section lists at least one "Champion" appearance.
    const titles = page.locator('.team-profile__totals-grid dd').first();
    await expect(titles).not.toHaveText('0');

    const worldCupSection = page.locator('section', { has: page.locator('h2', { hasText: 'FIFA World Cup' }) });
    await expect(worldCupSection.locator('.team-profile__list li', { hasText: 'Champion' }).first()).toBeVisible();
  });

  test('links back to the source competition page and to /compare with this team pre-selected', async ({
    page,
  }) => {
    await page.goto('teams/brazil');
    await expect(page.locator('h2 a', { hasText: 'FIFA World Cup' })).toHaveAttribute(
      'href',
      /\/competitions\/world-cup\/?$/,
    );
    const compareLink = page.locator('a', { hasText: 'Compare Brazil against another team' });
    await expect(compareLink).toHaveAttribute('href', /\/compare\?a=brazil$/);
  });

  test('a team with diacritics in its name resolves at a plain-ASCII URL', async ({ page }) => {
    await page.goto('teams/turkiye');
    await expect(page.locator('h1')).toHaveText('Türkiye');
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('teams/brazil');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('teams/brazil');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Linked from /compare', () => {
  test('a team name in the "All national teams" ranking links to its profile page', async ({ page }) => {
    await page.goto('compare');
    const brazilCell = page.locator('.compare__table--all a', { hasText: 'Brazil' });
    await expect(brazilCell).toHaveAttribute('href', /\/teams\/brazil\/?$/);
    await brazilCell.click();
    await expect(page).toHaveURL(/\/teams\/brazil\/?$/);
    await expect(page.locator('h1')).toHaveText('Brazil');
  });
});

test.describe('Croatian /teams index (/hr/teams)', () => {
  test('lists teams A to Z, each linking to its own Croatian profile page', async ({ page }) => {
    await page.goto('hr/teams');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('Reprezentacije');
    const brazilLink = page.locator('.teams__link', { hasText: 'Brazil' });
    await expect(brazilLink).toBeVisible();
    await expect(brazilLink).toHaveAttribute('href', /\/hr\/teams\/brazil\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('hr/teams');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/teams');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher opens the English teams index', async ({ page }) => {
    await page.goto('hr/teams');
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/teams\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Croatian team profile page (/hr/teams/<slug>)', () => {
  test('shows the same combined totals as the English page, with translated labels', async ({ page }) => {
    await page.goto('hr/teams/brazil');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('Brazil');
    await expect(page.locator('.team-profile__totals-grid dt').first()).toHaveText('Naslovi');

    const hrTitles = await page.locator('.team-profile__totals-grid dd').first().textContent();

    await page.goto('teams/brazil');
    const enTitles = await page.locator('.team-profile__totals-grid dd').first().textContent();
    expect(hrTitles).toBe(enTitles);
  });

  test('links back to the source competition page (Croatian) and to /hr/compare with this team pre-selected', async ({
    page,
  }) => {
    await page.goto('hr/teams/brazil');
    await expect(page.locator('h2 a', { hasText: 'FIFA Svjetsko prvenstvo' })).toHaveAttribute(
      'href',
      /\/hr\/competitions\/world-cup\/?$/,
    );
    const compareLink = page.locator('a', { hasText: 'Usporedi reprezentaciju Brazil s drugom' });
    await expect(compareLink).toHaveAttribute('href', /\/hr\/compare\?a=brazil$/);
  });

  test('a team with diacritics in its name resolves at a plain-ASCII URL', async ({ page }) => {
    await page.goto('hr/teams/turkiye');
    await expect(page.locator('h1')).toHaveText('Türkiye');
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('hr/teams/brazil');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/teams/brazil');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('the language switcher returns to the English profile page', async ({ page }) => {
    await page.goto('hr/teams/brazil');
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/teams\/brazil\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Linked from /hr/compare', () => {
  test('a team name in the "Sve reprezentacije" ranking links to its Croatian profile page', async ({ page }) => {
    await page.goto('hr/compare');
    const brazilCell = page.locator('.compare__table--all a', { hasText: 'Brazil' });
    await expect(brazilCell).toHaveAttribute('href', /\/hr\/teams\/brazil\/?$/);
    await brazilCell.click();
    await expect(page).toHaveURL(/\/hr\/teams\/brazil\/?$/);
    await expect(page.locator('h1')).toHaveText('Brazil');
  });
});
