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
