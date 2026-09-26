import { describe, expect, it } from 'vitest';
import {
  extractYears,
  extractEarlierEditionsCardinal,
  extractNotesPlainText,
  stripMarkdownEmphasis,
  extractNoteCardsWithItems,
  locateClaimPosition,
  diffClaimsAgainstHrNotes,
  diffClaimsPositionally,
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

describe('stripMarkdownEmphasis', () => {
  it('strips the leading **year:** bold marker every ledger claim starts with', () => {
    expect(stripMarkdownEmphasis('**1990:** Franz Beckenbauer (West Germany).')).toBe('1990: Franz Beckenbauer (West Germany).');
  });

  it('strips italic and inline-code markers down to their inner text', () => {
    expect(stripMarkdownEmphasis('see *this* and `docs/SOURCES.md` for detail')).toBe('see this and docs/SOURCES.md for detail');
  });

  it('collapses internal whitespace and trims the result', () => {
    expect(stripMarkdownEmphasis('  **2016:**   Rui Patrício   ')).toBe('2016: Rui Patrício');
  });
});

describe('extractNoteCardsWithItems', () => {
  it('extracts a list section as {heading, items}, tags removed without inserting whitespace', () => {
    const html =
      '<section class="notes__card card"><h2>Team of the Tournament</h2>' +
      '<ul class="notes__list"><li>shares the record with <strong>Jair</strong>.</li>' +
      '<li>the only winner from a guest nation.</li></ul></section>';
    expect(extractNoteCardsWithItems(html)).toEqual([
      {
        heading: 'Team of the Tournament',
        items: ['shares the record with Jair.', 'the only winner from a guest nation.'],
      },
    ]);
  });

  it('extracts a single-paragraph section as one item, skipping its own intro paragraph', () => {
    const html =
      '<section class="notes__card card"><h2>How it works</h2>' +
      '<p class="notes__intro">Some lead-in text.</p>' +
      '<p>The only paragraph item.</p></section>';
    expect(extractNoteCardsWithItems(html)).toEqual([{ heading: 'How it works', items: ['The only paragraph item.'] }]);
  });

  it('unescapes &amp;/&lt;/&gt; entities the way renderInlineMarkdown() escaped them', () => {
    const html = '<section class="notes__card card"><h2>Notes</h2><ul><li>Bosnia &amp; Herzegovina</li></ul></section>';
    expect(extractNoteCardsWithItems(html)).toEqual([{ heading: 'Notes', items: ['Bosnia & Herzegovina'] }]);
  });

  it('returns an empty array for a page with no note cards', () => {
    expect(extractNoteCardsWithItems('<main><p>Nothing here.</p></main>')).toEqual([]);
  });
});

describe('locateClaimPosition', () => {
  const enCards = [
    { heading: 'Editorial notes', items: ['An unrelated first section item.'] },
    {
      heading: 'Team of the Tournament',
      items: ['1996: entry one.', '2004: entry two, twelve years before 2016.'],
    },
  ];

  it('finds the unique {sectionIndex, itemIndex} for a claim matching one item exactly', () => {
    expect(locateClaimPosition('**2004:** entry two, twelve years before 2016.', enCards)).toEqual({
      sectionIndex: 1,
      itemIndex: 1,
    });
  });

  it('returns null when the claim matches no item', () => {
    expect(locateClaimPosition('**2020:** an entry that was never added.', enCards)).toBeNull();
  });

  it('returns null when the claim matches more than one item (ambiguous)', () => {
    const duplicated = [
      { heading: 'A', items: ['2004: repeated text.'] },
      { heading: 'B', items: ['2004: repeated text.'] },
    ];
    expect(locateClaimPosition('**2004:** repeated text.', duplicated)).toBeNull();
  });
});

describe('diffClaimsPositionally', () => {
  const enCards = [
    {
      heading: 'Team of the Tournament',
      items: ['1996: entry one.', "2016: Cristiano Ronaldo's second selection, twelve years after 2004."],
    },
  ];

  it('checks the Croatian item at the same position, not the whole page', () => {
    const hrCards = [
      {
        heading: 'Idealna momčad turnira',
        // Position (0, 1) - the paired item for the 2016 claim - mentions
        // 2016 but not 2004. A *different*, unrelated bullet (0, 0) happens
        // to mention 2004 - this is the exact same-page-coincidence bug a
        // whole-page check would have missed, since 2004 does appear
        // somewhere on this Croatian page, just not in the right bullet.
        items: ['1996.: unrelated entry mentioning 2004 for a different reason.', '2016.: drugi izbor za Ronalda.'],
      },
    ];
    const claims = ["**2016:** Cristiano Ronaldo's second selection, twelve years after 2004."];
    const problems = diffClaimsPositionally(claims, enCards, hrCards, 'unused whole-page text', 'content/uefa-euro.md', '/hr/competitions/euro/', 'x.json');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('2004');
    expect(problems[0]).toContain('section 0, item 1');
  });

  it('reports no problems when the paired Croatian item has every year', () => {
    const hrCards = [
      {
        heading: 'Idealna momčad turnira',
        items: ['1996.: unos jedan.', '2016.: drugi izbor Cristiana Ronalda, dvanaest godina nakon 2004.'],
      },
    ];
    const claims = ["**2016:** Cristiano Ronaldo's second selection, twelve years after 2004."];
    expect(diffClaimsPositionally(claims, enCards, hrCards, 'unused whole-page text', 'content/uefa-euro.md', '/hr/competitions/euro/', 'x.json')).toEqual([]);
  });

  it('falls back to the whole-page check for a claim that cannot be positionally paired', () => {
    const claims = ['**2030:** a claim never rendered on this English page at all.'];
    const problems = diffClaimsPositionally(claims, enCards, [], '1996. 2004.', 'content/uefa-euro.md', '/hr/competitions/euro/', 'x.json');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('2030');
  });
});
