// A WCAG 2.1 SC 1.4.12 Text Spacing sweep: every page on the site (both
// languages), with the four spacing properties the success criterion
// requires readers be able to override - without losing content or
// functionality - force-applied via an injected stylesheet:
//   - line-height: at least 1.5 times the font size
//   - spacing following paragraphs: at least 2 times the font size
//   - letter spacing (tracking): at least 0.12 times the font size
//   - word spacing: at least 0.16 times the font size
// These are the exact minimums the success criterion text itself specifies,
// and the same four properties the widely-used Steve Faulkner text-spacing
// bookmarklet applies - this script is that bookmarklet as a permanent,
// unattended sweep instead of a one-off manual check.
//
// Distinct from `check:reflow`'s SC 1.4.10 (narrower viewport, same text
// metrics) and `check:text-zoom`'s SC 1.4.4 (200% root font-size, same
// spacing ratios): this axis stresses *spacing* specifically, which a page
// that already survives both of those can still fail - a fixed-height
// container or a line-clamp/overflow:hidden rule sized for single-line text
// can clip or overlap content once line-height/letter-spacing/word-spacing
// grow, independent of font-size or viewport width. Not a repeat of either
// existing sweep; a genuinely untested stress axis.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:lighthouse`/`check:reflow`/`check:text-zoom`/`check:print-width`
// document: a full per-page-load sweep (~700 pages) is much slower than this
// repo's other `check:*` scripts, so it stays a manual/intensive-run tool.
// Run manually (`pnpm check:text-spacing`) after `pnpm build`.
//
// Reuses `check-reflow.mjs`'s page discovery/redirect-stub filtering and
// `pagesOverflowing`/`OVERFLOW_TOLERANCE_PX` budget check, and the shared
// `astro preview` daemon dance/Chromium launcher from
// `scripts/preview-daemon.mjs`, the same way `check-text-zoom.mjs`/
// `check-print-width.mjs` already do - the only genuinely different step is
// *how* each page is stressed (an injected stylesheet overriding spacing,
// not a viewport change or a font-size override) before the same
// `scrollWidth - clientWidth` measurement every stress sweep in this repo
// already uses.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import {
  htmlFileToPagePath,
  isRedirectStubHtml,
  OVERFLOW_TOLERANCE_PX,
  pagesOverflowing,
} from './check-reflow.mjs';
import { launchChromium, startPreviewDaemon, stopPreviewDaemon } from './preview-daemon.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

// Same ordinary reading viewport `check-text-zoom.mjs` uses: SC 1.4.12, like
// SC 1.4.4, is about a reader's own text-metric accommodation, not a
// narrower window - `check:reflow` already owns the 320px axis.
const VIEWPORT = { width: 1280, height: 800 };

// The exact minimums SC 1.4.12 itself specifies, applied with `!important`
// so they override every component's own spacing rule the same way a
// reader's browser-level override would.
const TEXT_SPACING_CSS = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p {
    margin-bottom: 2em !important;
  }
`;

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
  await page.addStyleTag({ content: TEXT_SPACING_CSS });
  return page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
}

async function main() {
  const pagePaths = await listAllPages();
  console.log(`Found ${pagePaths.length} pages to sweep at WCAG 1.4.12 text spacing.`);

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
    await stopPreviewDaemon();
  }

  const failures = pagesOverflowing(measurements);

  if (failures.length === 0) {
    console.log(
      `\nAll ${pagePaths.length} pages have no horizontal overflow at WCAG 1.4.12 text spacing.`,
    );
    return;
  }

  console.error(`\n${failures.length} page(s) overflow at WCAG 1.4.12 text spacing:\n`);
  for (const { pagePath, overflow } of failures) {
    console.error(`  ${pagePath}: ${overflow}px`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard every full-site sweep script in this repo
// already establishes - without it, Vitest importing this file would also
// kick off a real `astro preview` + Chromium sweep as a side effect.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error(error);
    await stopPreviewDaemon();
    process.exitCode = 1;
  });
}
