// A systematic WCAG 2.2 AA SC 2.5.8 Target Size (Minimum) sweep, across
// every page on the site (both languages), at the 360px phone viewport
// `playwright.config.ts` and AGENTS.md's "Mobile-first UI conventions" both
// treat as this project's design baseline.
//
// Every touch-target check in this repo until now has been a hand-written
// per-page/per-component Playwright assertion (`tests/e2e/mobile.spec.ts`'s
// "every filter control is at least a 44px tap target", "the picker selects
// and swap button are at least 44px tap targets", "every drawer control is
// at least a 44px tap target", and others) - each one only exists because a
// prior run happened to measure that specific component. That leaves every
// *other* button/select/input on the site's ~700 pages with no coverage: a
// future component that ships an undersized control has nothing to fail
// until a human (or a future intensive run) thinks to write a matching
// hand-picked test for it.
//
// This script closes that gap the same way `check-reflow.mjs` closed the
// equivalent gap for 320px horizontal overflow: load every built page in a
// real browser at the site's phone baseline and measure every actual
// touch-facing control, site-wide, in one permanent sweep.
//
// Scope is deliberately limited to the controls AGENTS.md's "Interactive
// targets are at least 44px in any touch-facing control" convention is
// about - `button`, `select`, checkbox/radio/button/submit `input`s, and
// explicit `role="button"` elements - and deliberately excludes plain `<a>`
// hyperlinks. Most of this site's links are inline text references (team
// and player names inside prose and table cells, source citations,
// pagination words) that WCAG 2.5.8 itself exempts via its own "link is in
// a sentence or block of text" inline exception; a site-wide sweep that
// flagged every such link would bury real regressions under hundreds of
// false positives instead of guarding anything. Every hand-written 44px
// test this repo already has (cited above) also only ever measures buttons,
// selects, and the toggle/reset controls that behave like them - this
// script measures that exact same category, just across every page instead
// of the handful a human happened to pick.
//
// This project holds itself to a stricter floor than the WCAG minimum: SC
// 2.5.8 itself only requires 24x24 CSS px (with its own spacing/inline/
// essential/user-agent-control exceptions), but AGENTS.md's own convention
// is 44px with no exceptions carved out, matching every hand-written test
// above - so this sweep checks against 44px, not 24px.
//
// One more exception is still necessary, not carved out of scope but handled
// by measuring the right element: a checkbox/radio `<input>` wrapped in (or
// `for`-associated with) a `<label>` activates on a click anywhere in that
// label, not just the native control's own small rendered box - this site's
// quiz answer choices (`QuizCard.astro`'s `<label class="quiz-card__choice">
// <input type="radio" />...`) are exactly this pattern. `measureUndersized
// Controls()` resolves to the associated label for these two input types
// before measuring, the same way a real tap would.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:reflow`/`check:landscape`/`check:lighthouse` document: a full
// per-page-load sweep (~700 pages) is much slower than this repo's other
// `check:*` scripts, so it stays a manual/intensive-run tool rather than a
// required PR gate. Run manually (`pnpm check:target-size`) after `pnpm
// build`.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';
import { listHtmlFiles } from './check-internal-links.mjs';
import { launchChromium, startPreviewDaemon, stopPreviewDaemon } from './preview-daemon.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;

// The same 360px phone viewport playwright.config.ts uses for every other
// e2e test, and AGENTS.md's own mobile-first design baseline.
export const PHONE_VIEWPORT = { width: 360, height: 740 };

// AGENTS.md's own floor ("Interactive targets are at least 44px in any
// touch-facing control"), stricter than WCAG 2.5.8's 24px minimum - see this
// file's own doc comment above for why this script checks against this
// value rather than the WCAG baseline.
export const MIN_TARGET_PX = 44;

