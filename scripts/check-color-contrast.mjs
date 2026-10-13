// A systematic WCAG 2.1/2.2 SC 1.4.3 Contrast (Minimum) sweep, across every
// generated page on the site (both languages, both color schemes), using
// axe-core's own `color-contrast` rule rather than hand-rolled pixel math.
//
// This site already runs axe-core's `color-contrast` rule in
// `tests/e2e/accessibility.spec.ts` - it's one of the many rules under the
// `wcag2aa` tag that file requests, and unlike `color-contrast-enhanced`
// (AAA, deliberately disabled there) it has never been disabled. But that
// sweep only ever reaches a representative *sample* of this site's 711 built
// pages: `NAV_LINKS`/`TRANSLATED_PATHS` (the fixed top-level pages) plus one
// spot-checked team (Brazil) and one spot-checked player (Gerd Muller) - it
// has no way to reach the other 39 team profiles, 97 player profiles, or any
// of the per-edition pages for every year of every competition and award
// (`/competitions/<competition>/<year>`, generated dynamically at build
// time, the same shape of gap `check-target-size.mjs`/
// `check-text-spacing.mjs`/`check-focus-appearance.mjs` each closed for
// their own WCAG criterion rather than trusting a hand-picked sample to
// stand in for the whole site. `accessibility.spec.ts`'s own file comment
// already flags *why* this criterion specifically needs full coverage, not
// just a sample: "a light-only sweep already missed real dark-mode contrast
// failures once during development of this file" - this site's accent
// colors are tuned per-theme (see `homeCards.ts`), so a color pairing that
// passes in one scheme can legitimately fail in the other, and a per-page
// color choice (a competition's own accent, a leader/winner cell's
// highlight) is exactly the kind of thing a sampled sweep can miss on the
// one page it never happens to load.
//
// Unlike its siblings, this script doesn't reimplement its own measurement:
// contrast-ratio math (relative luminance, alpha-compositing against a
// possibly-transparent background, text that spans a gradient) is exactly
// the kind of logic worth delegating to a vetted library rather than hand-
// rolling, and axe-core - already a trusted dependency throughout this
// codebase's e2e suite - already does it correctly. This script only adds
// the one thing axe's own existing sweep doesn't do: reach every page, in
// both color schemes.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:target-size`/`check:text-spacing`/`check:focus-appearance`/
// `check:reflow`/`check:lighthouse` document: a full per-page-load sweep
// across ~700 pages (here, x2 for both color schemes) is much slower than
// this repo's other `check:*` scripts, so it stays a manual/intensive-run
// tool rather than a required PR gate. Run manually
// (`pnpm check:color-contrast`) after `pnpm build`.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';
import { listHtmlFiles } from './check-internal-links.mjs';
import { launchChromium, startPreviewDaemon, stopPreviewDaemon } from './preview-daemon.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

// The same 360px phone viewport playwright.config.ts and
// check-focus-appearance.mjs use. Contrast ratio itself doesn't depend on
// viewport width (no media query in this codebase conditions a color token
// on viewport size), so one viewport is sufficient - the same reasoning
// check-focus-appearance.mjs applies for its own single-viewport scope.
export const PHONE_VIEWPORT = { width: 360, height: 740 };

// Both color schemes, since this site's accent colors are tuned per-theme
// (see src/lib/homeCards.ts and accessibility.spec.ts's own file comment) -
// a pairing that clears 4.5:1/3:1 in one scheme can legitimately fail in the
// other, and only sweeping one would reintroduce the exact gap
// accessibility.spec.ts was written to close.
export const COLOR_SCHEMES = ['light', 'dark'];

async function listAllPages() {
  const files = await listHtmlFiles(DIST_DIR);
  const pages = await Promise.all(
    files.map(async (file) => {
      const html = await readFile(file, 'utf8');
      return isRedirectStubHtml(html) ? null : htmlFileToPagePath(DIST_DIR, file);
    }),
  );
  return pages.filter((page) => page !== null).sort();
}

/**
 * Flattens axe-core's `color-contrast` violations (if any) down to one entry
 * per affected DOM node, pairing each with its own failure summary (axe's
 * own per-node message, e.g. "Element has insufficient color contrast of
 * 3.59 (foreground color: #767676, background color: #ffffff, font size:
 * 9.0pt, font weight: normal): expected contrast ratio of 4.5:1"). Pure and
 * unit-testable without a browser - takes axe's own violations array shape
 * directly, the same `AxeBuilder['analyze']` return type
 * `accessibility.spec.ts`'s `formatViolations()` already types against.
 */
export function summarizeContrastViolations(violations) {
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => ({
      target: node.target.join(' '),
      summary: (node.failureSummary ?? violation.help).replace(/\s+/g, ' ').trim(),
    })),
  );
}

async function measureContrast(page, pagePath) {
  await page.goto(`${ORIGIN}${BASE}${pagePath}`);
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  return summarizeContrastViolations(results.violations);
}

async function main() {
  const pagePaths = await listAllPages();
  console.log(
    `Found ${pagePaths.length} pages to sweep for WCAG 1.4.3 color-contrast violations at ${PHONE_VIEWPORT.width}x${PHONE_VIEWPORT.height}, in both color schemes (${pagePaths.length * COLOR_SCHEMES.length} page loads total).`,
  );

  await startPreviewDaemon();
  const browser = await launchChromium();

  const failures = [];
  try {
    for (const colorScheme of COLOR_SCHEMES) {
      const context = await browser.newContext({ viewport: PHONE_VIEWPORT, colorScheme });
      const page = await context.newPage();
      for (const pagePath of pagePaths) {
        const issues = await measureContrast(page, pagePath);
        if (issues.length > 0) {
          failures.push({ colorScheme, pagePath, issues });
          console.log(`  FAIL  [${colorScheme}] ${pagePath}`);
          for (const { target, summary } of issues) {
            console.log(`          ${target}: ${summary}`);
          }
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await stopPreviewDaemon();
  }

  if (failures.length === 0) {
    console.log(
      `\nNo WCAG 1.4.3 color-contrast violations found across all ${pagePaths.length} pages in either color scheme.`,
    );
    return;
  }

  console.error(`\n${failures.length} page/color-scheme combination(s) have a color-contrast violation:\n`);
  for (const { colorScheme, pagePath, issues } of failures) {
    console.error(`  [${colorScheme}] ${pagePath}: ${issues.length} issue(s)`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard check-reflow.mjs/check-focus-appearance.mjs
// already use, for the same reason: importing this module's exports from a
// unit test must not also race a second preview-server instance.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error(error);
    await stopPreviewDaemon();
    process.exitCode = 1;
  });
}
