// Verifies the offline install path (PWA manifest + service worker) against
// the actual build output - nothing previously checked this either direction.
// tests/unit/offlineCache.test.ts and tests/unit/manifest.test.ts only ever
// call buildPrecacheUrls()/buildManifest() as pure functions in isolation:
// they confirm the function's *output* is internally consistent with
// NAV_LINKS/TRANSLATED_PATHS, but never confirm that output, once actually
// served as dist/sw.js and dist/manifest.webmanifest, points at real files -
// exactly the gap that let the canonical/hreflang trailing-slash bug
// (docs/PROJECT_STATUS.md, 2026-08-13) ship unnoticed for the sitemap. A
// single wrong path in the real generated sw.js would fail `cache.addAll()`
// atomically at install time (per the Cache API spec, one missing resource
// aborts the whole precache), silently breaking offline reading for every
// nav page, in a way no existing check would catch.
//
// This script closes that gap in both directions:
// - every URL service worker's PRECACHE_URLS list (parsed from the real
//   dist/sw.js, not the source function) resolves to a real file in dist/;
// - every icon `src` and the `start_url` in both built manifest.webmanifest
//   files resolve to a real file in dist/;
// - every link in the primary nav on the real built home page, in both
//   languages (the actual reachable page set a reader can click through to,
//   parsed from dist/index.html and dist/hr/index.html rather than re-read
//   from src/lib/routes.ts - the same "ground-truth against dist, not
//   source" choice check-sitemap.mjs already makes), has a matching
//   PRECACHE_URLS entry, so a future nav page wired into the nav but not
//   into the precache list (or vice versa) is caught here.
//
// Run manually (`pnpm check:precache`) after `pnpm build`, or from CI - see
// .github/workflows/ci.yml. Exits non-zero, listing every mismatch found.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyLink, candidateDistPaths } from './check-internal-links.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

/**
 * Extracts the `PRECACHE_URLS` array literal that `src/pages/sw.js.ts` bakes
 * into the generated `sw.js` text at build time. Regex-based, matching this
 * project's established choice (check-sitemap.mjs) to parse its own
 * generator's fixed, single-line output rather than pull in a JS parser.
 */
export function parsePrecacheUrls(swJs) {
  const match = swJs.match(/const PRECACHE_URLS = (\[[^\]]*\]);/);
  if (!match) throw new Error('could not find PRECACHE_URLS in sw.js');
  return JSON.parse(match[1]);
}

/**
 * Every `href="..."` inside the primary `<nav aria-label="...">` landmark on
 * a built page - the real, reachable set of top-level pages a reader can
 * click through to from that page, independent of src/lib/routes.ts.
 */
export function parseNavLinks(html) {
  const navMatch = html.match(/<nav aria-label="[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
  if (!navMatch) throw new Error('could not find the primary <nav> landmark');
  return [...navMatch[1].matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
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

/** Resolves an absolute internal URL to a dist/ file, or null if it doesn't. */
async function resolveDistFile(href) {
  const classified = classifyLink(href);
  if (classified.kind !== 'internal') return null;
  for (const candidate of candidateDistPaths(classified.path)) {
    if (await fileExists(path.join(DIST_DIR, candidate))) return candidate;
  }
  return null;
}

async function readManifest(distPath) {
  const raw = await readFile(path.join(DIST_DIR, distPath), 'utf8');
  return JSON.parse(raw);
}

async function main() {
  let swJs;
  let homeHtml;
  let homeHrHtml;
  try {
    swJs = await readFile(path.join(DIST_DIR, 'sw.js'), 'utf8');
    homeHtml = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
    homeHrHtml = await readFile(path.join(DIST_DIR, 'hr', 'index.html'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Missing build output under ${path.relative(ROOT, DIST_DIR)}. Run \`pnpm build\` first.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const problems = [];
  const precacheUrls = parsePrecacheUrls(swJs);

  // 1. Every precached URL resolves to a real file - a broken entry here
  // would fail the service worker's cache.addAll() for every visitor.
  for (const url of precacheUrls) {
    const distFile = await resolveDistFile(url);
    if (!distFile) {
      problems.push(`sw.js precaches "${url}", which does not resolve to any built file`);
    }
  }

  // 2. Every manifest icon and start_url resolves to a real file.
  const manifests = [
    { locale: 'en', distPath: 'manifest.webmanifest' },
    { locale: 'hr', distPath: path.join('hr', 'manifest.webmanifest') },
  ];
  for (const { locale, distPath } of manifests) {
    const manifest = await readManifest(distPath);
    const startUrlFile = await resolveDistFile(manifest.start_url);
    if (!startUrlFile) {
      problems.push(`${locale} manifest.webmanifest's start_url "${manifest.start_url}" does not resolve to any built page`);
    }
    for (const icon of manifest.icons ?? []) {
      const iconFile = await resolveDistFile(icon.src);
      if (!iconFile) {
        problems.push(`${locale} manifest.webmanifest's icon "${icon.src}" does not resolve to any built file`);
      }
    }
  }

  // 3. Every real nav link, in both languages, is precached - so a page
  // wired into the nav but never added to the precache list (or removed
  // from it without removing the nav entry) doesn't ship unnoticed.
  const precacheSet = new Set(precacheUrls);
  const navChecks = [
    { locale: 'en', html: homeHtml },
    { locale: 'hr', html: homeHrHtml },
  ];
  for (const { locale, html } of navChecks) {
    for (const href of parseNavLinks(html)) {
      if (classifyLink(href).kind !== 'internal') continue;
      if (!precacheSet.has(href)) {
        problems.push(`${locale} nav links to "${href}", which sw.js does not precache`);
      }
    }
  }

  console.log(`Checked ${precacheUrls.length} precached URLs against the build output.`);
  if (problems.length === 0) {
    console.log('Offline install path matches the build: every precached URL and manifest asset resolves, and every nav link is precached.');
    return;
  }

  console.error(`\n${problems.length} precache problem(s):\n`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
