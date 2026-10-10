import { describe, expect, it } from 'vitest';
import {
  buildBiggestFinalMargins,
  buildChampionsSummary,
  buildEditions,
  buildHomeSoilTitles,
  buildHostsSummary,
  buildLongestStreaks,
  buildLongestTitleGaps,
  buildNearlyFinalists,
  buildRunnerUpsWithoutTitle,
} from '../../src/lib/editions';
import { buildTimeline } from '../../src/lib/editions';
import { buildFinalsMeetings, buildRivalries } from '../../src/lib/compare';
import {
  biggestFinalMarginQuestion,
  championByYearQuestions,
  chronologicalOrderQuestions,
  fiercestRivalryQuestion,
  hostByYearQuestions,
  longestStreakQuestion,
  longestTitleGapQuestion,
  mostFrequentRivalryQuestion,
  mostTitlesQuestion,
  nearlyChampionQuestions,
  nearlyFinalistQuestions,
  runnerUpByYearQuestions,
  selectQuiz,
  topScorerByYearQuestions,
  uniqueWinnerEditions,
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

  it('skips every entry when the source table has no runner-up column at all (e.g. Ballon d\'Or)', () => {
    const noRunnerUpTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2020', 'Lionel Messi'],
        ['2021', 'Robert Lewandowski'],
      ],
    };
    const noRunnerUpTimeline = buildTimeline(buildEditions(noRunnerUpTable));
    const questions = runnerUpByYearQuestions(noRunnerUpTimeline, "Ballon d'Or", 'ballon-dor');
    expect(questions).toHaveLength(0);
  });

  it('skips every entry when fewer than 2 distinct runner-ups exist to draw distractors from', () => {
    const sparseTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up'],
      rows: [
        ['2018', 'France', 'Croatia'],
        ['2022', 'Argentina', 'Croatia'],
      ],
    };
    const sparseTimeline = buildTimeline(buildEditions(sparseTable));
    const questions = runnerUpByYearQuestions(sparseTimeline, 'Test Cup', 'test');
    expect(questions).toHaveLength(0);
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

describe('uniqueWinnerEditions', () => {
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

  it('keeps only editions whose winner appears exactly once', () => {
    const result = uniqueWinnerEditions(ballonDorEditions);
    expect(result.map((e) => e.year)).toEqual(['2018', '2022']);
  });

  it('drops a "Not awarded" placeholder row', () => {
    const result = uniqueWinnerEditions(ballonDorEditions);
    expect(result.some((e) => e.winner === 'Not awarded')).toBe(false);
  });

  it('drops a joint-tie row even when it occurs only once', () => {
    const tieTable: MarkdownTable = {
      headers: ['Year', 'Player(s)', 'Team'],
      rows: [
        ['1962', 'Garrincha; Vavá', 'Multiple'],
        ['1966', 'Eusébio', 'Portugal'],
        ['1970', 'Gerd Müller', 'West Germany'],
      ],
    };
    const tieEditions = buildEditions(tieTable);
    const result = uniqueWinnerEditions(tieEditions);
    expect(result.map((e) => e.year)).toEqual(['1966', '1970']);
  });

  it('excludes every occurrence of a repeat winner, not just the extras', () => {
    // From the shared World Cup `editions` fixture above: Uruguay (1930,
    // 1950) and Italy (1934, 1938) each won twice, so only West Germany
    // (1954) is a one-time champion.
    const result = uniqueWinnerEditions(editions);
    expect(result.map((e) => e.year)).toEqual(['1954']);
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

  it('drops an edition with a missing winner before sampling', () => {
    const missingWinnerTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Uruguay', 'Uruguay'],
        ['1934', 'Italy', 'Italy'],
        ['1938', 'France', 'Italy'],
        // Missing winner: must not be counted as a distinct-year candidate.
        ['1942', 'n/a', ''],
        ['1950', 'Brazil', 'Uruguay'],
      ],
    };
    const missingWinnerEditions = buildEditions(missingWinnerTable);
    const questions = chronologicalOrderQuestions(missingWinnerEditions, 'FIFA World Cup', 'world-cup', label);
    expect(questions).toHaveLength(1);
    // The missing-winner 1942 row's host ("n/a") must never appear - proof
    // it was dropped as a candidate rather than picked with a blank winner.
    expect(questions[0].items.some((item) => item.includes('n/a'))).toBe(false);
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

  it('combined with uniqueWinnerEditions(), builds an individual-award ordering question with no duplicate labels', () => {
    const goldenBallTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Team'],
      rows: [
        ['1982', 'Paolo Rossi', 'Italy'],
        ['1986', 'Diego Maradona', 'Argentina'],
        ['1990', 'Salvatore Schillaci', 'Italy'],
        ['1994', 'Romário', 'Brazil'],
        ['2014', 'Lionel Messi', 'Argentina'],
        ['2022', 'Lionel Messi', 'Argentina'],
      ],
    };
    const goldenBallEditions = buildEditions(goldenBallTable);
    const winnerLabel = (edition: Edition) => edition.winner;
    const questions = chronologicalOrderQuestions(
      uniqueWinnerEditions(goldenBallEditions),
      'Golden Ball',
      'golden-ball',
      winnerLabel,
    );
    expect(questions).toHaveLength(1);
    // Messi's two wins (2014, 2022) must both be excluded, not just one -
    // otherwise two cards could show the identical "Lionel Messi" label with
    // no way to tell which is which.
    expect(questions[0].items).not.toContain('Lionel Messi');
    expect(new Set(questions[0].items).size).toBe(questions[0].items.length);
  });

  it('skips an individual award with too few one-time winners once repeats are filtered out', () => {
    // Only West Germany (1954) is a one-time champion in the shared fixture,
    // one short of the default itemCount of 4.
    const winnerLabel = (edition: Edition) => edition.winner;
    const questions = chronologicalOrderQuestions(
      uniqueWinnerEditions(editions),
      'FIFA World Cup',
      'world-cup',
      winnerLabel,
    );
    expect(questions).toHaveLength(0);
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

  it('combines the Croatian prompt with individual-award wording (hr + player), e.g. the Croatian Ballon d\'Or quiz', () => {
    const questions = mostTitlesQuestion(clearSummary, "Ballon d'Or", 'ballon-dor', 'player', 'hr');
    expect(questions[0].prompt).toBe("Tko ima najviše nagrada na natjecanju Ballon d'Or?");
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

  it('asks "which country has hosted the most" for subject "host", answered from buildHostsSummary()', () => {
    const hostTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Brazil', 'Uruguay'],
        ['1934', 'Brazil', 'Italy'],
        ['1938', 'Brazil', 'Italy'],
        ['1950', 'Italy', 'Uruguay'],
        ['1954', 'Italy', 'West Germany'],
        ['1958', 'Germany', 'Brazil'],
      ],
    };
    const hostsSummary = buildHostsSummary(buildEditions(hostTable));
    const questions = mostTitlesQuestion(hostsSummary, 'FIFA World Cup', 'world-cup', 'host');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('Which country has hosted the most FIFA World Cup editions?');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Brazil');
  });

  it('builds a Croatian "most hosted" prompt for subject "host"', () => {
    const hostTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Brazil', 'Uruguay'],
        ['1934', 'Brazil', 'Italy'],
        ['1938', 'Brazil', 'Italy'],
        ['1950', 'Italy', 'Uruguay'],
        ['1954', 'Italy', 'West Germany'],
        ['1958', 'Germany', 'Brazil'],
      ],
    };
    const hostsSummary = buildHostsSummary(buildEditions(hostTable));
    const questions = mostTitlesQuestion(hostsSummary, 'FIFA World Cup', 'world-cup', 'host', 'hr');
    expect(questions[0].prompt).toBe(
      'Koja je država bila domaćin najviše izdanja natjecanja FIFA World Cup?',
    );
  });

  it('keeps "host" and "team" ids distinct so both questions can coexist for the same competition', () => {
    const teamQuestions = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup', 'team');
    const hostTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Brazil', 'Uruguay'],
        ['1934', 'Brazil', 'Italy'],
        ['1938', 'Brazil', 'Italy'],
        ['1950', 'Italy', 'Uruguay'],
        ['1954', 'Italy', 'West Germany'],
        ['1958', 'Germany', 'Brazil'],
      ],
    };
    const hostQuestions = mostTitlesQuestion(
      buildHostsSummary(buildEditions(hostTable)),
      'FIFA World Cup',
      'world-cup',
      'host',
    );
    expect(teamQuestions[0].id).not.toBe(hostQuestions[0].id);
  });

  it('asks "which team has won the most ... on home soil" for subject "home-soil", answered from buildHomeSoilTitles()', () => {
    const homeSoilTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1917', 'Uruguay', 'Uruguay'],
        ['1923', 'Uruguay', 'Uruguay'],
        ['1924', 'Uruguay', 'Uruguay'],
        ['1942', 'Uruguay', 'Uruguay'],
        ['1921', 'Argentina', 'Argentina'],
        ['1925', 'Argentina', 'Argentina'],
        ['1929', 'Argentina', 'Argentina'],
        ['1919', 'Brazil', 'Brazil'],
        ['1922', 'Brazil', 'Brazil'],
      ],
    };
    const homeSoilSummary = buildHomeSoilTitles(buildEditions(homeSoilTable));
    const questions = mostTitlesQuestion(
      homeSoilSummary,
      'Copa América',
      'copa-america',
      'home-soil',
    );
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('Which team has won the most Copa América titles on home soil?');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Uruguay');
  });

  it('builds a Croatian "most home-soil titles" prompt for subject "home-soil"', () => {
    const homeSoilTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1917', 'Uruguay', 'Uruguay'],
        ['1923', 'Uruguay', 'Uruguay'],
        ['1924', 'Uruguay', 'Uruguay'],
        ['1942', 'Uruguay', 'Uruguay'],
        ['1921', 'Argentina', 'Argentina'],
        ['1925', 'Argentina', 'Argentina'],
        ['1929', 'Argentina', 'Argentina'],
        ['1919', 'Brazil', 'Brazil'],
        ['1922', 'Brazil', 'Brazil'],
      ],
    };
    const homeSoilSummary = buildHomeSoilTitles(buildEditions(homeSoilTable));
    const questions = mostTitlesQuestion(
      homeSoilSummary,
      'Copa América',
      'copa-america',
      'home-soil',
      'hr',
    );
    expect(questions[0].prompt).toBe(
      'Koja reprezentacija ima najviše naslova osvojenih na domaćem terenu na natjecanju Copa América?',
    );
  });

  it('keeps "home-soil" ids distinct from "team" and "host" so all three can coexist for the same competition', () => {
    const teamQuestions = mostTitlesQuestion(clearSummary, 'FIFA World Cup', 'world-cup', 'team');
    const homeSoilTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1917', 'Uruguay', 'Uruguay'],
        ['1923', 'Uruguay', 'Uruguay'],
        ['1924', 'Uruguay', 'Uruguay'],
        ['1942', 'Uruguay', 'Uruguay'],
        ['1921', 'Argentina', 'Argentina'],
        ['1925', 'Argentina', 'Argentina'],
        ['1929', 'Argentina', 'Argentina'],
        ['1919', 'Brazil', 'Brazil'],
        ['1922', 'Brazil', 'Brazil'],
      ],
    };
    const homeSoilQuestions = mostTitlesQuestion(
      buildHomeSoilTitles(buildEditions(homeSoilTable)),
      'FIFA World Cup',
      'world-cup',
      'home-soil',
    );
    expect(teamQuestions[0].id).not.toBe(homeSoilQuestions[0].id);
  });

  it('returns no question when there is a tie for first place among home-soil winners', () => {
    const tiedHomeSoilTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Uruguay', 'Uruguay'],
        ['1934', 'Italy', 'Italy'],
        ['1966', 'England', 'England'],
      ],
    };
    const tiedHomeSoilSummary = buildHomeSoilTitles(buildEditions(tiedHomeSoilTable));
    expect(
      mostTitlesQuestion(tiedHomeSoilSummary, 'Test Cup', 'test', 'home-soil'),
    ).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct home-soil winners exist', () => {
    const sparseHomeSoilTable: MarkdownTable = {
      headers: ['Year', 'Host', 'Winner'],
      rows: [
        ['1930', 'Uruguay', 'Uruguay'],
        ['1934', 'Uruguay', 'Uruguay'],
        ['1966', 'England', 'England'],
      ],
    };
    const sparseHomeSoilSummary = buildHomeSoilTitles(buildEditions(sparseHomeSoilTable));
    expect(
      mostTitlesQuestion(sparseHomeSoilSummary, 'Test Cup', 'test', 'home-soil'),
    ).toHaveLength(0);
  });
});

