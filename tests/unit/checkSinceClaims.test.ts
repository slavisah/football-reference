import { describe, expect, it } from 'vitest';
import { extractSinceClaims } from '../../scripts/check-since-claims.mjs';
import { diffClaimsAgainstLedger } from '../../scripts/check-superlative-claims.mjs';

describe('extractSinceClaims', () => {
  it('extracts a bullet matching "since <year>"', () => {
    const md = `## Winners\n\n- Awarded every year since 1996.\n- Someone else won it too.\n`;
    expect(extractSinceClaims(md)).toEqual(['Awarded every year since 1996.']);
  });

  it('is case-insensitive', () => {
    const md = `- Awarded every year SINCE 1996.\n`;
    expect(extractSinceClaims(md)).toEqual(['Awarded every year SINCE 1996.']);
  });

  it('also catches a prose paragraph (not just a bullet) matching "since <year>"', () => {
    const md = `This paragraph mentions an award since 1996 in passing.\n`;
    expect(extractSinceClaims(md)).toEqual(['This paragraph mentions an award since 1996 in passing.']);
  });

  it('does not match a bare year with no "since"', () => {
    const md = `- First awarded in 1996.\n`;
    expect(extractSinceClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order, skipping non-matching ones', () => {
    const md = `- Held since 1996.\n- Not a match.\n- Named since 2016.\n`;
    expect(extractSinceClaims(md)).toEqual(['Held since 1996.', 'Named since 2016.']);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractSinceClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });

  it('extracts "since the X\'s ... <year>" with an intervening possessive clause', () => {
    const md = `- Held every edition since the award's creation in 1956.\n`;
    expect(extractSinceClaims(md)).toEqual(["Held every edition since the award's creation in 1956."]);
  });

  it('extracts "since its/their ... <year>" with an intervening pronoun clause', () => {
    const md = `- Awarded at every Finals since the competition's 2019 launch.\n- Identified for every edition since the first in 1916.\n`;
    expect(extractSinceClaims(md)).toEqual([
      "Awarded at every Finals since the competition's 2019 launch.",
      'Identified for every edition since the first in 1916.',
    ]);
  });

  it('does not match "since" followed by an unrelated year more than 4 words later', () => {
    const md = `- Disputed since the sources themselves cannot agree on which of several later figures from 1956 is correct.\n`;
    expect(extractSinceClaims(md)).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger (shared logic with check-superlative-claims.mjs)', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['Held since 1996.'] };
    const ledger = { 'content/a.md': { 'Held since 1996.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['Held since 1996.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'Held since 1996.' }],
      staleEntries: [],
    });
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'Held since 1996.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'Held since 1996.' }],
    });
  });
});
