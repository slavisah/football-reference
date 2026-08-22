import { withBase } from './url';
import type { Locale } from './i18n';

// Single source of truth for both web app manifests (src/pages/manifest.webmanifest.ts
// for English, src/pages/hr/manifest.webmanifest.ts for Croatian) - name/short_name/
// icons/theme stay identical (the brand name is intentionally untranslated everywhere
// else on the site, e.g. i18n.ts's UI_STRINGS.brand), only description/start_url/id/lang
// differ per locale. Before this, both locales served the single English manifest: a
// Croatian reader installing the PWA from an /hr/ page got an app that always launched
// to the English home page and reported itself as English to the OS (lang: 'en') - the
// same "reader silently dropped back into English" bug class as the nav aria-label and
// PDF downloads had, just in the install/launch path instead of a visible page.
const DESCRIPTIONS: Record<Locale, string> = {
  en: "A family-friendly, offline-readable reference for the FIFA World Cup, UEFA EURO, Copa America, Nations League, Ballon d'Or and Golden Boot history.",
  hr: 'Obiteljski prijateljski, offline dostupan pregled povijesti Svjetskog prvenstva, UEFA EURO-a, Copa América, Lige nacija, Zlatne lopte i Zlatne kopačke.',
};

export function buildManifest(locale: Locale) {
  const startUrl = withBase(locale === 'hr' ? '/hr/' : '/');

  return {
    name: 'The Ultimate Football Reference',
    short_name: 'Football Reference',
    description: DESCRIPTIONS[locale],
    start_url: startUrl,
    // Shared scope across both locales (not scoped to /hr/) so a reader who
    // switches language from inside the installed app via the lang-switch
    // link stays in standalone display mode instead of breaking out to the
    // browser - it's one app with two launch languages, not two apps.
    scope: withBase('/'),
    id: startUrl,
    display: 'standalone' as const,
    background_color: '#f7f8fa',
    theme_color: '#1f6f4f',
    lang: locale,
    icons: [
      { src: withBase('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBase('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: withBase('/icons/icon-maskable-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: withBase('/icons/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
