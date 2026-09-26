// Guards the one ordering invariant `BaseLayout.astro`'s before-paint theme
// script depends on to avoid a flash of the wrong theme: the inline
// `<script is:inline>` that reads `localStorage`/`prefers-color-scheme` and
// sets `document.documentElement.dataset.theme` must run *before* the page's
// external stylesheet `<link>` in `<head>`, so a dark-mode reader's very
// first paint already carries the right `[data-theme]` selector instead of
// briefly rendering under `global.css`'s light-mode defaults. Astro injects
// that stylesheet `<link>` automatically at build time - its position in
// `<head>` isn't something `BaseLayout.astro`'s own source controls or
// documents, so a routine edit that moves the inline script later in the
// component (after the `<link rel="stylesheet">` markers Astro's own
// bundler adds) or a future Astro version that starts injecting the
// stylesheet link earlier could silently reintroduce the flash with no
// existing check catching it: `check:html` validates markup structure, not
// tag order; `check:jsonld`/`check:heading-outline` don't look at `<head>`
// ordering either; and nothing in the e2e suite screenshots the very first
// paint before hydration.
//
// A direct read of every built page confirmed the invariant holds today (the
// theme script always precedes any stylesheet link, four legacy
// `/awards/*` redirect stubs correctly excluded - they have no `<head>` of
// their own to check) - the same "confirm a real signal, keep the tool
// permanent" reasoning `check:jsonld`/`check:heading-outline`/`check:reflow`
// already established for a clean first run. Plain regex over already-built
// HTML, no browser needed - wired into `.github/workflows/ci.yml` alongside
// the other fast `check:*` gates.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

const THEME_SCRIPT_MARKER = /localStorage\.getItem\(['"]theme['"]\)/;
const STYLESHEET_LINK_RE = /<link[^>]*\brel="stylesheet"[^>]*>/i;

/** Pure: extracts a page's raw `<head>...</head>` contents, or null if absent. */
export function extractHead(html) {
  const match = /<head>([\s\S]*?)<\/head>/i.exec(html);
  return match ? match[1] : null;
}

/**
 * Pure: validates that a page's `<head>` runs the theme pre-paint script
 * before any external stylesheet link, returning a flat list of issue
 * strings (empty if clean).
 */
export function checkThemeScriptOrder(headHtml) {
  const scriptMatch = THEME_SCRIPT_MARKER.exec(headHtml);
  if (!scriptMatch) {
    return ['missing the theme pre-paint script in <head>'];
  }

  const linkMatch = STYLESHEET_LINK_RE.exec(headHtml);
  if (linkMatch && linkMatch.index < scriptMatch.index) {
    return [
      'a <link rel="stylesheet"> appears before the theme pre-paint script (risks a flash of the wrong theme)',
    ];
  }

  return [];
}

/** Pure: validates one page's raw HTML, returning one failure entry per problem found. */
export function checkPageThemeFlash(pagePath, html) {
  const head = extractHead(html);
  if (head === null) {
    return [{ pagePath, issue: 'page has no <head>' }];
  }
  return checkThemeScriptOrder(head).map((issue) => ({ pagePath, issue }));
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
  console.log(`Checking the theme pre-paint script's ordering on ${files.length} pages...`);

  const allFailures = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const pagePath = htmlFileToPagePath(DIST_DIR, file);
    allFailures.push(...checkPageThemeFlash(pagePath, html));
  }

  if (allFailures.length === 0) {
    console.log(
      `\nEvery page runs the theme pre-paint script before any stylesheet link: no flash-of-wrong-theme risk found (${files.length} checked).`,
    );
    return;
  }

  console.error(`\n${allFailures.length} theme-flash risk(s) found:\n`);
  for (const { pagePath, issue } of allFailures) {
    console.error(`  ${pagePath}  ${issue}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
