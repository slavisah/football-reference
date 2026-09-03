import { NAV_LINKS } from './routes';
import { TRANSLATED_PATHS } from './i18n';

// Static, non-page assets the service worker precaches alongside every nav
// page. Kept separate from NAV_LINKS since these aren't links a reader clicks.
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/hr/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

/**
 * Prefixes `path` with the site's base path (e.g. "/football-reference" on
 * GitHub Pages, "" in dev). Mirrors withBase() in src/lib/url.ts, duplicated
 * here (rather than imported) because the service worker script is plain JS
 * with no module resolution. Exported so sw.js.ts can derive one specific
 * locale's home URL without re-deriving this same base-stripping logic.
 */
export function withBasePath(basePath: string, path: string): string {
  const base = basePath.replace(/\/$/, '');
  return `${base}${path}` || '/';
}

/**
 * Builds the list of URLs the service worker precaches on install, given the
 * site's base path. Every nav page is precached in both languages (the
 * Croatian page under its TRANSLATED_PATHS equivalent) - every NAV_LINKS
 * path has one - so a Croatian reader gets the same "already works offline"
 * guarantee an English reader gets, instead of only the pages they happen to
 * have visited online first.
 */
export function buildPrecacheUrls(basePath: string): string[] {
  const withBase = (path: string) => withBasePath(basePath, path);

  const pagePaths = NAV_LINKS.flatMap((link) => {
    const hrPath = TRANSLATED_PATHS[link.path];
    return hrPath ? [link.path, hrPath] : [link.path];
  });

  const urls = [...pagePaths.map(withBase), ...STATIC_ASSETS.map(withBase)];

  return Array.from(new Set(urls));
}

/**
 * Picks which URLs the service worker's install handler should eagerly
 * download and cache. A reader with the browser's Save-Data preference on
 * (`navigator.connection.saveData`, the Network Information API's signal for
 * "I'm on a metered or slow connection, don't fetch more than I asked for")
 * gets only the two home pages instead of every nav page in both languages -
 * everything else still gets cached the moment they actually visit it, via
 * the fetch handler's existing cache-on-read behavior, so offline reading
 * still works for anything they've opened, just not pre-downloaded for pages
 * they may never visit. `saveData` is `undefined` in every browser that
 * doesn't support the API, which this treats the same as `false` (today's
 * existing full-precache behavior), so this is purely additive.
 */
export function selectInstallCacheUrls(
  precacheUrls: string[],
  homeUrlEn: string,
  homeUrlHr: string,
  saveData: boolean | undefined,
): string[] {
  return saveData ? Array.from(new Set([homeUrlEn, homeUrlHr])) : precacheUrls;
}
