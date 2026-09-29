import { test, expect } from '@playwright/test';

// /compare's `.finals-meetings__list` and /compare-players' own
// `.shared-years__list` (both languages) are re-rendered client-side by
// replacing their container's entire innerHTML - `<ol>` included, not just
// its `<li>`s - whenever the reader picks a new pair (renderFinalsMeetings()/
// renderSharedYears() in each page's own inline script). That re-rendered
// markup never carries the data-astro-cid-* attribute Astro's compiler adds
// to each file's own statically-authored markup and requires of a plain
// scoped CSS selector, so - before this run's fix wrapped the relevant rules
// in `:global()` - the list silently fell back to a bare, bulleted <ol> (no
// flex layout, no card background/border) the moment a reader used either
// page's own shareable `?a=/&b=` URL parameters (AGENTS.md's own "make all
// filters shareable through URL query parameters" rule) or either picker
// directly, in every color scheme and browser, confirmed with a real
// `getComputedStyle()` read before the fix (`display: block`/`list-style:
// decimal`, not the intended `flex`/`none`) rather than assumed from reading
// the CSS. accessibility-compare-states.spec.ts already re-selects a team/
// player pair and runs axe against the result, but an unstyled-but-still-
// list-semantic <ol> has no WCAG violation for axe to catch - this file
// exists specifically to assert the *visual* layout survives a real
// pair-driven re-render, the gap axe's own accessibility tree checks can't
// see. Brazil/Argentina and Zidane/Šuker are picked because they're already
// known (from this file's `compare-players.spec.ts` neighbor, and this run's
// own manual check) to have at least one real meeting/shared year, so the
// list actually renders instead of the page's "haven't met" empty state.

const FINALS_MEETINGS_CASES = [
  { label: 'English', path: 'compare?a=brazil&b=argentina' },
  { label: 'Croatian', path: 'hr/compare?a=brazil&b=argentina' },
];

const SHARED_YEARS_CASES = [
  { label: 'English', path: 'compare-players?a=Zinedine+Zidane&b=Davor+%C5%A0uker' },
  { label: 'Croatian', path: 'hr/compare-players?a=Zinedine+Zidane&b=Davor+%C5%A0uker' },
];

async function expectCardListLayout(page: import('@playwright/test').Page, listSelector: string) {
  const list = page.locator(listSelector);
  await expect(list).toBeVisible();
  const style = await list.evaluate((el) => {
    const computed = getComputedStyle(el);
    return { display: computed.display, listStyleType: computed.listStyleType };
  });
  expect(style.display).toBe('flex');
  expect(style.listStyleType).toBe('none');

  const firstItem = list.locator('li').first();
  const itemDisplay = await firstItem.evaluate((el) => getComputedStyle(el).display);
  expect(itemDisplay).toBe('flex');
}

for (const { label, path } of FINALS_MEETINGS_CASES) {
  test(`${label} /compare's finals-meetings list keeps its card layout for a shared-URL pair`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectCardListLayout(page, '#finals-meetings-list');
  });
}

for (const { label, path } of SHARED_YEARS_CASES) {
  test(`${label} /compare-players' shared-years list keeps its card layout for a shared-URL pair`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectCardListLayout(page, '#shared-years-list');
  });
}
