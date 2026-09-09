import { describe, expect, it } from 'vitest';
import {
  extractTitle,
  extractMetaDescription,
  isNoindexHtml,
  localeOf,
  findDuplicates,
} from '../../scripts/check-meta.mjs';

describe('extractTitle', () => {
  it('extracts a page title', () => {
    expect(extractTitle('<title>Brazil · The Ultimate Football Reference</title>')).toBe(
      'Brazil · The Ultimate Football Reference',
    );
  });

  it('returns null for a missing title tag', () => {
    expect(extractTitle('<html><body>no title here</body></html>')).toBeNull();
  });

  it('returns null for an empty title tag', () => {
    expect(extractTitle('<title></title>')).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(extractTitle('<title>  Padded  </title>')).toBe('Padded');
  });
});

describe('extractMetaDescription', () => {
  it('extracts a meta description', () => {
    expect(extractMetaDescription('<meta name="description" content="A history site.">')).toBe('A history site.');
  });

  it('returns null for a missing meta description', () => {
    expect(extractMetaDescription('<html><head></head></html>')).toBeNull();
  });

  it('returns null for an empty meta description', () => {
    expect(extractMetaDescription('<meta name="description" content="">')).toBeNull();
  });
});

describe('isNoindexHtml', () => {
  it('detects a noindex robots meta tag', () => {
    expect(isNoindexHtml('<meta name="robots" content="noindex">')).toBe(true);
  });

  it('returns false when no noindex tag is present', () => {
    expect(isNoindexHtml('<html><head></head></html>')).toBe(false);
  });
});

describe('localeOf', () => {
  it('classifies a Croatian path', () => {
    expect(localeOf('/hr/records/')).toBe('hr');
    expect(localeOf('/hr')).toBe('hr');
  });

  it('classifies an English path', () => {
    expect(localeOf('/records/')).toBe('en');
    expect(localeOf('/')).toBe('en');
  });

  it('does not false-positive on a path that merely starts with "hr" as a segment prefix', () => {
    expect(localeOf('/hrvatska-something/')).toBe('en');
  });
});

describe('findDuplicates', () => {
  it('returns no groups when every title/description in a locale is unique', () => {
    const pages = [
      { pagePath: '/a/', locale: 'en', title: 'A', description: 'Desc A' },
      { pagePath: '/b/', locale: 'en', title: 'B', description: 'Desc B' },
    ];
    expect(findDuplicates(pages)).toEqual([]);
  });

  it('flags two pages in the same locale sharing a title', () => {
    const pages = [
      { pagePath: '/a/', locale: 'en', title: 'Same', description: 'Desc A' },
      { pagePath: '/b/', locale: 'en', title: 'Same', description: 'Desc B' },
    ];
    expect(findDuplicates(pages)).toEqual([
      { field: 'title', value: 'Same', locale: 'en', pagePaths: ['/a/', '/b/'] },
    ]);
  });

  it('flags two pages in the same locale sharing a description', () => {
    const pages = [
      { pagePath: '/a/', locale: 'en', title: 'A', description: 'Same desc' },
      { pagePath: '/b/', locale: 'en', title: 'B', description: 'Same desc' },
    ];
    expect(findDuplicates(pages)).toEqual([
      { field: 'description', value: 'Same desc', locale: 'en', pagePaths: ['/a/', '/b/'] },
    ]);
  });

  it('does not flag the same title shared only across different locales', () => {
    const pages = [
      { pagePath: '/copa-america/', locale: 'en', title: 'Copa América', description: 'Desc A' },
      { pagePath: '/hr/copa-america/', locale: 'hr', title: 'Copa América', description: 'Desc B' },
    ];
    expect(findDuplicates(pages)).toEqual([]);
  });

  it('ignores pages with a null title/description when grouping', () => {
    const pages = [
      { pagePath: '/a/', locale: 'en', title: null, description: null },
      { pagePath: '/b/', locale: 'en', title: null, description: null },
    ];
    expect(findDuplicates(pages)).toEqual([]);
  });

  it('reports all pages in a group of three or more', () => {
    const pages = [
      { pagePath: '/a/', locale: 'en', title: 'Same', description: 'Desc A' },
      { pagePath: '/b/', locale: 'en', title: 'Same', description: 'Desc B' },
      { pagePath: '/c/', locale: 'en', title: 'Same', description: 'Desc C' },
    ];
    expect(findDuplicates(pages)).toEqual([
      { field: 'title', value: 'Same', locale: 'en', pagePaths: ['/a/', '/b/', '/c/'] },
    ]);
  });
});
