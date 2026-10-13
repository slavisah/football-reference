// Pure Atom-feed building, shared by feed.xml.ts/hr/feed.xml.ts the same way
// src/pages/sitemap.xml.ts's xmlEscape/buildAltLinks helpers are shared
// across its own call sites - kept separate from the two Astro API routes so
// it can be unit-tested directly (tests/unit/feed.test.ts) without needing
// Astro's content-collection runtime.

export interface FeedEntry {
  /** Path as passed to withBase (e.g. '/competitions/world-cup'), no trailing slash. */
  path: string;
  title: string;
  summary?: string;
  /** This page's own `lastReviewed` editorial date (YYYY-MM-DD). */
  updated: string;
}

export interface BuildAtomFeedOptions {
  /** Absolute URL of this feed document itself (its own <link rel="self">/<id>). */
  feedUrl: string;
  /** Absolute URL of the site's home page in this feed's language. */
  siteUrl: string;
  title: string;
  /** Resolves a entry's `path` to an absolute URL. */
  absolute: (path: string) => string;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Atom's <updated> needs a full RFC3339 timestamp; every source date here is
// an editorial YYYY-MM-DD with no time-of-day component, so midnight UTC is
// as precise as the underlying data actually is.
function toRfc3339(isoDate: string): string {
  return `${isoDate}T00:00:00Z`;
}

/**
 * Builds a complete Atom 1.0 feed, most-recently-reviewed entry first (ties
 * broken alphabetically by title, for deterministic output run to run).
 */
export function buildAtomFeed(entries: FeedEntry[], options: BuildAtomFeedOptions): string {
  const { feedUrl, siteUrl, title, absolute } = options;
  const sorted = [...entries].sort(
    (a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title),
  );
  const feedUpdated = sorted.length > 0 ? toRfc3339(sorted[0].updated) : toRfc3339('1970-01-01');

  const entryXml = sorted.map((entry) => {
    const url = absolute(entry.path);
    const summaryTag = entry.summary
      ? `<summary>${xmlEscape(entry.summary)}</summary>`
      : '';
    return [
      '<entry>',
      `<id>${xmlEscape(url)}</id>`,
      `<title>${xmlEscape(entry.title)}</title>`,
      `<link rel="alternate" href="${xmlEscape(url)}" />`,
      `<updated>${toRfc3339(entry.updated)}</updated>`,
      summaryTag,
      '</entry>',
    ].join('');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `<id>${xmlEscape(siteUrl)}</id>`,
    `<title>${xmlEscape(title)}</title>`,
    `<updated>${feedUpdated}</updated>`,
    `<link rel="self" href="${xmlEscape(feedUrl)}" />`,
    `<link rel="alternate" href="${xmlEscape(siteUrl)}" />`,
    ...entryXml,
    '</feed>',
    '',
  ].join('\n');
}
