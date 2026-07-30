import { NAV_LINKS } from './routes';

// Static, non-page assets the service worker precaches alongside every nav
// page. Kept separate from NAV_LINKS since these aren't links a reader clicks.
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

/**
 * Builds the list of URLs the service worker precaches on install, given the
 * site's base path (e.g. "/football-reference/" on GitHub Pages, "/" in dev).
 * Mirrors withBase() in src/lib/url.ts, duplicated here rather than imported
 * because the service worker script is plain JS with no module resolution.
 */
export function buildPrecacheUrls(basePath: string): string[] {
  const base = basePath.replace(/\/$/, '');
  const withBase = (path: string) => `${base}${path}` || '/';

  const urls = [
    withBase('/'),
    ...NAV_LINKS.filter((link) => link.path !== '/').map((link) => withBase(link.path)),
    ...STATIC_ASSETS.map(withBase),
  ];

  return Array.from(new Set(urls));
}
