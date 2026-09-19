// A full-site click-through reachability sweep: starting from the two
// homepages (English `/` and Croatian `/hr/`), follows only `<a href="...">`
// navigation links to build the set of pages a real reader can actually
// click their way to, then checks that every indexable (non-`noindex`) built
// page is in that set.
//
// Distinct from every existing link/sitemap check, which none of them
// currently verify: `check:links` confirms every `href`/`src` attribute on
// every tag (including `<link rel="canonical">`, JSON-LD `url` fields, and
// PDF download links) resolves to a real file - it never asks whether any
// page actually links *to* a given page, only whether a page's own outgoing
// references are valid. `check:sitemap` confirms every indexable page has a
// matching `sitemap.xml` `<loc>` entry, which covers search-engine
// discoverability but not on-site navigation - a page can be listed in the
// sitemap and still have zero inbound `<a href>` from anywhere a reader
// would actually browse, making it invisible to anyone not arriving via a
// search engine or a direct URL. This script is the first thing on the site
// that walks the real click-through graph and would catch that class of bug
// (e.g. a new page shipped without wiring its link into any index/list
// page it should have appeared on).
//
// Only `<a href>` tags count as navigation - a `<link rel="canonical">` or a
// JSON-LD `url` field isn't something a reader can click, so counting those
// as reachability edges (the way check:links' `extractLinks` deliberately
// does, since it needs to validate every reference regardless of tag) would
// hide a real orphan page behind an SEO-only reference to itself.
//
// The site's four legacy `/awards/*` redirect stubs and `/404` are expected
// to fail this check by design (see check-reflow.mjs's own
// `isRedirectStubHtml` comment) - a redirect stub exists only for an old
// bookmarked URL, and the 404 page exists only to be shown after a failed
// navigation, so neither is ever meant to have an inbound link from this
// site's own pages. Both already carry `<meta name="robots" content=
// "noindex">` (parsePageHead, reused from check-sitemap.mjs), so this script
// exempts every noindex page rather than hardcoding those four paths plus
// `/404` - the same "let the existing noindex signal do the work" approach
// check:sitemap already uses for its own exclusions.
//
// This site's shared nav/footer/index-page components already link out to
// every section, so this sweep is expected to find nothing today - the same
// "confirm there's a real signal, but keep the tool permanent"
// reasoning check:jsonld/check:heading-outline/check:reflow/check:text-zoom/
// check:print-width already established for a clean first run. It exists to
// catch the next orphaned page, not to report one now.
//
// Plain regex extraction over already-built HTML plus an in-memory BFS - the
// same territory as check:jsonld/check:links/check:sitemap/
// check:heading-outline (well under a second for all 711 pages, no build or
// browser needed beyond the static HTML already on disk) - so it's wired
// into `.github/workflows/ci.yml` as a required PR gate alongside those.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles, classifyLink, candidateDistPaths } from './check-internal-links.mjs';
import { htmlFileToPagePath } from './check-reflow.mjs';
import { parsePageHead } from './check-sitemap.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

// The site's two independent nav trees - every other page is expected to be
// reachable by clicking through from one of these two.
const ENTRY_POINTS = ['index.html', 'hr/index.html'];

/** Pure: every `href="..."` value from an `<a>` tag only (not `<link>`/`<script>`/etc.), deduplicated, in source order. */
export function extractAnchorHrefs(html) {
  const hrefs = [];
  for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
    const match = tag.match(/\shref="([^"]*)"/);
    if (match) hrefs.push(match[1]);
  }
  return [...new Set(hrefs)];
}

/**
 * Pure: breadth-first walk of a page graph (dist-relative file path -> raw
 * HTML) starting from `entryPoints`, following only same-site `<a href>`
 * navigation. Returns the set of dist-relative file paths reachable by
 * clicking through the site from the given starting pages.
 */
export function findReachablePages(pagesByFile, entryPoints) {
  const visited = new Set();
  const queue = [...entryPoints];

  while (queue.length > 0) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    visited.add(file);

    const html = pagesByFile.get(file);
    if (!html) continue;

    for (const href of extractAnchorHrefs(html)) {
      const classified = classifyLink(href);
      if (classified.kind !== 'internal') continue;

      const resolved = candidateDistPaths(classified.path).find((candidate) => pagesByFile.has(candidate));
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }

  return visited;
}

async function main() {
  let files;
  try {
    files = await listHtmlFiles(DIST_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`No build output found at ${path.relative(ROOT, DIST_DIR)}. Run \`pnpm build\` first.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const pagesByFile = new Map();
  for (const file of files) {
    const rel = path.relative(DIST_DIR, file).split(path.sep).join('/');
    pagesByFile.set(rel, await readFile(file, 'utf8'));
  }

  console.log(
    `Checking whether all ${pagesByFile.size} pages are reachable by clicking through the site from its two homepages...`,
  );

  const reachable = findReachablePages(pagesByFile, ENTRY_POINTS);

  const orphans = [];
  let excludedNoindex = 0;
  for (const [rel, html] of pagesByFile) {
    if (reachable.has(rel)) continue;
    if (parsePageHead(html).noindex) {
      excludedNoindex += 1;
      continue;
    }
    orphans.push(htmlFileToPagePath(DIST_DIR, path.join(DIST_DIR, rel)));
  }

  if (orphans.length === 0) {
    console.log(
      `\nEvery indexable page is reachable from the homepage (${reachable.size} reached; ${excludedNoindex} noindex page(s) correctly excluded).`,
    );
    return;
  }

  orphans.sort();
  console.error(`\n${orphans.length} indexable page(s) have no inbound <a href> from anywhere reachable on the site:\n`);
  for (const pagePath of orphans) {
    console.error(`  ${pagePath}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
