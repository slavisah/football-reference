import { describe, expect, it } from 'vitest';
import {
  buildAllCountryRecords,
  buildCountryCompetitionRecord,
  buildCountryRecord,
  distinctCountryGroups,
  tracksSemifinalColumn,
  type CompetitionEditions,
} from '../../src/lib/compare';
import { buildEditions } from '../../src/lib/editions';
import type { MarkdownTable } from '../../src/lib/types';

const worldCupTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Third', 'Fourth'],
  rows: [
    ['1954', 'Switzerland', 'West Germany', 'Hungary', 'Austria', 'Uruguay'],
    ['1974', 'West Germany', 'West Germany', 'Netherlands', 'Poland', 'Brazil'],
    ['2014', 'Brazil', 'Germany', 'Argentina', 'Netherlands', 'Brazil'],
    ['2018', 'Russia', 'France', 'Croatia', 'Belgium', 'England'],
  ],
};

const euroTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Other semifinalist', 'Other semifinalist / fourth'],
  rows: [
    ['2016', 'France', 'Portugal', 'France', 'Germany', 'Wales'],
    ['2020', 'Europe-wide', 'Italy', 'England', 'Denmark', 'Spain'],
  ],
};

// No third/fourth column at all, like Copa América's champions timeline.
const copaTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Champion', 'Runner-up'],
  rows: [
    ['2021', 'Brazil', 'Argentina', 'Brazil'],
    ['2024', 'United States', 'Argentina', 'Colombia'],
  ],
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
  });

  it('is false when the table has no such column', () => {
    expect(tracksSemifinalColumn(copaAmerica.editions)).toBe(false);
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
    const record = buildCountryCompetitionRecord('brazil', copaAmerica);
    expect(record.runnerUps).toBe(1); // 2021 runner-up
    expect(record.semifinals).toBe(0);
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
