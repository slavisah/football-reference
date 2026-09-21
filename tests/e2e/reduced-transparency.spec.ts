import { test, expect, type Page } from '@playwright/test';

// The sticky `.site-header` (`Nav.astro`) is the only translucent, blurred
// surface on the site - a `color-mix(..., transparent)` background plus
// `backdrop-filter: blur(8px)`, stacked over whatever page content scrolls
// underneath it. Every other `color-mix(..., transparent)` use on the site
// (grepped across `src/` before writing this) is a plain accent-tint
// highlight - a quiz answer's correct/incorrect tint, a table row's winner
// tint, a nav link's hover/active state - sitting against the page's own
// already-solid background, never layered over scrolling content, so
// `prefers-reduced-transparency` has nothing to fix there; only the header
// qualifies.
//
// No prior run had ever tested against `prefers-reduced-transparency`
// (`prefers-reduced-motion`/`prefers-contrast`/`forced-colors`/
// `prefers-color-scheme` all have their own dedicated specs, but not this
// one) despite the header shipping exactly the kind of translucent,
// blurred-backdrop UI this media feature exists to let a reader opt out of.
// Playwright's own `page.emulateMedia()` has no `reducedTransparency` option
// (only `colorScheme`/`contrast`/`forcedColors`/`reducedMotion`/`media` -
// confirmed by reading this project's pinned `playwright-core@1.63.0` type
// declarations), but the underlying capability exists one layer down: CDP's
// `Emulation.setEmulatedMedia` accepts an arbitrary `features` array, and
// this project's pinned Chromium build genuinely implements the media
// feature (confirmed directly before relying on it - a stray CDP feature
// name a browser doesn't recognize is silently ignored, not an error, so
// the fix's effect had to be verified by observing computed styles actually
// change, not just by the call not throwing).
//
// The fix (`Nav.astro`'s `@media (prefers-reduced-transparency: reduce)`
// block): drop `backdrop-filter` and swap the 88%-opacity `color-mix()`
// background for the same `--bg-elevated` token at full opacity, so header
// text and controls read against a stable, known background instead of
// whatever happens to be scrolled underneath at any given moment.

async function withReducedTransparency<T>(page: Page, fn: () => Promise<T>): Promise<T> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  try {
    return await fn();
  } finally {
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    await cdp.detach();
  }
}

async function readHeaderStyles(page: Page) {
  return page.locator('.site-header').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { backdropFilter: cs.backdropFilter, backgroundColor: cs.backgroundColor };
  });
}

test.describe('prefers-reduced-transparency: the sticky header drops its blur and becomes fully opaque', () => {
  test('default (no-preference): the header keeps its translucent, blurred backdrop', async ({ page }) => {
    await page.goto('');
    const styles = await readHeaderStyles(page);
    expect(styles.backdropFilter).toContain('blur');
    // color-mix(... 88%, transparent) resolves to a `color(...)`/`rgba(...)`
    // value with an alpha channel below 1, never a fully opaque color - the
    // baseline this test guards against a future edit silently regressing.
    expect(styles.backgroundColor).not.toMatch(/^rgb\(/);
  });

  test('reduce, light theme: the header background is fully opaque with no blur', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await withReducedTransparency(page, async () => {
      await page.goto('');
      const styles = await readHeaderStyles(page);
      expect(styles.backdropFilter).toBe('none');
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    });
  });

  test('reduce, dark theme: the header background is fully opaque with no blur', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await withReducedTransparency(page, async () => {
      await page.goto('');
      const styles = await readHeaderStyles(page);
      expect(styles.backdropFilter).toBe('none');
      expect(styles.backgroundColor).toBe('rgb(23, 34, 51)');
    });
  });

  test('reduce, Croatian mirror page: the same fix applies (shared Nav.astro, not an EN-only fix)', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await withReducedTransparency(page, async () => {
      await page.goto('hr');
      const styles = await readHeaderStyles(page);
      expect(styles.backdropFilter).toBe('none');
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    });
  });
});
