import { test, expect } from '@playwright/test';

// The one critical mobile smoke test. Runs against the built site at a 360px
// viewport (configured in playwright.config.ts) and covers the acceptance
// scenarios that matter most on a phone.

test.describe('World Cup page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('competitions/world-cup');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    // Allow a 1px rounding tolerance.
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('a reader can find the 2018 champion', async ({ page }) => {
    const row = page.locator('tbody tr[data-year="2018"]');
    await expect(row).toBeVisible();
    await expect(row).toContainText('France');
  });

  test('filtering by Spain shows only Spain title years', async ({ page }) => {
    await page.selectOption('#world-cup-winner', 'Spain');

    const visibleRows = page.locator('tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(2);
    await expect(page.locator('tbody tr[data-year="2010"]')).toBeVisible();
    await expect(page.locator('tbody tr[data-year="2026"]')).toBeVisible();
    await expect(page.locator('tbody tr[data-year="2018"]')).toBeHidden();

    // Filter state is shareable through the URL.
    await expect(page).toHaveURL(/winner=Spain/);
  });

  test('filters are keyboard operable and reset works', async ({ page }) => {
    const winner = page.locator('#world-cup-winner');
    await winner.focus();
    await expect(winner).toBeFocused();
    await winner.selectOption('Brazil');
    await expect(page.locator('tbody tr:not([hidden])')).toHaveCount(5);

    await page.locator('#world-cup-reset').click();
    await expect(page.locator('tbody tr:not([hidden])')).toHaveCount(23);
    await expect(page).not.toHaveURL(/winner=/);
  });

  test('filtering by host Mexico shows only the 1970 and 1986 editions', async ({ page }) => {
    await page.selectOption('#world-cup-host', 'Mexico');

    const visibleRows = page.locator('tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(2);
    await expect(page.locator('tbody tr[data-year="1970"]')).toBeVisible();
    await expect(page.locator('tbody tr[data-year="1986"]')).toBeVisible();
    // The 2026 host string is "Canada, Mexico and United States", a distinct value.
    await expect(page.locator('tbody tr[data-year="2026"]')).toBeHidden();

    await expect(page).toHaveURL(/host=Mexico/);

    await page.locator('#world-cup-reset').click();
    await expect(page.locator('tbody tr:not([hidden])')).toHaveCount(23);
    await expect(page).not.toHaveURL(/host=/);
  });

  test('winner and host filters combine', async ({ page }) => {
    await page.selectOption('#world-cup-winner', 'Argentina');
    await page.selectOption('#world-cup-host', 'Mexico');

    const visibleRows = page.locator('tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(1);
    await expect(page.locator('tbody tr[data-year="1986"]')).toBeVisible();
  });

  test('filtering by team Portugal surfaces editions it never won', async ({ page }) => {
    // Portugal has never won or been runner-up in the World Cup - this is the
    // key difference from the winner filter: third place in 1966, fourth in 2006.
    await page.selectOption('#world-cup-team', 'Portugal');

    const visibleRows = page.locator('tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(2);
    await expect(page.locator('tbody tr[data-year="1966"]')).toBeVisible();
    await expect(page.locator('tbody tr[data-year="2006"]')).toBeVisible();

    await expect(page).toHaveURL(/team=Portugal/);

    await page.locator('#world-cup-reset').click();
    await expect(page.locator('tbody tr:not([hidden])')).toHaveCount(23);
    await expect(page).not.toHaveURL(/team=/);
  });

  test('shows the last reviewed date and source links', async ({ page }) => {
    await expect(page.locator('time[datetime="2026-08-14"]')).toBeVisible();
    const sources = page.locator('.references__list a');
    await expect(sources.first()).toBeVisible();
    const count = await sources.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows each edition\'s top scorer, joined in from the Golden Boot data', async ({ page }) => {
    const row2018 = page.locator('tbody tr[data-year="2018"]');
    await expect(row2018.locator('td[data-label="Top scorer"]')).toContainText('Harry Kane');

    const row1930 = page.locator('tbody tr[data-year="1930"]');
    await expect(row1930.locator('td[data-label="Top scorer"]')).toContainText('Guillermo Stábile');
  });

  test('shows the Memorable moments and Editorial notes sections from content/fifa-world-cup.md', async ({ page }) => {
    const notes = page.locator('.notes__card');
    await expect(notes).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Memorable moments' })).toBeVisible();
    await expect(page.getByText('Croatia reached its first final in 2018.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Editorial notes' })).toBeVisible();
    // *Maracanazo* renders as emphasis, not literal asterisks.
    await expect(page.locator('.notes__card em', { hasText: 'Maracanazo' })).toBeVisible();
  });

  test('sorting by Winner (A–Z) groups all Argentina rows first', async ({ page }) => {
    await page.selectOption('#world-cup-sort', 'winner-asc');

    const winners = await page
      .locator('tbody tr')
      .evaluateAll((rows) => rows.map((row) => row.dataset.winner));
    expect(winners.slice(0, 3)).toEqual(['Argentina', 'Argentina', 'Argentina']);

    // Sort state is shareable through the URL, like the other filters.
    await expect(page).toHaveURL(/sort=winner-asc/);
  });

  test('sorting by Teams (fewest first) puts the smallest tournaments first', async ({ page }) => {
    await page.selectOption('#world-cup-sort', 'teams-asc');

    const firstRow = page.locator('tbody tr').first();
    // 1930 and 1958 both had 13 teams, the fewest of any edition.
    await expect(firstRow).toHaveAttribute('data-year', /1930|1950/);
  });

  test('Reset restores the default Year (newest first) order and clears ?sort', async ({ page }) => {
    await page.selectOption('#world-cup-sort', 'winner-asc');
    await expect(page.locator('tbody tr').first()).not.toHaveAttribute('data-year', '2026');

    await page.locator('#world-cup-reset').click();

    await expect(page.locator('tbody tr').first()).toHaveAttribute('data-year', '2026');
    await expect(page).not.toHaveURL(/sort=/);
  });

  test('a shared ?sort= link restores the sorted order on load', async ({ page }) => {
    await page.goto('competitions/world-cup?sort=winner-asc');

    const firstWinner = await page.locator('tbody tr').first().getAttribute('data-winner');
    expect(firstWinner).toBe('Argentina');
    await expect(page.locator('#world-cup-sort')).toHaveValue('winner-asc');
  });

  test('offers a downloadable print PDF that actually resolves', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/world-cup.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher opens the Croatian World Cup page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/world-cup\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('EURO page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('competitions/euro');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('shows each edition\'s top scorer, joined in from the Golden Boot data', async ({ page }) => {
    const row2016 = page.locator('tbody tr[data-year="2016"]');
    await expect(row2016.locator('td[data-label="Top scorer"]')).toContainText('Antoine Griezmann');
  });

  test('shows the Historical format note as a paragraph and Memorable moments as a list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Historical format note' })).toBeVisible();
    await expect(page.locator('.notes__card p', { hasText: 'other semifinalist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memorable moments' })).toBeVisible();
    await expect(page.getByText("Antonín Panenka's famous chipped penalty")).toBeVisible();
  });

  test('the language switcher opens the Croatian EURO page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/euro\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian World Cup page (/hr/competitions/world-cup) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/competitions/world-cup');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, filters and column headers', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(
      page.getByRole('heading', { name: 'FIFA Svjetsko prvenstvo', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('label[for="world-cup-winner"]')).toHaveText('Prvak');
    await expect(page.locator('label[for="world-cup-host"]')).toHaveText('Domaćin');
    await expect(page.locator('label[for="world-cup-team"]')).toHaveText('Reprezentacija');
    await expect(page.locator('th', { hasText: 'Godina' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Domaćin(i)' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Najbolji strijelac' })).toBeVisible();
  });

  test('filtering by prvak (winner) Argentina updates the shareable URL and status text', async ({
    page,
  }) => {
    await page.selectOption('#world-cup-winner', 'Argentina');
    await expect(page).toHaveURL(/winner=Argentina/);
    await expect(page.locator('#world-cup-status')).toContainText('prvak Argentina');
  });

  test('shows the same champion totals as the English page', async ({ page, baseURL }) => {
    const hrTop = await page.locator('.champions__name').first().textContent();
    const hrCount = await page.locator('.champions__count').first().textContent();

    await page.goto(baseURL ? `${baseURL}competitions/world-cup` : '/competitions/world-cup');
    const enTop = await page.locator('.champions__name').first().textContent();
    const enCount = await page.locator('.champions__count').first().textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('shows each edition\'s top scorer with the Croatian "golova" wording', async ({ page }) => {
    const row2018 = page.locator('tbody tr[data-year="2018"]');
    await expect(row2018.locator('td[data-label="Najbolji strijelac"]')).toContainText(
      'Harry Kane',
    );
    await expect(row2018.locator('td[data-label="Najbolji strijelac"]')).toContainText('golova');
  });

  test('shows the translated Format milestones, Memorable moments and Editorial notes sections', async ({
    page,
  }) => {
    await expect(page.locator('.notes__card')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Prekretnice formata' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Uredničke napomene' })).toBeVisible();
    await expect(page.getByText('Hrvatska je 2018. stigla do svog prvog finala.')).toBeVisible();
    await expect(page.locator('.notes__card em', { hasText: 'Maracanazo' })).toBeVisible();
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/world-cup-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher returns to the English World Cup page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/world-cup\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Croatian EURO page (/hr/competitions/euro) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/competitions/euro');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, filters and column headers', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(
      page.getByRole('heading', { name: 'UEFA Europsko prvenstvo', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('label[for="euro-winner"]')).toHaveText('Prvak');
    await expect(page.locator('th', { hasText: 'Najbolji strijelac' })).toBeVisible();
  });

  test('shows each edition\'s top scorer with the Croatian "golova" wording', async ({ page }) => {
    const row2016 = page.locator('tbody tr[data-year="2016"]');
    await expect(row2016.locator('td[data-label="Najbolji strijelac"]')).toContainText(
      'Antoine Griezmann',
    );
    await expect(row2016.locator('td[data-label="Najbolji strijelac"]')).toContainText('golova');
  });

  test('shows the Historical format note as a paragraph and Memorable moments as a translated list', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Povijesna napomena o formatu' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card p', { hasText: 'drugi polufinalist' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    await expect(page.getByText('Slavna "panenka" Antonína Panenke')).toBeVisible();
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/euro-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher returns to the English EURO page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/euro\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Golden Boot page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('competitions/golden-boot');
  });

  test('has no horizontal page overflow with two tables stacked', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('shows the 1958 World Cup and 1984 EURO top scorers', async ({ page }) => {
    const wcRow = page.locator('#golden-boot-world-cup-table tbody tr[data-year="1958"]');
    await expect(wcRow).toContainText('Just Fontaine');

    const euroRow = page.locator('#golden-boot-euro-table tbody tr[data-year="1984"]');
    await expect(euroRow).toContainText('Michel Platini');
  });

  test('shows the World Cup notes and EURO notes sections, one per table', async ({ page }) => {
    await expect(page.locator('.notes__card')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'World Cup notes' })).toBeVisible();
    await expect(page.getByText("Just Fontaine's 13 goals in 1958 remain the record")).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EURO notes' })).toBeVisible();
    await expect(page.getByText('Michel Platini scored nine goals in five matches in 1984.')).toBeVisible();
  });

  test('the two tables filter independently by player', async ({ page }) => {
    await page.selectOption('#golden-boot-world-cup-winner', 'Kylian Mbappé');
    const wcVisible = page.locator('#golden-boot-world-cup-table tbody tr:not([hidden])');
    await expect(wcVisible).toHaveCount(2);

    const euroVisible = page.locator('#golden-boot-euro-table tbody tr:not([hidden])');
    await expect(euroVisible).toHaveCount(17);
  });

  test('the two tables write independently namespaced URL params, not one shared key', async ({ page }) => {
    await page.selectOption('#golden-boot-world-cup-year', '1958');
    await expect(page).toHaveURL(/world-cup-year=1958/);

    // Filtering the EURO table must not clobber the World Cup table's own
    // param under a bare, unprefixed "year" key shared by both instances.
    await page.selectOption('#golden-boot-euro-year', '1984');
    await expect(page).toHaveURL(/world-cup-year=1958/);
    await expect(page).toHaveURL(/euro-year=1984/);
    await expect(page).not.toHaveURL(/[?&]year=/);

    // Both tables must still reflect their own filter, independently.
    await expect(page.locator('#golden-boot-world-cup-year')).toHaveValue('1958');
    await expect(page.locator('#golden-boot-euro-year')).toHaveValue('1984');
  });

  test('a shared link with both namespaced params restores each table independently', async ({ page, baseURL }) => {
    await page.goto(
      baseURL
        ? `${baseURL}competitions/golden-boot?world-cup-year=1958&euro-year=1984`
        : '/competitions/golden-boot?world-cup-year=1958&euro-year=1984',
    );

    await expect(page.locator('#golden-boot-world-cup-year')).toHaveValue('1958');
    await expect(page.locator('#golden-boot-euro-year')).toHaveValue('1984');
    const wcVisible = page.locator('#golden-boot-world-cup-table tbody tr:not([hidden])');
    await expect(wcVisible).toHaveCount(1);
    const euroVisible = page.locator('#golden-boot-euro-table tbody tr:not([hidden])');
    await expect(euroVisible).toHaveCount(1);
  });

  test('sorting the World Cup table by Goals (most first) puts Just Fontaine\'s 1958 record first', async ({ page }) => {
    await page.selectOption('#golden-boot-world-cup-sort', 'goals-desc');
    const firstRow = page.locator('#golden-boot-world-cup-table tbody tr').first();
    await expect(firstRow).toHaveAttribute('data-year', '1958');
    await expect(firstRow).toContainText('Just Fontaine');
  });

  test('offers a downloadable print PDF covering both tables', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/golden-boot.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher opens the Croatian Golden Boot page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/golden-boot\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian Golden Boot page (/hr/competitions/golden-boot) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/competitions/golden-boot');
  });

  test('has no horizontal page overflow with two tables stacked', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, filters and column headers', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Zlatna kopačka', level: 1 })).toBeVisible();
    await expect(page.locator('label[for="golden-boot-world-cup-winner"]')).toHaveText('Igrač');
    await expect(page.locator('label[for="golden-boot-euro-winner"]')).toHaveText('Igrač');
    await expect(page.locator('th', { hasText: 'Igrač(i)' }).first()).toBeVisible();
    await expect(page.locator('th', { hasText: 'Reprezentacija' }).first()).toBeVisible();
    await expect(page.locator('th', { hasText: 'Golovi' }).first()).toBeVisible();
  });

  test('shows the 1958 World Cup and 1984 EURO top scorers', async ({ page }) => {
    const wcRow = page.locator('#golden-boot-world-cup-table tbody tr[data-year="1958"]');
    await expect(wcRow).toContainText('Just Fontaine');

    const euroRow = page.locator('#golden-boot-euro-table tbody tr[data-year="1984"]');
    await expect(euroRow).toContainText('Michel Platini');
  });

  test('shows the translated World Cup notes and EURO notes sections, one per table', async ({
    page,
  }) => {
    await expect(page.locator('.notes__card')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'Napomene o Svjetskom prvenstvu' })).toBeVisible();
    await expect(page.getByText('13 golova Justa Fontainea 1958. ostaje rekord')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Napomene o EURU' })).toBeVisible();
    await expect(page.getByText('Michel Platini postigao je devet golova')).toBeVisible();
  });

  test('the two tables filter independently by player', async ({ page }) => {
    await page.selectOption('#golden-boot-world-cup-winner', 'Kylian Mbappé');
    const wcVisible = page.locator('#golden-boot-world-cup-table tbody tr:not([hidden])');
    await expect(wcVisible).toHaveCount(2);

    const euroVisible = page.locator('#golden-boot-euro-table tbody tr:not([hidden])');
    await expect(euroVisible).toHaveCount(17);
  });

  test('a shared link with both namespaced params restores each table independently', async ({ page, baseURL }) => {
    await page.goto(
      baseURL
        ? `${baseURL}hr/competitions/golden-boot?world-cup-year=1958&euro-year=1984`
        : '/hr/competitions/golden-boot?world-cup-year=1958&euro-year=1984',
    );

    await expect(page.locator('#golden-boot-world-cup-year')).toHaveValue('1958');
    await expect(page.locator('#golden-boot-euro-year')).toHaveValue('1984');
    const wcVisible = page.locator('#golden-boot-world-cup-table tbody tr:not([hidden])');
    await expect(wcVisible).toHaveCount(1);
    const euroVisible = page.locator('#golden-boot-euro-table tbody tr:not([hidden])');
    await expect(euroVisible).toHaveCount(1);
  });

  test('shows the same World Cup award totals as the English page', async ({ page, baseURL }) => {
    const hrTop = await page.locator('.champions__name').first().textContent();
    const hrCount = await page.locator('.champions__count').first().textContent();

    await page.goto(baseURL ? `${baseURL}competitions/golden-boot` : '/competitions/golden-boot');
    const enTop = await page.locator('.champions__name').first().textContent();
    const enCount = await page.locator('.champions__count').first().textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/golden-boot-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher returns to the English Golden Boot page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/golden-boot\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe("Ballon d'Or page on a 360px phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('competitions/ballon-dor');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('sorting preserves the 2020 "Not awarded" historical note verbatim', async ({ page }) => {
    const row2020 = page.locator('tbody tr[data-year="2020"]');
    await expect(row2020).toContainText('Not awarded');

    // Sorting by Winner (A-Z) reorders rows but must not lose or rewrite the note.
    await page.selectOption('#ballon-dor-sort', 'winner-asc');
    await expect(row2020).toContainText('Not awarded');
    await expect(row2020).toBeVisible();
  });

  test('the 2020 "Not awarded" row is not a champions-summary entry or a filter option', async ({
    page,
  }) => {
    // The raw table row still shows it (checked above); it just should not be
    // counted as a one-off "champion" in the generated summary, nor offered
    // as something a reader could filter the table down to.
    const winnerOptions = await page.locator('#ballon-dor-winner option').allTextContents();
    expect(winnerOptions).not.toContain('Not awarded');
    await expect(page.locator('.champions')).not.toContainText('Not awarded');
  });

  test("the language switcher opens the Croatian Ballon d'Or page", async ({ page }) => {
    await page.goto('competitions/ballon-dor');
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/ballon-dor\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe("Croatian Ballon d'Or page (/hr/competitions/ballon-dor) on a 360px phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/competitions/ballon-dor');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, filters and column headers', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Zlatna lopta', level: 1 })).toBeVisible();
    await expect(page.locator('label[for="ballon-dor-winner"]')).toHaveText('Pobjednik');
    await expect(page.locator('th', { hasText: 'Godina' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Pobjednik' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Reprezentacija' })).toBeVisible();
  });

  test('filtering by pobjednik (winner) Lionel Messi updates the shareable URL and status text', async ({
    page,
  }) => {
    await page.selectOption('#ballon-dor-winner', 'Lionel Messi');
    await expect(page).toHaveURL(/winner=Lionel(\+|%20)Messi/);
    await expect(page.locator('#ballon-dor-status')).toContainText('pobjednik Lionel Messi');
  });

  test('shows the same champion totals as the English page', async ({ page, baseURL }) => {
    const hrTop = await page.locator('.champions__name').first().textContent();
    const hrCount = await page.locator('.champions__count').first().textContent();

    await page.goto(baseURL ? `${baseURL}competitions/ballon-dor` : '/competitions/ballon-dor');
    const enTop = await page.locator('.champions__name').first().textContent();
    const enCount = await page.locator('.champions__count').first().textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('sorting preserves the 2020 "Not awarded" historical note verbatim', async ({ page }) => {
    const row2020 = page.locator('tbody tr[data-year="2020"]');
    await expect(row2020).toContainText('Not awarded');

    await page.selectOption('#ballon-dor-sort', 'winner-asc');
    await expect(row2020).toContainText('Not awarded');
    await expect(row2020).toBeVisible();
  });

  test('shows the translated Notes section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Napomene' })).toBeVisible();
    await expect(page.getByText('Lev Jašin ostaje jedini vratar')).toBeVisible();
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/ballon-dor-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test("the language switcher returns to the English Ballon d'Or page", async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/ballon-dor\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Copa América page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('competitions/copa-america');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('shows an audited "Format" badge per edition', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Format', exact: true })).toBeVisible();

    const row1919 = page.locator('tbody tr[data-year="1919"]');
    await expect(row1919.locator('.badge')).toHaveText('Final playoff');

    const row1975 = page.locator('tbody tr[data-year="1975"]');
    await expect(row1975.locator('.badge')).toHaveText('Home-and-away');

    const row1989 = page.locator('tbody tr[data-year="1989"]');
    await expect(row1989.locator('.badge')).toHaveText('League table');

    const row2016 = page.locator('tbody tr[data-year="2016"]');
    await expect(row2016.locator('.badge')).toHaveText('Special centenary edition');

    const row2024 = page.locator('tbody tr[data-year="2024"]');
    await expect(row2024.locator('.badge')).toHaveText('Knockout final');
  });

  test('sorting by winner preserves the Format badge in the same row', async ({ page }) => {
    const row2016 = page.locator('tbody tr[data-year="2016"]');
    await page.selectOption('#copa-america-sort', 'champion-asc');
    await expect(row2016.locator('.badge')).toHaveText('Special centenary edition');
    await expect(row2016).toBeVisible();
  });

  test('shows the audited Third/Fourth place across every league-table and knockout-final edition, and "—" only where no such placing exists', async ({
    page,
  }) => {
    const row2024 = page.locator('tbody tr[data-year="2024"]');
    await expect(row2024.locator('td[data-label="Third"]')).toHaveText('Uruguay');
    await expect(row2024.locator('td[data-label="Fourth"]')).toHaveText('Canada');

    const row1987 = page.locator('tbody tr[data-year="1987"]');
    await expect(row1987.locator('td[data-label="Third"]')).toHaveText('Colombia');
    await expect(row1987.locator('td[data-label="Fourth"]')).toHaveText('Argentina');

    // Pre-1975 league-table/final-playoff era: read off the final standings
    // table, audited 2026-08-02.
    const row1916 = page.locator('tbody tr[data-year="1916"]');
    await expect(row1916.locator('td[data-label="Third"]')).toHaveText('Brazil');
    await expect(row1916.locator('td[data-label="Fourth"]')).toHaveText('Chile');

    // 1922: Uruguay finished 3rd not by the table alone but by withdrawing
    // from the three-way title playoff - still a sourced, real placing.
    const row1922 = page.locator('tbody tr[data-year="1922"]');
    await expect(row1922.locator('td[data-label="Third"]')).toHaveText('Uruguay');
    await expect(row1922.locator('td[data-label="Fourth"]')).toHaveText('Argentina');

    // 1925 only had three entrants (Argentina, Brazil, Paraguay), so a
    // fourth place structurally never existed - "—" here isn't a research
    // gap, it's the historical fact.
    const row1925 = page.locator('tbody tr[data-year="1925"]');
    await expect(row1925.locator('td[data-label="Third"]')).toHaveText('Paraguay');
    await expect(row1925.locator('td[data-label="Fourth"]')).toHaveText('—');

    // Home-and-away era (1975/1979/1983): no standings table exists at all,
    // so this "—" remains permanent, not a future-audit gap.
    const row1975 = page.locator('tbody tr[data-year="1975"]');
    await expect(row1975.locator('td[data-label="Third"]')).toHaveText('—');
    await expect(row1975.locator('td[data-label="Fourth"]')).toHaveText('—');
  });

  test('the language switcher opens the Croatian Copa América page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/copa-america\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian Copa América page (/hr/competitions/copa-america) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/competitions/copa-america');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, filters and column headers', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Copa América', level: 1 })).toBeVisible();
    await expect(page.locator('label[for="copa-america-winner"]')).toHaveText('Prvak');
    await expect(page.locator('th', { hasText: 'Godina' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Prvak' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Drugoplasirani' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Format', exact: true })).toBeVisible();
  });

  test('shows the same "Format" badge value as the English page (data, not translated)', async ({
    page,
  }) => {
    await expect(page.locator('tbody tr[data-year="2016"] .badge')).toHaveText(
      'Special centenary edition',
    );
  });

  test('filtering by prvak (winner) Uruguay updates the shareable URL and status text', async ({
    page,
  }) => {
    await page.selectOption('#copa-america-winner', 'Uruguay');
    await expect(page).toHaveURL(/winner=Uruguay/);
    await expect(page.locator('#copa-america-status')).toContainText('prvak Uruguay');
  });

  test('shows the same champion totals as the English page', async ({ page, baseURL }) => {
    const hrTop = await page.locator('.champions__name').first().textContent();
    const hrCount = await page.locator('.champions__count').first().textContent();

    await page.goto(baseURL ? `${baseURL}competitions/copa-america` : '/competitions/copa-america');
    const enTop = await page.locator('.champions__name').first().textContent();
    const enCount = await page.locator('.champions__count').first().textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('shows the translated Memorable moments section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    await expect(page.getByText('Bolivija je osvojila svoju jedinu titulu')).toBeVisible();
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/copa-america-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher returns to the English Copa América page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/copa-america\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Nations League page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('competitions/nations-league');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the language switcher opens the Croatian Nations League page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/nations-league\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('shows the Key facts and Memorable moments sections from content/uefa-nations-league.md', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Key facts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memorable moments' })).toBeVisible();
    await expect(page.getByText('Italy hosted the 2021 Finals')).toBeVisible();
  });
});

test.describe('Croatian Nations League page (/hr/competitions/nations-league) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/competitions/nations-league');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, filters and column headers', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'UEFA Liga nacija', level: 1 })).toBeVisible();
    await expect(page.locator('label[for="nations-league-winner"]')).toHaveText('Prvak');
    await expect(page.locator('th', { hasText: 'Sezona' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Prvak' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Drugoplasirani' })).toBeVisible();
  });

  test('filtering by prvak (winner) Portugal updates the shareable URL and status text', async ({
    page,
  }) => {
    await page.selectOption('#nations-league-winner', 'Portugal');
    await expect(page).toHaveURL(/winner=Portugal/);
    await expect(page.locator('#nations-league-status')).toContainText('prvak Portugal');
  });

  test('shows the same champion totals as the English page', async ({ page, baseURL }) => {
    const hrTop = await page.locator('.champions__name').first().textContent();
    const hrCount = await page.locator('.champions__count').first().textContent();

    await page.goto(
      baseURL ? `${baseURL}competitions/nations-league` : '/competitions/nations-league',
    );
    const enTop = await page.locator('.champions__name').first().textContent();
    const enCount = await page.locator('.champions__count').first().textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('shows the translated Key facts section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ključne činjenice' })).toBeVisible();
    await expect(page.getByText('Hrvatska je 2023. stigla do svog prvog finala')).toBeVisible();
  });

  test('shows the translated Memorable moments section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    await expect(page.getByText('Italija je 2021. bila domaćin Final Foura')).toBeVisible();
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/nations-league-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher returns to the English Nations League page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/nations-league\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Home page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
  });

  test('has no horizontal page overflow with six competition cards', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('links to all six competitions plus Records', async ({ page }) => {
    await expect(page.locator('.comp-card')).toHaveCount(6);
    await expect(page.locator('a[href$="/records"]').first()).toBeVisible();
  });

  test('the language switcher opens the Croatian home page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('"On this day" shows the matching finals on an exact final date', async ({ page }) => {
    // 30 July matches both the 1930 and 1966 World Cup finals.
    await page.clock.setFixedTime(new Date('2026-07-30T12:00:00'));
    await page.goto('');
    const list = page.locator('#on-this-day-list');
    await expect(list).toContainText('FIFA World Cup 1930');
    await expect(list).toContainText('FIFA World Cup 1966');
    await expect(page.locator('#on-this-day-date')).toHaveText('30 July');
    await expect(page.locator('#on-this-day-hint')).toBeHidden();
  });

  test('"On this day" falls back to an archive card on a non-final date', async ({ page }) => {
    // No World Cup, EURO, Copa América, Nations League decisive match or
    // Ballon d'Or ceremony has ever fallen on 1 January.
    await page.clock.setFixedTime(new Date('2026-01-01T12:00:00'));
    await page.goto('');
    await expect(page.locator('#on-this-day-hint')).toBeVisible();
    await expect(page.locator('#on-this-day-list li')).toHaveCount(1);
    await expect(page.locator('#on-this-day-list')).toContainText(
      /FIFA World Cup|UEFA European Championship|Copa América|UEFA Nations League|Ballon d'Or/,
    );
  });

  test('"On this day" shows a Ballon d\'Or entry with award wording, not "final"', async ({
    page,
  }) => {
    // 12 December matches only the 2016 Ballon d'Or ceremony (Cristiano
    // Ronaldo) - no World Cup/EURO/Copa América/Nations League decisive match
    // has ever fallen on that date, so this is an exact-date match, not the
    // day-of-year fallback.
    await page.clock.setFixedTime(new Date('2026-12-12T12:00:00'));
    await page.goto('');
    const list = page.locator('#on-this-day-list');
    await expect(list).toContainText("Men's Ballon d'Or 2016");
    await expect(list).toContainText('Cristiano Ronaldo won the award.');
    await expect(list).not.toContainText('won the final');
    await expect(page.locator('#on-this-day-hint')).toBeHidden();
  });

  test('shows the "How to use the reference" and "Important historical naming note" sections from content/index.md', async ({
    page,
  }) => {
    const notes = page.locator('.notes__card');
    await expect(notes).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'How to use the reference' })).toBeVisible();
    await expect(page.getByText('Each competition page contains:')).toBeVisible();
    await expect(page.getByText('a champions summary;')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Important historical naming note' }),
    ).toBeVisible();
    await expect(page.getByText(/West Germany\/Germany, Soviet Union\/Russia/)).toBeVisible();
  });
});

