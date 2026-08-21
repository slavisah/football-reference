import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The global "find a player" quick-jump widget (Nav.astro, both languages,
// every built page) - the individual-award counterpart of "find a team"
// (tests/e2e/team-search.spec.ts): an editable ARIA 1.2 combobox that
// filters a lazily-fetched player-name index (/player-index.json) as the
// reader types and sends Enter/click to /compare-players?a=<id>, the same
// shareable param /compare-players' own two <select> pickers already
// read/write. See docs/PROJECT_STATUS.md's 2026-08-21 "find a player"
// entry for why this widget exists.
//
// Player ids (unlike team ids, which are lowercase slugs like "brazil") are
// the player's raw display name (src/lib/playerProfile.ts's
// buildPlayerProfile: `id: playerName`), so a selected player's id can
// contain a space - URLSearchParams encodes that as "+" in the resulting
// URL, hence the `Lionel\+Messi` pattern in the navigation assertions below
// rather than a literal space.

async function openAndType(page: import('@playwright/test').Page, query: string) {
  const input = page.locator('#player-search-input');
  await input.click();
  await input.fill(query);
  await expect(page.locator('#player-search-status')).not.toHaveText('Loading players…');
}

test.describe('Find a player (English)', () => {
  test('is present, closed, on the home page', async ({ page }) => {
    await page.goto('');
    const input = page.locator('#player-search-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Find a player…');
    await expect(page.locator('#player-search-listbox')).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('is present on a non-home page too (shared Nav.astro)', async ({ page }) => {
    await page.goto('quiz');
    await expect(page.locator('#player-search-input')).toBeVisible();
  });

  test('typing filters the fetched player list and shows matching options', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'lionel messi');
    await expect(page.locator('#player-search-listbox')).toBeVisible();
    const options = page.locator('#player-search-listbox [role="option"]');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveText('Lionel Messi');
  });

  test('an unmatched query shows the translated no-results message, not a stale list', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'zzzznotaplayer');
    await expect(page.locator('#player-search-listbox')).toBeHidden();
    await expect(page.locator('#player-search-status')).toHaveText('No players match “zzzznotaplayer”.');
  });

  test('clearing the input closes the listbox again', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'messi');
    await expect(page.locator('#player-search-listbox')).toBeVisible();
    await page.locator('#player-search-input').fill('');
    await expect(page.locator('#player-search-listbox')).toBeHidden();
  });

  test('Escape closes an open listbox without navigating', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'messi');
    await expect(page.locator('#player-search-listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#player-search-listbox')).toBeHidden();
    await expect(page).toHaveURL(/\/football-reference\/?$/);
  });

  test('ArrowDown then Enter selects the active option and navigates to /compare-players?a=<id>', async ({
    page,
  }) => {
    await page.goto('');
    await openAndType(page, 'lionel messi');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#player-search-listbox [role="option"].is-active')).toHaveText('Lionel Messi');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/compare-players\?a=Lionel\+Messi(&|$)/);
    await expect(page.locator('#compare-a')).toHaveValue('Lionel Messi');
    await expect(page.locator('#compare-a-name')).toHaveText('Lionel Messi');
  });

  test('clicking an option navigates to /compare-players?a=<id> the same way', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'lionel messi');
    await page.locator('#player-search-listbox [role="option"]', { hasText: 'Lionel Messi' }).click();
    await expect(page).toHaveURL(/\/compare-players\?a=Lionel\+Messi(&|$)/);
    await expect(page.locator('#compare-a')).toHaveValue('Lionel Messi');
  });

  test('clicking outside the widget closes the listbox', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'messi');
    await expect(page.locator('#player-search-listbox')).toBeVisible();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#player-search-listbox')).toBeHidden();
  });

  test('option ids never collide with the "find a team" widget\'s own option ids', async ({ page }) => {
    await page.goto('');
    await openAndType(page, 'messi');
    const playerOptionId = await page.locator('#player-search-listbox [role="option"]').first().getAttribute('id');
    expect(playerOptionId).toMatch(/^player-search-option-/);
  });
});

test.describe('Find a player (Croatian)', () => {
  test('uses the Croatian label/placeholder and still navigates to the Croatian compare-players page', async ({
    page,
  }) => {
    await page.goto('hr/');
    const input = page.locator('#player-search-input');
    await expect(input).toHaveAttribute('placeholder', 'Pronađi igrača…');
    await expect(page.locator('label[for="player-search-input"]')).toHaveText('Pronađi igrača');

    await openAndType(page, 'lionel messi');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/hr\/compare-players\?a=Lionel\+Messi(&|$)/);
    await expect(page.locator('#compare-a')).toHaveValue('Lionel Messi');
  });

  test('no-results message is in Croatian', async ({ page }) => {
    await page.goto('hr/');
    await openAndType(page, 'zzzznotaplayer');
    await expect(page.locator('#player-search-listbox')).toBeHidden();
    await expect(page.locator('#player-search-status')).toHaveText(
      'Nijedan igrač ne odgovara upitu „zzzznotaplayer”.',
    );
  });
});

test.describe('Find a player accessibility', () => {
  const COLOR_SCHEMES = ['light', 'dark'] as const;

  for (const colorScheme of COLOR_SCHEMES) {
    test(`open listbox with an active option has no WCAG violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('');
      await openAndType(page, 'messi');
      await page.keyboard.press('ArrowDown');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['region'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('combobox exposes the expected ARIA wiring while open', async ({ page }) => {
    await page.goto('');
    const input = page.locator('#player-search-input');
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-controls', 'player-search-listbox');

    await openAndType(page, 'messi');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const activeId = await page.locator('#player-search-listbox [role="option"].is-active').getAttribute('id');
    await expect(input).toHaveAttribute('aria-activedescendant', activeId ?? '');
    await expect(page.locator('#player-search-listbox')).toHaveAttribute('role', 'listbox');
  });
});
