import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const prerender = true;

// Generated at build time (like manifest.webmanifest.ts/sw.js.ts) so the
// Sitemap: line always points at the real, repo-agnostic deployment URL
// (SITE_URL/BASE_PATH from astro.config.mjs) instead of a hand-written one.
export const GET: APIRoute = ({ site, url }) => {
  const origin = site ?? url;
  const sitemapUrl = new URL(withBase('/sitemap.xml'), origin).toString();
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
