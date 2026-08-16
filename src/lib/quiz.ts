import { isPlaceholderWinner, NOT_A_HOST } from './editions';
import type { Locale } from './i18n';
import type { ChampionSummary, Edition, TimelineEntry } from './types';

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
  // A "Not awarded" placeholder row (e.g. the 2020 Ballon d'Or) is not a real
  // answer: it can't be the correct choice for its own year's question, and it
  // would be a nonsensical distractor for every other year's question.
  //
  // Golden Boot's "Player(s)" column also holds "; "-separated joint-winner
  // ties (e.g. 2012's six-way EURO tie) - a compound string like that can't
  // be a fair multiple-choice "correct" answer (it would misrepresent a
  // shared award as one single winner) or a sane distractor next to clean
  // single-name choices, so tie years are excluded from both the pool and
  // the set of years a question gets generated for, rather than asked about
  // and answered wrong by design.
  const pool = editions
    .map((e) => e.winner.trim())
    .filter((winner) => winner && !isPlaceholderWinner(winner) && !winner.includes(';'));
  const questions: QuizQuestion[] = [];
  for (const edition of editions) {
    const correct = edition.winner.trim();
    if (!correct || isPlaceholderWinner(correct) || correct.includes(';')) continue;
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
  locale: Locale = 'en',
): QuizQuestion[] {
  const promptFor =
    locale === 'hr'
      ? (year: string) => `Tko je osvojio natjecanje ${competition} ${year}. godine?`
      : (year: string) => `Who won the ${competition} in ${year}?`;
  return questionsFromWinners(editions, seedPrefix, 'champion', competition, promptFor);
}

/** "Who was the {competition} top scorer in {year}?" - for Golden Boot tables. */
export function topScorerByYearQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
): QuizQuestion[] {
  const promptFor =
    locale === 'hr'
      ? (year: string) => `Tko je bio najbolji strijelac natjecanja ${competition} ${year}. godine?`
      : (year: string) => `Who was the ${competition} top scorer in ${year}?`;
  return questionsFromWinners(editions, seedPrefix, 'scorer', competition, promptFor);
}

/** "Which country hosted the {year} {competition}?" */
export function hostByYearQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
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
      prompt:
        locale === 'hr'
          ? `Koja je država bila domaćin natjecanja ${competition} ${edition.year}. godine?`
          : `Which country hosted the ${edition.year} ${competition}?`,
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
  locale: Locale = 'en',
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
      prompt:
        locale === 'hr'
          ? `Koga je pobijedio ${entry.champion} u finalu natjecanja ${competition} ${entry.year}. godine?`
          : `Who did ${entry.champion} beat in the ${entry.year} ${competition} final?`,
      ...choice,
    });
  }
  return questions;
}

/**
 * "Which team/player has won the most {competition} titles/awards?" - a
 * single generated question per competition, built from the same
 * `ChampionSummary[]` totals `buildChampionsSummary()` already produces for
 * every competition page's "Most successful teams"/"Most awards" widget
 * (see `src/lib/editions.ts`) - no new editorial research, just a new way of
 * asking about data every competition page already displays and every
 * content-accuracy pass has already audited.
 *
 * `summary` must already be sorted by titles descending (every caller of
 * `buildChampionsSummary()` gets this for free - see its own sort). Returns
 * no question at all when there's a tie for first place (no single
 * unambiguous correct answer) or fewer than 3 distinct entries (not enough
 * distractors for a fair multiple-choice question).
 */
export function mostTitlesQuestion(
  summary: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  subject: 'team' | 'player' = 'team',
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = summary;
  if (!top || !runnerUp || summary.length < 3) return [];
  if (top.titles === runnerUp.titles) return [];

  const correct = top.displayName;
  const pool = summary.map((s) => s.displayName);
  const id = `${seedPrefix}:most-titles`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const prompt =
    locale === 'hr'
      ? subject === 'player'
        ? `Tko ima najviše nagrada na natjecanju ${competition}?`
        : `Koja reprezentacija ima najviše naslova na natjecanju ${competition}?`
      : subject === 'player'
        ? `Who has won the most ${competition} awards?`
        : `Which team has won the most ${competition} titles?`;

  return [{ id, category: competition, prompt, ...choice }];
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

export type QuizOrderQuestion = {
  id: string;
  category: string;
  prompt: string;
  /** Display labels, already shuffled into the order the reader sees them. */
  items: string[];
  /** 1-based correct chronological rank for items[i], earliest = 1. */
  correctRanks: number[];
};

/**
 * "Put these {competition} champions in chronological order" - a ranking
 * question rather than multiple choice, so it needs its own type and its own
 * card/scoring UI (see QuizOrderCard.astro). Samples `itemCount` editions
 * with distinct years (skipping ties like Copa América's two 1959 editions,
 * which can't be strictly ordered), then shuffles their *display* order with
 * a seed kept separate from which editions get picked, so both stay
 * deterministic and reproducible from a shared link.
 */
export function chronologicalOrderQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
  itemLabel: (edition: Edition) => string,
  itemCount = 4,
  locale: Locale = 'en',
): QuizOrderQuestion[] {
  const seenYears = new Set<string>();
  const candidates = editions
    .filter((edition) => {
      if (!edition.winner.trim()) return false;
      if (seenYears.has(edition.year)) return false;
      seenYears.add(edition.year);
      return true;
    })
    .sort((a, b) => a.yearSort - b.yearSort);

  if (candidates.length < itemCount) return [];

  const picked = seededShuffle(candidates, mulberry32(hashSeed(`${seedPrefix}:order:pick`)))
    .slice(0, itemCount)
    .sort((a, b) => a.yearSort - b.yearSort);

  const display = seededShuffle(picked, mulberry32(hashSeed(`${seedPrefix}:order:shuffle`)));

  return [
    {
      id: `${seedPrefix}:order`,
      category: competition,
      prompt:
        locale === 'hr'
          ? `Poredaj ove prvake natjecanja ${competition} kronološkim redoslijedom (najraniji prvi).`
          : `Put these ${competition} champions in chronological order (earliest first).`,
      items: display.map(itemLabel),
      correctRanks: display.map((edition) => picked.indexOf(edition) + 1),
    },
  ];
}
