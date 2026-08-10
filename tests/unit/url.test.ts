import { describe, expect, it } from 'vitest';
import { absolutePageUrl, withBase } from '../../src/lib/url';

describe('withBase', () => {
  it('prefixes a leading-slash path with the configured base', () => {
    // import.meta.env.BASE_URL defaults to '/' under Vite/Vitest (no
    // BASE_PATH env var set here), the same default astro.config.mjs falls
    // back to for local dev - so the base itself strips to '' and the path
    // passes through unchanged, matching what tests/unit/homeCards.test.ts
    // already observes indirectly for its generated hrefs.
    expect(withBase('/competitions/world-cup')).toBe('/competitions/world-cup');
  });

  it('adds a leading slash to a path that is missing one', () => {
    expect(withBase('competitions/world-cup')).toBe('/competitions/world-cup');
  });

  it('never returns an empty string, even for the root path', () => {
    expect(withBase('/')).toBe('/');
    expect(withBase('')).toBe('/');
  });
});

describe('absolutePageUrl', () => {
  it('resolves a page path against the configured site origin, keeping the path (incl. base) as-is', () => {
    // Astro.url.pathname already includes the deployed base path (e.g.
    // "/football-reference/..."), so only the origin should change here -
    // matching how BaseLayout.astro and sitemap.xml.ts use this together
    // with Astro.site.
    const url = new URL('https://example.com/football-reference/competitions/euro');
    const site = new URL('https://slavisah.github.io/');
    expect(absolutePageUrl(url, site)).toBe(
      'https://slavisah.github.io/football-reference/competitions/euro',
    );
  });

  it('falls back to the page URL itself when no site is configured (local dev)', () => {
    const url = new URL('http://localhost:4321/competitions/euro');
    expect(absolutePageUrl(url)).toBe('http://localhost:4321/competitions/euro');
  });
});
