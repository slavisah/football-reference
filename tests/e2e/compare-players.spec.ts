import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// /compare-players: pick two Ballon d'Or/Golden Boot winners and compare
// their award record head-to-head, generated from the same three award
// tables the "Players" directory already loads
// (src/lib/comparePlayers.ts, src/pages/compare-players.astro). The
// individual-award equivalent of /compare (national teams), which
// explicitly excludes these two awards. English-only this run, like
// /players and /teams before their own localization pass - not yet a
// NAV_LINKS entry, reachable via the link on the /players index.

test.describe('Compare Players page', () => {
  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('compare-players');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('compare-players');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('is reachable from the Players index', async ({ page }) => {
    await page.goto('players');
    const link = page.locator('a', { hasText: 'Compare two players head-to-head' });
    await expect(link).toHaveAttribute('href', /\/compare-players\/?$/);
    await link.click();
    await expect(page.locator('h1')).toHaveText('Compare Players');
  });

  test('defaults to the two most-decorated players, ranked correctly on the all-players table', async ({
    page,
  }) => {
    await page.goto('compare-players');
    // Lionel Messi's record 8 Ballon d'Or wins make him the single
    // most-decorated player across these three tables.
    await expect(page.locator('#compare-a-name')).toHaveText('Lionel Messi');
    const firstRankedRow = page.locator('.compare__table--all tbody tr').first();
    await expect(firstRankedRow).toContainText('Lionel Messi');
    await expect(firstRankedRow.locator('td').last()).toHaveText('8');
  });

  test('choosing a different pair updates both side panels, the URL, and the shared-years panel', async ({
    page,
  }) => {
    await page.goto('compare-players');
    await page.selectOption('#compare-a', { label: 'Zinedine Zidane' });
    await page.selectOption('#compare-b', { label: 'Davor Šuker' });

    await expect(page.locator('#compare-a-name')).toHaveText('Zinedine Zidane');
    await expect(page.locator('#compare-b-name')).toHaveText('Davor Šuker');
    // The picker's <option value> is the player's raw display name (matching
    // playerProfile.ts's PlayerProfile.id), so the shareable URL carries the
    // encoded name, not a slug - unlike /compare's country ids.
    await expect(page).toHaveURL(/a=Zinedine(\+|%20)Zidane/);
    await expect(page).toHaveURL(/b=Davor/);

    // Zidane's Ballon d'Or row shows exactly one win, in 1998.
    const zidaneBallonDorRow = page.locator('#compare-a-body tr').first();
    await expect(zidaneBallonDorRow.locator('[data-field="count"]')).toHaveText('1');
    await expect(zidaneBallonDorRow.locator('[data-field="years"]')).toHaveText('1998');

    // They both won an award in 1998 (Zidane's Ballon d'Or, Šuker's World
    // Cup Golden Boot) - a genuinely new cross-reference not shown on either
    // player's own /players/<slug> profile page.
    const sharedItem = page.locator('.shared-years__list li', { hasText: '1998' });
    await expect(sharedItem).toContainText("Ballon d'Or");
    await expect(sharedItem).toContainText('FIFA World Cup Golden Boot');
  });

  test('swap exchanges the two selected players', async ({ page }) => {
    await page.goto('compare-players');
    const beforeA = await page.locator('#compare-a-name').textContent();
    const beforeB = await page.locator('#compare-b-name').textContent();
    await page.click('#compare-swap');
    await expect(page.locator('#compare-a-name')).toHaveText(beforeB ?? '');
    await expect(page.locator('#compare-b-name')).toHaveText(beforeA ?? '');
  });

  test('a shared link (?a=...&b=...) restores the same pair on reload', async ({ page }) => {
    const params = new URLSearchParams({ a: 'Gerd Müller', b: 'Lionel Messi' });
    await page.goto(`compare-players?${params.toString()}`);
    await expect(page.locator('#compare-a-name')).toHaveText('Gerd Müller');
    await expect(page.locator('#compare-b-name')).toHaveText('Lionel Messi');
  });

  test('the all-players table links each player to their own profile page', async ({ page }) => {
    await page.goto('compare-players');
    const messiLink = page.locator('.compare__table--all a', { hasText: 'Lionel Messi' });
    await expect(messiLink).toHaveAttribute('href', /\/players\/lionel-messi\/?$/);
  });
});
