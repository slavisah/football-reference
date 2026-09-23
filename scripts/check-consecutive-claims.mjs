// A fourth verification-ledger gate, sibling to `check-superlative-claims.mjs`
// ("the only X to Y"), `check-ordinal-claims.mjs` ("the first/.../tenth X to
// Y") and `check-record-claims.mjs` (most/record/youngest/oldest/etc.) - same
// mechanism, a different bug class: hand-written "consecutive"/"back-to-back"
// claims in a `content/*.md` note bullet, asserting that a person or team
// achieved something in immediately successive editions. This is a distinct
// bug class from the other three: a claim like "his second, back-to-back"
// or "Chile's second consecutive title" names neither an ordinal-plus-"to"
// pattern nor an "only" exclusivity, so neither existing checker's pattern
// reliably catches it, and several such bullets in `content/copa-america.md`
// (the manager/captain "back-to-back" note lines) matched no existing ledger
// before this checker was added.
//
// Seeding the ledger (this run) checked all current claims this pattern
// matches: every one cross-referenced cleanly against the champions/winners
// table it summarizes (e.g. Alfio Basile's 1991/1993 and Lionel Scaloni's
// 2021/2024 Copa América manager entries both check out against the Champions
// timeline table's consecutive Argentina titles in those year pairs; Eduardo
// Vargas's 2016 Golden Boot "second consecutive win" checks out against his
// own 2015 entry two lines above it). No false claim turned up seeding this
// ledger, unlike the ordinal and superlative ledgers' own seeding runs - but
// the checker itself is the same standing guard against a *future* one
// slipping in unverified, which is the point of building it even on a clean
// pass.
//
// How it works: identical mechanism to the other three - every `content/*.md`
// bullet matching `/\b(consecutive|back-to-back)\b/i` is extracted verbatim
// and diffed against `consecutive-claims-ledger.json` (same directory); any
// claim with no exact-text ledger entry is new or edited and fails the build
// until it is checked against the source table it summarizes and recorded.
// A bullet can (and several do) also match another checker's pattern - e.g.
// a bullet using both "the only" and "consecutive" needs an entry in both
// ledgers - which is fine: each ledger's job is to catch its own claim shape
// going stale, independent of what else a given bullet happens to say.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as the other three claim checkers, so this is wired
// into `.github/workflows/ci.yml` as a required PR gate immediately after
// `check:record-claims`.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffClaimsAgainstLedger } from './check-superlative-claims.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'consecutive-claims-ledger.json');

const CLAIM_PATTERN = /\b(consecutive|back-to-back)\b/i;

/**
 * Pure: every top-level Markdown list item's text in `markdown` that mentions
 * "consecutive" or "back-to-back", in document order. Content pages on this
 * site use only flat, single-line `- ` bullets (no nested lists), so a
 * per-line regex is sufficient - no Markdown parser needed.
 */
export function extractConsecutiveClaims(markdown) {
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
    claimsByFile[relPath] = extractConsecutiveClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} "consecutive"/"back-to-back" claim(s) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from consecutive-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current consecutive/back-to-back claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited consecutive/back-to-back claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes, then recorded in ` +
      `scripts/consecutive-claims-ledger.json with a short note on how it was verified:\n`,
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
