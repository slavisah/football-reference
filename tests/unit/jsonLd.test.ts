import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbList,
  buildChampionsItemList,
  buildCountryRecordsItemList,
  buildDefinedTermSet,
  buildEditionSportsEvent,
  buildLatestEditionSportsEvent,
  buildQuizJsonLd,
  buildRivalriesItemList,
  buildTeamProfileItemList,
  buildPlayerProfileItemList,
  buildPlayersDirectoryItemList,
  buildWebSiteJsonLd,
} from '../../src/lib/jsonLd';
import type { ChampionSummary, Edition } from '../../src/lib/types';
import type { CountryRecord, FinalsMeeting, Rivalry } from '../../src/lib/compare';
import type { QuizQuestion } from '../../src/lib/quiz';
import type { TeamProfile } from '../../src/lib/teamProfile';
import type { PlayerProfile } from '../../src/lib/playerProfile';

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

  it('keeps the running-latest edition when a later entry in the array is actually an earlier year', () => {
    // 2026 is already the running max by the time 2019 is reached, so the
    // reduce comparator must keep it rather than overwrite it.
    const outOfOrder: Edition[] = [
      { year: '2022', yearSort: 2022, winner: 'Argentina', cells: [] },
      { year: '2026', yearSort: 2026, winner: 'Spain', cells: [] },
      { year: '2019', yearSort: 2019, winner: 'Ousmane Dembélé', cells: [] },
    ];
    const event = buildLatestEditionSportsEvent(outOfOrder, 'FIFA World Cup');
    expect(event?.name).toBe('2026 FIFA World Cup');
  });
});

describe('buildEditionSportsEvent', () => {
  it('builds a SportsEvent for one edition, with its own page url and caller-supplied name', () => {
    const event = buildEditionSportsEvent(
      { yearSort: 2022, champion: 'Argentina', host: 'Qatar' },
      { pageUrl: 'https://example.test/competitions/world-cup/2022/', name: '2022 FIFA World Cup' },
    );

    expect(event).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: '2022 FIFA World Cup',
      url: 'https://example.test/competitions/world-cup/2022/',
      startDate: '2022',
      sport: 'Football',
      location: { '@type': 'Place', name: 'Qatar' },
      competitor: { '@type': 'SportsTeam', name: 'Argentina' },
    });
  });

  it('omits location when the edition has no host (e.g. an individual award)', () => {
    const event = buildEditionSportsEvent(
      { yearSort: 2025, champion: 'Ousmane Dembélé' },
      { pageUrl: 'https://example.test/competitions/ballon-dor/2025/', name: "2025 Men's Ballon d'Or" },
    );
    expect(event.location).toBeUndefined();
    expect(event.competitor).toEqual({ '@type': 'SportsTeam', name: 'Ousmane Dembélé' });
  });

  it('omits competitor for a placeholder "Not awarded" champion', () => {
    const event = buildEditionSportsEvent(
      { yearSort: 1942, champion: 'Not awarded' },
      { pageUrl: 'https://example.test/competitions/ballon-dor/1942/', name: "1942 Men's Ballon d'Or" },
    );
    expect(event.competitor).toBeUndefined();
  });

  it('omits competitor when the champion is an empty string', () => {
    const event = buildEditionSportsEvent(
      { yearSort: 2026, champion: '' },
      { pageUrl: 'https://example.test/competitions/world-cup/2026/', name: '2026 FIFA World Cup' },
    );
    expect(event.competitor).toBeUndefined();
  });
});

