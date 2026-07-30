import { describe, expect, it } from 'vitest';
import { extractSection, extractSections, renderInlineMarkdown } from '../../src/lib/notes';

const doc = `# FIFA World Cup

Intro paragraph.

## Format milestones

- **1930:** 13 teams played the first edition.
- **1998:** the field expanded to 32 teams.

## Memorable moments

- Uruguay defeated Brazil in 1950, a result remembered as the *Maracanazo*.
- Croatia reached its first final in 2018.

## Editorial notes

- The 1930 tournament did not include a third-place match.

## Suggested child-friendly features

- Tap a year to reveal a short story.
`;

const paragraphDoc = `# UEFA European Championship

## Historical format note

A third-place match was played through 1980. From 1984 onward, UEFA recognizes
both defeated semifinalists.

## Memorable moments

- Antonín Panenka's famous chipped penalty decided the 1976 shoot-out.
`;

describe('extractSection', () => {
  it('returns each bullet as its own item', () => {
    const section = extractSection(doc, 'Memorable moments');
    expect(section).toEqual({
      heading: 'Memorable moments',
      items: [
        'Uruguay defeated Brazil in 1950, a result remembered as the *Maracanazo*.',
        'Croatia reached its first final in 2018.',
      ],
    });
  });

  it('stops at the next heading of the same or shallower level', () => {
    const section = extractSection(doc, 'Editorial notes');
    expect(section?.items).toEqual([
      'The 1930 tournament did not include a third-place match.',
    ]);
  });

  it('matches heading text case-insensitively', () => {
    const section = extractSection(doc, 'memorable moments');
    expect(section?.items).toHaveLength(2);
  });

  it('returns null for a heading that does not exist', () => {
    expect(extractSection(doc, 'Nonexistent heading')).toBeNull();
  });

  it('joins a non-bulleted section into a single paragraph item', () => {
    const section = extractSection(paragraphDoc, 'Historical format note');
    expect(section?.items).toEqual([
      'A third-place match was played through 1980. From 1984 onward, UEFA recognizes ' +
        'both defeated semifinalists.',
    ]);
  });
});

describe('extractSections', () => {
  it('returns sections in the requested order, skipping missing headings', () => {
    const sections = extractSections(doc, [
      'Format milestones',
      'Memorable moments',
      'Not a real heading',
      'Editorial notes',
    ]);
    expect(sections.map((s) => s.heading)).toEqual([
      'Format milestones',
      'Memorable moments',
      'Editorial notes',
    ]);
  });

  it('never returns a heading that was not requested', () => {
    const sections = extractSections(doc, ['Memorable moments']);
    expect(sections.some((s) => s.heading === 'Suggested child-friendly features')).toBe(false);
  });
});

describe('renderInlineMarkdown', () => {
  it('converts **bold**, *italic* and `code`', () => {
    expect(renderInlineMarkdown('**1930:** the *Maracanazo* was a `shock`.')).toBe(
      '<strong>1930:</strong> the <em>Maracanazo</em> was a <code>shock</code>.',
    );
  });

  it('escapes raw HTML before applying Markdown so untrusted-looking text cannot inject tags', () => {
    expect(renderInlineMarkdown('<script>alert(1)</script> & co')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; co',
    );
  });

  it('leaves plain text without markers unchanged', () => {
    expect(renderInlineMarkdown('Plain text.')).toBe('Plain text.');
  });
});
