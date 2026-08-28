import { test, expect } from '@playwright/test';

// First-ever dedicated `prefers-reduced-motion` coverage. A 2026-08-14
// accessibility entry in docs/PROJECT_STATUS.md (see the forced-colors
// pass's own preamble) described this mode as already handled site-wide,
// but the only rule that ever existed (global.css's original
// `@media (prefers-reduced-motion: reduce)` block) only reset
// `scroll-behavior` to `auto` - it never touched the three real
// `transition` declarations in the codebase (the skip-link's reveal in
// global.css, and the matching `.comp-card` hover effect duplicated in both
// index.astro and hr/index.astro), so a reader with that OS setting on
// still got the full-speed motion from all three. Widened global.css's
// existing block with a blanket `*, *::before, *::after` override instead
// of patching each site individually, so this stays correct if a fourth
// transition/animation is ever added without anyone remembering this test.
//
// `reducedMotion` isn't a `test.use()`-able PlaywrightTestOption in the
// pinned Playwright version here (unlike `colorScheme`) - only
// `page.emulateMedia()` exposes it, the same way `forcedColors` already
// has to be emulated per-test in accessibility-forced-colors.spec.ts.
test.describe('prefers-reduced-motion: reduce', () => {
  test('the skip-link reveal transition is collapsed to near-zero', async ({ page }) => {
    await page.goto('');
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const skipLink = page.locator('.skip-link');
    const duration = await skipLink.evaluate((el) => getComputedStyle(el).transitionDuration);

    // Not exactly '0s': the site intentionally uses 0.01ms rather than 0s so
    // browsers still fire a transitionend event. Assert it parses well under
    // a visible frame (16ms) rather than pinning the exact string.
    expect(parseFloat(duration)).toBeLessThan(0.001);
  });

  test('the home page comp-card hover transition is collapsed to near-zero', async ({ page }) => {
    await page.goto('');
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const card = page.locator('.comp-card').first();
    await expect(card).toBeVisible();
    const duration = await card.evaluate((el) => getComputedStyle(el).transitionDuration);

    expect(parseFloat(duration)).toBeLessThan(0.001);
  });

  test('the Croatian home page comp-card hover transition is collapsed to near-zero', async ({
    page,
  }) => {
    await page.goto('hr/');
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const card = page.locator('.comp-card').first();
    await expect(card).toBeVisible();
    const duration = await card.evaluate((el) => getComputedStyle(el).transitionDuration);

    expect(parseFloat(duration)).toBeLessThan(0.001);
  });
});

test.describe('no prefers-reduced-motion preference (baseline)', () => {
  test('the fixtures above actually carry a real transition without the preference', async ({
    page,
  }) => {
    await page.goto('');

    const skipLink = page.locator('.skip-link');
    const skipDuration = await skipLink.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(skipDuration)).toBeCloseTo(0.15, 2);

    const card = page.locator('.comp-card').first();
    await expect(card).toBeVisible();
    const cardDuration = await card.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(cardDuration)).toBeCloseTo(0.12, 2);
  });
});
