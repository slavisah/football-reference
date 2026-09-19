import { describe, expect, it } from 'vitest';
import { truncateDescription } from '../../src/lib/text';

describe('truncateDescription', () => {
  it('returns text unchanged when it already fits the limit', () => {
    expect(truncateDescription('Short and sweet.')).toBe('Short and sweet.');
  });

  it('returns text unchanged when it is exactly at the limit', () => {
    const exact = 'a'.repeat(160);
    expect(truncateDescription(exact)).toBe(exact);
  });

  it('cuts at the last word boundary before the limit, never mid-word', () => {
    const words = 'word '.repeat(40).trim(); // 199 chars, well over the limit
    const result = truncateDescription(words);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/wor…$/);
  });

  it('strips trailing punctuation left dangling by the cut before adding the ellipsis', () => {
    const text = `${'word '.repeat(30).trim()}, and more text that pushes this well past the limit.`;
    const result = truncateDescription(text);
    expect(result).not.toMatch(/[.,;:]…$/);
    expect(result.endsWith('…')).toBe(true);
  });

  it("truncates a real Golden Boot tie description that lists every co-winner", () => {
    const description =
      'The 1960 UEFA EURO Golden Boot: Milan Galić; Dražan Jerković; Valentin Ivanov; François Heutte; Viktor Ponedelnik won. Full details from the top-scorers table, linked to each player’s complete award history.';
    expect(description.length).toBeGreaterThan(160);
    const result = truncateDescription(description);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.startsWith('The 1960 UEFA EURO Golden Boot:')).toBe(true);
  });

  it('respects a custom maxLength', () => {
    const result = truncateDescription('one two three four five', 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith('…')).toBe(true);
  });

  it('falls back to a hard cut when the text has no space before the limit', () => {
    const noSpaces = 'a'.repeat(200);
    const result = truncateDescription(noSpaces, 10);
    expect(result).toBe(`${'a'.repeat(9)}…`);
  });
});