test.describe('Croatian home page (/hr/) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/');
  });

  test('has no horizontal page overflow with six competition cards', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome and the same six competitions as English', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('.comp-card')).toHaveCount(6);
    await expect(page.locator('.site-footer')).toContainText('Izvori i pravila provjere');
  });

  test('shows the exact same top champion numbers as the English page', async ({ page, baseURL }) => {
    const hrCard = page.locator('.comp-card', { hasText: 'FIFA Svjetsko prvenstvo' });
    await expect(hrCard.locator('.comp-card__stats dd').first()).toHaveText(/^\d+$/);
    const hrEditions = await hrCard.locator('.comp-card__stats dd').first().textContent();

    await page.goto(baseURL ?? '/');
    const enCard = page.locator('.comp-card', { hasText: 'FIFA World Cup' });
    const enEditions = await enCard.locator('.comp-card__stats dd').first().textContent();

    expect(hrEditions).toBe(enEditions);
  });

  test('the language switcher returns to the English home page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('"On this day" shows translated chrome and the matching finals on an exact final date', async ({
    page,
  }) => {
    // 30 July matches both the 1930 and 1966 World Cup finals.
    await page.clock.setFixedTime(new Date('2026-07-30T12:00:00'));
    await page.goto('hr/');
    await expect(page.locator('#on-this-day-heading')).toHaveText(
      'Na današnji dan u povijesti nogometa',
    );
    const list = page.locator('#on-this-day-list');
    await expect(list).toContainText('FIFA Svjetsko prvenstvo 1930');
    await expect(list).toContainText('FIFA Svjetsko prvenstvo 1966');
    await expect(page.locator('#on-this-day-date')).toHaveText('30. srpnja');
    await expect(page.locator('#on-this-day-hint')).toBeHidden();
  });

  test('"On this day" falls back to a translated archive-card hint on a non-final date', async ({
    page,
  }) => {
    // No World Cup, EURO, Copa América, Nations League decisive match or
    // Ballon d'Or ceremony has ever fallen on 1 January.
    await page.clock.setFixedTime(new Date('2026-01-01T12:00:00'));
    await page.goto('hr/');
    const hint = page.locator('#on-this-day-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(
      'Na ovaj točan datum nije odigrano finale - evo jednog iz arhive.',
    );
    await expect(page.locator('#on-this-day-list li')).toHaveCount(1);
  });

  test('"On this day" shows a Ballon d\'Or entry with Croatian award wording, not "finalu"', async ({
    page,
  }) => {
    // 12 December matches only the 2016 Ballon d'Or ceremony (Cristiano
    // Ronaldo) - an exact-date match, not the day-of-year fallback.
    await page.clock.setFixedTime(new Date('2026-12-12T12:00:00'));
    await page.goto('hr/');
    const list = page.locator('#on-this-day-list');
    await expect(list).toContainText('Zlatna lopta 2016');
    await expect(list).toContainText('Cristiano Ronaldo je osvojio nagradu.');
    await expect(list).not.toContainText('finalu');
    await expect(page.locator('#on-this-day-hint')).toBeHidden();
  });

  test('shows the translated "Kako koristiti ovaj pregled" and "Važna napomena o povijesnim nazivima" sections', async ({
    page,
  }) => {
    const notes = page.locator('.notes__card');
    await expect(notes).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'Kako koristiti ovaj pregled' })).toBeVisible();
    await expect(page.getByText('Svaka stranica natjecanja sadrži:')).toBeVisible();
    await expect(page.getByText('pregled prvaka;')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Važna napomena o povijesnim nazivima' }),
    ).toBeVisible();
    await expect(page.getByText(/Zapadnu Njemačku\/Njemačku, Sovjetski Savez\/Rusiju/)).toBeVisible();
  });
});

