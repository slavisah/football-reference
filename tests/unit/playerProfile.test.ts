import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../src/lib/editions';
import {
  buildAllPlayerProfiles,
  buildPlayerProfile,
  distinctPlayers,
  playerProfileSlug,
  type PlayerAwardSource,
} from '../../src/lib/playerProfile';
import type { MarkdownTable } from '../../src/lib/types';

const ballonDorTable: MarkdownTable = {
  headers: ['Year', 'Winner', 'National team', 'Ceremony date'],
  rows: [
    ['1970', 'Gerd Müller', 'West Germany', '29 December 1970'],
    ['2020', 'Not awarded', '—', '—'],
    ['2021', 'Lionel Messi', 'Argentina', '29 November 2021'],
  ],
};

const worldCupGoldenBootTable: MarkdownTable = {
  headers: ['Year', 'Player(s)', 'Team', 'Goals'],
  rows: [
    ['1970', 'Gerd Müller', 'West Germany', '10'],
    ['1994', 'Hristo Stoichkov; Oleg Salenko', 'Bulgaria; Russia', '6'],
    ['1962', 'Garrincha; Vavá', 'Multiple', '4'],
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

describe('buildPlayerProfile', () => {
  it('combines a player’s awards across every source, each in its own group', () => {
    const profile = buildPlayerProfile('Gerd Müller', sources);
    expect(profile.totalAwards).toBe(3);
    expect(profile.awards.map((a) => a.title)).toEqual([
      "Ballon d'Or",
      'FIFA World Cup Golden Boot',
      'UEFA EURO Golden Boot',
    ]);
    expect(profile.awards[0].appearances).toEqual([
      { year: '1970', yearSort: 1970, detail: 'West Germany · 29 December 1970' },
    ]);
    expect(profile.awards[1].appearances[0].detail).toBe('West Germany · 10 goals');
  });

  it('omits an award entirely when the player never won it', () => {
    const profile = buildPlayerProfile('Lionel Messi', sources);
    expect(profile.awards.map((a) => a.title)).toEqual(["Ballon d'Or"]);
    expect(profile.totalAwards).toBe(1);
  });

  it('aligns a tied Golden Boot row’s Team cell by the same index as the player’s name', () => {
    const profile = buildPlayerProfile('Oleg Salenko', sources);
    expect(profile.awards[0].appearances[0].detail).toBe('Russia · 6 goals');
    const stoichkov = buildPlayerProfile('Hristo Stoichkov', sources);
    expect(stoichkov.awards[0].appearances[0].detail).toBe('Bulgaria · 6 goals');
  });

  it('omits the team when a tie’s Team cell is the "Multiple" placeholder, but keeps the shared goal count', () => {
    const profile = buildPlayerProfile('Garrincha', sources);
    expect(profile.awards[0].appearances[0].detail).toBe('4 goals');
  });

  it('falls back to the whole raw Team cell for a single winner whose cell count does not match', () => {
    // A data anomaly (a single winner, but a Team cell with a mismatched
    // "; "-joined count) - falls back to the whole cell verbatim rather than
    // guessing which part is theirs.
    const mismatchedSingleTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1998', 'Davor Šuker', 'Croatia; Yugoslavia', '6']],
    };
    const mismatchedSources: PlayerAwardSource[] = [
      { title: 'World Cup Golden Boot', slug: 'golden-boot', editions: buildEditions(mismatchedSingleTable) },
    ];
    const profile = buildPlayerProfile('Davor Šuker', mismatchedSources);
    expect(profile.awards[0].appearances[0].detail).toBe('Croatia; Yugoslavia · 6 goals');
  });

  it('omits the team entirely when a tie’s Team cell count disagrees with the tie count, with no "Multiple" placeholder', () => {
    const mismatchedTieTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1990', 'Player A; Player B', 'Team X; Team Y; Team Z', '5']],
    };
    const mismatchedSources: PlayerAwardSource[] = [
      { title: 'World Cup Golden Boot', slug: 'golden-boot', editions: buildEditions(mismatchedTieTable) },
    ];
    const profile = buildPlayerProfile('Player A', mismatchedSources);
    expect(profile.awards[0].appearances[0].detail).toBe('5 goals');
  });

  it('sorts a repeat winner’s appearances oldest-first even when the source table lists a later win before an earlier one', () => {
    // Real content is chronological already (e.g. Lionel Messi's Ballon d'Or
    // rows in content/ballon-dor.md run 2021 then 2023), but appearancesFor()
    // sorts unconditionally rather than trusting row order - this table is
    // deliberately reversed to prove that, not to model a real data shape.
    const repeatWinnerTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'National team', 'Ceremony date'],
      rows: [
        ['2023', 'Lionel Messi', 'Argentina', '30 October 2023'],
        ['2021', 'Lionel Messi', 'Argentina', '29 November 2021'],
      ],
    };
    const repeatSources: PlayerAwardSource[] = [
      { title: "Ballon d'Or", slug: 'ballon-dor', editions: buildEditions(repeatWinnerTable) },
    ];
    const profile = buildPlayerProfile('Lionel Messi', repeatSources);
    expect(profile.awards[0].appearances.map((a) => a.year)).toEqual(['2021', '2023']);
  });

  it('returns an empty profile for a player present in none of the sources', () => {
    const profile = buildPlayerProfile('Nobody At All', sources);
    expect(profile.awards).toEqual([]);
    expect(profile.totalAwards).toBe(0);
  });

  it('uses a custom goalsLabel for the goal-count unit, leaving team/date facts untouched (Croatian page)', () => {
    const profile = buildPlayerProfile('Gerd Müller', sources, { goalsLabel: 'golova' });
    // The Golden Boot row's unit word is translated...
    expect(profile.awards[1].appearances[0].detail).toBe('West Germany · 10 golova');
    // ...but the Ballon d'Or row (team + ceremony date, no goal count) is
    // unaffected: those are source-derived facts, not a translatable unit.
    expect(profile.awards[0].appearances[0].detail).toBe('West Germany · 29 December 1970');
  });
});

describe('distinctPlayers / buildAllPlayerProfiles', () => {
  it('lists every real winner across all sources, alphabetically, excluding placeholder rows', () => {
    const names = distinctPlayers(sources);
    expect(names).not.toContain('Not awarded');
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).toContain('Gerd Müller');
    expect(names).toContain('Oleg Salenko');
  });

  it('builds one profile per distinct player, sorted by display name', () => {
    const profiles = buildAllPlayerProfiles(sources);
    const names = profiles.map((p) => p.displayName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(profiles.every((p) => p.awards.length > 0)).toBe(true);
    const muller = profiles.find((p) => p.displayName === 'Gerd Müller');
    expect(muller?.totalAwards).toBe(3);
  });
});

describe('playerProfileSlug', () => {
  it('folds diacritics and spaces into a plain-ASCII, hyphenated slug', () => {
    expect(playerProfileSlug('Gerd Müller')).toBe('gerd-muller');
    expect(playerProfileSlug('Dražan Jerković')).toBe('drazan-jerkovic');
    expect(playerProfileSlug('Flórián Albert')).toBe('florian-albert');
  });
});
