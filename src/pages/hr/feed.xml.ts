import type { APIRoute } from 'astro';
import { withBase } from '../../lib/url';
import { t, TRANSLATED_PATHS } from '../../lib/i18n';
import { loadFeedEntries } from '../../lib/contentPages';
import { buildAtomFeed } from '../../lib/feed';

export const prerender = true;

// Croatian Atom feed - see src/pages/feed.xml.ts (the English equivalent)
// for why this exists as a separate file rather than one shared feed for
// both locales (same reasoning as src/pages/hr/manifest.webmanifest.ts).
export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? url;
  // Every entry's `path` is the English NAV_LINKS path loadFeedEntries()
  // reads it from (see contentPages.ts); TRANSLATED_PATHS - the same lookup
  // sitemap.xml.ts/Nav.astro use - resolves each to its Croatian URL rather
  // than re-deriving the "/hr" + path transform here a second time.
  const absolute = (path: string) => {
    const hrPath = TRANSLATED_PATHS[path] ?? `/hr${path}`;
    const withSlash = hrPath.endsWith('/') ? hrPath : `${hrPath}/`;
    return new URL(withBase(withSlash), origin).toString();
  };
  const feedUrl = new URL(withBase('/hr/feed.xml'), origin).toString();

  const xml = buildAtomFeed(await loadFeedEntries('hr'), {
    feedUrl,
    siteUrl: absolute('/'),
    title: t('hr', 'feedTitle'),
    absolute,
  });

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
