import type { APIRoute } from 'astro';
import { buildPrecacheUrls, withBasePath } from '../lib/offlineCache';
import { TRANSLATED_PATHS } from '../lib/i18n';

export const prerender = true;

// Bump this when the precache list or fetch strategy changes, so the
// activate handler evicts the old cache instead of leaving stale pages
// behind forever. Plain string, not a build timestamp, so rebuilds without
// a real change don't force every visitor to re-download everything.
const CACHE_VERSION = 'v4';

// A tiny offline-reading service worker, generated at build time so it can
// bake in the real BASE_PATH (see astro.config.mjs) and the current nav
// page list (src/lib/routes.ts) rather than hard-coding them twice.
//
// Strategy: HTML navigations are network-first (so a visitor with a
// connection always sees the latest content) falling back to the cache,
// then the cached home page for that same language, when offline.
// Everything else (CSS, images, the manifest) is cache-first, filled in as
// pages are visited, so a reader who has opened a page once can reopen it
// offline later. A reader with the browser's Save-Data preference on skips
// the eager on-install download of every nav page - see installCacheUrls()
// below and selectInstallCacheUrls() in src/lib/offlineCache.ts.
export const GET: APIRoute = () => {
  const precacheUrls = buildPrecacheUrls(import.meta.env.BASE_URL);
  // The home page is always the first precached URL (see buildPrecacheUrls) -
  // reuse it rather than re-deriving it, so this can never drift out of sync
  // with what actually got cached under this exact base path.
  const homeUrlEn = precacheUrls[0];
  const homeUrlHr = withBasePath(import.meta.env.BASE_URL, TRANSLATED_PATHS['/']);
  // The Croatian home URL's own path, minus its trailing slash, e.g.
  // "/football-reference/hr" - a prefix match against this tells a
  // navigation request's URL apart from an English one, so the offline
  // fallback below lands a Croatian reader back on the Croatian home page
  // instead of silently switching them to English.
  const hrPrefix = homeUrlHr.replace(/\/$/, '');

  const script = `// Generated at build time from src/pages/sw.js.ts - do not edit by hand.
const CACHE_NAME = 'football-reference-${CACHE_VERSION}';
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};
const HOME_URL_EN = ${JSON.stringify(homeUrlEn)};
const HOME_URL_HR = ${JSON.stringify(homeUrlHr)};
const HR_PREFIX = ${JSON.stringify(hrPrefix)};

function homeUrlFor(pathname) {
  return pathname === HR_PREFIX || pathname.startsWith(HR_PREFIX + '/') ? HOME_URL_HR : HOME_URL_EN;
}

function installCacheUrls() {
  // A reader with the browser's Save-Data preference on (metered/slow
  // connection) only gets the two home pages precached, not every nav page
  // in both languages - see selectInstallCacheUrls() in
  // src/lib/offlineCache.ts, which this mirrors. self.navigator.connection
  // is unsupported in some browsers, so this stays undefined (falsy) there,
  // the same as today's full-precache behavior.
  const saveData = Boolean(self.navigator && self.navigator.connection && self.navigator.connection.saveData);
  return saveData ? Array.from(new Set([HOME_URL_EN, HOME_URL_HR])) : PRECACHE_URLS;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(installCacheUrls()))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(homeUrlFor(url.pathname)))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
`;

  return new Response(script, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
  });
};