describe('buildCountryRecordsItemList', () => {
  const records: CountryRecord[] = [
    {
      id: 'brazil',
      displayName: 'Brazil',
      competitions: [],
      totalTitles: 5,
      totalRunnerUps: 2,
      totalSemifinals: 1,
      totalFinals: 7,
    },
    {
      id: 'spain',
      displayName: 'Spain',
      competitions: [],
      totalTitles: 1,
      totalRunnerUps: 0,
      totalSemifinals: 0,
      totalFinals: 1,
    },
  ];

  it('produces one ranked ListItem per team, singular/plural handled by the default description', () => {
    const itemList = buildCountryRecordsItemList(records, {
      pageUrl: 'https://example.test/compare/',
      name: 'All national teams',
    });

    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.url).toBe('https://example.test/compare/');
    expect(itemList.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'Brazil',
          description:
            '5 titles, 2 runner-up finishes, 7 finals reached across the World Cup, EURO, Copa América and Nations League',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Thing',
          name: 'Spain',
          description:
            '1 title, 0 runner-up finishes, 1 final reached across the World Cup, EURO, Copa América and Nations League',
        },
      },
    ]);
  });

  it('uses the singular "runner-up finish" when totalRunnerUps is exactly 1', () => {
    // The two fixture records above only ever hit 2 (plural) or 0 (also
    // plural) runner-up finishes, never exactly 1 - this is the default
    // description's one remaining singular/plural pair without its own case.
    const oneRunnerUp: CountryRecord[] = [
      {
        id: 'croatia',
        displayName: 'Croatia',
        competitions: [],
        totalTitles: 0,
        totalRunnerUps: 1,
        totalSemifinals: 0,
        totalFinals: 1,
      },
    ];
    const itemList = buildCountryRecordsItemList(oneRunnerUp, {
      pageUrl: 'https://example.test/compare/',
      name: 'All national teams',
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe(
      '0 titles, 1 runner-up finish, 1 final reached across the World Cup, EURO, Copa América and Nations League',
    );
  });

  it('supports a describe() override for a translated page', () => {
    const itemList = buildCountryRecordsItemList(records, {
      pageUrl: 'https://example.test/hr/compare/',
      name: 'Sve reprezentacije',
      describe: (record) => `${record.totalTitles} naslova`,
    });

    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('5 naslova');
  });
});

