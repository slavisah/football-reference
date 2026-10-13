import { describe, expect, it } from 'vitest';
import {
  backToBackStreaks,
  biggestMargins,
  buildEditions,
  firstYear,
  homeSoilTitles,
  longestWait,
  nearlyTally,
  parsePageRankings,
  rankTally,
  rivalries,
  splitNames,
  tallyByYear,
} from '../../scripts/check-records-against-source.mjs';

describe('firstYear', () => {
  it('parses a plain year', () => {
    expect(firstYear('1990')).toBe(1990);
  });

  it('parses the first year out of a season string', () => {
    expect(firstYear('2018–19')).toBe(2018);
  });
});

describe('splitNames', () => {
  it('splits a semicolon-joined tie into trimmed names', () => {
    expect(splitNames('Garrincha; Vavá; Leonel Sánchez')).toEqual(['Garrincha', 'Vavá', 'Leonel Sánchez']);
  });

  it('returns a single-item array for a lone winner', () => {
    expect(splitNames('Just Fontaine')).toEqual(['Just Fontaine']);
  });

  it('treats a "Not awarded" cell as no winners', () => {
    expect(splitNames('Not awarded (tournament cancelled)')).toEqual([]);
  });
});

const TABLE = {
  heading: 'Editions',
  headers: ['Year', 'Host(s)', 'Winner', 'Runner-up', 'Third', 'Fourth'],
  rows: [
    ['1930', 'Uruguay', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
    ['1934', 'Italy', 'Italy', 'Czechoslovakia', 'Germany', 'Austria'],
    ['1938', 'France', 'Italy', 'Hungary', 'Brazil', 'Sweden'],
    ['1954', 'Switzerland', 'West Germany', 'Hungary', 'Austria', 'Uruguay'],
  ],
};

const GERMANY_ALIAS = { 'West Germany': 'Germany (incl. West Germany)', Germany: 'Germany (incl. West Germany)' };

describe('buildEditions', () => {
  it('extracts the requested columns by name, in row order', () => {
    const editions = buildEditions(TABLE, {
      year: 'Year',
      host: 'Host(s)',
      winner: 'Winner',
      runner: 'Runner-up',
      third: 'Third',
      fourth: 'Fourth',
    });
    expect(editions).toHaveLength(4);
    expect(editions[0]).toEqual({
      year: '1930',
      host: 'Uruguay',
      winner: 'Uruguay',
      runner: 'Argentina',
      third: 'United States',
      fourth: 'Yugoslavia',
      final: undefined,
    });
  });
});

const editions = buildEditions(TABLE, {
  year: 'Year',
  host: 'Host(s)',
  winner: 'Winner',
  runner: 'Runner-up',
  third: 'Third',
  fourth: 'Fourth',
});

describe('tallyByYear + rankTally', () => {
  it('tallies occurrences and sorts by count desc, then earliest year asc', () => {
    const tally = tallyByYear(editions, (e) => e.winner, { alias: GERMANY_ALIAS });
    expect(rankTally(tally)).toEqual([
      { name: 'Italy', count: 2, years: ['1934', '1938'] },
      { name: 'Uruguay', count: 1, years: ['1930'] },
      { name: 'Germany (incl. West Germany)', count: 1, years: ['1954'] },
    ]);
  });

  it('excludes a given sentinel value (e.g. "no single host")', () => {
    const tally = tallyByYear(editions, () => 'Home-and-away', { excludeValue: 'Home-and-away' });
    expect(tally.size).toBe(0);
  });
});

describe('homeSoilTitles', () => {
  it('only counts a title won by the (aliased) host nation itself', () => {
    expect(homeSoilTitles(editions, GERMANY_ALIAS)).toEqual([
      { name: 'Uruguay', count: 1, years: ['1930'] },
      { name: 'Italy', count: 1, years: ['1934'] },
    ]);
  });
});

describe('backToBackStreaks', () => {
  it('finds a maximal run of consecutive editions won by the same team', () => {
    const streaks = backToBackStreaks(editions, { alias: GERMANY_ALIAS });
    expect(streaks).toEqual([{ name: 'Italy', years: ['1934', '1938'] }]);
  });

  it('tracks each tied winner independently when multiWinner is set', () => {
    const tiedEditions = [
      { year: '1960', winner: ['A', 'B'] },
      { year: '1964', winner: ['B', 'C'] },
      { year: '1968', winner: ['C'] },
    ];
    const streaks = backToBackStreaks(tiedEditions, { multiWinner: true });
    expect(streaks).toEqual(
      expect.arrayContaining([
        { name: 'B', years: ['1960', '1964'] },
        { name: 'C', years: ['1964', '1968'] },
      ]),
    );
  });
});

describe('nearlyTally', () => {
  it('counts runner-up finishes, excluding any team that ever won outright', () => {
    // Italy is a winner (1934, 1938) so its own runner-up finishes (none here) would be excluded anyway;
    // Czechoslovakia and Hungary never won, so both should appear.
    expect(nearlyTally(editions, 'runner')).toEqual([
      { name: 'Hungary', count: 2, years: ['1938', '1954'] },
      { name: 'Argentina', count: 1, years: ['1930'] },
      { name: 'Czechoslovakia', count: 1, years: ['1934'] },
    ]);
  });
});

describe('longestWait', () => {
  it('finds the single longest gap between any team’s own titles', () => {
    const multiTitle = buildEditions(
      {
        headers: ['Year', 'Winner'],
        rows: [
          ['1934', 'Italy'],
          ['1938', 'Italy'],
          ['1982', 'Italy'],
          ['2006', 'Italy'],
        ],
      },
      { year: 'Year', winner: 'Winner' },
    );
    const gaps = longestWait(multiTitle);
    expect(gaps.get('Italy')).toEqual({ gap: 44, from: '1938', to: '1982' });
  });

  it('preserves season-string year labels (no titles merged into a bare year)', () => {
    const seasons = buildEditions(
      {
        headers: ['Season', 'Winner'],
        rows: [
          ['2018–19', 'Portugal'],
          ['2024–25', 'Portugal'],
        ],
      },
      { year: 'Season', winner: 'Winner' },
    );
    expect(longestWait(seasons).get('Portugal')).toEqual({ gap: 6, from: '2018–19', to: '2024–25' });
  });
});

describe('biggestMargins', () => {
  it('ranks finals by goal margin desc, then by year asc within a tie', () => {
    const finals = buildEditions(
      {
        headers: ['Year', 'Final'],
        rows: [
          ['1930', 'Uruguay 4–2 Argentina'],
          ['1990', 'West Germany 1–0 Argentina'],
          ['1934', 'Italy 2–1 Czechoslovakia (a.e.t.)'],
          ['2022', 'Argentina 3–3 France; 4–2 pens'],
        ],
      },
      { year: 'Year', final: 'Final' },
    );
    expect(biggestMargins(finals)).toEqual([
      { final: 'Uruguay 4–2 Argentina', margin: 2, year: '1930' },
      { final: 'Italy 2–1 Czechoslovakia (a.e.t.)', margin: 1, year: '1934' },
      { final: 'West Germany 1–0 Argentina', margin: 1, year: '1990' },
      { final: 'Argentina 3–3 France; 4–2 pens', margin: 0, year: '2022' },
    ]);
  });
});

describe('rivalries', () => {
  it('tallies head-to-head finals between a pair, ordering competitions by first meeting', () => {
    const finals = [
      { winner: 'Uruguay', runner: 'Argentina', year: '1930', competition: 'FIFA World Cup' },
      { winner: 'Uruguay', runner: 'Argentina', year: '1917', competition: 'Copa América' },
      { winner: 'Argentina', runner: 'Brazil', year: '2021', competition: 'Copa América' },
    ];
    const result = rivalries(finals);
    expect(result).toEqual([
      {
        pair: 'Argentina vs Uruguay',
        total: 2,
        wins: new Map([['Uruguay', 2]]),
        competitions: ['Copa América', 'FIFA World Cup'],
        lastYear: '1930',
        lastCompetition: 'FIFA World Cup',
      },
    ]);
  });

  it('drops a pair that has only met once (not a rivalry yet)', () => {
    const finals = [{ winner: 'France', runner: 'Croatia', year: '2018', competition: 'FIFA World Cup' }];
    expect(rivalries(finals)).toEqual([]);
  });
});

describe('parsePageRankings', () => {
  it('extracts every named ItemList JSON-LD block, keyed by its own name', () => {
    const html = `
      <script type="application/ld+json">{"@type":"ItemList","name":"A - Most successful teams","itemListElement":[{"@type":"ListItem","position":1,"item":{"@type":"Thing","name":"Brazil","description":"5 titles (1958, 1962)"}}]}</script>
      <script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>
    `;
    const rankings = parsePageRankings(html);
    expect(rankings.size).toBe(1);
    expect(rankings.get('A - Most successful teams')).toEqual([{ name: 'Brazil', description: '5 titles (1958, 1962)' }]);
  });
});
