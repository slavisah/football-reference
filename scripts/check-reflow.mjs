// A systematic WCAG 2.1 SC 1.4.10 Reflow sweep at the canonical 320 CSS px
// test width, across every per-edition page on the site (both languages) -
// the follow-up the seventy-ninth intensive run's own closing note
// suggested after it found and fixed a real 320px overflow bug on the
// `/competitions/world-cup` *landing* page (a filter-select field sized from
// its longest option, "Canada, Mexico and United States", exceeding the
// viewport - see `tests/e2e/mobile.spec.ts`'s matching regression test).
// That fix was landing-page-specific (`TournamentTable.astro`'s filter
// controls); it was never checked whether any of the ~200 *edition* pages
// (`/competitions/<family>/<year>/`, no filter controls, but their own
// tables/notes/long team or player names) have an equivalent problem at the
// same width - this script closes that gap by loading every one of them
// (both languages) at 320px and checking for horizontal overflow, the same
// `scrollWidth - clientWidth` measurement every hand-written 320px/360px
// e2e test in `tests/e2e/mobile.spec.ts` already uses.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:lighthouse` documents: a full per-page-load sweep (~400 pages) is
// much slower than this repo's other `check:*` scripts, so it stays a
// manual/intensive-run tool rather than a required PR gate. Run manually
// (`pnpm check:reflow`) after `pnpm build`.
//
// Reuses the `astro preview` daemon dance and Chromium-launch escape hatches
// `scripts/check-lighthouse.mjs` already worked out (see that script's own
// doc comment for the full "Astro 7 forks preview into a background daemon"
// story and the PW_EXECUTABLE_PATH/PW_CHROME_CHANNEL fallbacks this
// sandbox's pre-installed Chromium needs).

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

// Every edition-page directory lives under one of these roots, one level
// (team competitions/individual awards) or two levels (Golden Boot's
// world-cup/euro split) below it, and is named after its edition - always
// starting with a digit (a year, or a season like "2018-19", or a
// disambiguated year like "1959-argentina") - which is exactly what tells
// it apart from a sibling landing-page directory (named after the family,
// e.g. "world-cup") at the same depth.
const EDITION_ROOTS = ['competitions', 'hr/competitions'];

/** An edition directory is named after its edition, which always starts with a digit. */
export function isEditionDirName(name) {
  return /^\d/.test(name);
}

/** Convert an on-disk dist/ directory path into the site-relative URL path used to request it. */
export function dirToPagePath(distDir, dir) {
  return `/${path.relative(distDir, dir).split(path.sep).join('/')}/`;
}

async function findEditionDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (isEditionDirName(entry.name)) {
      results.push(full);
    } else {
      results.push(...(await findEditionDirs(full)));
    }
  }
  return results;
}

async function listEditionPages() {
  const dirs = [];
  for (const root of EDITION_ROOTS) {
    dirs.push(...(await findEditionDirs(path.join(DIST_DIR, root))));
  }
  return dirs.map((dir) => dirToPagePath(DIST_DIR, dir)).sort();
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
  const pagePaths = await listEditionPages();
  console.log(`Found ${pagePaths.length} edition pages to sweep at 320px.`);

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
    console.log(`\nAll ${pagePaths.length} edition pages have no horizontal overflow at 320px.`);
    return;
  }

  console.error(`\n${failures.length} edition page(s) overflow at 320px:\n`);
  for (const { pagePath, overflow } of failures) {
    console.error(`  ${pagePath}: ${overflow}px`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  stopPreviewDaemon();
  process.exitCode = 1;
});
