import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbList,
  buildChampionsItemList,
  buildLatestEditionSportsEvent,
} from '../../src/lib/jsonLd';
import type { ChampionSummary, Edition } from '../../src/lib/types';

describe('buildBreadcrumbList', () => {
  it('builds a positioned ListItem per entry with the schema.org context/type', () => {
    const breadcrumb = buildBreadcrumbList([
      { name: 'Home', url: 'https://example.test/' },
      { name: 'FIFA World Cup', url: 'https://example.test/competitions/world-cup/' },
    ]);

    expect(breadcrumb['@context']).toBe('https://schema.org');
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.test/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FIFA World Cup',
        item: 'https://example.test/competitions/world-cup/',
      },
    ]);
  });
});

describe('buildChampionsItemList', () => {
  const champions: ChampionSummary[] = [
    { id: 'brazil', displayName: 'Brazil', titles: 5, years: ['1958', '1962', '1970', '1994', '2002'], names: ['Brazil'] },
    { id: 'spain', displayName: 'Spain', titles: 1, years: ['2010'], names: ['Spain'] },
  ];

  it('produces one ranked ListItem per champion with a Thing description', () => {
    const itemList = buildChampionsItemList(champions, {
      pageUrl: 'https://example.test/competitions/world-cup/',
      name: 'FIFA World Cup - Champions by titles',
    });

    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.url).toBe('https://example.test/competitions/world-cup/');
    expect(itemList.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'Brazil',
          description: '5 titles (1958, 1962, 1970, 1994, 2002)',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: { '@type': 'Thing', name: 'Spain', description: '1 title (2010)' },
      },
    ]);
  });

  it('uses the singular/plural unit override, e.g. for an individual award', () => {
    const itemList = buildChampionsItemList(champions, {
      pageUrl: 'https://example.test/competitions/golden-boot/',
      name: 'Most World Cup Golden Boots',
      unit: ['award', 'awards'],
    });

    const [first, second] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('5 awards (1958, 1962, 1970, 1994, 2002)');
    expect(second.item.description).toBe('1 award (2010)');
  });
});

describe('buildLatestEditionSportsEvent', () => {
  const editions: Edition[] = [
    {
      year: '2022',
      yearSort: 2022,
      winner: 'Argentina',
      host: 'Qatar',
      cells: [],
    },
    {
      year: '2026',
      yearSort: 2026,
      winner: 'Spain',
      host: 'Canada, Mexico and United States',
      cells: [],
    },
  ];

  it('picks the edition with the latest year, regardless of source order', () => {
    const event = buildLatestEditionSportsEvent(editions, 'FIFA World Cup');
    expect(event).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: '2026 FIFA World Cup',
      startDate: '2026',
      sport: 'Football',
      location: { '@type': 'Place', name: 'Canada, Mexico and United States' },
      competitor: { '@type': 'SportsTeam', name: 'Spain' },
    });
  });

  it('omits location/competitor when the table has no host column or no winner', () => {
    const noHost: Edition[] = [{ year: '2025', yearSort: 2025, winner: 'Ousmane Dembélé', cells: [] }];
    const event = buildLatestEditionSportsEvent(noHost, "Men's Ballon d'Or");
    expect(event).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: "2025 Men's Ballon d'Or",
      startDate: '2025',
      sport: 'Football',
      competitor: { '@type': 'SportsTeam', name: 'Ousmane Dembélé' },
    });
  });

  it('does not surface a placeholder "Not awarded" winner as a competitor', () => {
    const notAwarded: Edition[] = [{ year: '2020', yearSort: 2020, winner: 'Not awarded', cells: [] }];
    const event = buildLatestEditionSportsEvent(notAwarded, "Men's Ballon d'Or");
    expect(event?.competitor).toBeUndefined();
  });

  it('returns undefined when no edition has a parseable year', () => {
    const noYear: Edition[] = [{ year: 'TBD', yearSort: Number.NaN, winner: 'Unknown', cells: [] }];
    expect(buildLatestEditionSportsEvent(noYear, 'Test Cup')).toBeUndefined();
  });
});
