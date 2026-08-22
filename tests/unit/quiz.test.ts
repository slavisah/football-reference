import { describe, expect, it } from 'vitest';
import { buildChampionsSummary, buildEditions } from '../../src/lib/editions';
import { buildTimeline } from '../../src/lib/editions';
import {
  championByYearQuestions,
  chronologicalOrderQuestions,
  hostByYearQuestions,
  mostTitlesQuestion,
  runnerUpByYearQuestions,
  selectQuiz,
  topScorerByYearQuestions,
  yearByWinnerQuestions,
} from '../../src/lib/quiz';
import type { ChampionSummary, Edition, MarkdownTable } from '../../src/lib/types';

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

  it('skips the question for a "Not awarded" placeholder row, and never offers it as a distractor', () => {
    const withPlaceholder: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2018', 'Lionel Messi'],
        ['2019', 'Lionel Messi'],
        ['2020', 'Not awarded'],
        ['2021', 'Robert Lewandowski'],
        ['2022', 'Karim Benzema'],
      ],
    };
    const placeholderEditions = buildEditions(withPlaceholder);
    const placeholderQuestions = championByYearQuestions(placeholderEditions, "Ballon d'Or", 'ballon-dor');
    expect(placeholderQuestions.some((q) => q.prompt.includes('2020'))).toBe(false);
    expect(placeholderQuestions.every((q) => !q.choices.includes('Not awarded'))).toBe(true);
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

  it('skips a "; "-separated joint-winner tie year rather than asking a question whose only correct answer is a compound multi-name string', () => {
    const scorersTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team', 'Goals'],
      rows: [
        ['2010', 'Diego Forlán; Thomas Müller; David Villa; Wesley Sneijder', 'Multiple', '5'],
        ['2014', 'James Rodríguez', 'Colombia', '6'],
        ['2018', 'Harry Kane', 'England', '6'],
      ],
    };
    const scorerEditions = buildEditions(scorersTable);
    const questions = topScorerByYearQuestions(scorerEditions, 'World Cup Golden Boot', 'gb-wc');

    expect(questions.some((q) => q.id.endsWith('2010'))).toBe(false);
    // The tie is also excluded as a distractor for the clean single-winner years.
    for (const q of questions) {
      expect(q.choices.some((choice) => choice.includes(';'))).toBe(false);
    }
  });
});

