import type { APIRoute } from 'astro';
import { loadCompetition } from '../lib/competition';
import { buildAllPlayerProfiles, type PlayerAwardSource } from '../lib/playerProfile';

export const prerender = true;

// Data endpoint mirroring team-index.json.ts, but for the /players/<slug> PDF
// family: scripts/generate-pdfs.mjs has no way to enumerate player slugs
// itself (they're derived from the three award tables at build time, not
// hand-typed - the same reason team-index.json.ts exists for /teams/<slug>),
// so it asks this endpoint for the live roster the same way it asks
// /team-index.json for teams. Not used by any client-side widget (there's no
// "find a player" search), so it isn't fetched lazily like /team-index.json
// is - it's read once, server-side, by the PDF generation script.
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
