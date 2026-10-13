import { describe, expect, it } from 'vitest';
import { entriesSortedDescending, parseAtomFeed } from '../../scripts/check-feed.mjs';

describe('parseAtomFeed', () => {
  it('parses feed-level links and every entry', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<feed xmlns="http://www.w3.org/2005/Atom">\n' +
      '<id>https://example.com/</id>\n' +
      '<title>Test feed</title>\n' +
      '<updated>2026-08-15T00:00:00Z</updated>\n' +
      '<link rel="self" href="https://example.com/feed.xml" />\n' +
      '<link rel="alternate" href="https://example.com/" />\n' +
      '<entry><id>https://example.com/records/</id><title>Records</title>' +
      '<link rel="alternate" href="https://example.com/records/" /><updated>2026-08-15T00:00:00Z</updated></entry>\n' +
      '</feed>\n';

    const feed = parseAtomFeed(xml);
    expect(feed.self).toBe('https://example.com/feed.xml');
    expect(feed.alternate).toBe('https://example.com/');
    expect(feed.entries).toEqual([
      {
        id: 'https://example.com/records/',
        title: 'Records',
        link: 'https://example.com/records/',
        updated: '2026-08-15T00:00:00Z',
      },
    ]);
  });

  it('unescapes XML entities in titles', () => {
    const xml =
      '<feed xmlns="http://www.w3.org/2005/Atom">\n' +
      '<entry><id>https://example.com/x/</id><title>Ballon d&amp;Or &lt;2026&gt;</title>' +
      '<link rel="alternate" href="https://example.com/x/" /><updated>2026-01-01T00:00:00Z</updated></entry>\n' +
      '</feed>\n';
    expect(parseAtomFeed(xml).entries[0].title).toBe('Ballon d&Or <2026>');
  });
});

describe('entriesSortedDescending', () => {
  it('accepts entries already sorted newest-first', () => {
    expect(
      entriesSortedDescending([
        { updated: '2026-08-15T00:00:00Z' },
        { updated: '2026-05-01T00:00:00Z' },
        { updated: '2026-01-01T00:00:00Z' },
      ]),
    ).toBe(true);
  });

  it('allows ties between adjacent entries', () => {
    expect(
      entriesSortedDescending([
        { updated: '2026-08-15T00:00:00Z' },
        { updated: '2026-08-15T00:00:00Z' },
      ]),
    ).toBe(true);
  });

  it('rejects an out-of-order pair', () => {
    expect(
      entriesSortedDescending([
        { updated: '2026-01-01T00:00:00Z' },
        { updated: '2026-08-15T00:00:00Z' },
      ]),
    ).toBe(false);
  });
});
