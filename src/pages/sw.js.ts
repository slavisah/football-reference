import type { APIRoute } from 'astro';
import { buildPrecacheUrls } from '../lib/offlineCache';

export const prerender = true;

// Bump this when the precache list or fetch strategy changes, so the
// activate handler evicts the old cache instead of leaving stale pages
// behind forever. Plain string, not a build timestamp, so rebuilds without
// a real change don't force every visitor to re-download everything.
const CACHE_VERSION = 'v1';

// A tiny offline-reading service worker, generated at build time so it can
// bake in the real BASE_PATH (see astro.config.mjs) and the current nav
// page list (src/lib/routes.ts) rather than hard-coding them twice.
//
// Strategy: HTML navigations are network-first (so a visitor with a
// connection always sees the latest content) falling back to the cache,
// then the cached home page, when offline. Everything else (CSS, images,
// the manifest) is cache-first, filled in as pages are visited, so a
// reader who has opened a page once can reopen it offline later.
export const GET: APIRoute = () => {
  const precacheUrls = buildPrecacheUrls(import.meta.env.BASE_URL);
  // The home page is always the first precached URL (see buildPrecacheUrls) -
  // reuse it rather than re-deriving it, so this can never drift out of sync
  // with what actually got cached under this exact base path.
  const homeUrl = precacheUrls[0];

  const script = `// Generated at build time from src/pages/sw.js.ts - do not edit by hand.
const CACHE_NAME = 'football-reference-${CACHE_VERSION}';
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};
const HOME_URL = ${JSON.stringify(homeUrl)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
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
        .catch(() => caches.match(request).then((cached) => cached || caches.match(HOME_URL)))
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
