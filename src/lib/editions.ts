import type { ChampionSummary, Edition, MarkdownTable, TimelineEntry } from './types';
import { summaryGroupFor } from './countries';

// Turn a parsed Markdown table into normalized editions, and derive the
// champions summary from those editions (rather than trusting a hand-maintained
// totals table). Column roles are detected from the header text so the same code
// works for the World Cup and EURO tables even though their columns differ.

function findColumn(headers: string[], matchers: RegExp[]): number {
  return headers.findIndex((h) => matchers.some((re) => re.test(h.toLowerCase())));
}

function leadingYear(label: string): number {
  const match = /\d{4}/.exec(label);
  return match ? Number(match[0]) : Number.NaN;
}

/** Convert a table into structured editions, preserving every column for display. */
export function buildEditions(table: MarkdownTable): Edition[] {
  const { headers, rows } = table;
  const yearCol = findColumn(headers, [/year/, /season/]);
  const winnerCol = findColumn(headers, [/winner/, /champion/, /player/]);
  const hostCol = findColumn(headers, [/host/]);
  const teamsCol = findColumn(headers, [/team/]);

  return rows.map((row) => {
    const cells = headers.map((label, index) => ({
      label,
      value: row[index] ?? '',
    }));

    const yearRaw = yearCol >= 0 ? (row[yearCol] ?? '') : '';

    // Only derive a team count when the table actually has a teams column with
    // a value, so validation can distinguish "no column" from a bad "0".
    let teams: number | undefined;
    if (teamsCol >= 0) {
      const digits = (row[teamsCol] ?? '').replace(/[^\d]/g, '');
      if (digits !== '') teams = Number(digits);
    }

    return {
      year: yearRaw,
      yearSort: leadingYear(yearRaw),
      winner: winnerCol >= 0 ? (row[winnerCol] ?? '') : '',
      host: hostCol >= 0 ? (row[hostCol] ?? '') : undefined,
      teams,
      cells,
    };
  });
}

/** Generate champions totals from editions, grouping sporting successors. */
export function buildChampionsSummary(editions: Edition[]): ChampionSummary[] {
  const groups = new Map<string, ChampionSummary>();

  for (const edition of editions) {
    const winner = edition.winner.trim();
    if (!winner) continue;
    const group = summaryGroupFor(winner);
    const existing = groups.get(group.id);
    if (existing) {
      existing.titles += 1;
      existing.years.push(edition.year);
      if (!existing.names.includes(winner)) existing.names.push(winner);
    } else {
      groups.set(group.id, {
        id: group.id,
        displayName: group.displayName,
        titles: 1,
        years: [edition.year],
        names: [winner],
      });
    }
  }

  return [...groups.values()]
    .map((summary) => ({
      ...summary,
      years: [...summary.years].sort((a, b) => leadingYear(a) - leadingYear(b)),
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

/** Find a cell's value by matching its column label, e.g. "Runner-up". */
function cellValue(edition: Edition, matcher: RegExp): string | undefined {
  const cell = edition.cells.find((c) => matcher.test(c.label.trim()));
  return cell?.value.trim() || undefined;
}

/**
 * Reduce editions to champions-timeline cards: year, host, champion,
 * runner-up and final score. Runner-up/final are omitted when the source
 * table has no such column (e.g. Copa América has no "Final" score column).
 */
export function buildTimeline(editions: Edition[]): TimelineEntry[] {
  return editions.map((edition) => ({
    year: edition.year,
    yearSort: edition.yearSort,
    champion: edition.winner,
    host: edition.host,
    runnerUp: cellValue(edition, /runner-up|finalist/i),
    final: cellValue(edition, /^final$/i),
  }));
}

/** Distinct winners for populating the filter control, in first-title order. */
export function distinctWinners(editions: Edition[]): string[] {
  const seen = new Set<string>();
  const winners: string[] = [];
  for (const edition of editions) {
    const winner = edition.winner.trim();
    if (winner && !seen.has(winner)) {
      seen.add(winner);
      winners.push(winner);
    }
  }
  return winners.sort((a, b) => a.localeCompare(b));
}

/**
 * Distinct hosts for populating the filter control, alphabetically. Returns
 * an empty list when the source table has no host column (e.g. Ballon d'Or,
 * Golden Boot), so callers can hide the filter entirely rather than showing
 * an empty one.
 */
export function distinctHosts(editions: Edition[]): string[] {
  const seen = new Set<string>();
  const hosts: string[] = [];
  for (const edition of editions) {
    const host = edition.host?.trim();
    if (host && !seen.has(host)) {
      seen.add(host);
      hosts.push(host);
    }
  }
  return hosts.sort((a, b) => a.localeCompare(b));
}
