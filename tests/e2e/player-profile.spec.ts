import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The /players directory: an A-to-Z index (src/pages/players/index.astro)
// plus one full award-history profile page per player
// (src/pages/players/[slug].astro) - every Men's Ballon d'Or and FIFA World
// Cup/UEFA EURO Golden Boot award a player has ever won, generated from the
// same award tables the "Ballon d'Or" and "Golden Boot" pages already load.
// English-only for now (see docs/PROJECT_STATUS.md's "Left for a future
// pass" note) - no /hr/players pages exist yet, so this file has no Croatian
// counterpart, unlike team-profile.spec.ts.

test.describe('Players index', () => {
  test('lists players A to Z, each linking to its own profile page', async ({ page }) => {
    await page.goto('players');
    await expect(page.locator('h1')).toHaveText('Players');
    const mullerLink = page.locator('.players__link', { hasText: 'Gerd Müller' });
    await expect(mullerLink).toBeVisible();
    await expect(mullerLink).toHaveAttribute('href', /\/players\/gerd-muller\/?$/);
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('players');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('players');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Player profile page', () => {
  test('combines every award a player has won across Ballon d’Or and Golden Boot into one profile', async ({
    page,
  }) => {
    await page.goto('players/gerd-muller');
    await expect(page.locator('h1')).toHaveText('Gerd Müller');

    // Gerd Müller won the 1970 Ballon d'Or, the 1970 World Cup Golden Boot,
    // and the 1972 EURO Golden Boot - three awards, three sections.
    const totals = page.locator('.player-profile__totals-grid dd').first();
    await expect(totals).toHaveText('3');

    await expect(page.locator('h2', { hasText: "Ballon d'Or" })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'FIFA World Cup Golden Boot' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'UEFA EURO Golden Boot' })).toBeVisible();
  });

  test('a player who only won one award shows just that one section', async ({ page }) => {
    await page.goto('players/kylian-mbappe');
    await expect(page.locator('h1')).toHaveText('Kylian Mbappé');
    await expect(page.locator('h2', { hasText: "Ballon d'Or" })).toHaveCount(0);
    await expect(page.locator('h2', { hasText: 'FIFA World Cup Golden Boot' })).toBeVisible();
  });

  test('links back to the source award page', async ({ page }) => {
    await page.goto('players/gerd-muller');
    await expect(page.locator('h2 a', { hasText: "Ballon d'Or" })).toHaveAttribute(
      'href',
      /\/competitions\/ballon-dor\/?$/,
    );
  });

  test('a player with diacritics in their name resolves at a plain-ASCII URL', async ({ page }) => {
    await page.goto('players/drazan-jerkovic');
    await expect(page.locator('h1')).toHaveText('Dražan Jerković');
  });

  test('a tied Golden Boot year shows the individual player’s own team, not the joined cell', async ({
    page,
  }) => {
    await page.goto('players/oleg-salenko');
    await expect(page.locator('.player-profile__detail').first()).toContainText('Russia');
  });

  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('players/gerd-muller');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('players/gerd-muller');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Linked from the Ballon d’Or and Golden Boot pages', () => {
  test('the Ballon d’Or page links to the players directory', async ({ page }) => {
    await page.goto('competitions/ballon-dor');
    const link = page.locator('a', { hasText: "Browse every player's full award history" });
    await expect(link).toHaveAttribute('href', /\/players\/?$/);
    await link.click();
    await expect(page).toHaveURL(/\/players\/?$/);
    await expect(page.locator('h1')).toHaveText('Players');
  });

  test('the Golden Boot page links to the players directory', async ({ page }) => {
    await page.goto('competitions/golden-boot');
    const link = page.locator('a', { hasText: "Browse every player's full award history" });
    await expect(link).toHaveAttribute('href', /\/players\/?$/);
  });
});
