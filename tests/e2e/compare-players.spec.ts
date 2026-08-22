import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// /compare-players: pick two Ballon d'Or/Golden Boot winners and compare
// their award record head-to-head, generated from the same three award
// tables the "Players" directory already loads
// (src/lib/comparePlayers.ts, src/pages/compare-players.astro). The
// individual-award equivalent of /compare (national teams), which
// explicitly excludes these two awards. Now fully bilingual
// (src/pages/hr/compare-players.astro) and a NAV_LINKS entry - the Croatian
// describe block at the bottom of this file mirrors player-profile.spec.ts's
// own Croatian coverage.

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

    // Zidane's Ballon d'Or rows show exactly one win, in 1998, and the
    // versus panel puts Šuker's zero for the same award on the same row.
    const ballonDor = page.locator('#compare-panel tbody[data-index="0"]');
    await expect(ballonDor.locator('tr[data-metric="count"] .vs__value[data-side="a"]')).toHaveText('1');
    await expect(ballonDor.locator('tr[data-metric="count"] .vs__value[data-side="b"]')).toHaveText('0');
    await expect(ballonDor.locator('tr[data-metric="years"] .vs__years[data-side="a"]')).toHaveText('1998');
    // A won row is marked as the lead on that side, not by colour alone.
    await expect(ballonDor.locator('tr[data-metric="count"]')).toHaveAttribute('data-leader', 'a');

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

  test('offers a downloadable print PDF covering the default pair and the all-players ranking', async ({
    page,
    request,
  }) => {
    await page.goto('compare-players');
    const link = page.locator('a[download][href$="downloads/compare-players.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Croatian Compare Players page (/hr/compare-players)', () => {
  test('has no horizontal page overflow at 360px', async ({ page }) => {
    await page.goto('hr/compare-players');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('has no WCAG violations', async ({ page }) => {
    await page.goto('hr/compare-players');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('shows the same default pair and combined total as the English page, with translated labels', async ({
    page,
  }) => {
    await page.goto('hr/compare-players');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('h1')).toHaveText('Usporedi igrače');
    await expect(page.locator('#compare-a-name')).toHaveText('Lionel Messi');

    const combinedA = '#compare-panel tbody[data-index="combined"] .vs__value[data-side="a"]';
    const hrTotal = await page.locator(combinedA).textContent();

    await page.goto('compare-players');
    const enTotal = await page.locator(combinedA).textContent();
    expect(hrTotal).toBe(enTotal);
  });

  test('shows Croatian award names in the head-to-head table', async ({ page }) => {
    await page.goto('hr/compare-players');
    const groups = page.locator('#compare-panel .vs__group th');
    await expect(groups.filter({ hasText: 'Zlatna lopta' })).toBeVisible();
    await expect(groups.filter({ hasText: 'Zlatna kopačka Svjetskog prvenstva' })).toBeVisible();
    await expect(groups.filter({ hasText: 'Zlatna kopačka EURA' })).toBeVisible();
  });

  test('choosing a different pair updates the shared-years panel in Croatian', async ({ page }) => {
    await page.goto('hr/compare-players');
    await page.selectOption('#compare-a', { label: 'Zinedine Zidane' });
    await page.selectOption('#compare-b', { label: 'Davor Šuker' });

    const sharedItem = page.locator('.shared-years__list li', { hasText: '1998' });
    await expect(sharedItem).toContainText('Zlatna lopta');
    await expect(sharedItem).toContainText('Zlatna kopačka Svjetskog prvenstva');
  });

  test('the all-players table links each player to their own Croatian profile page', async ({ page }) => {
    await page.goto('hr/compare-players');
    const messiLink = page.locator('.compare__table--all a', { hasText: 'Lionel Messi' });
    await expect(messiLink).toHaveAttribute('href', /\/hr\/players\/lionel-messi\/?$/);
  });

  test('is reachable from the Croatian Players index', async ({ page }) => {
    await page.goto('hr/players');
    const link = page.locator('a', { hasText: 'Usporedi dva igrača izravno' });
    await expect(link).toHaveAttribute('href', /\/hr\/compare-players\/?$/);
  });

  test('the language switcher returns to the English page', async ({ page }) => {
    await page.goto('hr/compare-players');
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    // The page's own script appends ?a=...&b=... on load (same as /compare),
    // so the URL isn't bare - just check the path prefix.
    await expect(page).toHaveURL(/\/football-reference\/compare-players(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('offers a downloadable print PDF with translated labels', async ({ page, request }) => {
    await page.goto('hr/compare-players');
    const link = page.locator('a[download][href$="downloads/compare-players-hr.pdf"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Preuzmi PDF za ispis/);

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

// Same "versus" panel as /compare (see mobile.spec.ts): one row per award
// with both players' values on it, instead of a table each.
test.describe('Compare Players versus panel on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('compare-players');
  });

  test("puts both players' counts for one award on one visible row", async ({ page }) => {
    const row = page.locator('#compare-panel tbody[data-index="0"] tr[data-metric="count"]');
    const a = row.locator('.vs__value[data-side="a"]');
    const b = row.locator('.vs__value[data-side="b"]');
    const boxA = (await a.boundingBox())!;
    const boxB = (await b.boundingBox())!;
    expect(Math.abs(boxA.y - boxB.y)).toBeLessThan(2);
    expect(boxB.x + boxB.width).toBeLessThanOrEqual(360);

    const overflow = await page
      .locator('#compare-panel')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('an award neither player has won collapses to one line', async ({ page }) => {
    // Neither Zidane nor Šuker was ever a EURO top scorer.
    await page.selectOption('#compare-a', { label: 'Zinedine Zidane' });
    await page.selectOption('#compare-b', { label: 'Davor Šuker' });
    const euroGoldenBoot = page.locator('#compare-panel tbody[data-index="2"]');
    await expect(euroGoldenBoot).toHaveAttribute('data-empty', 'true');
    await expect(euroGoldenBoot.locator('.vs__none')).toBeVisible();

    // Ronaldo has won it, so the same group expands again.
    await page.selectOption('#compare-b', { label: 'Cristiano Ronaldo' });
    await expect(euroGoldenBoot).toHaveAttribute('data-empty', 'false');
    await expect(
      euroGoldenBoot.locator('tr[data-metric="count"] .vs__value[data-side="b"]'),
    ).toHaveText('2');
  });

  test('the leader mark follows a swap', async ({ page }) => {
    await page.selectOption('#compare-a', { label: 'Lionel Messi' });
    await page.selectOption('#compare-b', { label: 'Davor Šuker' });
    const ballonDor = page.locator('#compare-panel tbody[data-index="0"] tr[data-metric="count"]');
    await expect(ballonDor).toHaveAttribute('data-leader', 'a');

    await page.locator('#compare-swap').click();
    await expect(ballonDor).toHaveAttribute('data-leader', 'b');
  });
});
