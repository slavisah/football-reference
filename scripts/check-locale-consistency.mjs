// A full-site sweep verifying every built page's `<html lang="...">`
// attribute agrees with which language tree it was actually built into -
// `en` for every page outside `/hr/`, `hr` for every page under it. Nothing
// previously checked this. `locale` is a per-page prop each route file
// passes to `BaseLayout.astro` by hand (`locale="hr"` on every `src/pages/
// hr/**` file, the default `'en'` everywhere else) - unlike `alternateHref`/
// canonical/hreflang, which all derive from `Astro.url.pathname` itself, a
// copy-pasted new Croatian route file that forgets to pass `locale="hr"`
// would build at a `/hr/...` URL yet render with `lang="en"`, English nav
// strings (`t(locale, ...)`) and an English `og:locale` - wrong for a reader
// there and for a screen reader announcing the page's language, but
// invisible to every existing check: `check:sitemap`/`check:links` only
// verify hrefs resolve and agree with each other, `check:jsonld` only
// checks structural validity, and axe-core's `html-has-lang`/`html-lang-
// valid` rules only check a `lang` attribute is present and well-formed,
// never that it matches the URL a reader actually navigated to.
//
// This site's route files already get this right everywhere (each `src/
// pages/hr/**` file passes `locale="hr"` at its own `<BaseLayout>` call
// site), so this sweep is expected to find nothing today - the same
// "confirm a real signal, keep the tool permanent" outcome every recent
// `check:*` addition (`check:heading-outline`/`check:reachability`/
// `check:image-dimensions`) has had for its own first clean run. It exists
// to catch the next regression, not to report one now.
//
// Plain regex extraction over already-built HTML, the same territory as
// `check:links`/`check:sitemap`/`check:jsonld` - well under a second for all
// 711 pages, no build or browser needed beyond the static HTML already on
// disk - so it's wired into `.github/workflows/ci.yml` as a required PR
// gate, the same reasoning every other sub-second `check:*` script already
// documents.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

const HTML_LANG_RE = /<html\s+lang="([^"]*)"/;

/** Pure: which `lang` value a page at this site-relative path is expected to declare. */
export function expectedLocale(pagePath) {
  return pagePath === '/hr/' || pagePath.startsWith('/hr/') ? 'hr' : 'en';
}

/** Pure: pulls the `<html lang="...">` value out of a page's raw HTML, or null if absent. */
export function extractHtmlLang(html) {
  const match = html.match(HTML_LANG_RE);
  return match ? match[1] : null;
}

/**
 * Pure: validates one page's declared `lang` against its own URL path,
 * returning an issue string, or null if it's correct.
 */
export function checkPageLocale(pagePath, lang) {
  const expected = expectedLocale(pagePath);
  if (lang === null) {
    return `has no <html lang="..."> attribute at all (expected lang="${expected}")`;
  }
  if (lang !== expected) {
    return `<html lang="${lang}"> does not match its own URL (expected lang="${expected}")`;
  }
  return null;
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
  console.log(`Checking <html lang> against URL on ${files.length} pages...`);

  const failures = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const pagePath = htmlFileToPagePath(DIST_DIR, file);
    const issue = checkPageLocale(pagePath, extractHtmlLang(html));
    if (issue) failures.push({ pagePath, issue });
  }

  if (failures.length === 0) {
    console.log(`\nEvery page's <html lang> matches its own URL (${files.length} checked).`);
    return;
  }

  console.error(`\n${failures.length} locale mismatch(es) found:\n`);
  for (const { pagePath, issue } of failures) {
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
