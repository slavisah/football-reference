import { test, expect, type Page } from '@playwright/test';

// WCAG 2.2 AA 2.4.11 "Focus Not Obscured (Minimum)" - a keyboard-focused
// element must never be entirely hidden by author-created content, such as
// this site's own sticky nav header (Nav.astro), `/quiz`'s second sticky
// score bar stacked below it, or `TournamentTable.astro`'s own inner sticky
// column header. No axe-core rule covers this (axe-core's `wcag22aa` tag
// currently ships only one rule, `target-size` - see docs/PROJECT_STATUS.md's
// "Known caveats"), and every existing `scroll-padding-top` fix on this site
// (global.css's own rule, quiz.astro's `calc()` override, and
// `sticky-table-header.spec.ts`'s own coverage of `.t-wrap`) has only ever
// been proven against a *programmatic* scroll (`scrollIntoView`/
// `window.scrollTo`) - never against the browser's own focus-driven
// auto-scroll a real Tab key-press triggers, which is what a keyboard user
// actually experiences. Confirmed clean by hand first, with a throwaway
// Tab-and-measure script against a real built/served site, before writing
// this as a permanent regression suite - not assumed from the CSS alone.

interface FocusProbe {
  tag: string;
  text: string | null;
  fullyCovered: boolean;
}

// Presses Tab, waits for the browser's own focus-driven scroll to settle (a
// same-tick read caught it mid-animation and measured a stale rect), then
// reports whether `document.activeElement` is entirely covered by the first
// element matching `obscurerSelector`. Returns null once focus leaves the
// document (or lands on a zero-size element, e.g. a `[hidden]` one), so
// callers can tell "ran out of focusable elements" from "nothing to check".
async function tabAndCheckObscured(page: Page, obscurerSelector: string): Promise<FocusProbe | null> {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  return page.evaluate((sel) => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const elRect = el.getBoundingClientRect();
    if (elRect.width === 0 || elRect.height === 0) return null;
    const obscurer = document.querySelector(sel);
    // A focused element that is itself inside the obscuring container (e.g.
    // the header's own brand link, while checking against `.site-header`)
    // is not a 2.4.11 case - a sticky element never hides its own children
    // from itself, only content that scrolls underneath it.
    if (!obscurer || obscurer.contains(el)) {
      return { tag: el.tagName, text: el.textContent?.trim().slice(0, 40) ?? null, fullyCovered: false };
    }
    const obsRect = obscurer.getBoundingClientRect();
    const overlapH = Math.max(0, Math.min(elRect.bottom, obsRect.bottom) - Math.max(elRect.top, obsRect.top));
    const overlapW = Math.max(0, Math.min(elRect.right, obsRect.right) - Math.max(elRect.left, obsRect.left));
    const fullyCovered = overlapH >= elRect.height - 0.5 && overlapW >= elRect.width - 0.5;
    return { tag: el.tagName, text: el.textContent?.trim().slice(0, 40) ?? null, fullyCovered };
  }, obscurerSelector);
}

test.describe('focus is never entirely hidden behind a sticky overlay (WCAG 2.4.11)', () => {
  test.beforeEach(async ({ page }) => {
    // Wide enough that TournamentTable renders as a real <table> with its own
    // sticky column header, not the mobile card list - see that component's
    // 40rem breakpoint (also used by sticky-table-header.spec.ts).
    await page.setViewportSize({ width: 1024, height: 800 });
  });

  test('tabbing through the World Cup table never hides a year link or story toggle under its own sticky column header', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    const wrap = page.locator('.t-wrap').first();
    // 23 editions is comfortably taller than `.t-wrap`'s own
    // `max-height: min(70vh, 42rem)` bound - sticky-table-header.spec.ts
    // already confirms this table actually scrolls internally, which is the
    // state this test needs to exercise (a table that fits with no scrollbar
    // has nothing for a sticky header to hide anything behind).
    await wrap.evaluate((el) => (el as HTMLElement).focus());

    let checked = 0;
    for (let i = 0; i < 80 && checked < 15; i += 1) {
      const stillInside = await page.evaluate(() => !!document.activeElement?.closest('.t-wrap'));
      if (!stillInside) break;
      const result = await tabAndCheckObscured(page, '.t-wrap thead th');
      if (!result) continue;
      const stillInsideAfter = await page.evaluate(() => !!document.activeElement?.closest('.t-wrap'));
      if (!stillInsideAfter) break;
      checked += 1;
      expect(result.fullyCovered, `${result.tag} "${result.text}" fully hidden under the table's own sticky column header`).toBe(
        false,
      );
    }
    // Sanity: this really walked real focusable rows (year links + story
    // reveals), not an empty loop that would pass vacuously.
    expect(checked).toBeGreaterThan(5);
  });

  test('tabbing through the quiz keeps every answer choice clear of the header + sticky score bar stack', async ({ page }) => {
    await page.goto('quiz');
    // Scroll down first so both sticky layers are actually pinned (stickiness
    // only engages once each one's own natural position has scrolled past
    // the top) - the state a reader answering question 5 or 10 is really in,
    // not the untouched top-of-page state every other quiz test starts from.
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
    await page.evaluate(() => document.body.focus());

    let found = 0;
    for (let i = 0; i < 60 && found < 8; i += 1) {
      const result = await tabAndCheckObscured(page, '.quiz__score');
      if (!result || (result.tag !== 'INPUT' && result.tag !== 'SUMMARY')) continue;
      found += 1;
      expect(result.fullyCovered, `${result.tag} "${result.text}" fully hidden under the sticky score bar`).toBe(false);
    }
    expect(found).toBeGreaterThan(0);
  });

  test('tabbing through a long content page never hides focus under the sticky site header', async ({ page }) => {
    await page.goto('records');
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
    await page.evaluate(() => document.body.focus());

    let found = 0;
    for (let i = 0; i < 60 && found < 10; i += 1) {
      const result = await tabAndCheckObscured(page, '.site-header');
      if (!result || (result.tag !== 'A' && result.tag !== 'BUTTON')) continue;
      found += 1;
      expect(result.fullyCovered, `${result.tag} "${result.text}" fully hidden under the sticky site header`).toBe(false);
    }
    expect(found).toBeGreaterThan(0);
  });
});
