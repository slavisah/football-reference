import { describe, expect, it } from 'vitest';
import {
  buildBiggestFinalMargins,
  buildChampionsSummary,
  buildEditions,
  buildHomeSoilTitles,
  buildHostsSummary,
  buildLongestStreaks,
  buildLongestTitleGaps,
  buildNearlyFinalists,
  buildPodiums,
  buildRunnerUpsWithoutTitle,
  buildTimeline,
  buildTopScorerFacts,
  distinctHosts,
  distinctTeams,
  distinctWinners,
  editionTeams,
  isPlaceholderWinner,
} from '../../src/lib/editions';
import type { MarkdownTable } from '../../src/lib/types';

const table: MarkdownTable = {
  heading: 'Editions',
  headers: ['Year', 'Host', 'Teams', 'Winner'],
  rows: [
    ['1954', 'Switzerland', '16', 'West Germany'],
    ['1974', 'West Germany', '16', 'West Germany'],
    ['2010', 'South Africa', '32', 'Spain'],
    ['2014', 'Brazil', '32', 'Germany'],
    ['2026', 'Canada, Mexico and United States', '48', 'Spain'],
  ],
};

describe('buildEditions', () => {
  it('normalizes year, winner, host and teams while keeping every cell', () => {
    const editions = buildEditions(table);
    expect(editions[0]).toMatchObject({
      year: '1954',
      yearSort: 1954,
      winner: 'West Germany',
      host: 'Switzerland',
      teams: 16,
    });
    expect(editions[0].cells).toHaveLength(4);
    expect(editions[0].cells[3]).toEqual({ label: 'Winner', value: 'West Germany' });
  });

  it('parses a season label like "2018-19" to its leading year', () => {
    const seasonTable: MarkdownTable = {
      headers: ['Season', 'Winner'],
      rows: [['2018-19', 'Portugal']],
    };
    expect(buildEditions(seasonTable)[0].yearSort).toBe(2018);
  });

  it('treats a "Player(s)" column as the winner column, for top-scorer tables', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1958', 'Just Fontaine', 'France', '13']],
    };
    expect(buildEditions(scorersTable)[0]).toMatchObject({
      winner: 'Just Fontaine',
      host: undefined,
    });
  });
});

describe('buildChampionsSummary', () => {
  it('groups West Germany and Germany but keeps other nations distinct', () => {
    const summary = buildChampionsSummary(buildEditions(table));
    const germany = summary.find((s) => s.id === 'germany');
    expect(germany?.titles).toBe(3);
    expect(germany?.years).toEqual(['1954', '1974', '2014']);
    expect(germany?.displayName).toBe('Germany (incl. West Germany)');

    const spain = summary.find((s) => s.displayName === 'Spain');
    expect(spain?.titles).toBe(2);
    expect(spain?.years).toEqual(['2010', '2026']);
  });

  it('sorts by titles desc, then by earliest title year', () => {
    const summary = buildChampionsSummary(buildEditions(table));
    expect(summary.map((s) => s.displayName)).toEqual([
      'Germany (incl. West Germany)',
      'Spain',
    ]);
  });

  it('excludes a "Not awarded" placeholder row, like the 2020 Ballon d\'Or, from the totals', () => {
    const withPlaceholder: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2019', 'Lionel Messi'],
        ['2020', 'Not awarded'],
        ['2021', 'Lionel Messi'],
      ],
    };
    const summary = buildChampionsSummary(buildEditions(withPlaceholder));
    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({ displayName: 'Lionel Messi', titles: 2 });
  });

  it('splits "; "-separated joint-winner ties so each player is credited individually, like Golden Boot\'s Cristiano Ronaldo (tied in 2012, outright in 2020)', () => {
    const goldenBootLike: MarkdownTable = {
      headers: ['Year', "Player(s)"],
      rows: [
        ['2012', 'Mario Balotelli; Mario Gómez; Mario Mandžukić; Cristiano Ronaldo; Alan Dzagoev; Fernando Torres'],
        ['2016', 'Antoine Griezmann'],
        ['2020', 'Cristiano Ronaldo'],
      ],
    };
    const summary = buildChampionsSummary(buildEditions(goldenBootLike));

    const ronaldo = summary.find((s) => s.displayName === 'Cristiano Ronaldo');
    expect(ronaldo?.titles).toBe(2);
    expect(ronaldo?.years).toEqual(['2012', '2020']);

    // Every other tied 2012 name is its own one-title entry, not folded into
    // a single six-name compound "champion".
    for (const name of ['Mario Balotelli', 'Mario Gómez', 'Mario Mandžukić', 'Alan Dzagoev', 'Fernando Torres']) {
      const entry = summary.find((s) => s.displayName === name);
      expect(entry?.titles).toBe(1);
      expect(entry?.years).toEqual(['2012']);
    }

    expect(summary.some((s) => s.displayName.includes(';'))).toBe(false);
  });
});

