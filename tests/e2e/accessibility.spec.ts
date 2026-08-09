import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { NAV_LINKS } from '../../src/lib/routes';
import { TRANSLATED_PATHS } from '../../src/lib/i18n';

// Automated WCAG 2.1 A/AA sweep across every live page (English and Croatian),
// on top of the hand-written keyboard/filter checks in mobile.spec.ts. Runs at
// the same 360px viewport as the rest of the suite (playwright.config.ts) so
// it also catches issues that only show up in the mobile card layout, and
// under both color schemes - the site's accent colors are tuned per-theme
// (see homeCards.ts), and a light-only sweep already missed real dark-mode
// contrast failures once during development of this file.
//
// 'region' is disabled site-wide: axe wants every visible element inside a
// landmark, but the skip-link's target anchor deliberately sits just before
// <main>, which is correct, not a bug.

const ENGLISH_PATHS = NAV_LINKS.map((link) => link.path);
const CROATIAN_PATHS = Object.values(TRANSLATED_PATHS);

// Home page routes to '/' (English) and '/hr/' (Croatian, via TRANSLATED_PATHS);
// every other path is relative to the base URL already.
const ALL_PATHS = [...new Set([...ENGLISH_PATHS, ...CROATIAN_PATHS])];
const COLOR_SCHEMES = ['light', 'dark'] as const;

// The 404 page (src/pages/404.astro) isn't in NAV_LINKS - it's not a real nav
// destination, only what a broken/unmatched URL renders - so it's swept
// separately rather than folded into ALL_PATHS above.
const SWEPT_PATHS = [...ALL_PATHS, 'this-page-definitely-does-not-exist'];

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    for (const path of SWEPT_PATHS) {
      test(`${path || '/'} has no automatic WCAG 2.1 A/AA violations`, async ({ page }) => {
        const target = path === '/' ? '' : path.replace(/^\//, '');
        await page.goto(target);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .disableRules(['region'])
          .analyze();

        expect(results.violations, formatViolations(results.violations)).toEqual([]);
      });
    }
  });
}

// Turns axe's violation objects into a readable failure message instead of
// Playwright's default full-object dump (each violation can carry dozens of
// matching DOM nodes). Typed off AxeBuilder's own return type rather than an
// `axe-core` import - axe-core is only a transitive dependency here (of
// @axe-core/playwright), so pnpm's strict node_modules doesn't expose its
// types directly to this file.
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
