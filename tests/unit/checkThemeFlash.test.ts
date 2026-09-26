import { describe, expect, it } from 'vitest';
import {
  checkPageThemeFlash,
  checkThemeScriptOrder,
  extractHead,
} from '../../scripts/check-theme-flash.mjs';

describe('extractHead', () => {
  it('extracts the contents between <head> and </head>', () => {
    const html = '<html><head><title>Foo</title></head><body>bar</body></html>';
    expect(extractHead(html)).toBe('<title>Foo</title>');
  });

  it('returns null when the page has no <head>', () => {
    expect(extractHead('<html><body>no head here</body></html>')).toBeNull();
  });
});

describe('checkThemeScriptOrder', () => {
  it('accepts a head where the theme script precedes the stylesheet link', () => {
    const head =
      '<title>Foo</title>' +
      "<script is:inline>localStorage.getItem('theme')</script>" +
      '<link rel="stylesheet" href="/style.css">';
    expect(checkThemeScriptOrder(head)).toEqual([]);
  });

  it('accepts a head with the theme script and no stylesheet link at all', () => {
    const head = "<script is:inline>localStorage.getItem('theme')</script>";
    expect(checkThemeScriptOrder(head)).toEqual([]);
  });

  it('flags a head with no theme pre-paint script', () => {
    const head = '<title>Foo</title><link rel="stylesheet" href="/style.css">';
    expect(checkThemeScriptOrder(head)).toEqual(['missing the theme pre-paint script in <head>']);
  });

  it('flags a head where the stylesheet link precedes the theme script', () => {
    const head =
      '<link rel="stylesheet" href="/style.css">' +
      "<script is:inline>localStorage.getItem('theme')</script>";
    expect(checkThemeScriptOrder(head)).toEqual([
      'a <link rel="stylesheet"> appears before the theme pre-paint script (risks a flash of the wrong theme)',
    ]);
  });

  it('is unaffected by a non-stylesheet link (e.g. a preload or icon) before the theme script', () => {
    const head =
      '<link rel="icon" href="/favicon.svg">' +
      '<link rel="preload" href="/font.woff2" as="font">' +
      "<script is:inline>localStorage.getItem('theme')</script>" +
      '<link rel="stylesheet" href="/style.css">';
    expect(checkThemeScriptOrder(head)).toEqual([]);
  });
});

describe('checkPageThemeFlash', () => {
  it('returns no failures for a clean page', () => {
    const html =
      '<html><head>' +
      "<script is:inline>localStorage.getItem('theme')</script>" +
      '<link rel="stylesheet" href="/style.css">' +
      '</head><body></body></html>';
    expect(checkPageThemeFlash('/', html)).toEqual([]);
  });

  it('tags a missing-<head> page with its own issue, not a script-order issue', () => {
    const html = '<html><body>no head</body></html>';
    expect(checkPageThemeFlash('/awards/golden-boot/', html)).toEqual([
      { pagePath: '/awards/golden-boot/', issue: 'page has no <head>' },
    ]);
  });

  it('tags every issue found with the given page path', () => {
    const html =
      '<html><head>' +
      '<link rel="stylesheet" href="/style.css">' +
      "<script is:inline>localStorage.getItem('theme')</script>" +
      '</head><body></body></html>';
    expect(checkPageThemeFlash('/glossary/', html)).toEqual([
      {
        pagePath: '/glossary/',
        issue:
          'a <link rel="stylesheet"> appears before the theme pre-paint script (risks a flash of the wrong theme)',
      },
    ]);
  });
});
