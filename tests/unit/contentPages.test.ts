import { describe, expect, it, vi } from 'vitest';
import type { MarkdownTable } from '../../src/lib/types';

// contentPages.ts imports astro:content's getEntry() at module scope (via
// its own loadFeedEntries() and indirectly via teamCompetitions.ts/
// competition.ts) - stub it the same way competition.test.ts/
// teamCompetitions.test.ts do so this file can import the module under
// plain Vitest. Only the pure functions below are under test here;
// loadFeedEntries() itself has no dedicated unit test, the same choice
// sitemap.xml.ts (which also calls astro:content) already makes - both are
// exercised indirectly through the real build instead (pnpm build, then
// scripts/check-feed.mjs/check-sitemap.mjs against the output).
vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { derivedPageLastReviewed, maxLastReviewed, buildEditionFeedEntry, copaAmericaYearLabel } = await import(
  '../../src/lib/contentPages'
);
const { buildEditions } = await import('../../src/lib/editions');

describe('maxLastReviewed', () => {
  it('returns the lexicographically latest ISO date', () => {
    expect(maxLastReviewed(['2026-01-01', '2026-08-15', '2026-05-01'])).toBe('2026-08-15');
  });

  it('ignores undefined entries', () => {
    expect(maxLastReviewed([undefined, '2026-01-01', undefined])).toBe('2026-01-01');
  });

  it('returns undefined when every entry is undefined', () => {
    expect(maxLastReviewed([undefined, undefined])).toBeUndefined();
  });
});

describe('derivedPageLastReviewed', () => {
  const teamCompetitionDates = ['2026-09-11', '2026-09-11', '2026-10-01', '2026-09-10'];
  const awardDates = ['2026-10-02', '2026-09-11', '2026-09-03'];

  it('/teams and /compare take the max across team competitions and their own content date', () => {
    expect(derivedPageLastReviewed('/teams', teamCompetitionDates, awardDates, '2026-01-01')).toBe(
      '2026-10-01',
    );
    expect(derivedPageLastReviewed('/compare', teamCompetitionDates, awardDates, '2026-11-01')).toBe(
      '2026-11-01',
    );
  });

  it('/players and /compare-players take the max across awards and their own content date', () => {
    expect(derivedPageLastReviewed('/players', teamCompetitionDates, awardDates, '2026-01-01')).toBe(
      '2026-10-02',
    );
    expect(
      derivedPageLastReviewed('/compare-players', teamCompetitionDates, awardDates, '2026-11-01'),
    ).toBe('2026-11-01');
  });

  it('/records takes the max across every team competition and award, ignoring its own content date', () => {
    expect(derivedPageLastReviewed('/records', teamCompetitionDates, awardDates, '2099-01-01')).toBe(
      '2026-10-02',
    );
  });

  it('/quiz takes the max across every team competition and award, plus its own content date - matching quiz.astro\'s own lastReviewed computation', () => {
    expect(derivedPageLastReviewed('/quiz', teamCompetitionDates, awardDates, '2026-01-01')).toBe(
      '2026-10-02',
    );
    expect(derivedPageLastReviewed('/quiz', teamCompetitionDates, awardDates, '2026-11-01')).toBe(
      '2026-11-01',
    );
  });

  it('every other path just passes its own content date through unchanged', () => {
    expect(
      derivedPageLastReviewed('/competitions/world-cup', teamCompetitionDates, awardDates, '2026-09-11'),
    ).toBe('2026-09-11');
    expect(derivedPageLastReviewed('/glossary', teamCompetitionDates, awardDates, undefined)).toBeUndefined();
  });
});

describe('buildEditionFeedEntry', () => {
  const worldCupTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up'],
    rows: [
      ['2018', 'France', 'Croatia'],
      ['2022', 'Argentina', 'France'],
    ],
  };
  const worldCupFamily = {
    pathPrefix: '/competitions/world-cup',
    lastReviewed: '2026-09-11',
    editions: buildEditions(worldCupTable),
    titleEn: (profile: { year: string }) => `${profile.year} FIFA World Cup`,
    titleHr: (profile: { year: string }) => `FIFA Svjetsko prvenstvo ${profile.year}.`,
  };

  it('builds an entry for the newest edition, not the oldest', () => {
    expect(buildEditionFeedEntry(worldCupFamily, 'en')).toEqual({
      path: '/competitions/world-cup/2022',
      title: '2022 FIFA World Cup',
      summary: 'Argentina champion.',
      updated: '2026-09-11',
    });
  });

  it('uses the Croatian title and no summary for the hr locale', () => {
    expect(buildEditionFeedEntry(worldCupFamily, 'hr')).toEqual({
      path: '/competitions/world-cup/2022',
      title: 'FIFA Svjetsko prvenstvo 2022.',
      summary: undefined,
      updated: '2026-09-11',
    });
  });

  it('returns undefined for a family with no editions', () => {
    expect(
      buildEditionFeedEntry({ ...worldCupFamily, editions: [] }, 'en'),
    ).toBeUndefined();
  });

  it('host-disambiguates the title when the newest edition shares its year with another (Copa América 1959)', () => {
    const copaAmerica1959Table: MarkdownTable = {
      headers: ['Year', 'Host / format', 'Champion', 'Runner-up'],
      rows: [
        ['1957', 'Peru', 'Argentina', 'Brazil'],
        ['1959', 'Argentina', 'Argentina', 'Brazil'],
        ['1959', 'Ecuador', 'Uruguay', 'Argentina'],
      ],
    };
    const copaAmericaFamily = {
      pathPrefix: '/competitions/copa-america',
      lastReviewed: '2026-09-11',
      editions: buildEditions(copaAmerica1959Table),
      titleEn: (profile: Parameters<typeof copaAmericaYearLabel>[0]) =>
        `${copaAmericaYearLabel(profile)} Copa América`,
      titleHr: (profile: Parameters<typeof copaAmericaYearLabel>[0]) =>
        `Copa América ${copaAmericaYearLabel(profile)}`,
    };

    const entry = buildEditionFeedEntry(copaAmericaFamily, 'en');
    expect(entry?.path).toBe('/competitions/copa-america/1959-ecuador');
    expect(entry?.title).toBe('1959 (Ecuador) Copa América');
    expect(entry?.summary).toBe('Uruguay champion.');
  });
});
