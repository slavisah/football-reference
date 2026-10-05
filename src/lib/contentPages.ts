import { getEntry } from 'astro:content';
import { NAV_LINKS } from './routes';
import { loadTeamCompetitions } from './teamCompetitions';
import { loadCompetition } from './competition';
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
    teamCompetitionDates: [worldCup, euro, copaAmerica, nationsLeague].map((c) => c.lastReviewed),
    awardDates: [ballonDor, worldCupGoldenBoot, euroGoldenBoot].map((c) => c.lastReviewed),
  };
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
  const { teamCompetitionDates, awardDates } = await loadDerivedPageSources();
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
  return entries;
}
