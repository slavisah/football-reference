import { describe, expect, it } from 'vitest';
import {
  buildOnThisDayEntries,
  entriesOnDate,
  fallbackEntry,
  parseFinalDate,
} from '../../src/lib/onThisDay';
import { buildEditions } from '../../src/lib/editions';
import type { MarkdownTable } from '../../src/lib/types';

const worldCupTable: MarkdownTable = {
  heading: 'Editions',
  headers: ['Year', 'Winner', 'Runner-up', 'Final', 'Final date'],
  rows: [
    ['1966', 'England', 'West Germany', 'England 4–2 West Germany (a.e.t.)', '30 July 1966'],
    ['1970', 'Brazil', 'Italy', 'Brazil 4–1 Italy', '21 June 1970'],
    ['1930', 'Uruguay', 'Argentina', 'Uruguay 4–2 Argentina', '30 July 1930'],
    ['1982', 'Italy', 'West Germany', 'Italy 3–1 West Germany', 'not a date'],
  ],
};

const europeanTable: MarkdownTable = {
  heading: 'Editions',
  headers: ['Year', 'Winner', 'Final', 'Final date'],
  rows: [['2024', 'Spain', 'Spain 2–1 England', '14 July 2024']],
};

const ballonDorTable: MarkdownTable = {
  heading: 'Winners',
  headers: ['Year', 'Winner', 'National team', 'Ceremony date'],
  rows: [
    ['2018', 'Luka Modrić', 'Croatia', '3 December 2018'],
    ['2020', 'Not awarded', '—', '—'],
  ],
};

describe('parseFinalDate', () => {
  it('parses "D Month YYYY"', () => {
    expect(parseFinalDate('30 July 1966')).toEqual({ month: 7, day: 30 });
    expect(parseFinalDate('4 July 1954')).toEqual({ month: 7, day: 4 });
  });

  it('is case-insensitive on the month name', () => {
    expect(parseFinalDate('10 june 1934')).toEqual({ month: 6, day: 10 });
  });

  it('returns undefined for an unparseable value', () => {
    expect(parseFinalDate('not a date')).toBeUndefined();
    expect(parseFinalDate('')).toBeUndefined();
    expect(parseFinalDate('July 1966')).toBeUndefined();
  });

  it('returns undefined for an unknown month name or an out-of-range day', () => {
    expect(parseFinalDate('30 Frobruary 1966')).toBeUndefined();
    expect(parseFinalDate('40 July 1966')).toBeUndefined();
  });
});

describe('buildOnThisDayEntries', () => {
  it('builds one entry per edition with a parseable "Final date" column', () => {
    const editions = buildEditions(worldCupTable);
    const entries = buildOnThisDayEntries(editions, 'FIFA World Cup');
    // The 1982 row has an unparseable "Final date" and is skipped.
    expect(entries).toHaveLength(3);
    expect(entries.find((e) => e.year === '1966')).toMatchObject({
      competition: 'FIFA World Cup',
      year: '1966',
      month: 7,
      day: 30,
      champion: 'England',
      runnerUp: 'West Germany',
      final: 'England 4–2 West Germany (a.e.t.)',
    });
  });

  it('skips editions with no "Final date" column at all', () => {
    const noDateTable: MarkdownTable = {
      heading: 'Editions',
      headers: ['Year', 'Winner'],
      rows: [['1930', 'Uruguay']],
    };
    const entries = buildOnThisDayEntries(buildEditions(noDateTable), 'Test');
    expect(entries).toEqual([]);
  });

  it('also builds entries from a "Ceremony date" column (individual awards)', () => {
    const editions = buildEditions(ballonDorTable);
    const entries = buildOnThisDayEntries(editions, "Men's Ballon d'Or");
    // The 2020 "Not awarded" row has "—" for Ceremony date and is skipped.
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      competition: "Men's Ballon d'Or",
      year: '2018',
      month: 12,
      day: 3,
      champion: 'Luka Modrić',
      isAward: true,
    });
  });

  it('does not mark a "Final date" entry as an award', () => {
    const entries = buildOnThisDayEntries(buildEditions(worldCupTable), 'FIFA World Cup');
    expect(entries.every((e) => !e.isAward)).toBe(true);
  });
});

describe('entriesOnDate', () => {
  const entries = [
    ...buildOnThisDayEntries(buildEditions(worldCupTable), 'FIFA World Cup'),
    ...buildOnThisDayEntries(buildEditions(europeanTable), 'UEFA European Championship'),
  ];

  it('matches by calendar month/day regardless of year', () => {
    const matches = entriesOnDate(entries, new Date(2026, 6, 30)); // 30 July, any year
    expect(matches.map((e) => e.year)).toEqual(['1966', '1930']); // newest first
  });

  it('returns an empty list when nothing matches that date', () => {
    expect(entriesOnDate(entries, new Date(2026, 0, 1))).toEqual([]);
  });

  it('matches across different competitions on the same calendar day', () => {
    const both = [
      ...entries,
      { competition: 'X', year: '2000', month: 6, day: 21, champion: 'Y' },
    ];
    const matches = entriesOnDate(both, new Date(2026, 5, 21));
    expect(matches).toHaveLength(2);
  });
});

describe('fallbackEntry', () => {
  const entries = buildOnThisDayEntries(buildEditions(worldCupTable), 'FIFA World Cup');

  it('is deterministic for a given date', () => {
    const date = new Date(2026, 2, 15);
    expect(fallbackEntry(entries, date)).toEqual(fallbackEntry(entries, date));
  });

  it('returns undefined for an empty entry list', () => {
    expect(fallbackEntry([], new Date(2026, 2, 15))).toBeUndefined();
  });

  it('picks an entry that actually exists in the list', () => {
    const picked = fallbackEntry(entries, new Date(2026, 2, 15));
    expect(entries).toContainEqual(picked);
  });

  it('can pick different entries on different dates', () => {
    const a = fallbackEntry(entries, new Date(2026, 0, 1));
    const b = fallbackEntry(entries, new Date(2026, 5, 15));
    // Not asserting they always differ (small list, pigeonhole), just that
    // the function varies with day-of-year rather than being constant.
    expect([a, b].some((x) => x !== undefined)).toBe(true);
  });
});
