import { describe, expect, it } from 'vitest';
import { describeAppearances, parsePlayerPersonBlocks, playerProfileSlug, teamFor } from '../../scripts/check-player-profiles-against-source.mjs';

describe('playerProfileSlug', () => {
  it('lowercases and hyphenates a plain name', () => {
    expect(playerProfileSlug('Gerd Muller')).toBe('gerd-muller');
  });

  it('strips diacritics and collapses non-ASCII runs to a single hyphen', () => {
    expect(playerProfileSlug('Flórián Albert')).toBe('florian-albert');
    expect(playerProfileSlug('Dražan Jerković')).toBe('drazan-jerkovic');
  });
});

describe('teamFor', () => {
  it('returns the whole cell for a single winner', () => {
    expect(teamFor('Argentina', 0, 1)).toBe('Argentina');
  });

  it('aligns a joined team cell with the same-index winner when counts match', () => {
    expect(teamFor('Bulgaria; Russia', 0, 2)).toBe('Bulgaria');
    expect(teamFor('Bulgaria; Russia', 1, 2)).toBe('Russia');
  });

  it('omits the team for the "Multiple" tie placeholder', () => {
    expect(teamFor('Multiple', 0, 6)).toBeUndefined();
  });

  it('omits the team when the joined list and winner count disagree', () => {
    expect(teamFor('Hungary; Spain', 2, 3)).toBeUndefined();
  });

  it('omits the team for an empty/placeholder cell', () => {
    expect(teamFor('—', 0, 1)).toBeUndefined();
    expect(teamFor(undefined, 0, 1)).toBeUndefined();
  });
});

describe('describeAppearances', () => {
  it('formats "Year (detail), ..." matching defaultPlayerProfileDescription()', () => {
    expect(
      describeAppearances([
        { year: '1970', detail: 'West Germany · 10 goals' },
        { year: '2002', detail: '' },
      ]),
    ).toBe('1970 (West Germany · 10 goals), 2002');
  });

  it('returns the empty string for no appearances', () => {
    expect(describeAppearances([])).toBe('');
  });
});

describe('parsePlayerPersonBlocks', () => {
  it('extracts a Person block by name, ignoring other JSON-LD types on the page', () => {
    const html = `
      <script type="application/ld+json">{"@type":"ItemList","name":"X - full award history","itemListElement":[]}</script>
      <script type="application/ld+json">{"@type":"Person","name":"Gerd Müller","award":["Ballon d'Or 1970","FIFA World Cup Golden Boot 1970"]}</script>
    `;
    const blocks = parsePlayerPersonBlocks(html);
    expect(blocks.size).toBe(1);
    expect(blocks.get('Gerd Müller')).toEqual(["Ballon d'Or 1970", 'FIFA World Cup Golden Boot 1970']);
  });
});
