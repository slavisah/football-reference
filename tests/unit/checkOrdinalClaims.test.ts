import { describe, expect, it } from 'vitest';
import { extractOrdinalClaims, diffClaimsAgainstLedger } from '../../scripts/check-ordinal-claims.mjs';

describe('extractOrdinalClaims', () => {
  it('extracts a bullet matching "the first ... to"', () => {
    const md = `## Winners\n\n- Rodri (Spain) - the first Spain player to win the award.\n- Someone else won it too.\n`;
    expect(extractOrdinalClaims(md)).toEqual(['Rodri (Spain) - the first Spain player to win the award.']);
  });

  it('is case-insensitive', () => {
    const md = `- THE FIRST player to do this.\n`;
    expect(extractOrdinalClaims(md)).toEqual(['THE FIRST player to do this.']);
  });

  it('matches every ordinal word from first through tenth', () => {
    const md = `- the third team to do it.\n- the tenth player to do it.\n`;
    expect(extractOrdinalClaims(md)).toEqual(['the third team to do it.', 'the tenth player to do it.']);
  });

  it('ignores an ordinal when "to" is more than 50 characters away', () => {
    const md = `- the first entrant in this remarkably long descriptive clause stretching well beyond the fifty character limit before reaching the word to here.\n`;
    expect(extractOrdinalClaims(md)).toEqual([]);
  });

  it('does not let the match window cross a sentence boundary', () => {
    const md = `- The first half was goalless. Results promote the best teams to a higher league.\n`;
    expect(extractOrdinalClaims(md)).toEqual([]);
  });

  it('ignores non-bullet lines even when they contain a matching phrase', () => {
    const md = `This paragraph mentions the first team to do it in passing.\n`;
    expect(extractOrdinalClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order', () => {
    const md = `- the first of many.\n- the first team to win it.\n- Not a match.\n- the second player to win it.\n`;
    expect(extractOrdinalClaims(md)).toEqual(['the first team to win it.', 'the second player to win it.']);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractOrdinalClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger (shared logic with check-superlative-claims.mjs)', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['the first claim to win it.'] };
    const ledger = { 'content/a.md': { 'the first claim to win it.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['the first claim to win it.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'the first claim to win it.' }],
      staleEntries: [],
    });
  });

  it('flags a reworded claim (e.g. a corrected ordinal) as new even though a similar ledger entry exists', () => {
    const claimsByFile = { 'content/a.md': ['the third claim to win it.'] };
    const ledger = { 'content/a.md': { 'the second claim to win it.': 'verified.' } };
    const result = diffClaimsAgainstLedger(claimsByFile, ledger);
    expect(result.newClaims).toEqual([{ file: 'content/a.md', claim: 'the third claim to win it.' }]);
    expect(result.staleEntries).toEqual([{ file: 'content/a.md', claim: 'the second claim to win it.' }]);
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'the first claim to win it.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'the first claim to win it.' }],
    });
  });

  it('treats a file present in claims but absent from the ledger as all-new', () => {
    const claimsByFile = { 'content/new.md': ['the first claim to win it.'] };
    const ledger = {};
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/new.md', claim: 'the first claim to win it.' }],
      staleEntries: [],
    });
  });
});
