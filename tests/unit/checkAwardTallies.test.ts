import { describe, expect, it } from 'vitest';
import {
  computeTally,
  diffTally,
  findTableByHeadingPrefix,
  parseMarkdownTables,
} from '../../scripts/check-award-tallies.mjs';

const SOURCE_MD = `
## Editions

| Year | Winner |
|---:|---|
| 1930 | Uruguay |
| 1950 | Uruguay |
| 1954 | West Germany |
| 1974 | West Germany |
| 2014 | Germany |

## Champions by titles after 2026

| Nation | Titles |
|---|---:|
| Uruguay | 2 |
| Germany, including West Germany | 3 |
`;

describe('parseMarkdownTables', () => {
  it('tags each table with its nearest preceding heading', () => {
    const tables = parseMarkdownTables(SOURCE_MD);
    expect(tables).toHaveLength(2);
    expect(tables[0].heading).toBe('Editions');
    expect(tables[1].heading).toBe('Champions by titles after 2026');
  });

  it('parses headers and rows', () => {
    const [editions] = parseMarkdownTables(SOURCE_MD);
    expect(editions.headers).toEqual(['Year', 'Winner']);
    expect(editions.rows).toEqual([
      ['1930', 'Uruguay'],
      ['1950', 'Uruguay'],
      ['1954', 'West Germany'],
      ['1974', 'West Germany'],
      ['2014', 'Germany'],
    ]);
  });
});

describe('findTableByHeadingPrefix', () => {
  it('finds a table whose heading starts with the given prefix, case-insensitively', () => {
    const table = findTableByHeadingPrefix(SOURCE_MD, 'champions by titles');
    expect(table?.heading).toBe('Champions by titles after 2026');
  });

  it('returns undefined when no heading matches', () => {
    expect(findTableByHeadingPrefix(SOURCE_MD, 'nope')).toBeUndefined();
  });
});

describe('computeTally', () => {
  it('tallies wins per name, merging aliased names into one bucket', () => {
    const [editions] = parseMarkdownTables(SOURCE_MD);
    const tally = computeTally(editions, {
      yearColumn: 'Year',
      nameColumn: 'Winner',
      aliases: {
        'West Germany': 'Germany, including West Germany',
        Germany: 'Germany, including West Germany',
      },
    });
    expect(tally.get('Uruguay')).toEqual({ count: 2, years: ['1930', '1950'] });
    expect(tally.get('Germany, including West Germany')).toEqual({
      count: 3,
      years: ['1954', '1974', '2014'],
    });
  });

  it('skips placeholder rows like "Not awarded" or an em dash', () => {
    const [editions] = parseMarkdownTables(`
## Editions

| Year | Winner |
|---:|---|
| 2019 | Spain |
| 2020 | Not awarded |
| 2021 | — |
`);
    const tally = computeTally(editions, { yearColumn: 'Year', nameColumn: 'Winner' });
    expect([...tally.keys()]).toEqual(['Spain']);
  });

  it('throws when the requested column does not exist', () => {
    const [editions] = parseMarkdownTables(SOURCE_MD);
    expect(() => computeTally(editions, { yearColumn: 'Year', nameColumn: 'Nope' })).toThrow(
      /no "Nope" column/,
    );
  });
});

describe('diffTally', () => {
  const [, tallyTable] = parseMarkdownTables(SOURCE_MD);
  const computed = new Map([
    ['Uruguay', { count: 2, years: ['1930', '1950'] }],
    ['Germany, including West Germany', { count: 3, years: ['1954', '1974', '2014'] }],
  ]);

  it('reports no problems when the tally table matches the computed tally exactly', () => {
    expect(
      diffTally(tallyTable, computed, { nameColumn: 'Nation', countColumn: 'Titles', mode: 'full' }),
    ).toEqual([]);
  });

  it('flags a count mismatch', () => {
    const wrong = new Map(computed);
    wrong.set('Uruguay', { count: 1, years: ['1930'] });
    const problems = diffTally(tallyTable, wrong, {
      nameColumn: 'Nation',
      countColumn: 'Titles',
      mode: 'full',
    });
    expect(problems).toEqual(['"Uruguay" is listed with 2 title(s) but the source table has 1']);
  });

  it('flags a name present in the tally table with no matching source wins', () => {
    const withExtra = new Map(computed);
    withExtra.set('Fake Nation', { count: 1, years: ['2000'] });
    const tallyWithExtra = {
      ...tallyTable,
      rows: [...tallyTable.rows, ['Fake Nation', '1']],
    };
    const problems = diffTally(tallyWithExtra, computed, {
      nameColumn: 'Nation',
      countColumn: 'Titles',
      mode: 'full',
    });
    expect(problems).toEqual([
      '"Fake Nation" appears in the tally table but has no matching wins in the source table',
    ]);
  });

  it('flags a source winner missing from a "full" tally table', () => {
    const missing = new Map(computed);
    missing.set('Brazil', { count: 1, years: ['1958'] });
    const problems = diffTally(tallyTable, missing, {
      nameColumn: 'Nation',
      countColumn: 'Titles',
      mode: 'full',
    });
    expect(problems).toEqual([
      '"Brazil" has 1 title(s) in the source table but is missing from the tally table',
    ]);
  });

  it('does not require a single-time winner to appear in a "multiple" tally table', () => {
    const withSingleWinner = new Map(computed);
    withSingleWinner.set('Brazil', { count: 1, years: ['1958'] });
    const problems = diffTally(tallyTable, withSingleWinner, {
      nameColumn: 'Nation',
      countColumn: 'Titles',
      mode: 'multiple',
    });
    expect(problems).toEqual([]);
  });

  it('flags a single-time winner wrongly listed in a "multiple" tally table', () => {
    const tallyWithSingleWinner = {
      ...tallyTable,
      rows: [...tallyTable.rows, ['Brazil', '1']],
    };
    const withSingleWinner = new Map(computed);
    withSingleWinner.set('Brazil', { count: 1, years: ['1958'] });
    const problems = diffTally(tallyWithSingleWinner, withSingleWinner, {
      nameColumn: 'Nation',
      countColumn: 'Titles',
      mode: 'multiple',
    });
    expect(problems).toEqual([
      '"Brazil" is listed in a multiple-winners table with only 1 win',
    ]);
  });

  it('checks a "Winning years" column when configured', () => {
    const problems = diffTally(tallyTable, computed, {
      nameColumn: 'Nation',
      countColumn: 'Titles',
      yearsColumn: 'Winning years',
      mode: 'full',
    });
    expect(problems).toEqual(['tally table has no "Winning years" column']);
  });
});
