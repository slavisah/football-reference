import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../src/lib/editions';
import {
  buildEditionLinks,
  buildEditionProfiles,
  editionLinkKey,
  editionSlug,
} from '../../src/lib/editionProfile';
import type { MarkdownTable } from '../../src/lib/types';

// Shaped like Copa América's real 1916-1929 to 1959 stretch, condensed to the
// three editions that matter for the duplicate-year case: the one right
// before 1959, both 1959 tournaments (Argentina-hosted, then Ecuador-hosted -
// same source order as content/copa-america.md), and the one right after.
const copaAmerica1959Table: MarkdownTable = {
  headers: ['Year', 'Host / format', 'Champion', 'Runner-up'],
  rows: [
    ['1957', 'Peru', 'Argentina', 'Brazil'],
    ['1959', 'Argentina', 'Argentina', 'Brazil'],
    ['1959', 'Ecuador', 'Uruguay', 'Argentina'],
    ['1963', 'Bolivia', 'Bolivia', 'Paraguay'],
  ],
};
const copaAmerica1959 = buildEditions(copaAmerica1959Table);

const worldCupTable: MarkdownTable = {
  headers: [
    'Year',
    'Host(s)',
    'Teams',
    'Winner',
    'Runner-up',
    'Third',
    'Fourth / other semifinalist',
    'Final',
    'Final date',
  ],
  rows: [
    ['1954', 'Switzerland', '16', 'West Germany', 'Hungary', 'Austria', 'Uruguay', 'West Germany 3–2 Hungary', '4 July 1954'],
    ['1974', 'West Germany', '16', 'West Germany', 'Netherlands', 'Poland', 'Brazil', 'West Germany 2–1 Netherlands', '7 July 1974'],
    ['2018', 'Russia', '32', 'France', 'Croatia', 'Belgium', 'England', 'France 4–2 Croatia', '15 July 2018'],
  ],
};

const worldCup = buildEditions(worldCupTable);

describe('editionSlug', () => {
  it('leaves a plain year as-is', () => {
    expect(editionSlug('1930')).toBe('1930');
  });

  it('normalizes an en-dashed season label to a plain hyphen', () => {
    expect(editionSlug('2018–19')).toBe('2018-19');
  });

  it('is stable for a label that already uses a plain hyphen', () => {
    expect(editionSlug('2018-19')).toBe('2018-19');
  });
});

describe('editionLinkKey', () => {
  it('is the plain year when no host is given', () => {
    expect(editionLinkKey('2018')).toBe('2018');
  });

  it('folds a trimmed host into the key when given', () => {
    expect(editionLinkKey('1959', ' Ecuador ')).toBe('1959::Ecuador');
  });

  it('falls back to the plain year for an empty/whitespace-only host', () => {
    expect(editionLinkKey('2018', '  ')).toBe('2018');
  });
});

