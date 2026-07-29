import type { Edition, TimelineEntry } from './types';

// Generates multiple-choice quiz questions from already-loaded competition
// data (editions + timelines), the same structures every competition page
// uses. Nothing here is hand-typed trivia - every prompt and every distractor
// comes straight from the Markdown tables, so the quiz stays in sync as
// editions are added.
//
// Shuffling/distractor picks use a seeded PRNG (not Math.random) so a given
// build - and these tests - always produce the same quiz. Reproducible output
// matters more here than true randomness: it makes the generator testable and
// keeps a shared/printed link showing the same questions.

export type QuizQuestion = {
  id: string;
  category: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
};

const MAX_CHOICES = 4;
const MIN_DISTRACTORS = 2;

function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build one question's choices from a candidate pool, seeded so the same
 * (seed, correct, pool) always produces the same options in the same order.
 * Returns undefined when the pool doesn't have enough distinct wrong answers
 * to make a fair multiple-choice question (e.g. a competition with only two
 * distinct winners so far).
 */
function buildChoice(
  seed: string,
  correct: string,
  pool: string[],
): Pick<QuizQuestion, 'choices' | 'answerIndex'> | undefined {
  const rng = mulberry32(hashSeed(seed));
  const distractors = seededShuffle(
    [...new Set(pool)].filter((value) => value !== correct),
    rng,
  ).slice(0, MAX_CHOICES - 1);
  if (distractors.length < MIN_DISTRACTORS) return undefined;
  const choices = seededShuffle([correct, ...distractors], rng);
  return { choices, answerIndex: choices.indexOf(correct) };
}

/** Shared builder for "who won X in {year}?" style questions (champion or top scorer). */
function questionsFromWinners(
  editions: Edition[],
  seedPrefix: string,
  seedKey: string,
  category: string,
  promptFor: (year: string) => string,
): QuizQuestion[] {
  const pool = editions.map((e) => e.winner.trim()).filter(Boolean);
  const questions: QuizQuestion[] = [];
  for (const edition of editions) {
    const correct = edition.winner.trim();
    if (!correct) continue;
    const id = `${seedPrefix}:${seedKey}:${edition.year}`;
    const choice = buildChoice(id, correct, pool);
    if (!choice) continue;
    questions.push({ id, category, prompt: promptFor(edition.year), ...choice });
  }
  return questions;
}

/** "Who won the {competition} in {year}?" */
export function championByYearQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
): QuizQuestion[] {
  return questionsFromWinners(editions, seedPrefix, 'champion', competition, (year) =>
    `Who won the ${competition} in ${year}?`,
  );
}

/** "Who was the {competition} top scorer in {year}?" - for Golden Boot tables. */
export function topScorerByYearQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
): QuizQuestion[] {
  return questionsFromWinners(editions, seedPrefix, 'scorer', competition, (year) =>
    `Who was the ${competition} top scorer in ${year}?`,
  );
}

// Host values that aren't an actual country (e.g. Copa América editions played
// home-and-away with no single host) and so make poor quiz answers.
const NOT_A_HOST = /home-and-away|no host|not held/i;

/** "Which country hosted the {year} {competition}?" */
export function hostByYearQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
): QuizQuestion[] {
  const pool = editions
    .map((e) => e.host?.trim())
    .filter((host): host is string => Boolean(host) && !NOT_A_HOST.test(host as string));
  const questions: QuizQuestion[] = [];
  for (const edition of editions) {
    const correct = edition.host?.trim();
    if (!correct || NOT_A_HOST.test(correct)) continue;
    const id = `${seedPrefix}:host:${edition.year}`;
    const choice = buildChoice(id, correct, pool);
    if (!choice) continue;
    questions.push({
      id,
      category: competition,
      prompt: `Which country hosted the ${edition.year} ${competition}?`,
      ...choice,
    });
  }
  return questions;
}

/** "Who did {champion} beat in the {year} {competition} final?" (answer: the runner-up). */
export function runnerUpByYearQuestions(
  timeline: TimelineEntry[],
  competition: string,
  seedPrefix: string,
): QuizQuestion[] {
  const pool = timeline
    .map((entry) => entry.runnerUp?.trim())
    .filter((v): v is string => Boolean(v));
  const questions: QuizQuestion[] = [];
  for (const entry of timeline) {
    const correct = entry.runnerUp?.trim();
    if (!correct) continue;
    const id = `${seedPrefix}:runner-up:${entry.year}`;
    const choice = buildChoice(id, correct, pool);
    if (!choice) continue;
    questions.push({
      id,
      category: competition,
      prompt: `Who did ${entry.champion} beat in the ${entry.year} ${competition} final?`,
      ...choice,
    });
  }
  return questions;
}

export type QuizPool = {
  questions: QuizQuestion[];
  /** How many questions to take from this pool. */
  take: number;
  /** Seed for which questions get picked from the pool, kept separate from the final shuffle. */
  seed: string;
};

/**
 * Pick `take` questions from each pool (seeded, so the same pools always
 * yield the same picks) and shuffle the combined set into one final order.
 */
export function selectQuiz(pools: QuizPool[], finalSeed: string): QuizQuestion[] {
  const picked = pools.flatMap(({ questions, take, seed }) =>
    seededShuffle(questions, mulberry32(hashSeed(seed))).slice(0, take),
  );
  return seededShuffle(picked, mulberry32(hashSeed(finalSeed)));
}
