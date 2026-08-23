import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../src/lib/editions';
import { validateEditions, ContentValidationError } from '../../src/lib/validate';
import type { MarkdownTable } from '../../src/lib/types';

function tableOf(rows: string[][], headers = ['Year', 'Teams', 'Winner']): MarkdownTable {
  return { headers, rows };
}

describe('validateEditions', () => {
  it('accepts a well-formed table', () => {
    const table = tableOf([
      ['1930', '13', 'Uruguay'],
      ['1934', '16', 'Italy'],
    ]);
    expect(() =>
      validateEditions({
        competition: 'Test',
        table,
        editions: buildEditions(table),
      }),
    ).not.toThrow();
  });

  it('rejects a table with no edition rows at all', () => {
    const table = tableOf([]);
    expect(() =>
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) }),
    ).toThrow(/no edition rows were found/);
  });

  it('rejects a missing winner', () => {
    const table = tableOf([['1930', '13', '']]);
    expect(() =>
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) }),
    ).toThrow(ContentValidationError);
  });

  it('rejects duplicate years unless explicitly allowed', () => {
    const table = tableOf([
      ['1959', '7', 'Argentina'],
      ['1959', '7', 'Uruguay'],
    ]);
    expect(() =>
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) }),
    ).toThrow(/1959/);

    expect(() =>
      validateEditions({
        competition: 'Test',
        table,
        editions: buildEditions(table),
        allowDuplicateYears: ['1959'],
      }),
    ).not.toThrow();
  });

  it('rejects duplicate table headers', () => {
    const table = tableOf(
      [['1930', 'Uruguay', 'Uruguay']],
      ['Year', 'Winner', 'Winner'],
    );
    expect(() =>
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) }),
    ).toThrow(/duplicate table header/);
  });

  it('rejects a row with too few cells for the header count', () => {
    // A row missing one pipe-delimited value, e.g. `| 2022 | Qatar | Argentina |`
    // for a Year/Host/Winner/Runner-up table. buildEditions() pads this to 4
    // cells (Runner-up becomes ''), so the check must compare the raw row
    // width, not the derived, always-padded edition.cells.
    const headers = ['Year', 'Host', 'Winner', 'Runner-up'];
    const table: MarkdownTable = { headers, rows: [['2022', 'Qatar', 'Argentina']] };
    expect(() =>
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) }),
    ).toThrow(/row 1 has 3 cells but the table has 4 columns/);
  });

  it('rejects a row with too many cells for the header count', () => {
    const headers = ['Year', 'Winner'];
    const table: MarkdownTable = { headers, rows: [['1930', 'Uruguay', 'extra']] };
    expect(() =>
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) }),
    ).toThrow(/row 1 has 3 cells but the table has 2 columns/);
  });

  it('labels a problem row by its 1-based row number when the year cell itself is blank', () => {
    const table = tableOf([['', '5', '']]);
    try {
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) });
      throw new Error('should have thrown');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('row 1 is missing a winner');
      expect(message).toContain('row 1 has no parseable year/season');
    }
  });

  it('reports every problem it finds in one error', () => {
    const table = tableOf([['not-a-year', '0', '']]);
    try {
      validateEditions({ competition: 'Test', table, editions: buildEditions(table) });
      throw new Error('should have thrown');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('missing a winner');
      expect(message).toContain('no parseable year');
      expect(message).toContain('non-positive team count');
    }
  });
});
