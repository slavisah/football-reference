import { describe, expect, it } from 'vitest';
import {
  extractFinalVenuesItems,
  extractGroupedNumbers,
  diffAttendanceNumbers,
} from '../../scripts/check-attendance-format.mjs';

function finalVenuesSection(heading: string, items: string[]) {
  const list = items.map((item) => `<li>${item}</li>`).join('');
  return `<section class="notes__card card" id="x"><h2><span aria-hidden="true">📝</span> ${heading}</h2><ul class="notes__list">${list}</ul></section>`;
}

describe('extractFinalVenuesItems', () => {
  it('extracts item text from an English "Final venues" section', () => {
    const html = finalVenuesSection('Final venues', [
      '<strong>1934:</strong> Rome (Italy) - a reported attendance of 55,000.',
    ]);
    expect(extractFinalVenuesItems(html)).toEqual(['1934: Rome (Italy) - a reported attendance of 55,000.']);
  });

  it('extracts item text from a Croatian "Mjesta finala" section', () => {
    const html = finalVenuesSection('Mjesta finala', ['<strong>1934.:</strong> Rim (Italija) - prijavljeno 55.000 gledatelja.']);
    expect(extractFinalVenuesItems(html)).toEqual(['1934.: Rim (Italija) - prijavljeno 55.000 gledatelja.']);
  });

  it('ignores note-card sections with a different heading', () => {
    const html = finalVenuesSection('Editorial notes', ['Something unrelated.']);
    expect(extractFinalVenuesItems(html)).toEqual([]);
  });

  it('returns an empty array when the page has no note cards', () => {
    expect(extractFinalVenuesItems('<main><p>Nothing here.</p></main>')).toEqual([]);
  });
});

describe('extractGroupedNumbers', () => {
  it('extracts a comma-grouped English number', () => {
    expect(extractGroupedNumbers('a reported attendance of 55,000.', ',')).toEqual(['55000']);
  });

  it('extracts a period-grouped Croatian number', () => {
    expect(extractGroupedNumbers('prijavljeno 107.412 gledatelja.', '.')).toEqual(['107412']);
  });

  it('does not mistake a bare year for a grouped number', () => {
    expect(extractGroupedNumbers('1970: Estadio Azteca.', ',')).toEqual([]);
    expect(extractGroupedNumbers('1970.: Estadio Azteca.', '.')).toEqual([]);
  });

  it('extracts multiple grouped numbers from the same text', () => {
    expect(extractGroupedNumbers('55,000 then later 107,412.', ',')).toEqual(['55000', '107412']);
  });

  it('returns an empty array when there is no grouped number at all', () => {
    expect(extractGroupedNumbers('Estadio Centenario, Montevideo (Uruguay).', ',')).toEqual([]);
  });
});

describe('diffAttendanceNumbers', () => {
  it('returns no problems when the same figure is grouped correctly in both languages', () => {
    const en = 'a reported attendance of 55,000.';
    const hr = 'prijavljeno 55.000 gledatelja.';
    expect(diffAttendanceNumbers(en, hr, 'label')).toEqual([]);
  });

  it('returns no problems when neither side has a figure', () => {
    expect(diffAttendanceNumbers('Montevideo (Uruguay).', 'Montevideo (Urugvaj).', 'label')).toEqual([]);
  });

  it('flags a Croatian figure that kept the English comma grouping', () => {
    const en = 'a reported attendance of 6,500.';
    const hr = 'prijavljenih samo 6500 gledatelja.';
    const problems = diffAttendanceNumbers(en, hr, 'label');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('EN has 1 grouped number(s)');
  });

  it('flags a Croatian figure that used English-style comma grouping instead of a period', () => {
    const en = 'a reported attendance of 55,000.';
    const hr = 'prijavljeno 55,000 gledatelja.';
    const problems = diffAttendanceNumbers(en, hr, 'label');
    expect(problems).toEqual(['label: Croatian text uses English-style comma grouping (55000)']);
  });

  it('flags an English figure that used Croatian-style period grouping instead of a comma', () => {
    const en = 'a reported attendance of 55.000.';
    const hr = 'prijavljeno 55.000 gledatelja.';
    const problems = diffAttendanceNumbers(en, hr, 'label');
    expect(problems).toEqual(['label: English text uses Croatian-style period grouping (55000)']);
  });

  it('flags a digit mismatch between the two languages\' figures', () => {
    const en = 'a reported attendance of 55,000.';
    const hr = 'prijavljeno 45.000 gledatelja.';
    const problems = diffAttendanceNumbers(en, hr, 'label');
    expect(problems).toEqual(['label: number 0 is 55000 in English but 45000 in Croatian']);
  });
});
