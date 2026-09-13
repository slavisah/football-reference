// Flags any pair of links on the same built page that share an identical
// accessible name (visible text, or `aria-label` when present) but point at
// different destinations - a real WCAG 2.4.4 problem nothing before this run
// checked site-wide. A screen reader's "links list" (NVDA/JAWS/VoiceOver all
// offer one) shows every link on a page by its accessible name alone, out of
// visual/table/heading context; two links reading identically but going
// different places are indistinguishable in that list, even though sighted
// context (a table row's Host column, a card's heading) makes them obvious
// on screen.
//
// This is the same bug class the References-section disambiguation fix
// (`disambiguateLabels()` in src/lib/sources.ts) already fixed for merged
// citation lists - this check is the site-wide sweep that fix was never
// extended to, and caught two more real, previously-unchecked instances of
// it: `/about/sources`' per-heading citation lists collided across headings
// (a bullet cited under both the FIFA World Cup and UEFA EURO headings can
// independently earn the same "(source 1 of 3)" suffix), and Copa América's
// two 1959 editions rendered two Year-column links both reading plain "1959"
// with no accessible way to tell them apart (see TournamentTable.astro's
// `duplicateYears`). Both are fixed; this script exists to keep it that way.
//
// The one known, accepted exception is 404.html: GitHub Pages serves it for
// any unmatched URL under the base path regardless of which language the
// reader was in, so it shows "Popular pages"/"Popularne stranice" side by
// side in both languages (see src/pages/404.astro's own doc comment) - a
// handful of competition names (EURO, Copa América) are spelled identically
// in both languages, so their English- and Croatian-section links
// legitimately collide by text. Each pair sits under its own `<h2>` (English
// vs Croatian) and the Croatian section is marked `lang="hr"`, satisfying
// WCAG 2.4.4's "or programmatically determined context" clause even though
// link text alone doesn't disambiguate them (2.4.9, the link-text-alone
// variant, is AAA-only and not a target for this site) - a deliberate,
// reviewed exception, not an oversight.
//
// Plain regex extraction over already-built HTML, no browser needed - the
// same territory as check:links/check:sitemap/check:jsonld/check:meta/
// check:i18n-notes (well under a second for all 711 pages), so this is wired
// into `.github/workflows/ci.yml` as a required PR gate.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

// The one deliberate, reviewed exception - see the file-level comment above.
const EXCEPTED_PAGE_PATHS = new Set(['/404.html']);

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

/**
 * Every `<a href="...">...</a>` on the page, paired with its accessible name:
 * the `aria-label` attribute when present (it overrides everything else for
 * accessible-name computation), otherwise the link's text content with any
 * `aria-hidden="true"` descendant (a decorative icon glyph/svg, e.g.
 * Nav.astro's brand mark) stripped out first. Doesn't attempt full HTML
 * accessible-name-computation generality (nested `aria-hidden` siblings of
 * different tag names, `aria-labelledby`, `<img alt>` inside a link, ...) -
 * a corpus-scan of every `<a>`-emitting component in src/ found none of those
 * shapes in this codebase, only plain text and the one aria-hidden-icon
 * pattern this handles; the goal is a real signal on this site's actual
 * markup, not a general-purpose accessible-name computer.
 */
export function extractAnchors(html) {
  const anchors = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = re.exec(html))) {
    const [, attrs, inner] = match;
    const hrefMatch = attrs.match(/\shref="([^"]*)"/);
    if (!hrefMatch) continue;
    const ariaLabelMatch = attrs.match(/\saria-label="([^"]*)"/);
    const name = ariaLabelMatch
      ? decodeEntities(ariaLabelMatch[1])
      : stripTags(inner.replace(/<([a-z0-9]+)\b[^>]*\saria-hidden="true"[^>]*>[\s\S]*?<\/\1>/gi, ''));
    if (!name) continue; // an empty accessible name is axe-core's link-name rule's territory, not this check's.
    anchors.push({ href: hrefMatch[1], name });
  }
  return anchors;
}

/**
 * Every accessible name used by more than one distinct href on this one
 * page, each with its sorted, deduplicated list of hrefs - pure so it's unit
 * testable without a built page.
 */
export function findAmbiguousLinkNames(html) {
  const hrefsByName = new Map();
  for (const { href, name } of extractAnchors(html)) {
    if (!hrefsByName.has(name)) hrefsByName.set(name, new Set());
    hrefsByName.get(name).add(href);
  }

  return [...hrefsByName.entries()]
    .filter(([, hrefs]) => hrefs.size > 1)
    .map(([name, hrefs]) => ({ name, hrefs: [...hrefs].sort() }));
}

async function main() {
  const files = await listHtmlFiles(DIST_DIR);
  let checked = 0;
  const problems = [];

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (isRedirectStubHtml(html)) continue;

    const pagePath = htmlFileToPagePath(DIST_DIR, file);
    if (EXCEPTED_PAGE_PATHS.has(pagePath)) continue;
    checked++;

    for (const { name, hrefs } of findAmbiguousLinkNames(html)) {
      problems.push(
        `${pagePath}: "${name}" links to ${hrefs.length} different destinations (${hrefs.join(', ')})`,
      );
    }
  }

  console.log(`Checked ${checked} pages for same-page links sharing an accessible name but different destinations...`);

  if (problems.length === 0) {
    console.log('\nNo ambiguous link names found: every accessible link name on every page points at exactly one destination.');
    return;
  }

  console.error(`\n${problems.length} ambiguous link name(s) found:\n`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
