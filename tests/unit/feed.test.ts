import { describe, expect, it } from 'vitest';
import { buildAtomFeed, type FeedEntry } from '../../src/lib/feed';

const absolute = (path: string) => `https://example.com${path}/`;

describe('buildAtomFeed', () => {
  it('sorts entries most-recently-reviewed first', () => {
    const entries: FeedEntry[] = [
      { path: '/old', title: 'Old page', updated: '2026-01-01' },
      { path: '/new', title: 'New page', updated: '2026-08-15' },
      { path: '/mid', title: 'Mid page', updated: '2026-05-01' },
    ];
    const xml = buildAtomFeed(entries, {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });

    const titles = [...xml.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]);
    // First <title> is the feed's own; the rest are entries, in order.
    expect(titles.slice(1)).toEqual(['New page', 'Mid page', 'Old page']);
  });

  it('breaks ties on the same date alphabetically by title, for deterministic output', () => {
    const entries: FeedEntry[] = [
      { path: '/b', title: 'Bravo', updated: '2026-01-01' },
      { path: '/a', title: 'Alpha', updated: '2026-01-01' },
    ];
    const xml = buildAtomFeed(entries, {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });
    const titles = [...xml.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]).slice(1);
    expect(titles).toEqual(['Alpha', 'Bravo']);
  });

  it('uses the newest entry date as the feed-level <updated>', () => {
    const entries: FeedEntry[] = [
      { path: '/old', title: 'Old page', updated: '2026-01-01' },
      { path: '/new', title: 'New page', updated: '2026-08-15' },
    ];
    const xml = buildAtomFeed(entries, {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });
    expect(xml).toContain('<updated>2026-08-15T00:00:00Z</updated>');
  });

  it('includes a summary only when the entry has one', () => {
    const entries: FeedEntry[] = [
      { path: '/with-summary', title: 'Has summary', updated: '2026-01-01', summary: 'A description.' },
      { path: '/without-summary', title: 'No summary', updated: '2026-01-02' },
    ];
    const xml = buildAtomFeed(entries, {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });
    expect(xml).toContain('<summary>A description.</summary>');
    expect(xml.match(/<summary>/g)?.length).toBe(1);
  });

  it('escapes XML-sensitive characters in titles and summaries', () => {
    const entries: FeedEntry[] = [
      { path: '/x', title: 'Golden Boot <2026>', updated: '2026-01-01', summary: 'A & B' },
    ];
    const xml = buildAtomFeed(entries, {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });
    expect(xml).toContain('Golden Boot &lt;2026&gt;');
    expect(xml).toContain('<summary>A &amp; B</summary>');
  });

  it('resolves each entry id/link through the provided absolute() resolver', () => {
    const entries: FeedEntry[] = [{ path: '/competitions/world-cup', title: 'World Cup', updated: '2026-01-01' }];
    const xml = buildAtomFeed(entries, {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });
    expect(xml).toContain('<id>https://example.com/competitions/world-cup/</id>');
    expect(xml).toContain('<link rel="alternate" href="https://example.com/competitions/world-cup/" />');
  });

  it('falls back to a fixed epoch <updated> when there are no entries, rather than crashing', () => {
    const xml = buildAtomFeed([], {
      feedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com/',
      title: 'Test feed',
      absolute,
    });
    expect(xml).toContain('<updated>1970-01-01T00:00:00Z</updated>');
    expect(xml).not.toContain('<entry>');
  });
});
