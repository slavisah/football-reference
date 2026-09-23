import { describe, expect, it } from 'vitest';
import { extractRecordClaims } from '../../scripts/check-record-claims.mjs';
import { diffClaimsAgainstLedger } from '../../scripts/check-superlative-claims.mjs';

describe('extractRecordClaims', () => {
  it('extracts a bullet matching "the most"', () => {
    const md = `## Winners\n\n- Brazil supplied five, the most of any team.\n- Someone else won it too.\n`;
    expect(extractRecordClaims(md)).toEqual(['Brazil supplied five, the most of any team.']);
  });

  it('is case-insensitive', () => {
    const md = `- A RECORD fourth title.\n`;
    expect(extractRecordClaims(md)).toEqual(['A RECORD fourth title.']);
  });

  it('matches every trigger word: record, youngest, oldest, highest, biggest, largest, lowest, fewest', () => {
    const md =
      `- a record total.\n- the youngest winner.\n- the oldest player.\n- the highest score.\n` +
      `- the biggest surprise.\n- the largest group.\n- the lowest total.\n- the fewest minutes.\n`;
    expect(extractRecordClaims(md)).toEqual([
      'a record total.',
      'the youngest winner.',
      'the oldest player.',
      'the highest score.',
      'the biggest surprise.',
      'the largest group.',
      'the lowest total.',
      'the fewest minutes.',
    ]);
  });

  it('ignores non-bullet lines even when they contain a matching phrase', () => {
    const md = `This paragraph mentions a record fourth title in passing.\n`;
    expect(extractRecordClaims(md)).toEqual([]);
  });

  it('extracts multiple matching bullets in document order, skipping non-matching ones', () => {
    const md = `- the most goals.\n- Not a match.\n- the oldest player.\n`;
    expect(extractRecordClaims(md)).toEqual(['the most goals.', 'the oldest player.']);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractRecordClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger (shared logic with check-superlative-claims.mjs)', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['a record total.'] };
    const ledger = { 'content/a.md': { 'a record total.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['a record total.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'a record total.' }],
      staleEntries: [],
    });
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'a record total.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'a record total.' }],
    });
  });
});
