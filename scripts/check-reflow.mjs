// A systematic WCAG 2.1 SC 1.4.10 Reflow sweep at the canonical 320 CSS px
// test width, across every page on the site (both languages).
//
// The seventy-ninth intensive run found and fixed a real 320px overflow bug
// on the `/competitions/world-cup` *landing* page (a filter-select field
// sized from its longest option, "Canada, Mexico and United States",
// exceeding the viewport - see `tests/e2e/mobile.spec.ts`'s matching
// regression test). The eightieth run then swept every *edition* page
// (`/competitions/<family>/<year>/`) the same way and found none - but that
// still left the remaining ~300 non-edition pages (landing pages, player/team
// profiles, `/records`, `/compare`, `/compare-players`, `/glossary`, `/quiz`,
// the directory indexes, `/about/sources`) with no 320px coverage of their
// own layout, each a genuinely different DOM shape from the edition-page
// template that was swept clean. This run closes that gap by loading every
// built HTML page (both languages) at 320px - except the four legacy
// `/awards/*` meta-refresh redirect stubs, which have no rendered layout of
// their own (see `isRedirectStubHtml()`) - and checking for horizontal
// overflow, the same `scrollWidth - clientWidth` measurement every
// hand-written 320px/360px e2e test in `tests/e2e/mobile.spec.ts` already
// uses.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:lighthouse` documents: a full per-page-load sweep (~700 pages) is
// much slower than this repo's other `check:*` scripts, so it stays a
// manual/intensive-run tool rather than a required PR gate. Run manually
// (`pnpm check:reflow`) after `pnpm build`.
//
// Reuses the `astro preview` daemon dance and Chromium-launch escape hatches
// `scripts/check-lighthouse.mjs` already worked out (see that script's own
// doc comment for the full "Astro 7 forks preview into a background daemon"
// story and the PW_EXECUTABLE_PATH/PW_CHROME_CHANNEL fallbacks this
// sandbox's pre-installed Chromium needs), and the site-wide HTML file walk
// `scripts/check-internal-links.mjs` already established (`listHtmlFiles()`).

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { listHtmlFiles } from './check-internal-links.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

/**
 * Convert an on-disk dist/ HTML file path into the site-relative URL path
 * used to request it. Astro's `format: 'directory'` output means almost
 * every page is `<route>/index.html` (served at `/<route>/`); the one
 * exception on this site is the flat `404.html`, served at its own literal
 * path with no trailing-slash directory semantics.
 */
export function htmlFileToPagePath(distDir, filePath) {
  const rel = path.relative(distDir, filePath).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

/**
 * The site's four legacy `/awards/*` URLs (both languages) are
 * `<meta http-equiv="refresh" content="0;url=...">` redirect stubs to their
 * new `/competitions/*` home - a real page in dist/, but one whose whole
 * purpose is to navigate away immediately, with no rendered layout of its
 * own worth checking for 320px overflow (and whose immediate client-side
 * navigation destroys Playwright's execution context mid-`page.evaluate()`
 * if visited the same way as a real content page).
 */
export function isRedirectStubHtml(html) {
  return /<meta\s+http-equiv="refresh"/i.test(html);
}

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

function stopPreviewDaemon() {
  spawnSync(astroBin, ['preview', 'stop'], { cwd: ROOT, stdio: 'inherit' });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Preview server at ${url} did not become ready in time`);
}

async function startPreviewDaemon() {
  stopPreviewDaemon();
  console.log('Starting `astro preview`...');
  spawnSync(astroBin, ['preview', '--port', PORT, '--host'], { cwd: ROOT, stdio: 'inherit' });
  await waitForServer(`${ORIGIN}${BASE}/`);
  console.log(`Preview server ready at ${ORIGIN}${BASE}/`);
}

async function launchChromium() {
  const launchOptions = { headless: true };
  if (process.env.PW_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PW_EXECUTABLE_PATH;
  } else if (process.env.PW_CHROME_CHANNEL) {
    launchOptions.channel = process.env.PW_CHROME_CHANNEL;
  }
  return chromium.launch(launchOptions);
}

// Allow a 1px rounding tolerance, matching every hand-written overflow
// assertion in tests/e2e/mobile.spec.ts.
export const OVERFLOW_TOLERANCE_PX = 1;

/** Pure budget check: which measured pages overflow past the tolerance, in the order they were measured. */
export function pagesOverflowing(measurements, tolerancePx = OVERFLOW_TOLERANCE_PX) {
  return measurements.filter(({ overflow }) => overflow > tolerancePx);
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
  console.log(`Found ${pagePaths.length} pages to sweep at 320px.`);

  await startPreviewDaemon();
  const browser = await launchChromium();
  const context = await browser.newContext({ viewport: { width: 320, height: 740 } });
  const page = await context.newPage();

  const measurements = [];
  try {
    for (const pagePath of pagePaths) {
      const overflow = await measureOverflow(page, pagePath);
      measurements.push({ pagePath, overflow });
      if (overflow > OVERFLOW_TOLERANCE_PX) {
        console.log(`  FAIL  ${pagePath}  (${overflow}px overflow)`);
      }
    }
  } finally {
    await browser.close();
    stopPreviewDaemon();
  }

  const failures = pagesOverflowing(measurements);

  if (failures.length === 0) {
    console.log(`\nAll ${pagePaths.length} pages have no horizontal overflow at 320px.`);
    return;
  }

  console.error(`\n${failures.length} page(s) overflow at 320px:\n`);
  for (const { pagePath, overflow } of failures) {
    console.error(`  ${pagePath}: ${overflow}px`);
  }
  process.exitCode = 1;
}

// Guarded so importing htmlFileToPagePath/pagesOverflowing from
// tests/unit/checkReflow.test.ts doesn't also re-run the full 320px sweep as
// a side effect of the import (it did, silently, before this guard was
// added - see docs/PROJECT_STATUS.md's matching entry for how that surfaced:
// a second, concurrent main() invocation racing the real one for the same
// preview-server port, destroying page contexts mid-navigation) - only run
// main() when this file is the actual entry point (`pnpm check:reflow` /
// `node scripts/check-reflow.mjs`), the same guard check-internal-links.mjs
// already established.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    stopPreviewDaemon();
    process.exitCode = 1;
  });
}
