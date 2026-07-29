import type { Edition } from './types';
import { summaryGroupFor, type Group } from './countries';

// Builds a "compare two national teams" record from the same edition tables
// every competition page already loads - no new editorial content. Only the
// four team competitions are included (World Cup, EURO, Copa América,
// Nations League), matching the "Most successful teams" precedent on
// /records: Ballon d'Or and Golden Boot are individual awards, and their
// "Team"/"National team" cells can hold semicolon-separated ties (e.g. the
// 1962 Golden Boot's six-way tie), which isn't safe to count as one country.

const RUNNER_UP_COLUMN = /^runner-up$/i;
// World Cup: "Third", "Fourth / other semifinalist". EURO: "Other
// semifinalist", "Other semifinalist / fourth". Nations League: "Third",
// "Fourth". Copa América has no such column, so it never contributes here.
const SEMIFINAL_COLUMN = /third|fourth|semifinalist/i;

function matchesGroup(value: string | undefined, groupId: string): boolean {
  const name = value?.trim();
  if (!name) return false;
  return summaryGroupFor(name).id === groupId;
}

export type CompetitionEditions = {
  /** Display title, e.g. "FIFA World Cup". */
  title: string;
  /** Slug used to link back to the competition page, e.g. "world-cup". */
  slug: string;
  editions: Edition[];
};

export type CountryCompetitionRecord = {
  competition: string;
  slug: string;
  titles: number;
  titleYears: string[];
  runnerUps: number;
  runnerUpYears: string[];
  /** Third/fourth-place or "other semifinalist" finishes; 0 when the table tracks no such column. */
  semifinals: number;
};

export type CountryRecord = {
  id: string;
  displayName: string;
  competitions: CountryCompetitionRecord[];
  totalTitles: number;
  totalRunnerUps: number;
  totalSemifinals: number;
  /** Titles + runner-up finishes, summed across competitions. */
  totalFinals: number;
};

/** Whether a competition's edition table has a third/fourth/semifinalist column at all. */
export function tracksSemifinalColumn(editions: Edition[]): boolean {
  return editions.some((edition) => edition.cells.some((c) => SEMIFINAL_COLUMN.test(c.label)));
}

/**
 * Every distinct country (grouped the same way as the champions summary,
 * e.g. West Germany + Germany) that appears as a winner, runner-up, or
 * third/fourth-place finisher across the given competitions.
 */
export function distinctCountryGroups(competitions: CompetitionEditions[]): Group[] {
  const groups = new Map<string, Group>();
  for (const { editions } of competitions) {
    for (const edition of editions) {
      const names = [
        edition.winner,
        ...edition.cells
          .filter((c) => RUNNER_UP_COLUMN.test(c.label.trim()) || SEMIFINAL_COLUMN.test(c.label))
          .map((c) => c.value),
      ];
      for (const raw of names) {
        const name = raw?.trim();
        if (!name) continue;
        const group = summaryGroupFor(name);
        if (!groups.has(group.id)) groups.set(group.id, group);
      }
    }
  }
  return [...groups.values()];
}

/** One country's record in one competition: titles, runner-up finishes, and semifinal-or-fourth finishes. */
export function buildCountryCompetitionRecord(
  groupId: string,
  competition: CompetitionEditions,
): CountryCompetitionRecord {
  let titles = 0;
  let runnerUps = 0;
  let semifinals = 0;
  const titleYears: string[] = [];
  const runnerUpYears: string[] = [];

  for (const edition of competition.editions) {
    if (matchesGroup(edition.winner, groupId)) {
      titles += 1;
      titleYears.push(edition.year);
      continue;
    }
    const runnerUpCell = edition.cells.find((c) => RUNNER_UP_COLUMN.test(c.label.trim()));
    if (runnerUpCell && matchesGroup(runnerUpCell.value, groupId)) {
      runnerUps += 1;
      runnerUpYears.push(edition.year);
      continue;
    }
    const reachedSemifinal = edition.cells.some(
      (c) => SEMIFINAL_COLUMN.test(c.label) && matchesGroup(c.value, groupId),
    );
    if (reachedSemifinal) semifinals += 1;
  }

  return {
    competition: competition.title,
    slug: competition.slug,
    titles,
    titleYears,
    runnerUps,
    runnerUpYears,
    semifinals,
  };
}

/** Build one country's full record across every given competition, plus combined totals. */
export function buildCountryRecord(
  group: Group,
  competitions: CompetitionEditions[],
): CountryRecord {
  const records = competitions.map((c) => buildCountryCompetitionRecord(group.id, c));
  const totalTitles = records.reduce((sum, r) => sum + r.titles, 0);
  const totalRunnerUps = records.reduce((sum, r) => sum + r.runnerUps, 0);
  const totalSemifinals = records.reduce((sum, r) => sum + r.semifinals, 0);
  return {
    id: group.id,
    displayName: group.displayName,
    competitions: records,
    totalTitles,
    totalRunnerUps,
    totalSemifinals,
    totalFinals: totalTitles + totalRunnerUps,
  };
}

/**
 * Every country's full record, ranked by total titles, then total finals
 * reached, then name. This is both the data set the head-to-head comparison
 * picks two rows from, and a standalone reference table in its own right.
 */
export function buildAllCountryRecords(competitions: CompetitionEditions[]): CountryRecord[] {
  return distinctCountryGroups(competitions)
    .map((group) => buildCountryRecord(group, competitions))
    .sort(
      (a, b) =>
        b.totalTitles - a.totalTitles ||
        b.totalFinals - a.totalFinals ||
        a.displayName.localeCompare(b.displayName),
    );
}
