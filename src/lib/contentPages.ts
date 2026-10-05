import { getEntry } from 'astro:content';
import { NAV_LINKS } from './routes';
import { loadTeamCompetitions } from './teamCompetitions';
import { loadCompetition } from './competition';
import { buildEditionProfiles, editionSlug, type EditionProfile } from './editionProfile';
import type { Edition } from './types';
import type { Locale } from './i18n';
import type { FeedEntry } from './feed';

// path -> content collection id, for every top-level page whose title/
// description comes straight from a content/*.md file (see
// docs/ADDING_CONTENT.md section 7). Shared by sitemap.xml.ts (reads
// lastReviewed for <lastmod>) and loadFeedEntries() below (reads title/
// description/lastReviewed for an <entry>) so the two can't drift apart from
// each other - each entry mirrors the loadCompetition/loadPageMeta id each
// page already calls, so this can't drift from what a page actually shows
// without also breaking that page's own build.
export const CONTENT_ID_BY_PATH: Record<string, string> = {
  '/': 'index',
  '/competitions/world-cup': 'fifa-world-cup',
  '/competitions/euro': 'uefa-euro',
  '/competitions/nations-league': 'uefa-nations-league',
  '/competitions/copa-america': 'copa-america',
  '/competitions/ballon-dor': 'ballon-dor',
  '/competitions/golden-boot': 'golden-boot',
  '/records': 'records-and-timelines',
  '/compare': 'compare-countries',
  '/teams': 'teams',
  '/players': 'players',
  '/compare-players': 'compare-players',
  '/quiz': 'quiz',
  '/glossary': 'glossary',
  '/about/sources': 'about-sources',
};

/** The latest (lexicographically, since every date is ISO YYYY-MM-DD) of a list of optional dates, or undefined if none are set. */
export function maxLastReviewed(dates: (string | undefined)[]): string | undefined {
  const defined = dates.filter((value): value is string => Boolean(value));
  return defined.length > 0 ? [...defined].sort().at(-1) : undefined;
}

/**
 * Five of the fifteen CONTENT_ID_BY_PATH pages aren't independently-reviewed
 * content in their own right - they're generated, cross-competition
 * summaries (src/pages/records.astro, compare.astro, compare-players.astro,
 * teams/index.astro, players/index.astro) whose own `lastReviewed` constant
 * is computed as the latest date across every competition/award they draw
 * from (and, for four of the five, their own content/*.md file too) - NOT
 * simply their own content entry's `lastReviewed`, the value every other
 * page in CONTENT_ID_BY_PATH can just read directly.
 *
 * Before this existed, sitemap.xml.ts's <lastmod> and feed.xml.ts's
 * <updated> for these five paths both silently used the single content
 * entry's own (older, sometimes much older) date instead - understating how
 * fresh the page actually is to search engines and feed readers alike.
 * Caught by scripts/check-feed.mjs's cross-check against each page's own
 * built og:updated_time. Centralized here, as one pure function taking the
 * already-loaded competition dates a caller needs anyway (sitemap.xml.ts for
 * its per-team/per-player/per-edition loops, loadFeedEntries() below for its
 * own entries), so both call sites use the exact same formula as each
 * page's own .astro file rather than two independent, driftable copies of
 * it.
 */
export function derivedPageLastReviewed(
  path: string,
  teamCompetitionDates: (string | undefined)[],
  awardDates: (string | undefined)[],
  ownDate: string | undefined,
): string | undefined {
  switch (path) {
    case '/teams':
    case '/compare':
      return maxLastReviewed([...teamCompetitionDates, ownDate]);
    case '/players':
    case '/compare-players':
      return maxLastReviewed([...awardDates, ownDate]);
    case '/records':
      // records.astro's own `lastReviewed` draws from every team competition
      // and award, but (unlike the four cases above) never concats its own
      // content entry's date - matched exactly here.
      return maxLastReviewed([...teamCompetitionDates, ...awardDates]);
    default:
      return ownDate;
  }
}

