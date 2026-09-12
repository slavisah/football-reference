// A WCAG 2.1 SC 1.4.4 Resize Text sweep: every page on the site (both
// languages), loaded at a standard 1280x800 desktop viewport with the root
// font-size doubled to 200% - the browser's actual behavior when a reader
// increases their OS/browser text size, as distinct from `check:reflow`'s
// SC 1.4.10 Reflow sweep (a *narrower viewport*, same font-size). SC 1.4.4
// requires text to scale up to 200% with no loss of content or
// functionality; the automatable proxy every hand-written reflow assertion
// in `tests/e2e/mobile.spec.ts` already uses - horizontal
// `scrollWidth - clientWidth` overflow - applies here too, since a page
// whose text no longer fits without a horizontal scrollbar has lost content
// a reader can't get back to without one.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:lighthouse`/`check:reflow` document: a full per-page-load sweep
// (~700 pages) is much slower than this repo's other `check:*` scripts, so
// it stays a manual/intensive-run tool. Run manually (`pnpm check:text-zoom`)
// after `pnpm build`.
//
// Reuses `check-reflow.mjs`'s page discovery (`listAllPages` inlined the same
// way, built on `check-internal-links.mjs`'s `listHtmlFiles`) and its
// `pagesOverflowing`/`OVERFLOW_TOLERANCE_PX` budget check, rather than
// duplicating logic already tested in `tests/unit/checkReflow.test.ts` - the
// only genuinely different step is *how* each page is stressed (font-size,
// not viewport width) before the same measurement runs.

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

// The standard WCAG 1.4.4 test viewport: a typical desktop width, not the
// 320px `check:reflow` already covers - text-only resize is meant to be
// checked at an ordinary reading width, where a reader with a vision
// accommodation is expected to have their text size increased, not
// necessarily their window narrowed too.
const VIEWPORT = { width: 1280, height: 800 };
const TEXT_ZOOM_PERCENT = '200%';

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
  return page.evaluate((fontSize) => {
    document.documentElement.style.fontSize = fontSize;
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  }, TEXT_ZOOM_PERCENT);
}

async function main() {
  const pagePaths = await listAllPages();
  console.log(`Found ${pagePaths.length} pages to sweep at ${TEXT_ZOOM_PERCENT} text zoom.`);

  await startPreviewDaemon();
  const browser = await launchChromium();
  const context = await browser.newContext({ viewport: VIEWPORT });
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
    console.log(
      `\nAll ${pagePaths.length} pages have no horizontal overflow at ${TEXT_ZOOM_PERCENT} text zoom.`,
    );
    return;
  }

  console.error(`\n${failures.length} page(s) overflow at ${TEXT_ZOOM_PERCENT} text zoom:\n`);
  for (const { pagePath, overflow } of failures) {
    console.error(`  ${pagePath}: ${overflow}px`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard `check-reflow.mjs`/`check-internal-links.mjs`
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
