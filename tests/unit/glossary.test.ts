import { describe, expect, it, vi } from 'vitest';

// parseGlossaryEntries/hasAbbreviation/abbreviateFinalScore are pure, but
// glossary.ts also imports astro:content's getEntry() at module scope (for
// loadGlossaryEntries), which only resolves inside Astro's own runtime - see
// tests/unit/competition.test.ts for the identical pattern this mirrors.
vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { abbreviateFinalScore, hasAbbreviation, parseGlossaryEntries } = await import(
  '../../src/lib/glossary'
);

const doc = `# Glossary

Intro paragraph explaining the page.

## a.e.t.

Short for **after extra time**. Two more 15-minute halves.

## pens

Short for a penalty shoot-out.
Second line of the same paragraph.

## runner-up

The team or player that finished second.
`;

describe('parseGlossaryEntries', () => {
  it('parses one entry per H2 heading, joining its lines into one definition', () => {
    const entries = parseGlossaryEntries(doc);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      term: 'a.e.t.',
      definition: 'Short for **after extra time**. Two more 15-minute halves.',
    });
    expect(entries[1]).toEqual({
      term: 'pens',
      definition: 'Short for a penalty shoot-out. Second line of the same paragraph.',
    });
    expect(entries[2].term).toBe('runner-up');
  });

  it('drops a term with a heading but no content beneath it', () => {
    const entries = parseGlossaryEntries('# Glossary\n\n## Empty term\n\n## Real term\n\nSome text.');
    expect(entries).toEqual([{ term: 'Real term', definition: 'Some text.' }]);
  });

  it('returns an empty array for markdown with no H2 headings', () => {
    expect(parseGlossaryEntries('# Glossary\n\nJust an intro paragraph.')).toEqual([]);
  });
});

describe('hasAbbreviation', () => {
  it('detects a.e.t. and pens', () => {
    expect(hasAbbreviation('Italy 2–1 Czechoslovakia (a.e.t.)')).toBe(true);
    expect(hasAbbreviation('Brazil 0–0 Italy; 3–2 pens')).toBe(true);
  });

  it('is false for a plain final score with neither token', () => {
    expect(hasAbbreviation('Uruguay 4–2 Argentina')).toBe(false);
  });

  it('does not false-positive on "pens" as a substring of another word', () => {
    expect(hasAbbreviation('Expensive replay')).toBe(false);
  });
});

describe('abbreviateFinalScore', () => {
  it('wraps a.e.t. in an English <abbr> title', () => {
    const html = abbreviateFinalScore('Italy 2–1 Czechoslovakia (a.e.t.)', 'en');
    expect(html).toBe('Italy 2–1 Czechoslovakia (<abbr title="after extra time">a.e.t.</abbr>)');
  });

  it('wraps pens in a Croatian <abbr> title', () => {
    const html = abbreviateFinalScore('Brazil 0–0 Italy; 3–2 pens', 'hr');
    expect(html).toBe('Brazil 0–0 Italy; 3–2 <abbr title="raspucavanje jedanaesteraca">pens</abbr>');
  });

  it('defaults to English when no locale is given', () => {
    expect(abbreviateFinalScore('France 2–1 Spain (a.e.t.)')).toContain('title="after extra time"');
  });

  it('escapes HTML-significant characters before wrapping', () => {
    expect(abbreviateFinalScore('A & B (a.e.t.)')).toBe(
      'A &amp; B (<abbr title="after extra time">a.e.t.</abbr>)',
    );
  });

  it('leaves a plain score with neither token unchanged apart from escaping', () => {
    expect(abbreviateFinalScore('Uruguay 4–2 Argentina')).toBe('Uruguay 4–2 Argentina');
  });
});
