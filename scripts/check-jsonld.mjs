// A full-site schema.org JSON-LD structural-validity sweep - parses every
// <script type="application/ld+json"> block on every built page and checks
// it against the invariants `src/lib/jsonLd.ts`'s builders are all supposed
// to uphold, but that nothing on this site had ever verified against the
// actual built output before: valid JSON, a real "@context"/"@type" pair at
// the root, every "itemListElement" a non-empty array whose "position"
// values are exactly 1..N with no gap or duplicate, and every "url"/"item"
// URL string absolute and pointing at this site's own configured origin
// (not a relative path or a foreign domain a template-string typo could
// produce). Distinct from every existing check: `check:html` validates HTML5
// markup structure (and treats a <script type="application/ld+json"> body as
// opaque text, the same way browsers do), `check:lighthouse`'s SEO category
// doesn't parse a page's structured data at the field level, and
// `tests/unit/jsonLd.test.ts` only ever calls each builder directly with a
// hand-built fixture - none of the three would catch a future edit that
// slips a relative URL into a builder call site, or maps `itemListElement`
// from an already-filtered array without re-deriving `position` from the new
// index.
//
// Every one of this site's ~80 generated-ranking JSON-LD blocks is built by
// mapping straight off an array's own index (`.map((x, index) => ({
// position: index + 1, ... }))`), so this sweep is expected to find nothing
// today - the same "confirm there's a real signal, but keep the tool
// permanent" reasoning `check:reflow`/`check:text-zoom`/`check:print-width`
// already established for a clean first run. It exists to catch the *next*
// regression, not to report one now.
//
// Unlike the four full-site Playwright sweeps (`check:lighthouse`/
// `check:reflow`/`check:text-zoom`/`check:print-width`, each a real browser
// load per page) or even `check:html`'s ~45s `html-validate` parse, this is
// plain regex extraction plus `JSON.parse` over already-built HTML - about
// 3 seconds for all 711 pages, the same territory as `check:links`/
// `check:sitemap`. So it *is* wired into `.github/workflows/ci.yml` as a
// required PR gate, the same reasoning `check:spelling` documents for its
// own sub-second check.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const SITE_URL = process.env.SITE_URL ?? 'https://slavisah.github.io';
const BASE_PATH = process.env.BASE_PATH ?? '/football-reference';
export const SITE_ORIGIN = `${SITE_URL}${BASE_PATH}`;

const JSON_LD_BLOCK_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

/** Pure: pulls every JSON-LD `<script>` body out of a page's raw HTML, in document order. */
export function extractJsonLdBlocks(html) {
  const blocks = [];
  for (const match of html.matchAll(JSON_LD_BLOCK_RE)) {
    blocks.push(match[1]);
  }
  return blocks;
}

function isAbsoluteSiteUrl(value, siteOrigin) {
  return typeof value === 'string' && value.startsWith(siteOrigin);
}

/**
 * Pure: walks one already-parsed JSON-LD object and returns a flat list of
 * structural-invariant violations (empty if the object is clean). `path` is
 * a JS-expression-like breadcrumb for error messages (e.g.
 * "$.itemListElement[2].item").
 */
export function validateJsonLdObject(root, siteOrigin) {
  const issues = [];

  if (root === null || typeof root !== 'object' || Array.isArray(root)) {
    return ['root JSON-LD value must be an object'];
  }
  if (root['@context'] !== 'https://schema.org') {
    issues.push(`$: "@context" must be "https://schema.org", got ${JSON.stringify(root['@context'])}`);
  }

  function walk(node, nodePath) {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${nodePath}[${index}]`));
      return;
    }
    if (node === null || typeof node !== 'object') return;

    if ('@type' in node && (typeof node['@type'] !== 'string' || node['@type'].length === 0)) {
      issues.push(`${nodePath}: "@type" must be a non-empty string, got ${JSON.stringify(node['@type'])}`);
    }
    if ('position' in node && (!Number.isInteger(node.position) || node.position < 1)) {
      issues.push(`${nodePath}: "position" must be a positive integer, got ${JSON.stringify(node.position)}`);
    }
    for (const key of ['url', 'item']) {
      const value = node[key];
      if (typeof value === 'string' && !isAbsoluteSiteUrl(value, siteOrigin)) {
        issues.push(`${nodePath}.${key}: expected an absolute "${siteOrigin}..." URL, got ${JSON.stringify(value)}`);
      }
    }
    if ('itemListElement' in node) {
      const list = node.itemListElement;
      if (!Array.isArray(list) || list.length === 0) {
        issues.push(`${nodePath}.itemListElement: must be a non-empty array, got ${JSON.stringify(list)}`);
      } else {
        const positions = list.map((item) => (item && typeof item === 'object' ? item.position : undefined));
        const expected = list.map((_, index) => index + 1);
        const actual = [...positions].sort((a, b) => (a ?? 0) - (b ?? 0));
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          issues.push(
            `${nodePath}.itemListElement: "position" values must be exactly 1..${list.length} with no gap or ` +
              `duplicate, got ${JSON.stringify(positions)}`,
          );
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === '@type' || key === 'position') continue;
      walk(value, `${nodePath}.${key}`);
    }
  }

  walk(root, '$');
  return issues;
}

/** Pure: validates every JSON-LD block on one page, returning one failure entry per problem found. */
export function checkPageJsonLd(pagePath, html, siteOrigin) {
  const blocks = extractJsonLdBlocks(html);
  const failures = [];

  if (blocks.length === 0) {
    failures.push({ pagePath, blockIndex: -1, issue: 'page has no JSON-LD blocks at all' });
    return failures;
  }

  blocks.forEach((raw, blockIndex) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      failures.push({ pagePath, blockIndex, issue: `invalid JSON: ${error.message}` });
      return;
    }
    for (const issue of validateJsonLdObject(parsed, siteOrigin)) {
      failures.push({ pagePath, blockIndex, issue });
    }
  });

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
  console.log(`Validating JSON-LD on ${files.length} pages against origin "${SITE_ORIGIN}"...`);

  const allFailures = [];
  let blockCount = 0;
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const pagePath = htmlFileToPagePath(DIST_DIR, file);
    blockCount += extractJsonLdBlocks(html).length;
    allFailures.push(...checkPageJsonLd(pagePath, html, SITE_ORIGIN));
  }

  if (allFailures.length === 0) {
    console.log(`\nAll ${blockCount} JSON-LD blocks across ${files.length} pages are structurally valid.`);
    return;
  }

  console.error(`\n${allFailures.length} JSON-LD violation(s) found:\n`);
  for (const { pagePath, blockIndex, issue } of allFailures) {
    console.error(`  ${pagePath} [block ${blockIndex}]  ${issue}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