describe('isPlaceholderWinner', () => {
  it('recognizes common "no winner" phrases case-insensitively', () => {
    expect(isPlaceholderWinner('Not awarded')).toBe(true);
    expect(isPlaceholderWinner('not held')).toBe(true);
    expect(isPlaceholderWinner('Cancelled')).toBe(true);
    expect(isPlaceholderWinner('Canceled')).toBe(true);
    expect(isPlaceholderWinner('No award')).toBe(true);
  });

  it('does not flag a real winner name', () => {
    expect(isPlaceholderWinner('Spain')).toBe(false);
    expect(isPlaceholderWinner('Lionel Messi')).toBe(false);
  });
});

describe('distinctWinners', () => {
  it('lists each winner once, alphabetically, preserving historical names', () => {
    expect(distinctWinners(buildEditions(table))).toEqual([
      'Germany',
      'Spain',
      'West Germany',
    ]);
  });

  it('omits a "Not awarded" placeholder row from the filter options', () => {
    const withPlaceholder: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2019', 'Lionel Messi'],
        ['2020', 'Not awarded'],
      ],
    };
    expect(distinctWinners(buildEditions(withPlaceholder))).toEqual(['Lionel Messi']);
  });

  it('splits a "; "-joined joint-tie Player(s) cell into individual winners (Golden Boot)', () => {
    const jointTieTable: MarkdownTable = {
      headers: ['Year', 'Player(s)'],
      rows: [
        [
          '1962',
          'Garrincha; Vavá; Leonel Sánchez; Flórián Albert; Valentin Ivanov; Dražan Jerković',
        ],
        ['1994', 'Hristo Stoichkov; Oleg Salenko'],
      ],
    };
    expect(distinctWinners(buildEditions(jointTieTable))).toEqual([
      'Dražan Jerković',
      'Flórián Albert',
      'Garrincha',
      'Hristo Stoichkov',
      'Leonel Sánchez',
      'Oleg Salenko',
      'Valentin Ivanov',
      'Vavá',
    ]);
  });

  it('lists a player once even if they appear both solo and in a joint tie in different editions', () => {
    const mixedTable: MarkdownTable = {
      headers: ['Year', 'Player(s)'],
      rows: [
        ['2012', 'Mario Balotelli; Mario Gómez; Cristiano Ronaldo'],
        ['2020', 'Cristiano Ronaldo'],
      ],
    };
    expect(distinctWinners(buildEditions(mixedTable))).toEqual([
      'Cristiano Ronaldo',
      'Mario Balotelli',
      'Mario Gómez',
    ]);
  });
});

describe('distinctHosts', () => {
  it('lists each host once, alphabetically', () => {
    expect(distinctHosts(buildEditions(table))).toEqual([
      'Brazil',
      'Canada, Mexico and United States',
      'South Africa',
      'Switzerland',
      'West Germany',
    ]);
  });

  it('returns an empty list when the table has no host column', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1958', 'Just Fontaine', 'France', '13']],
    };
    expect(distinctHosts(buildEditions(scorersTable))).toEqual([]);
  });

  it('excludes the "Home-and-away" non-country placeholder from the host filter', () => {
    const copaTable: MarkdownTable = {
      headers: ['Year', 'Host / format', 'Winner', 'Runner-up'],
      rows: [
        ['1975', 'Home-and-away', 'Peru', 'Colombia'],
        ['1929', 'Argentina', 'Argentina', 'Uruguay'],
      ],
    };
    expect(distinctHosts(buildEditions(copaTable))).toEqual(['Argentina']);
  });
});

describe('buildHostsSummary', () => {
  it('does NOT group West Germany under Germany, unlike buildChampionsSummary', () => {
    const summary = buildHostsSummary(buildEditions(table));
    const westGermany = summary.find((s) => s.displayName === 'West Germany');
    const germany = summary.find((s) => s.displayName === 'Germany');
    expect(westGermany).toMatchObject({ titles: 1, years: ['1974'] });
    expect(germany).toBeUndefined();
  });

  it('counts a co-host edition\'s combined label as a single host entry, matching distinctHosts', () => {
    const summary = buildHostsSummary(buildEditions(table));
    expect(summary.find((s) => s.displayName === 'Canada, Mexico and United States')).toMatchObject({
      titles: 1,
      years: ['2026'],
    });
  });

  it('sorts by times-hosted desc, then earliest hosting year', () => {
    const repeatHostTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Uruguay', 'Uruguay'],
        ['1950', 'Brazil', 'Uruguay'],
        ['1970', 'Mexico', 'Brazil'],
        ['1986', 'Mexico', 'Argentina'],
      ],
    };
    const summary = buildHostsSummary(buildEditions(repeatHostTable));
    // Mexico hosted twice, so it ranks first; Uruguay (1930) and Brazil (1950)
    // both hosted once and tie-break on earliest hosting year.
    expect(summary.map((s) => s.displayName)).toEqual(['Mexico', 'Uruguay', 'Brazil']);
    expect(summary[0]).toMatchObject({ titles: 2, years: ['1970', '1986'] });
  });

  it('excludes the "Home-and-away" non-country placeholder, like distinctHosts', () => {
    const copaTable: MarkdownTable = {
      headers: ['Year', 'Host / format', 'Winner', 'Runner-up'],
      rows: [
        ['1975', 'Home-and-away', 'Peru', 'Colombia'],
        ['1929', 'Argentina', 'Argentina', 'Uruguay'],
      ],
    };
    expect(buildHostsSummary(buildEditions(copaTable))).toEqual([
      expect.objectContaining({ displayName: 'Argentina', titles: 1 }),
    ]);
  });

  it('returns an empty list when the table has no host column', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1958', 'Just Fontaine', 'France', '13']],
    };
    expect(buildHostsSummary(buildEditions(scorersTable))).toEqual([]);
  });
});