describe('biggestFinalMarginQuestion', () => {
  const marginsTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Final'],
    rows: [
      ['1930', 'Uruguay', 'Uruguay 4-2 Argentina'],
      ['1958', 'Brazil', 'Brazil 5-2 Sweden'],
      ['1974', 'West Germany', 'West Germany 2-1 Netherlands'],
      ['1990', 'West Germany', 'West Germany 1-0 Argentina'],
      ['1994', 'Brazil', 'Brazil 0-0 Italy; 3-2 pens'],
    ],
  };
  const clearMargins = buildBiggestFinalMargins(buildEditions(marginsTable));

  it('asks a "biggest winning margin" question with the widest-margin year as the answer', () => {
    const questions = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe(
      'In which year did the FIFA World Cup final have the biggest winning margin?',
    );
    expect(questions[0].category).toBe('FIFA World Cup');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('1958');
  });

  it('never shows the score text as a choice, only years', () => {
    const questions = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup');
    for (const choice of questions[0].choices) {
      expect(choice).not.toContain('-');
    }
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    const questions = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup');
    const [q] = questions;
    expect(new Set(q.choices).size).toBe(q.choices.length);
    expect(q.choices.length).toBeGreaterThanOrEqual(3);
    expect(q.choices.length).toBeLessThanOrEqual(4);
  });

  it('is deterministic across repeated calls', () => {
    const a = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup');
    const b = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup');
    expect(a).toEqual(b);
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup', 'en');
    const hrQuestions = biggestFinalMarginQuestion(clearMargins, 'FIFA World Cup', 'world-cup', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koje je godine finale natjecanja FIFA World Cup završilo najvećom pobjedom?',
    );
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });

  it('returns no question when there is a tie for the single biggest margin', () => {
    const tiedTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Final'],
      rows: [
        ['1958', 'Brazil', 'Brazil 5-2 Sweden'],
        ['1970', 'Brazil', 'Brazil 4-1 Italy'],
        ['1998', 'France', 'France 3-0 Brazil'],
      ],
    };
    const tiedMargins = buildBiggestFinalMargins(buildEditions(tiedTable));
    expect(biggestFinalMarginQuestion(tiedMargins, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct editions exist', () => {
    const sparse = clearMargins.slice(0, 2);
    expect(biggestFinalMarginQuestion(sparse, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when the competition has no "Final" score column (e.g. Copa América)', () => {
    const noFinalColumnTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1930', 'Uruguay'],
        ['1934', 'Italy'],
        ['1938', 'Italy'],
      ],
    };
    const noMargins = buildBiggestFinalMargins(buildEditions(noFinalColumnTable));
    expect(biggestFinalMarginQuestion(noMargins, 'Test Cup', 'test')).toHaveLength(0);
  });
});

