import { loadCompetition, type CompetitionData } from './competition';
import { withBase } from './url';
import type { Locale } from './i18n';

// Shared between the English and Croatian home pages so both always show the
// exact same numbers (editions count, top champion, title count) pulled from
// the same source tables - only the surrounding prose is locale-specific.

export type HomeCompetitions = {
  worldCup: CompetitionData;
  euro: CompetitionData;
  copaAmerica: CompetitionData;
  nationsLeague: CompetitionData;
  ballonDor: CompetitionData;
  goldenBoot: CompetitionData;
};

export async function loadHomeCompetitions(): Promise<HomeCompetitions> {
  const [worldCup, euro, copaAmerica, nationsLeague, ballonDor, goldenBoot] =
    await Promise.all([
      loadCompetition('fifa-world-cup', {
        editionsHeading: 'Editions',
        sourcesHeading: 'FIFA World Cup',
      }),
      loadCompetition('uefa-euro', {
        editionsHeading: 'Editions',
        sourcesHeading: 'UEFA EURO',
      }),
      loadCompetition('copa-america', {
        editionsHeading: 'Champions timeline',
        sourcesHeading: 'Copa América',
        allowDuplicateYears: ['1959'],
      }),
      loadCompetition('uefa-nations-league', {
        editionsHeading: 'Finals',
        sourcesHeading: 'UEFA Nations League',
      }),
      loadCompetition('ballon-dor', {
        editionsHeading: 'Winners',
        sourcesHeading: "Ballon d'Or",
      }),
      loadCompetition('golden-boot', {
        editionsHeading: 'FIFA World Cup top scorers',
        sourcesHeading: 'FIFA World Cup',
      }),
    ]);
  return { worldCup, euro, copaAmerica, nationsLeague, ballonDor, goldenBoot };
}

export type HomeCard = {
  href: string;
  title: string;
  blurb: string;
  editions: number;
  topChampion: CompetitionData['champions'][number] | undefined;
  statLabel?: string;
  accent: string;
  icon: string;
};

type CardKey = keyof HomeCompetitions;

const CARD_META: { key: CardKey; path: string; accent: string; icon: string }[] = [
  { key: 'worldCup', path: '/competitions/world-cup', accent: '#1f6f4f', icon: '🌍' },
  { key: 'euro', path: '/competitions/euro', accent: '#2f5fa8', icon: '🏟️' },
  { key: 'copaAmerica', path: '/competitions/copa-america', accent: '#c98a1f', icon: '🌎' },
  { key: 'nationsLeague', path: '/competitions/nations-league', accent: '#6b4fa0', icon: '🎖️' },
  { key: 'ballonDor', path: '/competitions/ballon-dor', accent: '#b8912a', icon: '🥇' },
  { key: 'goldenBoot', path: '/competitions/golden-boot', accent: '#a83e3e', icon: '👟' },
];

type CardText = { title: string; blurb: string; statLabel?: string };

const CARD_TEXT: Record<Locale, Record<CardKey, CardText>> = {
  en: {
    worldCup: {
      title: 'FIFA World Cup',
      blurb: 'From Uruguay 1930 to 2026 - hosts, finalists and champions.',
    },
    euro: {
      title: 'UEFA European Championship',
      blurb: 'From the 1960 Nations’ Cup to EURO 2024 across Europe.',
    },
    copaAmerica: {
      title: 'Copa América',
      blurb: 'From 1916 to today - the oldest international football title.',
    },
    nationsLeague: {
      title: 'UEFA Nations League',
      blurb: "Europe's newest national-team competition, since 2018-19.",
    },
    ballonDor: {
      title: "Men's Ballon d'Or",
      blurb: "Football's top individual award, awarded since 1956.",
      statLabel: 'Most awards',
    },
    goldenBoot: {
      title: 'Golden Boot',
      blurb: 'World Cup and EURO top-scorer awards, tournament by tournament.',
      statLabel: 'Most awards',
    },
  },
  hr: {
    worldCup: {
      title: 'FIFA Svjetsko prvenstvo',
      blurb: 'Od Urugvaja 1930. do 2026. - domaćini, finalisti i prvaci.',
    },
    euro: {
      title: 'UEFA Europsko prvenstvo',
      blurb: 'Od Kupa nacija 1960. do EURA 2024. diljem Europe.',
    },
    copaAmerica: {
      title: 'Copa América',
      blurb: 'Od 1916. do danas - najstariji naslov u međunarodnom nogometu.',
    },
    nationsLeague: {
      title: 'UEFA Liga nacija',
      blurb: 'Najnovije natjecanje europskih reprezentacija, od sezone 2018-19.',
    },
    ballonDor: {
      title: "Zlatna lopta",
      blurb: 'Najveća pojedinačna nagrada u nogometu, dodjeljuje se od 1956.',
      statLabel: 'Najviše nagrada',
    },
    goldenBoot: {
      title: 'Zlatna kopačka',
      blurb: 'Nagrade za najboljeg strijelca Svjetskog prvenstva i EURA, po izdanjima.',
      statLabel: 'Najviše nagrada',
    },
  },
};

export function buildHomeCards(locale: Locale, data: HomeCompetitions): HomeCard[] {
  return CARD_META.map(({ key, path, accent, icon }) => {
    const competition = data[key];
    const text = CARD_TEXT[locale][key];
    return {
      href: withBase(path),
      title: text.title,
      blurb: text.blurb,
      editions: competition.editions.length,
      topChampion: competition.champions[0],
      statLabel: text.statLabel,
      accent,
      icon,
    };
  });
}
