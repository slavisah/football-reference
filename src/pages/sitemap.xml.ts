import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { NAV_LINKS } from '../lib/routes';
import { TRANSLATED_PATHS } from '../lib/i18n';
import { withBase } from '../lib/url';
import { buildAllCountryRecords } from '../lib/compare';
import { loadTeamCompetitions } from '../lib/teamCompetitions';
import { teamProfileSlug } from '../lib/teamProfile';
import { loadCompetition } from '../lib/competition';
import { buildAllPlayerProfiles, playerProfileSlug, type PlayerAwardSource } from '../lib/playerProfile';
import { buildEditionProfiles } from '../lib/editionProfile';
import { CONTENT_ID_BY_PATH, derivedPageLastReviewed } from '../lib/contentPages';

export const prerender = true;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Every bilingual <url> block below needs the same three reciprocal
// xhtml:link alternates: "en", "hr", and "x-default" (Google's hreflang
// guidance for a reader whose browser locale matches neither - it should
// resolve to this site's primary language rather than leaving search
// engines to guess, the same x-default BaseLayout.astro's own per-page
// <head> tags now carry). Centralized here so all eight call sites below
// stay in lock step rather than each re-typing the same three-tag string.
function buildAltLinks(enPath: string, hrPath: string, absolute: (path: string) => string): string {
  return [
    `<xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(absolute(enPath))}" />`,
    `<xhtml:link rel="alternate" hreflang="hr" href="${xmlEscape(absolute(hrPath))}" />`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absolute(enPath))}" />`,
  ].join('');
}

