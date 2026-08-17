import { loadCompetition, type CompetitionData } from './competition';
import type { CompetitionEditions } from './compare';

// Single source of truth for "the four team competitions /compare ranks
// countries across" (World Cup, EURO, Copa América, Nations League - the
// same four buildAllCountryRecords()'s own doc comment names, deliberately
// excluding the two individual awards). Before this, /compare's own
// frontmatter was the only place that loaded and shaped these four calls;
// src/pages/team-index.json.ts (the global "find a team" search widget's
// data endpoint) needs the exact same country list, so this is factored out
// once rather than risking the two drifting apart on load options the way
// e.g. scripts/pdf-pages.mjs's shared PDF_PAGES list already prevents for
// PDF generation.
export type TeamCompetitions = {
  worldCup: CompetitionData;
  euro: CompetitionData;
  copaAmerica: CompetitionData;
  nationsLeague: CompetitionData;
  /** The shape distinctCountryGroups()/buildAllCountryRecords()/buildFinalsMeetings() (src/lib/compare.ts) take. */
  competitions: CompetitionEditions[];
};

export async function loadTeamCompetitions(): Promise<TeamCompetitions> {
  const [worldCup, euro, copaAmerica, nationsLeague] = await Promise.all([
    loadCompetition('fifa-world-cup', { editionsHeading: 'Editions', sourcesHeading: 'FIFA World Cup' }),
    loadCompetition('uefa-euro', { editionsHeading: 'Editions', sourcesHeading: 'UEFA EURO' }),
    loadCompetition('copa-america', {
      editionsHeading: 'Champions timeline',
      sourcesHeading: 'Copa América',
      allowDuplicateYears: ['1959'],
    }),
    loadCompetition('uefa-nations-league', {
      editionsHeading: 'Finals',
      sourcesHeading: 'UEFA Nations League',
    }),
  ]);

  const competitions: CompetitionEditions[] = [
    { title: 'FIFA World Cup', slug: 'world-cup', editions: worldCup.editions },
    { title: 'UEFA EURO', slug: 'euro', editions: euro.editions },
    { title: 'Copa América', slug: 'copa-america', editions: copaAmerica.editions },
    { title: 'UEFA Nations League', slug: 'nations-league', editions: nationsLeague.editions },
  ];

  return { worldCup, euro, copaAmerica, nationsLeague, competitions };
}