describe('buildHomeSoilTitles', () => {
  it('counts an edition where the winner exactly matches the host, using the shared fixture', () => {
    // The shared `table` fixture's 1974 row is West Germany hosting and
    // winning - a real home-soil title.
    const summary = buildHomeSoilTitles(buildEditions(table));
    const germany = summary.find((s) => s.id === 'germany');
    expect(germany).toMatchObject({
      displayName: 'Germany (incl. West Germany)',
      titles: 1,
      years: ['1974'],
      names: ['West Germany'],
    });
  });

  it('does not count a co-host edition even when one of the co-hosts wins, matching Spain not winning "at home" in 2026', () => {
    // The shared fixture's 2026 row: host "Canada, Mexico and United
    // States", winner "Spain" - Spain is not a host at all here, but this
    // also locks in the co-host exact-match design even for a country that
    // *is* one of several hosts (see the next test for that exact case).
    const summary = buildHomeSoilTitles(buildEditions(table));
    expect(summary.find((s) => s.displayName === 'Spain')).toBeUndefined();
  });

  it('does not count a co-host that wins under its own single-country name, since the host cell is a combined string', () => {
    const coHostTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [['2000', 'Belgium and Netherlands', 'Netherlands']],
    };
    expect(buildHomeSoilTitles(buildEditions(coHostTable))).toEqual([]);
  });

  it('does not count a title won away from the host country', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [['2014', 'Brazil', 'Germany']],
    };
    expect(buildHomeSoilTitles(buildEditions(table))).toEqual([]);
  });

  it('groups West Germany under Germany across separate home-soil wins, matching buildChampionsSummary', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1974', 'West Germany', 'West Germany'],
        ['2006', 'Germany', 'Italy'],
        ['2026', 'Germany', 'Germany'],
      ],
    };
    expect(buildHomeSoilTitles(buildEditions(table))).toEqual([
      {
        id: 'germany',
        displayName: 'Germany (incl. West Germany)',
        titles: 2,
        years: ['1974', '2026'],
        names: ['West Germany', 'Germany'],
      },
    ]);
  });

  it('excludes a "Not awarded"-style placeholder even if it somehow matched the host cell', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [['2020', 'Not awarded', 'Not awarded']],
    };
    expect(buildHomeSoilTitles(buildEditions(table))).toEqual([]);
  });

  it('returns an empty list when the table has no host column', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1958', 'Just Fontaine', 'France', '13']],
    };
    expect(buildHomeSoilTitles(buildEditions(scorersTable))).toEqual([]);
  });

  it('sorts by home-soil title count desc, then earliest year, then name', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1917', 'Uruguay', 'Uruguay'],
        ['1923', 'Uruguay', 'Uruguay'],
        ['1921', 'Argentina', 'Argentina'],
        ['1929', 'Peru', 'Peru'],
      ],
    };
    // Uruguay hosted-and-won twice, so it ranks first; Argentina (1921) and
    // Peru (1929) both did it once and tie-break on earliest year.
    const summary = buildHomeSoilTitles(buildEditions(table));
    expect(summary.map((s) => s.displayName)).toEqual(['Uruguay', 'Argentina', 'Peru']);
    expect(summary[0]).toMatchObject({ titles: 2, years: ['1917', '1923'] });
  });
});

describe('buildLongestStreaks', () => {
  it('finds a real back-to-back streak (Italy 1934 and 1938)', () => {
    const wc: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1930', 'Uruguay'],
        ['1934', 'Italy'],
        ['1938', 'Italy'],
        ['1950', 'Uruguay'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(wc))).toEqual([
      { id: 'Italy-1934', displayName: 'Italy', titles: 2, years: ['1934', '1938'], names: ['Italy'] },
    ]);
  });

  it('extends a streak across more than two consecutive editions', () => {
    const ballonDor: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2009', 'Lionel Messi'],
        ['2010', 'Lionel Messi'],
        ['2011', 'Lionel Messi'],
        ['2012', 'Lionel Messi'],
        ['2013', 'Cristiano Ronaldo'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(ballonDor))).toEqual([
      {
        id: 'Lionel Messi-2009',
        displayName: 'Lionel Messi',
        titles: 4,
        years: ['2009', '2010', '2011', '2012'],
        names: ['Lionel Messi'],
      },
    ]);
  });

  it('does not chain a streak across a placeholder "Not awarded" year', () => {
    const ballonDor: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2019', 'Lionel Messi'],
        ['2020', 'Not awarded'],
        ['2021', 'Lionel Messi'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(ballonDor))).toEqual([]);
  });

  it('does not merge West Germany into Germany, unlike buildChampionsSummary', () => {
    const wc: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1990', 'West Germany'],
        ['1994', 'Brazil'],
        ['2014', 'Germany'],
        ['2018', 'France'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(wc))).toEqual([]);
  });

  it('returns an empty list when no winner repeats in consecutive editions', () => {
    const nationsLeague: MarkdownTable = {
      headers: ['Season', 'Winner'],
      rows: [
        ['2018-19', 'Portugal'],
        ['2020-21', 'France'],
        ['2022-23', 'Spain'],
        ['2024-25', 'Portugal'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(nationsLeague))).toEqual([]);
  });

  it('sorts multiple streaks by length desc, then earliest start year, then name', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1916', 'Uruguay'],
        ['1917', 'Uruguay'],
        ['1927', 'Argentina'],
        ['1929', 'Argentina'],
        ['1945', 'Brazil'],
        ['1946', 'Brazil'],
        ['1947', 'Brazil'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(table)).map((s) => s.displayName)).toEqual([
      'Brazil',
      'Uruguay',
      'Argentina',
    ]);
  });

  it('sorts editions by yearSort first, independent of source row order', () => {
    const outOfOrder: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1938', 'Italy'],
        ['1934', 'Italy'],
      ],
    };
    expect(buildLongestStreaks(buildEditions(outOfOrder))).toEqual([
      { id: 'Italy-1934', displayName: 'Italy', titles: 2, years: ['1934', '1938'], names: ['Italy'] },
    ]);
  });
});

