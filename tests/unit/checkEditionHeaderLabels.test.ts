import { describe, expect, it } from 'vitest';
import { parseHeaderLabelKeys } from '../../scripts/check-edition-header-labels.mjs';

describe('parseHeaderLabelKeys', () => {
  it('extracts single-quoted keys', () => {
    const source = `
const HEADER_LABELS: Record<string, string> = {
  'Host(s)': 'Domaćin(i)',
  'Runner-up': 'Drugoplasirani',
};
`;
    expect(parseHeaderLabelKeys(source)).toEqual(['Host(s)', 'Runner-up']);
  });

  it('extracts bare-identifier keys alongside quoted ones', () => {
    const source = `
const HEADER_LABELS: Record<string, string> = {
  Winner: 'Prvak',
  'Final date': 'Datum finala',
  Goals: 'Golovi',
};
`;
    expect(parseHeaderLabelKeys(source)).toEqual(['Winner', 'Final date', 'Goals']);
  });

  it('returns null when the file has no HEADER_LABELS object', () => {
    const source = `const OTHER_CONST = { Winner: 'Prvak' };`;
    expect(parseHeaderLabelKeys(source)).toBeNull();
  });

  it('ignores unrelated code around the object literal', () => {
    const source = `
import { withBase } from '../lib/url';

const HEADER_LABELS: Record<string, string> = {
  Third: 'Treći',
};

const title = 'unrelated: string with a colon';
`;
    expect(parseHeaderLabelKeys(source)).toEqual(['Third']);
  });
});
