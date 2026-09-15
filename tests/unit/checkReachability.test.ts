import { describe, expect, it } from 'vitest';
import { extractAnchorHrefs, findReachablePages } from '../../scripts/check-reachability.mjs';

describe('extractAnchorHrefs', () => {
  it('extracts every distinct <a href> value, ignoring other tags with an href/src', () => {
    const html = `
      <link rel="canonical" href="/football-reference/records">
      <a href="/football-reference/teams">Teams</a>
      <a class="btn" href="/football-reference/players">Players</a>
      <script src="/football-reference/sw.js"></script>
    `;
    expect(extractAnchorHrefs(html)).toEqual([
      '/football-reference/teams',
      '/football-reference/players',
    ]);
  });

  it('deduplicates a repeated href, keeping first-seen order', () => {
    const html = '<a href="/football-reference/quiz">Quiz</a><a href="/football-reference/quiz">Again</a>';
    expect(extractAnchorHrefs(html)).toEqual(['/football-reference/quiz']);
  });

  it('returns an empty list for a page with no <a> tags', () => {
    expect(extractAnchorHrefs('<link rel="canonical" href="/football-reference/">')).toEqual([]);
  });

  it('ignores an <a> tag with no href (e.g. a same-page scroll target with only an id)', () => {
    expect(extractAnchorHrefs('<a id="section-one">Section one</a>')).toEqual([]);
  });
});

describe('findReachablePages', () => {
  function page(href: string) {
    return `<a href="${href}">Link</a>`;
  }

  it('reaches a page directly linked from an entry point', () => {
    const pages = new Map([
      ['index.html', page('/football-reference/records')],
      ['records/index.html', '<p>Records</p>'],
    ]);
    expect(findReachablePages(pages, ['index.html'])).toEqual(
      new Set(['index.html', 'records/index.html']),
    );
  });

  it('follows links transitively, several hops deep', () => {
    const pages = new Map([
      ['index.html', page('/football-reference/teams')],
      ['teams/index.html', page('/football-reference/teams/spain')],
      ['teams/spain/index.html', '<p>Spain</p>'],
    ]);
    expect(findReachablePages(pages, ['index.html'])).toEqual(
      new Set(['index.html', 'teams/index.html', 'teams/spain/index.html']),
    );
  });

  it('starts from every given entry point', () => {
    const pages = new Map([
      ['index.html', page('/football-reference/records')],
      ['records/index.html', '<p>Records</p>'],
      ['hr/index.html', page('/football-reference/hr/records')],
      ['hr/records/index.html', '<p>Records (HR)</p>'],
    ]);
    expect(findReachablePages(pages, ['index.html', 'hr/index.html'])).toEqual(
      new Set(['index.html', 'records/index.html', 'hr/index.html', 'hr/records/index.html']),
    );
  });

  it('does not reach a page with no inbound link from anywhere in the graph', () => {
    const pages = new Map([
      ['index.html', page('/football-reference/records')],
      ['records/index.html', '<p>Records</p>'],
      ['awards/golden-boot/index.html', '<p>Orphaned redirect stub</p>'],
    ]);
    const reached = findReachablePages(pages, ['index.html']);
    expect(reached.has('awards/golden-boot/index.html')).toBe(false);
  });

  it('ignores external links and does not loop forever on a link cycle', () => {
    const pages = new Map([
      ['index.html', page('/football-reference/records') + '<a href="https://en.wikipedia.org/">Wiki</a>'],
      ['records/index.html', page('/football-reference/')],
    ]);
    expect(findReachablePages(pages, ['index.html'])).toEqual(
      new Set(['index.html', 'records/index.html']),
    );
  });

  it('resolves a directory-style link to its index.html', () => {
    const pages = new Map([
      ['index.html', page('/football-reference/competitions/world-cup')],
      ['competitions/world-cup/index.html', '<p>World Cup</p>'],
    ]);
    expect(findReachablePages(pages, ['index.html'])).toEqual(
      new Set(['index.html', 'competitions/world-cup/index.html']),
    );
  });
});
