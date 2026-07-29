import { describe, expect, it } from 'vitest';
import { extractSources, extractSourceSections } from '../../src/lib/sources';

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
