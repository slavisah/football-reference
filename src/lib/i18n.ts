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
  brand: { en: 'Football Reference', hr: 'Football Reference' },
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
} as const;

export type UiStringKey = keyof typeof UI_STRINGS;

export function t(locale: Locale, key: UiStringKey): string {
  return UI_STRINGS[key][locale];
}

/** Paths (as passed to withBase) that currently have a Croatian translation. */
export const TRANSLATED_PATHS: Record<string, string> = {
  '/': '/hr/',
};

/** The other language's equivalent path for the current one, if translated, else null. */
export function alternatePath(currentPath: string, currentLocale: Locale): string | null {
  if (currentLocale === 'en') {
    return TRANSLATED_PATHS[currentPath] ?? null;
  }
  const enPath = Object.entries(TRANSLATED_PATHS).find(([, hr]) => hr === currentPath)?.[0];
  return enPath ?? null;
}
