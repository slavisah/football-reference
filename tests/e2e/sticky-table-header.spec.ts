import { test, expect } from '@playwright/test';

// `TournamentTable.astro`'s `.t-table thead th` has carried `position: sticky;
// top: 0` since the component was first written, but never actually stuck to
// anything: `.t-wrap` (the horizontally-scrollable wrapper every tournament
// table renders inside, at every viewport from 40rem up - the mobile card
// layout below that hides the header entirely) had `overflow-x: auto` with no
// explicit `overflow-y`, which CSS's own overflow computation silently force-
// promotes to `auto` too the instant one axis isn't `visible` - making
// `.t-wrap` its own scroll container. `.t-wrap` never had a bounded height,
// so nothing ever actually scrolled *it*, leaving the sticky header nothing
// to pin against; on top of that, `.t-table` itself (a closer ancestor of
// `thead th` than `.t-wrap`) carried its own `overflow: hidden` purely to
// clip its content to its `border-radius`, which made *it* - never scrolled
// either - the nearer scroll-container ancestor instead. Both together meant
// a long tournament table's own column headers ("Year", "Host(s)", "Winner",
// ...) silently scrolled away with the rest of the table instead of staying
// visible, on every one of this site's ~700 pages, at every desktop/tablet
// viewport, since this component existed - reproduced with a real scroll-and-
// measure via a throwaway script before fixing it, not assumed from the CSS.
// See that fix's own comment in TournamentTable.astro for the full story.
//
// This suite guards the fix: `.t-wrap` now gets a real `max-height` (so it
// becomes a genuine, independently-scrollable box) and `.t-table` no longer
// clips via `overflow: hidden` (leaving `.t-wrap` as the only scroll-container
// ancestor `thead th` has). All below 40rem, the mobile card layout takes
// over and the header is visually hidden entirely (see mobile.spec.ts's own
// reflow coverage) - not this suite's concern.

test.describe('tournament table sticky column header (>=40rem)', () => {
  test.beforeEach(async ({ page }) => {
    // Wide enough that TournamentTable renders as a real <table>, not the
    // mobile card list - see the component's own 40rem breakpoint.
    await page.setViewportSize({ width: 1024, height: 800 });
  });

  test('a long table (World Cup Editions) actually needs its own scrollbar, and the header stays pinned to its top while scrolling', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    const wrap = page.locator('.t-wrap').first();
    const scrollHeight = await wrap.evaluate((el) => el.scrollHeight);
    const clientHeight = await wrap.evaluate((el) => el.clientHeight);
    // 23 editions' worth of multi-line rows is comfortably taller than the
    // wrapper's `max-height: min(70vh, 42rem)` bound - if this ever stops
    // being true (e.g. the bound is loosened, or rows get shorter), the rest
    // of this test wouldn't actually be exercising the scrolled state.
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    const headerCell = wrap.locator('thead th').first();

    // Unscrolled: the header sits at its own natural position, below the
    // caption - not yet "stuck" to anything, nothing to prove yet.
    const wrapBoxAtRest = await wrap.boundingBox();
    const headerBoxAtRest = await headerCell.boundingBox();
    expect(headerBoxAtRest!.y).toBeGreaterThan(wrapBoxAtRest!.y);

    // Scroll deep into the table's own internal scrollport (not the page -
    // the wrapper's own `scrollTop`, exactly what a reader's mouse wheel or
    // touch drag while hovering the table would drive).
    for (const scrollTop of [200, 600, scrollHeight]) {
      await wrap.evaluate((el, top) => {
        el.scrollTop = top;
      }, scrollTop);

      const wrapBox = await wrap.boundingBox();
      const headerBox = await headerCell.boundingBox();
      // The header's viewport position must track the wrapper's own top
      // edge, not drift upward with scrollTop the way an un-stuck header
      // would (before the fix, headerBox.y fell by ~1px per 1px scrolled,
      // eventually leaving the viewport entirely).
      expect(Math.abs(headerBox!.y - wrapBox!.y)).toBeLessThan(2);
    }
  });

  test('a short table (Nations League Winning captains) never gains a scrollbar it does not need', async ({
    page,
  }) => {
    await page.goto('competitions/nations-league');

    const wrap = page.locator('.t-wrap').last();
    const scrollHeight = await wrap.evaluate((el) => el.scrollHeight);
    const clientHeight = await wrap.evaluate((el) => el.clientHeight);
    // A handful of rows fits comfortably under the 42rem/70vh bound - the fix
    // must be invisible here: no internal scrollbar, full content visible.
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
  });

  test('the header stays put while the whole page scrolls, without ever overlapping the sticky site header', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    const wrap = page.locator('.t-wrap').first();
    const wrapTop = await wrap.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    // Scroll the page (not the wrapper) so the table sits mid-viewport - the
    // header must still render at the wrapper's own natural, in-flow
    // position here, never underneath the site's own sticky nav header.
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), wrapTop - 200);

    const headerBox = await page.locator('.site-header').boundingBox();
    const cellBox = await wrap.locator('thead th').first().boundingBox();
    expect(cellBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  });
});
