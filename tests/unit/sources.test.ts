import { describe, expect, it } from 'vitest';
import {
  extractSources,
  extractSourceSections,
  validateSourceSections,
} from '../../src/lib/sources';
import { ContentValidationError } from '../../src/lib/validate';

const doc = `# Sources

## FIFA World Cup

- FIFA tournament history and champions:
  - https://www.fifa.com/en/one
  - https://www.fifa.com/en/two
- FIFA 2026 awards:
  - https://www.fifa.com/en/awards

## UEFA EURO

- UEFA history:
  - https://www.uefa.com/history/
`;

describe('extractSources', () => {
  it('returns links only from the requested competition section', () => {
    const links = extractSources(doc, 'FIFA World Cup');
    expect(links).toHaveLength(3);
    expect(links.every((l) => l.url.includes('fifa.com'))).toBe(true);
  });

  it('labels links with the nearest bullet text', () => {
    const links = extractSources(doc, 'FIFA World Cup');
    expect(links[0].label).toBe('FIFA tournament history and champions');
    expect(links[2].label).toBe('FIFA 2026 awards');
  });

  it('matches headings case-insensitively and isolates sections', () => {
    const euro = extractSources(doc, 'uefa euro');
    expect(euro).toHaveLength(1);
    expect(euro[0].url).toBe('https://www.uefa.com/history/');
  });

  it('returns an empty array for an unknown section', () => {
    expect(extractSources(doc, 'Copa América')).toEqual([]);
  });

  it('extracts every URL on a line, not just the first', () => {
    const twoPerLine = `## Copa América\n\n- https://www.rsssf.org/tables/37sa.html ; https://en.wikipedia.org/wiki/1937_South_American_Championship\n`;
    const links = extractSources(twoPerLine, 'Copa América');
    expect(links.map((l) => l.url)).toEqual([
      'https://www.rsssf.org/tables/37sa.html',
      'https://en.wikipedia.org/wiki/1937_South_American_Championship',
    ]);
  });

  it('preserves a URL that legitimately ends in a balanced closing parenthesis', () => {
    const wiki = `## Copa América\n\n- https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina)\n`;
    const links = extractSources(wiki, 'Copa América');
    expect(links[0].url).toBe(
      'https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina)',
    );
  });

  it('still strips a markdown-link closing paren that has no matching opening paren in the URL', () => {
    const wrapped = `## Copa América\n\n- see (https://example.com/page)\n`;
    const links = extractSources(wrapped, 'Copa América');
    expect(links[0].url).toBe('https://example.com/page');
  });

  it('strips trailing sentence punctuation after a parenthesised URL', () => {
    const trailing = `## Copa América\n\n- https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina).\n`;
    const links = extractSources(trailing, 'Copa América');
    expect(links[0].url).toBe(
      'https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina)',
    );
  });
});

describe('validateSourceSections', () => {
  it('accepts well-formed http(s) URLs with balanced parentheses', () => {
    expect(() =>
      validateSourceSections([
        {
          heading: 'Copa América',
          links: [
            { label: 'a', url: 'https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina)' },
            { label: 'b', url: 'https://www.rsssf.org/tables/37sa.html' },
          ],
        },
      ]),
    ).not.toThrow();
  });

  it('rejects an unparseable URL', () => {
    expect(() =>
      validateSourceSections([{ heading: 'Test', links: [{ label: 'a', url: 'not a url' }] }]),
    ).toThrow(ContentValidationError);
  });

  it('rejects a non-http(s) protocol', () => {
    expect(() =>
      validateSourceSections([
        { heading: 'Test', links: [{ label: 'a', url: 'ftp://example.com/file' }] },
      ]),
    ).toThrow(/protocol/);
  });

  it('rejects a URL with unbalanced parentheses (a likely truncation)', () => {
    expect(() =>
      validateSourceSections([
        {
          heading: 'Copa América',
          links: [
            {
              label: 'a',
              url: 'https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina',
            },
          ],
        },
      ]),
    ).toThrow(/unbalanced parentheses/);
  });
});

describe('extractSourceSections', () => {
  it('returns every heading that has at least one link, in file order', () => {
    const sections = extractSourceSections(doc);
    expect(sections.map((s) => s.heading)).toEqual(['FIFA World Cup', 'UEFA EURO']);
  });

  it('nests each section\'s own links, matching extractSources for that heading', () => {
    const sections = extractSourceSections(doc);
    const worldCup = sections.find((s) => s.heading === 'FIFA World Cup');
    expect(worldCup?.links).toEqual(extractSources(doc, 'FIFA World Cup'));
  });

  it('skips headings with no links (e.g. a prose-only "Review policy" section)', () => {
    const withPolicy = `${doc}\n## Review policy\n\n1. Check primary sources first.\n`;
    const sections = extractSourceSections(withPolicy);
    expect(sections.some((s) => s.heading === 'Review policy')).toBe(false);
  });
});