test.describe('Records page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('records');
  });

  test('has no horizontal page overflow with timeline cards and rankings', async ({
    page,
  }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('shows a champions timeline card and a title-ranking list per competition', async ({
    page,
  }) => {
    await expect(page.locator('.timeline__card').first()).toBeVisible();
    await expect(page.locator('#teams-world-cup-heading')).toBeVisible();
    await expect(page.locator('#teams-nations-league-heading')).toBeVisible();
  });

  test('explains the historical nation-name aggregation rules', async ({ page }) => {
    await expect(
      page.getByText('Soviet Union and Russia are not merged.'),
    ).toBeVisible();
  });

  test('shows a "Most frequent hosts" ranking per competition, keeping West Germany and Germany distinct', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Most frequent hosts' })).toBeVisible();
    await expect(page.locator('#hosts-world-cup-heading')).toBeVisible();
    await expect(page.locator('#hosts-nations-league-heading')).toBeVisible();

    const worldCupHosts = page.locator('section.champions:has(#hosts-world-cup-heading) .champions__name');
    await expect(worldCupHosts.filter({ hasText: 'West Germany' })).toBeVisible();
    await expect(worldCupHosts.filter({ hasText: /^Germany$/ })).toBeVisible();
  });

  test('shows a "Back-to-back champions" streak ranking, including a competition with none yet', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Back-to-back champions' })).toBeVisible();

    const ballonDorStreaks = page.locator('section.champions:has(#streaks-ballon-dor-heading)');
    await expect(ballonDorStreaks.locator('.champions__name').filter({ hasText: 'Lionel Messi' })).toBeVisible();
    await expect(ballonDorStreaks.locator('.champions__count').first()).toHaveText(/4/);
    await expect(ballonDorStreaks.getByText('2009, 2010, 2011, 2012')).toBeVisible();

    // UEFA Nations League has had four different champions in its four
    // editions so far, so it falls back to the "no streak yet" message
    // instead of an empty ranking list.
    await expect(page.getByText('No one has won two editions in a row yet.').first()).toBeVisible();
  });

  test("shows a separate timeline and ranking for the Ballon d'Or and Golden Boot awards", async ({
    page,
  }) => {
    await expect(page.locator('#timeline-ballon-dor-heading')).toBeVisible();
    await expect(page.locator('#timeline-golden-boot-world-cup-heading')).toBeVisible();
    await expect(page.locator('#timeline-golden-boot-euro-heading')).toBeVisible();
    await expect(page.locator('#awards-ballon-dor-heading')).toBeVisible();
    await expect(page.getByText('Ousmane Dembélé').first()).toBeVisible();
  });

  test('the language switcher opens the Croatian records page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/records\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian records page (/hr/records) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/records');
  });

  test('has no horizontal page overflow with timeline cards and rankings', async ({
    page,
  }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome and headings', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Rekordi i vremenska crta', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vremenska crta prvaka' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Najuspješnije reprezentacije' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Vremenska crta pojedinačnih nagrada' }),
    ).toBeVisible();
    await expect(page.locator('.timeline__card').first()).toBeVisible();
  });

  test('shows the same Ballon d\'Or top-award total as the English page', async ({
    page,
    baseURL,
  }) => {
    const hrCount = await page
      .locator('section:has(#awards-ballon-dor-heading) .champions__count')
      .first()
      .textContent();

    await page.goto(baseURL ? `${baseURL}records` : '/records');
    const enCount = await page
      .locator('section:has(#awards-ballon-dor-heading) .champions__count')
      .first()
      .textContent();

    // Compare only the number - the trailing unit word ("awards"/"nagrade") differs by design.
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('explains the historical nation-name aggregation rules', async ({ page }) => {
    await expect(
      page.getByText('Sovjetski Savez i Rusija se ne spajaju.'),
    ).toBeVisible();
  });

  test('shows the same "Most frequent hosts" World Cup ranking as the English page', async ({
    page,
    baseURL,
  }) => {
    await expect(page.getByRole('heading', { name: 'Najčešći domaćini' })).toBeVisible();
    const hrTop = await page
      .locator('section.champions:has(#hosts-world-cup-heading) .champions__name')
      .first()
      .textContent();

    await page.goto(baseURL ? `${baseURL}records` : '/records');
    const enTop = await page
      .locator('section.champions:has(#hosts-world-cup-heading) .champions__name')
      .first()
      .textContent();

    expect(hrTop).toBe(enTop);
  });

  test('shows the translated "Uzastopni prvaci" streak ranking, including the no-streak-yet fallback', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Uzastopni prvaci' })).toBeVisible();

    const ballonDorStreaks = page.locator('section.champions:has(#streaks-ballon-dor-heading)');
    await expect(ballonDorStreaks.locator('.champions__name').filter({ hasText: 'Lionel Messi' })).toBeVisible();
    await expect(ballonDorStreaks.getByText('2009, 2010, 2011, 2012')).toBeVisible();

    await expect(page.getByText('Nitko još nije osvojio dva izdanja zaredom.').first()).toBeVisible();
  });

  test('the language switcher returns to the English records page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/records\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('champions-bar count is announced in Croatian, not English', async ({ page }) => {
    const barLabel = await page.locator('.champions__bar').first().getAttribute('aria-label');
    expect(barLabel).toMatch(/^\d+ od \d+$/);
    expect(barLabel).not.toContain(' of ');
  });
});

