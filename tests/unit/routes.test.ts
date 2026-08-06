import { describe, expect, it } from 'vitest';
import { NAV_LINKS } from '../../src/lib/routes';

describe('NAV_LINKS', () => {
  it('gives every nav link a non-empty Croatian label distinct from a blank string', () => {
    for (const link of NAV_LINKS) {
      expect(link.labelHr, `missing Croatian label for ${link.path}`).toBeTruthy();
    }
  });

  it('gives every nav link a unique Croatian label, so the Croatian nav has no duplicate entries', () => {
    const labels = NAV_LINKS.map((link) => link.labelHr);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