describe('buildRivalriesItemList', () => {
  const mostRecentMeeting: FinalsMeeting = {
    competition: 'Copa América',
    slug: 'copa-america',
    year: '2024',
    yearSort: 2024,
    winnerId: 'argentina',
    winnerName: 'Argentina',
    runnerUpId: 'colombia',
    runnerUpName: 'Colombia',
  };
  const rivalries: Rivalry[] = [
    {
      teamAId: 'argentina',
      teamADisplayName: 'Argentina',
      teamBId: 'uruguay',
      teamBDisplayName: 'Uruguay',
      meetings: 15,
      teamAWins: 6,
      teamBWins: 9,
      competitions: ['Copa América', 'FIFA World Cup'],
      mostRecent: mostRecentMeeting,
    },
  ];

  it('produces one ranked ListItem per rivalry, named "Team A vs Team B"', () => {
    const itemList = buildRivalriesItemList(rivalries, {
      pageUrl: 'https://example.test/records/',
      name: 'Fiercest rivalries',
    });

    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.name).toBe('Fiercest rivalries');
    expect(itemList.url).toBe('https://example.test/records/');
    expect(itemList.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'Argentina vs Uruguay',
          description:
            '15 meetings (Argentina 6, Uruguay 9) across Copa América, FIFA World Cup, most recently 2024 (Copa América)',
        },
      },
    ]);
  });

  it('uses the singular "meeting" wording for a hypothetical exactly-one-meeting rivalry', () => {
    const oneMeeting: Rivalry[] = [{ ...rivalries[0], meetings: 1 }];
    const itemList = buildRivalriesItemList(oneMeeting, {
      pageUrl: 'https://example.test/records/',
      name: 'Fiercest rivalries',
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toContain('1 meeting (');
    expect(first.item.description).not.toContain('1 meetings');
  });

  it('supports a describe() override for a translated page', () => {
    const itemList = buildRivalriesItemList(rivalries, {
      pageUrl: 'https://example.test/hr/records/',
      name: 'Najveći rivaliteti',
      describe: (r) => `${r.meetings} susreta`,
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('15 susreta');
  });

  it('returns an empty itemListElement for no qualifying rivalries', () => {
    const itemList = buildRivalriesItemList([], {
      pageUrl: 'https://example.test/records/',
      name: 'Fiercest rivalries',
    });
    expect(itemList.itemListElement).toEqual([]);
  });
});

describe('buildTeamProfileItemList', () => {
  const profile: TeamProfile = {
    id: 'germany',
    displayName: 'Germany',
    competitions: [
      {
        title: 'FIFA World Cup',
        slug: 'world-cup',
        appearances: [
          { year: '1954', yearSort: 1954, role: 'Champion' },
          { year: '1974', yearSort: 1974, role: 'Champion' },
          { year: '2014', yearSort: 2014, role: 'Champion' },
        ],
      },
      {
        title: 'UEFA EURO',
        slug: 'euro',
        appearances: [{ year: '2016', yearSort: 2016, role: 'Other semifinalist' }],
      },
    ],
    totalTitles: 3,
    totalRunnerUps: 0,
    totalSemifinals: 1,
    totalFinals: 3,
  };

  it('produces one ranked ListItem per competition the team appears in, named after that competition', () => {
    const itemList = buildTeamProfileItemList(profile, {
      pageUrl: 'https://example.test/teams/germany/',
      name: 'Germany - competition appearances',
    });

    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.name).toBe('Germany - competition appearances');
    expect(itemList.url).toBe('https://example.test/teams/germany/');
    expect(itemList.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'FIFA World Cup',
          description: 'Champion (1954), Champion (1974), Champion (2014)',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Thing',
          name: 'UEFA EURO',
          description: 'Other semifinalist (2016)',
        },
      },
    ]);
  });

  it('preserves the exact source column label for a runner-up finish rather than inventing generic wording', () => {
    const runnerUp: TeamProfile = {
      ...profile,
      competitions: [
        {
          title: 'Copa América',
          slug: 'copa-america',
          appearances: [{ year: '2024', yearSort: 2024, role: 'Runner-up' }],
        },
      ],
    };
    const itemList = buildTeamProfileItemList(runnerUp, {
      pageUrl: 'https://example.test/teams/colombia/',
      name: 'Colombia - competition appearances',
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('Runner-up (2024)');
  });

  it('supports a describe() override for a translated page', () => {
    const itemList = buildTeamProfileItemList(profile, {
      pageUrl: 'https://example.test/hr/teams/germany/',
      name: 'Njemačka - nastupi u natjecanjima',
      describe: (c) => `${c.appearances.length} nastupa`,
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('3 nastupa');
  });

  it('returns an empty itemListElement for a team with no tracked competition appearances', () => {
    const empty: TeamProfile = { ...profile, competitions: [] };
    const itemList = buildTeamProfileItemList(empty, {
      pageUrl: 'https://example.test/teams/nowhere/',
      name: 'Nowhere - competition appearances',
    });
    expect(itemList.itemListElement).toEqual([]);
  });
});

describe('buildPlayerProfileItemList', () => {
  const profile: PlayerProfile = {
    id: 'Gerd Müller',
    displayName: 'Gerd Müller',
    awards: [
      {
        title: "Ballon d'Or",
        slug: 'ballon-dor',
        appearances: [{ year: '1970', yearSort: 1970, detail: 'West Germany · 29 December 1970' }],
      },
      {
        title: 'FIFA World Cup Golden Boot',
        slug: 'golden-boot',
        appearances: [{ year: '1970', yearSort: 1970, detail: 'West Germany · 10 goals' }],
      },
    ],
    totalAwards: 2,
  };

  it('produces one ranked ListItem per award the player has won, named after that award', () => {
    const itemList = buildPlayerProfileItemList(profile, {
      pageUrl: 'https://example.test/players/gerd-muller/',
      name: 'Gerd Müller - full award history',
    });

    expect(itemList['@type']).toBe('ItemList');
    expect(itemList.name).toBe('Gerd Müller - full award history');
    expect(itemList.url).toBe('https://example.test/players/gerd-muller/');
    expect(itemList.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: "Ballon d'Or",
          description: '1970 (West Germany · 29 December 1970)',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Thing',
          name: 'FIFA World Cup Golden Boot',
          description: '1970 (West Germany · 10 goals)',
        },
      },
    ]);
  });

  it('omits the parenthetical when an appearance has no detail string', () => {
    const noDetail: PlayerProfile = {
      ...profile,
      awards: [
        {
          title: "Ballon d'Or",
          slug: 'ballon-dor',
          appearances: [{ year: '1970', yearSort: 1970, detail: '' }],
        },
      ],
    };
    const itemList = buildPlayerProfileItemList(noDetail, {
      pageUrl: 'https://example.test/players/x/',
      name: 'X',
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('1970');
  });

  it('supports a describe() override for a translated page', () => {
    const itemList = buildPlayerProfileItemList(profile, {
      pageUrl: 'https://example.test/hr/players/gerd-muller/',
      name: 'Gerd Müller - cjelovita povijest nagrada',
      describe: (a) => `${a.appearances.length} osvajanja`,
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('1 osvajanja');
  });

  it('returns an empty itemListElement for a player with no awards', () => {
    const empty: PlayerProfile = { ...profile, awards: [], totalAwards: 0 };
    const itemList = buildPlayerProfileItemList(empty, {
      pageUrl: 'https://example.test/players/nobody/',
      name: 'Nobody',
    });
    expect(itemList.itemListElement).toEqual([]);
  });
});

describe('buildPlayersDirectoryItemList', () => {
  const profiles: PlayerProfile[] = [
    { id: 'A', displayName: 'A', awards: [], totalAwards: 3 },
    { id: 'B', displayName: 'B', awards: [], totalAwards: 1 },
  ];

  it('produces one ranked ListItem per player, describing their combined award count', () => {
    const itemList = buildPlayersDirectoryItemList(profiles, {
      pageUrl: 'https://example.test/players/',
      name: 'Players directory',
    });
    expect(itemList['@type']).toBe('ItemList');
    const items = itemList.itemListElement as { position: number; item: { name: string; description: string } }[];
    expect(items[0].item.name).toBe('A');
    expect(items[0].item.description).toContain('3 awards');
    expect(items[1].item.description).toContain('1 award');
    expect(items[1].item.description).not.toContain('1 awards');
  });

  it('supports a describe() override for the Croatian directory', () => {
    const itemList = buildPlayersDirectoryItemList(profiles, {
      pageUrl: 'https://example.test/hr/players/',
      name: 'Popis igrača',
      describe: (p) => `${p.totalAwards} nagrada`,
    });
    const [first] = itemList.itemListElement as { item: { description: string } }[];
    expect(first.item.description).toBe('3 nagrada');
  });
});

describe('buildQuizJsonLd', () => {
  const questions: QuizQuestion[] = [
    {
      id: 'q1',
      category: 'Champion',
      prompt: 'Who won the 2018 FIFA World Cup?',
      choices: ['France', 'Croatia', 'Belgium', 'England'],
      answerIndex: 0,
    },
    {
      id: 'q2',
      category: 'Host',
      prompt: 'Which country hosted the 2016 UEFA EURO?',
      choices: ['Germany', 'France'],
      answerIndex: 1,
    },
  ];

  it('builds a Quiz with one Question/acceptedAnswer per multiple-choice question', () => {
    const quiz = buildQuizJsonLd(questions, {
      pageUrl: 'https://example.test/quiz/',
      name: 'Family Quiz',
    });

    expect(quiz['@type']).toBe('Quiz');
    expect(quiz.url).toBe('https://example.test/quiz/');
    expect(quiz.hasPart).toEqual([
      {
        '@type': 'Question',
        name: 'Who won the 2018 FIFA World Cup?',
        acceptedAnswer: { '@type': 'Answer', text: 'France' },
      },
      {
        '@type': 'Question',
        name: 'Which country hosted the 2016 UEFA EURO?',
        acceptedAnswer: { '@type': 'Answer', text: 'France' },
      },
    ]);
  });

  it('returns an empty hasPart for an empty question list', () => {
    const quiz = buildQuizJsonLd([], { pageUrl: 'https://example.test/quiz/', name: 'Family Quiz' });
    expect(quiz.hasPart).toEqual([]);
  });
});

describe('buildDefinedTermSet', () => {
  it('builds a DefinedTermSet with one DefinedTerm per glossary entry, each pointing back at the set', () => {
    const termSet = buildDefinedTermSet(
      [
        { term: 'a.e.t.', definition: 'Short for after extra time.' },
        { term: 'pens', definition: 'Short for a penalty shoot-out.' },
      ],
      { pageUrl: 'https://example.test/glossary/', name: 'Glossary' },
    );

    expect(termSet).toEqual({
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'Glossary',
      url: 'https://example.test/glossary/',
      hasDefinedTerm: [
        {
          '@type': 'DefinedTerm',
          name: 'a.e.t.',
          description: 'Short for after extra time.',
          inDefinedTermSet: 'https://example.test/glossary/',
        },
        {
          '@type': 'DefinedTerm',
          name: 'pens',
          description: 'Short for a penalty shoot-out.',
          inDefinedTermSet: 'https://example.test/glossary/',
        },
      ],
    });
  });

  it('returns an empty hasDefinedTerm for an empty entry list', () => {
    const termSet = buildDefinedTermSet([], { pageUrl: 'https://example.test/glossary/', name: 'Glossary' });
    expect(termSet.hasDefinedTerm).toEqual([]);
  });
});

describe('buildWebSiteJsonLd', () => {
  it('builds a WebSite block with the schema.org context/type and every field passed through verbatim', () => {
    const website = buildWebSiteJsonLd({
      url: 'https://example.test/',
      name: 'The Ultimate Football Reference',
      description: 'A family-friendly guide to football history.',
      inLanguage: 'en',
    });

    expect(website).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'The Ultimate Football Reference',
      url: 'https://example.test/',
      description: 'A family-friendly guide to football history.',
      inLanguage: 'en',
    });
  });

  it('supports a non-English inLanguage tag for the Croatian home page', () => {
    const website = buildWebSiteJsonLd({
      url: 'https://example.test/hr/',
      name: 'The Ultimate Football Reference',
      description: 'Nogometna povijest na jednom mjestu.',
      inLanguage: 'hr',
    });

    expect(website.inLanguage).toBe('hr');
  });
});
