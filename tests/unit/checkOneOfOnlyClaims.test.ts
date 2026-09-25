import { describe, expect, it } from 'vitest';
import { extractOneOfOnlyClaims, diffClaimsAgainstLedger } from '../../scripts/check-one-of-only-claims.mjs';

describe('extractOneOfOnlyClaims', () => {
  it('extracts a bullet matching "one of only N"', () => {
    const md = `## Winners\n\n- Someone (Country) - one of only three men to win it as both player and manager.\n- Someone else won it too.\n`;
    expect(extractOneOfOnlyClaims(md)).toEqual([
      'Someone (Country) - one of only three men to win it as both player and manager.',
    ]);
  });

  it('is case-insensitive', () => {
    const md = `- ONE OF ONLY 3 men to do this.\n`;
    expect(extractOneOfOnlyClaims(md)).toEqual(['ONE OF ONLY 3 men to do this.']);
  });

  it('ignores "one of only a handful of" bullets - no number to verify against', () => {
    const md = `- One of only a handful of managers to hold both titles.\n- One of only a handful of players to captain a team to both trophies.\n`;
    expect(extractOneOfOnlyClaims(md)).toEqual([]);
  });

  it('ignores bullets that use "the only" without "one of only N"', () => {
    const md = `- The only player to do this.\n- Had only four teams.\n`;
    expect(extractOneOfOnlyClaims(md)).toEqual([]);
  });

  it('ignores non-bullet lines even when they contain "one of only N"', () => {
    const md = `This paragraph mentions one of only three exceptions in passing.\n`;
    expect(extractOneOfOnlyClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order', () => {
    const md = `- **1990:** one of only three men to win it.\n- Not a match.\n- **1974:** one of only three men to win it (see above).\n`;
    expect(extractOneOfOnlyClaims(md)).toEqual([
      '**1990:** one of only three men to win it.',
      '**1974:** one of only three men to win it (see above).',
    ]);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractOneOfOnlyClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['one of only three claim.'] };
    const ledger = { 'content/a.md': { 'one of only three claim.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['one of only three claim.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'one of only three claim.' }],
      staleEntries: [],
    });
  });

  it('flags a reworded claim as new even though a similar ledger entry exists', () => {
    const claimsByFile = { 'content/a.md': ['one of only three claim, reworded.'] };
    const ledger = { 'content/a.md': { 'one of only three claim.': 'verified.' } };
    const result = diffClaimsAgainstLedger(claimsByFile, ledger);
    expect(result.newClaims).toEqual([{ file: 'content/a.md', claim: 'one of only three claim, reworded.' }]);
    expect(result.staleEntries).toEqual([{ file: 'content/a.md', claim: 'one of only three claim.' }]);
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'one of only three claim.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'one of only three claim.' }],
    });
  });

  it('treats a file present in claims but absent from the ledger as all-new', () => {
    const claimsByFile = { 'content/new.md': ['one of only three claim.'] };
    const ledger = {};
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/new.md', claim: 'one of only three claim.' }],
      staleEntries: [],
    });
  });
});
