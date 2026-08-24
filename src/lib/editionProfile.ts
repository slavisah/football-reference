import type { Edition } from './types';
import { summaryGroupFor } from './countries';
import { isPlaceholderWinner } from './editions';
import { teamProfileSlug } from './teamProfile';

// One tournament edition as its own reader-facing page: /competitions/
// <competition>/<year>. Every other "profile" page on this site is keyed by
// an entity that spans editions (a country, a player); this is the missing
// perpendicular cut - one edition, every column the source table records
// about it, with its placings linked out to those team profiles.
//
// Deliberately derives everything from `Edition.cells` rather than naming
// World Cup columns specifically, so the same builder serves any competition
// whose editions table has unique year labels (see `buildEditionProfiles`'s
// duplicate-slug guard for the competitions that don't yet).

/** The site-wide "no data" placeholder, same convention as compare.ts's `isMissingCell`. */
const MISSING_CELL = '—';

/**
 * Column labels whose value names a national team that has a `/teams/<slug>`
 * profile. Mirrors the matcher set `editionTeams()` (src/lib/editions.ts)
 * already documents, minus the individual awards' "National team"/"Team"
 * columns - an edition page is only built for a team competition, so those
 * never appear here.
 */
const TEAM_PLACING_PATTERNS: RegExp[] = [
  /^(winner|champion)$/i,
  /runner-up/i,
  /finalist/i,
  /^third$/i,
  /^fourth/i,
];

function isTeamPlacingLabel(label: string): boolean {
  return TEAM_PLACING_PATTERNS.some((re) => re.test(label.trim()));
}

/** The Year/Season column, detected the same way `buildEditions()` detects it. */
function isYearLabel(label: string): boolean {
  const lower = label.trim().toLowerCase();
  return /year/.test(lower) || /season/.test(lower);
}

export type EditionFact = {
  /** The raw source column label (e.g. "Runner-up"), so a localized page can translate it through its own `headerLabels` map. */
  label: string;
  value: string;
  /** Set only when `value` names a national team with a `/teams/` profile. */
  teamSlug?: string;
};

export type EditionNeighbour = { slug: string; year: string };

export type EditionProfile = {
  /** The Year column's label exactly as authored (e.g. "1930", "2018–19"). */
  year: string;
  yearSort: number;
  slug: string;
  /** The champion, for the page title and JSON-LD; empty when the edition has none. */
  champion: string;
  host?: string;
  /** Every column except Year, in source order, with team placings linked. */
  facts: EditionFact[];
  /** The chronologically older/newer edition, for the prev/next pager. */
  previous?: EditionNeighbour;
  next?: EditionNeighbour;
};

/**
 * URL slug for one edition. A plain year is already its own slug; a season
 * label ("2018–19", en dash in the source tables - see `editionStoryYear()`
 * in src/lib/editions.ts for the same both-separators note) normalizes to a
 * plain-hyphen "2018-19".
 */
export function editionSlug(year: string): string {
  return year
    .trim()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Build one page-ready profile per edition, newest first.
 *
 * `teamSlugs`, when given, is the set of slugs that actually have a
 * `/teams/<slug>` page: a placing is linked only if its slug is in there, so
 * this can never emit a link to a profile that was not generated. Omit it to
 * link every placing unconditionally (unit tests, and any caller that has
 * already established the two sets agree).
 *
 * Throws on two editions sharing a slug rather than silently dropping one -
 * the same "never ship a silent data problem" guard `/teams/[slug]`'s own
 * `getStaticPaths` uses for colliding team slugs. Copa América's two 1959
 * tournaments are real data that trips this, which is why that competition
 * has no edition pages yet (see docs/PROJECT_STATUS.md).
 */
export function buildEditionProfiles(
  editions: Edition[],
  teamSlugs?: Set<string>,
): EditionProfile[] {
  const ordered = [...editions].sort((a, b) => a.yearSort - b.yearSort);

  const seen = new Set<string>();
  for (const edition of ordered) {
    const slug = editionSlug(edition.year);
    if (seen.has(slug)) {
      throw new Error(
        `Two editions produced the same edition slug: "${slug}" (year "${edition.year}").`,
      );
    }
    seen.add(slug);
  }

  const profiles = ordered.map((edition, index) => {
    const facts: EditionFact[] = [];
    for (const cell of edition.cells) {
      if (isYearLabel(cell.label)) continue;
      const value = cell.value.trim();
      const fact: EditionFact = { label: cell.label.trim(), value };
      if (value && value !== MISSING_CELL && !isPlaceholderWinner(value) && isTeamPlacingLabel(cell.label)) {
        const slug = teamProfileSlug(summaryGroupFor(value).id);
        if (!teamSlugs || teamSlugs.has(slug)) fact.teamSlug = slug;
      }
      facts.push(fact);
    }

    const older = ordered[index - 1];
    const newer = ordered[index + 1];

    return {
      year: edition.year,
      yearSort: edition.yearSort,
      slug: editionSlug(edition.year),
      champion: edition.winner.trim(),
      host: edition.host?.trim() || undefined,
      facts,
      previous: older ? { slug: editionSlug(older.year), year: older.year } : undefined,
      next: newer ? { slug: editionSlug(newer.year), year: newer.year } : undefined,
    };
  });

  return profiles.reverse();
}

/**
 * `edition.year -> path` map for linking a tournament table's Year column
 * through to each edition's own page (`TournamentTable.astro`'s `yearLinks`
 * prop). `basePath` is the locale-correct competition path, e.g.
 * "/competitions/world-cup" or "/hr/competitions/world-cup". The values are
 * base-relative site paths; `TournamentTable` applies `withBase()` itself
 * when rendering, matching every other href on the site.
 */
export function buildEditionLinks(profiles: EditionProfile[], basePath: string): Map<string, string> {
  return new Map(profiles.map((profile) => [profile.year, `${basePath}/${profile.slug}`]));
}