describe('buildRunnerUpsWithoutTitle', () => {
  const runnerUpTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up'],
    rows: [
      ['1974', 'West Germany', 'Netherlands'],
      ['1978', 'Argentina', 'Netherlands'],
      ['1990', 'West Germany', 'Argentina'],
      ['2010', 'Spain', 'Netherlands'],
      ['2014', 'Germany', 'Argentina'],
    ],
  };

  it('counts a team\'s runner-up finishes when it has never won', () => {
    const summary = buildRunnerUpsWithoutTitle(buildEditions(runnerUpTable));
    expect(summary).toEqual([
      {
        id: 'netherlands',
        displayName: 'Netherlands',
        titles: 3,
        years: ['1974', '1978', '2010'],
        names: ['Netherlands'],
      },
    ]);
  });

  it('excludes a team entirely once it has won at least one edition, even counting its earlier runner-up finishes', () => {
    const summary = buildRunnerUpsWithoutTitle(buildEditions(runnerUpTable));
    // Argentina lost the 1990 final but won in 1978 (and 2014, as its own
    // grouping) - it must not appear here at all, not even with a lower count.
    expect(summary.find((s) => s.displayName === 'Argentina')).toBeUndefined();
  });

  it('groups West Germany under Germany, matching buildChampionsSummary - a team titled under either name is excluded', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up'],
      rows: [
        ['1966', 'England', 'West Germany'],
        ['2002', 'Brazil', 'Germany'],
      ],
    };
    // West Germany's only appearance is as runner-up, but Germany (its
    // grouped successor) never won here either - so the group should still
    // show up, combining both runner-up finishes under "Germany (incl. West
    // Germany)"'s title-grouping id, not as two separate one-off entries.
    expect(buildRunnerUpsWithoutTitle(buildEditions(table))).toEqual([
      {
        id: 'germany',
        displayName: 'Germany (incl. West Germany)',
        titles: 2,
        years: ['1966', '2002'],
        names: ['West Germany', 'Germany'],
      },
    ]);
  });

  it('does not conflate the Runner-up column with a Third/Fourth-place finish', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [['1990', 'West Germany', 'Argentina', 'Italy', 'England']],
    };
    const summary = buildRunnerUpsWithoutTitle(buildEditions(table));
    expect(summary.map((s) => s.displayName)).toEqual(['Argentina']);
  });

  it('excludes the "—" missing-cell marker and a "Not awarded"-style placeholder', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up'],
      rows: [
        ['1975', 'Peru', '—'],
        ['2020', 'Not awarded', 'Not awarded'],
      ],
    };
    expect(buildRunnerUpsWithoutTitle(buildEditions(table))).toEqual([]);
  });

  it('returns an empty list when the table has no Runner-up column', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1958', 'Just Fontaine', 'France', '13']],
    };
    expect(buildRunnerUpsWithoutTitle(buildEditions(scorersTable))).toEqual([]);
  });

  it('sorts by runner-up count desc, then earliest runner-up year, then name', () => {
    const summary = buildRunnerUpsWithoutTitle(buildEditions(runnerUpTable));
    expect(summary.map((s) => s.displayName)).toEqual(['Netherlands']);
  });
});

