import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../scripts/check-records-against-source.mjs';
import {
  deepEqual,
  extractJsonArray,
  groupDisplayName,
  groupId,
  tallyCompetition,
} from '../../scripts/check-compare-against-source.mjs';

describe('groupId / groupDisplayName', () => {
  it('merges West Germany and Germany under one "germany" id', () => {
    expect(groupId('West Germany')).toBe('germany');
    expect(groupId('Germany')).toBe('germany');
    expect(groupDisplayName('West Germany')).toBe('Germany (incl. West Germany)');
    expect(groupDisplayName('Germany')).toBe('Germany (incl. West Germany)');
  });

  it('leaves every other name as itself, lowercased for the id only', () => {
    expect(groupId('Argentina')).toBe('argentina');
    expect(groupDisplayName('Argentina')).toBe('Argentina');
  });
});

const TABLE = {
  heading: 'Editions',
  headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
  rows: [
    ['1930', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
    ['1934', 'Italy', 'Czechoslovakia', 'Germany', 'Austria'],
    ['1950', 'Uruguay', 'Brazil', '—', '—'],
    ['1954', 'West Germany', 'Hungary', 'Austria', 'Uruguay'],
  ],
};

const editions = buildEditions(TABLE, { year: 'Year', winner: 'Winner', runner: 'Runner-up', third: 'Third', fourth: 'Fourth' });

describe('tallyCompetition', () => {
  const byId = tallyCompetition(editions);

  it('tallies titles and runner-up finishes per team, aliasing West Germany/Germany into one entry', () => {
    expect(byId.get('uruguay')).toEqual({
      displayName: 'Uruguay',
      titles: 2,
      titleYears: ['1930', '1950'],
      runnerUps: 0,
      runnerUpYears: [],
      semifinals: 1,
    });
    expect(byId.get('germany')).toEqual({
      displayName: 'Germany (incl. West Germany)',
      titles: 1,
      titleYears: ['1954'],
      runnerUps: 0,
      runnerUpYears: [],
      semifinals: 1,
    });
  });

  it('tallies a runner-up finish separately from a title', () => {
    expect(byId.get('argentina')).toEqual({
      displayName: 'Argentina',
      titles: 0,
      titleYears: [],
      runnerUps: 1,
      runnerUpYears: ['1930'],
      semifinals: 0,
    });
  });

  it('never tallies an empty/placeholder third-or-fourth cell as a semifinal finish', () => {
    expect(byId.has('—')).toBe(false);
  });
});

describe('extractJsonArray', () => {
  it('parses a define:vars-style "const name = [...]" array embedded in a page', () => {
    const html = `<script is:inline>const records = [{"id":"a","nested":["x","y"]},{"id":"b"}];\nconst other = [1];</script>`;
    expect(extractJsonArray(html, 'records')).toEqual([{ id: 'a', nested: ['x', 'y'] }, { id: 'b' }]);
  });

  it('does not stop at a "]" that only appears inside a string value', () => {
    const html = `const records = [{"note":"a tie, e.g. [1962]"},{"id":"b"}];`;
    expect(extractJsonArray(html, 'records')).toEqual([{ note: 'a tie, e.g. [1962]' }, { id: 'b' }]);
  });

  it('throws when the named const is not present', () => {
    expect(() => extractJsonArray('<script>const other = [];</script>', 'records')).toThrow(/no "const records = "/);
  });
});

describe('deepEqual', () => {
  it('is true for equal values regardless of object key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('is false when array order differs', () => {
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
  });

  it('is false when a nested value differs', () => {
    expect(deepEqual({ a: [{ x: 1 }] }, { a: [{ x: 2 }] })).toBe(false);
  });
});
