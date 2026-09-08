import { describe, expect, it } from 'vitest';
import {
  htmlFileToPagePath,
  isRedirectStubHtml,
  pagesOverflowing,
} from '../../scripts/check-reflow.mjs';

describe('htmlFileToPagePath', () => {
  it('converts the root index.html into the home page path', () => {
    expect(htmlFileToPagePath('/repo/dist', '/repo/dist/index.html')).toBe('/');
  });

  it('converts a nested index.html into its site-relative directory path', () => {
    expect(htmlFileToPagePath('/repo/dist', '/repo/dist/competitions/world-cup/2026/index.html')).toBe(
      '/competitions/world-cup/2026/',
    );
  });

  it('joins nested Golden Boot paths with forward slashes regardless of platform separator', () => {
    expect(
      htmlFileToPagePath('/repo/dist', '/repo/dist/hr/competitions/golden-boot/euro/2024/index.html'),
    ).toBe('/hr/competitions/golden-boot/euro/2024/');
  });

  it('leaves a flat non-index HTML file (404.html) as its own literal path', () => {
    expect(htmlFileToPagePath('/repo/dist', '/repo/dist/404.html')).toBe('/404.html');
  });
});

describe('isRedirectStubHtml', () => {
  it('recognizes a meta-refresh redirect stub page', () => {
    const html =
      '<!doctype html><title>Redirecting to: /football-reference/competitions/ballon-dor</title>' +
      '<meta http-equiv="refresh" content="0;url=/football-reference/competitions/ballon-dor">' +
      '<meta name="robots" content="noindex">';
    expect(isRedirectStubHtml(html)).toBe(true);
  });

  it('does not flag a real content page with no refresh meta tag', () => {
    const html = '<!doctype html><html><head><title>Records</title></head><body>...</body></html>';
    expect(isRedirectStubHtml(html)).toBe(false);
  });
});

describe('pagesOverflowing', () => {
  const measurements = [
    { pagePath: '/a/', overflow: 0 },
    { pagePath: '/b/', overflow: 40 },
    { pagePath: '/c/', overflow: 1 },
  ];

  it('returns only pages whose overflow exceeds the tolerance', () => {
    expect(pagesOverflowing(measurements)).toEqual([{ pagePath: '/b/', overflow: 40 }]);
  });

  it('treats a page exactly at the tolerance as passing, not overflowing', () => {
    expect(pagesOverflowing([{ pagePath: '/c/', overflow: 1 }])).toEqual([]);
  });

  it('returns an empty list when every page is within tolerance', () => {
    expect(pagesOverflowing([{ pagePath: '/a/', overflow: 0 }])).toEqual([]);
  });
});
