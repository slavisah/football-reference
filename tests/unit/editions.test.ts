import { describe, expect, it } from 'vitest';
import {
  buildChampionsSummary,
  buildEditions,
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
