import { describe, expect, it, vi } from 'vitest';
import type { ChampionSummary } from '../../src/lib/types';
import type { CompetitionData } from '../../src/lib/competition';
import type { HomeCompetitions } from '../../src/lib/homeCards';

// buildHomeCards() is pure (takes already-loaded CompetitionData in), but
// homeCards.ts also imports loadCompetition (for loadHomeCompetitions())
// from './competition', which imports 'astro:content' at module scope - so
// even a test that only exercises buildHomeCards() needs this stub just to
// let the module load outside of an Astro build.
vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { getEntry } = await import('astro:content');
const { buildHomeCards, loadHomeCompetitions } = await import('../../src/lib/homeCards');

const mockGetEntry = vi.mocked(getEntry);

function champion(displayName: string, titles = 1): ChampionSummary {
  return { id: displayName.toLowerCase(), displayName, titles, years: ['2024'], names: [displayName] };
}

function competition(overrides: Partial<CompetitionData> = {}): CompetitionData {
  return {
    title: 'Test Competition',
    intro: 'Intro text.',
    lastReviewed: '2026-01-01',
    status: 'verified',
    table: { headers: [], rows: [] },
    editions: [
      {
        year: '2024',
        yearSort: 2024,
        winner: 'Testland',
        cells: [],
      },
    ],
    champions: [champion('Testland', 2)],
    winners: ['Testland'],
    hosts: [],
    teams: [],
    sources: [],
    notes: [],
    ...overrides,
  };
}

function fixture(): HomeCompetitions {
  return {
    worldCup: competition({ champions: [champion('Brazil', 5)] }),
    euro: competition({ champions: [champion('Germany', 3)] }),
    copaAmerica: competition({ champions: [champion('Uruguay', 15)] }),
    nationsLeague: competition({ champions: [champion('Spain', 2)] }),
    ballonDor: competition({ champions: [champion('Lionel Messi', 8)] }),
    goldenBoot: competition({ champions: [] }),
  };
}

describe('buildHomeCards', () => {
  it('returns one card per competition, in the fixed World Cup / EURO / Copa América / Nations League / Ballon d’Or / Golden Boot order', () => {
    const cards = buildHomeCards('en', fixture());
    expect(cards.map((c) => c.title)).toEqual([
      'FIFA World Cup',
      'UEFA European Championship',
      'Copa América',
      'UEFA Nations League',
      "Men's Ballon d'Or",
      'Golden Boot',
    ]);
  });

  it('pulls editions count and top champion from the matching competition, not a shared default', () => {
    const cards = buildHomeCards('en', fixture());
    const worldCup = cards.find((c) => c.title === 'FIFA World Cup')!;
    expect(worldCup.editions).toBe(1);
    expect(worldCup.topChampion?.displayName).toBe('Brazil');

    const ballonDor = cards.find((c) => c.title.includes('Ballon'))!;
    expect(ballonDor.topChampion?.displayName).toBe('Lionel Messi');
  });

  it('leaves topChampion undefined when a competition has no champions yet', () => {
    const cards = buildHomeCards('en', fixture());
    const goldenBoot = cards.find((c) => c.title === 'Golden Boot')!;
    expect(goldenBoot.topChampion).toBeUndefined();
  });

  it('only sets a statLabel for the individual awards (Ballon d’Or, Golden Boot), not the team competitions', () => {
    const cards = buildHomeCards('en', fixture());
    const byTitle = Object.fromEntries(cards.map((c) => [c.title, c.statLabel]));
    expect(byTitle['FIFA World Cup']).toBeUndefined();
    expect(byTitle['UEFA European Championship']).toBeUndefined();
    expect(byTitle['Copa América']).toBeUndefined();
    expect(byTitle['UEFA Nations League']).toBeUndefined();
    expect(byTitle["Men's Ballon d'Or"]).toBe('Most awards');
    expect(byTitle['Golden Boot']).toBe('Most awards');
  });

  it('switches title and blurb text to Croatian for the hr locale, without changing the underlying numbers', () => {
    const data = fixture();
    const en = buildHomeCards('en', data);
    const hr = buildHomeCards('hr', data);
    expect(hr.map((c) => c.title)).toEqual([
      'FIFA Svjetsko prvenstvo',
      'UEFA Europsko prvenstvo',
      'Copa América',
      'UEFA Liga nacija',
      'Zlatna lopta',
      'Zlatna kopačka',
    ]);
    expect(hr.map((c) => c.editions)).toEqual(en.map((c) => c.editions));
    expect(hr.map((c) => c.topChampion?.displayName)).toEqual(
      en.map((c) => c.topChampion?.displayName),
    );
  });

  it('gives every card a distinct accent color and a href built from its competition path', () => {
    const cards = buildHomeCards('en', fixture());
    expect(new Set(cards.map((c) => c.accent)).size).toBe(cards.length);
    expect(cards.map((c) => c.href)).toEqual([
      '/competitions/world-cup',
      '/competitions/euro',
      '/competitions/copa-america',
      '/competitions/nations-league',
      '/competitions/ballon-dor',
      '/competitions/golden-boot',
    ]);
  });
});