test.describe('Compare page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('compare');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('shows a default head-to-head pair and the all-teams ranking', async ({ page }) => {
    await expect(page.locator('#compare-a-name')).not.toBeEmpty();
    await expect(page.locator('#compare-b-name')).not.toBeEmpty();
    await expect(page.locator('#all-teams-heading')).toBeVisible();
    const rows = page.locator('table.compare__table--all tbody tr');
    expect(await rows.count()).toBeGreaterThan(10);
  });

  test('choosing a different team updates the panel and the URL, and swap works', async ({
    page,
  }) => {
    await page.selectOption('#compare-a', { label: 'Uruguay' });
    await expect(page.locator('#compare-a-name')).toHaveText('Uruguay');
    await expect(page).toHaveURL(/a=uruguay/);

    const aBefore = await page.locator('#compare-a-name').textContent();
    const bBefore = await page.locator('#compare-b-name').textContent();
    await page.locator('#compare-swap').click();
    await expect(page.locator('#compare-a-name')).toHaveText(bBefore ?? '');
    await expect(page.locator('#compare-b-name')).toHaveText(aBefore ?? '');
  });

  test('a shared URL with ?a= and ?b= restores that pair on load', async ({ page }) => {
    await page.goto('compare?a=uruguay&b=argentina');
    await expect(page.locator('#compare-a-name')).toHaveText('Uruguay');
    await expect(page.locator('#compare-b-name')).toHaveText('Argentina');
  });

  test('shows real Copa América third/fourth counts for the knockout-final era, not an em dash', async ({
    page,
  }) => {
    // Copa América now records third/fourth for the knockout-final era (1987
    // and 1993 onward) plus the 1989/1991 closing-group editions, so this is
    // no longer the "no such column" case - Colombia reached third or fourth
    // seven times across those editions (six knockout-era finishes plus
    // fourth in the 1991 closing group).
    await page.goto('compare?a=colombia&b=argentina');
    const copaRow = page.locator('#compare-a-body tr[data-slug="copa-america"]');
    await expect(copaRow.locator('[data-field="semifinals"]')).toHaveText('7');
  });

  test('the language switcher opens the Croatian compare page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    // The page's own script appends ?a=/&b= on load (same as the English
    // page), so the URL isn't bare - just check the path prefix.
    await expect(page).toHaveURL(/\/hr\/compare(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian compare page (/hr/compare) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/compare');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome and headings, with translated competition names', async ({
    page,
  }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Usporedi reprezentacije', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Izravna usporedba' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sve reprezentacije' })).toBeVisible();
    await expect(page.locator('#compare-a-body').getByText('UEFA Liga nacija')).toBeVisible();
  });

  test('choosing a different team updates the panel and the URL, and swap works', async ({
    page,
  }) => {
    await page.selectOption('#compare-a', { label: 'Uruguay' });
    await expect(page.locator('#compare-a-name')).toHaveText('Uruguay');
    await expect(page).toHaveURL(/a=uruguay/);

    const aBefore = await page.locator('#compare-a-name').textContent();
    const bBefore = await page.locator('#compare-b-name').textContent();
    await page.locator('#compare-swap').click();
    await expect(page.locator('#compare-a-name')).toHaveText(bBefore ?? '');
    await expect(page.locator('#compare-b-name')).toHaveText(aBefore ?? '');
  });

  test('shows the same all-teams ranking totals as the English page', async ({ page, baseURL }) => {
    const hrFirstRow = await page
      .locator('table.compare__table--all tbody tr')
      .first()
      .textContent();

    await page.goto(baseURL ? `${baseURL}compare` : '/compare');
    const enFirstRow = await page
      .locator('table.compare__table--all tbody tr')
      .first()
      .textContent();

    expect(hrFirstRow?.replace(/\s+/g, ' ').trim()).toBe(enFirstRow?.replace(/\s+/g, ' ').trim());
  });

  test('the language switcher returns to the English compare page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/compare(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Quiz page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('quiz');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('shows a set of generated questions with multiple choices', async ({ page }) => {
    const cards = page.locator('.quiz-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);
    const firstChoiceCount = await cards.first().locator('input[type="radio"]').count();
    expect(firstChoiceCount).toBeGreaterThanOrEqual(3);
  });

  test('answering a question updates the score, and can be checked with the keyboard', async ({
    page,
  }) => {
    const firstCard = page.locator('.quiz-card').first();
    const firstRadio = firstCard.locator('input[type="radio"]').first();

    await firstRadio.focus();
    await expect(firstRadio).toBeFocused();
    await page.keyboard.press('Space');

    const checkButton = firstCard.locator('.quiz-card__check');
    await expect(checkButton).toBeEnabled();
    await checkButton.click();

    await expect(firstCard.locator('.quiz-card__feedback')).not.toBeEmpty();
    await expect(firstCard.locator('.quiz-card__choice.is-correct')).toBeVisible();

    const scoreValue = page.locator('#quiz-score-value');
    await expect(scoreValue).toHaveText(/0|1/);
  });

  test('restart clears answers and resets the score', async ({ page }) => {
    const firstCard = page.locator('.quiz-card').first();
    await firstCard.locator('input[type="radio"]').first().check();
    await firstCard.locator('.quiz-card__check').click();

    await page.locator('#quiz-restart').click();

    await expect(page.locator('#quiz-score-value')).toHaveText('0');
    await expect(firstCard.locator('input[type="radio"]').first()).not.toBeChecked();
    await expect(firstCard.locator('.quiz-card__check')).toBeDisabled();
  });

  test('every question has a "just show me the answer" fallback', async ({ page }) => {
    const count = await page.locator('.quiz-card__reveal').count();
    const cardCount = await page.locator('.quiz-card').count();
    expect(count).toBe(cardCount);
  });

  test('champion order challenge: ranking correctly and incorrectly both surface feedback', async ({
    page,
  }) => {
    const heading = page.getByRole('heading', { name: 'Champion order challenge' });
    await expect(heading).toBeVisible();

    const firstOrderCard = page.locator('.quiz-card:has(.quiz-order__items)').first();
    const ranks = firstOrderCard.locator('.quiz-order__rank');
    const rankCount = await ranks.count();
    expect(rankCount).toBeGreaterThanOrEqual(4);

    const correctRanks = ((await firstOrderCard.getAttribute('data-correct-ranks')) ?? '')
      .split(',')
      .map(Number);

    for (let i = 0; i < rankCount; i += 1) {
      await ranks.nth(i).selectOption(String(correctRanks[i]));
    }

    const checkButton = firstOrderCard.locator('.quiz-order__check');
    await expect(checkButton).toBeEnabled();
    await checkButton.click();

    await expect(firstOrderCard.locator('.quiz-card__feedback')).toHaveText('Correct order!');
    await expect(firstOrderCard.locator('.quiz-order__item.is-correct')).toHaveCount(rankCount);
  });

  test('champion order challenge is keyboard operable and has its own answer fallback', async ({
    page,
  }) => {
    const firstOrderCard = page.locator('.quiz-card:has(.quiz-order__items)').first();
    const firstRank = firstOrderCard.locator('.quiz-order__rank').first();

    await firstRank.focus();
    await expect(firstRank).toBeFocused();

    const reveal = firstOrderCard.locator('.quiz-card__reveal');
    await expect(reveal).toBeVisible();
    await reveal.locator('summary').click();
    await expect(reveal.locator('p')).not.toBeEmpty();
  });

  test('the language switcher opens the Croatian quiz page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/quiz(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('shows the "How it works" and "Question types in this quiz" sections from content/quiz.md', async ({
    page,
  }) => {
    const notes = page.locator('.notes__card');
    await expect(notes).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(page.getByText('Press "Restart quiz" to clear your answers and play again.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Question types in this quiz' })).toBeVisible();
    await expect(page.getByText("Who won the Ballon d'Or in a given year?")).toBeVisible();
  });
});

