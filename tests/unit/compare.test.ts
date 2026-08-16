import { describe, expect, it } from 'vitest';
import {
  buildAllCountryRecords,
  buildCountryCompetitionRecord,
  buildCountryRecord,
  buildFinalsMeetings,
  distinctCountryGroups,
  finalsMeetingsBetween,
  tracksSemifinalColumn,
  type CompetitionEditions,
} from '../../src/lib/compare';
import { buildEditions } from '../../src/lib/editions';
import type { MarkdownTable } from '../../src/lib/types';

const worldCupTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Third', 'Fourth', 'Final'],
  rows: [
    ['1954', 'Switzerland', 'West Germany', 'Hungary', 'Austria', 'Uruguay', 'West Germany 3-2 Hungary'],
    ['1974', 'West Germany', 'West Germany', 'Netherlands', 'Poland', 'Brazil', 'West Germany 2-1 Netherlands'],
    ['2014', 'Brazil', 'Germany', 'Argentina', 'Netherlands', 'Brazil', 'Germany 1-0 Argentina'],
    ['2018', 'Russia', 'France', 'Croatia', 'Belgium', 'England', 'France 4-2 Croatia'],
  ],
};

const euroTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Other semifinalist', 'Other semifinalist / fourth'],
  rows: [
    ['2016', 'France', 'Portugal', 'France', 'Germany', 'Wales'],
    ['2020', 'Europe-wide', 'Italy', 'England', 'Denmark', 'Spain'],
  ],
};

// No third/fourth column at all - a hypothetical award-style table.
const noSemifinalColumnTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Champion', 'Runner-up'],
  rows: [
    ['2021', 'Brazil', 'Argentina', 'Brazil'],
    ['2024', 'United States', 'Argentina', 'Colombia'],
  ],
};

// Copa América's real shape: a "Third"/"Fourth" column that exists on every
// row, but is only filled in for the knockout-final era - earlier editions
// use the shared "—" missing-cell placeholder rather than a guessed name.
const copaTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Champion', 'Runner-up', 'Third', 'Fourth'],
  rows: [
    ['1916', 'Argentina', 'Uruguay', 'Argentina', '—', '—'],
    ['2021', 'Brazil', 'Argentina', 'Brazil', 'Colombia', 'Peru'],
    ['2024', 'United States', 'Argentina', 'Colombia', 'Uruguay', 'Canada'],
  ],
};

const noSemifinalColumn: CompetitionEditions = {
  title: 'No semifinal column award',
  slug: 'no-semifinal-column',
  editions: buildEditions(noSemifinalColumnTable),
};

const worldCup: CompetitionEditions = {
  title: 'FIFA World Cup',
  slug: 'world-cup',
  editions: buildEditions(worldCupTable),
};
const euro: CompetitionEditions = {
  title: 'UEFA EURO',
  slug: 'euro',
  editions: buildEditions(euroTable),
};
const copaAmerica: CompetitionEditions = {
  title: 'Copa América',
  slug: 'copa-america',
  editions: buildEditions(copaTable),
};

const competitions = [worldCup, euro, copaAmerica];

describe('tracksSemifinalColumn', () => {
  it('is true when the table has a third/fourth/semifinalist column', () => {
    expect(tracksSemifinalColumn(worldCup.editions)).toBe(true);
    expect(tracksSemifinalColumn(euro.editions)).toBe(true);
    // Copa América's real table: the column exists on every row even though
    // only some rows have real data in it (the rest are "—").
    expect(tracksSemifinalColumn(copaAmerica.editions)).toBe(true);
  });

  it('is false when the table has no such column', () => {
    expect(tracksSemifinalColumn(noSemifinalColumn.editions)).toBe(false);
  });
});

