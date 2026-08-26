import type { APIRoute } from 'astro';
import { loadCompetition } from '../lib/competition';
import { buildEditionProfiles } from '../lib/editionProfile';
import type { Edition } from '../lib/types';

export const prerender = true;

// Data endpoint mirroring team-index.json.ts / player-index.json.ts, built
// for the /competitions/<family>/<slug> PDF rollout: scripts/generate-pdfs.mjs
// has no way to enumerate edition slugs itself (they're derived from each
// competition's content/*.md table at build time via buildEditionProfiles(),
// not hand-typed - the same reason those two endpoints exist), so it asks
// this endpoint for the live list of edition pages the same way it asks
// /team-index.json and /player-index.json for their rosters.
//
// `family` matches the prefix scripts/pdf-pages.mjs's EDITION_PDF_SOURCES
// map is keyed by, so scripts/check-pdf-freshness.mjs (which has no running
// server to ask) can recover the right source list for a `edition-<family>-
// <slug>[-hr]` manifest key purely from its own name.
//
// teamSlugs/individualAward are deliberately omitted from the
// buildEditionProfiles() calls below - they only affect which facts get
// linked, never the slug (and therefore the URL) a given edition resolves
// to, and this endpoint only needs the latter.
type EditionPdfEntry = {
  pdfSlug: string;
  path: string;
  family: string;
};

function entriesFor(family: string, basePath: string, hrBasePath: string, editions: Edition[]): EditionPdfEntry[] {
  const slugs = buildEditionProfiles(editions).map((profile) => profile.slug);
  return slugs.flatMap((slug) => [
    { pdfSlug: `edition-${family}-${slug}`, path: `${basePath}/${slug}`, family },
    { pdfSlug: `edition-${family}-${slug}-hr`, path: `${hrBasePath}/${slug}`, family },
  ]);
}

export const GET: APIRoute = async () => {
  const [worldCup, euro, nationsLeague, copaAmerica, ballonDor, worldCupGoldenBoot, euroGoldenBoot] =
    await Promise.all([
      loadCompetition('fifa-world-cup', { editionsHeading: 'Editions', sourcesHeading: 'FIFA World Cup' }),
      loadCompetition('uefa-euro', { editionsHeading: 'Editions', sourcesHeading: 'UEFA EURO' }),
      loadCompetition('uefa-nations-league', { editionsHeading: 'Finals', sourcesHeading: 'UEFA Nations League' }),
      loadCompetition('copa-america', {
        editionsHeading: 'Champions timeline',
        sourcesHeading: 'Copa América',
        allowDuplicateYears: ['1959'],
      }),
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

  const index: EditionPdfEntry[] = [
    ...entriesFor('world-cup', '/competitions/world-cup', '/hr/competitions/world-cup', worldCup.editions),
    ...entriesFor('euro', '/competitions/euro', '/hr/competitions/euro', euro.editions),
    ...entriesFor(
      'nations-league',
      '/competitions/nations-league',
      '/hr/competitions/nations-league',
      nationsLeague.editions,
    ),
    ...entriesFor(
      'copa-america',
      '/competitions/copa-america',
      '/hr/competitions/copa-america',
      copaAmerica.editions,
    ),
    ...entriesFor('ballon-dor', '/competitions/ballon-dor', '/hr/competitions/ballon-dor', ballonDor.editions),
    ...entriesFor(
      'golden-boot-world-cup',
      '/competitions/golden-boot/world-cup',
      '/hr/competitions/golden-boot/world-cup',
      worldCupGoldenBoot.editions,
    ),
    ...entriesFor(
      'golden-boot-euro',
      '/competitions/golden-boot/euro',
      '/hr/competitions/golden-boot/euro',
      euroGoldenBoot.editions,
    ),
  ];

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