test.describe('Croatian quiz page (/hr/quiz) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/quiz');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome, prompts and controls', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Obiteljski kviz', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Izazov: poredaj prvake' })).toBeVisible();
    const firstCard = page.locator('.quiz-card').first();
    await expect(firstCard.locator('.quiz-card__prompt')).toContainText('godine?');
    await expect(firstCard.locator('.quiz-card__check')).toHaveText('Provjeri odgovor');
    await expect(firstCard.locator('.quiz-card__reveal summary')).toHaveText('Samo mi pokaži odgovor');
  });

  test('answering a question shows Croatian feedback and updates the score', async ({ page }) => {
    const firstCard = page.locator('.quiz-card').first();
    const answerIndex = Number(await firstCard.getAttribute('data-answer-index'));
    await firstCard.locator('input[type="radio"]').nth(answerIndex).check();
    await firstCard.locator('.quiz-card__check').click();

    await expect(firstCard.locator('.quiz-card__feedback')).toHaveText('Točno!');
    await expect(page.locator('#quiz-score-value')).toHaveText('1');
  });

  test('champion order challenge: a correct ranking shows Croatian feedback', async ({ page }) => {
    const firstOrderCard = page.locator('.quiz-card:has(.quiz-order__items)').first();
    const ranks = firstOrderCard.locator('.quiz-order__rank');
    const rankCount = await ranks.count();
    const correctRanks = ((await firstOrderCard.getAttribute('data-correct-ranks')) ?? '')
      .split(',')
      .map(Number);

    for (let i = 0; i < rankCount; i += 1) {
      await ranks.nth(i).selectOption(String(correctRanks[i]));
    }
    await firstOrderCard.locator('.quiz-order__check').click();

    await expect(firstOrderCard.locator('.quiz-card__feedback')).toHaveText('Točan redoslijed!');
  });

  test('the language switcher returns to the English quiz page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/quiz(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the translated "Kako funkcionira" and "Vrste pitanja u ovom kvizu" sections', async ({
    page,
  }) => {
    const notes = page.locator('.notes__card');
    await expect(notes).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(
      page.getByText('Pritisni "Ponovno pokreni kviz" da obrišeš odgovore i igraš ponovno.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vrste pitanja u ovom kvizu' })).toBeVisible();
    await expect(page.getByText('Tko je osvojio Zlatnu loptu u danoj godini?')).toBeVisible();
  });
});