// A sitemap generated at build time, one <url> per locale of every live page,
// each carrying an xhtml:link back to its translation - so it stays in lock
// step with NAV_LINKS/TRANSLATED_PATHS (src/lib/routes.ts, src/lib/i18n.ts)
// the same way the nav and the offline precache list already do, rather than
// being a hand-maintained list that can silently go stale.
export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? url;
  // NAV_LINKS/TRANSLATED_PATHS paths (e.g. "/competitions/world-cup") don't
  // carry a trailing slash, but every live page here is a directory-format
  // route (astro.config.mjs's `build.format: 'directory'`) and is actually
  // served/canonicalized with one - BaseLayout.astro's own canonicalURL
  // normalizes to match. Without the same normalization here, every <loc>/
  // <xhtml:link> this route emitted disagreed with the real page's own
  // canonical URL - caught by scripts/check-sitemap.mjs, which cross-checks
  // this file's output against every built page's actual <head>.
  const absolute = (path: string) => {
    const withSlash = path.endsWith('/') ? path : `${path}/`;
    return new URL(withBase(withSlash), origin).toString();
  };

  // Loaded up front (rather than where each loop that primarily needs them
  // for other reasons first appears, as before) because the main NAV_LINKS
  // loop below now also needs these same competitions' dates - see
  // derivedPageLastReviewed()'s own doc comment in contentPages.ts for why
  // five of the pages that loop covers can't just read their own content
  // entry's `lastReviewed` the way every other page there does.
  const { worldCup, euro, copaAmerica, nationsLeague, competitions } = await loadTeamCompetitions();
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
  const teamCompetitionDates = [worldCup, euro, copaAmerica, nationsLeague].map((c) => c.lastReviewed);
  const awardDates = [ballonDor, worldCupGoldenBoot, euroGoldenBoot].map((c) => c.lastReviewed);

  const urlEntries: string[] = [];

  for (const { path: enPath } of NAV_LINKS) {
    const hrPath = TRANSLATED_PATHS[enPath];
    const contentId = CONTENT_ID_BY_PATH[enPath];
    const entry = contentId ? await getEntry('pages', contentId) : undefined;
    const lastmod = derivedPageLastReviewed(enPath, teamCompetitionDates, awardDates, entry?.data.lastReviewed);

    const locales: { path: string; lang: 'en' | 'hr' }[] = hrPath
      ? [
          { path: enPath, lang: 'en' },
          { path: hrPath, lang: 'hr' },
        ]
      : [{ path: enPath, lang: 'en' }];

    for (const { path } of locales) {
      const loc = absolute(path);
      const altLinks = hrPath ? buildAltLinks(enPath, hrPath, absolute) : '';
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      urlEntries.push(`<url><loc>${xmlEscape(loc)}</loc>${lastmodTag}${altLinks}</url>`);
    }
  }

  // The /teams directory's index page (src/pages/teams/index.astro and its
  // Croatian sibling) is now a normal NAV_LINKS/TRANSLATED_PATHS entry and
  // is covered by the loop above. Its 40 per-team profile pages
  // (src/pages/teams/[slug].astro) aren't page-content-collection entries
  // with a single id the CONTENT_ID_BY_PATH map could name, so they still
  // need their own loop here - now emitting both languages per team with
  // reciprocal hreflang alternates, the same shape the main loop already
  // gives every other bilingual page. Reuses the same derivedPageLastReviewed('/teams', ...)
  // value the main loop above just gave the /teams NAV_LINKS entry itself,
  // rather than a second, narrower computation that (before this fix) left
  // out the 'teams' content entry's own date.
  const teamsEntry = await getEntry('pages', 'teams');
  const teamsLastmod = derivedPageLastReviewed('/teams', teamCompetitionDates, awardDates, teamsEntry?.data.lastReviewed);
  const lastmodTag = teamsLastmod ? `<lastmod>${teamsLastmod}</lastmod>` : '';
  for (const record of buildAllCountryRecords(competitions)) {
    const slug = teamProfileSlug(record.id);
    const enPath = `/teams/${slug}`;
    const hrPath = `/hr/teams/${slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(enPath))}</loc>${lastmodTag}${altLinks}</url>`);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(hrPath))}</loc>${lastmodTag}${altLinks}</url>`);
  }

  // The /players directory index page (src/pages/players/index.astro and its
  // Croatian sibling) is now a normal NAV_LINKS/TRANSLATED_PATHS entry and is
  // covered by the main loop above. Its per-player profile pages
  // (src/pages/players/[slug].astro and /hr/players/[slug].astro) aren't
  // page-content-collection entries with a single id CONTENT_ID_BY_PATH could
  // name, so they still need their own loop here - now emitting both languages
  // per player with reciprocal hreflang alternates, the same shape the /teams
  // per-team loop above already uses.
  const playerSources: PlayerAwardSource[] = [
    { title: "Ballon d'Or", slug: 'ballon-dor', editions: ballonDor.editions },
    { title: 'FIFA World Cup Golden Boot', slug: 'golden-boot', editions: worldCupGoldenBoot.editions },
    { title: 'UEFA EURO Golden Boot', slug: 'golden-boot', editions: euroGoldenBoot.editions },
  ];
  const playerProfiles = buildAllPlayerProfiles(playerSources);
  const playersEntry = await getEntry('pages', 'players');
  const playersLastmod = derivedPageLastReviewed(
    '/players',
    teamCompetitionDates,
    awardDates,
    playersEntry?.data.lastReviewed,
  );
  const playersLastmodTag = playersLastmod ? `<lastmod>${playersLastmod}</lastmod>` : '';
  for (const profile of playerProfiles) {
    const slug = playerProfileSlug(profile.id);
    const enPath = `/players/${slug}`;
    const hrPath = `/hr/players/${slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(enPath))}</loc>${playersLastmodTag}${altLinks}</url>`);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(hrPath))}</loc>${playersLastmodTag}${altLinks}</url>`);
  }

  // Per-edition pages (src/pages/competitions/world-cup/[year].astro and its
  // Croatian sibling) - one page per FIFA World Cup edition, each bilingual
  // with reciprocal hreflang alternates, the same shape the per-team and
  // per-player loops above use. Like those, these aren't page-content-
  // collection entries with a single id CONTENT_ID_BY_PATH could name, so
  // they need their own loop here rather than the NAV_LINKS one.
  const worldCupEditionLastmodTag = worldCup.lastReviewed
    ? `<lastmod>${worldCup.lastReviewed}</lastmod>`
    : '';
  for (const profile of buildEditionProfiles(worldCup.editions)) {
    const enPath = `/competitions/world-cup/${profile.slug}`;
    const hrPath = `/hr/competitions/world-cup/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(enPath))}</loc>${worldCupEditionLastmodTag}${altLinks}</url>`);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(hrPath))}</loc>${worldCupEditionLastmodTag}${altLinks}</url>`);
  }

  // Per-edition pages for Copa América (src/pages/competitions/copa-america/
  // [year].astro and its Croatian sibling), same shape as the FIFA World Cup
  // loop above. `buildEditionProfiles()` disambiguates the two 1959 editions
  // by host, so this naturally emits both "1959-argentina" and
  // "1959-ecuador" as their own distinct URLs rather than colliding.
  const copaAmericaEditionLastmodTag = copaAmerica.lastReviewed
    ? `<lastmod>${copaAmerica.lastReviewed}</lastmod>`
    : '';
  for (const profile of buildEditionProfiles(copaAmerica.editions)) {
    const enPath = `/competitions/copa-america/${profile.slug}`;
    const hrPath = `/hr/competitions/copa-america/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(enPath))}</loc>${copaAmericaEditionLastmodTag}${altLinks}</url>`);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(hrPath))}</loc>${copaAmericaEditionLastmodTag}${altLinks}</url>`);
  }

  // Per-edition pages for EURO (src/pages/competitions/euro/[year].astro and
  // its Croatian sibling), same shape as the FIFA World Cup loop above -
  // EURO has unique Year labels per edition, so no disambiguation is needed.
  const euroEditionLastmodTag = euro.lastReviewed ? `<lastmod>${euro.lastReviewed}</lastmod>` : '';
  for (const profile of buildEditionProfiles(euro.editions)) {
    const enPath = `/competitions/euro/${profile.slug}`;
    const hrPath = `/hr/competitions/euro/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(enPath))}</loc>${euroEditionLastmodTag}${altLinks}</url>`);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(hrPath))}</loc>${euroEditionLastmodTag}${altLinks}</url>`);
  }

  // Per-edition pages for the UEFA Nations League Finals
  // (src/pages/competitions/nations-league/[year].astro and its Croatian
  // sibling), same shape as the loops above - unique Season labels per
  // edition, so no disambiguation is needed either.
  const nationsLeagueEditionLastmodTag = nationsLeague.lastReviewed
    ? `<lastmod>${nationsLeague.lastReviewed}</lastmod>`
    : '';
  for (const profile of buildEditionProfiles(nationsLeague.editions)) {
    const enPath = `/competitions/nations-league/${profile.slug}`;
    const hrPath = `/hr/competitions/nations-league/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(enPath))}</loc>${nationsLeagueEditionLastmodTag}${altLinks}</url>`,
    );
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(hrPath))}</loc>${nationsLeagueEditionLastmodTag}${altLinks}</url>`,
    );
  }

  // Per-edition pages for the Men's Ballon d'Or
  // (src/pages/competitions/ballon-dor/[year].astro and its Croatian
  // sibling) - the first individual-award edition pages, so
  // `buildEditionProfiles()` is called with its `individualAward` option
  // (see src/lib/editionProfile.ts) rather than the plain team-competition
  // form the loops above use. `playerProfiles` (built just above for the
  // /players/ loop) already names every slug that has a `/players/` page.
  const playerSlugs = new Set(playerProfiles.map((profile) => playerProfileSlug(profile.id)));
  const ballonDorEditionLastmodTag = ballonDor.lastReviewed
    ? `<lastmod>${ballonDor.lastReviewed}</lastmod>`
    : '';
  for (const profile of buildEditionProfiles(ballonDor.editions, undefined, { playerSlugs })) {
    const enPath = `/competitions/ballon-dor/${profile.slug}`;
    const hrPath = `/hr/competitions/ballon-dor/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(enPath))}</loc>${ballonDorEditionLastmodTag}${altLinks}</url>`,
    );
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(hrPath))}</loc>${ballonDorEditionLastmodTag}${altLinks}</url>`,
    );
  }

  // Per-edition pages for the Golden Boot (src/pages/competitions/golden-boot/
  // world-cup/[year].astro, .../euro/[year].astro and their Croatian
  // siblings) - the last competition on the site to get edition pages.
  // Golden Boot's one content file holds two tables sharing years (World
  // Cup, EURO), so - unlike every other individualAward competition above -
  // it gets two separate `buildEditionProfiles()` calls and two route trees
  // rather than one, reusing the same `worldCupGoldenBoot`/`euroGoldenBoot`
  // loads and `playerSlugs` set already built for the /players/ loop above.
  const worldCupGoldenBootLastmodTag = worldCupGoldenBoot.lastReviewed
    ? `<lastmod>${worldCupGoldenBoot.lastReviewed}</lastmod>`
    : '';
  for (const profile of buildEditionProfiles(worldCupGoldenBoot.editions, undefined, { playerSlugs })) {
    const enPath = `/competitions/golden-boot/world-cup/${profile.slug}`;
    const hrPath = `/hr/competitions/golden-boot/world-cup/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(enPath))}</loc>${worldCupGoldenBootLastmodTag}${altLinks}</url>`,
    );
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(hrPath))}</loc>${worldCupGoldenBootLastmodTag}${altLinks}</url>`,
    );
  }

  const euroGoldenBootLastmodTag = euroGoldenBoot.lastReviewed
    ? `<lastmod>${euroGoldenBoot.lastReviewed}</lastmod>`
    : '';
  for (const profile of buildEditionProfiles(euroGoldenBoot.editions, undefined, { playerSlugs })) {
    const enPath = `/competitions/golden-boot/euro/${profile.slug}`;
    const hrPath = `/hr/competitions/golden-boot/euro/${profile.slug}`;
    const altLinks = buildAltLinks(enPath, hrPath, absolute);
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(enPath))}</loc>${euroGoldenBootLastmodTag}${altLinks}</url>`,
    );
    urlEntries.push(
      `<url><loc>${xmlEscape(absolute(hrPath))}</loc>${euroGoldenBootLastmodTag}${altLinks}</url>`,
    );
  }

  const xml =`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
