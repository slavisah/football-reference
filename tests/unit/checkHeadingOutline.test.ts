import { describe, expect, it } from 'vitest';
import {
  checkHeadingOutline,
  checkPageHeadingOutline,
  extractHeadings,
} from '../../scripts/check-heading-outline.mjs';

describe('extractHeadings', () => {
  it('pulls every heading out of a page, in document order, with attributes ignored', () => {
    const html =
      '<h1 data-astro-cid-abc>Title</h1>' +
      '<p>intro</p>' +
      '<h2 id="section-one">Section one</h2>' +
      '<h3 class="foo">Sub-section</h3>';
    expect(extractHeadings(html)).toEqual([
      { level: 1, text: 'Title' },
      { level: 2, text: 'Section one' },
      { level: 3, text: 'Sub-section' },
    ]);
  });

  it('strips nested markup and collapses whitespace when reading heading text', () => {
    const html = '<h2>\n  <a href="/foo">Foo</a>  bar\n</h2>';
    expect(extractHeadings(html)).toEqual([{ level: 2, text: 'Foo bar' }]);
  });

  it('returns an empty array for a page with no headings', () => {
    expect(extractHeadings('<html><body><p>no headings here</p></body></html>')).toEqual([]);
  });
});

describe('checkHeadingOutline', () => {
  it('accepts a single <h1> followed by a step-by-step-deeper outline', () => {
    const headings = [
      { level: 1, text: 'Title' },
      { level: 2, text: 'A' },
      { level: 3, text: 'A.1' },
      { level: 2, text: 'B' },
    ];
    expect(checkHeadingOutline(headings)).toEqual([]);
  });

  it('accepts a heading returning to a shallower level that was already seen', () => {
    const headings = [
      { level: 1, text: 'Title' },
      { level: 2, text: 'A' },
      { level: 3, text: 'A.1' },
      { level: 3, text: 'A.2' },
      { level: 2, text: 'B' },
      { level: 3, text: 'B.1' },
    ];
    expect(checkHeadingOutline(headings)).toEqual([]);
  });

  it('flags a page with no <h1> at all', () => {
    const headings = [{ level: 2, text: 'A' }];
    expect(checkHeadingOutline(headings)).toEqual(['page has no <h1>']);
  });

  it('flags a page with more than one <h1>', () => {
    const headings = [
      { level: 1, text: 'Title' },
      { level: 1, text: 'Second title' },
    ];
    expect(checkHeadingOutline(headings)).toEqual(['page has 2 <h1> elements, expected exactly 1']);
  });

  it('flags a heading level skip, naming the from/to levels and the offending heading text', () => {
    const headings = [
      { level: 1, text: 'Title' },
      { level: 2, text: 'A' },
      { level: 4, text: 'Too deep' },
    ];
    expect(checkHeadingOutline(headings)).toEqual([
      'heading level jumps from h2 to h4 ("Too deep") (skips a level)',
    ]);
  });

  it('does not flag a level skip once the deeper level has already been reached elsewhere on the page', () => {
    const headings = [
      { level: 1, text: 'Title' },
      { level: 2, text: 'A' },
      { level: 3, text: 'A.1' },
      { level: 2, text: 'B' },
      { level: 3, text: 'B.1' },
    ];
    expect(checkHeadingOutline(headings)).toEqual([]);
  });

  it('reports a heading skip without a text label when the heading has no text', () => {
    const headings = [
      { level: 1, text: 'Title' },
      { level: 3, text: '' },
    ];
    expect(checkHeadingOutline(headings)).toEqual(['heading level jumps from h1 to h3 (skips a level)']);
  });
});

describe('checkPageHeadingOutline', () => {
  it('returns no failures for a page with a clean outline', () => {
    const html = '<h1>Title</h1><h2>Section</h2>';
    expect(checkPageHeadingOutline('/', html)).toEqual([]);
  });

  it('tags every issue found with the given page path', () => {
    const html = '<h2>Section</h2><h4>Too deep</h4>';
    const failures = checkPageHeadingOutline('/glossary/', html);
    expect(failures).toEqual([
      { pagePath: '/glossary/', issue: 'page has no <h1>' },
      { pagePath: '/glossary/', issue: 'heading level jumps from h2 to h4 ("Too deep") (skips a level)' },
    ]);
  });
});
