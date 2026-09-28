import { describe, expect, it } from 'vitest';
import { extractCompletenessClaims } from '../../scripts/check-completeness-claims.mjs';
import { diffClaimsAgainstLedger } from '../../scripts/check-superlative-claims.mjs';

describe('extractCompletenessClaims', () => {
  it('extracts a bullet matching "across all N editions" with a digit count', () => {
    const md = `## Winning managers\n\n- A pattern unbroken across all 23 editions.\n- Someone else won it too.\n`;
    expect(extractCompletenessClaims(md)).toEqual(['A pattern unbroken across all 23 editions.']);
  });

  it('extracts a bullet matching "across all N editions" with a spelled-out count', () => {
    const md = `- Every winner has had one across all four completed editions.\n`;
    expect(extractCompletenessClaims(md)).toEqual([
      'Every winner has had one across all four completed editions.',
    ]);
  });

  it('extracts a bullet matching "in every edition"', () => {
    const md = `- The host has finished in the top four in every edition so far.\n`;
    expect(extractCompletenessClaims(md)).toEqual([
      'The host has finished in the top four in every edition so far.',
    ]);
  });

  it('is case-insensitive', () => {
    const md = `- A pattern unbroken ACROSS ALL 23 EDITIONS.\n`;
    expect(extractCompletenessClaims(md)).toEqual(['A pattern unbroken ACROSS ALL 23 EDITIONS.']);
  });

  it('ignores non-bullet lines even when they contain a matching phrase', () => {
    const md = `This paragraph mentions a pattern across all 23 editions in passing.\n`;
    expect(extractCompletenessClaims(md)).toEqual([]);
  });

  it('does not match "every edition" phrasing that names an exception or a start year', () => {
    const md =
      `- A single-elimination bracket ending in a one-off final (1987, and every edition from 1993 onward except 2016).\n` +
      `- A top scorer can be identified for every edition since the first in 1916.\n`;
    expect(extractCompletenessClaims(md)).toEqual([]);
  });

  it('does not match a bare edition count with no "across all"/"in every edition" anchor', () => {
    const md = `- There have been 23 editions so far.\n`;
    expect(extractCompletenessClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order, skipping non-matching ones', () => {
    const md = `- Held across all 17 editions.\n- Not a match.\n- True in every edition.\n`;
    expect(extractCompletenessClaims(md)).toEqual(['Held across all 17 editions.', 'True in every edition.']);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractCompletenessClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger (shared logic with check-superlative-claims.mjs)', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['Across all 23 editions.'] };
    const ledger = { 'content/a.md': { 'Across all 23 editions.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['Across all 23 editions.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'Across all 23 editions.' }],
      staleEntries: [],
    });
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'Across all 23 editions.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'Across all 23 editions.' }],
    });
  });
});
