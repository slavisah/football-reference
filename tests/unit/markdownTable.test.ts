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

describe('parseMarkdownTables with a malformed table', () => {
  it('skips a line with a "|" whose next line is not a valid GFM separator row, without crashing or misreading it as a table', () => {
    // A stray "|" in ordinary prose (not a table at all) - the separator
    // check must reject "Prices are here." rather than treat it as one.
    const notATable = `# Title\n\n## Notes\n\nOn the card | it just says "prices are here." | Prices are here.\n`;
    expect(parseMarkdownTables(notATable)).toEqual([]);
  });

  it('skips a broken table (separator column count does not match the header) and still finds a later well-formed one', () => {
    const brokenThenGood = `# Title

## Broken

| Year | Winner |
|---|---|---|
| 2020 | Nobody |

## Editions

| Year | Winner |
|---|---|
| 2024 | Somebody |
`;
    const tables = parseMarkdownTables(brokenThenGood);
    expect(tables).toHaveLength(1);
    expect(tables[0].heading).toBe('Editions');
    expect(tables[0].rows).toEqual([['2024', 'Somebody']]);
  });
});
