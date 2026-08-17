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
// "Fourth". Copa América has the same "Third"/"Fourth" columns, but only for
// the knockout-final era (1987, 1993 onward) - earlier editions had no
// standalone third-place match, so those cells are the "—" placeholder
// handled by isMissingCell() below rather than a real team name.
const SEMIFINAL_COLUMN = /third|fourth|semifinalist/i;

// The shared "no data for this row" marker used across every generic table
// column (see TournamentTable.astro's own missing-cell check). A cell this
// blank must never be treated as a country name, or it would show up as a
// phantom "—" team on /compare.
function isMissingCell(value: string | undefined): boolean {
  const trimmed = (value ?? '').trim();
  return trimmed === '' || trimmed === '—';
}

function matchesGroup(value: string | undefined, groupId: string): boolean {
  if (isMissingCell(value)) return false;
  return summaryGroupFor((value as string).trim()).id === groupId;
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
        if (isMissingCell(raw)) continue;
        const group = summaryGroupFor((raw as string).trim());
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

export type TeamIndexEntry = { id: string; displayName: string };

/**
 * The id/displayName pairs the global "find a team" nav search widget
 * (Nav.astro, fed by src/pages/team-index.json.ts) offers as autocomplete
 * options - every country buildAllCountryRecords() already ranks, just
 * alphabetically rather than by title count, since a searcher is typing a
 * name rather than scanning a leaderboard.
 */
export function buildTeamIndex(records: CountryRecord[]): TeamIndexEntry[] {
  return records
    .map((r) => ({ id: r.id, displayName: r.displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

const FINAL_SCORE_COLUMN = /^final$/i;

export type FinalsMeeting = {
  competition: string;
  slug: string;
  year: string;
  yearSort: number;
  winnerId: string;
  /** Historical name as written for that edition (e.g. "West Germany"), never normalized. */
  winnerName: string;
  runnerUpId: string;
  runnerUpName: string;
  /** Score line as written (e.g. "Uruguay 4-2 Argentina"), when the table has a "Final" column. */
  score?: string;
};

/**
 * Every edition of the given competitions where the winner and runner-up
 * cells are both real teams - i.e. every final actually played, one row per
 * meeting. Grouped by `summaryGroupFor()` the same way the rest of this
 * module groups titles (West Germany counts as Germany for matching a
 * head-to-head pair), while `winnerName`/`runnerUpName` keep the exact
 * historical name for display, matching AGENTS.md's "do not silently alter
 * historical facts" rule. Powers /compare's "Finals meetings" panel: given
 * two team ids, filter this list for rows where the pair is {winnerId,
 * runnerUpId} in either order.
 */
export function buildFinalsMeetings(competitions: CompetitionEditions[]): FinalsMeeting[] {
  const meetings: FinalsMeeting[] = [];
  for (const { title, slug, editions } of competitions) {
    for (const edition of editions) {
      const winnerName = edition.winner.trim();
      if (isMissingCell(winnerName)) continue;

      const runnerUpCell = edition.cells.find((c) => RUNNER_UP_COLUMN.test(c.label.trim()));
      const runnerUpName = runnerUpCell?.value.trim();
      if (!runnerUpCell || isMissingCell(runnerUpName)) continue;

      const scoreCell = edition.cells.find((c) => FINAL_SCORE_COLUMN.test(c.label.trim()));
      const score = scoreCell && !isMissingCell(scoreCell.value) ? scoreCell.value.trim() : undefined;

      meetings.push({
        competition: title,
        slug,
        year: edition.year,
        yearSort: edition.yearSort,
        winnerId: summaryGroupFor(winnerName).id,
        winnerName,
        runnerUpId: summaryGroupFor(runnerUpName as string).id,
        runnerUpName: runnerUpName as string,
        score,
      });
    }
  }
  return meetings;
}

/** Every final two teams played against each other, oldest first. */
export function finalsMeetingsBetween(
  idA: string,
  idB: string,
  meetings: FinalsMeeting[],
): FinalsMeeting[] {
  return meetings
    .filter(
      (m) => (m.winnerId === idA && m.runnerUpId === idB) || (m.winnerId === idB && m.runnerUpId === idA),
    )
    .sort((a, b) => a.yearSort - b.yearSort);
}