// The touch-facing control category AGENTS.md's convention is about -
// deliberately excludes plain `<a>` hyperlinks (see this file's own doc
// comment above).
export const TOUCH_TARGET_SELECTOR =
  'button, select, input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], [role="button"]';

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

/** Pure budget check: which measured controls fall short of the minimum, in the order they were measured. */
export function controlsBelowMinimum(measurements, thresholdPx = MIN_TARGET_PX) {
  return measurements.filter(({ width, height }) => width < thresholdPx || height < thresholdPx);
}

async function measureUndersizedControls(page, pagePath) {
  await page.goto(`${ORIGIN}${BASE}${pagePath}`);
  return page.evaluate(
    (selector) => {
      const describe = (el) => {
        const id = el.id ? `#${el.id}` : '';
        const label =
          el.getAttribute('aria-label') ??
          (el.textContent ?? '').trim().slice(0, 40) ??
          el.getAttribute('name') ??
          '';
        return `${el.tagName.toLowerCase()}${id} "${label}"`.trim();
      };
      // A checkbox/radio wrapped in (or associated with) a <label> activates
      // on a click anywhere in that label, not just the native control's own
      // small rendered box - this site's quiz answer choices
      // (QuizCard.astro's `<label class="quiz-card__choice"><input
      // type="radio" />...`) are exactly this pattern, and WCAG 2.5.8's
      // "target" for such a control is the whole clickable label, so that's
      // what gets measured for these two input types.
      const activationTargetFor = (el) => {
        if (el.tagName !== 'INPUT' || !['checkbox', 'radio'].includes(el.type)) return el;
        const wrapping = el.closest('label');
        if (wrapping) return wrapping;
        const associated = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
        return associated ?? el;
      };
      return Array.from(document.querySelectorAll(selector))
        .filter((el) => {
          const style = window.getComputedStyle(el);
          if (style.visibility === 'hidden' || style.display === 'none') return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((el) => {
          const rect = activationTargetFor(el).getBoundingClientRect();
          return { label: describe(el), width: rect.width, height: rect.height };
        });
    },
    TOUCH_TARGET_SELECTOR,
  );
}

async function main() {
  const pagePaths = await listAllPages();
  console.log(
    `Found ${pagePaths.length} pages to sweep for sub-${MIN_TARGET_PX}px touch targets at ${PHONE_VIEWPORT.width}x${PHONE_VIEWPORT.height}.`,
  );

  await startPreviewDaemon();
  const browser = await launchChromium();
  const context = await browser.newContext({ viewport: PHONE_VIEWPORT });
  const page = await context.newPage();

  const failuresByPage = [];
  try {
    for (const pagePath of pagePaths) {
      const controls = await measureUndersizedControls(page, pagePath);
      const undersized = controlsBelowMinimum(controls);
      if (undersized.length > 0) {
        failuresByPage.push({ pagePath, undersized });
        console.log(`  FAIL  ${pagePath}`);
        for (const { label, width, height } of undersized) {
          console.log(`          ${label}: ${width.toFixed(1)}x${height.toFixed(1)}px`);
        }
      }
    }
  } finally {
    await browser.close();
    await stopPreviewDaemon();
  }

  if (failuresByPage.length === 0) {
    console.log(
      `\nEvery touch-facing control on all ${pagePaths.length} pages is at least ${MIN_TARGET_PX}x${MIN_TARGET_PX}px at ${PHONE_VIEWPORT.width}px.`,
    );
    return;
  }

  console.error(`\n${failuresByPage.length} page(s) have an undersized touch target:\n`);
  for (const { pagePath, undersized } of failuresByPage) {
    console.error(`  ${pagePath}: ${undersized.length} control(s) below ${MIN_TARGET_PX}px`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard `check-reflow.mjs`/`check-landscape-
// viewport.mjs` already use, for the same reason: importing this module's
// exports from a unit test must not also race a second preview-server
// instance.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error(error);
    await stopPreviewDaemon();
    process.exitCode = 1;
  });
}
