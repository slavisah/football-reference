import { describe, expect, it } from 'vitest';
import { buildAllCountryRecords, type CompetitionEditions } from '../../src/lib/compare';
import { buildTeamProfile, teamProfileSlug } from '../../src/lib/teamProfile';
import { buildEditions } from '../../src/lib/editions';
import type { MarkdownTable } from '../../src/lib/types';

const worldCupTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Third', 'Fourth', 'Final'],
  rows: [
    ['1954', 'Switzerland', 'West Germany', 'Hungary', 'Austria', 'Uruguay', 'West Germany 3-2 Hungary'],
    ['1974', 'West Germany', 'West Germany', 'Netherlands', 'Poland', 'Brazil', 'West Germany 2-1 Netherlands'],
    ['2014', 'Brazil', 'Germany', 'Argentina', 'Netherlands', 'Brazil', 'Germany 1-0 Argentina'],
    ['2018', 'Russia', 'France', 'Croatia', 'Belgium', 'England', 'France 4-2 Croatia'],
  ],
};

const euroTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Other semifinalist', 'Other semifinalist / fourth'],
  rows: [
    ['2016', 'France', 'Portugal', 'France', 'Germany', 'Wales'],
    ['2020', 'Europe-wide', 'Italy', 'England', 'Denmark', 'Spain'],
  ],
};

const copaTable: MarkdownTable = {
  headers: ['Year', 'Host', 'Champion', 'Runner-up', 'Third', 'Fourth'],
  rows: [
    ['1916', 'Argentina', 'Uruguay', 'Argentina', '—', '—'],
    ['2021', 'Brazil', 'Argentina', 'Brazil', 'Colombia', 'Peru'],
    ['2024', 'United States', 'Argentina', 'Colombia', 'Uruguay', 'Canada'],
  ],
};

const worldCup: CompetitionEditions = {
  title: 'FIFA World Cup',
  slug: 'world-cup',
  editions: buildEditions(worldCupTable),
};
const euro: CompetitionEditions = {
  title: 'UEFA EURO',
  slug: 'euro',
  editions: buildEditions(euroTable),
};
const copaAmerica: CompetitionEditions = {
  title: 'Copa América',
  slug: 'copa-america',
  editions: buildEditions(copaTable),
};

const competitions = [worldCup, euro, copaAmerica];

function recordFor(id: string) {
  const record = buildAllCountryRecords(competitions).find((r) => r.id === id);
  if (!record) throw new Error(`fixture has no country record for "${id}"`);
  return record;
}

describe('buildTeamProfile', () => {
  it('lists a title as "Champion" and a runner-up/semifinal cell under its own column label, oldest first', () => {
    const profile = buildTeamProfile(recordFor('germany'), competitions);
    const worldCupProfile = profile.competitions.find((c) => c.slug === 'world-cup');
    expect(worldCupProfile?.appearances).toEqual([
      { year: '1954', yearSort: 1954, role: 'Champion' },
      { year: '1974', yearSort: 1974, role: 'Champion' },
      { year: '2014', yearSort: 2014, role: 'Champion' },
    ]);
    // Germany/West Germany never reaches a World Cup semifinal-or-below in
    // this fixture, but is EURO 2016's "Other semifinalist".
    const euroProfile = profile.competitions.find((c) => c.slug === 'euro');
    expect(euroProfile?.appearances).toEqual([
      { year: '2016', yearSort: 2016, role: 'Other semifinalist' },
    ]);
  });

  it('preserves the exact source column label for a runner-up finish rather than inventing a generic word', () => {
    const profile = buildTeamProfile(recordFor('france'), competitions);
    const worldCupProfile = profile.competitions.find((c) => c.slug === 'world-cup');
    expect(worldCupProfile?.appearances).toEqual([{ year: '2018', yearSort: 2018, role: 'Champion' }]);
    const euroProfile = profile.competitions.find((c) => c.slug === 'euro');
    expect(euroProfile?.appearances).toEqual([{ year: '2016', yearSort: 2016, role: 'Runner-up' }]);
  });

  it('sorts one competition\'s appearances oldest first, regardless of the source table\'s own row order', () => {
    const outOfOrderTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner', 'Runner-up'],
      rows: [
        ['2010', 'South Africa', 'Spain', 'Netherlands'],
        ['1974', 'West Germany', 'West Germany', 'Netherlands'],
        ['1988', 'West Germany', 'Netherlands', 'Soviet Union'],
      ],
    };
    const outOfOrder: CompetitionEditions = {
      title: 'Test Cup',
      slug: 'test-cup',
      editions: buildEditions(outOfOrderTable),
    };
    const record = buildAllCountryRecords([outOfOrder]).find((r) => r.id === 'netherlands');
    if (!record) throw new Error('fixture has no "netherlands" record');
    const profile = buildTeamProfile(record, [outOfOrder]);
    expect(profile.competitions[0].appearances.map((a) => a.year)).toEqual(['1974', '1988', '2010']);
  });

  it('only includes competitions the team actually appears in, in the given competitions order', () => {
    const profile = buildTeamProfile(recordFor('colombia'), competitions);
    // Colombia: Copa América third (2021) and runner-up (2024) only - no
    // World Cup/EURO appearance in this fixture.
    expect(profile.competitions.map((c) => c.slug)).toEqual(['copa-america']);
    expect(profile.competitions[0].appearances).toEqual([
      { year: '2021', yearSort: 2021, role: 'Third' },
      { year: '2024', yearSort: 2024, role: 'Runner-up' },
    ]);
  });

  it('ignores the "—" missing-cell placeholder rather than inventing a phantom appearance', () => {
    // Uruguay: Copa América 1916 champion (that year's own Third/Fourth
    // cells are "—" and must not add a second, phantom 1916 entry) and
    // 2024 third place - exactly two real appearances, not three.
    const profile = buildTeamProfile(recordFor('uruguay'), competitions);
    const copaProfile = profile.competitions.find((c) => c.slug === 'copa-america');
    expect(copaProfile?.appearances).toEqual([
      { year: '1916', yearSort: 1916, role: 'Champion' },
      { year: '2024', yearSort: 2024, role: 'Third' },
    ]);
  });

  it('carries the same totals as the CountryRecord it was built from', () => {
    const record = recordFor('germany');
    const profile = buildTeamProfile(record, competitions);
    expect(profile.totalTitles).toBe(record.totalTitles);
    expect(profile.totalRunnerUps).toBe(record.totalRunnerUps);
    expect(profile.totalSemifinals).toBe(record.totalSemifinals);
    expect(profile.totalFinals).toBe(record.totalFinals);
    expect(profile.id).toBe(record.id);
    expect(profile.displayName).toBe(record.displayName);
  });

  it('returns no competitions for a team given an empty competitions list', () => {
    const profile = buildTeamProfile(recordFor('germany'), []);
    expect(profile.competitions).toEqual([]);
  });
});

describe('teamProfileSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(teamProfileSlug('South Korea')).toBe('south-korea');
  });

  it('strips diacritics to plain ASCII', () => {
    expect(teamProfileSlug('Türkiye')).toBe('turkiye');
  });

  it('collapses punctuation (e.g. an apostrophe) into a hyphen rather than dropping it silently', () => {
    expect(teamProfileSlug("Côte d'Ivoire")).toBe('cote-d-ivoire');
  });

  it('is stable for a plain single-word id', () => {
    expect(teamProfileSlug('germany')).toBe('germany');
  });

  it('produces no leading/trailing hyphens', () => {
    expect(teamProfileSlug('  Brazil  ')).toBe('brazil');
  });
});
