// Guards against a recurrence of the bug class the hundred-and-seventy-first
// intensive run found by hand: a hand-written "the only X to Y" superlative
// claim in a `content/*.md` note bullet that is factually wrong against the
// data table it summarizes (that run found and fixed two - a false "only"
// claim in the FIFA World Cup Fair Play Award notes, and one in the Copa
// América Golden Boot notes - see `docs/PROJECT_STATUS.md`'s matching entry).
// Flagged as a follow-up idea in `docs/ROADMAP.md` rather than built
// immediately: a generic checker for arbitrary superlative claims isn't
// tractable without NLP-level claim extraction (verifying "the only X to Y"
// against its source table requires actually understanding what the claim
// asserts, which this script does not attempt), but a narrow, cheap
// pattern-match that *gates new or edited claims for manual re-verification*
// is exactly what the roadmap entry proposed, and is what this implements.
//
// How it works: every `content/*.md` bullet matching `/\bthe only\b/i` is
// extracted verbatim. `superlative-claims-ledger.json` (same directory) is a
// hand-maintained record of every such bullet's exact text that has already
// been checked against its source table, one JSON object per content file
// mapping claim text to a short note on how/when it was verified. A bullet
// matching the pattern that isn't in the ledger - because it's brand new, or
// because its wording changed even slightly since it was last verified - is
// a genuinely new claim nothing has checked yet, and fails the build until a
// human (or an intensive run) reads it against the table it summarizes and
// records that verification as a new ledger entry. This is deliberately
// stricter than semantic equality: a wording change can silently change what
// is actually being claimed (as the two bugs this guards against show), so
// any change at all re-triggers verification rather than trying to guess
// whether a given edit was "material".
//
// Ledger entries whose exact claim text no longer appears anywhere in
// `content/*.md` (the bullet was reworded, moved, or removed) are reported
// as stale but do not fail the build - leaving a claim removed from prose
// but not yet pruned from the ledger costs nothing (it just can't match any
// future claim, so it can never mask an unverified one), unlike a genuinely
// new/changed claim slipping through unverified, which is the actual risk
// this check exists to close.
//
// Deliberately scoped to the narrow `/\bthe only\b/i` pattern named in the
// roadmap entry, not a broader "only"/exclusivity match (`"one of only three
// men"`, etc.) - that phrasing exists too, but a wider net catches far more
// incidental uses of "only" (`"Europe-only"`, `"had only four teams"`,
// `"only entered the tournament"`) that have nothing to do with this bug
// class, trading a cheap, low-noise gate for a noisy one. Widen it only if
// this exact bug class recurs outside "the only" phrasing.
//
// Widened by the hundred-and-eighty-fourth intensive run, the same way the
// hundred-and-eighty-third run's own possessive-ordinal fix widened
// `check-ordinal-claims.mjs`: the roadmap's "possessive-phrasing gap check"
// item, checking whether this checker's own pattern had the same "the X"
// literal-word requirement that turned out to be a gap for ordinal claims.
// It did - `"Colombia's only Copa América title"`, `"Bolivia won its only
// title"` and `"their only European Championship title"` are the identical
// uniqueness-claim shape as "the only X", just phrased with a possessive
// noun or pronoun instead of "the", and were silently unverified (the exact
// same three claims the header comment above used to cite as deliberately
// excluded, before this run re-examined them). Added two pattern
// alternatives, `\w+'s\s+only` and `(his|her|its|their)\s+only`, mirroring
// the ordinal checker's own fix exactly. Re-checked both against the full
// corpus before widening: 3 newly-caught claims, zero noise - every other
// non-"the only" use of "only" in `content/*.md` (`"Europe-only"`, `"had
// only four teams"`, `"one of only three men"`, etc.) still has no
// possessive immediately before it, so the narrower possessive anchor stays
// precise. `"one of only N X"` (a bounded-set claim, not a strict
// uniqueness claim) is a different shape, deliberately still excluded - see
// `docs/ROADMAP.md`'s "Ideas not yet scoped" section.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as `check:award-tallies`/`check:spelling` (well under a
// second), so this is wired into `.github/workflows/ci.yml` as a required PR
// gate, run alongside the other content-only checks before the build step.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const LEDGER_PATH = path.join(ROOT, 'scripts', 'superlative-claims-ledger.json');

const CLAIM_PATTERN = /\bthe only\b|\b\w+'s\s+only\b|\b(his|her|its|their)\s+only\b/i;

/**
 * Pure: every top-level Markdown list item's text in `markdown` that matches
 * the "the only" superlative-claim pattern - either "the only" directly, or
 * the same uniqueness claim phrased with a possessive ("Colombia's only
 * title", "its only title", "their only title") - in document order. Content
 * pages on this site use only flat, single-line `- ` bullets (no nested
 * lists), so a per-line regex is sufficient - no Markdown parser needed.
 */
export function extractSuperlativeClaims(markdown) {
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
    claimsByFile[relPath] = extractSuperlativeClaims(markdown);
  }

  const ledgerRaw = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(ledgerRaw);

  const { newClaims, staleEntries } = diffClaimsAgainstLedger(claimsByFile, ledger);

  const totalClaims = Object.values(claimsByFile).reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Checked ${totalClaims} "the only" superlative claim(s) across ${mdFiles.length} content file(s) against the verification ledger.`,
  );

  if (staleEntries.length > 0) {
    console.log(
      `\n${staleEntries.length} stale ledger entr${staleEntries.length === 1 ? 'y' : 'ies'} ` +
        `(claim text no longer present - safe to prune from superlative-claims-ledger.json):`,
    );
    for (const { file, claim } of staleEntries) {
      console.log(`  ${file}: "${claim}"`);
    }
  }

  if (newClaims.length === 0) {
    console.log('\nEvery current "the only" claim has a matching, unchanged ledger entry.');
    return;
  }

  console.error(
    `\n${newClaims.length} new or edited "the only" claim(s) have no matching ledger entry - ` +
      `each needs to be checked against the source table it summarizes, then recorded in ` +
      `scripts/superlative-claims-ledger.json with a short note on how it was verified:\n`,
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