// loadHomeCompetitions() itself (as opposed to buildHomeCards(), which only
// consumes its output) was never exercised by any test - a typo in one of
// its six hard-coded content ids or `editionsHeading` values would silently
// break only at build time, not here. Each fake body below uses the exact
// heading loadHomeCompetitions() requests for that competition (see the
// editionsHeading values in src/lib/homeCards.ts) so a wrong heading fails
// this test the same way it would fail the real build.
const table = (heading: string, rows: string): string => `# Test

Intro.

## ${heading}

| Year | Winner |
|---|---|
${rows}
`;

describe('loadHomeCompetitions', () => {
  it('loads all six competitions by their real content id, each under its own editionsHeading, into the matching key', async () => {
    mockGetEntry.mockImplementation(async (_collection: string, id: string) => {
      const bodies: Record<string, string> = {
        'fifa-world-cup': table('Editions', '| 2022 | WorldCupWinner |'),
        'uefa-euro': table('Editions', '| 2024 | EuroWinner |'),
        'copa-america': table('Champions timeline', '| 2024 | CopaWinner |'),
        'uefa-nations-league': table('Finals', '| 2024–25 | NationsLeagueWinner |'),
        'ballon-dor': table('Winners', '| 2025 | BallonDorWinner |'),
        'golden-boot': table('FIFA World Cup top scorers', '| 2026 | GoldenBootWinner |'),
      };
      const body = bodies[id];
      if (!body) throw new Error(`Unexpected content id requested: "${id}"`);
      return { data: { title: id, lastReviewed: '2026-01-01', status: 'verified' }, body };
    });

    const data = await loadHomeCompetitions();

    expect(data.worldCup.champions[0]?.displayName).toBe('WorldCupWinner');
    expect(data.euro.champions[0]?.displayName).toBe('EuroWinner');
    expect(data.copaAmerica.champions[0]?.displayName).toBe('CopaWinner');
    expect(data.nationsLeague.champions[0]?.displayName).toBe('NationsLeagueWinner');
    expect(data.ballonDor.champions[0]?.displayName).toBe('BallonDorWinner');
    expect(data.goldenBoot.champions[0]?.displayName).toBe('GoldenBootWinner');
  });

  it('passes allowDuplicateYears for Copa América only, matching its two same-year 1959 South American Championships', async () => {
    const duplicateYearBody = table('Champions timeline', '| 1959 | A |\n| 1959 | B |');
    mockGetEntry.mockImplementation(async (_collection: string, id: string) => {
      if (id === 'copa-america') return { data: { title: id }, body: duplicateYearBody };
      // Every other competition just needs a valid, unique-year table so
      // Promise.all() doesn't reject on an unrelated id.
      const bodies: Record<string, string> = {
        'fifa-world-cup': table('Editions', '| 2022 | A |'),
        'uefa-euro': table('Editions', '| 2024 | A |'),
        'uefa-nations-league': table('Finals', '| 2024–25 | A |'),
        'ballon-dor': table('Winners', '| 2025 | A |'),
        'golden-boot': table('FIFA World Cup top scorers', '| 2026 | A |'),
      };
      return { data: { title: id, lastReviewed: '2026-01-01', status: 'verified' }, body: bodies[id] };
    });

    const data = await loadHomeCompetitions();
    expect(data.copaAmerica.editions).toHaveLength(2);
  });
});
