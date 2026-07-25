import { describe, expect, it } from 'vitest';
import {
  parseMarkdownTables,
  findTableByHeading,
} from '../../src/lib/markdownTable';

const doc = `# Title

Intro paragraph.

## Editions

| Year | Host | Teams | Winner |
|---:|---|---:|---|
| 1930 | Uruguay | 13 | Uruguay |
| 2018 | Russia | 32 | France |

## Champions

| Nation | Titles |
|---|---:|
| Brazil | 5 |
`;

describe('parseMarkdownTables', () => {
  it('extracts every table with its preceding heading', () => {
    const tables = parseMarkdownTables(doc);
    expect(tables).toHaveLength(2);
    expect(tables[0].heading).toBe('Editions');
    expect(tables[1].heading).toBe('Champions');
  });

  it('parses headers and rows into trimmed cells', () => {
    const [editions] = parseMarkdownTables(doc);
    expect(editions.headers).toEqual(['Year', 'Host', 'Teams', 'Winner']);
    expect(editions.rows).toHaveLength(2);
    expect(editions.rows[1]).toEqual(['2018', 'Russia', '32', 'France']);
  });

  it('ignores the separator row and does not treat it as data', () => {
    const [editions] = parseMarkdownTables(doc);
    expect(editions.rows.some((r) => r[0].includes('---'))).toBe(false);
  });
});

describe('findTableByHeading', () => {
  it('finds a table case-insensitively by heading', () => {
    const table = findTableByHeading(doc, 'editions');
    expect(table?.rows).toHaveLength(2);
  });

  it('returns undefined when no heading matches', () => {
    expect(findTableByHeading(doc, 'Records')).toBeUndefined();
  });
});
