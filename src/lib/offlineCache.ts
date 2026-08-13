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
