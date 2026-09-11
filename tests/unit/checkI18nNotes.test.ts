import { describe, expect, it } from 'vitest';
import { extractNoteCards, diffNoteCards, hrCounterpart } from '../../scripts/check-i18n-notes.mjs';

function card({ heading = 'Heading', intro = '', items = ['One'] }: { heading?: string; intro?: string; items?: string[] }) {
  const introHtml = intro ? `<p class="notes__intro">${intro}</p>` : '';
  const body =
    items.length > 1
      ? `<ul class="notes__list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : `<p>${items[0]}</p>`;
  return `<section class="notes__card card" id="x"><h2>${heading}</h2>${introHtml}${body}</section>`;
}

describe('extractNoteCards', () => {
  it('extracts a single-item (paragraph-only) section', () => {
    const html = card({ heading: 'How it works', items: ['Just one paragraph.'] });
    expect(extractNoteCards(html)).toEqual([{ heading: 'How it works', hasIntro: false, itemCount: 1 }]);
  });

  it('extracts a multi-item (bulleted list) section', () => {
    const html = card({ heading: 'Winning captains', items: ['A', 'B', 'C'] });
    expect(extractNoteCards(html)).toEqual([{ heading: 'Winning captains', hasIntro: false, itemCount: 3 }]);
  });

  it('detects an intro paragraph and excludes it from the item count', () => {
    const html = card({ heading: 'Final venues', intro: 'Some lead-in prose.', items: ['1930', '1934'] });
    expect(extractNoteCards(html)).toEqual([{ heading: 'Final venues', hasIntro: true, itemCount: 2 }]);
  });

  it('strips the icon span markup (but keeps its text) and trims the heading', () => {
    const html =
      '<section class="notes__card card" id="x"><h2><span aria-hidden="true">📝</span> Final venues</h2><p>One.</p></section>';
    expect(extractNoteCards(html)).toEqual([{ heading: '📝 Final venues', hasIntro: false, itemCount: 1 }]);
  });

  it('extracts multiple sections in document order', () => {
    const html = card({ heading: 'First', items: ['A'] }) + card({ heading: 'Second', items: ['B', 'C'] });
    expect(extractNoteCards(html)).toEqual([
      { heading: 'First', hasIntro: false, itemCount: 1 },
      { heading: 'Second', hasIntro: false, itemCount: 2 },
    ]);
  });

  it('returns an empty array when the page has no note cards', () => {
    expect(extractNoteCards('<main><p>Nothing here.</p></main>')).toEqual([]);
  });
});

describe('diffNoteCards', () => {
  it('returns no problems when both pages match exactly', () => {
    const en = [{ heading: 'Final venues', hasIntro: true, itemCount: 5 }];
    const hr = [{ heading: 'Mjesta finala', hasIntro: true, itemCount: 5 }];
    expect(diffNoteCards(en, hr, '/competitions/x/', '/hr/competitions/x/')).toEqual([]);
  });

  it('flags a section-count mismatch and stops there (does not also diff per-section)', () => {
    const en = [
      { heading: 'A', hasIntro: false, itemCount: 1 },
      { heading: 'B', hasIntro: false, itemCount: 1 },
    ];
    const hr = [{ heading: 'A', hasIntro: false, itemCount: 1 }];
    const problems = diffNoteCards(en, hr, '/en/', '/hr/');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('has 2 note section(s)');
    expect(problems[0]).toContain('has 1 -');
  });

  it('flags an item-count mismatch within a matching section', () => {
    const en = [{ heading: 'Editorial notes', hasIntro: false, itemCount: 4 }];
    const hr = [{ heading: 'Uredničke napomene', hasIntro: false, itemCount: 3 }];
    const problems = diffNoteCards(en, hr, '/en/', '/hr/');
    expect(problems).toEqual([
      '/en/ section 0 ("Editorial notes") has 4 item(s) but /hr/ section 0 ("Uredničke napomene") has 3',
    ]);
  });

  it('flags an intro-paragraph presence mismatch', () => {
    const en = [{ heading: 'Final venues', hasIntro: true, itemCount: 5 }];
    const hr = [{ heading: 'Mjesta finala', hasIntro: false, itemCount: 5 }];
    const problems = diffNoteCards(en, hr, '/en/', '/hr/');
    expect(problems).toEqual([
      '/en/ section 0 ("Final venues") has intro paragraph but /hr/ section 0 ("Mjesta finala") has none',
    ]);
  });

  it('reports both an intro mismatch and an item-count mismatch on the same section', () => {
    const en = [{ heading: 'Final venues', hasIntro: true, itemCount: 23 }];
    const hr = [{ heading: 'Mjesta finala', hasIntro: false, itemCount: 24 }];
    expect(diffNoteCards(en, hr, '/en/', '/hr/')).toHaveLength(2);
  });
});

describe('hrCounterpart', () => {
  it('maps the home page to /hr', () => {
    expect(hrCounterpart('/')).toBe('/hr');
  });

  it('prefixes every other path with /hr', () => {
    expect(hrCounterpart('/competitions/world-cup/')).toBe('/hr/competitions/world-cup/');
  });
});
