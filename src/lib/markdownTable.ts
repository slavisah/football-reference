import type { MarkdownTable } from './types';

// A small, dependency-free parser for GitHub-flavoured Markdown tables.
// It is intentionally narrow: it only understands the pipe-table shape used in
// the editorial content, and it records the nearest preceding heading so a page
// can ask for a specific table (e.g. the one under "## Editions").

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{1,}:?$/.test(cell.replace(/\s+/g, '')))
  );
}

/** Extract every Markdown table in document order, tagged with its heading. */
export function parseMarkdownTables(markdown: string): MarkdownTable[] {
  const lines = markdown.split(/\r?\n/);
  const tables: MarkdownTable[] = [];
  let currentHeading: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    const headingMatch = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      continue;
    }

    if (!lines[i].includes('|') || i + 1 >= lines.length) continue;

    const headers = splitRow(lines[i]);
    const separator = splitRow(lines[i + 1]);
    if (separator.length !== headers.length || !isSeparatorRow(separator)) {
      continue;
    }

    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim() !== '' && lines[j].includes('|')) {
      rows.push(splitRow(lines[j]));
      j++;
    }

    tables.push({ headers, rows, heading: currentHeading });
    i = j - 1;
  }

  return tables;
}

/** Find the first table whose nearest heading matches `heading` (case-insensitive). */
export function findTableByHeading(
  markdown: string,
  heading: string,
): MarkdownTable | undefined {
  const target = heading.trim().toLowerCase();
  return parseMarkdownTables(markdown).find(
    (table) => table.heading?.trim().toLowerCase() === target,
  );
}
