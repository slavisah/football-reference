import { describe, expect, it } from 'vitest';
import {
  findCssRefs,
  overBudget,
  pageWeight,
  resolveDistAsset,
} from '../../scripts/check-page-weight.mjs';

describe('findCssRefs', () => {
  it('extracts every distinct stylesheet href from an HTML page', () => {
    const html = `
      <link rel="stylesheet" href="/football-reference/_astro/sources.9DnuamWA.css">
      <link rel="icon" href="/football-reference/favicon.svg">
      <link rel="stylesheet" href="/football-reference/_astro/sources.9DnuamWA.css">
    `;
    expect(findCssRefs(html)).toEqual(['/football-reference/_astro/sources.9DnuamWA.css']);
  });

  it('returns an empty list when a page has no stylesheet link', () => {
    expect(findCssRefs('<html><body>No styles here</body></html>')).toEqual([]);
  });
});

describe('resolveDistAsset', () => {
  it('resolves an asset under dist/_astro regardless of the site base path', () => {
    expect(resolveDistAsset('/repo/dist', '/football-reference/_astro/quiz.DuVO7t0W.css')).toBe(
      '/repo/dist/_astro/quiz.DuVO7t0W.css',
    );
    expect(resolveDistAsset('/repo/dist', '/_astro/quiz.DuVO7t0W.css')).toBe(
      '/repo/dist/_astro/quiz.DuVO7t0W.css',
    );
  });

  it('returns null for a reference outside of /_astro/ (nothing to resolve)', () => {
    expect(resolveDistAsset('/repo/dist', '/football-reference/favicon.svg')).toBeNull();
  });
});

describe('pageWeight', () => {
  it('sums the HTML byte size with every referenced CSS asset size', () => {
    expect(pageWeight(1000, [200, 300])).toBe(1500);
  });

  it('is just the HTML size when a page references no CSS', () => {
    expect(pageWeight(1000, [])).toBe(1000);
  });
});

describe('overBudget', () => {
  const pages = [
    { page: 'a/index.html', bytes: 100 },
    { page: 'b/index.html', bytes: 500 },
    { page: 'c/index.html', bytes: 300 },
  ];

  it('returns only pages over the budget, heaviest first', () => {
    expect(overBudget(pages, 250)).toEqual([
      { page: 'b/index.html', bytes: 500 },
      { page: 'c/index.html', bytes: 300 },
    ]);
  });

  it('returns an empty list when every page is within budget', () => {
    expect(overBudget(pages, 1000)).toEqual([]);
  });

  it('treats a page exactly at the budget as within budget, not over', () => {
    expect(overBudget(pages, 300)).toEqual([{ page: 'b/index.html', bytes: 500 }]);
  });
});
