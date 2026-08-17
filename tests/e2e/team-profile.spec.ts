import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The /teams directory: an A-to-Z index (src/pages/teams/index.astro) plus
// one full year-by-year profile page per national team
// (src/pages/teams/[slug].astro) - every World Cup/EURO/Copa América/Nations
// League title, runner-up finish, and third/fourth-place or semifinal finish
// a team has ever recorded, generated from the same edition tables /compare
// and /records already load. English-only for now - see
// docs/PROJECT_STATUS.md's "Left for a future pass" note.

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
