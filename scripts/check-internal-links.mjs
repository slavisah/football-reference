// Crawls the built site for broken internal links - a stale or mistyped
// `href`/`src` (nav, footer, home cards, cross-links between pages, PDF
// download links, canonical/hreflang tags, JSON-LD urls) that would 404 for
// a real reader. Nothing previously checked this: check-page-weight.mjs
// resolves each page's CSS refs but silently treats a missing asset as 0
// bytes rather than an error (see resolveDistAsset/measurePage), so a broken
// CSS link wouldn't fail that check either. This script is the first thing
// on the site that actually verifies every internal link resolves to a real
// file in the build output.
//
// Also verifies every same-page fragment link (e.g. the skip-link's
// `href="#main"`) targets an `id` that actually exists on that page - the
// same "silently broken for one specific reader" bug class as a 404 link,
// just for keyboard/screen-reader users instead of everyone.
//
// External links (http(s) URLs outside this site) are intentionally out of
// scope - this environment's egress policy blocks outbound WebFetch/HTTP to
// third-party hosts (the same "source-link liveness infeasible here" caveat
// every content-accuracy audit in docs/PROJECT_STATUS.md has already noted),
// so there's no way to verify those resolve from this sandbox.
//
// Run manually (`pnpm check:links`) after `pnpm build`, or from CI - see
// .github/workflows/ci.yml. Exits non-zero, listing every broken link, if
// any internal href/src or same-page fragment target doesn't resolve.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

// Matches astro.config.mjs's own default/override, so this can't silently
// check the wrong prefix if SITE_URL/BASE_PATH is ever overridden in CI.
const SITE_ORIGIN = (process.env.SITE_URL ?? 'https://slavisah.github.io').replace(/\/$/, '');
const BASE_PATH = (process.env.BASE_PATH ?? '/football-reference').replace(/\/$/, '');

/** Every `href="..."` / `src="..."` attribute value on the page, deduplicated, in source order. */
export function extractLinks(html) {
  const matches = html.matchAll(/\s(?:href|src)="([^"]*)"/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

/**
 * Classifies a raw attribute value as a same-page `fragment` (e.g. "#main"),
 * `internal` (rewritten to the path relative to BASE_PATH, fragment/query
 * stripped), or `external`/`skip` (out of this script's scope). Handles both
 * link forms this site actually emits: base-path-relative ("/football-
 * reference/records") and absolute ("https://slavisah.github.io/football-
 * reference/records", used in canonical/hreflang/JSON-LD/sitemap).
 */
export function classifyLink(href) {
  if (href.startsWith('#')) return { kind: 'fragment', target: href.slice(1) };
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return { kind: 'skip' };
  if (/^https?:\/\//.test(href)) {
    if (!href.startsWith(SITE_ORIGIN)) return { kind: 'external' };
    const rest = href.slice(SITE_ORIGIN.length);
    return classifyLink(rest || '/');
  }
  if (BASE_PATH && !href.startsWith(BASE_PATH)) return { kind: 'external' };
  const withoutBase = BASE_PATH ? href.slice(BASE_PATH.length) : href;
  const withoutHash = withoutBase.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return { kind: 'internal', path: withoutQuery || '/' };
}

/**
 * File paths under `dist/` (relative, no leading slash) worth checking for
 * an internal path - in priority order, since Astro's `format: 'directory'`
 * output means an extensionless path is a directory with its own
 * `index.html`, while an asset path (`.css`, `.pdf`, `.xml`, ...) is a file.
 */
export function candidateDistPaths(internalPath) {
  const clean = internalPath === '' ? '/' : internalPath;
  const trimmed = clean.replace(/^\/+/, '').replace(/\/+$/, '');
  if (trimmed === '') return ['index.html'];
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(trimmed);
  return hasExtension ? [trimmed] : [`${trimmed}/index.html`, `${trimmed}.html`];
}

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(full);
      return entry.name.endsWith('.html') ? [full] : [];
    }),
  );
  return files.flat();
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Every `id="..."` present on the page, for verifying same-page fragment links. */
function extractIds(html) {
  const matches = html.matchAll(/\sid="([^"]*)"/g);
  return new Set([...matches].map((m) => m[1]));
}

async function checkPage(filePath) {
  const html = await readFile(filePath, 'utf8');
  const pageName = path.relative(DIST_DIR, filePath);
  const ids = extractIds(html);
  const broken = [];

  for (const href of extractLinks(html)) {
    const classified = classifyLink(href);
    if (classified.kind === 'external' || classified.kind === 'skip') continue;

    if (classified.kind === 'fragment') {
      if (!ids.has(classified.target)) {
        broken.push({ page: pageName, href, reason: `no element with id="${classified.target}" on this page` });
      }
      continue;
    }

    const candidates = candidateDistPaths(classified.path);
    const results = await Promise.all(candidates.map((c) => fileExists(path.join(DIST_DIR, c))));
    if (!results.some(Boolean)) {
      broken.push({ page: pageName, href, reason: `no file at dist/${candidates.join(' or dist/')}` });
    }
  }

  return broken;
}

async function main() {
  let htmlFiles;
  try {
    htmlFiles = await listHtmlFiles(DIST_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`No build output found at ${path.relative(ROOT, DIST_DIR)}. Run \`pnpm build\` first.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const results = await Promise.all(htmlFiles.map(checkPage));
  const broken = results.flat();

  console.log(`Checked ${htmlFiles.length} pages.`);
  if (broken.length === 0) {
    console.log('No broken internal links or fragment targets found.');
    return;
  }

  console.error(`\n${broken.length} broken internal link(s)/fragment target(s):\n`);
  for (const { page, href, reason } of broken) {
    console.error(`  ${page}: "${href}" - ${reason}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
