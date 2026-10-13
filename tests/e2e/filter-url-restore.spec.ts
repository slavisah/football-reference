import { test, expect } from '@playwright/test';

// AGENTS.md rule 9 requires every filter to be "shareable through URL query
// parameters" - the whole point being that a family member can paste a link
// and the *other* person's browser reproduces the same filtered view with no
// extra clicks. TournamentTable.astro's inline script has always had half of
// that contract covered: `writeParams()` pushes the current filter/sort
// selection into the URL as each `<select>` changes, and every prior spec
// that touches a filter (mobile.spec.ts, print-styles.spec.ts) only ever
// asserts *that* direction - select a filter, check the URL grew the
// matching `?key=value`.
//
// The other half - `readParams()` plus the "Restore filters (and sort) from
// the URL" block right above `apply()`'s first call - is what actually makes
// a *received* link work: load a URL that already carries `?winner=`/
// `?year=`/`?host=`/`?team=`/`?sort=`, and the page must render pre-filtered
// without any interaction at all. No spec had ever driven that direction
// directly (`rg "goto\(.*(winner=|year=|host=|team=)"` across tests/ turns up
// nothing), including the one case TournamentTable.astro's own `paramPrefix`
// doc comment exists specifically to guard: two tables on one page (Golden
// Boot's World Cup + EURO) restoring their *own* filter from their own
// namespaced key without leaking into the other table's selects.

test.describe('restoring tournament table filters directly from a shared URL', () => {
  test('World Cup: a combined winner+host URL pre-filters to the single matching edition', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup?winner=Argentina&host=Mexico');

    await expect(page.locator('#world-cup-winner')).toHaveValue('Argentina');
    await expect(page.locator('#world-cup-host')).toHaveValue('Mexico');

    const visibleRows = page.locator('#world-cup-table tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(1);
    await expect(visibleRows).toHaveAttribute('data-year', '1986');

    await expect(page.locator('#world-cup-status')).toContainText('winner Argentina');
    await expect(page.locator('#world-cup-status')).toContainText('host Mexico');
    await expect(page.locator('#world-cup-status')).toContainText('Showing 1 of 23');
  });

  test('World Cup: a team URL restores a team that never won, filtering to its appearances', async ({
    page,
  }) => {
    // Portugal never won the World Cup, so this only exercises the team
    // filter (drawn from winner/runner-up/third/fourth, see editionTeams())
    // rather than doubling up on the winner filter above.
    await page.goto('competitions/world-cup?team=Portugal');

    await expect(page.locator('#world-cup-team')).toHaveValue('Portugal');
    const visibleRows = page.locator('#world-cup-table tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(2);
    await expect(page.locator('#world-cup-status')).toContainText('team Portugal');
  });

  test('World Cup: a non-default sort URL actually re-sorts the server-rendered rows', async ({
    page,
  }) => {
    // The server renders rows newest-first (displayEditions sorts desc) to
    // match the default "year-desc" <select> value, so year-desc alone would
    // prove nothing - year-asc is the one value that forces a real client-side
    // re-sort on load, combined with a filter to also confirm both apply
    // together rather than one silently winning.
    await page.goto('competitions/world-cup?winner=Brazil&sort=year-asc');

    await expect(page.locator('#world-cup-winner')).toHaveValue('Brazil');
    await expect(page.locator('#world-cup-sort')).toHaveValue('year-asc');

    const visibleRows = page.locator('#world-cup-table tbody tr:not([hidden])');
    await expect(visibleRows).toHaveCount(5);
    await expect(visibleRows.first()).toHaveAttribute('data-year', '1958');
    await expect(visibleRows.last()).toHaveAttribute('data-year', '2002');
  });

  test('World Cup: an unrecognized filter value is ignored rather than left stuck mid-state', async ({
    page,
  }) => {
    // Guards the defensive `.some((o) => o.value === initial.winner)` check
    // that only ever applies a restored value when it matches a real
    // <option> - an edited-by-hand or stale link must fall back to "no
    // filter", not render a <select> with no matching option selected while
    // every row stays hidden.
    await page.goto('competitions/world-cup?winner=Narnia');

    await expect(page.locator('#world-cup-winner')).toHaveValue('');
    await expect(page.locator('#world-cup-table tbody tr[hidden]')).toHaveCount(0);
    await expect(page.locator('#world-cup-status')).toHaveText('Showing all 23 editions.');
  });

  test('Croatian World Cup: the winner URL restores using the same untranslated data value', async ({
    page,
  }) => {
    // src/pages/hr/competitions/world-cup.astro only translates the bit
    // prefixes/templates, not the underlying filter values themselves (the
    // existing write-direction test at mobile.spec.ts:445 confirms the same
    // for the opposite direction) - so the shared link a Croatian-reading
    // family member pastes still carries the plain "Argentina" value.
    await page.goto('hr/competitions/world-cup?winner=Argentina');

    await expect(page.locator('#world-cup-winner')).toHaveValue('Argentina');
    await expect(page.locator('#world-cup-status')).toContainText('prvak Argentina');
  });

  test('Golden Boot: each table restores only its own namespaced filter, with no cross-talk', async ({
    page,
  }) => {
    // Exercises exactly the collision `paramPrefix` was added to prevent
    // (see TournamentTable.astro's own doc comment): two tables, two
    // simultaneously-present query keys, loaded in one request rather than
    // built up one click at a time.
    await page.goto('competitions/golden-boot?world-cup-winner=Just+Fontaine&euro-year=1984');

    await expect(page.locator('#golden-boot-world-cup-winner')).toHaveValue('Just Fontaine');
    await expect(page.locator('#golden-boot-euro-year')).toHaveValue('1984');

    // Neither table's *other* select picked up the other table's value.
    await expect(page.locator('#golden-boot-world-cup-year')).toHaveValue('');
    await expect(page.locator('#golden-boot-euro-winner')).toHaveValue('');

    await expect(
      page.locator('#golden-boot-world-cup-table tbody tr:not([hidden])'),
    ).toHaveCount(1);
    await expect(
      page.locator('#golden-boot-euro-table tbody tr:not([hidden])'),
    ).toHaveCount(1);

    await expect(page.locator('#golden-boot-world-cup-status')).toContainText('winner Just Fontaine');
    await expect(page.locator('#golden-boot-euro-status')).toContainText('year 1984');
  });
});
