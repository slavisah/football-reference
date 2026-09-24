import { describe, expect, it } from 'vitest';
import {
  extractYears,
  extractEarlierEditionsCardinal,
  extractNotesPlainText,
  diffClaimsAgainstHrNotes,
} from '../../scripts/check-claims-hr.mjs';

describe('extractYears', () => {
  it('extracts a single four-digit year', () => {
    expect(extractYears('Luka Modrić became the only Croatian winner of the Ballon d\'Or in 2018.')).toEqual(['2018']);
  });

  it('extracts multiple distinct years in document order', () => {
    const text = '2010: Spain, after West Germany (1974), Argentina (1978), Brazil (1994) and France (1998).';
    expect(extractYears(text)).toEqual(['2010', '1974', '1978', '1994', '1998']);
  });

  it('deduplicates a year mentioned more than once', () => {
    expect(extractYears('Since 1996; no equivalent existed before 1996.')).toEqual(['1996']);
  });

  it('returns an empty array when the claim names no year', () => {
    expect(extractYears('Lev Yashin remains the only goalkeeper to win the men\'s award.')).toEqual([]);
  });

  it('ignores a number that is not a plausible year', () => {
    expect(extractYears('Just Fontaine\'s 13 goals in 1958 remain the record for one edition.')).toEqual(['1958']);
  });
});

describe('extractEarlierEditionsCardinal', () => {
  it('translates "the eight earlier editions" to its Croatian cardinal', () => {
    const text =
      'FIFA has named a team Fair Play Award ... at every World Cup since 1970; no equivalent award existed at the eight earlier editions.';
    expect(extractEarlierEditionsCardinal(text)).toBe('osam');
  });

  it('translates "the nine earlier editions" to its Croatian cardinal', () => {
    const text = 'UEFA has named a best-player award at every EURO since 1996; no equivalent award existed at the nine earlier editions.';
    expect(extractEarlierEditionsCardinal(text)).toBe('devet');
  });

  it('returns null when the claim has no "earlier editions" phrase', () => {
    expect(extractEarlierEditionsCardinal('Portugal won the first-ever Nations League Finals in 2019.')).toBeNull();
  });

  it('returns null for a count word outside the deliberately narrow two-through-twelve range', () => {
    expect(extractEarlierEditionsCardinal('no equivalent award existed at the twenty earlier editions.')).toBeNull();
  });
});

describe('extractNotesPlainText', () => {
  it('concatenates the text of every .notes__card section, tags stripped', () => {
    const html =
      '<section class="notes__card card" id="a"><h2>Heading</h2><ul><li>UEFA dodjeljuje nagradu od 1996.</li></ul></section>' +
      '<main>Not a note card: 2099.</main>';
    const text = extractNotesPlainText(html);
    expect(text).toContain('1996');
    expect(text).not.toContain('2099');
  });

  it('returns an empty string when the page has no note cards', () => {
    expect(extractNotesPlainText('<main><p>Nothing here.</p></main>')).toBe('');
  });
});

describe('diffClaimsAgainstHrNotes', () => {
  it('reports no problems when every year is present in the Croatian notes text', () => {
    const claims = ['George Weah became the first African player to win the Ballon d\'Or in 1995.'];
    const hrText = 'George Weah je 1995. postao prvi afrički dobitnik Zlatne lopte.';
    expect(diffClaimsAgainstHrNotes(claims, hrText, 'content/ballon-dor.md', '/hr/competitions/ballon-dor/', 'x.json')).toEqual([]);
  });

  it('flags a year missing entirely from the Croatian notes text', () => {
    const claims = ['George Weah became the first African player to win the Ballon d\'Or in 1995.'];
    const hrText = 'George Weah je 1996. postao prvi afrički dobitnik Zlatne lopte.';
    const problems = diffClaimsAgainstHrNotes(claims, hrText, 'content/ballon-dor.md', '/hr/competitions/ballon-dor/', 'x.json');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('1995');
  });

  it('flags a missing earlier-editions cardinal translation', () => {
    const claims = [
      'UEFA has named a best-player award at every EURO since 1996; no equivalent award existed at the nine earlier editions.',
    ];
    const hrText = 'UEFA dodjeljuje nagradu za najboljeg igrača na svakom EURU od 1996.; ekvivalentna nagrada nije postojala na četiri ranijih izdanja.';
    const problems = diffClaimsAgainstHrNotes(claims, hrText, 'content/uefa-euro.md', '/hr/competitions/euro/', 'since-claims-ledger.json');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('devet');
  });

  it('reports no problems for a claim with no year at all', () => {
    const claims = ['Lev Yashin remains the only goalkeeper to win the men\'s award.'];
    expect(diffClaimsAgainstHrNotes(claims, 'unrelated Croatian text', 'content/ballon-dor.md', '/hr/competitions/ballon-dor/', 'x.json')).toEqual([]);
  });
});
