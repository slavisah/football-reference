// Guards against the same bug class as `check-one-of-only-claims.mjs`, but
// for the companion claim shape that checker's own header flags as a
// follow-up: "joining X[, Y,] and Z as a <label>" bounded-membership
// claims, which name the other members of a small set rather than just its
// size. Run 362 found exactly this bug by hand - `fifa-world-cup.md`'s 2018
// "Winning managers" bullet named Didier Deschamps as "joining Zagallo and
// Beckenbauer as a player-and-manager winner", while its own 1998 "Winning
// captains" bullet stated the same three-person fact with a different
// phrasing before being fixed to match - and no existing claim-ledger
// checker would have caught the two statements drifting apart, since
// `check-one-of-only-claims.mjs` only matches literal "one of only N"
// counting phrasing, not this named-membership shape. Flagged as a
// well-scoped follow-up in `docs/ROADMAP.md` after Run 362/363; built by
// Run 365.
//
// How it works: identical ledger-diff mechanism to `check-one-of-only-
// claims.mjs` (see that file's header, and `check-superlative-claims.mjs`'s
// for the full rationale) - every `content/*.md` claimable line matching the
// pattern below is extracted verbatim and diffed against a hand-maintained
// ledger, `joining-claims-ledger.json`. A claim whose exact text isn't in
// the ledger fails the build until it's checked against the source table it
// summarizes (confirming every named member actually belongs, and that no
// member is missing) and recorded. Because the ledger keys on exact text,
// two claims that restate the same underlying fact in different words each
// get their own ledger entry - verifying one doesn't excuse the other, so a
// future edit that only updates one of two matching statements (the exact
// way Run 362's bug was introduced) shows up as a new, unverified claim on
// the line that still needs checking, and the reviewer doing that check is
// the point at which a mismatch between the two gets noticed.
//
// Deliberately scoped to "joining <name(s)> as a/an/the <label>" - the
// pattern requires at least one capitalized name token between "joining"
// and "as", which matches every current named-membership claim
// (`content/fifa-world-cup.md`'s two Deschamps bullets) while skipping the
// vaguer, unnamed "joining a small group of player-and-manager EURO
// winners" bullet in `content/uefa-euro.md` - that phrasing names no one,
// so there is nothing for a ledger entry to verify membership of; widen
// only if a differently-phrased *named* bounded-membership claim shows up
// that this pattern misses.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// wired into `.github/workflows/ci.yml` as a required PR gate alongside the
// other verification-ledger claim checks.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractClaimableLines } from './check-superlative-claims.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'joining-claims-ledger.json');

const NAME = "[A-ZÀ-Þ][\\p{L}'’.-]*(?:\\s+[A-ZÀ-Þ][\\p{L}'’.-]*)*";
const CLAIM_PATTERN = new RegExp(
  `\\bjoining\\s+${NAME}(?:,\\s+${NAME})*\\s+and\\s+${NAME}\\s+as\\s+(?:a|an|the)\\b`,
  'u',
);

/**
 * Pure: every claimable text unit (bullets and prose paragraphs alike - see
 * `extractClaimableLines()` in `check-superlative-claims.mjs`) in `markdown`
 * that matches the "joining <named members> as a/an/the <label>"
 * bounded-membership-claim pattern, in document order.
 */
export function extractJoiningClaims(markdown) {
  return extractClaimableLines(markdown).filter((text) => CLAIM_PATTERN.test(text));
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
    claimsByFile[relPath] = extractJoiningClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} "joining <named members> as a <label>" bounded-membership claim(s) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from joining-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current "joining <named members> as a <label>" claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited "joining <named members> as a <label>" claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes (does every named member actually belong, ` +
      `is anyone missing?), then recorded in scripts/joining-claims-ledger.json with a short note on how it was verified:\n`,
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
