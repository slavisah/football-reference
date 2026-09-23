import { describe, expect, it } from 'vitest';
import { extractConsecutiveClaims } from '../../scripts/check-consecutive-claims.mjs';
import { diffClaimsAgainstLedger } from '../../scripts/check-superlative-claims.mjs';

describe('extractConsecutiveClaims', () => {
  it('extracts a bullet matching "consecutive"', () => {
    const md = `## Winners\n\n- His second consecutive win.\n- Someone else won it too.\n`;
    expect(extractConsecutiveClaims(md)).toEqual(['His second consecutive win.']);
  });

  it('extracts a bullet matching "back-to-back"', () => {
    const md = `- His second, back-to-back.\n`;
    expect(extractConsecutiveClaims(md)).toEqual(['His second, back-to-back.']);
  });

  it('is case-insensitive', () => {
    const md = `- Won it BACK-TO-BACK.\n`;
    expect(extractConsecutiveClaims(md)).toEqual(['Won it BACK-TO-BACK.']);
  });

  it('ignores non-bullet lines even when they contain a matching phrase', () => {
    const md = `This paragraph mentions a consecutive win in passing.\n`;
    expect(extractConsecutiveClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order, skipping non-matching ones', () => {
    const md = `- consecutive titles.\n- Not a match.\n- back-to-back wins.\n`;
    expect(extractConsecutiveClaims(md)).toEqual(['consecutive titles.', 'back-to-back wins.']);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractConsecutiveClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger (shared logic with check-superlative-claims.mjs)', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['consecutive titles.'] };
    const ledger = { 'content/a.md': { 'consecutive titles.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['consecutive titles.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'consecutive titles.' }],
      staleEntries: [],
    });
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'consecutive titles.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'consecutive titles.' }],
    });
  });
});
