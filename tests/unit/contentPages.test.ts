import { describe, expect, it, vi } from 'vitest';

// contentPages.ts imports astro:content's getEntry() at module scope (via
// its own loadFeedEntries() and indirectly via teamCompetitions.ts/
// competition.ts) - stub it the same way competition.test.ts/
// teamCompetitions.test.ts do so this file can import the module under
// plain Vitest. Only the two pure functions below are under test here;
// loadFeedEntries() itself has no dedicated unit test, the same choice
// sitemap.xml.ts (which also calls astro:content) already makes - both are
// exercised indirectly through the real build instead (pnpm build, then
// scripts/check-feed.mjs/check-sitemap.mjs against the output).
vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { derivedPageLastReviewed, maxLastReviewed } = await import('../../src/lib/contentPages');

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

  it('every other path just passes its own content date through unchanged', () => {
    expect(
      derivedPageLastReviewed('/competitions/world-cup', teamCompetitionDates, awardDates, '2026-09-11'),
    ).toBe('2026-09-11');
    expect(derivedPageLastReviewed('/glossary', teamCompetitionDates, awardDates, undefined)).toBeUndefined();
  });
});
