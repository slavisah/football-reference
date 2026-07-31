import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../src/lib/editions';
import { buildTimeline } from '../../src/lib/editions';
import {
  championByYearQuestions,
  chronologicalOrderQuestions,
  hostByYearQuestions,
  runnerUpByYearQuestions,
  selectQuiz,
  topScorerByYearQuestions,
} from '../../src/lib/quiz';
import type { Edition, MarkdownTable } from '../../src/lib/types';

const table: MarkdownTable = {
  headers: ['Year', 'Host', 'Winner', 'Runner-up', 'Final'],
  rows: [
    ['1930', 'Uruguay', 'Uruguay', 'Argentina', 'Uruguay 4-2 Argentina'],
    ['1934', 'Italy', 'Italy', 'Czechoslovakia', 'Italy 2-1 Czechoslovakia'],
    ['1938', 'France', 'Italy', 'Hungary', 'Italy 4-2 Hungary'],
    ['1950', 'Brazil', 'Uruguay', 'Brazil', 'Uruguay 2-1 Brazil'],
    ['1954', 'Switzerland', 'West Germany', 'Hungary', 'West Germany 3-2 Hungary'],
  ],
};

const editions = buildEditions(table);

describe('championByYearQuestions', () => {
  const questions = championByYearQuestions(editions, 'FIFA World Cup', 'world-cup');

  it('asks a "who won" question for every edition', () => {
    expect(questions).toHaveLength(5);
    expect(questions[0].prompt).toBe('Who won the FIFA World Cup in 1930?');
    expect(questions[0].category).toBe('FIFA World Cup');
  });

  it('places the correct winner at answerIndex', () => {
    for (const q of questions) {
      const year = /\d{4}/.exec(q.prompt)?.[0];
      const edition = editions.find((e) => e.year === year);
      expect(q.choices[q.answerIndex]).toBe(edition?.winner);
    }
  });

  it('never repeats a choice within one question', () => {
    for (const q of questions) {
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it('is deterministic across repeated calls', () => {
    const again = championByYearQuestions(editions, 'FIFA World Cup', 'world-cup');
    expect(again).toEqual(questions);
  });

  it('caps choices at 4 and requires at least 2 distractors', () => {
    for (const q of questions) {
      expect(q.choices.length).toBeGreaterThanOrEqual(3);
      expect(q.choices.length).toBeLessThanOrEqual(4);
    }
  });

  it('skips a question when fewer than 2 distinct distractors exist', () => {
    const sparseTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2018', 'France'],
        ['2022', 'Argentina'],
      ],
    };
    const sparseEditions = buildEditions(sparseTable);
    const sparseQuestions = championByYearQuestions(sparseEditions, 'Test Cup', 'test');
    expect(sparseQuestions).toHaveLength(0);
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = championByYearQuestions(editions, 'FIFA World Cup', 'world-cup', 'en');
    const hrQuestions = championByYearQuestions(editions, 'FIFA World Cup', 'world-cup', 'hr');
    expect(hrQuestions[0].prompt).toBe('Tko je osvojio natjecanje FIFA World Cup 1930. godine?');
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });
});

describe('hostByYearQuestions', () => {
  it('asks a host question with the real host as the answer', () => {
    const questions = hostByYearQuestions(editions, 'FIFA World Cup', 'world-cup');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe('Which country hosted the 1930 FIFA World Cup?');
    expect(q1930?.choices[q1930.answerIndex]).toBe('Uruguay');
  });

  it('builds a Croatian prompt when locale is "hr"', () => {
    const questions = hostByYearQuestions(editions, 'FIFA World Cup', 'world-cup', 'hr');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe('Koja je država bila domaćin natjecanja FIFA World Cup 1930. godine?');
  });

  it('excludes non-country host labels like "Home-and-away"', () => {
    const homeAndAwayTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1916', 'Argentina', 'Uruguay'],
        ['1917', 'Uruguay', 'Uruguay'],
        ['1920', 'Home-and-away', 'Uruguay'],
        ['1921', 'Argentina', 'Argentina'],
      ],
    };
    const homeAndAwayEditions = buildEditions(homeAndAwayTable);
    const questions = hostByYearQuestions(homeAndAwayEditions, 'Copa América', 'copa');
    expect(questions.some((q) => q.id.endsWith('1920'))).toBe(false);
    expect(questions.every((q) => !q.choices.includes('Home-and-away'))).toBe(true);
  });
});

describe('runnerUpByYearQuestions', () => {
  it('asks who the champion beat, with the runner-up as the answer', () => {
    const timeline = buildTimeline(editions);
    const questions = runnerUpByYearQuestions(timeline, 'FIFA World Cup', 'world-cup');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe('Who did Uruguay beat in the 1930 FIFA World Cup final?');
    expect(q1930?.choices[q1930.answerIndex]).toBe('Argentina');
  });

  it('builds a Croatian prompt when locale is "hr"', () => {
    const timeline = buildTimeline(editions);
    const questions = runnerUpByYearQuestions(timeline, 'FIFA World Cup', 'world-cup', 'hr');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe(
      'Koga je pobijedio Uruguay u finalu natjecanja FIFA World Cup 1930. godine?',
    );
  });
});

