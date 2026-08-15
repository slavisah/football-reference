// Structured data (schema.org JSON-LD) builders. Each one is a pure function
// over data every page already computes (ChampionSummary[], Edition[], the
// canonical URL) - see docs/PROJECT_STATUS.md's "Left for a future pass" note
// this implements. Every builder returns a plain object with its own
// "@context", rendered as its own <script type="application/ld+json"> tag by
// BaseLayout.astro, so pages can freely mix however many of these apply.
import { isPlaceholderWinner } from './editions';
import type { ChampionSummary, Edition } from './types';
import type { CountryRecord } from './compare';
import type { QuizQuestion } from './quiz';

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

/**
 * The /compare page's "All national teams" ranking (already sorted by
 * `buildAllCountryRecords()`) as an ItemList - the shape schema.org tooling
 * expects for any ranked list, same as `buildChampionsItemList()` above, but
 * over `CountryRecord`'s combined-titles/runner-ups/finals shape instead of a
 * single competition's `ChampionSummary[]`, since /compare aggregates across
 * four competitions per team rather than reporting one competition's titles.
 * Every count reused here is the exact number already rendered in the page's
 * own "All national teams" table - no recomputation, no new facts.
 */
function defaultCountryRecordDescription(record: CountryRecord): string {
  const { totalTitles, totalRunnerUps, totalFinals } = record;
  return `${totalTitles} title${totalTitles === 1 ? '' : 's'}, ${totalRunnerUps} runner-up finish${totalRunnerUps === 1 ? '' : 'es'}, ${totalFinals} final${totalFinals === 1 ? '' : 's'} reached across the World Cup, EURO, Copa América and Nations League`;
}

export function buildCountryRecordsItemList(
  records: CountryRecord[],
  options: {
    pageUrl: string;
    name: string;
    /** Overrides the per-team description, e.g. for a translated page. Defaults to an English sentence. */
    describe?: (record: CountryRecord) => string;
  },
): JsonLdObject {
  const { pageUrl, name, describe = defaultCountryRecordDescription } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    itemListElement: records.map((record, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: record.displayName,
        description: describe(record),
      },
    })),
  };
}

/**
 * The /quiz page's generated multiple-choice questions as a schema.org Quiz
 * (a LearningResource subtype) - `hasPart` is a list of `Question`s, each
 * with its correct choice as an `acceptedAnswer`. Every prompt/answer pair
 * reused here is exactly what QuizCard.astro already renders for that
 * question - no new trivia, no recomputation. Deliberately scoped to the
 * multiple-choice `questions` pool only: the separate "put them in
 * chronological order" ranking questions (QuizOrderCard.astro) are a
 * different question shape schema.org has no equivalent property for, so
 * folding them in here would misrepresent the format rather than describe it
 * accurately.
 */
export function buildQuizJsonLd(
  questions: QuizQuestion[],
  options: { pageUrl: string; name: string },
): JsonLdObject {
  const { pageUrl, name } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name,
    url: pageUrl,
    about: 'Football history',
    hasPart: questions.map((question) => ({
      '@type': 'Question',
      name: question.prompt,
      acceptedAnswer: {
        '@type': 'Answer',
        text: question.choices[question.answerIndex],
      },
    })),
  };
}

/**
 * The site itself as a schema.org WebSite - the one page-independent fact
 * every other builder in this file deliberately doesn't cover, and the only
 * page that had zero JSON-LD at all (see the "home page has no JSON-LD" test
 * this replaces in tests/e2e/mobile.spec.ts; BaseLayout.astro's automatic
 * BreadcrumbList is skipped there too, since "Home" has no parent to link
 * to). `inLanguage` is a BCP 47 tag ('en' or 'hr'), matching the same two
 * values already used for `<html lang>` in BaseLayout.astro. No
 * `potentialAction`/`SearchAction` is included - the site has no search
 * feature, and inventing one here would misrepresent a capability that
 * doesn't exist.
 */
export function buildWebSiteJsonLd(options: {
  url: string;
  name: string;
  description: string;
  inLanguage: string;
}): JsonLdObject {
  const { url, name, description, inLanguage } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    inLanguage,
  };
}
