// A fifth verification-ledger gate, sibling to `check-superlative-claims.mjs`
// ("the only X to Y"), `check-ordinal-claims.mjs` ("the first/.../tenth X to
// Y"), `check-record-claims.mjs` (most/record/youngest/oldest/etc.) and
// `check-consecutive-claims.mjs` (consecutive/back-to-back) - same mechanism,
// a different bug class: hand-written "at every X since Y"/"no equivalent
// existed at earlier editions" completeness claims in a `content/*.md` note
// bullet, asserting a companion award or format detail has covered every
// edition since a given year (and none before it). This bug class is
// distinctive in being the one claim shape on this site that is arithmetic
// rather than just cross-referential: the exact number of "earlier editions"
// a bullet names (when it names one) is only correct if it equals the actual
// count of editions before that year in the same file's own Editions/
// Champions-timeline table - easy to get wrong (or to leave stale after a
// past edit) without a bug ever showing up in the award's own per-year
// bullet list.
//
// Seeding the ledger (this run) checked all 23 current claims this pattern
// matches by counting each file's own Editions/Champions-timeline table
// directly and comparing against both the claimed start year and (where
// stated) the claimed count of earlier editions. Two genuine, previously
// unnoticed errors turned up: `content/fifa-world-cup.md`'s Fair Play Award
// bullet said "the four earlier editions" before 1970, but the Editions
// table lists eight (1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966); and
// `content/uefa-euro.md`'s Player of the Tournament bullet said "the four
// earlier editions" before 1996, but the Editions table lists nine (1960,
// 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992). Both were fixed in their
// English content and matching Croatian translation
// (`src/pages/hr/competitions/world-cup.astro` and `euro.astro`), and the
// Fair Play bullet's key updated in `superlative-claims-ledger.json` and
// `record-claims-ledger.json` (it also matches those checkers' trigger
// words). See `docs/PROJECT_STATUS.md`'s matching entry for the full
// per-claim verification writeup, including the several purely descriptive
// "since Y" bullets (eligibility-rule history, a format-milestone pointer,
// a companion-trophy start year) this pattern also catches that are not
// completeness claims at all - recorded as such rather than force-fit into
// a count that doesn't apply, the same honesty the other four ledgers
// already use for a claim shape that turns out not to apply.
//
// How it works: identical mechanism to the other four - every `content/*.md`
// bullet matching `/\bsince \d{4}\b/i` is extracted verbatim and diffed
// against `since-claims-ledger.json` (same directory); any claim with no
// exact-text ledger entry is new or edited and fails the build until it is
// checked against the source table it summarizes and recorded.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as the other four claim checkers, so this is wired
// into `.github/workflows/ci.yml` as a required PR gate immediately after
// `check:consecutive-claims`.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffClaimsAgainstLedger } from './check-superlative-claims.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'since-claims-ledger.json');

const CLAIM_PATTERN = /\bsince \d{4}\b/i;

/**
 * Pure: every top-level Markdown list item's text in `markdown` that mentions
 * "since <year>", in document order. Content pages on this site use only
 * flat, single-line `- ` bullets (no nested lists), so a per-line regex is
 * sufficient - no Markdown parser needed.
 */
export function extractSinceClaims(markdown) {
  const claims = [];
  for (const rawLine of markdown.split('\n')) {
    const match = /^-\s(.*)$/.exec(rawLine.trim());
    if (!match) continue;
    const text = match[1].trim();
    if (CLAIM_PATTERN.test(text)) claims.push(text);
  }
  return claims;
}

async function main() {
  const entries = await readdir(CONTENT_DIR);
  const mdFiles = entries.filter((name) => name.endsWith('.md')).sort();

  const claimsByFile = {};
  for (const name of mdFiles) {
    const relPath = path.join('content', name);
    const markdown = await readFile(path.join(CONTENT_DIR, name), 'utf8');
    claimsByFile[relPath] = extractSinceClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} "since <year>" claim(s) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from since-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current "since <year>" claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited "since <year>" claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes, then recorded in ` +
      `scripts/since-claims-ledger.json with a short note on how it was verified:\n`,
  );
  for (const { file, claim } of newClaims) {
    console.error(`  ${file}: "${claim}"`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