describe('longestStreakQuestion', () => {
  const streakTable: MarkdownTable = {
    headers: ['Year', 'Winner'],
    rows: [
      ['1990', 'Brazil'],
      ['1991', 'Brazil'],
      ['1992', 'Brazil'],
      ['1993', 'Italy'],
      ['1994', 'Italy'],
      ['1995', 'Argentina'],
      ['1996', 'Germany'],
      ['1997', 'Germany'],
    ],
  };
  const clearStreaks = buildLongestStreaks(buildEditions(streakTable));

  it('asks a "longest streak" question with the longest-streak entry as the answer', () => {
    const questions = longestStreakQuestion(clearStreaks, 'FIFA World Cup', 'world-cup');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe(
      'Which team had the longest run of consecutive FIFA World Cup titles?',
    );
    expect(questions[0].category).toBe('FIFA World Cup');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Brazil');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    const questions = longestStreakQuestion(clearStreaks, 'FIFA World Cup', 'world-cup');
    const [q] = questions;
    expect(new Set(q.choices).size).toBe(q.choices.length);
    expect(q.choices.length).toBeGreaterThanOrEqual(3);
    expect(q.choices.length).toBeLessThanOrEqual(4);
  });

  it('is deterministic across repeated calls', () => {
    const a = longestStreakQuestion(clearStreaks, 'FIFA World Cup', 'world-cup');
    const b = longestStreakQuestion(clearStreaks, 'FIFA World Cup', 'world-cup');
    expect(a).toEqual(b);
  });

  it('uses "awards" wording for an individual-award subject, e.g. Ballon d\'Or', () => {
    const questions = longestStreakQuestion(clearStreaks, "Ballon d'Or", 'ballon-dor', 'player');
    expect(questions[0].prompt).toBe("Who had the longest run of consecutive Ballon d'Or awards?");
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = longestStreakQuestion(clearStreaks, 'FIFA World Cup', 'world-cup', 'team', 'en');
    const hrQuestions = longestStreakQuestion(clearStreaks, 'FIFA World Cup', 'world-cup', 'team', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koja reprezentacija ima najdulji niz uzastopnih naslova na natjecanju FIFA World Cup?',
    );
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });

  it('combines the Croatian prompt with individual-award wording (hr + player)', () => {
    const questions = longestStreakQuestion(clearStreaks, "Ballon d'Or", 'ballon-dor', 'player', 'hr');
    expect(questions[0].prompt).toBe("Tko ima najdulji niz uzastopnih osvojenih nagrada Ballon d'Or?");
  });

  it('returns no question when there is a tie for the single longest streak', () => {
    const tiedTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1990', 'Brazil'],
        ['1991', 'Brazil'],
        ['1993', 'Italy'],
        ['1994', 'Italy'],
        ['1996', 'Germany'],
        ['1997', 'Germany'],
      ],
    };
    const tiedStreaks = buildLongestStreaks(buildEditions(tiedTable));
    expect(longestStreakQuestion(tiedStreaks, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct streaks exist', () => {
    const sparse = clearStreaks.slice(0, 2);
    expect(longestStreakQuestion(sparse, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when the competition has no back-to-back streak at all (e.g. UEFA Nations League)', () => {
    const noStreakTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['2019', 'Portugal'],
        ['2021', 'France'],
        ['2023', 'Spain'],
        ['2025', 'Germany'],
      ],
    };
    const noStreaks = buildLongestStreaks(buildEditions(noStreakTable));
    expect(longestStreakQuestion(noStreaks, 'Test Cup', 'test')).toHaveLength(0);
  });
});

