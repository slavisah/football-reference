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

const { buildHomeCards } = await import('../../src/lib/homeCards');

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
