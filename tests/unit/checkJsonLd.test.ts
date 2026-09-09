import { describe, expect, it } from 'vitest';
import {
  checkPageJsonLd,
  extractJsonLdBlocks,
  validateJsonLdObject,
} from '../../scripts/check-jsonld.mjs';

const ORIGIN = 'https://slavisah.github.io/football-reference';

describe('extractJsonLdBlocks', () => {
  it('pulls one block out of a page with a single JSON-LD script', () => {
    const html = '<html><head><script type="application/ld+json">{"a":1}</script></head></html>';
    expect(extractJsonLdBlocks(html)).toEqual(['{"a":1}']);
  });

  it('pulls every block out of a page with several JSON-LD scripts, in document order', () => {
    const html =
      '<script type="application/ld+json">{"a":1}</script>' +
      '<p>content</p>' +
      '<script type="application/ld+json">{"b":2}</script>';
    expect(extractJsonLdBlocks(html)).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('returns an empty array for a page with no JSON-LD scripts', () => {
    expect(extractJsonLdBlocks('<html><body>no structured data here</body></html>')).toEqual([]);
  });

  it('ignores an unrelated inline script tag', () => {
    const html = '<script>console.log("hi")</script>';
    expect(extractJsonLdBlocks(html)).toEqual([]);
  });
});

describe('validateJsonLdObject', () => {
  it('accepts a well-formed ItemList with sequential positions and absolute site URLs', () => {
    const obj = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      url: `${ORIGIN}/records/`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, item: { '@type': 'Thing', name: 'Brazil' } },
        { '@type': 'ListItem', position: 2, item: { '@type': 'Thing', name: 'Germany' } },
      ],
    };
    expect(validateJsonLdObject(obj, ORIGIN)).toEqual([]);
  });

  it('accepts a nested CollectionPage whose mainEntity keeps its own "@type" but no "@context"', () => {
    const obj = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      url: `${ORIGIN}/teams/`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [{ '@type': 'ListItem', position: 1, item: { '@type': 'Thing', name: 'Brazil' } }],
      },
    };
    expect(validateJsonLdObject(obj, ORIGIN)).toEqual([]);
  });

  it('rejects a non-object root value', () => {
    expect(validateJsonLdObject(null, ORIGIN)).toEqual(['root JSON-LD value must be an object']);
    expect(validateJsonLdObject([1, 2], ORIGIN)).toEqual(['root JSON-LD value must be an object']);
  });

  it('flags a missing or wrong "@context" at the root', () => {
    const issues = validateJsonLdObject({ '@type': 'ItemList' }, ORIGIN);
    expect(issues).toEqual(['$: "@context" must be "https://schema.org", got undefined']);
  });

  it('flags a missing or empty "@type" at the root', () => {
    const issues = validateJsonLdObject({ '@context': 'https://schema.org', '@type': '' }, ORIGIN);
    expect(issues).toEqual(['$: "@type" must be a non-empty string, got ""']);
  });

  it('flags a non-positive-integer "position"', () => {
    const obj = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [{ '@type': 'ListItem', position: 0 }],
    };
    const issues = validateJsonLdObject(obj, ORIGIN);
    expect(issues.some((issue) => issue.includes('"position" must be a positive integer'))).toBe(true);
  });

  it('flags an "itemListElement" with a gap in its position sequence', () => {
    const obj = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1 },
        { '@type': 'ListItem', position: 3 },
      ],
    };
    const issues = validateJsonLdObject(obj, ORIGIN);
    expect(issues).toEqual([
      '$.itemListElement: "position" values must be exactly 1..2 with no gap or duplicate, got [1,3]',
    ]);
  });

  it('flags an "itemListElement" with a duplicate position', () => {
    const obj = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1 },
        { '@type': 'ListItem', position: 1 },
      ],
    };
    const issues = validateJsonLdObject(obj, ORIGIN);
    expect(issues[0]).toContain('no gap or duplicate');
  });

  it('flags an empty "itemListElement" array', () => {
    const obj = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: [] };
    const issues = validateJsonLdObject(obj, ORIGIN);
    expect(issues.some((issue) => issue.includes('must be a non-empty array'))).toBe(true);
  });

  it('flags a relative "url"/"item" string instead of an absolute site URL', () => {
    const obj = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, item: '/records/' }],
    };
    const issues = validateJsonLdObject(obj, ORIGIN);
    expect(issues[0]).toContain('expected an absolute');
  });

  it('flags a "url" pointing at a foreign domain', () => {
    const obj = { '@context': 'https://schema.org', '@type': 'ItemList', url: 'https://evil.example/' };
    const issues = validateJsonLdObject(obj, ORIGIN);
    expect(issues[0]).toContain('expected an absolute');
  });
});

describe('checkPageJsonLd', () => {
  it('returns no failures for a page whose only block is valid', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: `${ORIGIN}/`,
    })}</script>`;
    expect(checkPageJsonLd('/', html, ORIGIN)).toEqual([]);
  });

  it('flags a page with no JSON-LD blocks at all', () => {
    const failures = checkPageJsonLd('/glossary/', '<html><body>no structured data</body></html>', ORIGIN);
    expect(failures).toEqual([
      { pagePath: '/glossary/', blockIndex: -1, issue: 'page has no JSON-LD blocks at all' },
    ]);
  });

  it('flags a block that is not valid JSON, tagged with its block index', () => {
    const html = '<script type="application/ld+json">{not valid json}</script>';
    const failures = checkPageJsonLd('/records/', html, ORIGIN);
    expect(failures).toHaveLength(1);
    expect(failures[0].pagePath).toBe('/records/');
    expect(failures[0].blockIndex).toBe(0);
    expect(failures[0].issue).toContain('invalid JSON');
  });

  it('reports the correct block index for the second of two scripts', () => {
    const html =
      `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', url: `${ORIGIN}/` })}</script>` +
      '<script type="application/ld+json">{bad}</script>';
    const failures = checkPageJsonLd('/', html, ORIGIN);
    expect(failures).toHaveLength(1);
    expect(failures[0].blockIndex).toBe(1);
  });
});
