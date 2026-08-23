import { describe, expect, it, vi } from 'vitest';

// loadTeamCompetitions() calls astro:content's getEntry() (via loadCompetition()),
// which only exists inside an Astro build - stub it the same way
// homeCards.test.ts's loadHomeCompetitions() tests do, so this file can call
// the real function under plain Vitest.
vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { getEntry } = await import('astro:content');
const { loadTeamCompetitions } = await import('../../src/lib/teamCompetitions');

const mockGetEntry = vi.mocked(getEntry);

// This was never exercised by any test before - /compare's own frontmatter
// and src/pages/team-index.json.ts both rely on it to load the exact same
// four competitions under the exact same ids/editionsHeadings; a typo in
// either (e.g. 'fifa-world-cup' -> 'world-cup', or the Copa América heading
// regressing from 'Champions timeline' to the default 'Editions') would
// previously have surfaced only as a build failure or a silently empty
// /compare ranking, never as a failing unit test. Each fake body below uses
// the exact heading loadTeamCompetitions() requests for that competition -
// see the editionsHeading values in src/lib/teamCompetitions.ts - so a wrong
// heading fails this test the same way it would fail the real build.
const table = (heading: string, rows: string): string => `# Test

Intro.

## ${heading}

| Year | Winner |
|---|---|
${rows}
`;

describe('loadTeamCompetitions', () => {
  it('loads all four team competitions by their real content id, each under its own editionsHeading', async () => {
    mockGetEntry.mockImplementation(async (_collection: string, id: string) => {
      const bodies: Record<string, string> = {
        'fifa-world-cup': table('Editions', '| 2022 | WorldCupWinner |'),
        'uefa-euro': table('Editions', '| 2024 | EuroWinner |'),
        'copa-america': table('Champions timeline', '| 2024 | CopaWinner |'),
        'uefa-nations-league': table('Finals', '| 2024–25 | NationsLeagueWinner |'),
      };
      const body = bodies[id];
      if (!body) throw new Error(`Unexpected content id requested: "${id}"`);
      return { data: { title: id, lastReviewed: '2026-01-01', status: 'verified' }, body };
    });

    const data = await loadTeamCompetitions();

    expect(data.worldCup.champions[0]?.displayName).toBe('WorldCupWinner');
    expect(data.euro.champions[0]?.displayName).toBe('EuroWinner');
    expect(data.copaAmerica.champions[0]?.displayName).toBe('CopaWinner');
    expect(data.nationsLeague.champions[0]?.displayName).toBe('NationsLeagueWinner');
  });

  it('builds the `competitions` array in the same World Cup/EURO/Copa América/Nations League order, with matching titles/slugs', async () => {
    mockGetEntry.mockImplementation(async (_collection: string, id: string) => {
      const bodies: Record<string, string> = {
        'fifa-world-cup': table('Editions', '| 2022 | A |'),
        'uefa-euro': table('Editions', '| 2024 | B |'),
        'copa-america': table('Champions timeline', '| 2024 | C |'),
        'uefa-nations-league': table('Finals', '| 2024–25 | D |'),
      };
      return { data: { title: id, lastReviewed: '2026-01-01', status: 'verified' }, body: bodies[id] };
    });

    const data = await loadTeamCompetitions();

    expect(data.competitions.map((c) => c.title)).toEqual([
      'FIFA World Cup',
      'UEFA EURO',
      'Copa América',
      'UEFA Nations League',
    ]);
    expect(data.competitions.map((c) => c.slug)).toEqual([
      'world-cup',
      'euro',
      'copa-america',
      'nations-league',
    ]);
    expect(data.competitions.map((c) => c.editions[0]?.winner)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('passes allowDuplicateYears for Copa América only, matching its two same-year 1959 South American Championships', async () => {
    const duplicateYearBody = table('Champions timeline', '| 1959 | A |\n| 1959 | B |');
    mockGetEntry.mockImplementation(async (_collection: string, id: string) => {
      if (id === 'copa-america') return { data: { title: id }, body: duplicateYearBody };
      const bodies: Record<string, string> = {
        'fifa-world-cup': table('Editions', '| 2022 | A |'),
        'uefa-euro': table('Editions', '| 2024 | A |'),
        'uefa-nations-league': table('Finals', '| 2024–25 | A |'),
      };
      return { data: { title: id, lastReviewed: '2026-01-01', status: 'verified' }, body: bodies[id] };
    });

    const data = await loadTeamCompetitions();
    expect(data.copaAmerica.editions).toHaveLength(2);
  });
});
