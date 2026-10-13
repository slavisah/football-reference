import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../scripts/check-records-against-source.mjs';
import {
  appearancesByTeam,
  describeAppearances,
  parseTeamSportsTeamBlocks,
  teamProfileSlug,
} from '../../scripts/check-team-profiles-against-source.mjs';

describe('teamProfileSlug', () => {
  it('lowercases and hyphenates a plain name', () => {
    expect(teamProfileSlug('Germany')).toBe('germany');
  });

  it('strips diacritics and collapses non-ASCII runs to a single hyphen', () => {
    expect(teamProfileSlug('Türkiye')).toBe('turkiye');
    expect(teamProfileSlug('south korea')).toBe('south-korea');
  });
});

const TABLE = {
  heading: 'Editions',
  headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
  rows: [
    ['1930', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
    ['1934', 'Italy', 'Czechoslovakia', 'Germany', 'Austria'],
    ['1954', 'West Germany', 'Hungary', 'Austria', 'Uruguay'],
  ],
};

const editions = buildEditions(TABLE, { year: 'Year', winner: 'Winner', runner: 'Runner-up', third: 'Third', fourth: 'Fourth' });

describe('appearancesByTeam', () => {
  it('attaches the exact source column label as the role for a third/fourth finish', () => {
    const byId = appearancesByTeam(editions, { third: 'Third', fourth: 'Fourth' });
    expect(byId.get('united states')).toEqual({
      displayName: 'United States',
      appearances: [{ year: '1930', role: 'Third' }],
    });
  });

  it('merges West Germany and Germany under one "germany" id/display name', () => {
    const byId = appearancesByTeam(editions, { third: 'Third', fourth: 'Fourth' });
    expect(byId.get('germany')).toEqual({
      displayName: 'Germany (incl. West Germany)',
      appearances: [
        { year: '1934', role: 'Third' },
        { year: '1954', role: 'Champion' },
      ],
    });
  });

  it('sorts a merged team’s own appearances chronologically regardless of row order', () => {
    const reordered = buildEditions(
      { headers: ['Year', 'Winner', 'Runner-up'], rows: [['1954', 'West Germany', 'Hungary'], ['1934', 'Germany', 'Italy']] },
      { year: 'Year', winner: 'Winner', runner: 'Runner-up' },
    );
    const byId = appearancesByTeam(reordered, {});
    expect(byId.get('germany').appearances.map((a: { year: string }) => a.year)).toEqual(['1934', '1954']);
  });

  it('never records an appearance for an empty/placeholder cell', () => {
    const withGap = buildEditions(
      { headers: ['Year', 'Winner', 'Third'], rows: [['1930', 'Uruguay', '—']] },
      { year: 'Year', winner: 'Winner', third: 'Third' },
    );
    const byId = appearancesByTeam(withGap, { third: 'Third' });
    expect(byId.size).toBe(1);
    expect(byId.has('—')).toBe(false);
  });
});

describe('describeAppearances', () => {
  it('formats "Role (Year), Role (Year), ..." matching defaultTeamProfileDescription()', () => {
    expect(
      describeAppearances([
        { year: '1934', role: 'Third' },
        { year: '1954', role: 'Champion' },
      ]),
    ).toBe('Third (1934), Champion (1954)');
  });

  it('returns the empty string for no appearances', () => {
    expect(describeAppearances([])).toBe('');
  });
});

describe('parseTeamSportsTeamBlocks', () => {
  it('extracts a SportsTeam block by name, ignoring other JSON-LD types on the page', () => {
    const html = `
      <script type="application/ld+json">{"@type":"ItemList","name":"X - competition appearances","itemListElement":[]}</script>
      <script type="application/ld+json">{"@type":"SportsTeam","name":"Germany (incl. West Germany)","award":["FIFA World Cup 1954","FIFA World Cup 1974"]}</script>
    `;
    const blocks = parseTeamSportsTeamBlocks(html);
    expect(blocks.size).toBe(1);
    expect(blocks.get('Germany (incl. West Germany)')).toEqual(['FIFA World Cup 1954', 'FIFA World Cup 1974']);
  });
});