async function loadDerivedPageSources() {
  const { worldCup, euro, copaAmerica, nationsLeague } = await loadTeamCompetitions();
  const [ballonDor, worldCupGoldenBoot, euroGoldenBoot] = await Promise.all([
    loadCompetition('ballon-dor', { editionsHeading: 'Winners', sourcesHeading: "Ballon d'Or" }),
    loadCompetition('golden-boot', {
      editionsHeading: 'FIFA World Cup top scorers',
      sourcesHeading: 'FIFA World Cup',
    }),
    loadCompetition('golden-boot', {
      editionsHeading: 'UEFA EURO top scorers',
      sourcesHeading: 'UEFA EURO',
    }),
  ]);
  return {
    worldCup,
    euro,
    copaAmerica,
    nationsLeague,
    ballonDor,
    worldCupGoldenBoot,
    euroGoldenBoot,
    teamCompetitionDates: [worldCup, euro, copaAmerica, nationsLeague].map((c) => c.lastReviewed),
    awardDates: [ballonDor, worldCupGoldenBoot, euroGoldenBoot].map((c) => c.lastReviewed),
  };
}

/**
 * One competition/award family's newest-edition feed entry, described
 * declaratively so `loadFeedEntries()` below can build all seven (one per
 * `/competitions/<slug>/<year>` route tree sitemap.xml.ts's own per-edition
 * loops enumerate) from one shared builder rather than seven near-identical
 * blocks of inline logic.
 */
export type EditionFeedFamily = {
  /** This family's edition-page base path, e.g. '/competitions/world-cup' (see sitemap.xml.ts's matching per-edition loop). */
  pathPrefix: string;
  /** The competition-level `lastReviewed` every edition of this family shares (no per-edition date exists - see docs/PROJECT_STATUS.md's two-hundred-and-thirty-first-run entry). */
  lastReviewed: string;
  editions: Edition[];
  /** Builds the exact title string this family's own `[year].astro` renders, so the feed never drifts from the real page title. */
  titleEn: (profile: EditionProfile) => string;
  titleHr: (profile: EditionProfile) => string;
};

/**
 * One feed entry for a family's newest edition (`buildEditionProfiles()`
 * returns newest-first, so the first element is always it), or undefined
 * when the family has no editions - never happens for the six real families
 * `loadFeedEntries()` passes, but keeps this function total rather than
 * assuming its input.
 */
export function buildEditionFeedEntry(family: EditionFeedFamily, locale: Locale): FeedEntry | undefined {
  const [profile] = buildEditionProfiles(family.editions);
  if (!profile) return undefined;
  return {
    path: `${family.pathPrefix}/${profile.slug}`,
    title: locale === 'hr' ? family.titleHr(profile) : family.titleEn(profile),
    summary: locale === 'hr' || !profile.champion ? undefined : `${profile.champion} champion.`,
    updated: family.lastReviewed,
  };
}

/** Copa América's own `[year].astro`/`hr/[year].astro` year label, which appends the host only for the two slugs `assignEditionSlugs()` had to disambiguate (1959's two editions) - replicated here so the feed title can never drift from the real page title. */
export function copaAmericaYearLabel(profile: EditionProfile): string {
  const isDisambiguated = profile.slug !== editionSlug(profile.year);
  return isDisambiguated && profile.host ? `${profile.year} (${profile.host})` : profile.year;
}

