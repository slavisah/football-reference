import type { APIRoute } from 'astro';
import { loadCompetition } from '../lib/competition';
import { buildAllPlayerProfiles, type PlayerAwardSource } from '../lib/playerProfile';

export const prerender = true;

// Data endpoint mirroring team-index.json.ts, originally built for the
// /players/<slug> PDF family: scripts/generate-pdfs.mjs has no way to
// enumerate player slugs itself (they're derived from the three award
// tables at build time, not hand-typed - the same reason team-index.json.ts
// exists for /teams/<slug>), so it asks this endpoint for the live roster
// the same way it asks /team-index.json for teams.
//
// Also fetched lazily, client-side, by Nav.astro's "find a player" search
// widget (added 2026-08-21, mirroring the earlier "find a team" widget) -
// the same endpoint now serves both the build-time PDF script and the
// browser, exactly like /team-index.json already did.
export const GET: APIRoute = async () => {
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

  const sources: PlayerAwardSource[] = [
    { title: "Ballon d'Or", slug: 'ballon-dor', editions: ballonDor.editions },
    { title: 'FIFA World Cup Golden Boot', slug: 'golden-boot', editions: worldCupGoldenBoot.editions },
    { title: 'UEFA EURO Golden Boot', slug: 'golden-boot', editions: euroGoldenBoot.editions },
  ];

  const index = buildAllPlayerProfiles(sources).map(({ id, displayName }) => ({ id, displayName }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