describe('topScorerByYearQuestions', () => {
  it('asks a top-scorer question using the winner column as the player', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [
        ['1930', 'Guillermo Stábile', 'Argentina', '8'],
        ['1934', 'Oldřich Nejedlý', 'Czechoslovakia', '5'],
        ['1938', 'Leônidas', 'Brazil', '7'],
        ['1950', 'Ademir', 'Brazil', '8'],
      ],
    };
    const scorerEditions = buildEditions(scorersTable);
    const questions = topScorerByYearQuestions(scorerEditions, 'World Cup Golden Boot', 'gb-wc');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe('Who was the World Cup Golden Boot top scorer in 1930?');
    expect(q1930?.choices[q1930.answerIndex]).toBe('Guillermo Stábile');
  });

  it('builds a Croatian prompt when locale is "hr"', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [
        ['1930', 'Guillermo Stábile', 'Argentina', '8'],
        ['1934', 'Oldřich Nejedlý', 'Czechoslovakia', '5'],
        ['1938', 'Leônidas', 'Brazil', '7'],
        ['1950', 'Ademir', 'Brazil', '8'],
      ],
    };
    const scorerEditions = buildEditions(scorersTable);
    const questions = topScorerByYearQuestions(scorerEditions, 'World Cup Golden Boot', 'gb-wc', 'hr');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe(
      'Tko je bio najbolji strijelac natjecanja World Cup Golden Boot 1930. godine?',
    );
  });
});

describe('chronologicalOrderQuestions', () => {
  const label = (edition: Edition) => `${edition.winner} (host: ${edition.host ?? '—'})`;

  it('builds one ranking question with the requested number of items', () => {
    const questions = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label);
    expect(questions).toHaveLength(1);
    expect(questions[0].items).toHaveLength(4);
    expect(questions[0].correctRanks).toHaveLength(4);
    expect(questions[0].prompt).toBe(
      'Put these FIFA World Cup champions in chronological order (earliest first).',
    );
  });

  it('assigns correctRanks that recover the real chronological order', () => {
    const questions = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label);
    const { items, correctRanks } = questions[0];
    const reordered = [...items.keys()]
      .sort((a, b) => correctRanks[a] - correctRanks[b])
      .map((i) => items[i]);
    // Reordering by correctRanks should yield editions in ascending year order.
    const years = reordered.map((entry) => /\d{4}/.exec(entry)?.[0]);
    const sortedYears = [...years].sort();
    expect(years).toEqual(sortedYears);
  });

  it('ranks are a permutation of 1..itemCount', () => {
    const questions = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label);
    const ranks = [...questions[0].correctRanks].sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4]);
  });

  it('is deterministic across repeated calls', () => {
    const a = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label);
    const b = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label);
    expect(a).toEqual(b);
  });

  it('skips a competition with fewer than itemCount distinct-year editions', () => {
    const smallTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['2018', 'Russia', 'France'],
        ['2022', 'Qatar', 'Argentina'],
      ],
    };
    const smallEditions = buildEditions(smallTable);
    const questions = chronologicalOrderQuestions(smallEditions, 'Test Cup', 'test', label);
    expect(questions).toHaveLength(0);
  });

  it('drops duplicate-year editions before sampling (e.g. Copa América 1959)', () => {
    const dupTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1959', 'Argentina', 'Argentina'],
        ['1959', 'Ecuador', 'Uruguay'],
        ['1963', 'Bolivia', 'Bolivia'],
        ['1967', 'Uruguay', 'Uruguay'],
        ['1975', 'Multiple', 'Peru'],
      ],
    };
    const dupEditions = buildEditions(dupTable);
    const questions = chronologicalOrderQuestions(dupEditions, 'Copa América', 'copa', label, 4);
    expect(questions).toHaveLength(1);
    expect(questions[0].items).toHaveLength(4);
  });

  it('builds a Croatian prompt when locale is "hr", with the same items as English', () => {
    const enQuestions = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label, 4, 'en');
    const hrQuestions = chronologicalOrderQuestions(editions, 'FIFA World Cup', 'world-cup', label, 4, 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Poredaj ove prvake natjecanja FIFA World Cup kronološkim redoslijedom (najraniji prvi).',
    );
    expect(hrQuestions[0].items).toEqual(enQuestions[0].items);
    expect(hrQuestions[0].correctRanks).toEqual(enQuestions[0].correctRanks);
  });
});

describe('selectQuiz', () => {
  it('takes the requested count from each pool and returns one shuffled list', () => {
    const questions = championByYearQuestions(editions, 'FIFA World Cup', 'world-cup');
    const selected = selectQuiz(
      [{ questions, take: 2, seed: 'test-pool' }],
      'test-final',
    );
    expect(selected).toHaveLength(2);
    for (const q of selected) {
      expect(questions).toContainEqual(q);
    }
  });

  it('is deterministic given the same pools and seed', () => {
    const questions = championByYearQuestions(editions, 'FIFA World Cup', 'world-cup');
    const a = selectQuiz([{ questions, take: 3, seed: 'test-pool' }], 'test-final');
    const b = selectQuiz([{ questions, take: 3, seed: 'test-pool' }], 'test-final');
    expect(a).toEqual(b);
  });
});