describe('buildNearlyFinalists', () => {
  const semifinalTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
    rows: [
      ['1930', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
      ['1962', 'Brazil', 'Czechoslovakia', 'Chile', 'Yugoslavia'],
      ['1966', 'England', 'West Germany', 'Portugal', 'Soviet Union'],
    ],
  };

  it("counts a team's semifinal (Third/Fourth) finishes when it has never reached a final", () => {
    const summary = buildNearlyFinalists(buildEditions(semifinalTable));
    expect(summary).toEqual([
      {
        id: 'yugoslavia',
        displayName: 'Yugoslavia',
        titles: 2,
        years: ['1930', '1962'],
        names: ['Yugoslavia'],
      },
      {
        id: 'united states',
        displayName: 'United States',
        titles: 1,
        years: ['1930'],
        names: ['United States'],
      },
      {
        id: 'chile',
        displayName: 'Chile',
        titles: 1,
        years: ['1962'],
        names: ['Chile'],
      },
      {
        id: 'portugal',
        displayName: 'Portugal',
        titles: 1,
        years: ['1966'],
        names: ['Portugal'],
      },
      {
        id: 'soviet union',
        displayName: 'Soviet Union',
        titles: 1,
        years: ['1966'],
        names: ['Soviet Union'],
      },
    ]);
  });

  it('groups West Germany under Germany, matching buildChampionsSummary - a team that reached a final under either name is excluded', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [
        ['1970', 'Brazil', 'Italy', 'West Germany', 'Uruguay'],
        ['2006', 'Italy', 'France', 'Germany', 'Portugal'],
      ],
    };
    // West Germany's only appearance is a Third-place finish, and Germany's
    // (its grouped successor) only appearance is also a Third-place finish -
    // neither name has ever reached a final, so the merged group should show
    // up once, combining both semifinal finishes under "Germany (incl. West
    // Germany)"'s grouping id, not as two separate one-off entries.
    const summary = buildNearlyFinalists(buildEditions(table));
    expect(summary.find((s) => s.id === 'germany')).toEqual({
      id: 'germany',
      displayName: 'Germany (incl. West Germany)',
      titles: 2,
      years: ['1970', '2006'],
      names: ['West Germany', 'Germany'],
    });
  });

  it('counts a team that later reaches a final in one edition but not another as excluded entirely', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [
        ['1990', 'West Germany', 'Argentina', 'Italy', 'England'],
        ['1994', 'Brazil', 'Italy', 'Sweden', 'Bulgaria'],
      ],
    };
    // Italy reached a semifinal in 1990 (Third) but a final in 1994
    // (Runner-up) - the "no partial credit once the higher bar is cleared"
    // rule excludes it entirely, the same way buildRunnerUpsWithoutTitle
    // excludes a team once it has won even once.
    const summary = buildNearlyFinalists(buildEditions(table));
    expect(summary.find((s) => s.displayName === 'Italy')).toBeUndefined();
    expect(summary.map((s) => s.displayName)).toEqual(['England', 'Bulgaria', 'Sweden']);
  });

  it('counts two different teams named in the same row\'s Third and Fourth columns separately', () => {
    const summary = buildNearlyFinalists(buildEditions(semifinalTable));
    expect(summary.find((s) => s.displayName === 'United States')?.titles).toBe(1);
    expect(summary.find((s) => s.displayName === 'Yugoslavia')?.titles).toBe(2);
  });

  it('excludes the "—" missing-cell marker and a "Not awarded"-style placeholder', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [
        ['1987', 'Uruguay', 'Chile', '—', '—'],
        ['2020', 'Not awarded', 'Not awarded', 'Not awarded', 'Not awarded'],
      ],
    };
    expect(buildNearlyFinalists(buildEditions(table))).toEqual([]);
  });

  it('returns an empty list when the table has no Third/Fourth/semifinalist column', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1958', 'Just Fontaine', 'France', '13']],
    };
    expect(buildNearlyFinalists(buildEditions(scorersTable))).toEqual([]);
  });

  it('sorts by semifinal count desc, then earliest year, then name', () => {
    const summary = buildNearlyFinalists(buildEditions(semifinalTable));
    expect(summary.map((s) => s.displayName)).toEqual([
      'Yugoslavia',
      'United States',
      'Chile',
      'Portugal',
      'Soviet Union',
    ]);
  });
});

