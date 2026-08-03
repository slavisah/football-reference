import type { Edition } from './types';

// "On this day in football history": reduces editions that have a "Final
// date" (tournaments) or "Ceremony date" (individual awards, e.g. Ballon
// d'Or) column into a flat, calendar-day-searchable list. Mirrors the
// cellValue-by-label lookup pattern already used by buildTimeline/
// buildTopScorerFacts in editions.ts, kept local here since this is the only
// module that needs it.

export type OnThisDayEntry = {
  competition: string;
  year: string;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  champion: string;
  runnerUp?: string;
  final?: string;
  /**
   * True for an individual award with no match to date (e.g. Ballon d'Or,
   * from its "Ceremony date" column) - the display layer needs this to avoid
   * saying a "final" was played when the date is really an award ceremony.
   */
  isAward?: boolean;
};

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/** Parses a "Final date" cell like "30 July 1930" into a month/day pair. */
export function parseFinalDate(raw: string): { month: number; day: number } | undefined {
  const match = /^(\d{1,2})\s+([A-Za-z]+)\s+\d{4}$/.exec(raw.trim());
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = MONTHS[match[2].toLowerCase()];
  if (!month || day < 1 || day > 31) return undefined;
  return { month, day };
}

function cellValue(edition: Edition, matcher: RegExp): string | undefined {
  const cell = edition.cells.find((c) => matcher.test(c.label.trim()));
  return cell?.value.trim() || undefined;
}

/**
 * Builds "on this day" entries from editions with a "Final date" (or, for an
 * individual award with no match, "Ceremony date") column. Editions without
 * either column, or with an unparseable value, are skipped rather than
 * guessed at - the feature only ever shows dates that were explicitly
 * researched and added to the content file.
 */
export function buildOnThisDayEntries(editions: Edition[], competition: string): OnThisDayEntry[] {
  const entries: OnThisDayEntry[] = [];
  for (const edition of editions) {
    const finalDateRaw = cellValue(edition, /^final date$/i);
    const ceremonyDateRaw = finalDateRaw ? undefined : cellValue(edition, /^ceremony date$/i);
    const raw = finalDateRaw ?? ceremonyDateRaw;
    if (!raw) continue;
    const parsed = parseFinalDate(raw);
    if (!parsed) continue;
    entries.push({
      competition,
      year: edition.year,
      month: parsed.month,
      day: parsed.day,
      champion: edition.winner,
      runnerUp: cellValue(edition, /runner-up|finalist/i),
      final: cellValue(edition, /^final$/i),
      isAward: Boolean(ceremonyDateRaw),
    });
  }
  return entries;
}

/** Entries whose final was played on this calendar month/day, newest first. */
export function entriesOnDate(entries: OnThisDayEntry[], date: Date): OnThisDayEntry[] {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return entries
    .filter((entry) => entry.month === month && entry.day === day)
    .sort((a, b) => Number(b.year) - Number(a.year));
}

/**
 * A deterministic "featured" entry for when no final was played on today's
 * exact date - keyed by day-of-year so it is stable for the whole day and
 * rotates daily, without relying on Math.random() (which would make the
 * widget flicker between reloads and can't be unit-tested for a given date).
 */
export function fallbackEntry(entries: OnThisDayEntry[], date: Date): OnThisDayEntry | undefined {
  if (entries.length === 0) return undefined;
  const startOfYear = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.floor((today - startOfYear) / 86_400_000);
  const sorted = [...entries].sort(
    (a, b) => a.month - b.month || a.day - b.day || Number(a.year) - Number(b.year),
  );
  return sorted[dayOfYear % sorted.length];
}
