// A systematic horizontal-overflow sweep at a real landscape-phone viewport
// (667x375, an iPhone SE/8 rotated), across every page on the site (both
// languages) - the same mechanism and budget as `check-reflow.mjs`'s
// portrait 320px sweep, but for a viewport shape that sweep, `check-text-
// zoom.mjs` (1280x800) and every hand-written e2e test in `tests/e2e/` never
// exercise: every viewport this project tests anywhere is either <=410px
// wide (portrait phones) or >=1000px wide (tablet/desktop) - nothing in the
// 34rem-60rem (544px-960px) band this site's own media queries switch
// layouts across (see `Nav.astro`'s comment on its 60rem desktop-nav
// breakpoint and the site-wide `min-width: 34rem` rules `grep`-able across
// `src/`), and nothing shorter than 740px tall, so a layout that only
// misbehaves once both dimensions land in that untested combination - a
// real, common way phones are actually held to read a wide tournament table
// - had no coverage at all.
//
// Found empirically, not assumed: a throwaway probe script (loading the home
// page, opening the mobile nav drawer, and reading `#site-menu`'s real
// `scrollHeight`/`clientHeight`) confirmed this exact viewport forces the
// drawer to genuinely overflow (scrollHeight 649px vs. clientHeight ~313px) -
// unlike every existing e2e test's 360x740/1024x800/1280x800 viewports, none
// of which ever come close to needing the drawer's `overflow-y: auto` fix
// (see Nav.astro's own comment on the bug that fix closed) to actually
// engage. That specific drawer-scroll-reachability behavior is covered by
// `tests/e2e/mobile.spec.ts`'s new "nav drawer at a short landscape-phone
// viewport" suite instead, at this same 667x375 size, since it needs a real
// keyboard Tab walk, not a static overflow measurement. This script is the
// site-wide horizontal-overflow half of the same investigation.
//
// A full 711-page sweep at this viewport found zero overflow regressions -
// this script is a permanent guard against a future one, the same "build the
// permanent check even on a clean pass" reasoning `check-record-claims.mjs`'s
// own doc comment already gives.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:reflow`/`check:lighthouse` document: a full per-page-load sweep
// (~700 pages) is much slower than this repo's other `check:*` scripts, so
// it stays a manual/intensive-run tool. Run manually (`pnpm check:landscape`)
// after `pnpm build`.
//
// Reuses `check-reflow.mjs`'s own page-listing/redirect-stub/budget helpers
// (already unit-tested in `tests/unit/checkReflow.test.ts`) rather than
// duplicating them - only the viewport and console labeling differ.

import { htmlFileToPagePath, isRedirectStubHtml, pagesOverflowing } from './check-reflow.mjs';
import { listHtmlFiles } from './check-internal-links.mjs';
import { launchChromium, startPreviewDaemon, stopPreviewDaemon } from './preview-daemon.mjs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

// A real, common landscape-phone size (iPhone SE/8 rotated) - wide enough to
// clear this site's 34rem (544px) breakpoint band, narrow enough to stay
// below the 60rem (960px) desktop-nav breakpoint, and short enough to force
// the mobile nav drawer to genuinely overflow (see this file's own doc
// comment above for the measured scrollHeight/clientHeight numbers).
export const LANDSCAPE_VIEWPORT = { width: 667, height: 375 };

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

async function measureOverflow(page, pagePath) {
  await page.goto(`${ORIGIN}${BASE}${pagePath}`);
  return page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
}

async function main() {
  const pagePaths = await listAllPages();
  console.log(
    `Found ${pagePaths.length} pages to sweep at ${LANDSCAPE_VIEWPORT.width}x${LANDSCAPE_VIEWPORT.height} (landscape phone).`,
  );

  await startPreviewDaemon();
  const browser = await launchChromium();
  const context = await browser.newContext({ viewport: LANDSCAPE_VIEWPORT });
  const page = await context.newPage();

  const measurements = [];
  try {
    for (const pagePath of pagePaths) {
      const overflow = await measureOverflow(page, pagePath);
      measurements.push({ pagePath, overflow });
      if (overflow > 1) {
        console.log(`  FAIL  ${pagePath}  (${overflow}px overflow)`);
      }
    }
  } finally {
    await browser.close();
    await stopPreviewDaemon();
  }

  const failures = pagesOverflowing(measurements);

  if (failures.length === 0) {
    console.log(
      `\nAll ${pagePaths.length} pages have no horizontal overflow at ${LANDSCAPE_VIEWPORT.width}x${LANDSCAPE_VIEWPORT.height}.`,
    );
    return;
  }

  console.error(
    `\n${failures.length} page(s) overflow at ${LANDSCAPE_VIEWPORT.width}x${LANDSCAPE_VIEWPORT.height}:\n`,
  );
  for (const { pagePath, overflow } of failures) {
    console.error(`  ${pagePath}: ${overflow}px`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard `check-reflow.mjs`/`check-internal-links.mjs`
// already use, for the same reason: importing this module's exports from a
// unit test must not also race a second preview-server instance.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error(error);
    await stopPreviewDaemon();
    process.exitCode = 1;
  });
}
