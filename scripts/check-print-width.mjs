// A systematic print-media width sweep, across every page on the site (both
// languages), at the same usable A4-landscape content width
// `tests/e2e/print-styles.spec.ts`'s `PRINT_CONTENT_WIDTH_PX` already uses
// (`scripts/generate-pdfs.mjs`'s `@page` rule: A4 landscape, 297mm wide, 12mm
// margins each side = 273mm ~= 1032px usable width).
//
// That hand-written spec's own `WIDE_TABLE_PRINT_PAGES` list already covers
// every page shape that renders a real HTML `<table>` (the six competition/
// award landing pages, `/records`, `/compare`, `/compare-players`, both
// languages - the only files in `src/` with a `<table` tag, confirmed via
// `grep -rl '<table' src/`), so this script doesn't re-find a bug there. What
// it closes instead is the same "full-site tool, not a fixed manually-curated
// list" gap `check:reflow`/`check:text-zoom` already closed for their own
// stress axes: a future content or component change could introduce a wide
// element (a long note-card blockquote, a new stat row, a per-edition table
// widened by a future feature) on any of the site's other ~700 pages -
// per-edition pages, player/team profiles, the quiz, the directories - none
// of which `WIDE_TABLE_PRINT_PAGES` was ever meant to cover (it's scoped to
// the one bug class - `<table>` overflow - that motivated it), and none of
// which had ever been measured for print-width overflow before. Reuses
// `check-reflow.mjs`'s page discovery/redirect-stub filtering and
// `pagesOverflowing`/`OVERFLOW_TOLERANCE_PX` budget check rather than
// duplicating already-tested pure logic - the only genuinely different step is
// *how* each page is stressed (print media at the printable content width,
// not a narrow screen viewport or a doubled root font-size) before the same
// `scrollWidth - clientWidth` measurement every stress sweep in this repo
// already uses.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:lighthouse`/`check:reflow`/`check:text-zoom` document: a full
// per-page-load sweep (~700 pages) is much slower than this repo's other
// `check:*` scripts, so it stays a manual/intensive-run tool. Run manually
// (`pnpm check:print-width`) after `pnpm build`.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { listHtmlFiles } from './check-internal-links.mjs';
import {
  htmlFileToPagePath,
  isRedirectStubHtml,
  OVERFLOW_TOLERANCE_PX,
  pagesOverflowing,
} from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

// Same A4-landscape usable-content-width approximation
// `tests/e2e/print-styles.spec.ts`'s `PRINT_CONTENT_WIDTH_PX` uses: 297mm
// page width minus 12mm margins each side = 273mm, converted at 96 CSS
// px/inch (25.4mm/inch).
export const PRINT_CONTENT_WIDTH_PX = Math.round((273 * 96) / 25.4); // ~1032px
const VIEWPORT = { width: PRINT_CONTENT_WIDTH_PX, height: 1000 };

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
    `Found ${pagePaths.length} pages to sweep in print media at ${PRINT_CONTENT_WIDTH_PX}px (the printable A4-landscape content width).`,
  );

  await startPreviewDaemon();
  const browser = await launchChromium();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await page.emulateMedia({ media: 'print' });

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
    console.log(
      `\nAll ${pagePaths.length} pages have no horizontal overflow in print media at ${PRINT_CONTENT_WIDTH_PX}px.`,
    );
    return;
  }

  console.error(`\n${failures.length} page(s) overflow in print media at ${PRINT_CONTENT_WIDTH_PX}px:\n`);
  for (const { pagePath, overflow } of failures) {
    console.error(`  ${pagePath}: ${overflow}px`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard `check-reflow.mjs`/`check-text-zoom.mjs`
// already established - without it, Vitest importing this file's exports
// would also kick off a real `astro preview` + Chromium sweep as a side
// effect of the import.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    stopPreviewDaemon();
    process.exitCode = 1;
  });
}
