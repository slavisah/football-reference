// Cross-checks every grouped (thousands-separated) number inside a "Final
// venues" note section against its Croatian counterpart's own hand-translated
// bullet, on the actual built output - a locale-formatting angle nothing
// before this run checked. English groups thousands with a comma (`55,000`);
// Croatian groups them with a period instead (`55.000`, comma reserved for
// decimals) - the opposite convention. Every attendance figure on these pages
// is hand-typed twice, once per language file (`content/*.md` for English,
// each `src/pages/hr/competitions/<family>.astro`'s own `notes`/
// `CROATIAN_MOMENTS`-style array for Croatian - see `check:i18n-notes`'s own
// header comment for why the two arrays are intentionally decoupled), so a
// translator could type `55,000` verbatim into the Croatian array (an
// English-locale number quietly stranded on an otherwise fully Croatian
// page) or transpose a digit while re-typing it, and nothing before this
// check would catch either: `check:i18n-notes` only compares section/item
// *counts*, never digit content, and `check:spelling`/`check:html`/
// `check:jsonld` have no opinion on numeral formatting at all.
//
// What's checked, per matched EN/HR page pair, restricted to sections whose
// heading matches the "Final venues" translations (the only note sections on
// this site that carry an attendance figure - `content/ballon-dor.md`/
// `golden-boot.md` have none): for each list item, in order, every
// comma-grouped English number and every period-grouped Croatian number,
// normalized to plain digits and compared positionally. A digit mismatch,
// a missing/extra group on either side, or an English-style comma-grouped
// number found on the Croatian page (or vice versa) is reported.
// Deliberately does not touch the *year* label at the start of each bullet
// (`1970.`/`1970:`) - `\d{1,3}(?:[.,]\d{3})+` requires a three-digit group
// after the separator, which a bare four-digit year never has, so the year
// can never be mistaken for a grouped number by this same regex on either
// side.
//
// Plain regex extraction over already-built HTML, no browser launch - the
// same territory as `check:i18n-notes`/`check:links`/`check:jsonld` (well
// under a second for all 711 pages), so this is wired into
// `.github/workflows/ci.yml` as a required PR gate rather than joining the
// four slower Playwright sweeps as a manual/intensive-run-only tool.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';
import { hrCounterpart } from './check-i18n-notes.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

// Every "Final venues" heading this site currently uses, English and
// Croatian (all four team-competition families share one Croatian label,
// "Final venues"/"Mjesta finala" - see the Croatian-heading-naming
// reconciliation `docs/ROADMAP.md` already records).
const FINAL_VENUES_HEADINGS = new Set(['Final venues', 'Mjesta finala']);

/**
 * Pure: extracts every note-card list item's plain text (heading-tagged),
 * restricted to `FINAL_VENUES_HEADINGS` sections, from a built page's HTML,
 * in document order. Mirrors `check-i18n-notes.mjs`'s own `<section
 * class="notes__card card">` extraction, but keeps each `<li>`'s text
 * instead of just counting them.
 */
export function extractFinalVenuesItems(html) {
  const items = [];
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = cardRe.exec(html))) {
    const body = match[1];
    const headingMatch = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(body);
    // The heading's own leading `<span aria-hidden="true">📝</span>` emoji
    // survives tag-stripping as a leaf character, so match by suffix rather
    // than exact equality.
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const matchesFinalVenues = [...FINAL_VENUES_HEADINGS].some((h) => heading.endsWith(h));
    if (!matchesFinalVenues) continue;

    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let liMatch;
    while ((liMatch = liRe.exec(body))) {
      items.push(liMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
  }
  return items;
}

/**
 * Pure: every thousands-grouped number in `text` using `separator` as the
 * group divider (`,` for English, `.` for Croatian), normalized to its plain
 * digit string (groups stripped of the separator). Requires at least one
 * full three-digit group after the leading 1-3 digits, so a bare year
 * (`1970`) or its Croatian dotted form (`1970.`) never matches either
 * pattern.
 */
export function extractGroupedNumbers(text, separator) {
  const sep = separator === '.' ? '\\.' : separator;
  const re = new RegExp(`\\d{1,3}(?:${sep}\\d{3})+`, 'g');
  const matches = text.match(re) ?? [];
  return matches.map((group) => group.split(separator === '.' ? '.' : ',').join(''));
}

/**
 * Pure: diffs one EN/HR "Final venues" item pair's grouped numbers -
 * returns human-readable problem strings, empty when they agree. `label`
 * identifies the item pair (page paths plus item index) for the message.
 */
export function diffAttendanceNumbers(enText, hrText, label) {
  const enGroups = extractGroupedNumbers(enText, ',');
  const hrGroups = extractGroupedNumbers(hrText, '.');
  // An English-locale comma-grouped number stranded on the Croatian page
  // (or a Croatian-locale period-grouped number stranded on the English
  // page) is its own distinct bug, worth its own message.
  const stray = [];
  const strayOnHr = extractGroupedNumbers(hrText, ',');
  const strayOnEn = extractGroupedNumbers(enText, '.');
  if (strayOnHr.length > 0) {
    stray.push(`${label}: Croatian text uses English-style comma grouping (${strayOnHr.join(', ')})`);
  }
  if (strayOnEn.length > 0) {
    stray.push(`${label}: English text uses Croatian-style period grouping (${strayOnEn.join(', ')})`);
  }
  if (stray.length > 0) return stray;

  if (enGroups.length !== hrGroups.length) {
    return [
      `${label}: EN has ${enGroups.length} grouped number(s) [${enGroups.join(', ')}] but HR has ` +
        `${hrGroups.length} [${hrGroups.join(', ')}]`,
    ];
  }

  const problems = [];
  for (let i = 0; i < enGroups.length; i++) {
    if (enGroups[i] !== hrGroups[i]) {
      problems.push(`${label}: number ${i} is ${enGroups[i]} in English but ${hrGroups[i]} in Croatian`);
    }
  }
  return problems;
}

async function main() {
  const files = await listHtmlFiles(DIST_DIR);
  const htmlByPagePath = new Map();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (isRedirectStubHtml(html)) continue;
    htmlByPagePath.set(htmlFileToPagePath(DIST_DIR, file), html);
  }

  const enPagePaths = [...htmlByPagePath.keys()]
    .filter((pagePath) => pagePath !== '/hr' && !pagePath.startsWith('/hr/'))
    .sort();

  let checkedPairs = 0;
  const problems = [];
  for (const enPath of enPagePaths) {
    const hrPath = hrCounterpart(enPath);
    const hrHtml = htmlByPagePath.get(hrPath);
    if (!hrHtml) continue;

    const enItems = extractFinalVenuesItems(htmlByPagePath.get(enPath));
    const hrItems = extractFinalVenuesItems(hrHtml);
    if (enItems.length === 0 && hrItems.length === 0) continue;

    checkedPairs++;
    if (enItems.length !== hrItems.length) {
      problems.push(
        `${enPath} / ${hrPath}: EN "Final venues" has ${enItems.length} item(s) but HR has ${hrItems.length}`,
      );
      continue;
    }

    for (let i = 0; i < enItems.length; i++) {
      problems.push(...diffAttendanceNumbers(enItems[i], hrItems[i], `${enPath} / ${hrPath} item ${i}`));
    }
  }

  console.log(`Checked ${checkedPairs} "Final venues" page pair(s) for EN/HR attendance-number formatting.`);

  if (problems.length === 0) {
    console.log('\nEvery attendance figure matches between languages, each using its own locale\'s thousands separator.');
    return;
  }

  console.error(`\n${problems.length} attendance-formatting problem(s) found:\n`);
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