describe('buildLongestTitleGaps', () => {
  it('finds the real 44-year gap between Italy\'s 1938 and 1982 World Cup wins', () => {
    const wc: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1934', 'Italy'],
        ['1938', 'Italy'],
        ['1982', 'Italy'],
        ['2006', 'Italy'],
      ],
    };
    // Gaps: 1934->1938 = 4, 1938->1982 = 44, 1982->2006 = 24 - the widest is
    // 1938->1982, not the full 1934->2006 span.
    expect(buildLongestTitleGaps(buildEditions(wc))).toEqual([
      { id: 'italy', displayName: 'Italy', titles: 44, years: ['1938', '1982'], names: ['Italy'] },
    ]);
  });

  it('excludes a team with only one title', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1930', 'Uruguay'],
        ['1934', 'Italy'],
      ],
    };
    expect(buildLongestTitleGaps(buildEditions(table))).toEqual([]);
  });

  it('still includes a team whose only two titles are back-to-back', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1934', 'Italy'],
        ['1938', 'Italy'],
      ],
    };
    expect(buildLongestTitleGaps(buildEditions(table))).toEqual([
      { id: 'italy', displayName: 'Italy', titles: 4, years: ['1934', '1938'], names: ['Italy'] },
    ]);
  });

  it('groups West Germany under Germany, matching buildChampionsSummary', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1954', 'West Germany'],
        ['1974', 'West Germany'],
        ['1990', 'West Germany'],
        ['2014', 'Germany'],
      ],
    };
    // Combined title years: 1954, 1974, 1990, 2014 - gaps 20, 16, 24, widest
    // is 1990->2014.
    expect(buildLongestTitleGaps(buildEditions(table))).toEqual([
      {
        id: 'germany',
        displayName: 'Germany (incl. West Germany)',
        titles: 24,
        years: ['1990', '2014'],
        names: ['West Germany', 'Germany'],
      },
    ]);
  });

  it('does not chain a gap across a placeholder "Not awarded" year, since that year is never a title', () => {
    const ballonDor: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2018', 'Lionel Messi'],
        ['2019', 'Lionel Messi'],
        ['2020', 'Not awarded'],
        ['2021', 'Lionel Messi'],
      ],
    };
    // Placeholder years never enter buildChampionsSummary's years list, so
    // the widest gap is 2019->2021, not 2018->2021.
    expect(buildLongestTitleGaps(buildEditions(ballonDor))).toEqual([
      {
        id: 'lionel messi',
        displayName: 'Lionel Messi',
        titles: 2,
        years: ['2019', '2021'],
        names: ['Lionel Messi'],
      },
    ]);
  });

  it('splits Golden Boot joint-winner ties before computing the gap, matching buildChampionsSummary', () => {
    const goldenBoot: MarkdownTable = {
      headers: ['Year', 'Player(s)'],
      rows: [
        ['2012', 'Mario Balotelli; Cristiano Ronaldo; Mario Gómez'],
        ['2020', 'Cristiano Ronaldo'],
      ],
    };
    expect(buildLongestTitleGaps(buildEditions(goldenBoot))).toEqual([
      {
        id: 'cristiano ronaldo',
        displayName: 'Cristiano Ronaldo',
        titles: 8,
        years: ['2012', '2020'],
        names: ['Cristiano Ronaldo'],
      },
    ]);
  });

  it('sorts by widest gap desc, then the gap\'s earliest year, then name', () => {
    const table: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1900', 'Argentina'],
        ['1925', 'Argentina'],
        ['1950', 'Brazil'],
        ['1980', 'Brazil'],
        ['1960', 'Uruguay'],
        ['1990', 'Uruguay'],
      ],
    };
    // Gaps: Argentina 25, Brazil 30, Uruguay 30 - Brazil and Uruguay tie on
    // gap size, so Brazil (whose gap starts in 1950) sorts before Uruguay
    // (whose gap starts in 1960); Argentina's smaller 25-year gap sorts last.
    expect(buildLongestTitleGaps(buildEditions(table)).map((s) => s.displayName)).toEqual([
      'Brazil',
      'Uruguay',
      'Argentina',
    ]);
  });

  it('returns an empty list when no one has won a competition twice', () => {
    const nationsLeague: MarkdownTable = {
      headers: ['Season', 'Winner'],
      rows: [
        ['2018-19', 'Portugal'],
        ['2020-21', 'France'],
        ['2022-23', 'Spain'],
      ],
    };
    expect(buildLongestTitleGaps(buildEditions(nationsLeague))).toEqual([]);
  });
});

describe('editionTeams', () => {
  const fullTable: MarkdownTable = {
    headers: ['Year', 'Host(s)', 'Teams', 'Winner', 'Runner-up', 'Third', 'Fourth / other semifinalist'],
    rows: [
      ['1930', 'Uruguay', '13', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
      ['1934', 'Italy', '16', 'Italy', 'Czechoslovakia', 'Germany', '—'],
    ],
  };

  it('collects every team-holding column, not just the winner', () => {
    const editions = buildEditions(fullTable);
    expect(editionTeams(editions[0])).toEqual([
      'Uruguay',
      'Argentina',
      'United States',
      'Yugoslavia',
    ]);
  });

  it('skips a missing-data em dash cell', () => {
    const editions = buildEditions(fullTable);
    expect(editionTeams(editions[1])).toEqual(['Italy', 'Czechoslovakia', 'Germany']);
  });

  it('ignores non-team columns like Year, Host(s) and Teams', () => {
    const editions = buildEditions(fullTable);
    expect(editionTeams(editions[0])).not.toContain('13');
    expect(editionTeams(editions[0])).not.toContain('1930');
  });

  it('matches "Other semifinalist" headers via the shared "finalist" pattern', () => {
    const euroTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Other semifinalist', 'Other semifinalist / fourth'],
      rows: [['1960', 'Soviet Union', 'Yugoslavia', 'Czechoslovakia', 'France']],
    };
    expect(editionTeams(buildEditions(euroTable)[0])).toEqual([
      'Soviet Union',
      'Yugoslavia',
      'Czechoslovakia',
      'France',
    ]);
  });

  it('reads a "National team" column (Ballon d\'Or) and a "Team" column (Golden Boot)', () => {
    const ballonDorTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'National team'],
      rows: [['1956', 'Stanley Matthews', 'England']],
    };
    expect(editionTeams(buildEditions(ballonDorTable)[0])).toEqual(['England']);

    const goldenBootTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1930', 'Guillermo Stábile', 'Argentina', '8']],
    };
    expect(editionTeams(buildEditions(goldenBootTable)[0])).toEqual(['Argentina']);
  });

  it('excludes a "Not awarded" placeholder from the team list', () => {
    const withPlaceholder: MarkdownTable = {
      headers: ['Year', 'Winner', 'National team'],
      rows: [['2020', 'Not awarded', 'Not awarded']],
    };
    expect(editionTeams(buildEditions(withPlaceholder)[0])).toEqual([]);
  });

  it('splits a Golden Boot "; "-separated joint-team tie into individual teams', () => {
    const jointTie: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1994', 'Hristo Stoichkov; Oleg Salenko', 'Bulgaria; Russia', '6']],
    };
    expect(editionTeams(buildEditions(jointTie)[0])).toEqual(['Bulgaria', 'Russia']);
  });

  it('excludes the "Multiple" too-many-scorers-to-name placeholder from the team list', () => {
    const sixWayTie: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1962', 'Garrincha; Vavá; Leonel Sánchez', 'Multiple', '4']],
    };
    expect(editionTeams(buildEditions(sixWayTie)[0])).toEqual([]);
  });
});

