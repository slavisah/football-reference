import type { APIRoute } from 'astro';
import { buildAllCountryRecords, buildTeamIndex } from '../lib/compare';
import { loadTeamCompetitions } from '../lib/teamCompetitions';

export const prerender = true;

// Data endpoint for the global "find a team" search widget in Nav.astro
// (rendered on all 27 pages, both languages). Fetched lazily on first
// keyboard/pointer interaction rather than embedded inline in every page's
// HTML, so the widget adds a fixed, small amount of markup to the shared
// header instead of counting a ~60-country JSON payload against every
// page's scripts/check-page-weight.mjs budget - a real concern given
// /records and /hr/records already sit close to that budget. Content is
// English-only everywhere on this site (AGENTS.md), so one endpoint serves
// both /... and /hr/... pages; only the widget's own label/placeholder
// copy is translated, the same as every team name shown on /compare.
export const GET: APIRoute = async () => {
  const { competitions } = await loadTeamCompetitions();
  const index = buildTeamIndex(buildAllCountryRecords(competitions));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
