import { test, expect } from '@playwright/test';
import { openMenu } from './menu';
import { NAV_LINKS } from '../../src/lib/routes';

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

  test('the Final column explains a.e.t. via a native abbr tooltip, linked to the Glossary', async ({
    page,
  }) => {
    const row1934 = page.locator('tbody tr[data-year="1934"]');
    const abbr = row1934.locator('td abbr');
    await expect(abbr).toHaveText('a.e.t.');
    await expect(abbr).toHaveAttribute('title', 'after extra time');

    await page.goto('glossary');
    await expect(page.locator('.glossary-page__entry dt', { hasText: 'a.e.t.' })).toBeVisible();
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
    await expect(page.locator('time[datetime="2026-09-02"]')).toBeVisible();
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
    await expect(notes).toHaveCount(11);
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(page.getByText('The two semifinal winners meet in the final')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Golden Ball winners' })).toBeVisible();
    await expect(notes.getByText('Rodri (Spain) - the first Spain player to win the award')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Silver Ball and Bronze Ball winners' })).toBeVisible();
    await expect(notes.getByText('Lionel Messi (Argentina) won the Silver Ball')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Golden Glove winners' })).toBeVisible();
    await expect(notes.getByText('Unai Simón (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Young Player Award winners' })).toBeVisible();
    await expect(notes.getByText('Pau Cubarsí (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fair Play Award winners' })).toBeVisible();
    await expect(
      notes.getByText('the only team to win both the World Cup and the Fair Play Award'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winning managers' })).toBeVisible();
    await expect(notes.getByText('Luis de la Fuente (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winning captains' })).toBeVisible();
    await expect(notes.getByText('Cafu (Brazil) - the only player to appear in three consecutive')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memorable moments' })).toBeVisible();
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(notes.getByText('Croatia reached its first final in 2018.')).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/world-cup\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('shows a compact podium card for every edition, top four finishers only', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Podium by edition' })).toBeVisible();
    const cards = page.locator('.podium__card');
    await expect(cards).toHaveCount(23);
    // Most recent edition first (2026: Spain beat Argentina, England third, France fourth).
    const latest = cards.first();
    await expect(latest.getByText('2026')).toBeVisible();
    await expect(latest.getByText('Hosted by Canada, Mexico and United States')).toBeVisible();
    await expect(latest).toContainText('Spain');
    await expect(latest).toContainText('Argentina');
    await expect(latest).toContainText('England');
    await expect(latest).toContainText('France');
  });

  test('lets a reader tap a year to reveal its short story, closed by default', async ({ page }) => {
    const storyCell = page.locator('tbody tr[data-year="2026"] td[data-label="Story"]');
    const details = storyCell.locator('details.story-reveal');
    await expect(details).toHaveJSProperty('open', false);
    await expect(storyCell.getByText('Spain won its second title in 2026.')).toBeHidden();

    await storyCell.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
    await expect(storyCell.getByText('Spain won its second title in 2026.')).toBeVisible();

    // An edition with no Memorable-moments bullet (e.g. 2014) shows an em dash, not an empty/broken cell.
    const noStoryCell = page.locator('tbody tr[data-year="2014"] td[data-label="Story"]');
    await expect(noStoryCell).toHaveText('—');
  });

  test('shows a host locator map grouped by region, with every host and its hosting years', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Where the tournament has been hosted' })).toBeVisible();
    // Decorative - the real, accessible content is the region list below it.
    await expect(page.locator('.host-map__svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.host-map__dot')).toHaveCount(19);

    const regions = page.locator('.host-map__region');
    await expect(regions).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'South America', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Europe', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'North America', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Asia', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Africa', level: 4 })).toBeVisible();

    // Brazil hosted twice, in South America.
    const brazil = page.locator('.host-map__item', { hasText: 'Brazil' });
    await expect(brazil.locator('.host-map__count')).toHaveText('2 times');
    await expect(brazil.locator('.host-map__years')).toContainText('1950, 2014');

    // The 2026 co-host cell is kept as one combined entry, matching the table's own host filter.
    await expect(page.locator('.host-map__item', { hasText: 'Canada, Mexico and United States' })).toBeVisible();
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

  test('shows the Historical format note as a paragraph, Player of the Tournament winners and Memorable moments as a list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(page.getByText('no third-place match has been played since 1980')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Historical format note' })).toBeVisible();
    await expect(page.locator('.notes__card p', { hasText: 'other semifinalist' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Player of the Tournament winners', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Rodri (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Young Player of the Tournament winners' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Lamine Yamal (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winning managers' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Luis de la Fuente (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winning captains' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Álvaro Morata (Spain)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memorable moments' })).toBeVisible();
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(page.locator('.notes__card').getByText("Antonín Panenka's famous chipped penalty")).toBeVisible();
  });

  test('the language switcher opens the Croatian EURO page', async ({ page }) => {
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/euro\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('the delayed EURO 2020 edition gets its story, matched by its first-mentioned year', async ({ page }) => {
    const storyCell = page.locator('tbody tr[data-year="2020"] td[data-label="Story"]');
    await storyCell.locator('summary').click();
    await expect(storyCell.getByText('The delayed EURO 2020 was played in 2021 across multiple countries.')).toBeVisible();
  });

  test('shows a host locator map with one Europe region, including the multi-city 2020 edition', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Where the tournament has been hosted' })).toBeVisible();
    await expect(page.locator('.host-map__svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.host-map__dot')).toHaveCount(14);

    const regions = page.locator('.host-map__region');
    await expect(regions).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Europe', level: 4 })).toBeVisible();

    // France hosted three times.
    const france = page.locator('.host-map__item', { hasText: 'France' });
    await expect(france.locator('.host-map__count')).toHaveText('3 times');
    await expect(france.locator('.host-map__years')).toContainText('1960, 1984, 2016');

    // 2020 has no single host country - still gets its own marker/entry.
    await expect(page.locator('.host-map__item', { hasText: 'Eleven European cities' })).toBeVisible();
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
    await expect(page.locator('.notes__card')).toHaveCount(11);
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(page.getByText('Pobjednici polufinala igraju finale')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prekretnice formata' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dobitnici Zlatne lopte' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Rodri (Španjolska) - prvi španjolski igrač'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dobitnici Srebrne i Brončane lopte' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Lionel Messi (Argentina) osvojio je Srebrnu loptu'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dobitnici Zlatne rukavice' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Unai Simón (Španjolska)'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade za najboljeg mladog igrača' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Pau Cubarsí (Španjolska)'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dobitnici nagrade Fair Play' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('jedina momčad koja je na istom turniru'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Izbornici prvaka' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Luis de la Fuente (Španjolska)').first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kapetani prvaka' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Cafu (Brazil) - jedini igrač koji je nastupio'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Uredničke napomene' })).toBeVisible();
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(
      page.locator('.notes__card').getByText('Hrvatska je 2018. stigla do svog prvog finala.'),
    ).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/world-cup\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the translated podium cards, one per edition', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pobjednici po izdanju' })).toBeVisible();
    const cards = page.locator('.podium__card');
    await expect(cards).toHaveCount(23);
    const latest = cards.first();
    await expect(latest.getByText('2026')).toBeVisible();
    await expect(latest.getByText('Domaćin: Canada, Mexico and United States')).toBeVisible();
    await expect(latest).toContainText('Spain');
    await expect(latest).toContainText('Argentina');
  });

  test('shows the translated host map with Croatian region headings and the same 19 hosts as the English page', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Gdje je Svjetsko prvenstvo igralo domaćinu' })).toBeVisible();
    await expect(page.locator('.host-map__dot')).toHaveCount(19);
    await expect(page.getByRole('heading', { name: 'Južna Amerika', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Europa', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sjeverna Amerika', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Azija', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Afrika', level: 4 })).toBeVisible();

    // Country names themselves stay untranslated, matching every other table/card on this page.
    const brazil = page.locator('.host-map__item', { hasText: 'Brazil' });
    await expect(brazil.locator('.host-map__count')).toHaveText('2 puta');
    await expect(page.locator('.host-map__item', { hasText: 'Urugvaj' })).toHaveCount(0);
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

  test('shows the Historical format note as a paragraph, translated Player of the Tournament winners and Memorable moments as a translated list', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(page.getByText('utakmica za treće mjesto nije se igrala od 1980')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Povijesna napomena o formatu' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card p', { hasText: 'drugi polufinalist' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade za igrača turnira' }),
    ).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Rodri (Španjolska)').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade za najboljeg mladog igrača turnira' }),
    ).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Lamine Yamal (Španjolska)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Izbornici prvaka' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Luis de la Fuente (Španjolska)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kapetani prvaka' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Álvaro Morata (Španjolska)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(page.locator('.notes__card').getByText('Slavna "panenka" Antonína Panenke')).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/euro\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the translated host map with a Croatian region heading and the same 14 hosts as the English page', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Gdje je Europsko prvenstvo igralo domaćinu' })).toBeVisible();
    await expect(page.locator('.host-map__dot')).toHaveCount(14);
    await expect(page.getByRole('heading', { name: 'Europa', level: 4 })).toBeVisible();

    // Country names themselves stay untranslated, matching every other table/card on this page.
    const france = page.locator('.host-map__item', { hasText: 'France' });
    await expect(france.locator('.host-map__count')).toHaveText('3 puta');
    await expect(page.locator('.host-map__item', { hasText: 'Eleven European cities' })).toBeVisible();
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
    await expect(page.locator('.notes__card')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(page.getByText('it is a personal scoring award, not the team championship')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'World Cup notes' })).toBeVisible();
    await expect(page.getByText("Just Fontaine's 13 goals in 1958 remain the record")).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'World Cup Silver Boot and Bronze Boot winners' }),
    ).toBeVisible();
    await expect(
      page.getByText('David Villa (Spain) won the Silver Boot; Diego Forlán (Uruguay) won the Bronze Boot'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'World Cup memorable moments' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Guillermo Stábile won the first-ever FIFA World Cup Golden Boot'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EURO notes' })).toBeVisible();
    await expect(page.getByText('Michel Platini scored nine goals in five matches in 1984.')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'EURO Silver Boot and Bronze Boot winners' }),
    ).toBeVisible();
    await expect(
      page.getByText("not shown here even though UEFA's own tiebreak", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('Karim Benzema (France) won the Bronze Boot with four goals'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EURO memorable moments' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('The first-ever EURO Golden Boot, in 1960, was shared'),
    ).toBeVisible();
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
    await openMenu(page);
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
    await expect(page.locator('.notes__card')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(
      page.getByText('riječ je o osobnoj nagradi za golove, a ne o momčadskom naslovu prvaka'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Napomene o Svjetskom prvenstvu' })).toBeVisible();
    await expect(page.getByText('13 golova Justa Fontainea 1958. ostaje rekord')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dobitnici Srebrne i Brončane kopačke - Svjetsko prvenstvo' }),
    ).toBeVisible();
    await expect(
      page.getByText('David Villa (Španjolska) osvojio je Srebrnu kopačku; Diego Forlán (Urugvaj) osvojio je Brončanu kopačku'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci - Svjetsko prvenstvo' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Guillermo Stábile osvojio je prvu ikad dodijeljenu Zlatnu kopačku'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Napomene o EURU' })).toBeVisible();
    await expect(page.getByText('Michel Platini postigao je devet golova')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dobitnici Srebrne i Brončane kopačke - EURO' }),
    ).toBeVisible();
    await expect(
      page.getByText('nije prikazano ovdje iako je', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('Karim Benzema (Francuska) osvojio je Brončanu kopačku s četiri gola'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci - EURO' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Prva ikad dodijeljena Zlatna kopačka EURA, 1960.'),
    ).toBeVisible();
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
    await openMenu(page);
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

  test('shows the How it works section from content/ballon-dor.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(
      page.getByText('it is not a team competition or a national-team trophy'),
    ).toBeVisible();
  });

  test('shows the Kopa Trophy winners section, including the 2025 repeat winner', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Kopa Trophy winners' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Kylian Mbappé (France)').first(),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('the first player to win the Kopa Trophy twice'),
    ).toBeVisible();
  });

  test('shows the Yashin Trophy winners section, including the 2025 repeat winner', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Yashin Trophy winners' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Alisson (Brazil)')).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('the first goalkeeper to win the Yashin Trophy in consecutive years'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('second goalkeeper (after Martínez) to win it more than once'),
    ).toBeVisible();
  });

  test('shows the Gerd Müller Trophy winners section, including the 2024 tie', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Gerd Müller Trophy winners' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Robert Lewandowski (Poland)').first(),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText("the trophy's first tie"),
    ).toBeVisible();
  });

  test('shows the Johan Cruyff Trophy winners section, including both winners', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Johan Cruyff Trophy winners' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Carlo Ancelotti (Real Madrid)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Luis Enrique (Paris Saint-Germain)'),
    ).toBeVisible();
  });

  test('shows the Socrates Award winners section, including all four winners', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Socrates Award winners' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Sadio Mané (Senegal)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Vinícius Júnior (Brazil)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Jennifer Hermoso (Spain)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Xana Foundation'),
    ).toBeVisible();
  });

  test("the language switcher opens the Croatian Ballon d'Or page", async ({ page }) => {
    await page.goto('competitions/ballon-dor');
    await openMenu(page);
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

  test('shows the translated How it works section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(
      page.getByText('nije riječ o momčadskom natjecanju ni nagradi za reprezentaciju'),
    ).toBeVisible();
  });

  test('shows the translated Kopa Trophy winners section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade Kopa Trophy' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Kylian Mbappé (Francuska)').first(),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('prvi igrač koji je nagradu Kopa Trophy osvojio dva puta'),
    ).toBeVisible();
  });

  test('shows the translated Yashin Trophy winners section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade Yashin Trophy' }),
    ).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Alisson (Brazil)')).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('prvi vratar koji je nagradu Yashin Trophy osvojio dvije uzastopne godine'),
    ).toBeVisible();
  });

  test('shows the translated Gerd Müller Trophy winners section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade Gerd Müller Trophy' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Robert Lewandowski (Poljska)').first(),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('prvo dijeljenje nagrade'),
    ).toBeVisible();
  });

  test('shows the translated Johan Cruyff Trophy winners section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade Johan Cruyff Trophy' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Carlo Ancelotti (Real Madrid)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Luis Enrique (Paris Saint-Germain)'),
    ).toBeVisible();
  });

  test('shows the translated Socrates Award winners section, including all four winners', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade Sócrates' }),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Sadio Mané (Senegal)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Vinícius Júnior (Brazil)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Jennifer Hermoso (Španjolska)'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Xana Foundation'),
    ).toBeVisible();
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
    await openMenu(page);
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

  test('shows the How it works section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(
      page.getByText('has not always run on a fixed four-year cycle'),
    ).toBeVisible();
  });

  test('shows the Best Player winners section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Best Player winners' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('James Rodríguez (Colombia) - runner-up with Colombia'),
    ).toBeVisible();
  });

  test('shows the Golden Glove winners section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Golden Glove winners' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Justo Villar (Paraguay)')).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Emiliano Martínez (Argentina) - his second win.'),
    ).toBeVisible();
  });

  test('shows the Golden Boot winners section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Golden Boot winners' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Isabelino Gradín (Uruguay) - 3 goals'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText("Guerrero's third win, the most of any player."),
    ).toBeVisible();
  });

  test('shows the Fair Play Award winners section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Fair Play Award winners' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText("Uruguay - the award's first winner"),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Colombia - the tournament\'s runner-up.'),
    ).toBeVisible();
  });

  test('shows the Team of the Tournament winners section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team of the Tournament winners' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Claudio Bravo (Chile, goalkeeper); Nicolás Otamendi'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Lionel Messi is the only player named in four of the five editions'),
    ).toBeVisible();
  });

  test('shows the Winning managers section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Winning managers' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Marcos Calderón (Peru)')).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Lionel Scaloni (Argentina) - his second, back-to-back.'),
    ).toBeVisible();
  });

  test('shows the Winning captains section from content/copa-america.md', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Winning captains' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Diego Lugano (Uruguay)')).toBeVisible();
    await expect(
      page
        .locator('.notes__card')
        .getByText('Lionel Messi (Argentina) - his second, back-to-back, though an injury'),
    ).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/copa-america\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('shows a compact podium card for every edition, top four finishers only, omitting "—" placeholders', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Podium by edition' })).toBeVisible();
    const cards = page.locator('.podium__card');
    await expect(cards).toHaveCount(48);

    // Most recent edition first (2024: Argentina beat Colombia, Uruguay third, Canada fourth).
    const latest = cards.first();
    await expect(latest.getByText('2024')).toBeVisible();
    await expect(latest.getByText('Hosted by United States')).toBeVisible();
    await expect(latest).toContainText('Argentina');
    await expect(latest).toContainText('Colombia');
    await expect(latest).toContainText('Uruguay');
    await expect(latest).toContainText('Canada');

    // The 1975 home-and-away edition has no standalone third-place match -
    // its card must show champion/runner-up only, not a literal "—" name.
    const cardsText = await cards.allTextContents();
    const card1975 = cardsText.find((text) => text.includes('1975'));
    expect(card1975).toContain('Peru');
    expect(card1975).toContain('Colombia');
    expect(card1975).not.toContain('—');
  });

  test('shows a host locator map grouped by South America then North America, skipping the Home-and-away editions', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Where the tournament has been hosted' })).toBeVisible();
    await expect(page.locator('.host-map__dot')).toHaveCount(11);

    const regions = page.locator('.host-map__region');
    await expect(regions).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'South America', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'North America', level: 4 })).toBeVisible();

    // Uruguay hosted more than once.
    const uruguay = page.locator('.host-map__item', { hasText: 'Uruguay' });
    await expect(uruguay.locator('.host-map__count')).not.toHaveText('1 time');

    // The three Home-and-away editions (1975, 1979, 1983) have no single host - no marker for them.
    await expect(page.locator('.host-map__item', { hasText: 'Home-and-away' })).toHaveCount(0);
    await expect(page.locator('.host-map__item', { hasText: 'United States' })).toBeVisible();
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

  test('has a translated "Priča" story column with a Croatian tap-to-reveal story', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Priča', exact: true })).toBeVisible();
    const storyCell = page.locator('tbody tr[data-year="2024"] td[data-label="Priča"]');
    await storyCell.getByText('📖 Dodirni za priču').click();
    await expect(
      storyCell.getByText('Argentina je 2024. preuzela vodstvo kao najuspješnija reprezentacija natjecanja.'),
    ).toBeVisible();
  });

  test('filtering by prvak (winner) Uruguay updates the shareable URL and status text', async ({
    page,
  }) => {
    await page.selectOption('#copa-america-winner', 'Uruguay');
    await expect(page).toHaveURL(/winner=Uruguay/);
    await expect(page.locator('#copa-america-status')).toContainText('prvak Uruguay');
  });

  test('shows the translated Golden Glove winners section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade za najboljeg vratara' }),
    ).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Justo Villar (Paragvaj)')).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Emiliano Martínez (Argentina) - njegova druga nagrada.'),
    ).toBeVisible();
  });

  test('shows the translated Golden Boot winners section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dobitnici Zlatne kopačke' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Isabelino Gradín (Urugvaj) - 3 gola'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Guerrerova treća nagrada, najviše od svih igrača.'),
    ).toBeVisible();
  });

  test('shows the translated Fair Play Award winners section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dobitnici nagrade Fair Play' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('prvi dobitnik nagrade, u momčadi koja je i osvojila'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Kolumbija - drugoplasirana momčad natjecanja.'),
    ).toBeVisible();
  });

  test('shows the translated Team of the Tournament winners section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Idealna momčad turnira' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Claudio Bravo (Čile, vratar); Nicolás Otamendi'),
    ).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Lionel Messi jedini je igrač uvršten u četiri od pet izdanja'),
    ).toBeVisible();
  });

  test('shows the translated Winning managers section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Izbornici prvaka' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Marcos Calderón (Peru)')).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('Lionel Scaloni (Argentina) - njegova druga, uzastopna.'),
    ).toBeVisible();
  });

  test('shows the translated Winning captains section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kapetani prvaka' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Diego Lugano (Urugvaj)')).toBeVisible();
    await expect(
      page
        .locator('.notes__card')
        .getByText('Lionel Messi (Argentina) - njegova druga, uzastopna titula'),
    ).toBeVisible();
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
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(page.locator('.notes__card').getByText('Bolivija je osvojila svoju jedinu titulu')).toBeVisible();
  });

  test('shows the translated How it works section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(
      page.getByText('nije uvijek imala fiksni četverogodišnji ciklus'),
    ).toBeVisible();
  });

  test('shows the translated Best Player winners section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dobitnici nagrade za najboljeg igrača' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('James Rodríguez (Kolumbija) - drugoplasirani s Kolumbijom'),
    ).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/copa-america\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the translated podium cards, one per edition', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pobjednici po izdanju' })).toBeVisible();
    const cards = page.locator('.podium__card');
    await expect(cards).toHaveCount(48);
    const latest = cards.first();
    await expect(latest.getByText('2024')).toBeVisible();
    await expect(latest.getByText('Domaćin: United States')).toBeVisible();
    await expect(latest).toContainText('Argentina');
    await expect(latest).toContainText('Colombia');
  });

  test('shows the translated host map with South America/North America region headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Gdje je Copa América igrala domaćinu' })).toBeVisible();
    await expect(page.locator('.host-map__dot')).toHaveCount(11);
    await expect(page.getByRole('heading', { name: 'Južna Amerika', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sjeverna Amerika', level: 4 })).toBeVisible();
    await expect(page.locator('.host-map__item', { hasText: 'United States' })).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/competitions\/nations-league\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('shows the Key facts and Memorable moments sections from content/uefa-nations-league.md', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(page.getByText('Held every two years.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Key facts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player of the Finals winners' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Nuno Mendes (Portugal)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winning managers' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Roberto Martínez (Portugal)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winning captains' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('the first captain to lift the Nations League trophy twice')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memorable moments' })).toBeVisible();
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(page.locator('.notes__card').getByText('Italy hosted the 2021 Finals')).toBeVisible();
  });

  test('joins a season row (e.g. "2018-19") to its story by the Finals year, not the season start year', async ({
    page,
  }) => {
    const storyCell = page.locator('tbody tr[data-year="2018–19"] td[data-label="Story"]');
    await storyCell.locator('summary').click();
    await expect(storyCell.getByText('Portugal won the first-ever Nations League Finals in 2019')).toBeVisible();
  });

  test('shows a compact podium card for every edition, top four finishers only', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Podium by edition' })).toBeVisible();
    const cards = page.locator('.podium__card');
    await expect(cards).toHaveCount(4);
    // Most recent edition first (2024-25: Portugal beat Spain, France third, Germany fourth).
    const latest = cards.first();
    await expect(latest.getByText('2024–25')).toBeVisible();
    await expect(latest.getByText('Hosted by Germany')).toBeVisible();
    await expect(latest).toContainText('Portugal');
    await expect(latest).toContainText('Spain');
    await expect(latest).toContainText('France');
    await expect(latest).toContainText('Germany');
  });

  test('shows a host locator map with one Europe region and every Finals host', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Where the tournament has been hosted' })).toBeVisible();
    await expect(page.locator('.host-map__dot')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Europe', level: 4 })).toBeVisible();
    await expect(page.locator('.host-map__item', { hasText: 'Portugal' })).toBeVisible();
    await expect(page.locator('.host-map__item', { hasText: 'Germany' })).toBeVisible();
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

  test('shows the translated Player of the Finals winners section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dobitnici nagrade za najboljeg igrača Final Foura' }),
    ).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Nuno Mendes (Portugal)')).toBeVisible();
  });

  test('shows the translated Winning managers section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Izbornici prvaka' })).toBeVisible();
    await expect(page.locator('.notes__card').getByText('Roberto Martínez (Portugal)')).toBeVisible();
  });

  test('shows the translated Winning captains section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kapetani prvaka' })).toBeVisible();
    await expect(
      page.locator('.notes__card').getByText('prvi kapetan koji je dvaput podigao pehar Lige nacija'),
    ).toBeVisible();
  });

  test('shows the translated How it works section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kako funkcionira' })).toBeVisible();
    await expect(page.getByText('Igra se svake dvije godine.')).toBeVisible();
  });

  test('shows the translated Memorable moments section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nezaboravni trenuci' })).toBeVisible();
    // Scoped to the notes cards, not the table - the same sentence is now
    // also joined onto its edition row as a "tap a year for a story" reveal.
    await expect(
      page.locator('.notes__card').getByText('Italija je 2021. bila domaćin Final Foura'),
    ).toBeVisible();
  });

  test('shows the translated podium cards, one per edition', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pobjednici po izdanju' })).toBeVisible();
    const cards = page.locator('.podium__card');
    await expect(cards).toHaveCount(4);
    const latest = cards.first();
    await expect(latest.getByText('2024–25')).toBeVisible();
    await expect(latest.getByText('Domaćin: Germany')).toBeVisible();
    await expect(latest).toContainText('Portugal');
    await expect(latest).toContainText('Spain');
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/competitions\/nations-league\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the translated host map with a Croatian region heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Gdje je Final Four Lige nacija igrao domaćinu' }),
    ).toBeVisible();
    await expect(page.locator('.host-map__dot')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Europa', level: 4 })).toBeVisible();
    await expect(page.locator('.host-map__item', { hasText: 'Portugal' })).toBeVisible();
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
    await openMenu(page);
    await expect(page.locator('a[href$="/records"]').first()).toBeVisible();
  });

  test('the language switcher opens the Croatian home page', async ({ page }) => {
    await openMenu(page);
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
    await openMenu(page);
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

  test('shows a "Titles won on home soil" ranking, excluding a co-host that went on to win', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Titles won on home soil' })).toBeVisible();

    // Copa América has by far the most home-soil titles - Uruguay tops it
    // with seven (1917, 1923, 1924, 1942, 1956, 1967, 1995).
    const copaHomeSoil = page.locator('section.champions:has(#home-soil-copa-america-heading)');
    await expect(copaHomeSoil.locator('.champions__name').first()).toHaveText('Uruguay');
    await expect(copaHomeSoil.locator('.champions__count').first()).toHaveText(/7/);

    // Spain won the co-hosted 2026 FIFA World Cup (hosted by Canada, Mexico
    // and United States) - it is not one of the hosts, so it must not appear
    // in the World Cup's home-soil ranking at all.
    const worldCupHomeSoil = page.locator('section.champions:has(#home-soil-world-cup-heading)');
    await expect(worldCupHomeSoil.locator('.champions__name').filter({ hasText: /^Spain$/ })).toHaveCount(0);
    await expect(worldCupHomeSoil.locator('.champions__name').filter({ hasText: /^Uruguay$/ })).toBeVisible();
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

  test('shows a "Nearly champions" ranking of runner-up teams that have never won', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Nearly champions' })).toBeVisible();

    const worldCupNearly = page.locator('section.champions:has(#nearly-champions-world-cup-heading)');
    await expect(worldCupNearly.locator('.champions__name').filter({ hasText: 'Netherlands' })).toBeVisible();
    await expect(worldCupNearly.locator('.champions__count').first()).toHaveText(/3/);
    await expect(worldCupNearly.getByText('1974, 1978, 2010')).toBeVisible();

    // Argentina has lost a World Cup final (1930, 1990) but has also won it
    // three times, so it must not appear in this "never won" ranking at all.
    await expect(worldCupNearly.locator('.champions__name').filter({ hasText: /^Argentina$/ })).toHaveCount(0);
  });

  test('shows a "Nearly finalists" ranking of semifinal teams that have never reached a final', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Nearly finalists' })).toBeVisible();

    const worldCupNearly = page.locator('section.champions:has(#nearly-finalists-world-cup-heading)');
    await expect(worldCupNearly.locator('.champions__name').filter({ hasText: 'Yugoslavia' })).toBeVisible();
    await expect(worldCupNearly.locator('.champions__count').first()).toHaveText(/2/);
    await expect(worldCupNearly.getByText('1930, 1962')).toBeVisible();

    // The Netherlands has lost three World Cup finals (a "Nearly champions"
    // entry above) but never a mere third/fourth-place finish without also
    // reaching the final, so it must not appear in this one-tier-down ranking.
    await expect(worldCupNearly.locator('.champions__name').filter({ hasText: /^Netherlands$/ })).toHaveCount(0);
  });

  test('shows a "Longest wait between titles" ranking, including a team whose two titles are back-to-back', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Longest wait between titles' })).toBeVisible();

    const worldCupGaps = page.locator('section.champions:has(#title-gaps-world-cup-heading)');
    await expect(worldCupGaps.locator('.champions__name').filter({ hasText: 'Italy' })).toBeVisible();
    await expect(worldCupGaps.locator('.champions__count').first()).toHaveText(/44/);
    await expect(worldCupGaps.getByText('1938, 1982')).toBeVisible();

    // UEFA Nations League has only had one repeat champion so far (Portugal,
    // 2018-19 and 2024-25) - it still gets an entry here, not the "hasn't
    // happened yet" fallback the streaks section shows.
    const nationsLeagueGaps = page.locator('section.champions:has(#title-gaps-nations-league-heading)');
    await expect(nationsLeagueGaps.locator('.champions__name').filter({ hasText: 'Portugal' })).toBeVisible();
  });

  test('shows a "Biggest final wins" ranking by goal margin, with Copa América excluded for lacking a Final score column', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Biggest final wins' })).toBeVisible();

    const worldCupMargins = page.locator('section.champions:has(#final-margins-world-cup-heading)');
    await expect(worldCupMargins.locator('.champions__name').first()).toHaveText('Brazil 5–2 Sweden');
    await expect(worldCupMargins.locator('.champions__count').first()).toHaveText(/3/);
    await expect(worldCupMargins.getByText('1958')).toBeVisible();

    const euroMargins = page.locator('section.champions:has(#final-margins-euro-heading)');
    await expect(euroMargins.locator('.champions__name').first()).toHaveText('Spain 4–0 Italy');
    await expect(euroMargins.locator('.champions__count').first()).toHaveText(/4/);

    // A final decided on penalties (drawn after normal/extra time) ranks with
    // a margin of 0, not the penalty shootout score.
    await expect(worldCupMargins.getByText(/Brazil 0–0 Italy; 3–2 pens/)).toBeVisible();
    const shootoutRow = worldCupMargins.locator('.champions__item').filter({ hasText: '0–0 Italy' });
    await expect(shootoutRow.locator('.champions__count')).toHaveText(/0/);

    // Copa América's source table has no "Final" score column, so it falls
    // back to an explanatory message instead of an empty ranking.
    await expect(
      page.getByText('This competition\'s table has no "Final" score column to rank by margin.'),
    ).toBeVisible();
  });

  test('shows a "Fiercest rivalries" ranking of pairs that have met 2+ times in a final, topped by Argentina vs Uruguay', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Fiercest rivalries' })).toBeVisible();

    const rivalriesTable = page.locator('.records__rivalries-table');
    const firstRow = rivalriesTable.locator('tbody tr').first();
    await expect(firstRow).toContainText('Argentina');
    await expect(firstRow).toContainText('Uruguay');
    // Argentina and Uruguay have met more than any other pair across the four
    // team competitions (mostly Copa América finals).
    await expect(firstRow.locator('td').nth(1)).toHaveText(/^\d+$/);
    const meetingsCount = Number(await firstRow.locator('td').nth(1).innerText());
    expect(meetingsCount).toBeGreaterThan(5);

    // Each team name links to its own /teams/<slug> profile.
    await expect(firstRow.getByRole('link', { name: 'Argentina' })).toHaveAttribute(
      'href',
      /\/teams\/argentina\/?$/,
    );

    // West Germany and Germany merge into one rivalry pair (a France-vs-
    // Germany or similar entry would double-count otherwise) - assert the
    // merged display name appears at least once rather than a bare
    // "West Germany" rivalry row existing separately from "Germany".
    await expect(rivalriesTable.getByText('Germany (incl. West Germany)').first()).toBeVisible();
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

  test('offers a downloadable print PDF covering every ranking and timeline', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/records.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('the language switcher opens the Croatian records page', async ({ page }) => {
    await openMenu(page);
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

  test('shows the translated "Naslovi osvojeni na domaćem terenu" ranking, matching the English Copa América numbers', async ({
    page,
    baseURL,
  }) => {
    await expect(page.getByRole('heading', { name: 'Naslovi osvojeni na domaćem terenu' })).toBeVisible();

    const hrTop = await page
      .locator('section.champions:has(#home-soil-copa-america-heading) .champions__name')
      .first()
      .textContent();
    const hrCount = await page
      .locator('section.champions:has(#home-soil-copa-america-heading) .champions__count')
      .first()
      .textContent();

    await page.goto(baseURL ? `${baseURL}records` : '/records');
    const enTop = await page
      .locator('section.champions:has(#home-soil-copa-america-heading) .champions__name')
      .first()
      .textContent();
    const enCount = await page
      .locator('section.champions:has(#home-soil-copa-america-heading) .champions__count')
      .first()
      .textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
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

  test('shows the translated "Vječiti drugoplasirani" ranking, matching the English World Cup numbers', async ({
    page,
    baseURL,
  }) => {
    await expect(page.getByRole('heading', { name: 'Vječiti drugoplasirani' })).toBeVisible();

    const hrTop = await page
      .locator('section.champions:has(#nearly-champions-world-cup-heading) .champions__name')
      .first()
      .textContent();
    const hrCount = await page
      .locator('section.champions:has(#nearly-champions-world-cup-heading) .champions__count')
      .first()
      .textContent();

    await page.goto(baseURL ? `${baseURL}records` : '/records');
    const enTop = await page
      .locator('section.champions:has(#nearly-champions-world-cup-heading) .champions__name')
      .first()
      .textContent();
    const enCount = await page
      .locator('section.champions:has(#nearly-champions-world-cup-heading) .champions__count')
      .first()
      .textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('shows the translated "Najduže čekanje na novi naslov" ranking, matching the English World Cup numbers', async ({
    page,
    baseURL,
  }) => {
    await expect(page.getByRole('heading', { name: 'Najduže čekanje na novi naslov' })).toBeVisible();

    const hrTop = await page
      .locator('section.champions:has(#title-gaps-world-cup-heading) .champions__name')
      .first()
      .textContent();
    const hrCount = await page
      .locator('section.champions:has(#title-gaps-world-cup-heading) .champions__count')
      .first()
      .textContent();

    await page.goto(baseURL ? `${baseURL}records` : '/records');
    const enTop = await page
      .locator('section.champions:has(#title-gaps-world-cup-heading) .champions__name')
      .first()
      .textContent();
    const enCount = await page
      .locator('section.champions:has(#title-gaps-world-cup-heading) .champions__count')
      .first()
      .textContent();

    expect(hrTop).toBe(enTop);
    expect(hrCount?.match(/\d+/)?.[0]).toBe(enCount?.match(/\d+/)?.[0]);
  });

  test('shows the translated "Najveći rivaliteti" ranking, matching the English page\'s top pair and meeting count', async ({
    page,
    baseURL,
  }) => {
    await expect(page.getByRole('heading', { name: 'Najveći rivaliteti' })).toBeVisible();

    const hrFirstRow = page.locator('.records__rivalries-table tbody tr').first();
    const hrText = await hrFirstRow.textContent();
    const hrMeetings = await hrFirstRow.locator('td').nth(1).textContent();

    await page.goto(baseURL ? `${baseURL}records` : '/records');
    const enFirstRow = page.locator('.records__rivalries-table tbody tr').first();
    const enText = await enFirstRow.textContent();
    const enMeetings = await enFirstRow.locator('td').nth(1).textContent();

    expect(hrText).toContain('Argentina');
    expect(hrText).toContain('Uruguay');
    expect(enText).toContain('Argentina');
    expect(enText).toContain('Uruguay');
    expect(hrMeetings).toBe(enMeetings);
  });

  test('the language switcher returns to the English records page', async ({ page }) => {
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/records\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('champions-bar count is announced in Croatian, not English', async ({ page }) => {
    const barLabel = await page.locator('.champions__bar').first().getAttribute('aria-label');
    expect(barLabel).toMatch(/^\d+ od \d+$/);
    expect(barLabel).not.toContain(' of ');
  });

  test('offers a downloadable print PDF with the translated label, linking to the Croatian PDF', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/records-hr.pdf"]');
    await expect(link).toContainText('Preuzmi PDF za ispis');

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
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
    const copaSemis = page.locator(
      '#compare-panel tbody[data-slug="copa-america"] tr[data-metric="semifinals"]',
    );
    await expect(copaSemis.locator('.vs__value[data-side="a"]')).toHaveText('7');
  });

  test('the language switcher opens the Croatian compare page', async ({ page }) => {
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    // The page's own script appends ?a=/&b= on load (same as the English
    // page), so the URL isn't bare - just check the path prefix.
    await expect(page).toHaveURL(/\/hr\/compare(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF covering the default pair and the all-teams ranking', async ({
    page,
    request,
  }) => {
    const link = page.locator('a[download][href$="downloads/compare.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
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
    await expect(page.locator('#compare-panel .vs__group').getByText('UEFA Liga nacija')).toBeVisible();
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/football-reference\/compare(\?|$)/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('offers a downloadable print PDF with translated labels', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/compare-hr.pdf"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Preuzmi PDF za ispis/);

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
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

  test('includes a "which year did {player} win the Ballon d\'Or" question, answerable like any other card', async ({
    page,
  }) => {
    const yearCard = page
      .locator('.quiz-card')
      .filter({ hasText: /In which year did .+ win the Ballon d.Or\?/ })
      .first();
    await expect(yearCard).toBeVisible();

    const answerIndex = Number(await yearCard.getAttribute('data-answer-index'));
    await yearCard.locator('input[type="radio"]').nth(answerIndex).check();
    await yearCard.locator('.quiz-card__check').click();
    await expect(yearCard.locator('.quiz-card__feedback')).toHaveText('Correct!');
  });

  test('includes a "which year did {team} win {tournament}" question for a one-time champion', async ({
    page,
  }) => {
    const yearCard = page
      .locator('.quiz-card')
      .filter({
        hasText: /In which year did .+ win the (FIFA World Cup|UEFA EURO|Copa América|UEFA Nations League)\?/,
      })
      .first();
    await expect(yearCard).toBeVisible();

    const answerIndex = Number(await yearCard.getAttribute('data-answer-index'));
    await yearCard.locator('input[type="radio"]').nth(answerIndex).check();
    await yearCard.locator('.quiz-card__check').click();
    await expect(yearCard.locator('.quiz-card__feedback')).toHaveText('Correct!');
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

  test('champion order challenge: assigning the same rank twice disables "Check order" with a warning', async ({
    page,
  }) => {
    const firstOrderCard = page.locator('.quiz-card:has(.quiz-order__items)').first();
    const ranks = firstOrderCard.locator('.quiz-order__rank');
    const rankCount = await ranks.count();
    expect(rankCount).toBeGreaterThanOrEqual(2);
    const checkButton = firstOrderCard.locator('.quiz-order__check');
    const feedback = firstOrderCard.locator('.quiz-card__feedback');

    // Fill every select validly first, then collide the last two on the
    // same rank - reproduces a reader re-picking an already-used number.
    for (let i = 0; i < rankCount; i += 1) {
      await ranks.nth(i).selectOption(String(i + 1));
    }
    await expect(checkButton).toBeEnabled();
    await ranks.nth(rankCount - 1).selectOption('1');

    await expect(checkButton).toBeDisabled();
    await expect(feedback).toHaveText(
      'Each rank can only be used once - two items currently share a number.',
    );

    // Resolving the collision re-enables the button and clears the warning.
    await ranks.nth(rankCount - 1).selectOption(String(rankCount));
    await expect(checkButton).toBeEnabled();
    await expect(feedback).toHaveText('');
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
    await openMenu(page);
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
    await expect(
      page.getByText('In which year did a given team win a tournament, or a given Ballon d\'Or'),
    ).toBeVisible();
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

  test('includes a "koje je godine ... osvojio Zlatnu loptu" question, answerable like any other card', async ({
    page,
  }) => {
    const yearCard = page
      .locator('.quiz-card')
      .filter({ hasText: /Koje je godine .+ osvojio nagradu Zlatna lopta\?/ })
      .first();
    await expect(yearCard).toBeVisible();

    const answerIndex = Number(await yearCard.getAttribute('data-answer-index'));
    await yearCard.locator('input[type="radio"]').nth(answerIndex).check();
    await yearCard.locator('.quiz-card__check').click();
    await expect(yearCard.locator('.quiz-card__feedback')).toHaveText('Točno!');
  });

  test('includes a "koje je godine ... osvojio natjecanje" question for a one-time team champion', async ({
    page,
  }) => {
    const yearCard = page
      .locator('.quiz-card')
      .filter({ hasText: /Koje je godine .+ osvojio natjecanje .+\?/ })
      .first();
    await expect(yearCard).toBeVisible();

    const answerIndex = Number(await yearCard.getAttribute('data-answer-index'));
    await yearCard.locator('input[type="radio"]').nth(answerIndex).check();
    await yearCard.locator('.quiz-card__check').click();
    await expect(yearCard.locator('.quiz-card__feedback')).toHaveText('Točno!');
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

  test('champion order challenge: duplicate ranks show the Croatian warning', async ({ page }) => {
    const firstOrderCard = page.locator('.quiz-card:has(.quiz-order__items)').first();
    const ranks = firstOrderCard.locator('.quiz-order__rank');
    const rankCount = await ranks.count();
    expect(rankCount).toBeGreaterThanOrEqual(2);
    const checkButton = firstOrderCard.locator('.quiz-order__check');

    for (let i = 0; i < rankCount; i += 1) {
      await ranks.nth(i).selectOption(String(i + 1));
    }
    await ranks.nth(rankCount - 1).selectOption('1');

    await expect(checkButton).toBeDisabled();
    await expect(firstOrderCard.locator('.quiz-card__feedback')).toHaveText(
      'Svaki broj poretka smije se koristiti samo jednom - dvije stavke trenutačno dijele isti broj.',
    );
  });

  test('the language switcher returns to the English quiz page', async ({ page }) => {
    await openMenu(page);
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
    await expect(
      page.getByText('Koje je godine dana reprezentacija osvojila natjecanje'),
    ).toBeVisible();
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
    await openMenu(page);
    await expect(page.locator('a[href$="/about/sources"]').first()).toBeVisible();
  });

  test('the language switcher opens the Croatian sources page', async ({ page }) => {
    await openMenu(page);
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
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/about\/sources$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Glossary page on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('glossary');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('lists a.e.t. and pens with their plain-English explanations', async ({ page }) => {
    const aetEntry = page.locator('.glossary-page__entry', { hasText: 'a.e.t.' });
    await expect(aetEntry.locator('dt')).toHaveText('a.e.t.');
    await expect(aetEntry.locator('dd')).toContainText('after extra time');

    const pensEntry = page.locator('.glossary-page__entry', { hasText: 'pens' });
    await expect(pensEntry.locator('dt')).toHaveText('pens');
    await expect(pensEntry.locator('dd')).toContainText('penalty shoot-out');
  });

  test('is reachable from the nav', async ({ page }) => {
    await page.goto('');
    await openMenu(page);
    await expect(page.locator('nav a[href$="/glossary"]').first()).toBeVisible();
  });

  test('the language switcher opens the Croatian glossary page', async ({ page }) => {
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/hr\/glossary$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
  });

  test('offers a downloadable print PDF of the glossary', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/glossary.pdf"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Croatian glossary page (/hr/glossary) on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hr/glossary');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('renders translated chrome with the same glossary terms as English', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(page.getByRole('heading', { name: 'Pojmovnik', level: 1 })).toBeVisible();
    const aetEntry = page.locator('.glossary-page__entry', { hasText: 'a.e.t.' });
    await expect(aetEntry.locator('dt')).toHaveText('a.e.t.');
  });

  test('the language switcher returns to the English glossary page', async ({ page }) => {
    await openMenu(page);
    await page.locator('a.lang-switch').click();
    await expect(page).toHaveURL(/\/glossary$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('offers a downloadable print PDF with translated labels', async ({ page, request }) => {
    const link = page.locator('a[download][href$="downloads/glossary-hr.pdf"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Preuzmi PDF za ispis/);

    const href = await link.getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('pdf');
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
    expect(hrefs.length).toBe(30); // 15 nav pages x 2 languages
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
    await openMenu(page);
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
    await openMenu(page);
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
      `${SITE}/og-image.png`,
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200',
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630',
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      `${SITE}/og-image.png`,
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

    // 15 nav pages x 2 languages (the index loop, now including /teams,
    // /players, /compare-players and /glossary), plus 40 team profile pages
    // x 2 languages (src/pages/teams/[slug].astro and its Croatian sibling),
    // 98 player profile pages x 2 languages (src/pages/players/[slug].astro
    // and its Croatian sibling), 23 FIFA World Cup edition pages x 2
    // languages (src/pages/competitions/world-cup/[year].astro and its
    // Croatian sibling), 48 Copa América edition pages x 2 languages
    // (src/pages/competitions/copa-america/[year].astro and its Croatian
    // sibling - the two 1959 tournaments each get their own host-
    // disambiguated slug, see src/lib/editionProfile.ts), 17 UEFA EURO
    // edition pages x 2 languages (src/pages/competitions/euro/[year].astro
    // and its Croatian sibling), 4 UEFA Nations League Finals edition pages
    // x 2 languages (src/pages/competitions/nations-league/[year].astro and
    // its Croatian sibling), and 70 Men's Ballon d'Or edition pages x 2
    // languages (src/pages/competitions/ballon-dor/[year].astro and its
    // Croatian sibling - the first individual-award edition pages, see
    // `individualAward` in src/lib/editionProfile.ts; the 2020 "Not awarded"
    // row still gets its own page), each pair carrying reciprocal hreflang
    // alternates - /glossary is a fully bilingual NAV_LINKS entry from launch
    // (see docs/PROJECT_STATUS.md's Glossary entry), so it flows through the
    // main loop like every other top-level page.
    expect(body.match(/<url>/g)?.length).toBe(710);
    expect(body).toContain(`<loc>${SITE}/glossary/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/glossary/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/glossary/"`);
    expect(body).toContain(`<loc>${SITE}/compare-players/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/compare-players/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/compare-players/"`);
    expect(body).toContain(`<loc>${SITE}/competitions/world-cup/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/world-cup/</loc>`);
    expect(body).toContain(
      `hreflang="hr" href="${SITE}/hr/competitions/world-cup/"`,
    );
    expect(body).toContain(`<loc>${SITE}/competitions/world-cup/2018/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/world-cup/2018/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/competitions/world-cup/2018/"`);
    expect(body).toContain(`<loc>${SITE}/competitions/euro/2016/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/euro/2016/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/competitions/euro/2016/"`);
    expect(body).toContain(`<loc>${SITE}/competitions/nations-league/2022-23/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/nations-league/2022-23/</loc>`);
    expect(body).toContain(
      `hreflang="hr" href="${SITE}/hr/competitions/nations-league/2022-23/"`,
    );
    expect(body).toContain(`<loc>${SITE}/competitions/ballon-dor/2018/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/ballon-dor/2018/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/competitions/ballon-dor/2018/"`);
    expect(body).toContain(`<loc>${SITE}/teams/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/teams/</loc>`);
    expect(body).toContain(`<loc>${SITE}/teams/brazil/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/teams/brazil/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/teams/brazil/"`);
    expect(body).toContain(`<loc>${SITE}/players/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/players/</loc>`);
    expect(body).toContain(`<loc>${SITE}/players/gerd-muller/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/players/gerd-muller/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/players/gerd-muller/"`);
    expect(body).toContain(`<loc>${SITE}/competitions/golden-boot/world-cup/1958/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/golden-boot/world-cup/1958/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/competitions/golden-boot/world-cup/1958/"`);
    expect(body).toContain(`<loc>${SITE}/competitions/golden-boot/euro/1996/</loc>`);
    expect(body).toContain(`<loc>${SITE}/hr/competitions/golden-boot/euro/1996/</loc>`);
    expect(body).toContain(`hreflang="hr" href="${SITE}/hr/competitions/golden-boot/euro/1996/"`);
    expect(body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });

  async function jsonLdBlocks(page: import('@playwright/test').Page) {
    const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
    return raw.map((text) => JSON.parse(text));
  }

  test('the home page carries a WebSite block instead of a breadcrumb (it has no parent page)', async ({
    page,
  }) => {
    // '' (not '/'), matching every other home-page test in this file: a
    // leading slash resolves against the baseURL's *origin*, landing on the
    // server root rather than the /football-reference/ base path, which the
    // previous version of this test got away with only because "0 JSON-LD
    // blocks" was also vacuously true on that 404 page.
    await page.goto('');
    const blocks = await jsonLdBlocks(page);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'The Ultimate Football Reference',
      url: `${SITE}/`,
      description:
        'A family-friendly guide to the history of major international football competitions and awards.',
      inLanguage: 'en',
    });
  });

  test('the Croatian home page carries its own translated WebSite block', async ({ page }) => {
    await page.goto('hr/');
    const blocks = await jsonLdBlocks(page);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      '@type': 'WebSite',
      url: `${SITE}/hr/`,
      inLanguage: 'hr',
    });
    expect((blocks[0] as { description: string }).description).toContain('Nogometna povijest');
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

    const collectionPage = blocks.find((b) => b['@type'] === 'CollectionPage');
    expect(collectionPage.name).toBe('FIFA World Cup - Champions by titles');
    expect(collectionPage.url).toBe(`${SITE}/competitions/world-cup/`);
    const itemList = collectionPage.mainEntity;
    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.itemListElement[0].item.name).toBe('Brazil');

    const sportsEvent = blocks.find((b) => b['@type'] === 'SportsEvent');
    expect(sportsEvent.name).toBe('2026 FIFA World Cup');
    expect(sportsEvent.location).toEqual({ '@type': 'Place', name: 'Canada, Mexico and United States' });
    expect(sportsEvent.competitor).toEqual({ '@type': 'SportsTeam', name: 'Spain' });
  });

  test('an individual award page carries an ItemList and a SportsEvent for the latest edition', async ({
    page,
  }) => {
    await page.goto('competitions/ballon-dor');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'CollectionPage', 'SportsEvent']);
    expect(blocks.find((b) => b['@type'] === 'CollectionPage').name).toContain('Most awards');

    const sportsEvent = blocks.find((b) => b['@type'] === 'SportsEvent');
    expect(sportsEvent.name).toBe("2025 Men's Ballon d'Or");
    expect(sportsEvent.location).toBeUndefined();
    expect(sportsEvent.competitor).toEqual({ '@type': 'SportsTeam', name: 'Ousmane Dembélé' });
  });

  test('the Golden Boot page carries one ItemList and one SportsEvent per table', async ({ page }) => {
    await page.goto('competitions/golden-boot');
    const blocks = await jsonLdBlocks(page);
    const collectionPage = blocks.find((b) => b['@type'] === 'CollectionPage');
    const lists: { name: string }[] = collectionPage.mainEntity;
    expect(lists).toHaveLength(2);
    expect(lists.map((l) => l.name)).toEqual([
      'Most World Cup Golden Boots',
      'Most EURO top-scorer awards',
    ]);

    const sportsEvents = blocks.filter((b) => b['@type'] === 'SportsEvent');
    expect(sportsEvents).toHaveLength(2);
    expect(sportsEvents.map((e) => e.name)).toEqual([
      '2026 FIFA World Cup Golden Boot',
      '2024 UEFA EURO Golden Boot',
    ]);
    expect(sportsEvents[0].competitor).toEqual({ '@type': 'SportsTeam', name: 'Kylian Mbappé' });
  });

  test('a translated competition page carries its own Croatian BreadcrumbList/ItemList names', async ({
    page,
  }) => {
    await page.goto('hr/competitions/world-cup');
    const blocks = await jsonLdBlocks(page);
    const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement[0].name).toBe('Početna');
    expect(breadcrumb.itemListElement[1].name).toBe('FIFA Svjetsko prvenstvo');
    expect(blocks.find((b) => b['@type'] === 'CollectionPage').name).toBe(
      'FIFA Svjetsko prvenstvo - prvaci po broju naslova',
    );
  });

  test('/records carries a BreadcrumbList plus one ItemList per ranking section, skipping zero-streak fallbacks', async ({
    page,
  }) => {
    await page.goto('records');
    const blocks = await jsonLdBlocks(page);
    expect(blocks).toHaveLength(40);
    expect(blocks.filter((b) => b['@type'] === 'BreadcrumbList')).toHaveLength(1);

    const lists = blocks.filter((b) => b['@type'] === 'ItemList');
    expect(lists).toHaveLength(39);
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Most successful teams');
    expect(lists.map((l) => l.name)).toContain('Copa América - Most frequent hosts');
    expect(lists.map((l) => l.name)).toContain('Golden Boot (World Cup) - Back-to-back champions');
    expect(lists.map((l) => l.name)).toContain('Golden Boot (EURO) - Most awards');
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Nearly champions');
    expect(lists.map((l) => l.name)).toContain('UEFA Nations League - Nearly champions');
    // "Nearly finalists" (semifinal but never a final) is populated for all
    // four team competitions today - every one of them has at least one team
    // stuck at that tier, so there's no empty-ranking fallback to skip here.
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Nearly finalists');
    expect(lists.map((l) => l.name)).toContain('Copa América - Nearly finalists');
    // Same scope restriction as "Nearly champions" - individual awards have
    // no Third/Fourth/semifinalist column to begin with.
    expect(lists.map((l) => l.name)).not.toContain("Ballon d'Or - Nearly finalists");
    // "Titles won on home soil" only covers the four team competitions - same
    // scope as "Nearly champions" - and every one of them has at least one
    // real home-soil title today, so there's no empty-ranking fallback case
    // to skip.
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Titles won on home soil');
    expect(lists.map((l) => l.name)).toContain('Copa América - Titles won on home soil');
    expect(lists.map((l) => l.name)).not.toContain("Ballon d'Or - Titles won on home soil");
    // Nations League (4 different champions so far) and the EURO Golden Boot
    // have no back-to-back streak, so records.astro renders a text fallback
    // instead of a ranking for them - no ItemList should exist for either.
    expect(lists.map((l) => l.name)).not.toContain('UEFA Nations League - Back-to-back champions');
    expect(lists.map((l) => l.name)).not.toContain('Golden Boot (EURO) - Back-to-back champions');
    // "Nearly champions" only covers the four team competitions - Ballon
    // d'Or and Golden Boot recognize a player, not a team, and have no
    // Runner-up column to begin with.
    expect(lists.map((l) => l.name)).not.toContain("Ballon d'Or - Nearly champions");
    // "Longest wait between titles" covers all seven loaded tables (unlike
    // "Nearly champions", it applies to individual awards too) and every one
    // of them today has at least one repeat title holder, so there's no
    // zero-gap fallback case to skip.
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Longest wait between titles');
    expect(lists.map((l) => l.name)).toContain('UEFA Nations League - Longest wait between titles');
    expect(lists.map((l) => l.name)).toContain("Ballon d'Or - Longest wait between titles");
    expect(lists.map((l) => l.name)).toContain('Golden Boot (World Cup) - Longest wait between titles');
    // "Biggest final wins" only covers the three team competitions whose
    // table has a "Final" score column - Copa América has none (see
    // buildTimeline's own doc comment), so it must not appear here.
    expect(lists.map((l) => l.name)).toContain('FIFA World Cup - Biggest final wins');
    expect(lists.map((l) => l.name)).toContain('UEFA EURO - Biggest final wins');
    expect(lists.map((l) => l.name)).toContain('UEFA Nations League - Biggest final wins');
    expect(lists.map((l) => l.name)).not.toContain('Copa América - Biggest final wins');

    // "Fiercest rivalries" (added 2026-08-20) is populated today - Argentina
    // and Uruguay alone have met 15+ times - so there's no empty-ranking
    // fallback case live to exercise.
    const rivalries = lists.find((l) => l.name === 'Fiercest rivalries');
    expect(rivalries).toBeDefined();
    expect(rivalries.itemListElement[0].item.name).toContain('Argentina');
    expect(rivalries.itemListElement[0].item.name).toContain('Uruguay');
    expect(rivalries.itemListElement[0].item.description).toMatch(/^\d+ meetings? \(/);
  });

  test('/hr/records carries its own Croatian ItemList names for every ranking section', async ({
    page,
  }) => {
    await page.goto('hr/records');
    const blocks = await jsonLdBlocks(page);
    const lists = blocks.filter((b) => b['@type'] === 'ItemList');
    expect(lists).toHaveLength(39);
    expect(lists.map((l) => l.name)).toContain('FIFA Svjetsko prvenstvo - najuspješnije reprezentacije');
    expect(lists.map((l) => l.name)).toContain('Zlatna lopta - uzastopni prvaci');
    expect(lists.map((l) => l.name)).not.toContain('UEFA Liga nacija - uzastopni prvaci');
    expect(lists.map((l) => l.name)).toContain('FIFA Svjetsko prvenstvo - vječiti drugoplasirani');
    expect(lists.map((l) => l.name)).toContain('FIFA Svjetsko prvenstvo - vječiti polufinalisti');
    expect(lists.map((l) => l.name)).toContain('FIFA Svjetsko prvenstvo - najduže čekanje na novi naslov');
    expect(lists.map((l) => l.name)).toContain('Copa América - naslovi osvojeni na domaćem terenu');
    expect(lists.map((l) => l.name)).not.toContain("Zlatna lopta - naslovi osvojeni na domaćem terenu");
    expect(lists.map((l) => l.name)).toContain('FIFA Svjetsko prvenstvo - najveće pobjede u finalu');
    expect(lists.map((l) => l.name)).not.toContain('Copa América - najveće pobjede u finalu');

    const rivalries = lists.find((l) => l.name === 'Najveći rivaliteti');
    expect(rivalries).toBeDefined();
    expect(rivalries.itemListElement[0].item.description).toMatch(/^\d+ susreta \(/);
  });

  test('/compare carries a BreadcrumbList and one ItemList ranking every national team by combined record', async ({
    page,
  }) => {
    await page.goto('compare');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList']);

    const rowCount = await page.locator('.compare__table--all tbody tr').count();
    const itemList = blocks.find((b) => b['@type'] === 'ItemList');
    expect(itemList.name).toBe(
      'All national teams - combined World Cup, EURO, Copa América and Nations League record',
    );
    expect(itemList.itemListElement).toHaveLength(rowCount);
    expect(itemList.itemListElement[0].item.description).toContain('across the World Cup, EURO, Copa América and Nations League');
  });

  test('/hr/compare carries its own Croatian ItemList name and description', async ({ page }) => {
    await page.goto('hr/compare');
    const blocks = await jsonLdBlocks(page);
    const itemList = blocks.find((b) => b['@type'] === 'ItemList');
    expect(itemList.name).toBe(
      'Sve reprezentacije - ukupan učinak na Svjetskom prvenstvu, EURU, Copa Américi i Ligi nacija',
    );
    expect(itemList.itemListElement[0].item.description).toContain('naslova');
  });

  test('/teams carries a BreadcrumbList and an ItemList of every national team, distinct from /compare\'s', async ({
    page,
  }) => {
    await page.goto('teams');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'CollectionPage']);

    const teamCount = await page.locator('.teams__grid .teams__link').count();
    const collectionPage = blocks.find((b) => b['@type'] === 'CollectionPage');
    expect(collectionPage.name).toBe(
      'National teams directory - combined World Cup, EURO, Copa América and Nations League record',
    );
    const itemList = collectionPage.mainEntity;
    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.itemListElement).toHaveLength(teamCount);
    expect(itemList.itemListElement.some((item: { item: { name: string } }) => item.item.name === 'Brazil')).toBe(
      true,
    );
  });

  test('/hr/teams carries its own Croatian ItemList name and description', async ({ page }) => {
    await page.goto('hr/teams');
    const blocks = await jsonLdBlocks(page);
    const collectionPage = blocks.find((b) => b['@type'] === 'CollectionPage');
    expect(collectionPage.name).toBe(
      'Popis reprezentacija - ukupan učinak na Svjetskom prvenstvu, EURU, Copa Américi i Ligi nacija',
    );
    expect(collectionPage.mainEntity.itemListElement[0].item.description).toContain('naslova');
  });

  test('/teams/brazil carries a BreadcrumbList, an ItemList of its competition appearances (one Thing per competition), and a SportsTeam entity block', async ({
    page,
  }) => {
    await page.goto('teams/brazil');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList', 'SportsTeam']);

    // The SportsTeam block only lists Brazil's actual World Cup/Copa América
    // title wins, not the runner-up/semifinal results the ItemList above
    // also lists - see buildTeamSportsTeamJsonLd's own "Champion-only" rule.
    const sportsTeam = blocks.find((b) => b['@type'] === 'SportsTeam');
    expect(sportsTeam.name).toBe('Brazil');
    expect(sportsTeam.award).toContain('FIFA World Cup 1958');
    expect(sportsTeam.award).toContain('FIFA World Cup 2002');

    // A profile page is nested under its directory, so the breadcrumb is
    // three levels deep (Home > Teams > Brazil) rather than the flat "Home >
    // page" every other non-home page gets - see BaseLayout.astro's
    // `breadcrumbTrail` prop.
    const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual([
      'Home',
      'Teams',
      'Brazil - Full history',
    ]);
    expect(breadcrumb.itemListElement[1].item).toMatch(/\/teams\/$/);

    const itemList = blocks.find((b) => b['@type'] === 'ItemList');
    expect(itemList.name).toBe('Brazil - competition appearances');
    // Brazil has appeared in a tracked FIFA World Cup and Copa América final
    // or semifinal, but never a EURO or Nations League one (national-team
    // eligibility) - exactly two Things, matching the two <section> cards
    // the page itself renders.
    const sectionCount = await page.locator('.team-profile section.card.stack').count();
    expect(itemList.itemListElement).toHaveLength(sectionCount);
    const names = itemList.itemListElement.map((item: { item: { name: string } }) => item.item.name);
    expect(names).toContain('FIFA World Cup');
    expect(names).toContain('Copa América');
    // The description reuses the exact role/year pairs the page's own <ol>
    // renders (e.g. "Champion (1958)"), not an invented summary count.
    const worldCupItem = itemList.itemListElement.find(
      (item: { item: { name: string } }) => item.item.name === 'FIFA World Cup',
    );
    expect(worldCupItem.item.description).toContain('Champion (1958)');
    expect(worldCupItem.item.description).toContain('Champion (2002)');
  });

  test('/hr/teams/brazil carries its own Croatian ItemList name, same appearance descriptions as the English page', async ({
    page,
  }) => {
    await page.goto('teams/brazil');
    const englishItemList = (await jsonLdBlocks(page)).find((b) => b['@type'] === 'ItemList');

    await page.goto('hr/teams/brazil');
    const itemList = (await jsonLdBlocks(page)).find((b) => b['@type'] === 'ItemList');
    expect(itemList.name).toBe('Brazil - nastupi u natjecanjima');

    // Role/year labels are the same untranslated source column labels the
    // page's own <ol> already renders on both languages (see the Croatian
    // page's own top-of-file note) - so beyond the ItemList's own `name`,
    // every per-competition description should match the English page's
    // exactly, not a re-translated wording.
    expect(itemList.itemListElement.map((i: { item: { description: string } }) => i.item.description)).toEqual(
      englishItemList.itemListElement.map((i: { item: { description: string } }) => i.item.description),
    );
  });

  test('/players/lionel-messi carries a three-level BreadcrumbList (Home > Players > page), same nesting as /teams/<slug>', async ({
    page,
  }) => {
    await page.goto('players/lionel-messi');
    const breadcrumb = (await jsonLdBlocks(page)).find((b) => b['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual([
      'Home',
      'Players',
      'Lionel Messi - Full award history',
    ]);
    expect(breadcrumb.itemListElement[1].item).toMatch(/\/players\/$/);
  });

  test('/players/lionel-messi also carries a Person entity block listing every Ballon d\'Or year he actually won', async ({
    page,
  }) => {
    await page.goto('players/lionel-messi');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList', 'Person']);

    const person = blocks.find((b) => b['@type'] === 'Person');
    expect(person.name).toBe('Lionel Messi');
    // Messi has won the Ballon d'Or a record eight times.
    const ballonDorAwards = (person.award as string[]).filter((a) => a.startsWith("Ballon d'Or"));
    expect(ballonDorAwards).toHaveLength(8);
  });

  test('/hr/players/lionel-messi carries its own Croatian three-level BreadcrumbList', async ({ page }) => {
    await page.goto('hr/players/lionel-messi');
    const breadcrumb = (await jsonLdBlocks(page)).find((b) => b['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual([
      'Početna',
      'Igrači',
      'Lionel Messi - cjelovita povijest nagrada',
    ]);
    expect(breadcrumb.itemListElement[1].item).toMatch(/\/hr\/players\/$/);
  });

  test('/teams/brazil renders a visible breadcrumb nav matching its BreadcrumbList, distinct from the primary nav', async ({
    page,
  }) => {
    await page.goto('teams/brazil');
    const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav).toBeVisible();
    const items = nav.locator('li');
    await expect(items).toHaveCount(3);
    await expect(items.nth(2)).toHaveAttribute('aria-current', 'page');
    await expect(items.nth(2)).toHaveText('Brazil - Full history');

    const teamsLink = nav.getByRole('link', { name: 'Teams' });
    await expect(teamsLink).toHaveAttribute('href', /\/teams\/?$/);
    await teamsLink.click();
    await expect(page).toHaveURL(/\/teams\/?$/);
  });

  test('/hr/teams/brazil renders the same breadcrumb nav with Croatian labels', async ({ page }) => {
    await page.goto('hr/teams/brazil');
    const nav = page.getByRole('navigation', { name: 'Navigacijski put' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Početna' })).toHaveAttribute('href', /\/hr\/$/);
    await expect(nav.getByRole('link', { name: 'Reprezentacije' })).toHaveAttribute(
      'href',
      /\/hr\/teams\/?$/,
    );
    await expect(nav.locator('li').nth(2)).toHaveText('Brazil - cjelovita povijest');
  });

  test('a flat page like /records gets a two-item "Home > page" breadcrumb, and the home page gets none', async ({
    page,
  }) => {
    await page.goto('records');
    const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav.locator('li')).toHaveCount(2);
    await expect(nav.locator('li').nth(1)).toHaveText('Records and Timelines');
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', /\/football-reference\/$/);

    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
  });

  test('/teams/germany omits an ItemList entry for a competition it has never reached a tracked final or semifinal in', async ({
    page,
  }) => {
    // Germany/West Germany has no tracked Copa América appearance (a
    // European team never enters it) - confirms the ItemList only lists
    // competitions the team actually appears in, matching the page's own
    // "only includes competitions the team actually appears in" behavior
    // (tests/unit/teamProfile.test.ts covers the same rule at the data layer).
    await page.goto('teams/germany');
    const blocks = await jsonLdBlocks(page);
    const itemList = blocks.find((b) => b['@type'] === 'ItemList');
    const names = itemList.itemListElement.map((item: { item: { name: string } }) => item.item.name);
    expect(names).toContain('FIFA World Cup');
    expect(names).not.toContain('Copa América');
  });

  test('/quiz carries a BreadcrumbList and a Quiz with one Question per rendered multiple-choice card', async ({
    page,
  }) => {
    await page.goto('quiz');
    const blocks = await jsonLdBlocks(page);
    expect(blocks.map((b) => b['@type']).sort()).toEqual(['BreadcrumbList', 'Quiz']);

    // .quiz-card is shared by QuizCard.astro (multiple-choice) and
    // QuizOrderCard.astro (chronological-order) - scope to the top-level
    // <ol class="quiz__list"> only, since the order-question one is nested
    // one level deeper inside .quiz__order-section.
    const cardCount = await page.locator('.quiz > ol.quiz__list > li .quiz-card').count();
    const quiz = blocks.find((b) => b['@type'] === 'Quiz');
    expect(quiz.name).toBe('The Ultimate Football Reference - Family Quiz');
    expect(quiz.hasPart).toHaveLength(cardCount);
    for (const question of quiz.hasPart) {
      expect(question['@type']).toBe('Question');
      expect(question.acceptedAnswer['@type']).toBe('Answer');
      expect(question.acceptedAnswer.text.length).toBeGreaterThan(0);
    }
  });

  test('/hr/quiz carries its own Croatian Quiz name over the Croatian-language question pool', async ({
    page,
  }) => {
    await page.goto('hr/quiz');
    const blocks = await jsonLdBlocks(page);
    const quiz = blocks.find((b) => b['@type'] === 'Quiz');
    expect(quiz.name).toBe('Kompletna nogometna referenca - obiteljski kviz');
    const cardCount = await page.locator('.quiz > ol.quiz__list > li .quiz-card').count();
    expect(quiz.hasPart).toHaveLength(cardCount);
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
    await openMenu(page);
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

// The header's mobile drawer (Nav.astro). At this 360px viewport the eleven
// nav links plus both search widgets, the language switch and the theme
// toggle used to wrap into a five-row header that ate most of the first
// screen; they now live behind one menu button. These cover the disclosure
// behaviour itself - the rest of the suite only opens the drawer to reach a
// control inside it (tests/e2e/menu.ts).
test.describe('header menu on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
  });

  test('the header collapses to a brand and one menu button', async ({ page }) => {
    const toggle = page.locator('#menu-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#site-menu')).toBeHidden();
    await expect(page.locator('.nav-list a', { hasText: 'World Cup' }).first()).toBeHidden();

    // The whole collapsed header fits in a fraction of the first screen -
    // the point of the drawer. It used to run to roughly half of it.
    const height = await page.locator('.site-header').evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeLessThan(80);
  });

  test('the button opens the drawer with every nav destination in it', async ({ page }) => {
    await page.locator('#menu-toggle').click();

    await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#site-menu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('.nav-list a')).toHaveCount(NAV_LINKS.length);
    await expect(menu.locator('#team-search-input')).toBeVisible();
    await expect(menu.locator('#player-search-input')).toBeVisible();
    await expect(menu.locator('a.lang-switch')).toBeVisible();
    await expect(menu.locator('#theme-toggle')).toBeVisible();
  });

  test('every drawer control is at least a 44px tap target', async ({ page }) => {
    await page.locator('#menu-toggle').click();

    const heights = await page
      .locator('#site-menu .nav-list a, #site-menu .team-search__field, #site-menu a.lang-switch, #site-menu #theme-toggle')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThan(0);
    for (const height of heights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });

  test('a nav link inside the drawer navigates', async ({ page }) => {
    await page.locator('#menu-toggle').click();
    await page.locator('#site-menu .nav-list a', { hasText: 'Glossary' }).click();
    await expect(page).toHaveURL(/\/glossary\/?$/);
  });

  test('Escape closes the drawer and returns focus to the button', async ({ page }) => {
    const toggle = page.locator('#menu-toggle');
    await toggle.click();
    await expect(page.locator('#site-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#site-menu')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('a click outside closes the drawer', async ({ page }) => {
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#site-menu')).toBeVisible();

    // Just below the open drawer, which covers most of this 740px screen.
    const box = (await page.locator('#site-menu').boundingBox())!;
    expect(box.y + box.height + 12).toBeLessThan(740);
    await page.mouse.click(180, box.y + box.height + 12);
    await expect(page.locator('#site-menu')).toBeHidden();
  });

  test('the open drawer adds no horizontal overflow', async ({ page }) => {
    await page.locator('#menu-toggle').click();
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('--site-header-height stays the collapsed bar height while the drawer is open', async ({
    page,
  }) => {
    const read = () =>
      page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')),
      );
    const closed = await read();
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#site-menu')).toBeVisible();
    expect(await read()).toBeCloseTo(closed, 0);
  });

  test('Tab from the last drawer control wraps to the menu button', async ({ page }) => {
    const toggle = page.locator('#menu-toggle');
    await toggle.click();
    await expect(page.locator('#site-menu')).toBeVisible();

    const themeToggle = page.locator('#theme-toggle');
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
  });

  test('Shift+Tab from the menu button wraps to the last drawer control', async ({ page }) => {
    const toggle = page.locator('#menu-toggle');
    await toggle.click();
    await expect(page.locator('#site-menu')).toBeVisible();
    await expect(toggle).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#theme-toggle')).toBeFocused();
  });

  test('Tab never leaves the drawer while it is open', async ({ page }) => {
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#site-menu')).toBeVisible();

    // Home has a language switch, so the drawer's tab sequence is: toggle
    // (1), every nav link (NAV_LINKS.length), both search inputs (2), the
    // lang switch (1), the theme toggle (1). Starting focus is already on
    // the toggle (the first stop), so pressing Tab exactly that many times
    // must wrap all the way back around to it, proving nothing outside the
    // trap - the footer, the brand link - ever receives focus while it is
    // open.
    const stops = 1 + NAV_LINKS.length + 2 + 1 + 1;
    for (let i = 0; i < stops; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.locator('#menu-toggle')).toBeFocused();
    await expect(page.locator('#site-menu')).toBeVisible();
  });

  test('the Croatian header labels the menu in Croatian', async ({ page }) => {
    await page.goto('hr/');
    const toggle = page.locator('#menu-toggle');
    await expect(toggle).toHaveText('Izbornik');
    await expect(toggle).toHaveAttribute('aria-label', 'Otvori izbornik');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Zatvori izbornik');
  });
});

// The suite's one Playwright project runs at 360px (playwright.config.ts),
// where the whole nav lives in the drawer above - so the header's own
// >=60rem row layout (Nav.astro) had no coverage at all until this block,
// which is exactly how it wrapped onto two rows unnoticed for two prior
// intensive runs. 1280px is comfortably past 60rem (~960px at the default
// 16px root) so this exercises the real desktop layout, not just the 360px
// requirement from the brief.
//
// Scope check done while writing these tests: the header's own .container
// is capped at --maxw (68rem), so even a much wider viewport never gives
// the row more usable space than roughly 1024px of content width after
// padding - not enough to also fit both search widgets, the language
// switch and the theme toggle on the same line as the nav links, grouped
// or not. The standing note this closes named the fifteen *nav links*
// specifically ("wraps its fifteen nav links onto two rows"), not the
// whole header, so that's the one row this menu makes true; the header as
// a whole can still be two lines (nav row, then the search/lang/theme
// row), which was already the case before this change and isn't a
// regression it introduces.
test.describe('desktop nav "More" menu (>=60rem)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('');
  });

  test('collapses the secondary links so the nav-links row itself is one line, with no page overflow', async ({
    page,
  }) => {
    const toggle = page.locator('#nav-more-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-more-menu')).toBeHidden();
    // The mobile drawer's own toggle is gone at this width.
    await expect(page.locator('#menu-toggle')).toBeHidden();

    // Every visible top-level nav item (Home, the six competitions/awards,
    // and the More toggle) shares one row - the actual fix, see the
    // describe block's own comment for why this checks the nav row rather
    // than the whole header.
    const tops = await page
      .locator('#nav-list > li')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);

    // The six competition/award pages plus Home stay inline...
    await expect(page.locator('#nav-list > li > a', { hasText: 'World Cup' })).toBeVisible();
    // ...while a "tool" page moved out of the row into the (closed) menu.
    await expect(page.locator('#nav-list > li > a', { hasText: 'Records' })).toHaveCount(0);

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the button opens the menu with every secondary nav destination in it', async ({ page }) => {
    const toggle = page.locator('#nav-more-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#nav-more-menu');
    await expect(menu).toBeVisible();
    const links = ['Records', 'Compare', 'Teams', 'Players', 'Compare Players', 'Quiz', 'Glossary', 'Sources'];
    await expect(menu.getByRole('link')).toHaveCount(links.length);
    for (const name of links) {
      await expect(menu.getByRole('link', { name, exact: true })).toBeVisible();
    }
  });

  test('a link inside the menu navigates', async ({ page }) => {
    await page.locator('#nav-more-toggle').click();
    await page.locator('#nav-more-menu a', { hasText: 'Glossary' }).click();
    await expect(page).toHaveURL(/\/glossary\/?$/);
  });

  test('Escape closes the menu and returns focus to the button', async ({ page }) => {
    const toggle = page.locator('#nav-more-toggle');
    await toggle.click();
    await expect(page.locator('#nav-more-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-more-menu')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('a click outside closes the menu', async ({ page }) => {
    await page.locator('#nav-more-toggle').click();
    await expect(page.locator('#nav-more-menu')).toBeVisible();

    await page.locator('footer .muted').first().click();
    await expect(page.locator('#nav-more-menu')).toBeHidden();
  });

  test('the current secondary page is marked current inside the menu', async ({ page }) => {
    await page.goto('records');
    await page.locator('#nav-more-toggle').click();
    await expect(page.locator('#nav-more-menu a[aria-current="page"]')).toHaveText('Records');
  });

  test('the Croatian header groups the same links, translated', async ({ page }) => {
    await page.goto('hr/');
    const toggle = page.locator('#nav-more-toggle');
    await expect(toggle).toHaveText('Više');
    await toggle.click();
    await expect(page.locator('#nav-more-menu a', { hasText: 'Rekordi' })).toBeVisible();
  });
});

// The head-to-head panel on /compare is a "versus" table: one row per
// statistic with both teams' values on it. It replaced two separate per-team
// tables, each wider than a 360px screen and stacked vertically, which meant
// the two numbers a reader wants to compare were never on screen together.
test.describe('compare panel on a 360px phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('compare?a=argentina&b=uruguay');
  });

  test('puts both teams\' values for one statistic on one visible row', async ({ page }) => {
    const row = page.locator('#compare-panel tbody[data-slug="world-cup"] tr[data-metric="titles"]');
    const a = row.locator('.vs__value[data-side="a"]');
    const b = row.locator('.vs__value[data-side="b"]');
    await expect(a).toHaveText('3');
    await expect(b).toHaveText('2');

    // The actual fix: both numbers share one row, so they are on screen at
    // the same time and within the viewport's width.
    const boxA = (await a.boundingBox())!;
    const boxB = (await b.boundingBox())!;
    expect(Math.abs(boxA.y - boxB.y)).toBeLessThan(2);
    expect(boxB.x + boxB.width).toBeLessThanOrEqual(360);
  });

  test('the panel never scrolls sideways', async ({ page }) => {
    const overflow = await page
      .locator('#compare-panel')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('marks the leading side, and the mark follows a swap', async ({ page }) => {
    const titles = page.locator('#compare-panel tbody[data-slug="world-cup"] tr[data-metric="titles"]');
    await expect(titles).toHaveAttribute('data-leader', 'a');
    // Uruguay leads on Copa América semifinal/4th finishes - the leader is
    // per row, not per team.
    await expect(
      page.locator('#compare-panel tbody[data-slug="copa-america"] tr[data-metric="semifinals"]'),
    ).toHaveAttribute('data-leader', 'b');

    await page.locator('#compare-swap').click();
    await expect(page.locator('#compare-a-name')).toHaveText('Uruguay');
    await expect(titles).toHaveAttribute('data-leader', 'b');
  });

  test('an equal statistic marks neither side', async ({ page }) => {
    await page.selectOption('#compare-a', { label: 'Argentina' });
    await page.selectOption('#compare-b', { label: 'Argentina' });
    await expect(
      page.locator('#compare-panel tbody[data-slug="world-cup"] tr[data-metric="titles"]'),
    ).toHaveAttribute('data-leader', 'tie');
  });

  test('a competition neither team has played collapses to one line', async ({ page }) => {
    const euro = page.locator('#compare-panel tbody[data-slug="euro"]');
    await expect(euro).toHaveAttribute('data-empty', 'true');
    await expect(euro.locator('.vs__none')).toBeVisible();
    await expect(euro.locator('tr[data-metric="titles"]')).toBeHidden();

    // ...and expands again for a pair that does have a EURO record.
    await page.selectOption('#compare-a', { label: 'Germany (incl. West Germany)' });
    await expect(euro).toHaveAttribute('data-empty', 'false');
    await expect(euro.locator('tr[data-metric="titles"] .vs__value[data-side="a"]')).toHaveText('3');
    await expect(euro.locator('.vs__none')).toBeHidden();
  });

  // Note: every one of the four competitions currently tracks a semifinal/
  // third-place column, so the "—" state the panel still renders for a
  // competition that doesn't is unreachable from real content and has no
  // test here.
  test('Combined keeps its numbers even when both totals would be zero', async ({ page }) => {
    const combined = page.locator('#compare-panel tbody[data-slug="combined"]');
    await expect(combined).toHaveAttribute('data-empty', 'false');
    await expect(combined.locator('tr[data-metric="titles"] .vs__value[data-side="a"]')).toHaveText('19');
    await expect(combined.locator('tr[data-metric="titles"] .vs__value[data-side="b"]')).toHaveText('17');
  });

});
