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

export type EditionNeighbour = {
  slug: string;
  year: string;
  /**
   * Set only when this neighbour's slug had to be disambiguated from another
   * edition sharing the same year (Copa América's two 1959 tournaments) -
   * the value that broke the tie (e.g. "Ecuador"), so a pager can show
   * "1959 (Ecuador)" instead of two indistinguishable "1959" links.
   */
  disambiguator?: string;
};

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
 * The composite key `buildEditionLinks()`/`TournamentTable.astro` use to
 * join a table row to its edition page. Most competitions have a unique
 * Year per row, so this reduces to the plain year; Copa América's two 1959
 * rows differ only by host, so the host (when present) is folded into the
 * key on both the producer (`buildEditionLinks`, keyed by
 * `EditionProfile.host`) and consumer (`TournamentTable`, keyed by
 * `Edition.host`) sides - they must stay in agreement, which is why this is
 * one shared function rather than two ad hoc string templates.
 */
export function editionLinkKey(year: string, host?: string): string {
  const trimmedHost = host?.trim();
  return trimmedHost ? `${year}::${trimmedHost}` : year;
}

/** URL-safe fragment for a host name, or undefined for an empty/missing one. */
function hostSlugPart(host: string | undefined): string | undefined {
  const slug = host
    ?.trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || undefined;
}

/**
 * Assign each edition a unique slug, disambiguating by host when two or more
 * editions share a year (e.g. Copa América 1959, played twice - once hosted
 * by Argentina, once by Ecuador - the base slug "1959" would otherwise
 * collide). Throws when a colliding group can't be told apart this way
 * (no host column, or the hosts themselves collide too) - the same
 * "never ship a silent data problem" guard this function always enforced,
 * just no longer triggered by every duplicate year, only genuinely
 * unresolvable ones.
 */
function assignEditionSlugs(ordered: Edition[]): Map<Edition, string> {
  const byBaseSlug = new Map<string, Edition[]>();
  for (const edition of ordered) {
    const base = editionSlug(edition.year);
    const group = byBaseSlug.get(base) ?? [];
    group.push(edition);
    byBaseSlug.set(base, group);
  }

  const slugs = new Map<Edition, string>();
  for (const [base, group] of byBaseSlug) {
    if (group.length === 1) {
      slugs.set(group[0], base);
      continue;
    }

    const disambiguated = group.map((edition) => {
      const hostPart = hostSlugPart(edition.host);
      return hostPart ? `${base}-${hostPart}` : undefined;
    });
    const resolvable =
      disambiguated.every((slug): slug is string => Boolean(slug)) &&
      new Set(disambiguated).size === disambiguated.length;

    if (!resolvable) {
      throw new Error(
        `Two editions produced the same edition slug: "${base}" (year "${group[0].year}").`,
      );
    }
    group.forEach((edition, index) => slugs.set(edition, disambiguated[index]!));
  }
  return slugs;
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
  const slugs = assignEditionSlugs(ordered);

  const neighbour = (edition: Edition): EditionNeighbour => {
    const slug = slugs.get(edition)!;
    const disambiguator = slug !== editionSlug(edition.year) ? edition.host?.trim() : undefined;
    return { slug, year: edition.year, disambiguator };
  };

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
      slug: slugs.get(edition)!,
      champion: edition.winner.trim(),
      host: edition.host?.trim() || undefined,
      facts,
      previous: older ? neighbour(older) : undefined,
      next: newer ? neighbour(newer) : undefined,
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
  return new Map(
    profiles.map((profile) => [editionLinkKey(profile.year, profile.host), `${basePath}/${profile.slug}`]),
  );
}
