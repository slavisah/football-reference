import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';
import { t } from '../lib/i18n';
import { loadFeedEntries } from '../lib/contentPages';
import { buildAtomFeed } from '../lib/feed';

export const prerender = true;

// An Atom feed of "recently reviewed" pages, so a reader (or a feed reader)
// can follow site updates without re-checking every page's own "Last
// reviewed" date by hand. Scoped to the top-level pages NAV_LINKS/
// CONTENT_ID_BY_PATH already names - the per-team/per-player/per-edition
// pages sitemap.xml.ts also enumerates would make this noisy rather than
// useful (hundreds of entries that mostly inherit their parent competition
// page's own lastReviewed date, not independently-reviewed items), and a
// feed's whole point is surfacing genuine, distinct updates.
export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? url;
  const absolute = (path: string) => {
    const withSlash = path.endsWith('/') ? path : `${path}/`;
    return new URL(withBase(withSlash), origin).toString();
  };
  // Unlike every entry path above (real directory-format page routes, which
  // need the trailing slash `absolute()` adds), this feed document is
  // itself a literal file route - same shape as sitemap.xml/robots.txt -
  // so its own self-link is built directly rather than through `absolute()`.
  const feedUrl = new URL(withBase('/feed.xml'), origin).toString();

  const xml = buildAtomFeed(await loadFeedEntries('en'), {
    feedUrl,
    siteUrl: absolute('/'),
    title: t('en', 'feedTitle'),
    absolute,
  });

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
