// Shared types for the parsed, structured view of the editorial Markdown.

/** A single GitHub-flavoured Markdown table extracted from a content file. */
export type MarkdownTable = {
  headers: string[];
  rows: string[][];
  /** Text of the nearest heading above the table, if any. */
  heading?: string;
};

/** One column value of an edition row, keeping its original column label. */
export type EditionCell = {
  label: string;
  value: string;
};

/** A normalized tournament edition, derived from one table row. */
export type Edition = {
  /** Original year/season label, e.g. "2018" or "2018-19". */
  year: string;
  /** Leading four-digit year, used for sorting and range filters. */
  yearSort: number;
  /** Champion exactly as written in the source (historical names preserved). */
  winner: string;
  /** Host label as written, if the table has a host column. */
  host?: string;
  /** Number of teams, if the table has a numeric team column. */
  teams?: number;
  /** Every column of the row in source order, for full-fidelity display. */
  cells: EditionCell[];
};

/** A generated champions summary row, grouped by sporting-successor identity. */
export type ChampionSummary = {
  id: string;
  displayName: string;
  titles: number;
  /** Winning years in chronological order. */
  years: string[];
  /** Distinct historical names counted under this group. */
  names: string[];
};