describe('distinctCountryGroups', () => {
  it('collects every country from winner, runner-up, and semifinal columns, grouping West Germany with Germany', () => {
    const groups = distinctCountryGroups(competitions);
    const ids = groups.map((g) => g.id).sort();
    expect(ids).toContain('germany');
    expect(ids).toContain('brazil');
    expect(ids).toContain('argentina');
    expect(ids).not.toContain('west germany');

    const germany = groups.find((g) => g.id === 'germany');
    expect(germany?.displayName).toBe('Germany (incl. West Germany)');
  });

  it('collects real names from a partially filled semifinal column and never turns the "—" placeholder into a phantom team', () => {
    const groups = distinctCountryGroups(competitions);
    const ids = groups.map((g) => g.id);
    // From Copa América's 2021/2024 Third/Fourth cells.
    expect(ids).toContain('colombia');
    expect(ids).toContain('peru');
    expect(ids).toContain('uruguay');
    expect(ids).toContain('canada');
    // From 1916's empty Third/Fourth cells - must never appear as a group.
    expect(ids).not.toContain('—');
    expect(groups.find((g) => g.displayName === '—')).toBeUndefined();
  });
});

describe('buildCountryCompetitionRecord', () => {
  it('counts titles, runner-up finishes and semifinal finishes for one competition, merging West Germany into Germany', () => {
    const record = buildCountryCompetitionRecord('germany', worldCup);
    expect(record).toMatchObject({
      competition: 'FIFA World Cup',
      slug: 'world-cup',
      titles: 3,
      titleYears: ['1954', '1974', '2014'],
      runnerUps: 0,
      semifinals: 0,
    });
  });

  it('counts a runner-up finish and does not double count it as a semifinal finish', () => {
    const record = buildCountryCompetitionRecord('brazil', worldCup);
    expect(record.titles).toBe(0);
    expect(record.runnerUps).toBe(0);
    // Brazil appears as "Fourth" in 1974 and 2014.
    expect(record.semifinals).toBe(2);
  });

  it('returns 0 semifinals (not a false positive) when the competition has no such column', () => {
    const record = buildCountryCompetitionRecord('brazil', noSemifinalColumn);
    expect(record.runnerUps).toBe(1); // 2021 runner-up
    expect(record.semifinals).toBe(0);
  });

  it('counts a real third/fourth finish and ignores the "—" missing-cell placeholder', () => {
    // Colombia: third in 2021, runner-up in 2024, and 1916's "—" Third/Fourth
    // cells must not falsely match any group.
    const colombia = buildCountryCompetitionRecord('colombia', copaAmerica);
    expect(colombia.titles).toBe(0);
    expect(colombia.runnerUps).toBe(1);
    expect(colombia.semifinals).toBe(1);

    // No real team is ever named "—", so it must never accrue a "finish".
    const dash = buildCountryCompetitionRecord('—', copaAmerica);
    expect(dash.titles).toBe(0);
    expect(dash.runnerUps).toBe(0);
    expect(dash.semifinals).toBe(0);
  });
});

describe('buildCountryRecord', () => {
  it('sums a country record across every given competition', () => {
    const record = buildCountryRecord({ id: 'germany', displayName: 'Germany (incl. West Germany)' }, competitions);
    expect(record.totalTitles).toBe(3);
    expect(record.totalRunnerUps).toBe(0);
    // Germany doesn't reach a World Cup semifinal-or-below in this fixture, but
    // is EURO 2016's "Other semifinalist" - the sum should still pick that up.
    expect(record.totalSemifinals).toBe(1);
    expect(record.totalFinals).toBe(3);
    expect(record.competitions).toHaveLength(3);
  });
});