describe('yearByWinnerQuestions', () => {
  const ballonDorTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'National team'],
    rows: [
      ['2016', 'Cristiano Ronaldo', 'Portugal'],
      ['2017', 'Cristiano Ronaldo', 'Portugal'],
      ['2018', 'Luka Modrić', 'Croatia'],
      ['2019', 'Lionel Messi', 'Argentina'],
      ['2020', 'Not awarded', '—'],
      ['2021', 'Lionel Messi', 'Argentina'],
      ['2022', 'Karim Benzema', 'France'],
    ],
  };
  const ballonDorEditions = buildEditions(ballonDorTable);

  it('asks a "which year" question only for a winner who won exactly once', () => {
    const questions = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor');
    const winners = questions.map((q) => q.prompt);
    expect(winners.some((p) => p.includes('Luka Modrić'))).toBe(true);
    expect(winners.some((p) => p.includes('Karim Benzema'))).toBe(true);
    // Cristiano Ronaldo (2016, 2017) and Lionel Messi (2019, 2021) each won
    // more than once, so neither has a single unambiguous correct year.
    expect(winners.some((p) => p.includes('Cristiano Ronaldo'))).toBe(false);
    expect(winners.some((p) => p.includes('Lionel Messi'))).toBe(false);
  });

  it('places the correct year at answerIndex', () => {
    const questions = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor');
    const modric = questions.find((q) => q.prompt.includes('Luka Modrić'));
    expect(modric?.choices[modric.answerIndex]).toBe('2018');
  });

  it('builds a Croatian prompt when locale is "hr"', () => {
    const questions = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor', 'hr');
    const modric = questions.find((q) => q.prompt.includes('Luka Modrić'));
    expect(modric?.prompt).toBe("Koje je godine Luka Modrić osvojio nagradu Ballon d'Or?");
  });

  it('never asks about a "Not awarded" placeholder row, and never offers its year as a distractor', () => {
    const questions = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor');
    expect(questions.some((q) => q.prompt.includes('Not awarded'))).toBe(false);
  });

  it('never repeats a choice within one question', () => {
    const questions = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor');
    for (const q of questions) {
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it('is deterministic across repeated calls', () => {
    const first = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor');
    const second = yearByWinnerQuestions(ballonDorEditions, "Ballon d'Or", 'ballon-dor');
    expect(second).toEqual(first);
  });

  it('skips a question when fewer than 2 distinct distractor years exist', () => {
    const sparseTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2021', 'Lionel Messi'],
        ['2022', 'Karim Benzema'],
      ],
    };
    const sparseEditions = buildEditions(sparseTable);
    const questions = yearByWinnerQuestions(sparseEditions, "Ballon d'Or", 'ballon-dor');
    expect(questions).toHaveLength(0);
  });

  it('asks about a one-time team champion when subject is "team"', () => {
    // From the shared World Cup `editions` fixture above: Uruguay (1930,
    // 1950) and Italy (1934, 1938) each won twice, so only West Germany
    // (1954) is a one-time champion.
    const questions = yearByWinnerQuestions(editions, 'FIFA World Cup', 'world-cup', 'en', 'team');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('In which year did West Germany win the FIFA World Cup?');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('1954');
  });

  it('builds a "won the competition" (not "won the award") Croatian prompt for subject "team"', () => {
    const questions = yearByWinnerQuestions(editions, 'FIFA World Cup', 'world-cup', 'hr', 'team');
    expect(questions[0].prompt).toBe('Koje je godine West Germany osvojio natjecanje FIFA World Cup?');
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

describe('mostTitlesQuestion', () => {
  const clearWinnerTable: MarkdownTable = {
    headers: ['Year', 'Winner'],
    rows: [
      ['1930', 'Brazil'],
      ['1934', 'Brazil'],
      ['1938', 'Brazil'],
      ['1950', 'Italy'],
      ['1954', 'Italy'],
      ['1958', 'Germany'],
    ],
  };
  const clearSummary = buildChampionsSummary(buildEditions(clearWinnerTable));

  it('asks a "most titles" question with the top-titled entry as the answer', () => {
    const questions = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('Which team has won the most FIFA World Cup titles?');
    expect(questions[0].category).toBe('FIFA World Cup');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Brazil');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    const questions = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup');
    const [q] = questions;
    expect(new Set(q.choices).size).toBe(q.choices.length);
    expect(q.choices.length).toBeGreaterThanOrEqual(3);
    expect(q.choices.length).toBeLessThanOrEqual(4);
  });

  it('is deterministic across repeated calls', () => {
    const a = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup');
    const b = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup');
    expect(a).toEqual(b);
  });

  it('uses "awards" wording for an individual-award subject, e.g. Ballon d\'Or/Golden Boot', () => {
    const questions = mostTitlesQuestion(clearSummary, "Ballon d'Or", 'ballon-dor', 'player');
    expect(questions[0].prompt).toBe("Who has won the most Ballon d'Or awards?");
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup', 'team', 'en');
    const hrQuestions = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup', 'team', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koja reprezentacija ima najviše naslova na natjecanju FIFA World Cup?',
    );
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });

  it('returns no question when there is a tie for first place', () => {
    const tiedTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1930', 'Uruguay'],
        ['1934', 'Italy'],
        ['1938', 'Italy'],
        ['1950', 'Uruguay'],
        ['1954', 'West Germany'],
      ],
    };
    const tiedSummary = buildChampionsSummary(buildEditions(tiedTable));
    expect(mostTitlesQuestion(tiedSummary, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct entries exist', () => {
    const sparse: ChampionSummary[] = [
      { id: 'a', displayName: 'A', titles: 3, years: ['2000'], names: ['A'] },
      { id: 'b', displayName: 'B', titles: 1, years: ['2004'], names: ['B'] },
    ];
    expect(mostTitlesQuestion(sparse, 'Test Cup', 'test')).toHaveLength(0);
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