describe('buildEditionProfiles', () => {
  it('returns one profile per edition, newest first', () => {
    expect(buildEditionProfiles(worldCup).map((p) => p.year)).toEqual(['2018', '1974', '1954']);
  });

  it('keeps every column except Year as a fact, in source order', () => {
    const [latest] = buildEditionProfiles(worldCup);
    expect(latest.facts.map((f) => f.label)).toEqual([
      'Host(s)',
      'Teams',
      'Winner',
      'Runner-up',
      'Third',
      'Fourth / other semifinalist',
      'Final',
      'Final date',
    ]);
    expect(latest.facts.find((f) => f.label === 'Final')?.value).toBe('France 4–2 Croatia');
  });

  it('links the four placing columns to team profiles but not the data columns', () => {
    const [latest] = buildEditionProfiles(worldCup);
    const slugFor = (label: string) => latest.facts.find((f) => f.label === label)?.teamSlug;
    expect(slugFor('Winner')).toBe('france');
    expect(slugFor('Runner-up')).toBe('croatia');
    expect(slugFor('Third')).toBe('belgium');
    expect(slugFor('Fourth / other semifinalist')).toBe('england');
    // A host is a country name too, but it is not a placing - it must not link
    // to a team profile that may not even exist for that country.
    expect(slugFor('Host(s)')).toBeUndefined();
    expect(slugFor('Teams')).toBeUndefined();
    expect(slugFor('Final')).toBeUndefined();
  });

  it('resolves a historical name to its successor group slug', () => {
    const nineteenFiftyFour = buildEditionProfiles(worldCup).find((p) => p.year === '1954');
    expect(nineteenFiftyFour?.facts.find((f) => f.label === 'Winner')?.teamSlug).toBe('germany');
  });

  it('omits a link when the slug has no generated team page', () => {
    const [latest] = buildEditionProfiles(worldCup, new Set(['france']));
    const slugFor = (label: string) => latest.facts.find((f) => f.label === label)?.teamSlug;
    expect(slugFor('Winner')).toBe('france');
    expect(slugFor('Runner-up')).toBeUndefined();
  });

  it('chains previous/next chronologically, with open ends at both extremes', () => {
    const [newest, middle, oldest] = buildEditionProfiles(worldCup);
    expect(newest.next).toBeUndefined();
    expect(newest.previous?.year).toBe('1974');
    expect(middle.previous?.year).toBe('1954');
    expect(middle.next?.year).toBe('2018');
    expect(oldest.previous).toBeUndefined();
    expect(oldest.next?.year).toBe('1974');
  });

  it('exposes champion and host for the page title and description', () => {
    const [latest] = buildEditionProfiles(worldCup);
    expect(latest.champion).toBe('France');
    expect(latest.host).toBe('Russia');
  });

  it('does not link a missing-cell placeholder or a "not held" placeholder', () => {
    const sparse = buildEditions({
      headers: ['Year', 'Host', 'Champion', 'Runner-up', 'Third'],
      rows: [['1975', 'Home-and-away', 'Peru', 'Colombia', '—']],
    });
    const [profile] = buildEditionProfiles(sparse);
    expect(profile.facts.find((f) => f.label === 'Third')?.teamSlug).toBeUndefined();
    expect(profile.facts.find((f) => f.label === 'Third')?.value).toBe('—');
  });

  it('throws rather than silently merging two editions onto one slug when there is no host to disambiguate them', () => {
    const duplicate = buildEditions({
      headers: ['Year', 'Champion'],
      rows: [
        ['1959', 'Argentina'],
        ['1959', 'Uruguay'],
      ],
    });
    expect(() => buildEditionProfiles(duplicate)).toThrow(/same edition slug/);
  });

  describe('duplicate-year editions disambiguated by host (Copa América 1959)', () => {
    it('gives each same-year edition its own host-suffixed slug', () => {
      const profiles = buildEditionProfiles(copaAmerica1959);
      const bySlug = new Map(profiles.map((p) => [p.slug, p]));
      expect(bySlug.get('1959-argentina')?.champion).toBe('Argentina');
      expect(bySlug.get('1959-ecuador')?.champion).toBe('Uruguay');
      // Non-colliding years keep their plain slug, unaffected.
      expect(bySlug.has('1957')).toBe(true);
      expect(bySlug.has('1963')).toBe(true);
    });

    it('chains previous/next across both 1959 editions and their real neighbours, with a disambiguator only where needed', () => {
      const profiles = buildEditionProfiles(copaAmerica1959);
      const argentina1959 = profiles.find((p) => p.slug === '1959-argentina')!;
      const ecuador1959 = profiles.find((p) => p.slug === '1959-ecuador')!;
      const y1963 = profiles.find((p) => p.year === '1963')!;
      const y1957 = profiles.find((p) => p.year === '1957')!;

      expect(argentina1959.previous).toEqual({ slug: '1957', year: '1957', disambiguator: undefined });
      expect(argentina1959.next).toEqual({ slug: '1959-ecuador', year: '1959', disambiguator: 'Ecuador' });
      expect(ecuador1959.previous).toEqual({ slug: '1959-argentina', year: '1959', disambiguator: 'Argentina' });
      expect(ecuador1959.next).toEqual({ slug: '1963', year: '1963', disambiguator: undefined });
      expect(y1963.previous?.disambiguator).toBe('Ecuador');
      expect(y1957.next?.disambiguator).toBe('Argentina');
    });

    it('does not link the Year column to a single edition, since both share edition.year', () => {
      const profiles = buildEditionProfiles(copaAmerica1959);
      const links = buildEditionLinks(profiles, '/competitions/copa-america');
      expect(links.get(editionLinkKey('1959', 'Argentina'))).toBe('/competitions/copa-america/1959-argentina');
      expect(links.get(editionLinkKey('1959', 'Ecuador'))).toBe('/competitions/copa-america/1959-ecuador');
      // The plain year alone (no host) resolves to neither - callers must key by host too.
      expect(links.has('1959')).toBe(false);
    });
  });
});

describe('buildEditionLinks', () => {
  it('maps each edition (year + host) to its page under the given competition path', () => {
    const links = buildEditionLinks(buildEditionProfiles(worldCup), '/competitions/world-cup');
    expect(links.get(editionLinkKey('2018', 'Russia'))).toBe('/competitions/world-cup/2018');
    expect(links.get(editionLinkKey('1954', 'Switzerland'))).toBe('/competitions/world-cup/1954');
    expect(links.size).toBe(3);
  });

  it('honours a localized base path', () => {
    const links = buildEditionLinks(buildEditionProfiles(worldCup), '/hr/competitions/world-cup');
    expect(links.get(editionLinkKey('2018', 'Russia'))).toBe('/hr/competitions/world-cup/2018');
  });
});
