import { describe, expect, it } from 'vitest';
import { buildPrecacheUrls } from '../../src/lib/offlineCache';
import { NAV_LINKS } from '../../src/lib/routes';

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

  it('includes exactly one entry per nav link plus the static assets, deduped', () => {
    const urls = buildPrecacheUrls('/football-reference/');
    // NAV_LINKS includes '/', counted once via the leading withBase('/') entry.
    expect(urls.length).toBe(NAV_LINKS.length + 6);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('works with a bare "/" base path (local dev)', () => {
    const urls = buildPrecacheUrls('/');
    expect(urls[0]).toBe('/');
    expect(urls).toContain('/quiz');
    expect(urls).toContain('/manifest.webmanifest');
    expect(urls.every((url) => !url.includes('//'))).toBe(true);
  });
});