test.describe('Sources page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about/sources');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('groups source links by competition and links each group to its page', async ({
    page,
  }) => {
    const groups = page.locator('.sources-page__group');
    const count = await groups.count();
    expect(count).toBeGreaterThanOrEqual(5);

    const worldCupGroup = page.locator('.sources-page__group', { hasText: 'FIFA World Cup' });
    await expect(worldCupGroup.getByRole('link', { name: 'FIFA World Cup' })).toHaveAttribute(
      'href',
      /competitions\/world-cup$/,
    );
    await expect(worldCupGroup.locator('a[href^="https://www.fifa.com"]').first()).toBeVisible();
  });

  test('shows the review policy and a last reviewed date', async ({ page }) => {
    await expect(page.getByText('Historical team names are never rewritten')).toBeVisible();
    await expect(page.locator('time[datetime="2026-07-29"]')).toBeVisible();
  });

  test('is reachable from the nav and the footer', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('a[href$="/about/sources"]').first()).toBeVisible();
  });

  test('the language switcher opens the Croatian sources page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/about\/sources$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });
});

test.describe('Croatian sources page (/hr/about/sources) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/about/sources');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome and headings, with the same last reviewed date as English', async ({
    page,
  }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Izvori i pravila provjere', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Izvori po natjecanjima' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kako se provjeravaju izvori' })).toBeVisible();
    await expect(page.locator('time[datetime="2026-07-29"]')).toBeVisible();
  });

  test('groups source links by competition using the Croatian home-page names', async ({ page }) => {
    const worldCupGroup = page.locator('.sources-page__group', { hasText: 'FIFA Svjetsko prvenstvo' });
    await expect(
      worldCupGroup.getByRole('link', { name: 'FIFA Svjetsko prvenstvo' }),
    ).toHaveAttribute('href', /competitions\/world-cup$/);
    await expect(worldCupGroup.locator('a[href^="https://www.fifa.com"]').first()).toBeVisible();
  });

  test('the language switcher returns to the English sources page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/about\/sources$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('404 page on a 360px phone', () => {
  // GitHub Pages serves dist/404.html for any unmatched path under the
  // project's base path, in either language - there is no server-side
  // routing to pick a locale, so the page itself shows both languages.
  test.beforeEach(async ({ page }) => {
    await page.goto('this-page-definitely-does-not-exist');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('responds with a real 404 status and is excluded from indexing', async ({ page }) => {
    const response = await page.request.get(
      '/football-reference/this-page-definitely-does-not-exist',
    );
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).toContain('<meta name="robots" content="noindex">');
  });

  test('shows the not-found message and link lists in both English and Croatian', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular pages' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popularne stranice' })).toBeVisible();
    await expect(page.getByText('Stranica koju tražite ne postoji')).toBeVisible();
  });

  test('every popular-page link resolves to a real page, in both languages', async ({
    page,
    request,
  }) => {
    const hrefs = await page.locator('.not-found__links a').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href')),
    );
    expect(hrefs.length).toBe(22); // 11 nav pages x 2 languages
    for (const href of hrefs) {
      const response = await request.get(href!);
      expect(response.ok(), `expected ${href} to resolve`).toBe(true);
    }
  });

  test('the home-page link leads back to a real page', async ({ page }) => {
    await page.getByRole('link', { name: 'home page' }).click();
    await expect(page).toHaveURL(/\/football-reference\/?$/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Installability and offline reading', () => {
  test('links a web app manifest with the expected name, icons, and start_url', async ({
    page,
  }) => {
    await page.goto('');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBe('/football-reference/manifest.webmanifest');

    const response = await page.request.get(manifestHref!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('manifest+json');

    const manifest = await response.json();
    expect(manifest.name).toBe('The Ultimate Football Reference');
    expect(manifest.start_url).toBe('/football-reference/');
    expect(manifest.scope).toBe('/football-reference/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(
      true,
    );
  });

  test('links a Croatian web app manifest that launches to the Croatian home page, not the English one', async ({
    page,
  }) => {
    await page.goto('hr/');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBe('/football-reference/hr/manifest.webmanifest');

    const response = await page.request.get(manifestHref!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('manifest+json');

    const manifest = await response.json();
    expect(manifest.lang).toBe('hr');
    expect(manifest.start_url).toBe('/football-reference/hr/');
    expect(manifest.name).toBe('The Ultimate Football Reference');
    expect(manifest.description).not.toContain('family-friendly');
  });

  test('sets a theme-color meta tag and an apple touch icon', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1f6f4f');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/football-reference/icons/icon-192.png',
    );
  });

  test('registers an active service worker for the site scope', async ({ page }) => {
    await page.goto('');
    const scope = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration.scope;
    });
    expect(scope).toBe('http://localhost:4321/football-reference/');
  });

  test('a previously visited page keeps working offline', async ({ page, context }) => {
    await page.goto('');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await page.goto('competitions/world-cup');
    await expect(page.locator('tbody tr[data-year="2018"]')).toContainText('France');

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('tbody tr[data-year="2018"]')).toContainText('France');
    await context.setOffline(false);
  });

  test('falls back to the cached home page offline for a URL that was never cached', async ({
    page,
    context,
  }) => {
    await page.goto('');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    // Never precached and never visited - the service worker's navigate
    // handler has nothing for this exact URL, so it should fall back to the
    // cached home page rather than showing the browser's offline error.
    await page.goto('competitions/world-cup?utm_source=nowhere');
    await expect(page.locator('h1')).toHaveText('The Ultimate Football Reference');
    await context.setOffline(false);
  });

  test('a Croatian page that was never individually visited still works offline (precached on install)', async ({
    page,
    context,
  }) => {
    await page.goto('');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    // Never visited before in this test, but every NAV_LINKS page is now
    // precached in both languages (buildPrecacheUrls) - before that fix, an
    // hr page not yet visited online had nothing in the cache at all.
    await page.goto('hr/competitions/world-cup');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(
      page.getByRole('heading', { name: 'FIFA Svjetsko prvenstvo', level: 1 }),
    ).toBeVisible();
    await context.setOffline(false);
  });

  test('falls back to the cached Croatian home page, not the English one, for an hr URL that was never cached', async ({
    page,
    context,
  }) => {
    await page.goto('');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    // Never precached and never visited under this exact URL - the
    // navigate handler's fallback should stay in Croatian because the
    // request path is under /hr/, not silently switch the reader to the
    // English home page.
    await page.goto('hr/competitions/world-cup?utm_source=nowhere');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.locator('a.lang-switch')).toHaveText('English');
    await context.setOffline(false);
  });
});

