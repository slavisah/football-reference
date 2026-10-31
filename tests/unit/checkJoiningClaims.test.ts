import { describe, expect, it } from 'vitest';
import { extractJoiningClaims, diffClaimsAgainstLedger } from '../../scripts/check-joining-claims.mjs';

describe('extractJoiningClaims', () => {
  it('extracts a bullet naming two prior members', () => {
    const md = `## Winning managers\n\n- **2018:** Didier Deschamps (France) - also won the trophy as a player in 1998, joining Zagallo and Beckenbauer as a player-and-manager winner.\n- Someone else won it too.\n`;
    expect(extractJoiningClaims(md)).toEqual([
      '**2018:** Didier Deschamps (France) - also won the trophy as a player in 1998, joining Zagallo and Beckenbauer as a player-and-manager winner.',
    ]);
  });

  it('extracts a bullet naming three prior members, joined with commas', () => {
    const md = `- Someone - joining Alpha, Beta and Gamma as a player-and-manager winner.\n`;
    expect(extractJoiningClaims(md)).toEqual(['Someone - joining Alpha, Beta and Gamma as a player-and-manager winner.']);
  });

  it('matches "as an"/"as the" as well as "as a"', () => {
    const md = `- X - joining Alpha and Beta as an exception.\n- Y - joining Alpha and Beta as the only others.\n`;
    expect(extractJoiningClaims(md)).toEqual([
      'X - joining Alpha and Beta as an exception.',
      'Y - joining Alpha and Beta as the only others.',
    ]);
  });

  it('ignores "joining a small group of..." - no named members to verify', () => {
    const md = `- **1996:** Berti Vogts (Germany) - also won the title as a player in 1972, joining a small group of player-and-manager EURO winners.\n`;
    expect(extractJoiningClaims(md)).toEqual([]);
  });

  it('ignores "joining" bullets with no trailing "as a/an/the <label>"', () => {
    const md = `- CONMEBOL's ten teams compete, sometimes joined by invited guest teams from outside the region.\n- Fans joining Alpha and Beta in the stands.\n`;
    expect(extractJoiningClaims(md)).toEqual([]);
  });

  it('also catches a prose paragraph (not just a bullet)', () => {
    const md = `This paragraph mentions joining Alpha and Beta as a rare case in passing.\n`;
    expect(extractJoiningClaims(md)).toEqual(['This paragraph mentions joining Alpha and Beta as a rare case in passing.']);
  });

  it('extracts multiple matching bullets in document order', () => {
    const md = `- **2018:** joining Alpha and Beta as a winner.\n- Not a match.\n- **1998:** joining Alpha and Beta as a winner (see above).\n`;
    expect(extractJoiningClaims(md)).toEqual([
      '**2018:** joining Alpha and Beta as a winner.',
      '**1998:** joining Alpha and Beta as a winner (see above).',
    ]);
  });

  it('returns an empty array for content with no matching bullets', () => {
    expect(extractJoiningClaims('## Heading\n\n- A plain bullet.\n')).toEqual([]);
  });
});

describe('diffClaimsAgainstLedger', () => {
  it('reports no new claims and no stale entries when everything matches', () => {
    const claimsByFile = { 'content/a.md': ['joining Alpha and Beta as a winner.'] };
    const ledger = { 'content/a.md': { 'joining Alpha and Beta as a winner.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({ newClaims: [], staleEntries: [] });
  });

  it('flags a claim with no ledger entry as new', () => {
    const claimsByFile = { 'content/a.md': ['joining Alpha and Beta as a winner.'] };
    const ledger = { 'content/a.md': {} };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/a.md', claim: 'joining Alpha and Beta as a winner.' }],
      staleEntries: [],
    });
  });

  it('flags a reworded claim as new even though a similar ledger entry exists', () => {
    const claimsByFile = { 'content/a.md': ['joining Alpha, Beta and Gamma as a winner.'] };
    const ledger = { 'content/a.md': { 'joining Alpha and Beta as a winner.': 'verified.' } };
    const result = diffClaimsAgainstLedger(claimsByFile, ledger);
    expect(result.newClaims).toEqual([{ file: 'content/a.md', claim: 'joining Alpha, Beta and Gamma as a winner.' }]);
    expect(result.staleEntries).toEqual([{ file: 'content/a.md', claim: 'joining Alpha and Beta as a winner.' }]);
  });

  it('flags a ledger entry whose claim was removed from content as stale, without a new claim', () => {
    const claimsByFile = { 'content/a.md': [] };
    const ledger = { 'content/a.md': { 'joining Alpha and Beta as a winner.': 'verified.' } };
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [],
      staleEntries: [{ file: 'content/a.md', claim: 'joining Alpha and Beta as a winner.' }],
    });
  });

  it('treats a file present in claims but absent from the ledger as all-new', () => {
    const claimsByFile = { 'content/new.md': ['joining Alpha and Beta as a winner.'] };
    const ledger = {};
    expect(diffClaimsAgainstLedger(claimsByFile, ledger)).toEqual({
      newClaims: [{ file: 'content/new.md', claim: 'joining Alpha and Beta as a winner.' }],
      staleEntries: [],
    });
  });
});
