import { describe, expect, it } from 'vitest';
import { parsePageHead, parseSitemapUrls, sameAlternates } from '../../scripts/check-sitemap.mjs';

describe('parseSitemapUrls', () => {
  it('parses a <url> entry with reciprocal hreflang alternates', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
      '<url><loc>https://example.com/records/</loc><lastmod>2026-08-01</lastmod>' +
      '<xhtml:link rel="alternate" hreflang="en" href="https://example.com/records/" />' +
      '<xhtml:link rel="alternate" hreflang="hr" href="https://example.com/hr/records/" /></url>\n' +
      '</urlset>\n';

    expect(parseSitemapUrls(xml)).toEqual([
      {
        loc: 'https://example.com/records/',
        alternates: [
          { hreflang: 'en', href: 'https://example.com/records/' },
          { hreflang: 'hr', href: 'https://example.com/hr/records/' },
        ],
      },
    ]);
  });

  it('parses a <url> entry with no alternates (no translation)', () => {
    const xml = '<urlset><url><loc>https://example.com/only-page</loc></url></urlset>';
    expect(parseSitemapUrls(xml)).toEqual([{ loc: 'https://example.com/only-page', alternates: [] }]);
  });

  it('unescapes XML entities in <loc> and href values', () => {
    const xml =
      '<urlset><url><loc>https://example.com/a&amp;b</loc>' +
      '<xhtml:link rel="alternate" hreflang="en" href="https://example.com/a&amp;b" /></url></urlset>';
    const [entry] = parseSitemapUrls(xml);
    expect(entry.loc).toBe('https://example.com/a&b');
    expect(entry.alternates[0].href).toBe('https://example.com/a&b');
  });

  it('returns an empty list for a sitemap with no <url> entries', () => {
    expect(parseSitemapUrls('<urlset></urlset>')).toEqual([]);
  });
});

describe('parsePageHead', () => {
  it('extracts canonical, noindex, and hreflang alternates from a page', () => {
    const html =
      '<html><head>' +
      '<link rel="canonical" href="https://example.com/records/">' +
      '<link rel="alternate" hreflang="en" href="https://example.com/records/">' +
      '<link rel="alternate" hreflang="hr" href="https://example.com/hr/records/">' +
      '</head></html>';

    expect(parsePageHead(html)).toEqual({
      canonical: 'https://example.com/records/',
      noindex: false,
      alternates: [
        { hreflang: 'en', href: 'https://example.com/records/' },
        { hreflang: 'hr', href: 'https://example.com/hr/records/' },
      ],
    });
  });

  it('detects a noindex page', () => {
    const html =
      '<html><head><link rel="canonical" href="https://example.com/404/">' +
      '<meta name="robots" content="noindex"></head></html>';
    expect(parsePageHead(html).noindex).toBe(true);
  });

  it('returns a null canonical and no alternates when neither tag is present', () => {
    expect(parsePageHead('<html><head></head></html>')).toEqual({
      canonical: null,
      noindex: false,
      alternates: [],
    });
  });
});

describe('sameAlternates', () => {
  it('treats equal lists in a different order as the same', () => {
    const a = [
      { hreflang: 'en', href: 'https://example.com/x' },
      { hreflang: 'hr', href: 'https://example.com/hr/x' },
    ];
    const b = [
      { hreflang: 'hr', href: 'https://example.com/hr/x' },
      { hreflang: 'en', href: 'https://example.com/x' },
    ];
    expect(sameAlternates(a, b)).toBe(true);
  });

  it('detects a different length as unequal', () => {
    expect(sameAlternates([{ hreflang: 'en', href: 'https://example.com/x' }], [])).toBe(false);
  });

  it('detects a differing href for the same hreflang as unequal (e.g. a trailing-slash mismatch)', () => {
    const a = [{ hreflang: 'en', href: 'https://example.com/x' }];
    const b = [{ hreflang: 'en', href: 'https://example.com/x/' }];
    expect(sameAlternates(a, b)).toBe(false);
  });

  it('treats two empty lists as the same', () => {
    expect(sameAlternates([], [])).toBe(true);
  });
});
