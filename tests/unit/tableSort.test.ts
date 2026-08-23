import { describe, expect, it } from 'vitest';
import { buildSortOptions, compareCellText, defaultSortValue } from '../../src/lib/tableSort';

describe('buildSortOptions', () => {
  it('offers Year, Winner, Host and a quantity column when all are present', () => {
    const options = buildSortOptions(['Year', 'Host(s)', 'Teams', 'Winner', 'Runner-up', 'Final']);
    const values = options.map((o) => o.value);
    expect(values).toEqual([
      'year-asc',
      'year-desc',
      'winner-asc',
      'winner-desc',
      'host-s-asc',
      'host-s-desc',
      'teams-asc',
      'teams-desc',
    ]);
    // Runner-up/Final aren't offered - they're not one of the meaningful roles.
    expect(values.some((v) => v.startsWith('runner'))).toBe(false);
    expect(values.some((v) => v.startsWith('final'))).toBe(false);
  });

  it('labels the year column with newest/oldest wording', () => {
    const options = buildSortOptions(['Year', 'Winner']);
    expect(options.find((o) => o.value === 'year-desc')).toMatchObject({
      label: 'Year (newest first)',
      colIndex: 0,
      dir: 'desc',
    });
    expect(options.find((o) => o.value === 'year-asc')).toMatchObject({
      label: 'Year (oldest first)',
    });
  });

  it('labels a quantity column (Teams/Goals) with most/fewest wording', () => {
    const options = buildSortOptions(['Year', 'Player(s)', 'Team', 'Goals']);
    expect(options.find((o) => o.value === 'goals-desc')).toMatchObject({
      label: 'Goals (most first)',
      colIndex: 3,
    });
    expect(options.find((o) => o.value === 'goals-asc')).toMatchObject({
      label: 'Goals (fewest first)',
    });
  });

  it('labels a text column (Winner/Champion/Host) with A-Z/Z-A wording', () => {
    const options = buildSortOptions(['Year', 'Host / format', 'Champion', 'Runner-up']);
    expect(options.find((o) => o.value === 'champion-asc')).toMatchObject({
      label: 'Champion (A–Z)',
      colIndex: 2,
    });
    expect(options.find((o) => o.value === 'host-format-desc')).toMatchObject({
      label: 'Host / format (Z–A)',
      colIndex: 1,
    });
  });

  it('omits a role entirely when the table has no matching column', () => {
    // Ballon d'Or: no host column, no quantity column.
    const options = buildSortOptions(['Year', 'Winner', 'National team']);
    expect(options).toHaveLength(4);
    expect(options.every((o) => o.value.startsWith('year') || o.value.startsWith('winner'))).toBe(
      true,
    );
  });

  it('recognizes Season as the year role and Player(s) as the winner role', () => {
    const seasonOptions = buildSortOptions(['Season', 'Finals host', 'Winner']);
    expect(seasonOptions.find((o) => o.value === 'season-desc')).toMatchObject({
      label: 'Season (newest first)',
    });

    const playerOptions = buildSortOptions(['Year', 'Player(s)', 'Team', 'Goals']);
    expect(playerOptions.find((o) => o.value === 'player-s-asc')).toMatchObject({
      label: 'Player(s) (A–Z)',
      colIndex: 1,
    });
  });

  it('tags each option with its role, for locale-independent default selection', () => {
    const options = buildSortOptions(['Year', 'Host', 'Teams', 'Winner']);
    expect(options.find((o) => o.value === 'year-desc')).toMatchObject({ role: 'year' });
    expect(options.find((o) => o.value === 'teams-asc')).toMatchObject({ role: 'quantity' });
    expect(options.find((o) => o.value === 'winner-asc')).toMatchObject({ role: 'text' });
  });

  it('translates the suffix wording and the header display text for a given locale', () => {
    const options = buildSortOptions(['Year', 'Host / format', 'Champion'], {
      locale: 'hr',
      headerLabels: { Year: 'Godina', 'Host / format': 'Domaćin / format', Champion: 'Prvak' },
    });
    expect(options.find((o) => o.value === 'year-desc')).toMatchObject({
      label: 'Godina (najnoviji prvi)',
    });
    expect(options.find((o) => o.value === 'champion-asc')).toMatchObject({
      label: 'Prvak (A–Ž)',
    });
    // The <option> value stays keyed off the raw English header, so a shared
    // `?sort=` link works the same regardless of which locale generated it.
    expect(options.find((o) => o.label === 'Domaćin / format (Ž–A)')).toMatchObject({
      value: 'host-format-desc',
    });
  });
});

describe('defaultSortValue', () => {
  it('picks Year newest-first when present', () => {
    const options = buildSortOptions(['Year', 'Host', 'Teams', 'Winner']);
    expect(defaultSortValue(options)).toBe('year-desc');
  });

  it('falls back to the first option when there is no year column', () => {
    const options = buildSortOptions(['Winner', 'National team']);
    expect(defaultSortValue(options)).toBe(options[0].value);
  });

  it('falls back to an empty string when there are no sort options at all', () => {
    expect(defaultSortValue([])).toBe('');
  });
});

describe('compareCellText', () => {
  it('compares numbers embedded in text numerically, not lexically', () => {
    expect(compareCellText('2', '10', 'asc')).toBeLessThan(0);
    expect(compareCellText('16', '4', 'asc')).toBeGreaterThan(0);
  });

  it('compares text alphabetically, case-insensitively', () => {
    expect(compareCellText('argentina', 'Brazil', 'asc')).toBeLessThan(0);
    expect(compareCellText('Spain', 'France', 'desc')).toBeLessThan(0);
  });

  it('preserves a historical note verbatim - it only ever reorders, never rewrites', () => {
    // "Not awarded" (Ballon d'Or 2020) is just text like any other winner value,
    // sorted alphabetically ("N" after "L") rather than dropped or altered.
    expect(compareCellText('Not awarded', 'Lionel Messi', 'asc')).toBeGreaterThan(0);
    expect(compareCellText('Not awarded', 'Lionel Messi', 'desc')).toBeLessThan(0);
  });

  it('always sorts blank cells and the "no data" em dash last, in both directions', () => {
    expect(compareCellText('', 'France', 'asc')).toBeGreaterThan(0);
    expect(compareCellText('—', 'France', 'desc')).toBeGreaterThan(0);
    expect(compareCellText('France', '—', 'asc')).toBeLessThan(0);
    expect(compareCellText('—', '—', 'asc')).toBe(0);
  });
});