// Shared by src/pages/feed.xml.ts and src/pages/hr/feed.xml.ts (the same
// split src/pages/hr/manifest.webmanifest.ts's own doc comment explains: one
// builder function parameterized by locale, called from each locale's own
// route file). English reads title/description straight from the content
// collection (the one place that text is written); Croatian has no parallel
// per-page content collection (its page titles are literal strings in each
// src/pages/hr/*.astro file, not editorial data with its own schema) so it
// reuses NAV_LINKS' own short `labelHr` as the entry title and carries no
// summary, rather than inventing a second, driftable copy of each page's
// Croatian title just for this feed.
export async function loadFeedEntries(locale: Locale): Promise<FeedEntry[]> {
  const {
    teamCompetitionDates,
    awardDates,
    worldCup,
    euro,
    copaAmerica,
    nationsLeague,
    ballonDor,
    worldCupGoldenBoot,
    euroGoldenBoot,
  } = await loadDerivedPageSources();
  const entries: FeedEntry[] = [];
  for (const { path, labelHr } of NAV_LINKS) {
    const contentId = CONTENT_ID_BY_PATH[path];
    if (!contentId) continue;
    const contentEntry = await getEntry('pages', contentId);
    if (!contentEntry) continue;
    const updated = derivedPageLastReviewed(
      path,
      teamCompetitionDates,
      awardDates,
      contentEntry.data.lastReviewed,
    );
    if (!updated) continue;
    entries.push({
      path,
      title: locale === 'hr' ? labelHr : contentEntry.data.title,
      summary: locale === 'hr' ? undefined : contentEntry.data.description,
      updated,
    });
  }

  // The newest edition of each of the seven edition-page route trees
  // (sitemap.xml.ts's own per-edition loops enumerate every edition; a new
  // tournament/award result is arguably the single most "feed-worthy" kind
  // of update this site ever publishes, so this surfaces just the latest one
  // per family rather than every edition - which would make the feed mostly
  // noise, the same reasoning src/pages/feed.xml.ts's own doc comment
  // already gives for excluding edition pages from the main NAV_LINKS loop
  // above entirely). See docs/PROJECT_STATUS.md's two-hundred-and-thirty-
  // first-run entry ("Left for a future pass").
  const editionFamilies: EditionFeedFamily[] = [
    {
      pathPrefix: '/competitions/world-cup',
      lastReviewed: worldCup.lastReviewed,
      editions: worldCup.editions,
      titleEn: (profile) => `${profile.year} FIFA World Cup`,
      titleHr: (profile) => `FIFA Svjetsko prvenstvo ${profile.year}.`,
    },
    {
      pathPrefix: '/competitions/euro',
      lastReviewed: euro.lastReviewed,
      editions: euro.editions,
      titleEn: (profile) => `${profile.year} UEFA European Championship`,
      titleHr: (profile) => `UEFA Europsko prvenstvo ${profile.year}.`,
    },
    {
      pathPrefix: '/competitions/nations-league',
      lastReviewed: nationsLeague.lastReviewed,
      editions: nationsLeague.editions,
      titleEn: (profile) => `${profile.year} UEFA Nations League Finals`,
      titleHr: (profile) => `Final Four UEFA Lige nacija ${profile.year}.`,
    },
    {
      pathPrefix: '/competitions/copa-america',
      lastReviewed: copaAmerica.lastReviewed,
      editions: copaAmerica.editions,
      titleEn: (profile) => `${copaAmericaYearLabel(profile)} Copa América`,
      titleHr: (profile) => `Copa América ${copaAmericaYearLabel(profile)}`,
    },
    {
      pathPrefix: '/competitions/ballon-dor',
      lastReviewed: ballonDor.lastReviewed,
      editions: ballonDor.editions,
      titleEn: (profile) => `${profile.year} Men's Ballon d'Or`,
      titleHr: (profile) => `Zlatna lopta ${profile.year}.`,
    },
    {
      pathPrefix: '/competitions/golden-boot/world-cup',
      lastReviewed: worldCupGoldenBoot.lastReviewed,
      editions: worldCupGoldenBoot.editions,
      titleEn: (profile) => `${profile.year} FIFA World Cup Golden Boot`,
      titleHr: (profile) => `Zlatna kopačka Svjetskog prvenstva ${profile.year}.`,
    },
    {
      pathPrefix: '/competitions/golden-boot/euro',
      lastReviewed: euroGoldenBoot.lastReviewed,
      editions: euroGoldenBoot.editions,
      titleEn: (profile) => `${profile.year} UEFA EURO Golden Boot`,
      titleHr: (profile) => `Zlatna kopačka EURA ${profile.year}.`,
    },
  ];
  for (const family of editionFamilies) {
    const entry = buildEditionFeedEntry(family, locale);
    if (entry) entries.push(entry);
  }

  return entries;
}
