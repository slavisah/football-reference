import { describe, expect, it } from 'vitest';
import { buildPrecacheUrls, withBasePath } from '../../src/lib/offlineCache';
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
    expect(urls).toContain('/football-reference/hr/about/sources');
  });

  it('every NAV_LINKS path has a Croatian translation, so none is silently English-only offline', () => {
    for (const link of NAV_LINKS) {
      expect(TRANSLATED_PATHS[link.path], `missing hr translation for ${link.path}`).toBeDefined();
    }
  });

  it('includes exactly two entries (English + Croatian) per nav link plus the static assets, deduped', () => {
    const urls = buildPrecacheUrls('/football-reference/');
    expect(urls.length).toBe(NAV_LINKS.length * 2 + 6);
    expect(new Set(urls).size).toBe(urls.length);
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
});
