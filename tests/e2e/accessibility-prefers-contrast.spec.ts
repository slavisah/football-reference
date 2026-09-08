import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';
import { NAV_LINKS } from '../../src/lib/routes';
import { TRANSLATED_PATHS } from '../../src/lib/i18n';

// First-ever dedicated `prefers-contrast: more` coverage. global.css's new
// --light-contrast-border/--dark-contrast-border and
// --light-contrast-text-muted/--dark-contrast-text-muted tokens replace the
// deliberately subtle --border (a near-invisible ~1.3:1 card/table divider in
// both themes) and --text-muted with much higher-contrast versions for a
// reader whose OS asks for more contrast - see the comment above those tokens
// in global.css for the measured ratios.
//
// `contrast` isn't a `test.use()`-able PlaywrightTestOption in the pinned
// Playwright version here (unlike `colorScheme`) - only
// `page.emulateMedia()`/`browser.newContext({ contrast })` expose it, the
// same reason `accessibility-reduced-motion.spec.ts` and
// `accessibility-forced-colors.spec.ts` emulate per-test rather than using
// `test.use()`.
//
// global.css resolves --border/--text-muted through four blocks (default,
// `prefers-color-scheme: dark`, `[data-theme='light']`,
// `[data-theme='dark']`) and the contrast override mirrors all four exactly,
// for the same reason `theme-token-parity.spec.ts` pins the color-scheme
// blocks against each other: a fix landing in only one of the four already
// caused a real split-theme bug once (see the --danger comment in
// global.css). This test covers all four contrast x color-scheme
// combinations rather than just the default light one.

async function readBorderAndMuted(page: Page): Promise<{ border: string; textMuted: string }> {
  return page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      border: styles.getPropertyValue('--border').trim(),
      textMuted: styles.getPropertyValue('--text-muted').trim(),
    };
  });
}

test.describe('prefers-contrast: more', () => {
  test('OS light + no explicit theme resolves the light contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#5c6b7a');
    expect(tokens.textMuted).toBe('#3b4652');
  });

  test('OS dark + no explicit theme resolves the dark contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#7d92ab');
    expect(tokens.textMuted).toBe('#c7d2e0');
  });

  test('OS dark + toggled to light resolves the light contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    await openMenu(page);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#5c6b7a');
    expect(tokens.textMuted).toBe('#3b4652');
  });

  test('OS light + toggled to dark resolves the dark contrast tokens', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', contrast: 'more' });
    const page = await context.newPage();
    await page.goto('');
    await openMenu(page);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#7d92ab');
    expect(tokens.textMuted).toBe('#c7d2e0');
  });
});

test.describe('no prefers-contrast preference (baseline)', () => {
  test('the light theme keeps its normal, subtle --border/--text-muted', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#d7dde5');
    expect(tokens.textMuted).toBe('#56636f');
  });

  test('the dark theme keeps its normal, subtle --border/--text-muted', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('');
    const tokens = await readBorderAndMuted(page);
    await context.close();

    expect(tokens.border).toBe('#2b3a4f');
    expect(tokens.textMuted).toBe('#a3b0c0');
  });
});

// The eight targeted tests above pin the exact --border/--text-muted values
// this mode resolves to on the home page; they don't answer whether every
// other page on the site actually renders cleanly once axe-core inspects the
// DOM with `prefers-contrast: more` active. accessibility.spec.ts (baseline)
// and accessibility-forced-colors.spec.ts (forced-colors) both already run
// this same whole-site axe sweep for their own axis - prefers-contrast never
// got one of its own, even though this file has existed since that mode's
// tokens first landed. `contrast` isn't a `test.use()`-able option in the
// pinned Playwright version (see the note atop this file), so - unlike the
// other two sweeps, which emulate on the shared `page` fixture - each test
// here opens its own `browser.newContext({ contrast: 'more', colorScheme })`,
// the same construction the eight targeted tests above already use.
function runAxe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice', 'experimental', 'ACT', 'review-item'])
    .disableRules(['region', 'color-contrast-enhanced'])
    .analyze();
}

type AxeViolations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

function formatViolations(violations: AxeViolations): string {
  if (violations.length === 0) return '';
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
      return `${violation.id} (${violation.impact}): ${violation.help}\n  affected: ${targets}\n  see: ${violation.helpUrl}`;
    })
    .join('\n\n');
}

const ENGLISH_PATHS = NAV_LINKS.map((link) => link.path);
const CROATIAN_PATHS = Object.values(TRANSLATED_PATHS);
const ALL_PATHS = [...new Set([...ENGLISH_PATHS, ...CROATIAN_PATHS])];
// The 404 page isn't in NAV_LINKS - matches accessibility.spec.ts's/
// accessibility-forced-colors.spec.ts's SWEPT_PATHS exactly, so a newly
// added page can't silently go unswept in any of the three axes.
const SWEPT_PATHS = [...ALL_PATHS, 'this-page-definitely-does-not-exist'];
const COLOR_SCHEMES = ['light', 'dark'] as const;

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`prefers-contrast: more, full site sweep - ${colorScheme} color scheme`, () => {
    for (const path of SWEPT_PATHS) {
      test(`${path || '/'} has no WCAG 2.1/2.2 A/AA violations under prefers-contrast: more`, async ({
        browser,
      }) => {
        const context = await browser.newContext({ colorScheme, contrast: 'more' });
        const page = await context.newPage();
        const target = path === '/' ? '' : path.replace(/^\//, '');
        await page.goto(target);

        const results = await runAxe(page);
        await context.close();

        expect(results.violations, formatViolations(results.violations)).toEqual([]);
      });
    }
  });
}

// The sweep above only reaches NAV_LINKS/TRANSLATED_PATHS - the fixed
// top-level pages - so it can't reach the dynamic /teams/<slug> or
// /players/<slug> profile pages, the same gap accessibility.spec.ts and
// accessibility-forced-colors.spec.ts each independently hit and fixed with
// a spot-check of one representative team/player rather than one test per
// entity. Same two picks (Brazil, Gerd Muller) for consistency across all
// three axes.
for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`prefers-contrast: more, profile pages - ${colorScheme} color scheme`, () => {
    test(`English /teams/brazil has no WCAG 2.1/2.2 A/AA violations under prefers-contrast: more`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ colorScheme, contrast: 'more' });
      const page = await context.newPage();
      await page.goto('teams/brazil');
      const results = await runAxe(page);
      await context.close();
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test(`Croatian /hr/teams/brazil has no WCAG 2.1/2.2 A/AA violations under prefers-contrast: more`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ colorScheme, contrast: 'more' });
      const page = await context.newPage();
      await page.goto('hr/teams/brazil');
      const results = await runAxe(page);
      await context.close();
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test(`English /players/gerd-muller has no WCAG 2.1/2.2 A/AA violations under prefers-contrast: more`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ colorScheme, contrast: 'more' });
      const page = await context.newPage();
      await page.goto('players/gerd-muller');
      const results = await runAxe(page);
      await context.close();
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test(`Croatian /hr/players/gerd-muller has no WCAG 2.1/2.2 A/AA violations under prefers-contrast: more`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ colorScheme, contrast: 'more' });
      const page = await context.newPage();
      await page.goto('hr/players/gerd-muller');
      const results = await runAxe(page);
      await context.close();
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  });
}
