import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { NAV_LINKS } from '../lib/routes';
import { TRANSLATED_PATHS } from '../lib/i18n';
import { withBase } from '../lib/url';

export const prerender = true;

// path -> content collection id, purely to read `lastReviewed` for <lastmod>.
// Every entry mirrors the loadCompetition/loadPageMeta id each page already
// calls (see docs/ADDING_CONTENT.md section 7), so this can't drift from what
// a page actually shows without also breaking that page's own build.
const CONTENT_ID_BY_PATH: Record<string, string> = {
  '/': 'index',
  '/competitions/world-cup': 'fifa-world-cup',
  '/competitions/euro': 'uefa-euro',
  '/competitions/nations-league': 'uefa-nations-league',
  '/competitions/copa-america': 'copa-america',
  '/competitions/ballon-dor': 'ballon-dor',
  '/competitions/golden-boot': 'golden-boot',
  '/records': 'records-and-timelines',
  '/compare': 'compare-countries',
  '/quiz': 'quiz',
  '/about/sources': 'about-sources',
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// A sitemap generated at build time, one <url> per locale of every live page,
// each carrying an xhtml:link back to its translation - so it stays in lock
// step with NAV_LINKS/TRANSLATED_PATHS (src/lib/routes.ts, src/lib/i18n.ts)
// the same way the nav and the offline precache list already do, rather than
// being a hand-maintained list that can silently go stale.
export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? url;
  const absolute = (path: string) => new URL(withBase(path), origin).toString();

  const urlEntries: string[] = [];

  for (const { path: enPath } of NAV_LINKS) {
    const hrPath = TRANSLATED_PATHS[enPath];
    const contentId = CONTENT_ID_BY_PATH[enPath];
    const entry = contentId ? await getEntry('pages', contentId) : undefined;
    const lastmod = entry?.data.lastReviewed;

    const locales: { path: string; lang: 'en' | 'hr' }[] = hrPath
      ? [
          { path: enPath, lang: 'en' },
          { path: hrPath, lang: 'hr' },
        ]
      : [{ path: enPath, lang: 'en' }];

    for (const { path } of locales) {
      const loc = absolute(path);
      const altLinks = hrPath
        ? [
            `<xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(absolute(enPath))}" />`,
            `<xhtml:link rel="alternate" hreflang="hr" href="${xmlEscape(absolute(hrPath))}" />`,
          ].join('')
        : '';
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      urlEntries.push(`<url><loc>${xmlEscape(loc)}</loc>${lastmodTag}${altLinks}</url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
