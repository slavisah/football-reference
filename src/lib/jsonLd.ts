// Structured data (schema.org JSON-LD) builders. Each one is a pure function
// over data every page already computes (ChampionSummary[], Edition[], the
// canonical URL) - see docs/PROJECT_STATUS.md's "Left for a future pass" note
// this implements. Every builder returns a plain object with its own
// "@context", rendered as its own <script type="application/ld+json"> tag by
// BaseLayout.astro, so pages can freely mix however many of these apply.
import { isPlaceholderWinner } from './editions';
import type { ChampionSummary, Edition } from './types';

export type JsonLdObject = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  /** Absolute URL. */
  url: string;
};

/** A "Home > Page" trail, shown by search engines instead of a bare URL. */
export function buildBreadcrumbList(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * A generated champions/awards ranking as an ItemList - the same generic shape
 * works for a team competition (World Cup) and an individual award (Ballon
 * d'Or), which is exactly the "per-competition-type schema shape" the earlier
 * SEO pass deferred: ItemList doesn't need a different shape per type. Reuses
 * the exact ChampionSummary[] already generated for the on-page
 * ChampionsSummary component - no recomputation, no new facts.
 */
export function buildChampionsItemList(
  champions: ChampionSummary[],
  options: { pageUrl: string; name: string; unit?: [string, string] },
): JsonLdObject {
  const { pageUrl, name, unit = ['title', 'titles'] } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    itemListElement: champions.map((champion, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: champion.displayName,
        description: `${champion.titles} ${champion.titles === 1 ? unit[0] : unit[1]} (${champion.years.join(', ')})`,
      },
    })),
  };
}

/**
 * The most recently completed edition as a SportsEvent, e.g. "2026 FIFA World
 * Cup" with its host and champion - the one edition a search engine is most
 * likely to be asked about. Uses only fields already in the Editions table
 * (year, host, winner); no calendar date beyond the year is invented, since
 * none is in the editorial source. Returns undefined when there is no edition
 * with a usable year (defensive; every live competition has at least one).
 */
export function buildLatestEditionSportsEvent(
  editions: Edition[],
  competitionName: string,
): JsonLdObject | undefined {
  const withYear = editions.filter((edition) => Number.isFinite(edition.yearSort));
  if (withYear.length === 0) return undefined;

  const latest = withYear.reduce((a, b) => (b.yearSort > a.yearSort ? b : a));
  const event: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${latest.year} ${competitionName}`,
    startDate: String(latest.yearSort),
    sport: 'Football',
  };
  if (latest.host) {
    event.location = { '@type': 'Place', name: latest.host };
  }
  if (latest.winner.trim() && !isPlaceholderWinner(latest.winner)) {
    event.competitor = { '@type': 'SportsTeam', name: latest.winner.trim() };
  }
  return event;
}
