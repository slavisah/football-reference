// Minimal, additive i18n support. English remains the default and only
// language everywhere except the pages listed in TRANSLATED_PATHS below; every
// component that takes a `locale` prop defaults to 'en' so untouched pages
// render byte-identical output to before this file existed. See
// docs/PROJECT_STATUS.md for the localization rollout plan - this is a first
// vertical slice (shared chrome + the home page), not full-site localization.

export type Locale = 'en' | 'hr';

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALES: { code: Locale; label: string; htmlLang: string }[] = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'hr', label: 'Hrvatski', htmlLang: 'hr' },
];

/** Shared chrome strings (nav brand, skip link, footer, theme toggle, language switcher). */
const UI_STRINGS = {
  skipToContent: { en: 'Skip to main content', hr: 'Preskoči na sadržaj' },
  primaryNav: { en: 'Primary', hr: 'Glavna navigacija' },
  menuLabel: { en: 'Menu', hr: 'Izbornik' },
  menuOpenLabel: { en: 'Open the menu', hr: 'Otvori izbornik' },
  menuCloseLabel: { en: 'Close the menu', hr: 'Zatvori izbornik' },
  brand: { en: 'Football Reference', hr: 'Football Reference' },
  homeBreadcrumb: { en: 'Home', hr: 'Početna' },
  breadcrumbNavLabel: { en: 'Breadcrumb', hr: 'Navigacijski put' },
  footerTagline: {
    en: 'The Ultimate Football Reference · a family-friendly, source-conscious history project. Content is the editorial source of truth; historical team names are preserved.',
    hr: 'The Ultimate Football Reference · obiteljski prijateljski projekt povijesti nogometa s naglaskom na izvore. Sadržaj je uređivački izvor istine; povijesni nazivi reprezentacija su sačuvani.',
  },
  footerCopyright: {
    en: 'No tournament logos, betting content, ads, or trackers.',
    hr: 'Bez logotipa natjecanja, sadržaja klađenja, oglasa ili praćenja.',
  },
  footerSourcesLink: { en: 'Sources & review policy', hr: 'Izvori i pravila provjere' },
  switchLanguageTo: { en: 'Hrvatski', hr: 'English' },
  themeToggleAriaLabel: {
    en: 'Switch between light and dark theme',
    hr: 'Promijeni između svijetle i tamne teme',
  },
  themeLabel: { en: 'Theme', hr: 'Tema' },
  themeLight: { en: 'Light', hr: 'Svijetla' },
  themeDark: { en: 'Dark', hr: 'Tamna' },
  quizEyebrow: {
    en: 'Generated from the competition tables',
    hr: 'Generirano iz tablica natjecanja',
  },
  quizScoreLabel: { en: 'Score:', hr: 'Rezultat:' },
  quizRestart: { en: 'Restart quiz', hr: 'Ponovno pokreni kviz' },
  quizCheckAnswer: { en: 'Check answer', hr: 'Provjeri odgovor' },
  quizJustShowAnswer: { en: 'Just show me the answer', hr: 'Samo mi pokaži odgovor' },
  quizCorrect: { en: 'Correct!', hr: 'Točno!' },
  quizIncorrectPrefix: { en: 'Not quite - the answer is "', hr: 'Netočno - odgovor je "' },
  quizIncorrectSuffix: { en: '".', hr: '".' },
  quizAnswerCorrectLabel: { en: '✓ correct', hr: '✓ točno' },
  quizAnswerIncorrectLabel: { en: '✗ your answer', hr: '✗ tvoj odgovor' },
  quizOrderResultCorrectLabel: { en: '✓ correct spot', hr: '✓ točno mjesto' },
  quizOrderResultIncorrectLabel: { en: '✗ wrong spot', hr: '✗ krivo mjesto' },
  quizOrderHeading: { en: 'Champion order challenge', hr: 'Izazov: poredaj prvake' },
  quizOrderIntro: {
    en: 'Rank each champion below from earliest to latest, then press "Check order".',
    hr: 'Poredaj svakog prvaka od najranijeg do najnovijeg, zatim pritisni "Provjeri redoslijed".',
  },
  quizCheckOrder: { en: 'Check order', hr: 'Provjeri redoslijed' },
  quizOrderCorrect: { en: 'Correct order!', hr: 'Točan redoslijed!' },
  quizOrderIncorrect: {
    en: 'Not quite - highlighted items are out of place.',
    hr: 'Netočno - označene stavke nisu na pravom mjestu.',
  },
  quizRankPlaceholder: { en: 'Rank...', hr: 'Poredak...' },
  quizOrderDuplicateRank: {
    en: 'Each rank can only be used once - two items currently share a number.',
    hr: 'Svaki broj poretka smije se koristiti samo jednom - dvije stavke trenutačno dijele isti broj.',
  },
  sortOldestFirst: { en: '(oldest first)', hr: '(najstariji prvi)' },
  sortNewestFirst: { en: '(newest first)', hr: '(najnoviji prvi)' },
  sortFewestFirst: { en: '(fewest first)', hr: '(najmanje prvo)' },
  sortMostFirst: { en: '(most first)', hr: '(najviše prvo)' },
  sortAZ: { en: '(A–Z)', hr: '(A–Ž)' },
  sortZA: { en: '(Z–A)', hr: '(Ž–A)' },
  onThisDayHeading: {
    en: 'On this day in football history',
    hr: 'Na današnji dan u povijesti nogometa',
  },
  onThisDayHint: {
    en: "No final was played on this exact date - here's one from the archive instead.",
    hr: 'Na ovaj točan datum nije odigrano finale - evo jednog iz arhive.',
  },
  onThisDayEmpty: { en: 'No final dates on record yet.', hr: 'Još nema zabilježenih datuma finala.' },
  championsBarOfLabel: { en: 'of', hr: 'od' },
  teamSearchLabel: { en: 'Find a team', hr: 'Pronađi reprezentaciju' },
  teamSearchPlaceholder: { en: 'Find a team…', hr: 'Pronađi reprezentaciju…' },
  teamSearchNoResults: {
    en: 'No teams match “{query}”.',
    hr: 'Nijedna reprezentacija ne odgovara upitu „{query}”.',
  },
  teamSearchLoading: { en: 'Loading teams…', hr: 'Učitavanje reprezentacija…' },
  teamSearchError: {
    en: 'Team list unavailable right now.',
    hr: 'Popis reprezentacija trenutno nije dostupan.',
  },
  playerSearchLabel: { en: 'Find a player', hr: 'Pronađi igrača' },
  playerSearchPlaceholder: { en: 'Find a player…', hr: 'Pronađi igrača…' },
  playerSearchNoResults: {
    en: 'No players match “{query}”.',
    hr: 'Nijedan igrač ne odgovara upitu „{query}”.',
  },
  playerSearchLoading: { en: 'Loading players…', hr: 'Učitavanje igrača…' },
  playerSearchError: {
    en: 'Player list unavailable right now.',
    hr: 'Popis igrača trenutno nije dostupan.',
  },
} as const;