describe('distinctTeams', () => {
  it('lists each team once across every team-holding column, alphabetically', () => {
    const fullTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [
        ['1930', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
        ['1934', 'Italy', 'Czechoslovakia', 'Germany', 'Austria'],
      ],
    };
    expect(distinctTeams(buildEditions(fullTable))).toEqual([
      'Argentina',
      'Austria',
      'Czechoslovakia',
      'Germany',
      'Italy',
      'United States',
      'Uruguay',
      'Yugoslavia',
    ]);
  });

  it('surfaces a team that only ever reached a semifinal, not just champions', () => {
    const fullTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [['1966', 'England', 'West Germany', 'Portugal', 'Soviet Union']],
    };
    const teams = distinctTeams(buildEditions(fullTable));
    expect(teams).toContain('Portugal');
    expect(distinctWinners(buildEditions(fullTable))).not.toContain('Portugal');
  });

  it('returns an empty list when the table has no team-holding column', () => {
    const noTeamsTable: MarkdownTable = {
      headers: ['Year', 'Host'],
      rows: [['1930', 'Uruguay']],
    };
    expect(distinctTeams(buildEditions(noTeamsTable))).toEqual([]);
  });
});

describe('buildTimeline', () => {
  it('reads runner-up and final columns when present, sorted for the caller', () => {
    const fullTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Final'],
      rows: [
        ['1930', 'Uruguay', 'Uruguay', 'Argentina', 'Uruguay 4-2 Argentina'],
        ['1934', 'Italy', 'Italy', 'Czechoslovakia', 'Italy 2-1 Czechoslovakia'],
      ],
    };
    const timeline = buildTimeline(buildEditions(fullTable));
    expect(timeline).toEqual([
      {
        year: '1930',
        yearSort: 1930,
        champion: 'Uruguay',
        host: 'Uruguay',
        runnerUp: 'Argentina',
        final: 'Uruguay 4-2 Argentina',
      },
      {
        year: '1934',
        yearSort: 1934,
        champion: 'Italy',
        host: 'Italy',
        runnerUp: 'Czechoslovakia',
        final: 'Italy 2-1 Czechoslovakia',
      },
    ]);
  });

  it('leaves runnerUp and final undefined when the table has no such column', () => {
    const timeline = buildTimeline(buildEditions(table));
    expect(timeline[0].runnerUp).toBeUndefined();
    expect(timeline[0].final).toBeUndefined();
  });

  it('still shows a "Not awarded" placeholder row verbatim - it is the accurate fact for that year', () => {
    const withPlaceholder: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [['2020', 'Not awarded']],
    };
    const timeline = buildTimeline(buildEditions(withPlaceholder));
    expect(timeline[0].champion).toBe('Not awarded');
  });
});

