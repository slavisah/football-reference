import { describe, expect, it } from 'vitest';
import { summaryGroupFor } from '../../src/lib/countries';

describe('summaryGroupFor', () => {
  it('groups "West Germany" and "Germany" into the same id with a combined display name', () => {
    const west = summaryGroupFor('West Germany');
    const reunified = summaryGroupFor('Germany');
    expect(west.id).toBe('germany');
    expect(reunified.id).toBe('germany');
    expect(west.displayName).toBe('Germany (incl. West Germany)');
    expect(reunified.displayName).toBe('Germany (incl. West Germany)');
  });

  it('is case-insensitive and trims surrounding whitespace', () => {
    expect(summaryGroupFor('  west germany  ').id).toBe('germany');
    expect(summaryGroupFor('WEST GERMANY').id).toBe('germany');
  });

  it('does not group other historical successor states, only West Germany/Germany', () => {
    // Soviet Union/Russia, Czechoslovakia/Czechia and Yugoslavia's successors
    // are deliberately kept separate per AGENTS.md / docs/PROJECT_STATUS.md's
    // "historical identity rules" - this pins that editorial decision.
    expect(summaryGroupFor('Soviet Union').id).not.toBe(summaryGroupFor('Russia').id);
    expect(summaryGroupFor('Czechoslovakia').id).not.toBe(summaryGroupFor('Czechia').id);
    expect(summaryGroupFor('Yugoslavia').id).not.toBe(summaryGroupFor('Serbia').id);
  });

  it('passes through any other name as its own group, preserving the original display casing', () => {
    const group = summaryGroupFor('  Brazil  ');
    expect(group).toEqual({ id: 'brazil', displayName: 'Brazil' });
  });
});
