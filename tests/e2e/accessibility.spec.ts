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

// The sweep above scans each page in whatever "today" happens to be when the
// suite runs, which means the "On this day" widget (src/components/
// OnThisDay.astro) almost never gets its exact-final-date DOM state included
// in an automated scan: a specific competition final or Ballon d'Or ceremony
// falls on only a couple dozen of the year's 365 days, so most real runs only
// ever cover the fallback-archive-card state by luck. mobile.spec.ts already
// has hand-written content assertions for the exact-match, fallback and
// award-wording states, but none of them run through axe. This pins the
// browser clock (same `page.clock.setFixedTime` pattern mobile.spec.ts uses)
// to the two known exact-match dates - 30 July (a two-entry state: both the
// 1930 and 1966 World Cup finals) and 12 December (the Ballon d'Or
// award-wording branch, "won the award" instead of "won the final") - and
// scans just the widget region, for both languages and both color schemes,
// on top of the whole-page sweep above (which already covers the fallback
// state on any date without a match, including this suite's own run date).
const ON_THIS_DAY_DATES = [
  { label: 'two-entry exact match (World Cup 1930 + 1966 finals)', date: '2026-07-30T12:00:00' },
  { label: "Ballon d'Or award-wording exact match", date: '2026-12-12T12:00:00' },
];

const ON_THIS_DAY_HOME_PAGES = [
  { label: 'English', path: '' },
  { label: 'Croatian', path: 'hr/' },
];

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`"On this day" widget - ${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    for (const { label: dateLabel, date } of ON_THIS_DAY_DATES) {
      for (const { label: pageLabel, path } of ON_THIS_DAY_HOME_PAGES) {
        test(`${pageLabel} home page, ${dateLabel}, has no WCAG 2.1 A/AA violations`, async ({
          page,
        }) => {
          await page.clock.setFixedTime(new Date(date));
          await page.goto(path);

          const results = await new AxeBuilder({ page })
            .include('.on-this-day')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .disableRules(['region'])
            .analyze();

          expect(results.violations, formatViolations(results.violations)).toEqual([]);
        });
      }
    }
  });
}

// The sweep above (SWEPT_PATHS) only enumerates NAV_LINKS/TRANSLATED_PATHS -
// the fixed top-level pages, including /teams itself - so it already covers
// the teams *index*. It has no way to reach the 40 individual dynamic
// /teams/<slug> profile pages (src/pages/teams/[slug].astro, added
// 2026-08-17): every route in NAV_LINKS is a static top-level path, and
// [slug].astro is generated per-team at build time, so it was never in the
// list this sweep was built from. accessibility-forced-colors.spec.ts and
// print-styles.spec.ts both already added their own targeted /teams/<slug>
// spot-check for exactly this reason (2026-08-18, intensive run); this sweep
// - the main WCAG 2.1 A/AA pass, and the one most likely to catch a real
// contrast or landmark issue since it's the only one of the three that
// doesn't disable 'color-contrast' - had the identical gap and was missed in
// that same pass. Spot-checked the same representative team (Brazil, same
// choice the other two specs made) rather than one test per team.
for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`team profile page, ${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    test('English /teams/brazil has no automatic WCAG 2.1 A/AA violations', async ({ page }) => {
      await page.goto('teams/brazil');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['region'])
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test('Croatian /hr/teams/brazil has no automatic WCAG 2.1 A/AA violations', async ({ page }) => {
      await page.goto('hr/teams/brazil');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['region'])
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  });
}

// The gap above (team profile pages never being reachable from SWEPT_PATHS)
// applies identically to the 98 individual dynamic /players/<slug> profile
// pages (src/pages/players/[slug].astro, added 2026-08-20): NAV_LINKS only
// contains the /players *index*, and [slug].astro is generated per-player at
// build time, so this sweep - built the same way, from the same list - never
// reached a single player profile either. Unlike /teams/<slug>, this was
// missed from day one rather than caught and fixed in a later pass. Spot-
// checked one representative player (Gerd Muller, the same slug the PDF
// download Playwright coverage already uses) rather than one test per player.
for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`player profile page, ${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    test('English /players/gerd-muller has no automatic WCAG 2.1 A/AA violations', async ({
      page,
    }) => {
      await page.goto('players/gerd-muller');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['region'])
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test('Croatian /hr/players/gerd-muller has no automatic WCAG 2.1 A/AA violations', async ({
      page,
    }) => {
      await page.goto('hr/players/gerd-muller');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['region'])
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
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
