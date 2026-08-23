import { describe, expect, it, vi } from 'vitest';

// loadCompetition()/loadPageMeta() call astro:content's getEntry(), which
// only exists inside an Astro build - stub it the same way homeCards.test.ts
// does so this file can call the real functions under plain Vitest.
vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { getEntry } = await import('astro:content');
const { loadCompetition, loadPageMeta } = await import('../../src/lib/competition');
const { ContentValidationError } = await import('../../src/lib/validate');

const mockGetEntry = vi.mocked(getEntry);

type FakeEntry = { data: Record<string, unknown>; body: string | undefined };

function entry(body: string | undefined, data: Record<string, unknown> = {}): FakeEntry {
  return {
    data: { title: 'Test Competition', lastReviewed: '2026-01-01', status: 'verified', ...data },
    body,
  };
}

const editionsTable = (heading: string): string => `# Test Competition

Intro paragraph for the competition.

## ${heading}

| Year | Host | Winner |
|---|---|---|
| 2020 | Testland | Testland |
| 2024 | Otherland | Testland |
`;

describe('loadPageMeta', () => {
  it('reads title/lastReviewed/status from front matter and the intro from the first paragraph', async () => {
    mockGetEntry.mockResolvedValueOnce(
      entry('# Title\n\nThis is the intro.\n\nThis is not.', {
        title: 'A Page',
        lastReviewed: '2026-02-02',
        status: 'draft',
      }),
    );
    const meta = await loadPageMeta('a-page');
    expect(meta).toEqual({
      title: 'A Page',
      intro: 'This is the intro.',
      lastReviewed: '2026-02-02',
      status: 'draft',
      notes: [],
    });
  });

  it('joins a wrapped multi-line paragraph with spaces, matching content/*.md hard-wrapped prose', async () => {
    mockGetEntry.mockResolvedValueOnce(
      entry('# Title\n\nLine one of the intro\nline two of the intro\nline three.\n\nNext paragraph.'),
    );
    const meta = await loadPageMeta('wrapped');
    expect(meta.intro).toBe('Line one of the intro line two of the intro line three.');
  });

  it('skips leading blank lines and consecutive heading lines before the first paragraph', async () => {
    // Mirrors content/golden-boot.md's shape: an H1 title, then straight into
    // another heading with no paragraph between them, before the real prose.
    mockGetEntry.mockResolvedValueOnce(
      entry('\n\n# Title\n# Another heading right after\n\nActual intro text.\n\n## Section\n'),
    );
    const meta = await loadPageMeta('double-heading');
    expect(meta.intro).toBe('Actual intro text.');
  });

  it('returns an empty intro when the body has no paragraph at all', async () => {
    mockGetEntry.mockResolvedValueOnce(entry('# Title Only\n'));
    const meta = await loadPageMeta('heading-only');
    expect(meta.intro).toBe('');
  });

  it('treats a missing body as empty rather than throwing', async () => {
    mockGetEntry.mockResolvedValueOnce(entry(undefined));
    const meta = await loadPageMeta('no-body');
    expect(meta.intro).toBe('');
  });

  it('stops the intro paragraph at a heading that follows it directly, with no blank line between', async () => {
    mockGetEntry.mockResolvedValueOnce(
      entry('# Title\n\nActual intro text.\n## Next section heading right after\n\nMore text.'),
    );
    const meta = await loadPageMeta('heading-right-after');
    expect(meta.intro).toBe('Actual intro text.');
  });

  it('pulls requested note sections via noteHeadings', async () => {
    mockGetEntry.mockResolvedValueOnce(
      entry('# Title\n\nIntro.\n\n## Key facts\n\n- First fact.\n- Second fact.\n'),
    );
    const meta = await loadPageMeta('with-notes', ['Key facts']);
    expect(meta.notes).toEqual([{ heading: 'Key facts', items: ['First fact.', 'Second fact.'] }]);
  });

  it('throws when the content entry does not exist', async () => {
    mockGetEntry.mockResolvedValueOnce(undefined);
    await expect(loadPageMeta('missing')).rejects.toThrow(
      'Content entry "missing" was not found in the pages collection.',
    );
  });
});

describe('loadCompetition', () => {
  it('builds editions, champions, winners, hosts and sources from the matching Editions table', async () => {
    mockGetEntry.mockResolvedValueOnce(entry(editionsTable('Editions')));
    const data = await loadCompetition('test-competition', { sourcesHeading: 'FIFA World Cup' });

    expect(data.title).toBe('Test Competition');
    expect(data.intro).toBe('Intro paragraph for the competition.');
    expect(data.editions).toHaveLength(2);
    expect(data.winners).toEqual(['Testland']);
    expect(data.hosts).toEqual(['Otherland', 'Testland']);
    expect(data.champions[0]).toMatchObject({ displayName: 'Testland', titles: 2 });
    // sourcesHeading points at a real docs/SOURCES.md section, so this is a
    // live integration check that the wiring to sourcesRaw actually resolves.
    expect(data.sources.length).toBeGreaterThan(0);
  });

  it('uses a non-default editionsHeading when the content table is under a different heading', async () => {
    mockGetEntry.mockResolvedValueOnce(entry(editionsTable('Champions timeline')));
    const data = await loadCompetition('test-competition', {
      editionsHeading: 'Champions timeline',
      sourcesHeading: 'nonexistent heading',
    });
    expect(data.editions).toHaveLength(2);
    expect(data.sources).toEqual([]);
  });

  it('throws when no table exists under the requested editionsHeading', async () => {
    mockGetEntry.mockResolvedValueOnce(entry(editionsTable('Editions')));
    await expect(
      loadCompetition('test-competition', { editionsHeading: 'Nonexistent', sourcesHeading: 'x' }),
    ).rejects.toThrow('Could not find a "Nonexistent" table in content/test-competition.md.');
  });

  it('throws when the content entry does not exist', async () => {
    mockGetEntry.mockResolvedValueOnce(undefined);
    await expect(
      loadCompetition('missing', { sourcesHeading: 'x' }),
    ).rejects.toThrow('Content entry "missing" was not found in the pages collection.');
  });

  it('treats a missing body as empty rather than throwing a TypeError, failing on the missing table instead', async () => {
    mockGetEntry.mockResolvedValueOnce(entry(undefined));
    await expect(
      loadCompetition('no-body', { sourcesHeading: 'x' }),
    ).rejects.toThrow('Could not find a "Editions" table in content/no-body.md.');
  });

  it('rejects a duplicate year/season by default, but allows it via allowDuplicateYears', async () => {
    const duplicateYearBody = `# Test

Intro.

## Editions

| Year | Winner |
|---|---|
| 1959 | A |
| 1959 | B |
`;
    mockGetEntry.mockResolvedValueOnce(entry(duplicateYearBody));
    await expect(
      loadCompetition('dup', { sourcesHeading: 'x' }),
    ).rejects.toThrow(ContentValidationError);

    mockGetEntry.mockResolvedValueOnce(entry(duplicateYearBody));
    const data = await loadCompetition('dup', { sourcesHeading: 'x', allowDuplicateYears: ['1959'] });
    expect(data.editions).toHaveLength(2);
  });
});
