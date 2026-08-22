import { describe, expect, it } from 'vitest';
import { parseNavLinks, parsePrecacheUrls } from '../../scripts/check-precache.mjs';

describe('parsePrecacheUrls', () => {
  it('extracts the PRECACHE_URLS array baked into a generated sw.js', () => {
    const swJs =
      "// Generated at build time from src/pages/sw.js.ts - do not edit by hand.\n" +
      "const CACHE_NAME = 'football-reference-v3';\n" +
      'const PRECACHE_URLS = ["/football-reference/","/football-reference/hr/","/football-reference/records"];\n' +
      "const HOME_URL_EN = \"/football-reference/\";\n";

    expect(parsePrecacheUrls(swJs)).toEqual([
      '/football-reference/',
      '/football-reference/hr/',
      '/football-reference/records',
    ]);
  });

  it('throws when sw.js has no PRECACHE_URLS declaration', () => {
    expect(() => parsePrecacheUrls('const CACHE_NAME = "x";')).toThrow('PRECACHE_URLS');
  });
});

describe('parseNavLinks', () => {
  it('extracts every href inside the primary <nav> landmark', () => {
    const html =
      '<header><a class="brand" href="/football-reference/">Home</a>' +
      '<nav aria-label="Primary"><ul>' +
      '<li><a href="/football-reference/" aria-current="page">Home</a></li>' +
      '<li><a href="/football-reference/records">Records</a></li>' +
      '</ul></nav>' +
      '<a class="lang-switch" href="/football-reference/hr/">Hrvatski</a></header>';

    expect(parseNavLinks(html)).toEqual(['/football-reference/', '/football-reference/records']);
  });

  it('does not pick up links outside the <nav> landmark, like the brand link or lang switcher', () => {
    const html =
      '<a class="brand" href="/football-reference/">Home</a>' +
      '<nav aria-label="Primary"><a href="/football-reference/records">Records</a></nav>' +
      '<a class="lang-switch" href="/football-reference/hr/">Hrvatski</a>';

    expect(parseNavLinks(html)).toEqual(['/football-reference/records']);
  });

  it('throws when the page has no primary <nav> landmark', () => {
    expect(() => parseNavLinks('<body>no nav here</body>')).toThrow('<nav>');
  });
});
