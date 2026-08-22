// Structured data (schema.org JSON-LD) builders. Each one is a pure function
// over data every page already computes (ChampionSummary[], Edition[], the
// canonical URL) - see docs/PROJECT_STATUS.md's "Left for a future pass" note
// this implements. Every builder returns a plain object with its own
// "@context", rendered as its own <script type="application/ld+json"> tag by
// BaseLayout.astro, so pages can freely mix however many of these apply.
import { isPlaceholderWinner } from './editions';
import type { ChampionSummary, Edition } from './types';
import type { CountryRecord, Rivalry } from './compare';
import type { QuizQuestion } from './quiz';
import type { TeamProfile, TeamProfileCompetition } from './teamProfile';
import type { PlayerProfile, PlayerProfileAward } from './playerProfile';

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
 * /records' "Fiercest rivalries" ranking (buildRivalries() in compare.ts) as
 * an ItemList - the one ranking section on that page that shipped
 * (2026-08-20) without the ItemList every other /records ranking has had
 * since the 2026-08-15 SEO pass, closed here rather than left drifting
 * further. Each pair becomes one Thing named "Team A vs Team B", matching
 * the on-page table's own "Rivalry" column, with a description covering
 * meetings/head-to-head/competitions/most-recent - the exact facts that
 * column set already renders, no new computation. A `describe()` override
 * mirrors `buildCountryRecordsItemList()`'s own translation mechanism, for
 * the Croatian page's Croatian description text.
 */
function defaultRivalryDescription(rivalry: Rivalry): string {
  const { teamADisplayName, teamBDisplayName, meetings, teamAWins, teamBWins, competitions, mostRecent } =
    rivalry;
  return `${meetings} meeting${meetings === 1 ? '' : 's'} (${teamADisplayName} ${teamAWins}, ${teamBDisplayName} ${teamBWins}) across ${competitions.join(', ')}, most recently ${mostRecent.year} (${mostRecent.competition})`;
}

export function buildRivalriesItemList(
  rivalries: Rivalry[],
  options: {
    pageUrl: string;
    name: string;
    /** Overrides the per-pair description, e.g. for the Croatian page. Defaults to an English sentence. */
    describe?: (rivalry: Rivalry) => string;
  },
): JsonLdObject {
  const { pageUrl, name, describe = defaultRivalryDescription } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    itemListElement: rivalries.map((rivalry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: `${rivalry.teamADisplayName} vs ${rivalry.teamBDisplayName}`,
        description: describe(rivalry),
      },
    })),
  };
}

/**
 * A /teams/<slug> team profile page's per-competition final/semifinal
 * appearance list (buildTeamProfile() in teamProfile.ts) as an ItemList -
 * found missing entirely (2026-08-20) on a fresh audit: every one of the
 * site's other 80+ generated-ranking sections has had a matching ItemList
 * since the 2026-08-15/16 SEO passes, but the 80 team profile pages (40
 * teams x English/Croatian, added 2026-08-18) were built afterwards and
 * never wired one up - the exact "a same-day/later feature needs its own
 * explicit ItemList checklist pass" lesson the 2026-08-20 "Fiercest
 * rivalries" bug-fix entry already recorded, just not yet re-applied here.
 * One Thing per competition the team has actually reached a tracked final
 * or semifinal in (in the same order the page itself lists them), each
 * named after that competition with a description enumerating every
 * appearance's role and year - the exact two facts (year, role) the page's
 * own <ol> already renders per competition, no new computation and no
 * combined-totals figure invented beyond what's on the page.
 */
function defaultTeamProfileDescription(competition: TeamProfileCompetition): string {
  return competition.appearances.map((a) => `${a.role} (${a.year})`).join(', ');
}

export function buildTeamProfileItemList(
  profile: TeamProfile,
  options: {
    pageUrl: string;
    name: string;
    /** Overrides the per-competition description, e.g. for a translated page. Defaults to an English "Role (Year), ..." list. */
    describe?: (competition: TeamProfileCompetition) => string;
  },
): JsonLdObject {
  const { pageUrl, name, describe = defaultTeamProfileDescription } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    itemListElement: profile.competitions.map((competition, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: competition.title,
        description: describe(competition),
      },
    })),
  };
}

/**
 * A /players/<slug> player profile page's per-award appearance list
 * (buildPlayerProfile() in playerProfile.ts) as an ItemList - the individual-
 * award counterpart of buildTeamProfileItemList() above, closing the same
 * "a new generated-ranking page family shipped without its own ItemList" gap
 * that the team profile pages had until 2026-08-20. One Thing per award the
 * player has actually won (in the order the page lists them), named after
 * that award with a description enumerating each appearance's year and detail
 * (team/goals/ceremony date) - the exact facts the page's own <ol> already
 * renders per award, no new computation and no combined-total figure invented
 * beyond what's on the page. A `describe()` override mirrors the other
 * builders' translation mechanism for the Croatian page.
 */
function defaultPlayerProfileDescription(award: PlayerProfileAward): string {
  return award.appearances
    .map((a) => (a.detail ? `${a.year} (${a.detail})` : a.year))
    .join(', ');
}

export function buildPlayerProfileItemList(
  profile: PlayerProfile,
  options: {
    pageUrl: string;
    name: string;
    /** Overrides the per-award description, e.g. for a translated page. Defaults to an English "Year (detail), ..." list. */
    describe?: (award: PlayerProfileAward) => string;
  },
): JsonLdObject {
  const { pageUrl, name, describe = defaultPlayerProfileDescription } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    itemListElement: profile.awards.map((award, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: award.title,
        description: describe(award),
      },
    })),
  };
}

/**
 * The /players directory (an A-Z index of every Ballon d'Or/Golden Boot
 * winner, buildAllPlayerProfiles()) as an ItemList - the individual-award
 * counterpart of the /teams directory's buildCountryRecordsItemList() block,
 * so the directory index page carries structured data just like every profile
 * page it links to. One Thing per player, named after them with a description
 * of their combined award count - the exact figure the directory already
 * shows next to each name. A `describe()` override mirrors the other builders'
 * translation mechanism for the Croatian directory.
 */
function defaultPlayersDirectoryDescription(profile: PlayerProfile): string {
  return `${profile.totalAwards} award${profile.totalAwards === 1 ? '' : 's'} across the Men's Ballon d'Or and FIFA World Cup/UEFA EURO Golden Boot`;
}

export function buildPlayersDirectoryItemList(
  profiles: PlayerProfile[],
  options: {
    pageUrl: string;
    name: string;
    /** Overrides the per-player description, e.g. for the Croatian directory. Defaults to an English sentence. */
    describe?: (profile: PlayerProfile) => string;
  },
): JsonLdObject {
  const { pageUrl, name, describe = defaultPlayersDirectoryDescription } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    itemListElement: profiles.map((profile, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: profile.displayName,
        description: describe(profile),
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
 * The /glossary page's terms as a schema.org DefinedTermSet - one
 * DefinedTerm per entry, reusing the exact GlossaryEntry[] the page itself
 * renders (src/lib/glossary.ts's parseGlossaryEntries()), so the structured
 * data can never list a term the visible page doesn't also explain.
 */
export function buildDefinedTermSet(
  entries: { term: string; definition: string }[],
  options: { pageUrl: string; name: string },
): JsonLdObject {
  const { pageUrl, name } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name,
    url: pageUrl,
    hasDefinedTerm: entries.map((entry) => ({
      '@type': 'DefinedTerm',
      name: entry.term,
      description: entry.definition,
      inDefinedTermSet: pageUrl,
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
