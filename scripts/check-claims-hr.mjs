// Cross-checks every already-verified claim in the five verification-ledger
// files (`superlative-claims-ledger.json`, `ordinal-claims-ledger.json`,
// `record-claims-ledger.json`, `consecutive-claims-ledger.json`,
// `since-claims-ledger.json`) against its Croatian counterpart page's own
// hand-translated note prose, on the actual built output - a gap none of
// those five checkers close themselves, since each is deliberately scoped to
// `content/*.md` (English) only (see each script's own header comment). A
// claim's English wording is re-verified against its source table before it
// ever enters a ledger, but nothing before this script has ever checked that
// the *Croatian* translation of that same claim still asserts the same
// underlying fact - a mistranslation or a stale Croatian bullet (left
// unfixed after the English one was corrected) would ship silently, the same
// failure mode `check:i18n-notes`/`check:attendance-format` already guard
// against for section structure and grouped-number formatting respectively,
// but for claim content specifically.
//
// Doing this precisely (verifying the Croatian bullet asserts the exact same
// fact as its English counterpart) isn't tractable with plain regex - that
// requires actually understanding both languages' prose, the same
// NLP-claim-extraction problem `check-superlative-claims.mjs`'s own header
// comment already rules out for a from-scratch checker. What plain
// regex/string matching *can* verify cheaply and reliably is that the two
// languages' claims share the same numeric anchors: every four-digit year
// (1900-2099) named in a verified English claim must also appear somewhere
// in that claim's page family's Croatian note prose, and - narrower still,
// scoped to the exact bug class `check-since-claims.mjs`'s own ledger-seeding
// pass already found twice in English alone (`content/fifa-world-cup.md`'s
// Fair Play Award bullet and `content/uefa-euro.md`'s Player of the
// Tournament bullet both originally miscounted "the four earlier editions"
// when the real count was eight/nine) - a spelled-out "the <N> earlier
// editions" cardinal count must have its Croatian numeral translation present
// too. Neither check proves the Croatian sentence means the same thing
// (a manual read is still the only way to be sure of that - see this script's
// own matching `docs/PROJECT_STATUS.md` entry for the full one-time manual
// audit this script's first run performed, which found zero discrepancies
// across all five ledgers), but a year or count silently missing from the
// Croatian side is a strong, cheap, low-noise signal that something drifted.
//
// Known limitation, found while self-testing this script against a
// deliberately introduced bug before committing it (see the same
// `docs/PROJECT_STATUS.md` entry): a year is checked for presence anywhere
// in the page family's combined note prose, not specifically within the
// Croatian sentence that translates the matching English claim - a
// mistranslated year that happens to also appear correctly in a *different*
// bullet on the same page (e.g. an eligibility-rule bullet mentioning the
// same year as a separate award-history bullet) would not be caught. Real
// per-claim positional pairing (the way `check-attendance-format.mjs`
// compares EN/HR "Final venues" items index-by-index) would close this, but
// needs each ledger claim mapped to its exact note-section/item index on
// both languages' pages, which the ledgers don't currently track - left as a
// concrete next step rather than attempted half-built here. This check still
// reliably catches a year or count that is missing from the Croatian page
// *entirely*, the shape most new content (a freshly added edition's year, a
// newly corrected count word) actually takes.
//
// The cardinal-word dictionary is deliberately narrow (two through twelve
// only, the range these claims actually use) and only fires on the exact
// "the <word> earlier edition(s)" phrase `check-since-claims.mjs`'s own
// `CLAIM_PATTERN` doubles down on - not a general number-word translator,
// which would need to handle Croatian's grammatical-case agreement (a
// genuinely hard problem this script deliberately stays out of) for the much
// wider range of number words this site's prose uses in other contexts
// (goal tallies, squad counts, trophy counts). Two through twelve modifying
// a neuter plural noun like "izdanja" (editions) take an invariant cardinal
// form in Croatian regardless of case, which is what keeps this narrow slice
// safe to check by plain substring match.
//
// Plain regex extraction over already-built HTML, no browser needed - the
// same territory as `check:i18n-notes`/`check:attendance-format` (well under
// a second for all 711 pages), so this is wired into
// `.github/workflows/ci.yml` as a required PR gate immediately after
// `check:attendance-format`.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';
import { hrCounterpart } from './check-i18n-notes.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

const LEDGER_FILES = [
  'superlative-claims-ledger.json',
  'ordinal-claims-ledger.json',
  'record-claims-ledger.json',
  'consecutive-claims-ledger.json',
  'since-claims-ledger.json',
];

// Every `content/*.md` file any ledger keys claims under, mapped to the
// English page path whose Croatian counterpart (via `hrCounterpart()`)
// carries that file's hand-translated note prose. `quiz.md` is deliberately
// omitted: `record-claims-ledger.json`'s one `content/quiz.md` entry
// describes a dynamically generated question type, not a per-edition
// completeness claim tied to a specific page's prose (see that ledger's own
// entry note), so there is no Croatian note section to check it against.
const CONTENT_FILE_TO_PAGE_PATH = {
  'content/ballon-dor.md': '/competitions/ballon-dor/',
  'content/copa-america.md': '/competitions/copa-america/',
  'content/fifa-world-cup.md': '/competitions/world-cup/',
  'content/golden-boot.md': '/competitions/golden-boot/',
  'content/uefa-euro.md': '/competitions/euro/',
  'content/uefa-nations-league.md': '/competitions/nations-league/',
};

