// A systematic WCAG 2.2 SC 2.4.13 Focus Appearance sweep, across every page
// on the site (both languages).
//
// `src/styles/global.css`'s shared `:focus-visible` rule (`outline: 3px
// solid var(--focus); outline-offset: 2px;`) is the site's one deliberate
// focus-ring style, applied via a hand-picked selector list (`a,
// button, select, input, summary, [tabindex]`). The hundred-and-fortieth
// intensive run found that list had missed `summary` - every `<details>`
// disclosure trigger fell back to the browser's own default ring, which
// rendered as a near-invisible ~1.04:1 contrast ratio in dark mode - and
// that bug shipped and sat undetected because no sweep had ever actually
// focused every element on every page and read back its computed outline;
// the gap was only found by a human noticing the selector list was
// incomplete, not by any automated check. This script closes that gap the
// same way `check-target-size.mjs`/`check-reflow.mjs` closed their own
// equivalent gaps: load every built page in a real browser, focus every
// focusable element in turn, and flag any whose computed outline would fall
// back to "no ring at all" - the one failure mode a future component (a new
// custom widget, a third-party-style control, an inline `style` override)
// could reintroduce without anyone noticing, exactly as `summary` once did.
//
// Scope and an explicit limitation: SC 2.4.13 has three sub-requirements -
// Area (the ring covers enough of the component's perimeter), Contrast (at
// least 3:1 against both the unfocused component and the adjacent page
// background), and not being hidden by other content. This script checks
// only the structural precondition all three depend on: that a real,
// non-zero-width outline (or box-shadow acting as one) exists at all once an
// element is focused. It does not sample rendered pixel colours to compute a
// contrast ratio - the same reasoning the dark-mode winner-cell/leader-cell
// contrast audits already documented elsewhere in this codebase (measured
// once by a human against the actual token values, not re-derived from
// pixels by every future sweep) applies here: this site's `--focus`/
// `--dark-focus` tokens were chosen and measured for contrast when
// `:focus-visible` was first authored, and every focusable element sharing
// that one rule is the reason a single human check still covers all of
// them. What this script guards against is a *different* component quietly
// falling outside that shared rule - via a missing selector, a more specific
// CSS rule that overrides it, or `outline: none` - the exact shape of bug
// that already happened once.
//
// Not wired into .github/workflows/ci.yml, the same reasoning
// `check:target-size`/`check:reflow`/`check:lighthouse` document: a full
// per-page-load sweep (~700 pages) is much slower than this repo's other
// `check:*` scripts, so it stays a manual/intensive-run tool rather than a
// required PR gate. Run manually (`pnpm check:focus-appearance`) after
// `pnpm build`.

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
// e2e test, and AGENTS.md's own mobile-first design baseline. Focus-ring
// styling in this codebase carries no viewport-specific media query (see
// global.css's own `:focus-visible` rule), so one viewport is sufficient to
// catch a missing/overridden ring - the same single-viewport scope
// `check-target-size.mjs` uses for the same reason.
export const PHONE_VIEWPORT = { width: 360, height: 740 };

// WCAG 2.2 SC 2.4.13's own Area sub-requirement is defined against a
// perimeter at least 2 CSS px thick - the floor this script checks against,
// distinct from AGENTS.md's unrelated 44px *touch-target-size* convention.
export const MIN_OUTLINE_WIDTH_PX = 2;

// Mirrors global.css's own `:focus-visible` selector list, since that's the
// exact set of elements this site intends to carry a visible ring - plus a
// plain `[tabindex]` catch-all for any custom widget that opts an element
// into the tab order without also being one of the native tags above.
export const FOCUSABLE_SELECTOR = 'a[href], button, select, input, summary, [tabindex]';

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

/** Pure budget check: which focus measurements have no visible ring, in the order they were measured. */
export function controlsMissingFocusRing(measurements, thresholdPx = MIN_OUTLINE_WIDTH_PX) {
  return measurements.filter(({ outlineWidth, hasBoxShadow }) => outlineWidth < thresholdPx && !hasBoxShadow);
}

async function measureFocusRings(page, pagePath) {
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
      const candidates = Array.from(document.querySelectorAll(selector)).filter((el) => {
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
        const tabindex = el.getAttribute('tabindex');
        if (tabindex !== null && Number(tabindex) < 0) return false;
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return candidates.map((el) => {
        el.focus();
        const style = window.getComputedStyle(el);
        const outlineWidth = style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth) || 0;
        // A box-shadow-based ring (not used today, but a legitimate
        // alternative focus-indicator technique) would make outline-width
        // irrelevant - recorded so controlsMissingFocusRing() doesn't flag
        // a future component that deliberately chooses that technique
        // instead of `outline`.
        const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow !== '';
        el.blur();
        return { label: describe(el), outlineWidth, hasBoxShadow };
      });
    },
    FOCUSABLE_SELECTOR,
  );
}

async function main() {
  const pagePaths = await listAllPages();
  console.log(
    `Found ${pagePaths.length} pages to sweep for focusable controls with no visible focus ring (WCAG 2.4.13) at ${PHONE_VIEWPORT.width}x${PHONE_VIEWPORT.height}.`,
  );

  await startPreviewDaemon();
  const browser = await launchChromium();
  const context = await browser.newContext({ viewport: PHONE_VIEWPORT });
  const page = await context.newPage();

  const failuresByPage = [];
  try {
    for (const pagePath of pagePaths) {
      const measurements = await measureFocusRings(page, pagePath);
      const missing = controlsMissingFocusRing(measurements);
      if (missing.length > 0) {
        failuresByPage.push({ pagePath, missing });
        console.log(`  FAIL  ${pagePath}`);
        for (const { label, outlineWidth } of missing) {
          console.log(`          ${label}: outline-width ${outlineWidth}px`);
        }
      }
    }
  } finally {
    await browser.close();
    await stopPreviewDaemon();
  }

  if (failuresByPage.length === 0) {
    console.log(
      `\nEvery focusable control on all ${pagePaths.length} pages has a visible focus ring of at least ${MIN_OUTLINE_WIDTH_PX}px.`,
    );
    return;
  }

  console.error(`\n${failuresByPage.length} page(s) have a control with no visible focus ring:\n`);
  for (const { pagePath, missing } of failuresByPage) {
    console.error(`  ${pagePath}: ${missing.length} control(s) with no ring`);
  }
  process.exitCode = 1;
}

// Same import-side-effect guard check-reflow.mjs/check-target-size.mjs
// already use, for the same reason: importing this module's exports from a
// unit test must not also race a second preview-server instance.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error(error);
    await stopPreviewDaemon();
    process.exitCode = 1;
  });
}
