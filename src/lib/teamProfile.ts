import {
  RUNNER_UP_COLUMN,
  SEMIFINAL_COLUMN,
  matchesGroup,
  type CompetitionEditions,
  type CountryRecord,
} from './compare';

// Builds a full team "profile" page: every edition a country reached a
// tracked final or semifinal in, across the same four team competitions
// /compare already loads (World Cup, EURO, Copa América, Nations League).
// /compare only ever shows aggregate counts (titles, runner-ups, semifinals)
// per competition; this turns that into an actual year-by-year list, reusing
// exactly the same winner/runner-up/semifinal matching compare.ts's own
// CountryRecord totals are built from, so the two can never disagree.

export type TeamAppearance = {
  year: string;
  yearSort: number;
  /**
   * The exact column label the edition table used for this result -
   * "Champion" for a title, otherwise the source table's own wording
   * ("Runner-up", "Third", "Fourth", "Other semifinalist", ...), preserved
   * verbatim rather than normalized, the same historical-fidelity rule
   * every edition table already follows.
   */
  role: string;
};

export type TeamProfileCompetition = {
  title: string;
  slug: string;
  /** Chronological, oldest first. */
  appearances: TeamAppearance[];
};

export type TeamProfile = {
  id: string;
  displayName: string;
  /** Only competitions this team has actually reached a tracked final/semifinal in. */
  competitions: TeamProfileCompetition[];
  totalTitles: number;
  totalRunnerUps: number;
  totalSemifinals: number;
  totalFinals: number;
};

function appearancesFor(groupId: string, competition: CompetitionEditions): TeamAppearance[] {
  const appearances: TeamAppearance[] = [];
  for (const edition of competition.editions) {
    if (matchesGroup(edition.winner, groupId)) {
      appearances.push({ year: edition.year, yearSort: edition.yearSort, role: 'Champion' });
      continue;
    }
    const runnerUpCell = edition.cells.find((c) => RUNNER_UP_COLUMN.test(c.label.trim()));
    if (runnerUpCell && matchesGroup(runnerUpCell.value, groupId)) {
      appearances.push({ year: edition.year, yearSort: edition.yearSort, role: runnerUpCell.label });
      continue;
    }
    const semifinalCell = edition.cells.find(
      (c) => SEMIFINAL_COLUMN.test(c.label) && matchesGroup(c.value, groupId),
    );
    if (semifinalCell) {
      appearances.push({ year: edition.year, yearSort: edition.yearSort, role: semifinalCell.label });
    }
  }
  return appearances.sort((a, b) => a.yearSort - b.yearSort);
}

/** Build one team's full profile from a compare.ts CountryRecord plus the same competitions it was derived from. */
export function buildTeamProfile(
  record: CountryRecord,
  competitions: CompetitionEditions[],
): TeamProfile {
  const competitionProfiles = competitions
    .map((c) => ({ title: c.title, slug: c.slug, appearances: appearancesFor(record.id, c) }))
    .filter((c) => c.appearances.length > 0);

  return {
    id: record.id,
    displayName: record.displayName,
    competitions: competitionProfiles,
    totalTitles: record.totalTitles,
    totalRunnerUps: record.totalRunnerUps,
    totalSemifinals: record.totalSemifinals,
    totalFinals: record.totalFinals,
  };
}

/**
 * URL-safe slug for a team's profile page path (`/teams/<slug>`), distinct
 * from the `id` compare.ts already uses in `?a=<id>` query params. A query
 * param is safe with spaces/diacritics (the browser percent-encodes it
 * automatically), but a path segment reads better - and avoids a new class
 * of encoding bugs - as plain ASCII, since real team ids include both
 * (e.g. "south korea", "türkiye").
 */
export function teamProfileSlug(id: string): string {
  return id
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