const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;

// Deliberately narrow - see the header comment above for why this stops at
// twelve rather than becoming a general number-word translator.
const EARLIER_EDITIONS_PATTERN = /\bthe (\w+) earlier editions?\b/i;
const CARDINAL_EN_TO_HR = {
  two: 'dva',
  three: 'tri',
  four: 'četiri',
  five: 'pet',
  six: 'šest',
  seven: 'sedam',
  eight: 'osam',
  nine: 'devet',
  ten: 'deset',
  eleven: 'jedanaest',
  twelve: 'dvanaest',
};

/** Pure: every distinct four-digit (1900-2099) year mentioned in `text`. */
export function extractYears(text) {
  return [...new Set(text.match(YEAR_PATTERN) ?? [])];
}

/**
 * Pure: the Croatian cardinal numeral a claim's "the <word> earlier
 * edition(s)" phrase should translate to, or `null` if the claim doesn't
 * match that phrase or uses a count word outside `CARDINAL_EN_TO_HR`'s
 * deliberately narrow two-through-twelve range.
 */
export function extractEarlierEditionsCardinal(text) {
  const match = EARLIER_EDITIONS_PATTERN.exec(text);
  if (!match) return null;
  return CARDINAL_EN_TO_HR[match[1].toLowerCase()] ?? null;
}

/**
 * Pure: the concatenated plain text of every `.notes__card` section on a
 * built page - the same section this site's five claim ledgers' underlying
 * prose renders into on the English side, and where its Croatian
 * translation lives too. Mirrors `check-i18n-notes.mjs`'s own `.notes__card`
 * extraction and `check-attendance-format.mjs`'s tag-stripping.
 */
export function extractNotesPlainText(html) {
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let text = '';
  let match;
  while ((match = cardRe.exec(html))) {
    text += `${match[1].replace(/<[^>]+>/g, ' ')} `;
  }
  return text;
}

/**
 * Pure: diffs one page family's verified claims against its Croatian notes
 * text, returning human-readable problem strings - empty when every claim's
 * years (and, where applicable, earlier-editions cardinal) are present.
 */
export function diffClaimsAgainstHrNotes(claims, hrNotesText, contentFile, hrPath, ledgerName) {
  const problems = [];
  for (const claim of claims) {
    const years = extractYears(claim);
    const missingYears = years.filter((year) => !hrNotesText.includes(year));
    if (missingYears.length > 0) {
      problems.push(
        `${ledgerName}: ${contentFile}'s claim "${claim}" names ${missingYears.join(', ')} but ` +
          `${hrPath}'s note prose doesn't mention ${missingYears.length === 1 ? 'it' : 'them'}`,
      );
    }

    const cardinal = extractEarlierEditionsCardinal(claim);
    if (cardinal && !hrNotesText.includes(cardinal)) {
      problems.push(
        `${ledgerName}: ${contentFile}'s claim "${claim}" names a count that should translate to ` +
          `"${cardinal}" but ${hrPath}'s note prose doesn't contain it`,
      );
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

  const hrNotesTextByPagePath = new Map();
  const problems = [];
  let totalClaims = 0;

  for (const ledgerFile of LEDGER_FILES) {
    const ledgerPath = path.join(ROOT, 'scripts', ledgerFile);
    const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));

    for (const [contentFile, claims] of Object.entries(ledger)) {
      const pagePath = CONTENT_FILE_TO_PAGE_PATH[contentFile];
      if (!pagePath) continue; // e.g. content/quiz.md - see the mapping's own comment.

      const hrPath = hrCounterpart(pagePath);
      if (!hrNotesTextByPagePath.has(hrPath)) {
        const hrHtml = htmlByPagePath.get(hrPath);
        hrNotesTextByPagePath.set(hrPath, hrHtml ? extractNotesPlainText(hrHtml) : null);
      }
      const hrNotesText = hrNotesTextByPagePath.get(hrPath);
      if (hrNotesText === null) {
        problems.push(`${ledgerFile}: no built Croatian page found at ${hrPath} for ${contentFile}`);
        continue;
      }

      const claimTexts = Object.keys(claims);
      totalClaims += claimTexts.length;
      problems.push(...diffClaimsAgainstHrNotes(claimTexts, hrNotesText, contentFile, hrPath, ledgerFile));
    }
  }

  console.log(
    `Checked ${totalClaims} verified claim(s) across ${LEDGER_FILES.length} verification ledgers against their Croatian note prose...`,
  );

  if (problems.length === 0) {
    console.log('\nEvery verified claim\'s years (and applicable earlier-editions counts) are present on its Croatian counterpart page.');
    return;
  }

  console.error(`\n${problems.length} claim/Croatian-translation anchor mismatch(es) found:\n`);
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
