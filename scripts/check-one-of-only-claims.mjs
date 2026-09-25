// Guards against the same bug class as `check-superlative-claims.mjs`, but for
// a claim shape that checker deliberately leaves out: "one of only N X to Y"
// bounded-set membership claims (e.g. "one of only three men to win it as
// both player and manager"), as opposed to a strict "the only X" uniqueness
// claim. Flagged as its own "Ideas not yet scoped" entry in
// `docs/ROADMAP.md` by the hundred-and-eighty-fourth intensive run's
// possessive-phrasing investigation, and built by the hundred-and-
// eighty-fifth run.
//
// How it works: identical ledger-diff mechanism to `check-superlative-
// claims.mjs` (see that file's header for the full rationale) - every
// `content/*.md` bullet matching the pattern below is extracted verbatim and
// diffed against a hand-maintained ledger, `one-of-only-claims-ledger.json`.
// A bullet whose exact text isn't in the ledger fails the build until it's
// checked against the source table it summarizes.
//
// Deliberately scoped to a *numbered* bounded-set claim only ("one of only
// three men", "one of only 3 men"), not the vaguer "one of only a handful of
// X" phrasing that also appears in `content/*.md`. The numbered form names a
// precise count that can be checked against a table (count how many names
// satisfy the claim, compare to the stated number); "a handful of" names no
// number, so there is nothing to verify it against - matching it would just
// fail the build on a claim this checker can never resolve. The pattern
// matches both digit ("3") and spelled-out ("three") counts up to ten - this
// site's editorial prose always spells small numbers out (confirmed against
// the two current matches, both "one of only three"), so digit form is
// covered for completeness but spelled-out is what actually occurs. Widen
// only if a differently-phrased *numbered* bounded-set claim shows up that
// this pattern misses.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// wired into `.github/workflows/ci.yml` as a required PR gate alongside the
// other verification-ledger claim checks.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'one-of-only-claims-ledger.json');

const CLAIM_PATTERN = /\bone of only (\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

/**
 * Pure: every top-level Markdown list item's text in `markdown` that matches
 * the "one of only N" bounded-set-claim pattern, in document order. Content
 * pages on this site use only flat, single-line `- ` bullets (no nested
 * lists), so a per-line regex is sufficient - no Markdown parser needed.
 */
export function extractOneOfOnlyClaims(markdown) {
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
    claimsByFile[relPath] = extractOneOfOnlyClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} "one of only N" bounded-set claim(s) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from one-of-only-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current "one of only N" claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited "one of only N" claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes, then recorded in ` +
      `scripts/one-of-only-claims-ledger.json with a short note on how it was verified:\n`,
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
