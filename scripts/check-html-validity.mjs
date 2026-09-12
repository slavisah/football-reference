// A full-site HTML5 markup-validity sweep, using `html-validate` to parse
// every built page and check it against the HTML5 content model (not
// accessibility semantics, which `check:lighthouse`/the `axe`-based e2e specs
// already cover exhaustively, and not visual layout, which
// `check:reflow`/`check:text-zoom`/`check:print-width` already cover) -
// duplicate `id`s, `aria-*` references pointing at nothing, invalid element
// nesting, missing required attributes, and similar structural defects no
// prior intensive run had ever checked with a dedicated tool.
//
// Built by first running `html-validate:recommended` against the whole site
// to see what a generic ruleset actually flags here, the same
// spot-check-before-automating method `check:text-zoom`
// (docs/PROJECT_STATUS.md, eighty-second run) and `check:spelling`
// (eighty-fifth run) both used. That surfaced six distinct rule IDs; five are
// deliberate site conventions, not defects (see DISABLED_RULES below for each
// one's reasoning), but the sixth - `aria-label-misuse` - was a real,
// previously-undetected bug: `TournamentTable.astro`'s empty "story" cell
// wrapped its `aria-label` in a bare `<span>`, whose implicit ARIA role
// (`generic`) prohibits an author-supplied accessible name per the ARIA
// spec - `axe-core` has no rule for this specific misuse, so none of this
// site's many `axe` sweeps had ever caught it. The `aria-label` silently had
// no effect for every reader whose screen reader takes the mobile-viewport
// `content: attr(data-label)` CSS pseudo-content path (invisible to most
// assistive tech) instead of the desktop table-header path - exactly the
// oversight this attribute existed to paper over. Fixed by moving the
// `aria-label` up to the enclosing `<td>` (role `cell`, which does support an
// author-supplied name), matching the two sibling `<td>`s in the same
// component that already used this exact pattern correctly.
//
// Kept as a permanent, reusable script (not a one-off finding) so a future
// markup change that reintroduces a duplicate id, a dangling aria-*
// reference, or similar reintroduces this exact class of bug gets caught
// automatically, the same standing-tool reasoning every other `check:*`
// script in this repo already established. Not wired into
// `.github/workflows/ci.yml`: unlike `check:spelling` (under a second),
// re-parsing all 711 pages takes ~45 seconds - closer to
// `check:lighthouse`/`check:reflow`'s territory than `check:links`/
// `check:sitemap`'s, so it stays a manual/intensive-run tool like those two.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HtmlValidate } from 'html-validate';
import { listHtmlFiles } from './check-internal-links.mjs';
import { isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

// Rules `html-validate:recommended` flagged across the whole site that are
// deliberate conventions here, not defects - each confirmed by reading the
// actual flagged markup, not assumed from the rule name alone.
const DISABLED_RULES = {
  // Every filter/search `<form role="search">` on the site (team/player
  // search, the four team-competition landing-page year/host/winner
  // filters) is a live client-side filter with no submission to trigger -
  // the same JS-driven-filter, no-submit-button convention this site has
  // used since the filter controls first shipped. Not a missing feature.
  'wcag/h32': 'off',
  // Custom comboboxes/listboxes (the header team/player search autocomplete
  // in Nav.astro) are a deliberate ARIA authoring-practices widget, not an
  // oversight that a native `<select>` would fix - a `<select>` can't offer
  // live-filtered, keyboard-navigable suggestions the way this site's search
  // needs to.
  'prefer-native-element': 'off',
  // The four files using `style={...}` (TournamentTable.astro,
  // ChampionsSummary.astro, both index.astro home pages) all set a
  // per-instance computed value (a bar-chart width percentage, a table
  // column stat) that has no static class to express - the standard,
  // accepted pattern for data-driven inline styles.
  'no-inline-style': 'off',
  // Astro's compiler emits `<!DOCTYPE html>` (uppercase) itself; no `.astro`
  // file declares its own doctype to fix. Cosmetic casing only - both forms
  // are equally valid HTML5.
  'doctype-style': 'off',
  // 133 pages exceed the rule's 70-character title budget, but every one is
  // `<specific name> - <suffix> · The Ultimate Football Reference` - a
  // deliberate, site-wide branded-suffix convention (BaseLayout.astro),
  // not a per-page authoring slip. Shortening it site-wide is a branding
  // decision needing human sign-off, not an automated fix; left as a
  // documented, consciously-not-pursued finding rather than silently
  // disabled with no trace - see docs/ROADMAP.md's matching entry.
  'long-title': 'off',
};

function buildValidator() {
  return new HtmlValidate({
    extends: ['html-validate:recommended'],
    rules: DISABLED_RULES,
  });
}

/** Pure: turn one page's html-validate Report into a flat list of failures (empty if valid). */
export function reportToFailures(pagePath, report) {
  const failures = [];
  for (const result of report.results) {
    for (const message of result.messages) {
      failures.push({
        pagePath,
        ruleId: message.ruleId,
        line: message.line,
        column: message.column,
        message: message.message,
      });
    }
  }
  return failures;
}

async function listContentPages() {
  const files = await listHtmlFiles(DIST_DIR);
  const pages = await Promise.all(
    files.map(async (file) => {
      const html = await readFile(file, 'utf8');
      return isRedirectStubHtml(html) ? null : file;
    }),
  );
  return pages.filter((file) => file !== null).sort();
}

async function main() {
  const files = await listContentPages();
  console.log(`Validating ${files.length} pages against the HTML5 content model...`);

  const validator = buildValidator();
  const allFailures = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const report = await validator.validateString(html);
    if (!report.valid) {
      const pagePath = path.relative(DIST_DIR, file).split(path.sep).join('/');
      allFailures.push(...reportToFailures(pagePath, report));
    }
  }

  if (allFailures.length === 0) {
    console.log(`\nAll ${files.length} pages are valid HTML5 (no markup-validity violations).`);
    return;
  }

  console.error(`\n${allFailures.length} markup-validity violation(s) found:\n`);
  for (const { pagePath, ruleId, line, column, message } of allFailures) {
    console.error(`  ${pagePath}:${line}:${column}  [${ruleId}]  ${message}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