export type UiStringKey = keyof typeof UI_STRINGS;

export function t(locale: Locale, key: UiStringKey): string {
  return UI_STRINGS[key][locale];
}

/** Paths (as passed to withBase) that currently have a Croatian translation. */
export const TRANSLATED_PATHS: Record<string, string> = {
  '/': '/hr/',
  '/about/sources': '/hr/about/sources',
  '/records': '/hr/records',
  '/compare': '/hr/compare',
  '/teams': '/hr/teams',
  '/players': '/hr/players',
  '/compare-players': '/hr/compare-players',
  '/quiz': '/hr/quiz',
  '/glossary': '/hr/glossary',
  '/competitions/copa-america': '/hr/competitions/copa-america',
  '/competitions/nations-league': '/hr/competitions/nations-league',
  '/competitions/ballon-dor': '/hr/competitions/ballon-dor',
  '/competitions/world-cup': '/hr/competitions/world-cup',
  '/competitions/euro': '/hr/competitions/euro',
  '/competitions/golden-boot': '/hr/competitions/golden-boot',
};

/** The other language's equivalent path for the current one, if translated, else null. */
export function alternatePath(currentPath: string, currentLocale: Locale): string | null {
  if (currentLocale === 'en') {
    return TRANSLATED_PATHS[currentPath] ?? null;
  }
  const enPath = Object.entries(TRANSLATED_PATHS).find(([, hr]) => hr === currentPath)?.[0];
  return enPath ?? null;
}
