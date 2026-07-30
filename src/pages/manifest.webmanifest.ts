import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const prerender = true;

// A static web app manifest, generated at build time so its start_url/scope
// and icon paths pick up the repository-agnostic BASE_PATH (see
// astro.config.mjs) rather than being hand-written for one deployment.
export const GET: APIRoute = () => {
  const manifest = {
    name: 'The Ultimate Football Reference',
    short_name: 'Football Reference',
    description:
      "A family-friendly, offline-readable reference for the FIFA World Cup, UEFA EURO, Copa America, Nations League, Ballon d'Or and Golden Boot history.",
    start_url: withBase('/'),
    scope: withBase('/'),
    id: withBase('/'),
    display: 'standalone',
    background_color: '#f7f8fa',
    theme_color: '#1f6f4f',
    lang: 'en',
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

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