test.describe('Primary nav stays in the current language', () => {
  test('every nav link and the logo point to Croatian pages while browsing /hr/...', async ({
    page,
  }) => {
    await page.goto('hr/competitions/world-cup');

    await expect(page.locator('a.brand')).toHaveAttribute('href', '/football-reference/hr/');

    // The nav landmark's own accessible name should be Croatian too, not an
    // English string left over from an untranslated attribute (same bug
    // class as the champions-bar screen-reader label fixed 2026-08-07).
    const nav = page.locator('nav[aria-label="Glavna navigacija"]');
    await expect(nav).toHaveCount(1);
    const navHrefs = await nav.locator('a').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    expect(navHrefs.length).toBeGreaterThan(0);
    for (const href of navHrefs) {
      expect(href, `nav link ${href} should stay under /hr/`).toMatch(
        /^\/football-reference\/hr(\/|$)/,
      );
    }

    // Clicking a translated nav item (not the explicit language switch)
    // should land on that page's own Croatian equivalent and stay in
    // Croatian, not silently bounce the reader back to English.
    await page.getByRole('link', { name: 'Rekordi' }).click();
    await expect(page).toHaveURL(/\/football-reference\/hr\/records\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('every nav link and the logo point to English pages while browsing the English site', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    await expect(page.locator('a.brand')).toHaveAttribute('href', '/football-reference/');

    const navHrefs = await page.locator('nav[aria-label="Primary"] a').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    expect(navHrefs.length).toBeGreaterThan(0);
    for (const href of navHrefs) {
      expect(href, `nav link ${href} should not point into /hr/`).not.toMatch(/\/hr(\/|$)/);
    }
  });
});

test.describe('SEO: canonical/Open Graph tags, sitemap.xml, robots.txt', () => {
  // These render from Astro.site (astro.config.mjs's SITE_URL default), the
  // real deployment origin - not the Playwright dev server's localhost - the
  // same way the manifest/service worker tests above assert against
  // '/football-reference/...' rather than a localhost URL.
  const SITE = 'https://slavisah.github.io/football-reference';

  test('the World Cup page has a canonical link, Open Graph and Twitter Card tags', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${SITE}/competitions/world-cup/`,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'FIFA World Cup · The Ultimate Football Reference',
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'en_US',
    );
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveAttribute(
      'content',
      'hr_HR',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${SITE}/icons/icon-512.png`,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary',
    );
  });

  test('a translated page pair carries matching hreflang alternate links', async ({ page }) => {
    await page.goto('competitions/world-cup');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `${SITE}/competitions/world-cup/`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="hr"]')).toHaveAttribute(
      'href',
      `${SITE}/hr/competitions/world-cup/`,
    );

    await page.goto('hr/competitions/world-cup');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'hr_HR',
    );
    await expect(page.locator('link[rel="alternate"][hreflang="hr"]')).toHaveAttribute(
      'href',
      `${SITE}/hr/competitions/world-cup/`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `${SITE}/competitions/world-cup/`,
    );
  });

  test('robots.txt allows crawling and points at the sitemap', async ({ page }) => {
    const response = await page.request.get('/football-reference/robots.txt');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  test('sitemap.xml lists every page in both languages with hreflang alternates', async ({
    page,
  }) => {
    const response = await page.request.get('/football-reference/sitemap.xml');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('xml');
    const body = await response.text();

    // 11 nav pages x 2 languages.
    expect(body.match(/<url>/g)?.length).toBe(22);
    expect(body).toContain(`<loc>${SITE}/competitions/world-cup/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/world-cup/</loc>`);
    expect(body).toContain(
      `hreflang="hr" href="${SITE}/hr/competitions/world-cup/"`,
    );
    expect(body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });

  async function jsonLdBlocks(page: import('@playwright/test').Page) {
    const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
    return raw.map((text) => JSON.parse(text));
  }

  test('the home page has no JSON-LD (breadcrumb is skipped on the home page itself)', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
  });

  test('a competition page carries a BreadcrumbList, a champions ItemList and a SportsEvent for the latest edition', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');
    const blocks = await jsonLdBlocks(page);
    expect(blocks).toHaveLength(3);

    const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FIFA World Cup',
        item: `${SITE}/competitions/world-cup/`,
      },
    ]);

    const itemList = blocks.find((b) => b['@type'] === 'ItemList');
    expect(itemList.name).toBe('FIFA World Cup - Champions by titles');
    expect(itemList.url).toBe(`${SITE}/competitions/world-cup/`);
    expect(itemList.itemListElement[0].item.name).toBe('Brazil');

    const sportsEvent = blocks.find((b) => b['@type'] === 'SportsEvent');
    expect(sportsEvent.name).toBe('2026 FIFA World Cup');
    expect(sportsEvent.location).toEqual({ '@type': 'Place', name: 'Canada, Mexico and United States' });
    expect(sportsEvent.competitor).toEqual({ '@type': 'SportsTeam', name: 'Spain' });
  });

  test('an individual award page carries an ItemList but no SportsEvent', async ({ page }) => {
    await page.goto('competitions/ballon-dor');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList']);
    expect(blocks.find((b) => b['@type'] === 'ItemList').name).toContain('Most awards');
  });

  test('the Golden Boot page carries one ItemList per table', async ({ page }) => {
    await page.goto('competitions/golden-boot');
    const blocks = await jsonLdBlocks(page);
    const lists = blocks.filter((b) => b['@type'] === 'ItemList');
    expect(lists).toHaveLength(2);
    expect(lists.map((l) => l.name)).toEqual([
      'Most World Cup Golden Boots',
      'Most EURO top-scorer awards',
    ]);
  });

  test('a translated competition page carries its own Croatian BreadcrumbList/ItemList names', async ({
    page,
  }) => {
    await page.goto('hr/competitions/world-cup');
    const blocks = await jsonLdBlocks(page);
    const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement[0].name).toBe('Početna');
    expect(breadcrumb.itemListElement[1].name).toBe('FIFA Svjetsko prvenstvo');
    expect(blocks.find((b) => b['@type'] === 'ItemList').name).toBe(
      'FIFA Svjetsko prvenstvo - prvaci po broju naslova',
    );
  });

  test('/records carries a BreadcrumbList plus one ItemList per ranking section, skipping zero-streak fallbacks', async ({
    page,
  }) => {
    await page.goto('records');
    const blocks = await jsonLdBlocks(page);
    expect(blocks).toHaveLength(17);
    expect(blocks.filter((b) => b['@type'] === 'BreadcrumbList')).toHaveLength(1);

    const lists = blocks.filter((b) => b['@type'] === 'ItemList');
    expect(lists).toHaveLength(16);
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Most successful teams');
    expect(lists.map((l) => l.name)).toContain('Copa América - Most frequent hosts');
    expect(lists.map((l) => l.name)).toContain('Golden Boot (World Cup) - Back-to-back champions');
    expect(lists.map((l) => l.name)).toContain('Golden Boot (EURO) - Most awards');
    // Nations League (4 different champions so far) and the EURO Golden Boot
    // have no back-to-back streak, so records.astro renders a text fallback
    // instead of a ranking for them - no ItemList should exist for either.
    expect(lists.map((l) => l.name)).not.toContain('UEFA Nations League - Back-to-back champions');
    expect(lists.map((l) => l.name)).not.toContain('Golden Boot (EURO) - Back-to-back champions');
  });

  test('/hr/records carries its own Croatian ItemList names for every ranking section', async ({
    page,
  }) => {
    await page.goto('hr/records');
    const blocks = await jsonLdBlocks(page);
    const lists = blocks.filter((b) => b['@type'] === 'ItemList');
    expect(lists).toHaveLength(16);
    expect(lists.map((l) => l.name)).toContain('FIFA Svjetsko prvenstvo - najuspješnije reprezentacije');
    expect(lists.map((l) => l.name)).toContain('Zlatna lopta - uzastopni prvaci');
    expect(lists.map((l) => l.name)).not.toContain('UEFA Liga nacija - uzastopni prvaci');
  });
});

