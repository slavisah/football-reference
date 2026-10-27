import { describe, expect, it } from 'vitest';
import { countLines, exceedsBudget, ROADMAP_LINE_BUDGET } from '../../scripts/check-roadmap-size.mjs';

describe('countLines', () => {
  it('counts newline-terminated lines the same way `wc -l` does', () => {
    expect(countLines('a\nb\nc\n')).toBe(3);
  });

  it('still counts a final, unterminated line', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });

  it('returns 0 for an empty file', () => {
    expect(countLines('')).toBe(0);
  });

  it('returns 1 for a single line with no trailing newline', () => {
    expect(countLines('a')).toBe(1);
  });
});

describe('exceedsBudget', () => {
  it('is false when under budget', () => {
    expect(exceedsBudget(100, 800)).toBe(false);
  });

  it('is false when exactly at budget', () => {
    expect(exceedsBudget(800, 800)).toBe(false);
  });

  it('is true when over budget', () => {
    expect(exceedsBudget(801, 800)).toBe(true);
  });
});

describe('ROADMAP_LINE_BUDGET', () => {
  it('is a positive number', () => {
    expect(ROADMAP_LINE_BUDGET).toBeGreaterThan(0);
  });
});
