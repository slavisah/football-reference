// A seventh verification-ledger gate, sibling to `check-superlative-claims.mjs`
// ("the only X"), `check-ordinal-claims.mjs` ("the first/.../tenth X"),
// `check-record-claims.mjs` (most/record/youngest/oldest/etc.),
// `check-consecutive-claims.mjs` (consecutive/back-to-back),
// `check-since-claims.mjs` ("since <year>") and `check-one-of-only-claims.mjs`
// ("one of only N X") - same mechanism, a different bug class:
// hand-written 100%-table-coverage claims phrased without the word "since" -
// "a pattern unbroken across all N editions", "has had one across all N
// editions", "in every edition [so far]". `check-since-claims.mjs` already
// covers the arithmetic "since <year>"/"N earlier editions" phrasing; this
// checker closes the gap for the sibling phrasing that asserts the identical
// kind of completeness (every row of a table has a given property, or a
// per-edition list has no gap) without naming a start year at all, so it
// never matched that pattern.
//
// Found by the hundred-and-ninetieth intensive run's dedicated angle search:
// grepping `content/*.md` for `across all N editions` and `in every edition`
// surfaced five bullets - none previously ledgered by any of the other six
// checkers - asserting, respectively, that every World Cup-winning manager
// shares their team's nationality, that every World Cup/EURO/Nations League
// winner has a named captain, and that every Nations League host has
// finished in the Finals' top four. All five were independently verified
// true this run by cross-referencing each one against its own file's
// Editions/Finals and Winning managers/Winning captains tables (see each
// entry's own note in `completeness-claims-ledger.json` for the per-claim
// check) - no bug found, but a real, previously-unguarded gap: a future edit
// leaving a captain/manager cell blank, or changing a table's edition count
// without updating "23"/"17"/"four" in these bullets, would have shipped
// silently, since no other check reads these five sentences against their
// tables.
//
// How it works: identical mechanism to the other six - every `content/*.md`
// bullet matching the pattern below is extracted verbatim and diffed against
// `completeness-claims-ledger.json` (same directory); any claim with no
// exact-text ledger entry is new or edited and fails the build until it is
// checked against the source table it summarizes and recorded.
//
// Deliberately scoped to the two literal phrasings actually found on the
// site ("across all N editions", with N as a digit or spelled-out number up
// to ten, and "in every edition") rather than a broader "every"/"all" match -
// content/copa-america.md alone uses "every edition" three more times in
// bullets that are format descriptions with a named exception ("every
// edition from 1993 onward except 2016") or already-"since"-anchored
// completeness claims ("every edition since the first in 1916", already
// covered by check-since-claims.mjs), not undated 100%-coverage assertions;
// a bare "every edition" match would have caught those too and produced
// nothing but noise for a checker whose only test is "does this need a
// table cross-check". Widen it only if this exact undated-completeness shape
// recurs in different wording.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as the other six claim checkers, so this is wired into
// `.github/workflows/ci.yml` as a required PR gate immediately after
// `check:one-of-only-claims`.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffClaimsAgainstLedger, extractClaimableLines } from './check-superlative-claims.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'completeness-claims-ledger.json');

const CLAIM_PATTERN =
  /\bacross all (\d+|one|two|three|four|five|six|seven|eight|nine|ten)( completed)? editions\b|\bin every edition\b/i;

/**
 * Pure: every claimable text unit (bullets and prose paragraphs alike - see
 * `extractClaimableLines()` in `check-superlative-claims.mjs`) in `markdown`
 * that matches the undated completeness-claim pattern - "across all N
 * editions" or "in every edition" - in document order.
 */
export function extractCompletenessClaims(markdown) {
  return extractClaimableLines(markdown).filter((text) => CLAIM_PATTERN.test(text));
}

async function main() {
  const entries = await readdir(CONTENT_DIR);
  const mdFiles = entries.filter((name) => name.endsWith('.md')).sort();

  const claimsByFile = {};
  for (const name of mdFiles) {
    const relPath = path.join('content', name);
    const markdown = await readFile(path.join(CONTENT_DIR, name), 'utf8');
    claimsByFile[relPath] = extractCompletenessClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} undated completeness claim(s) ("across all N editions"/"in every edition") across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from completeness-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current undated completeness claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited undated completeness claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes, then recorded in ` +
      `scripts/completeness-claims-ledger.json with a short note on how it was verified:\n`,
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
