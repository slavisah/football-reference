import { describe, expect, it } from 'vitest';
import { buildEditions } from '../../src/lib/editions';
import { buildTimeline } from '../../src/lib/editions';
import {
  championByYearQuestions,
  hostByYearQuestions,
  runnerUpByYearQuestions,
  selectQuiz,
  topScorerByYearQuestions,
} from '../../src/lib/quiz';
import type { MarkdownTable } from '../../src/lib/types';

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
});

describe('hostByYearQuestions', () => {
  it('asks a host question with the real host as the answer', () => {
    const questions = hostByYearQuestions(editions, 'FIFA World Cup', 'world-cup');
    const q1930 = questions.find((q) => q.id.endsWith('1930'));
    expect(q1930?.prompt).toBe('Which country hosted the 1930 FIFA World Cup?');
    expect(q1930?.choices[q1930.answerIndex]).toBe('Uruguay');
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
