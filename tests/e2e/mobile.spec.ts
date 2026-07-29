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

  test('the two tables filter independently by player', async ({ page }) => {
    await page.selectOption('#golden-boot-world-cup-winner', 'Kylian Mbappé');
    const wcVisible = page.locator('#golden-boot-world-cup-table tbody tr:not([hidden])');
    await expect(wcVisible).toHaveCount(2);

    const euroVisible = page.locator('#golden-boot-euro-table tbody tr:not([hidden])');
    await expect(euroVisible).toHaveCount(17);
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
