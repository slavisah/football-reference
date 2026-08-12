import type { Edition, MarkdownTable } from './types';

// Build-time validation of the editorial tables. Any problem throws, which fails
// `astro build` loudly instead of shipping malformed data. This implements the
// checks listed in docs/CONTENT_MODEL.md.

export class ContentValidationError extends Error {
  constructor(competition: string, problems: string[]) {
    super(
      `Content validation failed for "${competition}":\n` +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
    this.name = 'ContentValidationError';
  }
}

export type ValidateOptions = {
  competition: string;
  table: MarkdownTable;
  editions: Edition[];
  /** Year/season labels allowed to appear more than once (rare historical cases). */
  allowDuplicateYears?: string[];
};

export function validateEditions(options: ValidateOptions): void {
  const { competition, table, editions, allowDuplicateYears = [] } = options;
  const problems: string[] = [];

  if (editions.length === 0) {
    problems.push('no edition rows were found');
  }

  // No duplicate table headers.
  const headerCounts = new Map<string, number>();
  for (const header of table.headers) {
    const key = header.trim().toLowerCase();
    headerCounts.set(key, (headerCounts.get(key) ?? 0) + 1);
  }
  for (const [key, count] of headerCounts) {
    if (count > 1) problems.push(`duplicate table header "${key}" (${count} times)`);
  }

  // Every row must have one cell per header. This must compare against the
  // raw parsed row width (table.rows), not editions[i].cells: buildEditions()
  // always pads/truncates cells to headers.length by construction
  // (headers.map((_, index) => row[index] ?? '')), so a cells.length check
  // can never disagree with itself and would silently let a malformed
  // Markdown row (one missing/extra pipe-delimited value) shift every
  // subsequent column instead of failing the build.
  table.rows.forEach((row, index) => {
    if (row.length !== table.headers.length) {
      problems.push(
        `row ${index + 1} has ${row.length} cells but the table has ${table.headers.length} columns`,
      );
    }
  });

  // Required winner + a resolvable year, positive team count when present.
  const allowed = new Set(allowDuplicateYears.map((y) => y.trim()));
  const seenYears = new Map<string, number>();
  editions.forEach((edition, index) => {
    const rowLabel = edition.year ? `edition ${edition.year}` : `row ${index + 1}`;

    if (!edition.winner.trim()) {
      problems.push(`${rowLabel} is missing a winner`);
    }
    if (!edition.year.trim() || Number.isNaN(edition.yearSort)) {
      problems.push(`${rowLabel} has no parseable year/season`);
    }
    if (edition.teams !== undefined && !(edition.teams > 0)) {
      problems.push(`${rowLabel} has a non-positive team count`);
    }

    const key = edition.year.trim();
    if (key) seenYears.set(key, (seenYears.get(key) ?? 0) + 1);
  });

  for (const [year, count] of seenYears) {
    if (count > 1 && !allowed.has(year)) {
      problems.push(`year/season "${year}" appears ${count} times`);
    }
  }

  if (problems.length > 0) {
    throw new ContentValidationError(competition, problems);
  }
}
