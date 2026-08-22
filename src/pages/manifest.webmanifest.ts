import type { APIRoute } from 'astro';
import { buildManifest } from '../lib/manifest';

export const prerender = true;

// A static web app manifest, generated at build time so its start_url/scope
// and icon paths pick up the repository-agnostic BASE_PATH (see
// astro.config.mjs) rather than being hand-written for one deployment.
// The Croatian equivalent lives at src/pages/hr/manifest.webmanifest.ts;
// both share their field construction via src/lib/manifest.ts.
export const GET: APIRoute = () => {
  return new Response(JSON.stringify(buildManifest('en'), null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
