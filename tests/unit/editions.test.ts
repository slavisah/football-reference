import { describe, expect, it } from 'vitest';
import {
  buildChampionsSummary,
  buildEditions,
  distinctWinners,
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
});

describe('distinctWinners', () => {
  it('lists each winner once, alphabetically, preserving historical names', () => {
    expect(distinctWinners(buildEditions(table))).toEqual([
      'Germany',
      'Spain',
      'West Germany',
    ]);
  });
});
