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

export const prerender = true;

// path -> content collection id, purely to read `lastReviewed` for <lastmod>.
// Every entry mirrors the loadCompetition/loadPageMeta id each page already
// calls (see docs/ADDING_CONTENT.md section 7), so this can't drift from what
// a page actually shows without also breaking that page's own build.
const CONTENT_ID_BY_PATH: Record<string, string> = {
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
  '/quiz': 'quiz',
  '/about/sources': 'about-sources',
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  const urlEntries: string[] = [];

  for (const { path: enPath } of NAV_LINKS) {
    const hrPath = TRANSLATED_PATHS[enPath];
    const contentId = CONTENT_ID_BY_PATH[enPath];
    const entry = contentId ? await getEntry('pages', contentId) : undefined;
    const lastmod = entry?.data.lastReviewed;

    const locales: { path: string; lang: 'en' | 'hr' }[] = hrPath
      ? [
          { path: enPath, lang: 'en' },
          { path: hrPath, lang: 'hr' },
        ]
      : [{ path: enPath, lang: 'en' }];

    for (const { path } of locales) {
      const loc = absolute(path);
      const altLinks = hrPath
        ? [
            `<xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(absolute(enPath))}" />`,
            `<xhtml:link rel="alternate" hreflang="hr" href="${xmlEscape(absolute(hrPath))}" />`,
          ].join('')
        : '';
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
  // gives every other bilingual page.
  const { worldCup, euro, copaAmerica, nationsLeague, competitions } = await loadTeamCompetitions();
  const teamsLastmod = [worldCup, euro, copaAmerica, nationsLeague]
    .map((c) => c.lastReviewed)
    .sort()
    .at(-1);
  const lastmodTag = teamsLastmod ? `<lastmod>${teamsLastmod}</lastmod>` : '';
  for (const record of buildAllCountryRecords(competitions)) {
    const slug = teamProfileSlug(record.id);
    const enPath = `/teams/${slug}`;
    const hrPath = `/hr/teams/${slug}`;
    const altLinks = [
      `<xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(absolute(enPath))}" />`,
      `<xhtml:link rel="alternate" hreflang="hr" href="${xmlEscape(absolute(hrPath))}" />`,
    ].join('');
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
  // per-team loop below already uses.
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
  const playerSources: PlayerAwardSource[] = [
    { title: "Ballon d'Or", slug: 'ballon-dor', editions: ballonDor.editions },
    { title: 'FIFA World Cup Golden Boot', slug: 'golden-boot', editions: worldCupGoldenBoot.editions },
    { title: 'UEFA EURO Golden Boot', slug: 'golden-boot', editions: euroGoldenBoot.editions },
  ];
  const playersEntry = await getEntry('pages', 'players');
  const playersLastmod = [
    ballonDor.lastReviewed,
    worldCupGoldenBoot.lastReviewed,
    euroGoldenBoot.lastReviewed,
    playersEntry?.data.lastReviewed,
  ]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const playersLastmodTag = playersLastmod ? `<lastmod>${playersLastmod}</lastmod>` : '';
  for (const profile of buildAllPlayerProfiles(playerSources)) {
    const slug = playerProfileSlug(profile.id);
    const enPath = `/players/${slug}`;
    const hrPath = `/hr/players/${slug}`;
    const altLinks = [
      `<xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(absolute(enPath))}" />`,
      `<xhtml:link rel="alternate" hreflang="hr" href="${xmlEscape(absolute(hrPath))}" />`,
    ].join('');
    urlEntries.push(`<url><loc>${xmlEscape(absolute(enPath))}</loc>${playersLastmodTag}${altLinks}</url>`);
    urlEntries.push(`<url><loc>${xmlEscape(absolute(hrPath))}</loc>${playersLastmodTag}${altLinks}</url>`);
  }

  // /compare-players is not yet a NAV_LINKS entry (same "English-only this
  // run" two-step rollout /players and /teams both followed - see
  // docs/PROJECT_STATUS.md): no Croatian translation yet, so it gets its own
  // single-locale entry here instead of the main NAV_LINKS loop above.
  const comparePlayersEntry = await getEntry('pages', 'compare-players');
  const comparePlayersLastmod = [
    ballonDor.lastReviewed,
    worldCupGoldenBoot.lastReviewed,
    euroGoldenBoot.lastReviewed,
    comparePlayersEntry?.data.lastReviewed,
  ]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const comparePlayersLastmodTag = comparePlayersLastmod ? `<lastmod>${comparePlayersLastmod}</lastmod>` : '';
  urlEntries.push(
    `<url><loc>${xmlEscape(absolute('/compare-players'))}</loc>${comparePlayersLastmodTag}</url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
