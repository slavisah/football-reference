// A full-site heading-outline sweep - parses every `<h1>`-`<h6>` on every
// built page and validates the two invariants a correct document outline
// depends on that nothing on this site had ever verified against the actual
// built output before: exactly one `<h1>` per page, and no heading level
// skipping ahead of the highest level seen so far (an `<h2>` followed
// directly by an `<h4>`, with no intervening `<h3>` anywhere above it).
// Distinct from every existing check: `check:html`'s `html-validate` pass
// validates HTML5 markup structure, not heading-level sequencing (nesting
// `<h4>` straight inside `<h2>` is perfectly valid HTML5); `check:lighthouse`
// samples 37 pages' accessibility *score*, which doesn't fail on a skipped
// heading level; and axe-core (run across the e2e suite) flags a page with
// zero headings but has no rule for a level skip either - none of the three
// would catch a future edit that drops a `<h2>` wrapper from a shared
// section component and quietly turns every `<h3>` under it into a level
// skip for every page that renders it.
//
// This site's shared layout/section components already put a single `<h1>`
// at the top of every page and step section headings down one level at a
// time, so this sweep is expected to find nothing today - the same "confirm
// there's a real signal, but keep the tool permanent" reasoning
// `check:jsonld`/`check:reflow`/`check:text-zoom`/`check:print-width`
// already established for a clean first run. It exists to catch the *next*
// regression, not to report one now.
//
// Plain regex extraction over already-built HTML, the same territory as
// `check:jsonld`/`check:links`/`check:sitemap` - a couple of seconds for all
// 711 pages, no build or browser needed beyond the static HTML already on
// disk - so it's wired into `.github/workflows/ci.yml` as a required PR gate
// right after the JSON-LD structural-validity check.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

const HEADING_RE = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

function stripTags(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pure: pulls every `<h1>`-`<h6>` out of a page's raw HTML, in document order. */
export function extractHeadings(html) {
  const headings = [];
  for (const match of html.matchAll(HEADING_RE)) {
    headings.push({ level: Number(match[1]), text: stripTags(match[2]) });
  }
  return headings;
}

/**
 * Pure: validates one page's heading outline, returning a flat list of
 * issue strings (empty if the outline is clean).
 */
export function checkHeadingOutline(headings) {
  const issues = [];

  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (h1Count === 0) {
    issues.push('page has no <h1>');
  } else if (h1Count > 1) {
    issues.push(`page has ${h1Count} <h1> elements, expected exactly 1`);
  }

  let maxSeenLevel = 0;
  for (const heading of headings) {
    if (maxSeenLevel > 0 && heading.level > maxSeenLevel + 1) {
      const label = heading.text ? ` ("${heading.text}")` : '';
      issues.push(`heading level jumps from h${maxSeenLevel} to h${heading.level}${label} (skips a level)`);
    }
    maxSeenLevel = Math.max(maxSeenLevel, heading.level);
  }

  return issues;
}

/** Pure: validates one page's raw HTML, returning one failure entry per problem found. */
export function checkPageHeadingOutline(pagePath, html) {
  const headings = extractHeadings(html);
  return checkHeadingOutline(headings).map((issue) => ({ pagePath, issue }));
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
  console.log(`Validating the heading outline on ${files.length} pages...`);

  const allFailures = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const pagePath = htmlFileToPagePath(DIST_DIR, file);
    allFailures.push(...checkPageHeadingOutline(pagePath, html));
  }

  if (allFailures.length === 0) {
    console.log(`\nEvery page's heading outline is clean: exactly one <h1>, no skipped levels (${files.length} checked).`);
    return;
  }

  console.error(`\n${allFailures.length} heading-outline violation(s) found:\n`);
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
