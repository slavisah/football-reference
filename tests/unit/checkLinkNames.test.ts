import { describe, expect, it } from 'vitest';
import { extractAnchors, findAmbiguousLinkNames } from '../../scripts/check-link-names.mjs';

describe('extractAnchors', () => {
  it('extracts href and text-content accessible name', () => {
    expect(extractAnchors('<a href="/world-cup">World Cup</a>')).toEqual([
      { href: '/world-cup', name: 'World Cup' },
    ]);
  });

  it('prefers aria-label over text content', () => {
    const html = '<a href="/1959-argentina" aria-label="1959 (Argentina)">1959</a>';
    expect(extractAnchors(html)).toEqual([{ href: '/1959-argentina', name: '1959 (Argentina)' }]);
  });

  it('strips an aria-hidden descendant (a decorative icon) from the computed name', () => {
    const html = '<a href="/"><span class="brand__mark" aria-hidden="true">⚽</span><span class="brand__text">The Reference</span></a>';
    expect(extractAnchors(html)).toEqual([{ href: '/', name: 'The Reference' }]);
  });

  it('decodes HTML entities in both text content and aria-label', () => {
    expect(extractAnchors('<a href="/x">Rock &amp; Roll &lt;3&gt; &quot;quote&quot; it&#39;s</a>')).toEqual([
      { href: '/x', name: `Rock & Roll <3> "quote" it's` },
    ]);
    expect(extractAnchors('<a href="/x" aria-label="A &amp; B">text</a>')).toEqual([
      { href: '/x', name: 'A & B' },
    ]);
  });

  it('skips a link with no accessible name at all', () => {
    expect(extractAnchors('<a href="/x"></a>')).toEqual([]);
  });

  it('ignores non-anchor tags and elements without an href', () => {
    expect(extractAnchors('<a class="x">no href</a><button>not a link</button>')).toEqual([]);
  });

  it('extracts multiple anchors in document order', () => {
    const html = '<a href="/a">A</a><p>text</p><a href="/b">B</a>';
    expect(extractAnchors(html)).toEqual([
      { href: '/a', name: 'A' },
      { href: '/b', name: 'B' },
    ]);
  });
});

describe('findAmbiguousLinkNames', () => {
  it('returns nothing when every link name on the page is unique', () => {
    const html = '<a href="/a">A</a><a href="/b">B</a>';
    expect(findAmbiguousLinkNames(html)).toEqual([]);
  });

  it('returns nothing when the same name repeats but always points to the same href', () => {
    const html = '<a href="/">Home</a><nav><a href="/">Home</a></nav>';
    expect(findAmbiguousLinkNames(html)).toEqual([]);
  });

  it('flags two links sharing a name but pointing at different hrefs', () => {
    const html = '<a href="/copa-america/1959-argentina">1959</a><a href="/copa-america/1959-ecuador">1959</a>';
    expect(findAmbiguousLinkNames(html)).toEqual([
      { name: '1959', hrefs: ['/copa-america/1959-argentina', '/copa-america/1959-ecuador'] },
    ]);
  });

  it('flags a name shared by three or more distinct destinations, deduplicated', () => {
    const html =
      '<a href="/a">Source</a><a href="/b">Source</a><a href="/a">Source</a><a href="/c">Source</a>';
    expect(findAmbiguousLinkNames(html)).toEqual([{ name: 'Source', hrefs: ['/a', '/b', '/c'] }]);
  });

  it('treats different aria-label/text names independently', () => {
    const html = '<a href="/a">Same</a><a href="/b">Same</a><a href="/c">Different</a>';
    const result = findAmbiguousLinkNames(html);
    expect(result).toEqual([{ name: 'Same', hrefs: ['/a', '/b'] }]);
  });
});
