import { describe, expect, it, vi } from 'vitest';
import { buildPrecacheUrls, selectInstallCacheUrls, withBasePath } from '../../src/lib/offlineCache';
import { NAV_LINKS } from '../../src/lib/routes';
import { TRANSLATED_PATHS } from '../../src/lib/i18n';

describe('buildPrecacheUrls', () => {
  it('prefixes every nav page and static asset with the base path', () => {
    const urls = buildPrecacheUrls('/football-reference/');

    expect(urls[0]).toBe('/football-reference/');
    expect(urls).toContain('/football-reference/competitions/world-cup');
    expect(urls).toContain('/football-reference/competitions/golden-boot');
    expect(urls).toContain('/football-reference/quiz');
    expect(urls).toContain('/football-reference/manifest.webmanifest');
    expect(urls).toContain('/football-reference/icons/icon-512.png');
  });

  it('also precaches every Croatian nav page, so offline reading works in both languages', () => {
    const urls = buildPrecacheUrls('/football-reference/');

    expect(urls).toContain('/football-reference/hr/');
    expect(urls).toContain('/football-reference/hr/competitions/world-cup');
    expect(urls).toContain('/football-reference/hr/competitions/golden-boot');
    expect(urls).toContain('/football-reference/hr/quiz');
    expect(urls).toContain('/football-reference/hr/records');
    expect(urls).toContain('/football-reference/hr/compare');
    expect(urls).toContain('/football-reference/hr/teams');
    expect(urls).toContain('/football-reference/hr/players');
    expect(urls).toContain('/football-reference/hr/compare-players');
    expect(urls).toContain('/football-reference/hr/about/sources');
  });

  it('every NAV_LINKS path has a Croatian translation, so none is silently English-only offline', () => {
    for (const link of NAV_LINKS) {
      expect(TRANSLATED_PATHS[link.path], `missing hr translation for ${link.path}`).toBeDefined();
    }
  });

  it('includes exactly two entries (English + Croatian) per nav link plus the static assets, deduped', () => {
    const urls = buildPrecacheUrls('/football-reference/');
    expect(urls.length).toBe(NAV_LINKS.length * 2 + 7);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('precaches both the English and Croatian web app manifest', () => {
    const urls = buildPrecacheUrls('/football-reference/');
    expect(urls).toContain('/football-reference/manifest.webmanifest');
    expect(urls).toContain('/football-reference/hr/manifest.webmanifest');
  });

  it('works with a bare "/" base path (local dev)', () => {
    const urls = buildPrecacheUrls('/');
    expect(urls[0]).toBe('/');
    expect(urls).toContain('/quiz');
    expect(urls).toContain('/hr/quiz');
    expect(urls).toContain('/manifest.webmanifest');
    expect(urls.every((url) => !url.includes('//'))).toBe(true);
  });
});

describe('withBasePath', () => {
  it('prefixes a path with the base path, matching buildPrecacheUrls own prefixing', () => {
    expect(withBasePath('/football-reference/', '/hr/')).toBe('/football-reference/hr/');
    expect(withBasePath('/', '/hr/')).toBe('/hr/');
  });

  it('falls back to "/" when both the base and the path are empty', () => {
    expect(withBasePath('', '')).toBe('/');
  });
});

describe('selectInstallCacheUrls', () => {
  const precacheUrls = buildPrecacheUrls('/football-reference/');
  const homeUrlEn = '/football-reference/';
  const homeUrlHr = '/football-reference/hr/';

  it('returns the full precache list when Save-Data is off', () => {
    expect(selectInstallCacheUrls(precacheUrls, homeUrlEn, homeUrlHr, false)).toBe(precacheUrls);
  });

  it('returns the full precache list when Save-Data is unsupported (undefined)', () => {
    expect(selectInstallCacheUrls(precacheUrls, homeUrlEn, homeUrlHr, undefined)).toBe(precacheUrls);
  });

  it('returns only the two home pages when Save-Data is on', () => {
    expect(selectInstallCacheUrls(precacheUrls, homeUrlEn, homeUrlHr, true)).toEqual([
      homeUrlEn,
      homeUrlHr,
    ]);
  });

  it('dedupes if the English and Croatian home URLs are ever identical (e.g. an untranslated setup)', () => {
    expect(selectInstallCacheUrls(precacheUrls, homeUrlEn, homeUrlEn, true)).toEqual([homeUrlEn]);
  });
});

describe('buildPrecacheUrls with an untranslated nav path', () => {
  // Every real NAV_LINKS path currently has a Croatian translation (pinned by
  // the "every NAV_LINKS path has a Croatian translation" test above), so
  // buildPrecacheUrls()'s English-only fallback for a link with no hrPath is
  // never exercised through real data - this mocks routes.ts with one
  // untranslated link to reach that branch directly, the same way
  // competition.test.ts mocks astro:content to reach its own edge cases.
  it('precaches only the English URL for a nav link with no Croatian translation', async () => {
    vi.resetModules();
    vi.doMock('../../src/lib/routes', () => ({
      NAV_LINKS: [{ path: '/only-english', label: 'Only English', labelHr: 'n/a' }],
    }));
    const { buildPrecacheUrls: buildPrecacheUrlsWithMock } = await import('../../src/lib/offlineCache');
    const urls = buildPrecacheUrlsWithMock('/football-reference/');
    expect(urls).toContain('/football-reference/only-english');
    expect(urls).not.toContain('/football-reference/hr/only-english');
    vi.doUnmock('../../src/lib/routes');
    vi.resetModules();
  });
});
