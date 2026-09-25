// Extends the verification-ledger pattern `check-superlative-claims.mjs`
// built (see its own header comment and `docs/PROJECT_STATUS.md`'s matching
// entry) to a second, related bug class flagged but deliberately not built
// by the hundred-and-seventy-first intensive run's "Left for a future pass"
// note in `docs/ROADMAP.md`: a hand-written "the first/second/.../tenth X to
// Y" ordinal-rank claim in a `content/*.md` note bullet that is factually
// wrong against the data it summarizes. Same risk as the "the only" claims
// `check-superlative-claims.mjs` already guards: a claim can be true when
// written and silently go stale (or simply be wrong from the start) as
// surrounding data changes or a new edition is added, with nothing to catch
// it short of a human re-reading every bullet by hand.
//
// This run (the hundred-and-seventy-third) found exactly that seeding the
// ledger below: UEFA EURO's Final-venues note on the 2020 Wembley entry
// claimed Wembley was "the second [stadium] to host two EURO finals" after
// 1996/2020 - but the venues list itself shows Paris's Parc des Princes
// reached the same milestone earlier, in 1984 (its second final, after
// 1960), following Rome's own second final in 1980. Wembley's 2020 final
// was actually the *third* instance of a stadium hosting two EURO finals,
// not the second. Fixed in both `content/uefa-euro.md` and its hand-
// translated Croatian counterpart (`src/pages/hr/competitions/euro.astro`)
// as part of the same commit that added this checker - see
// `docs/PROJECT_STATUS.md`'s matching entry for the full writeup.
//
// How it works: identical mechanism to `check-superlative-claims.mjs`,
// just a different extraction pattern and its own ledger file
// (`ordinal-claims-ledger.json`, same directory) - every `content/*.md`
// bullet matching the pattern below is extracted verbatim and diffed
// against the ledger; anything with no exact-text match is a new or edited
// claim nothing has verified yet, and fails the build until it's checked
// against the source table it summarizes and recorded.
//
// Extraction pattern: `/\bthe (first|second|...|tenth)\b/i`, a bare match
// on the ordinal word itself. Originally this required a `to` within a
// 50-character, period-bounded window after the ordinal (matching only
// "the Nth ... to Y" claims) - the hundred-and-seventy-seventh intensive
// run found that requirement itself was the gap: it missed the site's other
// common ordinal-claim phrasing, "the first of his N wins/titles/editions"
// and "became/won the first-ever X" (no "to" at all), 25 real claims across
// four content files that were silently unverified (e.g. "the first of his
// two consecutive title-winning editions" for every Copa América manager/
// captain who won back-to-back). Re-checked the bare pattern against the
// full corpus before widening to it (same diligence the original narrowing
// used): every one of the 43 bullets it now matches is a genuine,
// table-checkable claim, zero noise - unlike the record-claims checker's
// trigger words ("record", "most"), an ordinal number in this content is
// never used as a vague quantifier, so the bare word needs no "to" anchor
// to stay precise.
//
// Widened a second time by the hundred-and-eighty-third intensive run: the
// "the (first|...)" pattern still required the literal word "the"
// immediately before the ordinal, which missed every possessive phrasing of
// the exact same claim shape - "the trophy's first winner", "Masantonio's
// second win", "his second win", "its first title" - 48 real claims across
// all six content files that were silently unverified, the same bug class
// as the 177th run's own "to"-requirement gap. Added two alternatives to the
// pattern: `\w+'s (first|...)` (a possessive noun) and `(his|her|its|their)
// (first|...)` (a possessive pronoun). Re-checked both against the full
// corpus before widening (same diligence as every prior narrowing/widening
// on this file): zero noise - every matched bullet is a genuine, table-
// checkable ordinal-rank claim, not a stray "at first"/"third-place match"/
// generic-ordinal use (those never take a possessive immediately before the
// ordinal word, so the narrower possessive anchor stays precise where the
// bare-word widening above already proved unnecessary for this second net).
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as `check-superlative-claims.mjs`, so this is wired
// into `.github/workflows/ci.yml` as a required PR gate immediately after
// it.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'ordinal-claims-ledger.json');

const ORDINALS = 'first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth';
const CLAIM_PATTERN = new RegExp(
  `\\bthe (${ORDINALS})\\b|\\b\\w+'s\\s+(${ORDINALS})\\b|\\b(his|her|its|their)\\s+(${ORDINALS})\\b`,
  'i',
);

/**
 * Pure: every top-level Markdown list item's text in `markdown` that matches
 * the "the first/second/.../tenth X" ordinal-claim pattern - either "the Nth"
 * directly, or the same ordinal-rank claim phrased with a possessive
 * ("the trophy's first winner", "Masantonio's second win", "his second win",
 * "its first title") - in document order. Content pages on this site use
 * only flat, single-line `- ` bullets (no nested lists), so a per-line regex
 * is sufficient - no Markdown parser needed.
 */
export function extractOrdinalClaims(markdown) {
  const claims = [];
  for (const rawLine of markdown.split('\n')) {
    const match = /^-\s(.*)$/.exec(rawLine.trim());
    if (!match) continue;
    const text = match[1].trim();
    if (CLAIM_PATTERN.test(text)) claims.push(text);
  }
  return claims;
}

/**
 * Pure: diffs the current per-file claim lists against the ledger. Returns
 * `{ newClaims, staleEntries }`, each a list of `{ file, claim }`.
 * `newClaims` is every current claim whose exact text has no ledger entry
 * for that file; `staleEntries` is every ledger entry whose exact text no
 * longer appears among that file's current claims.
 */
export function diffClaimsAgainstLedger(claimsByFile, ledger) {
  const newClaims = [];
  const staleEntries = [];

  for (const [file, claims] of Object.entries(claimsByFile)) {
    const verified = new Set(Object.keys(ledger[file] ?? {}));
    for (const claim of claims) {
      if (!verified.has(claim)) newClaims.push({ file, claim });
    }
  }

  for (const [file, entries] of Object.entries(ledger)) {
    const current = new Set(claimsByFile[file] ?? []);
    for (const claim of Object.keys(entries)) {
      if (!current.has(claim)) staleEntries.push({ file, claim });
    }
  }

  return { newClaims, staleEntries };
}

async function main() {
  const entries = await readdir(CONTENT_DIR);
  const mdFiles = entries.filter((name) => name.endsWith('.md')).sort();

  const claimsByFile = {};
  for (const name of mdFiles) {
    const relPath = path.join('content', name);
    const markdown = await readFile(path.join(CONTENT_DIR, name), 'utf8');
    claimsByFile[relPath] = extractOrdinalClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} "the first/second/.../tenth X" ordinal claim(s) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from ordinal-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current ordinal claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited ordinal claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes, then recorded in ` +
      `scripts/ordinal-claims-ledger.json with a short note on how it was verified:\n`,
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
