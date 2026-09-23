// A third verification-ledger gate, sibling to `check-superlative-claims.mjs`
// ("the only X to Y") and `check-ordinal-claims.mjs` ("the first/.../tenth X
// to Y") - same mechanism, a different bug class: hand-written "record-
// holder" claims using words like "most", "record", "youngest", "oldest",
// "highest", "biggest", "largest", "lowest" or "fewest" in a `content/*.md`
// note bullet, which can be factually wrong (or go stale as new editions are
// added) against the table data they summarize, the same risk the other two
// checkers already guard against for their own claim shapes. Unlike those two,
// this class has no single clean grammatical marker ("the only", "the Nth ...
// to") to bound a low-noise regex against - "record" alone is also used to
// mean "track record" (a team's disciplinary record), and "most" is also used
// as a plain quantifier ("most editions since the 1990s") rather than to name
// a specific record holder. Rather than trying to hand-tune a narrower pattern
// that might silently miss a genuine claim, this casts a wider net on the
// trigger words themselves and lets the ledger record *why* a given bullet
// either needed cross-checking or didn't (a descriptive/quantifier use, a
// "track record" sense of the word, or a claim that isn't independently
// checkable against this site's own tables) - the same honesty the other two
// ledgers already use for claims that rely on data (birth dates, playing
// position) this site doesn't track.
//
// Seeding the ledger (the hundred-and-seventy-fourth intensive run) checked
// all 36 current claims this pattern matches across the five content files
// that have any: every "the most of any team"/"the most of any player" Team
// of the Tournament and Golden Boot bullet was independently confirmed by
// counting the same bullet's own name list (or, for cross-edition claims
// like "still the most any player has scored at a single World Cup", by
// scanning every row of the table it summarizes for a higher value); "Spain
// won a record fourth title in 2024" was confirmed by tallying the EURO
// champions table by hand (Spain 4, next-highest West Germany/Germany 3 even
// combined across the name change); "Argentina moved ahead as the
// competition's most successful team by winning in 2024" was confirmed the
// same way against the Copa América champions table (Argentina 16 after
// 2024, Uruguay 15). No false claim turned up this run - unlike the two
// bugs the "the only" and ordinal-claim ledgers' own seeding runs each
// found - but the checker itself is the same standing guard against a
// *future* one slipping in unverified, which is the point of building it
// even on a clean pass. See `docs/PROJECT_STATUS.md`'s matching entry for
// the full per-claim verification writeup.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as the other two claim checkers, so this is wired into
// `.github/workflows/ci.yml` as a required PR gate immediately after
// `check:ordinal-claims`.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffClaimsAgainstLedger } from './check-superlative-claims.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'record-claims-ledger.json');

const RECORD_WORDS = 'most|record|youngest|oldest|highest|biggest|largest|lowest|fewest';
const CLAIM_PATTERN = new RegExp(`\\b(${RECORD_WORDS})\\b`, 'i');

/**
 * Pure: every top-level Markdown list item's text in `markdown` that
 * mentions a record-claim trigger word ("most", "record", "youngest",
 * "oldest", "highest", "biggest", "largest", "lowest", "fewest"), in
 * document order. Content pages on this site use only flat, single-line
 * `- ` bullets (no nested lists), so a per-line regex is sufficient - no
 * Markdown parser needed.
 */
export function extractRecordClaims(markdown) {
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
    claimsByFile[relPath] = extractRecordClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} record-claim bullet(s) (most/record/youngest/oldest/highest/biggest/largest/lowest/fewest) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from record-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current record-claim bullet has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited record-claim bullet(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes (or recorded as descriptive/` +
      `not independently checkable, if that's what it is), then recorded in ` +
      `scripts/record-claims-ledger.json with a short note on how it was verified:\n`,
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