describe('buildAllCountryRecords', () => {
  it('ranks countries by titles desc, then finals reached, then name', () => {
    const all = buildAllCountryRecords(competitions);
    const names = all.map((r) => r.displayName);
    expect(names[0]).toBe('Germany (incl. West Germany)');
    // Every entry appears exactly once.
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('includes a country that only ever reached a semifinal, with zero titles/runner-ups', () => {
    const all = buildAllCountryRecords(competitions);
    const austria = all.find((r) => r.displayName === 'Austria');
    expect(austria).toBeDefined();
    expect(austria?.totalTitles).toBe(0);
    expect(austria?.totalSemifinals).toBe(1);
  });
});

describe('buildFinalsMeetings', () => {
  it('records one meeting per edition with a real winner and runner-up, in source order', () => {
    const meetings = buildFinalsMeetings([worldCup]);
    expect(meetings).toHaveLength(4);
    expect(meetings[0]).toMatchObject({
      competition: 'FIFA World Cup',
      slug: 'world-cup',
      year: '1954',
      winnerId: 'germany',
      winnerName: 'West Germany',
      runnerUpId: 'hungary',
      runnerUpName: 'Hungary',
      score: 'West Germany 3-2 Hungary',
    });
  });

  it('groups West Germany and Germany under the same id while keeping the historical name for display', () => {
    const meetings = buildFinalsMeetings([worldCup]);
    const germanyMeetings = meetings.filter((m) => m.winnerId === 'germany');
    expect(germanyMeetings.map((m) => m.winnerName)).toEqual(['West Germany', 'West Germany', 'Germany']);
  });

  it('leaves score undefined when the table has no "Final" score column', () => {
    const meetings = buildFinalsMeetings([euro]);
    expect(meetings.length).toBeGreaterThan(0);
    expect(meetings.every((m) => m.score === undefined)).toBe(true);
  });

  it('skips a "—" placeholder runner-up cell instead of inventing a phantom meeting', () => {
    // Copa América 1916: Uruguay champion, Argentina runner-up (a real meeting).
    // 1916's own Third/Fourth cells are "—" but that column isn't consulted here.
    const meetings = buildFinalsMeetings([copaAmerica]);
    expect(meetings).toHaveLength(3);
    expect(meetings.every((m) => m.runnerUpName !== '—' && m.winnerName !== '—')).toBe(true);
  });
});

describe('finalsMeetingsBetween', () => {
  it('finds every meeting between two teams regardless of which one won, sorted oldest first', () => {
    const meetings = buildFinalsMeetings([worldCup]);
    const result = finalsMeetingsBetween('germany', 'netherlands', meetings);
    expect(result.map((m) => m.year)).toEqual(['1974']);
  });

  it('merges West Germany and Germany as the same team when matching a pair across editions', () => {
    // West Germany beat Hungary in 1954; a query for "germany" vs "hungary"
    // must find it even though the id is normalized, not the raw name.
    const meetings = buildFinalsMeetings([worldCup]);
    const result = finalsMeetingsBetween('germany', 'hungary', meetings);
    expect(result).toHaveLength(1);
    expect(result[0].winnerName).toBe('West Germany');
  });

  it('returns an empty list for a pair that has never met in a final', () => {
    const meetings = buildFinalsMeetings([worldCup]);
    expect(finalsMeetingsBetween('brazil', 'hungary', meetings)).toEqual([]);
  });

  it('combines meetings from multiple competitions, attributing each to its own competition', () => {
    const meetings = buildFinalsMeetings([worldCup, copaAmerica]);
    const germanyArgentina = finalsMeetingsBetween('germany', 'argentina', meetings);
    expect(germanyArgentina).toHaveLength(1);
    expect(germanyArgentina[0]).toMatchObject({ competition: 'FIFA World Cup', year: '2014' });

    const argentinaColombia = finalsMeetingsBetween('argentina', 'colombia', meetings);
    expect(argentinaColombia).toHaveLength(1);
    expect(argentinaColombia[0]).toMatchObject({ competition: 'Copa América', year: '2024' });
  });

  it('sorts a pair with more than one meeting oldest first, regardless of source row order', () => {
    const outOfOrderTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner', 'Runner-up'],
      rows: [
        ['2010', 'South Africa', 'Spain', 'Netherlands'],
        ['1974', 'West Germany', 'Netherlands', 'West Germany'],
        ['1988', 'West Germany', 'Netherlands', 'Spain'],
      ],
    };
    const outOfOrder: CompetitionEditions = {
      title: 'Test Cup',
      slug: 'test-cup',
      editions: buildEditions(outOfOrderTable),
    };
    const meetings = buildFinalsMeetings([outOfOrder]);
    const result = finalsMeetingsBetween('netherlands', 'spain', meetings);
    // Two Netherlands/Spain finals (1988, 2010), rows given out of order; the
    // 1974 row (Netherlands vs West Germany) is a different pair and must be excluded.
    expect(result.map((m) => m.year)).toEqual(['1988', '2010']);
  });
});
