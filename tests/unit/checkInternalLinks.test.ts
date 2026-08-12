import { describe, expect, it } from 'vitest';
import {
  candidateDistPaths,
  classifyLink,
  extractLinks,
} from '../../scripts/check-internal-links.mjs';

describe('extractLinks', () => {
  it('extracts every distinct href/src attribute value, in source order', () => {
    const html = `
      <a href="/football-reference/records">Records</a>
      <link rel="stylesheet" href="/football-reference/_astro/foo.css">
      <a href="/football-reference/records">Records again</a>
      <script src="/football-reference/sw.js"></script>
    `;
    expect(extractLinks(html)).toEqual([
      '/football-reference/records',
      '/football-reference/_astro/foo.css',
      '/football-reference/sw.js',
    ]);
  });

  it('returns an empty list when a page has no href/src attributes', () => {
    expect(extractLinks('<html><body>No links here</body></html>')).toEqual([]);
  });
});

describe('classifyLink', () => {
  it('classifies a same-page fragment link', () => {
    expect(classifyLink('#main')).toEqual({ kind: 'fragment', target: 'main' });
  });

  it('classifies mailto/tel links as out of scope', () => {
    expect(classifyLink('mailto:test@example.com')).toEqual({ kind: 'skip' });
    expect(classifyLink('tel:+123456789')).toEqual({ kind: 'skip' });
  });

  it('classifies a third-party URL as external', () => {
    expect(classifyLink('https://en.wikipedia.org/wiki/FIFA_World_Cup')).toEqual({
      kind: 'external',
    });
  });

  it('classifies a base-path-relative link as internal, stripping the base path', () => {
    expect(classifyLink('/football-reference/competitions/world-cup')).toEqual({
      kind: 'internal',
      path: '/competitions/world-cup',
    });
  });

  it('classifies an absolute same-site URL as internal, stripping origin and base path', () => {
    expect(
      classifyLink('https://slavisah.github.io/football-reference/records'),
    ).toEqual({ kind: 'internal', path: '/records' });
  });

  it('strips a query string and fragment from an internal link', () => {
    expect(classifyLink('/football-reference/quiz?sort=year-desc#results')).toEqual({
      kind: 'internal',
      path: '/quiz',
    });
  });

  it('treats the bare site root as internal path "/"', () => {
    expect(classifyLink('https://slavisah.github.io/football-reference')).toEqual({
      kind: 'internal',
      path: '/',
    });
    expect(classifyLink('/football-reference/')).toEqual({ kind: 'internal', path: '/' });
  });

  it('classifies a link outside the site\'s base path as external', () => {
    expect(classifyLink('/some-other-site/page')).toEqual({ kind: 'external' });
  });
});

describe('candidateDistPaths', () => {
  it('resolves the site root to the top-level index.html', () => {
    expect(candidateDistPaths('/')).toEqual(['index.html']);
  });

  it('resolves an extensionless path to its directory index.html, plus a flat .html fallback', () => {
    expect(candidateDistPaths('/competitions/world-cup')).toEqual([
      'competitions/world-cup/index.html',
      'competitions/world-cup.html',
    ]);
  });

  it('resolves a path with a trailing slash the same as without one', () => {
    expect(candidateDistPaths('/hr/')).toEqual(['hr/index.html', 'hr.html']);
  });

  it('resolves an asset path with an extension directly, not as a directory', () => {
    expect(candidateDistPaths('/downloads/world-cup.pdf')).toEqual(['downloads/world-cup.pdf']);
    expect(candidateDistPaths('/manifest.webmanifest')).toEqual(['manifest.webmanifest']);
  });
});
