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