describe('longestTitleGapQuestion', () => {
  const gapTable: MarkdownTable = {
    headers: ['Year', 'Winner'],
    rows: [
      ['1930', 'Brazil'],
      ['1950', 'Italy'],
      ['1960', 'Germany'],
      ['1980', 'Italy'],
      ['1985', 'Germany'],
      ['1990', 'Brazil'],
    ],
  };
  const clearGaps = buildLongestTitleGaps(buildEditions(gapTable));

  it('asks a "longest wait" question with the widest-gap entry as the answer', () => {
    const questions = longestTitleGapQuestion(clearGaps, 'FIFA World Cup', 'world-cup');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('Which team waited the longest between FIFA World Cup titles?');
    expect(questions[0].category).toBe('FIFA World Cup');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Brazil');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    const questions = longestTitleGapQuestion(clearGaps, 'FIFA World Cup', 'world-cup');
    const [q] = questions;
    expect(new Set(q.choices).size).toBe(q.choices.length);
    expect(q.choices.length).toBeGreaterThanOrEqual(3);
    expect(q.choices.length).toBeLessThanOrEqual(4);
  });

  it('is deterministic across repeated calls', () => {
    const a = longestTitleGapQuestion(clearGaps, 'FIFA World Cup', 'world-cup');
    const b = longestTitleGapQuestion(clearGaps, 'FIFA World Cup', 'world-cup');
    expect(a).toEqual(b);
  });

  it('uses "awards" wording for an individual-award subject, e.g. Ballon d\'Or', () => {
    const questions = longestTitleGapQuestion(clearGaps, "Ballon d'Or", 'ballon-dor', 'player');
    expect(questions[0].prompt).toBe("Who waited the longest between Ballon d'Or awards?");
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = longestTitleGapQuestion(clearGaps, 'FIFA World Cup', 'world-cup', 'team', 'en');
    const hrQuestions = longestTitleGapQuestion(clearGaps, 'FIFA World Cup', 'world-cup', 'team', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koja je reprezentacija najdulje čekala na sljedeći naslov na natjecanju FIFA World Cup?',
    );
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });

  it('combines the Croatian prompt with individual-award wording (hr + player)', () => {
    const questions = longestTitleGapQuestion(clearGaps, "Ballon d'Or", 'ballon-dor', 'player', 'hr');
    expect(questions[0].prompt).toBe("Tko je najdulje čekao na sljedeću nagradu Ballon d'Or?");
  });

  it('returns no question when there is a tie for the single longest wait', () => {
    const tiedTable: MarkdownTable = {
      headers: ['Year', 'Winner'],
      rows: [
        ['1930', 'Brazil'],
        ['1950', 'Italy'],
        ['1960', 'Germany'],
        ['1975', 'Germany'],
        ['1990', 'Brazil'],
        ['2010', 'Italy'],
      ],
    };
    const tiedGaps = buildLongestTitleGaps(buildEditions(tiedTable));
    expect(tiedGaps.length).toBeGreaterThanOrEqual(3);
    expect(longestTitleGapQuestion(tiedGaps, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct entries exist', () => {
    const sparse = clearGaps.slice(0, 2);
    expect(longestTitleGapQuestion(sparse, 'Test Cup', 'test')).toHaveLength(0);
  });
});

describe('mostFrequentRivalryQuestion', () => {
  const rivalryTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up'],
    rows: [
      ['1930', 'Argentina', 'Brazil'],
      ['1934', 'Brazil', 'Argentina'],
      ['1938', 'Argentina', 'Chile'],
      ['1950', 'Chile', 'Argentina'],
      ['1954', 'Brazil', 'Chile'],
      ['1958', 'Chile', 'Brazil'],
      ['1962', 'Argentina', 'Denmark'],
      ['1966', 'Denmark', 'Argentina'],
      ['1970', 'Argentina', 'Denmark'],
    ],
  };
  const rivalryEditions = buildEditions(rivalryTable);
  const clearRivalries = buildRivalries(
    buildFinalsMeetings([{ title: 'Test Cup', slug: 'test', editions: rivalryEditions }]),
  );

  it('has the widest-meeting pair (Argentina vs Denmark, 3 meetings) as the clear leader', () => {
    expect(clearRivalries.length).toBeGreaterThanOrEqual(3);
    expect(clearRivalries[0].teamADisplayName).toBe('Argentina');
    expect(clearRivalries[0].teamBDisplayName).toBe('Denmark');
    expect(clearRivalries[0].meetings).toBe(3);
  });

  it('asks a "most frequent rivalry" question with the top pair as the answer', () => {
    const questions = mostFrequentRivalryQuestion(clearRivalries, 'Test Cup', 'test');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('Which two teams have met each other the most times in Test Cup finals?');
    expect(questions[0].category).toBe('Test Cup');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Argentina vs Denmark');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    const [q] = mostFrequentRivalryQuestion(clearRivalries, 'Test Cup', 'test');
    expect(new Set(q.choices).size).toBe(q.choices.length);
    expect(q.choices.length).toBeGreaterThanOrEqual(3);
    expect(q.choices.length).toBeLessThanOrEqual(4);
  });

  it('is deterministic across repeated calls', () => {
    const a = mostFrequentRivalryQuestion(clearRivalries, 'Test Cup', 'test');
    const b = mostFrequentRivalryQuestion(clearRivalries, 'Test Cup', 'test');
    expect(a).toEqual(b);
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = mostFrequentRivalryQuestion(clearRivalries, 'Test Cup', 'test', 'en');
    const hrQuestions = mostFrequentRivalryQuestion(clearRivalries, 'Test Cup', 'test', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koje su se dvije reprezentacije najčešće susrele u finalima natjecanja Test Cup?',
    );
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });

  it('returns no question when there is a tie for the most frequent rivalry', () => {
    const tiedTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up'],
      rows: [
        ['1930', 'Argentina', 'Brazil'],
        ['1934', 'Brazil', 'Argentina'],
        ['1938', 'Argentina', 'Chile'],
        ['1950', 'Chile', 'Argentina'],
        ['1954', 'Brazil', 'Chile'],
        ['1958', 'Chile', 'Brazil'],
      ],
    };
    const tiedRivalries = buildRivalries(
      buildFinalsMeetings([{ title: 'Test Cup', slug: 'test', editions: buildEditions(tiedTable) }]),
    );
    expect(tiedRivalries.length).toBeGreaterThanOrEqual(3);
    expect(mostFrequentRivalryQuestion(tiedRivalries, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct rivalries exist', () => {
    const sparse = clearRivalries.slice(0, 2);
    expect(mostFrequentRivalryQuestion(sparse, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when there are no qualifying rivalries at all', () => {
    expect(mostFrequentRivalryQuestion([], 'Test Cup', 'test')).toHaveLength(0);
  });
});

describe('fiercestRivalryQuestion', () => {
  // Two separate "competitions" (unlike mostFrequentRivalryQuestion's own
  // single-competition fixture above) - a pair that only meets once in each
  // still counts as one combined rivalry, the cross-competition behavior
  // this question type exists to ask about.
  const compATable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up'],
    rows: [
      ['1930', 'Argentina', 'Brazil'],
      ['1934', 'Brazil', 'Argentina'],
      ['1938', 'Argentina', 'Chile'],
      ['1950', 'Chile', 'Argentina'],
    ],
  };
  const compBTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up'],
    rows: [
      ['1962', 'Argentina', 'Denmark'],
      ['1966', 'Denmark', 'Argentina'],
      ['1970', 'Argentina', 'Denmark'],
    ],
  };
  const crossRivalries = buildRivalries(
    buildFinalsMeetings([
      { title: 'Comp A', slug: 'comp-a', editions: buildEditions(compATable) },
      { title: 'Comp B', slug: 'comp-b', editions: buildEditions(compBTable) },
    ]),
  );

  it('has the widest-meeting pair (Argentina vs Denmark, 3 meetings, all from Comp B) as the clear leader', () => {
    expect(crossRivalries.length).toBeGreaterThanOrEqual(3);
    expect(crossRivalries[0].teamADisplayName).toBe('Argentina');
    expect(crossRivalries[0].teamBDisplayName).toBe('Denmark');
    expect(crossRivalries[0].meetings).toBe(3);
  });

  it('asks a cross-competition "fiercest rivalry" question with the top pair as the answer', () => {
    const questions = fiercestRivalryQuestion(crossRivalries, 'test');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe(
      'Which two national teams have met each other the most times across World Cup, EURO, Copa América and Nations League finals, combined?',
    );
    expect(questions[0].category).toBe('Fiercest rivalries');
    expect(questions[0].choices[questions[0].answerIndex]).toBe('Argentina vs Denmark');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    const [q] = fiercestRivalryQuestion(crossRivalries, 'test');
    expect(new Set(q.choices).size).toBe(q.choices.length);
    expect(q.choices.length).toBeGreaterThanOrEqual(3);
    expect(q.choices.length).toBeLessThanOrEqual(4);
  });

  it('is deterministic across repeated calls', () => {
    const a = fiercestRivalryQuestion(crossRivalries, 'test');
    const b = fiercestRivalryQuestion(crossRivalries, 'test');
    expect(a).toEqual(b);
  });

  it('builds a Croatian prompt when locale is "hr", with the same answer as English', () => {
    const enQuestions = fiercestRivalryQuestion(crossRivalries, 'test', 'en');
    const hrQuestions = fiercestRivalryQuestion(crossRivalries, 'test', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koje su se dvije reprezentacije najčešće susrele u finalima Svjetskog prvenstva, EURO-a, Copa Américe i Liga nacija zajedno?',
    );
    expect(hrQuestions[0].category).toBe('Najžešći rivaliteti');
    expect(hrQuestions[0].choices[hrQuestions[0].answerIndex]).toBe(
      enQuestions[0].choices[enQuestions[0].answerIndex],
    );
  });

  it('returns no question when there is a tie for the most frequent cross-competition rivalry', () => {
    const tiedCompBTable: MarkdownTable = {
      headers: ['Year', 'Winner', 'Runner-up'],
      rows: [
        ['1962', 'Argentina', 'Denmark'],
        ['1966', 'Denmark', 'Argentina'],
      ],
    };
    const tiedRivalries = buildRivalries(
      buildFinalsMeetings([
        { title: 'Comp A', slug: 'comp-a', editions: buildEditions(compATable) },
        { title: 'Comp B', slug: 'comp-b', editions: buildEditions(tiedCompBTable) },
      ]),
    );
    expect(tiedRivalries.length).toBeGreaterThanOrEqual(3);
    expect(fiercestRivalryQuestion(tiedRivalries, 'test')).toHaveLength(0);
  });

  it('returns no question when fewer than 3 distinct rivalries exist', () => {
    const sparse = crossRivalries.slice(0, 2);
    expect(fiercestRivalryQuestion(sparse, 'test')).toHaveLength(0);
  });

  it('returns no question when there are no qualifying rivalries at all', () => {
    expect(fiercestRivalryQuestion([], 'test')).toHaveLength(0);
  });
});

describe('nearlyChampionQuestions', () => {
  // Three distinct champions (Uruguay, Italy, West Germany) and four distinct
  // "lost a final, never won" teams (Hungary twice, Argentina, Czechoslovakia,
  // Brazil) - one question per nearly-champion entry, unlike every "most X"
  // question type above, which asks a single question per competition.
  const nearlyChampionTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up'],
    rows: [
      ['1930', 'Uruguay', 'Argentina'],
      ['1934', 'Italy', 'Czechoslovakia'],
      ['1938', 'Italy', 'Hungary'],
      ['1950', 'Uruguay', 'Brazil'],
      ['1954', 'West Germany', 'Hungary'],
    ],
  };
  const nearlyChampionEditions = buildEditions(nearlyChampionTable);
  const champions = buildChampionsSummary(nearlyChampionEditions);
  const nearlyChampions = buildRunnerUpsWithoutTitle(nearlyChampionEditions);

  it('has 3 distinct champions and 4 distinct nearly-champions in the fixture', () => {
    expect(champions).toHaveLength(3);
    expect(nearlyChampions).toHaveLength(4);
  });

  it('produces one question per nearly-champion entry, each with a correct answer drawn from that list', () => {
    const questions = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test');
    expect(questions).toHaveLength(4);
    const answers = questions.map((q) => q.choices[q.answerIndex]).sort();
    expect(answers).toEqual(nearlyChampions.map((c) => c.displayName).sort());
  });

  it('draws every distractor from the champions list - teams that have actually won', () => {
    const championNames = new Set(champions.map((c) => c.displayName));
    const questions = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test');
    for (const q of questions) {
      const correct = q.choices[q.answerIndex];
      expect(championNames.has(correct)).toBe(false);
      for (const choice of q.choices) {
        if (choice === correct) continue;
        expect(championNames.has(choice)).toBe(true);
      }
    }
  });

  it('asks "which of these teams reached a final without ever winning" with the right category', () => {
    const [q] = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test');
    expect(q.prompt).toBe('Which of these teams has reached a Test Cup final without ever winning the title?');
    expect(q.category).toBe('Test Cup');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    for (const q of nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test')) {
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices.length).toBeGreaterThanOrEqual(3);
      expect(q.choices.length).toBeLessThanOrEqual(4);
    }
  });

  it('is deterministic across repeated calls', () => {
    const a = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test');
    const b = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test');
    expect(a).toEqual(b);
  });

  it('builds a Croatian prompt when locale is "hr", with the same answers as English', () => {
    const enQuestions = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test', 'en');
    const hrQuestions = nearlyChampionQuestions(nearlyChampions, champions, 'Test Cup', 'test', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koja je od ovih reprezentacija igrala u finalu natjecanja Test Cup, ali ga nikad nije osvojila?',
    );
    const enAnswers = enQuestions.map((q) => q.choices[q.answerIndex]).sort();
    const hrAnswers = hrQuestions.map((q) => q.choices[q.answerIndex]).sort();
    expect(hrAnswers).toEqual(enAnswers);
  });

  it('returns no question for any entry when the champions pool has fewer than 2 distinct teams', () => {
    const sparseChampions = champions.slice(0, 1);
    expect(nearlyChampionQuestions(nearlyChampions, sparseChampions, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when there are no qualifying nearly-champions at all', () => {
    expect(nearlyChampionQuestions([], champions, 'Test Cup', 'test')).toHaveLength(0);
  });
});

describe('nearlyFinalistQuestions', () => {
  // Reuses the same semifinal fixture shape as buildNearlyFinalists' own unit
  // tests (tests/unit/editions.test.ts): 3 finals (3 champions, 3
  // never-won runner-ups) and 5 distinct semifinal-only teams.
  const nearlyFinalistTable: MarkdownTable = {
    headers: ['Year', 'Winner', 'Runner-up', 'Third', 'Fourth'],
    rows: [
      ['1930', 'Uruguay', 'Argentina', 'United States', 'Yugoslavia'],
      ['1962', 'Brazil', 'Czechoslovakia', 'Chile', 'Yugoslavia'],
      ['1966', 'England', 'West Germany', 'Portugal', 'Soviet Union'],
    ],
  };
  const nearlyFinalistEditions = buildEditions(nearlyFinalistTable);
  const finalistChampions = buildChampionsSummary(nearlyFinalistEditions);
  const finalistNearlyChampions = buildRunnerUpsWithoutTitle(nearlyFinalistEditions);
  const finalists = [...finalistChampions, ...finalistNearlyChampions];
  const nearlyFinalists = buildNearlyFinalists(nearlyFinalistEditions);

  it('has 6 distinct finalists (3 champions + 3 never-won runners-up) and 5 distinct nearly-finalists', () => {
    expect(finalists).toHaveLength(6);
    expect(nearlyFinalists).toHaveLength(5);
  });

  it('produces one question per nearly-finalist entry, each with a correct answer drawn from that list', () => {
    const questions = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test');
    expect(questions).toHaveLength(5);
    const answers = questions.map((q) => q.choices[q.answerIndex]).sort();
    expect(answers).toEqual(nearlyFinalists.map((f) => f.displayName).sort());
  });

  it('draws every distractor from the finalists list - teams that have reached a final, winner or runner-up', () => {
    const finalistNames = new Set(finalists.map((f) => f.displayName));
    const questions = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test');
    for (const q of questions) {
      const correct = q.choices[q.answerIndex];
      expect(finalistNames.has(correct)).toBe(false);
      for (const choice of q.choices) {
        if (choice === correct) continue;
        expect(finalistNames.has(choice)).toBe(true);
      }
    }
  });

  it('asks "which of these teams reached a semifinal without ever reaching the final" with the right category', () => {
    const [q] = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test');
    expect(q.prompt).toBe(
      'Which of these teams has reached a Test Cup semifinal without ever reaching the final?',
    );
    expect(q.category).toBe('Test Cup');
  });

  it('never repeats a choice and stays within the 3-4 choice range', () => {
    for (const q of nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test')) {
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices.length).toBeGreaterThanOrEqual(3);
      expect(q.choices.length).toBeLessThanOrEqual(4);
    }
  });

  it('is deterministic across repeated calls', () => {
    const a = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test');
    const b = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test');
    expect(a).toEqual(b);
  });

  it('builds a Croatian prompt when locale is "hr", with the same answers as English', () => {
    const enQuestions = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test', 'en');
    const hrQuestions = nearlyFinalistQuestions(nearlyFinalists, finalists, 'Test Cup', 'test', 'hr');
    expect(hrQuestions[0].prompt).toBe(
      'Koja je od ovih reprezentacija igrala u polufinalu natjecanja Test Cup, ali nikad nije igrala u finalu?',
    );
    const enAnswers = enQuestions.map((q) => q.choices[q.answerIndex]).sort();
    const hrAnswers = hrQuestions.map((q) => q.choices[q.answerIndex]).sort();
    expect(hrAnswers).toEqual(enAnswers);
  });

  it('returns no question for any entry when the finalists pool has fewer than 2 distinct teams', () => {
    const sparseFinalists = finalists.slice(0, 1);
    expect(nearlyFinalistQuestions(nearlyFinalists, sparseFinalists, 'Test Cup', 'test')).toHaveLength(0);
  });

  it('returns no question when there are no qualifying nearly-finalists at all', () => {
    expect(nearlyFinalistQuestions([], finalists, 'Test Cup', 'test')).toHaveLength(0);
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
