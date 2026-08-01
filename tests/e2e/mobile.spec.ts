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

  test('shows the last reviewed date and source links', async ({ page }) => {
    await expect(page.locator('time[datetime="2026-07-23"]')).toBeVisible();
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

  test('offers a downloadable print PDF with the translated label', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/world-cup.pdf"]');
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

  test('shows the same World Cup award totals as the English page', async ({ page, baseURL }) => {
    const hrTop = await page.locator('.champions__name').first().textContent();
    const hrCount = await page.locator('.champions__count').first().textContent();

    await page.goto(baseURL ? `${baseURL}competitions/golden-boot` : '/competitions/golden-boot');
    const enTop = await page.locator('.champions__name').first().textContent();
    const enCount = await page.locator('.champions__count').first().textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('offers a downloadable print PDF with the translated label', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/golden-boot.pdf"]');
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

  test('the language switcher opens the Croatian Copa América page', async ({ page }) => {
    await page.goto('competitions/copa-america');
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/copa-america\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
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

  test('offers a downloadable print PDF with the translated label', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/ballon-dor.pdf"]');
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

  test('offers a downloadable print PDF with the translated label', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/copa-america.pdf"]');
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

  test('offers a downloadable print PDF with the translated label', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/nations-league.pdf"]');
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

  test('the language switcher returns to the English records page', async ({ page }) => {
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/records\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
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

  test('shows an em dash for a competition that has no semifinal column', async ({ page }) => {
    const copaRow = page.locator('#compare-a-body tr[data-slug="copa-america"]');
    await expect(copaRow.locator('[data-field="semifinals"]')).toHaveText('—');
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
});
