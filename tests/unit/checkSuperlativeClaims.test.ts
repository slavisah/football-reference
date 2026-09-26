import { describe, expect, it } from 'vitest';
import { extractSuperlativeClaims, diffClaimsAgainstLedger } from '../../scripts/check-superlative-claims.mjs';

describe('extractSuperlativeClaims', () => {
  it('extracts a bullet matching "the only"', () => {
    const md = `## Winners\n\n- Lev Yashin remains the only goalkeeper to win the men's award.\n- Someone else won it too.\n`;
    expect(extractSuperlativeClaims(md)).toEqual(["Lev Yashin remains the only goalkeeper to win the men's award."]);
  });

  it('is case-insensitive', () => {
    const md = `- THE ONLY player to do this.\n`;
    expect(extractSuperlativeClaims(md)).toEqual(['THE ONLY player to do this.']);
  });

  it('ignores bullets that use "only" without "the only" or a possessive-only', () => {
    const md = `- Europe-only at first.\n- Had only four teams.\n- One of only three men to win it.\n`;
    expect(extractSuperlativeClaims(md)).toEqual([]);
  });

  it('extracts a possessive-noun "only" claim, e.g. "Colombia\'s only title"', () => {
    const md = `- Francisco Maturana (Colombia) - Colombia's only Copa América title.\n`;
    expect(extractSuperlativeClaims(md)).toEqual(["Francisco Maturana (Colombia) - Colombia's only Copa América title."]);
  });

  it('extracts a possessive-pronoun "only" claim, e.g. "its only title"', () => {
    const md = `- Bolivia won its only title as host in 1963.\n`;
    expect(extractSuperlativeClaims(md)).toEqual(['Bolivia won its only title as host in 1963.']);
  });

  it('extracts a possessive-pronoun "only" claim with "their", e.g. "their only European Championship title"', () => {
    const md = `- Rinus Michels (Netherlands) - coached the Dutch to their only European Championship title.\n`;
    expect(extractSuperlativeClaims(md)).toEqual([
      'Rinus Michels (Netherlands) - coached the Dutch to their only European Championship title.',
    ]);
  });

  it('ignores non-bullet lines even when they contain "the only"', () => {
    const md = `This paragraph mentions the only exception in passing.\n`;
    expect(extractSuperlativeClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order', () => {
    const md = `- **2001:** the only winner from a guest nation.\n- Not a match.\n- the only player to win twice.\n`;
    expect(extractSuperlativeClaims(md)).toEqual([
      '**2001:** the only winner from a guest nation.',
      'the only player to win twice.',
    ]);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractSuperlativeClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['the only claim.'] };
    const ledger = { 'content/a.md': { 'the only claim.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['the only claim.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'the only claim.' }],
      staleEntries: [],
    });
  });

  it('flags a reworded claim as new even though a similar ledger entry exists', () => {
    const claimsByFile = { 'content/a.md': ['the only claim, reworded.'] };
    const ledger = { 'content/a.md': { 'the only claim.': 'verified.' } };
    const result = diffClaimsAgainstLedger(claimsByFile, ledger);
    expect(result.newClaims).toEqual([{ file: 'content/a.md', claim: 'the only claim, reworded.' }]);
    expect(result.staleEntries).toEqual([{ file: 'content/a.md', claim: 'the only claim.' }]);
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'the only claim.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'the only claim.' }],
    });
  });

  it('treats a file present in claims but absent from the ledger as all-new', () => {
    const claimsByFile = { 'content/new.md': ['the only claim.'] };
    const ledger = {};
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/new.md', claim: 'the only claim.' }],
      staleEntries: [],
    });
  });
});