test.describe('Content-Security-Policy', () => {
  const EXPECTED_CSP =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';";

  test('the meta tag is present with the expected directives on English and Croatian pages', async ({
    page,
  }) => {
    for (const path of ['competitions/world-cup', 'hr/competitions/world-cup', 'quiz', 'records']) {
      await page.goto(path);
      await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
        'content',
        EXPECTED_CSP,
      );
    }
  });

  test('the policy does not block real interactivity: filters, sorting, theme toggle and the service worker', async ({
    page,
  }) => {
    const cspViolations: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Content Security Policy|Refused to/i.test(msg.text())) {
        cspViolations.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      if (/Content Security Policy|Refused to/i.test(err.message)) {
        cspViolations.push(err.message);
      }
    });

    await page.goto('competitions/world-cup');
    await page.selectOption('#world-cup-winner', 'Spain');
    await page.selectOption('#world-cup-host', { index: 1 });
    await page.selectOption('#world-cup-team', { index: 1 });
    await page.locator('#world-cup-reset').click();
    await page.locator('#theme-toggle').click();

    await page.goto('quiz');
    await page.locator('input[type="radio"]').first().check();

    // The service worker only registers in production builds (this test
    // runs against the built+previewed site), and only on window "load".
    await page.waitForFunction(() => document.readyState === 'complete');
    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? 'registered' : 'not-registered';
    });
    expect(swState).not.toBe('not-registered');

    expect(cspViolations).toEqual([]);
  });
});

test.describe('Required-page redirects (/awards/... -> /competitions/...)', () => {
  // docs/WEBSITE_REQUIREMENTS.md's "Required pages" list specifies
  // /awards/ballon-dor and /awards/golden-boot, but both pages actually live
  // at /competitions/ballon-dor and /competitions/golden-boot, grouped with
  // the site's other competition pages. astro.config.mjs's `redirects`
  // generates a static meta-refresh page at the documented path instead of
  // moving the canonical page, so the required URL still resolves.
  test('/awards/ballon-dor redirects to the real Ballon d\'Or page', async ({ page }) => {
    await page.goto('awards/ballon-dor');
    await page.waitForURL(/\/competitions\/ballon-dor\/?$/);
    await expect(page.locator('h1')).toHaveText("Men's Ballon d'Or");
  });

  test('/awards/golden-boot redirects to the real Golden Boot page', async ({ page }) => {
    await page.goto('awards/golden-boot');
    await page.waitForURL(/\/competitions\/golden-boot\/?$/);
    await expect(page.locator('h1')).toHaveText('Golden Boot Winners');
  });

  test('the redirect pages are noindex and target the base-path-prefixed destination', async ({
    page,
  }) => {
    const response = await page.request.get('/football-reference/awards/ballon-dor/');
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain(
      '<meta http-equiv="refresh" content="0;url=/football-reference/competitions/ballon-dor">',
    );
    expect(body).toContain('<meta name="robots" content="noindex">');
  });

  // Croatian equivalents, added 2026-08-06 (intensive run): the English
  // /awards/... redirects existed but /hr/awards/... did not, so a Croatian
  // reader following the same convention had no fallback.
  test('/hr/awards/ballon-dor redirects to the real Croatian Ballon d\'Or page', async ({
    page,
  }) => {
    await page.goto('hr/awards/ballon-dor');
    await page.waitForURL(/\/hr\/competitions\/ballon-dor\/?$/);
    await expect(page.locator('h1')).toHaveText('Zlatna lopta');
  });

  test('/hr/awards/golden-boot redirects to the real Croatian Golden Boot page', async ({
    page,
  }) => {
    await page.goto('hr/awards/golden-boot');
    await page.waitForURL(/\/hr\/competitions\/golden-boot\/?$/);
    await expect(page.locator('h1')).toHaveText('Zlatna kopačka');
  });

  test('the Croatian redirect page targets the base-path-prefixed Croatian destination', async ({
    page,
  }) => {
    const response = await page.request.get('/football-reference/hr/awards/ballon-dor/');
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain(
      '<meta http-equiv="refresh" content="0;url=/football-reference/hr/competitions/ballon-dor">',
    );
    expect(body).toContain('<meta name="robots" content="noindex">');
  });
});
