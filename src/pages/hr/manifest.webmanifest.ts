import type { APIRoute } from 'astro';
import { buildManifest } from '../../lib/manifest';

export const prerender = true;

// Croatian web app manifest - see src/pages/manifest.webmanifest.ts (the
// English equivalent) and src/lib/manifest.ts for why this exists as a
// separate file rather than one shared manifest for both locales.
export const GET: APIRoute = () => {
  return new Response(JSON.stringify(buildManifest('hr'), null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