describe('buildPodiums', () => {
  it('reads champion, host, runner-up, third and fourth when all four columns are present', () => {
    const finalsTable: MarkdownTable = {
      headers: ['Season', 'Finals host', 'Winner', 'Runner-up', 'Third', 'Fourth'],
      rows: [
        ['2018-19', 'Portugal', 'Portugal', 'Netherlands', 'England', 'Switzerland'],
        ['2022-23', 'Netherlands', 'Spain', 'Croatia', 'Italy', 'Netherlands'],
      ],
    };
    const podium = buildPodiums(buildEditions(finalsTable));
    expect(podium).toEqual([
      {
        year: '2018-19',
        yearSort: 2018,
        champion: 'Portugal',
        host: 'Portugal',
        runnerUp: 'Netherlands',
        third: 'England',
        fourth: 'Switzerland',
      },
      {
        year: '2022-23',
        yearSort: 2022,
        champion: 'Spain',
        host: 'Netherlands',
        runnerUp: 'Croatia',
        third: 'Italy',
        fourth: 'Netherlands',
      },
    ]);
  });

  it('leaves runnerUp/third/fourth undefined when the table has no such column', () => {
    const podium = buildPodiums(buildEditions(table));
    expect(podium[0].runnerUp).toBeUndefined();
    expect(podium[0].third).toBeUndefined();
    expect(podium[0].fourth).toBeUndefined();
  });

  it('still shows a "Not awarded" placeholder champion verbatim, matching buildTimeline', () => {
    const withPlaceholder: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [['2020', 'Not awarded']],
    };
    const podium = buildPodiums(buildEditions(withPlaceholder));
    expect(podium[0].champion).toBe('Not awarded');
  });

  it('reads fourth place from the World Cup\'s "Fourth / other semifinalist" header', () => {
    const worldCupTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth / other semifinalist'],
      rows: [['1930', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia']],
    };
    const podium = buildPodiums(buildEditions(worldCupTable));
    expect(podium[0].third).toBe('United States');
    expect(podium[0].fourth).toBe('Yugoslavia');
  });

  it('does not match EURO\'s "Other semifinalist" columns as third/fourth', () => {
    const euroTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up', 'Other semifinalist', 'Other semifinalist / fourth'],
      rows: [['2020', 'Italy', 'England', 'Spain', 'Denmark']],
    };
    const podium = buildPodiums(buildEditions(euroTable));
    expect(podium[0].third).toBeUndefined();
    expect(podium[0].fourth).toBeUndefined();
  });

  it('treats a "—" placeholder third/fourth cell as absent, not a literal team name', () => {
    const copaHomeAndAway: MarkdownTable = {
      headers: ['Year', 'Champion', 'Runner-up', 'Third', 'Fourth'],
      rows: [['1983', 'Uruguay', 'Brazil', '—', '—']],
    };
    const podium = buildPodiums(buildEditions(copaHomeAndAway));
    expect(podium[0].runnerUp).toBe('Brazil');
    expect(podium[0].third).toBeUndefined();
    expect(podium[0].fourth).toBeUndefined();
  });
});

describe('buildBiggestFinalMargins', () => {
  const finalsTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Final'],
    rows: [
      ['1930', 'Uruguay', 'Uruguay 4-2 Argentina'],
      ['1958', 'Brazil', 'Brazil 5-2 Sweden'],
      ['1974', 'West Germany', 'West Germany 2-1 Netherlands'],
      ['1990', 'West Germany', 'West Germany 1-0 Argentina'],
      ['1994', 'Brazil', 'Brazil 0-0 Italy; 3-2 pens'],
    ],
  };

  it('ranks finals by goal margin, biggest win first', () => {
    const margins = buildBiggestFinalMargins(buildEditions(finalsTable));
    expect(margins.map((m) => m.titles)).toEqual([3, 2, 1, 1, 0]);
  });

  it('reads the margin from the score before any penalty notation, not the pens score', () => {
    const margins = buildBiggestFinalMargins(buildEditions(finalsTable));
    const shootout = margins.find((m) => m.displayName === 'Brazil 0-0 Italy; 3-2 pens');
    expect(shootout?.titles).toBe(0);
  });

  it('breaks a margin tie by year, earliest first', () => {
    const margins = buildBiggestFinalMargins(buildEditions(finalsTable));
    const tied = margins.filter((m) => m.titles === 1).map((m) => m.years[0]);
    expect(tied).toEqual(['1974', '1990']);
  });

  it('keeps the full score line as displayName and the edition year as years', () => {
    const margins = buildBiggestFinalMargins(buildEditions(finalsTable));
    expect(margins[0]).toEqual({
      id: '1958',
      displayName: 'Brazil 5-2 Sweden',
      titles: 3,
      years: ['1958'],
      names: [],
    });
  });

  it('returns an empty list when the table has no "Final" column', () => {
    expect(buildBiggestFinalMargins(buildEditions(table))).toEqual([]);
  });
});

describe('buildTopScorerFacts', () => {
  const scorersTable: MarkdownTable = {
    headers: ['Year', 'Player(s)', 'Team', 'Goals'],
    rows: [
      ['1958', 'Just Fontaine', 'France', '13'],
      ['1962', 'Garrincha; Vavá', 'Multiple', '4'],
    ],
  };

  it('joins player, team and goals into one display string, keyed by year', () => {
    const facts = buildTopScorerFacts(buildEditions(scorersTable));
    expect(facts.get('1958')).toBe('Just Fontaine (France, 13 goals)');
    expect(facts.get('1962')).toBe('Garrincha; Vavá (Multiple, 4 goals)');
  });

  it('falls back to just the player name when team/goals columns are absent', () => {
    const minimalTable: MarkdownTable = {
      headers: ['Year', 'Player(s)'],
      rows: [['1958', 'Just Fontaine']],
    };
    const facts = buildTopScorerFacts(buildEditions(minimalTable));
    expect(facts.get('1958')).toBe('Just Fontaine');
  });

  it('has no entry for a year with no winner', () => {
    const emptyRowTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [['1942', '', '', '']],
    };
    const facts = buildTopScorerFacts(buildEditions(emptyRowTable));
    expect(facts.has('1942')).toBe(false);
  });

  it('swaps in the Croatian "golova" word for the hr locale, keeping the same names/counts', () => {
    const facts = buildTopScorerFacts(buildEditions(scorersTable), 'hr');
    expect(facts.get('1958')).toBe('Just Fontaine (France, 13 golova)');
    expect(facts.get('1962')).toBe('Garrincha; Vavá (Multiple, 4 golova)');
  });
});
