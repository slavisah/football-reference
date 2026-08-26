import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../src/lib/editions';
import { buildAllPlayerProfiles, buildPlayerProfile, type PlayerAwardSource } from '../../src/lib/playerProfile';
import {
  buildAllComparePlayerRecords,
  buildComparePlayerRecord,
  buildSharedAwardYears,
  type ComparePlayerAwardDef,
} from '../../src/lib/comparePlayers';
import type { MarkdownTable } from '../../src/lib/types';

const ballonDorTable: MarkdownTable = {
  headers: ['Year', 'Winner', 'National team', 'Ceremony date'],
  rows: [
    ['1970', 'Gerd Müller', 'West Germany', '29 December 1970'],
    ['1998', 'Zinedine Zidane', 'France', '1 December 1998'],
    ['2021', 'Lionel Messi', 'Argentina', '29 November 2021'],
  ],
};

const worldCupGoldenBootTable: MarkdownTable = {
  headers: ['Year', 'Player(s)', 'Team', 'Goals'],
  rows: [
    ['1970', 'Gerd Müller', 'West Germany', '10'],
    ['1998', 'Davor Šuker', 'Croatia', '6'],
  ],
};

const euroGoldenBootTable: MarkdownTable = {
  headers: ['Year', 'Player(s)', 'Team', 'Goals'],
  rows: [['1972', 'Gerd Müller', 'West Germany', '4']],
};

const sources: PlayerAwardSource[] = [
  { title: "Ballon d'Or", slug: 'ballon-dor', editions: buildEditions(ballonDorTable) },
  { title: 'FIFA World Cup Golden Boot', slug: 'golden-boot', editions: buildEditions(worldCupGoldenBootTable) },
  { title: 'UEFA EURO Golden Boot', slug: 'golden-boot', editions: buildEditions(euroGoldenBootTable) },
];

const awardDefs: ComparePlayerAwardDef[] = sources.map((s) => ({ title: s.title, slug: s.slug }));

describe('buildComparePlayerRecord', () => {
  it('gives every award a row, with a 0 count and empty years when the player never won it', () => {
    const messi = buildPlayerProfile('Lionel Messi', sources);
    const record = buildComparePlayerRecord(messi, awardDefs);
    expect(record.awards.map((a) => a.title)).toEqual([
      "Ballon d'Or",
      'FIFA World Cup Golden Boot',
      'UEFA EURO Golden Boot',
    ]);
    expect(record.awards[0]).toMatchObject({ count: 1, years: [{ year: '2021', yearSort: 2021 }] });
    expect(record.awards[1]).toMatchObject({ count: 0, years: [] });
    expect(record.totalAwards).toBe(1);
  });

  it('counts multiple wins of the same award, oldest year first', () => {
    const muller = buildPlayerProfile('Gerd Müller', sources);
    const record = buildComparePlayerRecord(muller, awardDefs);
    expect(record.totalAwards).toBe(3);
    expect(record.awards.every((a) => a.count === 1)).toBe(true);
  });
});

describe('buildAllComparePlayerRecords', () => {
  it('ranks by total awards, then by name', () => {
    const profiles = buildAllPlayerProfiles(sources);
    const records = buildAllComparePlayerRecords(profiles, awardDefs);
    expect(records[0].displayName).toBe('Gerd Müller');
    expect(records[0].totalAwards).toBe(3);
    const totals = records.map((r) => r.totalAwards);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
  });
});

describe('buildSharedAwardYears', () => {
  it('finds a year both players won something, even a different award each', () => {
    const profiles = buildAllPlayerProfiles(sources);
    const records = buildAllComparePlayerRecords(profiles, awardDefs);
    const zidane = records.find((r) => r.displayName === 'Zinedine Zidane')!;
    const suker = records.find((r) => r.displayName === 'Davor Šuker')!;
    const shared = buildSharedAwardYears(zidane, suker);
    expect(shared).toEqual([
      {
        year: '1998',
        yearSort: 1998,
        aAwards: ["Ballon d'Or"],
        bAwards: ['FIFA World Cup Golden Boot'],
      },
    ]);
  });

  it('returns an empty list for two players who never won in the same year', () => {
    const profiles = buildAllPlayerProfiles(sources);
    const records = buildAllComparePlayerRecords(profiles, awardDefs);
    const muller = records.find((r) => r.displayName === 'Gerd Müller')!;
    const messi = records.find((r) => r.displayName === 'Lionel Messi')!;
    expect(buildSharedAwardYears(muller, messi)).toEqual([]);
  });

  it('sorts more than one shared year oldest-first, even when the later shared year is found first', () => {
    // aYears is a Map built by iterating this table's rows in source order,
    // so listing the later shared year (2002) before the earlier one (1998)
    // here means buildSharedAwardYears() only comes back chronological if its
    // own .sort() actually runs, not just because of table row order.
    const ballonDorTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'National team', 'Ceremony date'],
      rows: [
        ['2002', 'Player X', 'Country', '1 December 2002'],
        ['1998', 'Player X', 'Country', '1 December 1998'],
      ],
    };
    const goldenBootTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [
        ['1998', 'Player Y', 'Country', '6'],
        ['2002', 'Player Y', 'Country', '8'],
      ],
    };
    const localSources: PlayerAwardSource[] = [
      { title: "Ballon d'Or", slug: 'ballon-dor', editions: buildEditions(ballonDorTable) },
      { title: 'FIFA World Cup Golden Boot', slug: 'golden-boot', editions: buildEditions(goldenBootTable) },
    ];
    const localAwardDefs = localSources.map((s) => ({ title: s.title, slug: s.slug }));
    const x = buildComparePlayerRecord(buildPlayerProfile('Player X', localSources), localAwardDefs);
    const y = buildComparePlayerRecord(buildPlayerProfile('Player Y', localSources), localAwardDefs);
    expect(buildSharedAwardYears(x, y).map((s) => s.year)).toEqual(['1998', '2002']);
  });
});
