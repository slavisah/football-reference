import { isPlaceholderWinner, NOT_A_HOST } from './editions';
import type { Rivalry } from './compare';
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
 * "In which year did {winner} win the {competition}?" - the reverse of
 * championByYearQuestions, matching the "Match a player to his Ballon d'Or
 * year" quiz idea from content/records-and-timelines.md. Only generated for
 * a winner who appears exactly once across the whole table: a repeat winner
 * (e.g. an eight-time Ballon d'Or winner, or a two-time World Cup champion)
 * has no single correct year, and every other year they won would otherwise
 * be a wrongly-marked distractor.
 *
 * `subject` only changes the Croatian phrasing: a player "wins an award"
 * (osvojio nagradu) while a team "wins a competition" (osvojio natjecanje) -
 * the English prompt reads naturally as "win the {competition}" either way,
 * so it takes no locale branch. Defaults to 'player' to match the original
 * Ballon d'Or-only caller.
 */
export function yearByWinnerQuestions(
  editions: Edition[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
  subject: 'team' | 'player' = 'player',
): QuizQuestion[] {
  const oneTimeWinners = new Set(uniqueWinnerEditions(editions).map((e) => e.winner.trim()));
  const pool = [...new Set(editions.map((e) => e.year))];
  const questions: QuizQuestion[] = [];
  for (const edition of editions) {
    const winner = edition.winner.trim();
    if (!oneTimeWinners.has(winner)) continue;
    const id = `${seedPrefix}:year-by-winner:${edition.year}`;
    const choice = buildChoice(id, edition.year, pool);
    if (!choice) continue;
    questions.push({
      id,
      category: competition,
      prompt:
        locale === 'hr'
          ? subject === 'team'
            ? `Koje je godine ${winner} osvojio natjecanje ${competition}?`
            : `Koje je godine ${winner} osvojio nagradu ${competition}?`
          : `In which year did ${winner} win the ${competition}?`,
      ...choice,
    });
  }
  return questions;
}

/**
 * Editions whose winner is a single (non-tied) name that doesn't repeat
 * anywhere else in the given list - the subset safe to sample for a
 * chronological-order question about an individual award. Ordering four
 * champions works even when a country wins more than once, because each
 * card also shows its host (see quiz.astro's `hostedByLabel`) - but an
 * individual award has no such second attribute, so a repeat winner (e.g.
 * Kylian Mbappé's two Golden Boots) or a joint-tie row (e.g. the World Cup
 * Golden Boot's 1962 six-way tie) would put two identical-looking cards in
 * the shuffle with no way to tell them apart without giving away the year
 * itself - the exact fact the question is testing. Also backs
 * `yearByWinnerQuestions`, which needs the identical one-time-winner
 * filter for the same underlying reason (no single correct year for a
 * repeat winner).
 */
export function uniqueWinnerEditions(editions: Edition[]): Edition[] {
  const counts = new Map<string, number>();
  for (const edition of editions) {
    const winner = edition.winner.trim();
    if (!winner || isPlaceholderWinner(winner) || winner.includes(';')) continue;
    counts.set(winner, (counts.get(winner) ?? 0) + 1);
  }
  return editions.filter((edition) => {
    const winner = edition.winner.trim();
    if (!winner || isPlaceholderWinner(winner) || winner.includes(';')) return false;
    return counts.get(winner) === 1;
  });
}

/**
 * "Which team/player has won the most {competition} titles/awards?" (or,
 * for `subject: 'host'`, "Which country has hosted the most {competition}
 * editions?") - a single generated question per competition, built from the
 * same `ChampionSummary[]`-shaped totals `buildChampionsSummary()`/
 * `buildHostsSummary()` already produce for every competition page's "Most
 * successful teams"/"Most awards"/"Most frequent hosts" widget (see
 * `src/lib/editions.ts`) - no new editorial research, just a new way of
 * asking about data every competition page already displays and every
 * content-accuracy pass has already audited (`buildHostsSummary()`'s own
 * counts were independently hand-verified against every Host cell at the
 * two-hundred-and-tenth intensive run).
 *
 * `summary` must already be sorted by titles descending (every caller of
 * `buildChampionsSummary()`/`buildHostsSummary()` gets this for free - see
 * each one's own sort). Returns no question at all when there's a tie for
 * first place (no single unambiguous correct answer) or fewer than 3
 * distinct entries (not enough distractors for a fair multiple-choice
 * question) - e.g. UEFA Nations League's four hosts to date are too few.
 */
export function mostTitlesQuestion(
  summary: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  subject: 'team' | 'player' | 'host' = 'team',
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = summary;
  if (!top || !runnerUp || summary.length < 3) return [];
  if (top.titles === runnerUp.titles) return [];

  const correct = top.displayName;
  const pool = summary.map((s) => s.displayName);
  const id = `${seedPrefix}:most-titles:${subject}`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const prompt =
    locale === 'hr'
      ? subject === 'player'
        ? `Tko ima najviše nagrada na natjecanju ${competition}?`
        : subject === 'host'
          ? `Koja je država bila domaćin najviše izdanja natjecanja ${competition}?`
          : `Koja reprezentacija ima najviše naslova na natjecanju ${competition}?`
      : subject === 'player'
        ? `Who has won the most ${competition} awards?`
        : subject === 'host'
          ? `Which country has hosted the most ${competition} editions?`
          : `Which team has won the most ${competition} titles?`;

  return [{ id, category: competition, prompt, ...choice }];
}

/**
 * "In which year did the {competition} final have the biggest winning
 * margin?" - a single generated question per competition, built from the
 * same `ChampionSummary[]`-shaped margin ranking `buildBiggestFinalMargins()`
 * already produces for `/records`' own "Biggest final wins" section (see
 * `src/lib/editions.ts`) - no new editorial research, just a new way of
 * asking about data the site already displays and has already verified
 * (the two-hundred-and-tenth intensive run hand-recomputed every one of
 * these margins against each competition's own "Final" score cells).
 *
 * `margins` must already be sorted by margin descending (`buildBiggestFinalMargins()`
 * does this for free). Each entry's `displayName` holds the full score text
 * (e.g. "Brazil 5-2 Sweden") - this question asks about the *year*, not the
 * score, so the score text is never shown or used as a choice (it would give
 * the answer away); `years[0]` (one edition per entry) is used instead.
 * Returns no question at all when there's a tie for the single biggest
 * margin (no unambiguous correct answer - e.g. the FIFA World Cup's own
 * three-way tie at margin 3) or fewer than 3 distinct editions (not enough
 * distractors) - e.g. Copa América has no "Final" score column at all, so
 * `buildBiggestFinalMargins()` returns an empty array for it and this
 * correctly produces no question.
 */
export function biggestFinalMarginQuestion(
  margins: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = margins;
  if (!top || !runnerUp || margins.length < 3) return [];
  if (top.titles === runnerUp.titles) return [];

  const correct = top.years[0];
  const pool = margins.map((m) => m.years[0]);
  const id = `${seedPrefix}:biggest-margin`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const prompt =
    locale === 'hr'
      ? `Koje je godine finale natjecanja ${competition} završilo najvećom pobjedom?`
      : `In which year did the ${competition} final have the biggest winning margin?`;

  return [{ id, category: competition, prompt, ...choice }];
}

/**
 * "Which team/player had the longest run of consecutive {competition}
 * titles/awards?" - a single generated question per competition, built from
 * the same `ChampionSummary[]`-shaped streak ranking `buildLongestStreaks()`
 * already produces for `/records`' own "Back-to-back champions" section (see
 * `src/lib/editions.ts`) - no new editorial research, just a new way of
 * asking about data the site already displays and has already verified (the
 * two-hundred-and-ninth intensive run hand-recomputed every one of these
 * streaks against each competition's own Winner column).
 *
 * `streaks` must already be sorted by streak length descending
 * (`buildLongestStreaks()` does this for free). Each entry's `titles` field
 * holds the streak length (editions in a row), not a title count. Returns no
 * question at all when there's a tie for the single longest streak (no
 * unambiguous correct answer - e.g. the FIFA World Cup's own two-way tie
 * between Italy 1934/1938 and Brazil 1958/1962, both length 2) or fewer than
 * 3 distinct streaks (not enough distractors) - e.g. UEFA Nations League and
 * the EURO Golden Boot have no back-to-back streak at all as of 2026, so
 * `buildLongestStreaks()` returns an empty array for them and this correctly
 * produces no question. A team/player can appear more than once in `streaks`
 * (separate, non-adjacent streaks) - `buildChoice`'s own `[...new
 * Set(pool)]` dedup already handles that without any extra filtering here.
 */
export function longestStreakQuestion(
  streaks: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  subject: 'team' | 'player' = 'team',
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = streaks;
  if (!top || !runnerUp || streaks.length < 3) return [];
  if (top.titles === runnerUp.titles) return [];

  const correct = top.displayName;
  const pool = streaks.map((s) => s.displayName);
  const id = `${seedPrefix}:longest-streak`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const prompt =
    locale === 'hr'
      ? subject === 'player'
        ? `Tko ima najdulji niz uzastopnih osvojenih nagrada ${competition}?`
        : `Koja reprezentacija ima najdulji niz uzastopnih naslova na natjecanju ${competition}?`
      : subject === 'player'
        ? `Who had the longest run of consecutive ${competition} awards?`
        : `Which team had the longest run of consecutive ${competition} titles?`;

  return [{ id, category: competition, prompt, ...choice }];
}

/**
 * "Who waited the longest between {competition} titles/awards?" - a single
 * generated question per competition, built from the same
 * `ChampionSummary[]`-shaped gap ranking `buildLongestTitleGaps()` already
 * produces for `/records`' own "Longest wait between titles" section (see
 * `src/lib/editions.ts`) - no new editorial research, just a new way of
 * asking about data the site already displays and has already verified (the
 * two-hundred-and-ninth intensive run hand-recomputed every one of these
 * gaps against each competition's own title years).
 *
 * `gaps` must already be sorted by gap length descending
 * (`buildLongestTitleGaps()` does this for free). Each entry's `titles`
 * field holds the gap length in years, not a title count, and each entry is
 * one distinct team/player (unlike `longestStreakQuestion`'s `streaks`,
 * which can repeat a name across separate runs), since
 * `buildLongestTitleGaps()` iterates `buildChampionsSummary()` once per
 * champion. Returns no question at all when there's a tie for the single
 * longest wait (no unambiguous correct answer - e.g. the Ballon d'Or's own
 * tie between Ronaldo and Cristiano Ronaldo, both a 5-year wait) or fewer
 * than 3 distinct entries (not enough distractors) - e.g. UEFA Nations
 * League and both Golden Boot tables have only one team/player with 2+
 * titles so far, so `buildLongestTitleGaps()` returns too short a list for
 * either.
 */
export function longestTitleGapQuestion(
  gaps: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  subject: 'team' | 'player' = 'team',
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = gaps;
  if (!top || !runnerUp || gaps.length < 3) return [];
  if (top.titles === runnerUp.titles) return [];

  const correct = top.displayName;
  const pool = gaps.map((g) => g.displayName);
  const id = `${seedPrefix}:longest-gap`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const prompt =
    locale === 'hr'
      ? subject === 'player'
        ? `Tko je najdulje čekao na sljedeću nagradu ${competition}?`
        : `Koja je reprezentacija najdulje čekala na sljedeći naslov na natjecanju ${competition}?`
      : subject === 'player'
        ? `Who waited the longest between ${competition} awards?`
        : `Which team waited the longest between ${competition} titles?`;

  return [{ id, category: competition, prompt, ...choice }];
}

/**
 * "Which two teams have met each other the most times in {competition}
 * finals?" - a single generated question per competition, built from the
 * same `Rivalry[]`-shaped head-to-head ranking `buildRivalries()` already
 * produces for `/records`' own "Fiercest rivalries" section (see
 * `src/lib/compare.ts`), independently hand-recomputed against every
 * competition's own Champion/Runner-up columns at the two-hundred-and-tenth
 * intensive run - no new editorial research, just a new way of asking about
 * data the site already displays and has already verified.
 *
 * Unlike `/records`' own "Fiercest rivalries" section, which combines finals
 * across all four team competitions (so two teams can qualify by meeting once
 * each in two different competitions, e.g. France-Italy via EURO 2000 + the
 * 2006 World Cup), `rivalries` here must already be scoped to one
 * competition's own finals only - pass `buildRivalries(buildFinalsMeetings([{
 * title: competition, slug: competition, editions }]))` for a single
 * competition, not the combined cross-competition list - so the question and
 * its "met in {competition} finals" prompt stay accurate to what it's
 * actually asking about. A cross-competition rivalry question would need its
 * own two-sided prompt shape and is left as a separate, unscoped idea (see
 * `docs/ROADMAP.md`).
 *
 * The correct choice is formatted as "{teamA} vs {teamB}" (both already in
 * alphabetical order from `buildRivalries()`); distractors are every other
 * qualifying pair's own "{teamA} vs {teamB}" label. Returns no question at
 * all when there's a tie for the most meetings (no single unambiguous
 * correct answer) or fewer than 3 distinct rivalries (not enough
 * distractors) - confirmed against the real content tables by hand: FIFA
 * World Cup (only 2 qualifying pairs) and both UEFA EURO and UEFA Nations
 * League (0 pairs meeting twice within the competition alone) all correctly
 * produce no question, while Copa América (7 qualifying pairs, Argentina vs.
 * Uruguay's 12 meetings a clear, unambiguous leader over Argentina vs.
 * Brazil's 11) correctly does.
 */
export function mostFrequentRivalryQuestion(
  rivalries: Rivalry[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = rivalries;
  if (!top || !runnerUp || rivalries.length < 3) return [];
  if (top.meetings === runnerUp.meetings) return [];

  const pairLabel = (r: Rivalry) => `${r.teamADisplayName} vs ${r.teamBDisplayName}`;
  const correct = pairLabel(top);
  const pool = rivalries.map(pairLabel);
  const id = `${seedPrefix}:rivalry`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const prompt =
    locale === 'hr'
      ? `Koje su se dvije reprezentacije najčešće susrele u finalima natjecanja ${competition}?`
      : `Which two teams have met each other the most times in ${competition} finals?`;

  return [{ id, category: competition, prompt, ...choice }];
}

/**
 * "Which two national teams have met each other the most times across World
 * Cup, EURO, Copa América and Nations League finals, combined?" - the
 * cross-competition counterpart `mostFrequentRivalryQuestion()`'s own comment
 * flagged as a separate, unscoped idea (two-hundred-and-sixteenth intensive
 * run), now scoped and shipped. Unlike that function, `rivalries` here is the
 * exact same combined, all-four-competition `Rivalry[]` `/records`' own
 * "Fiercest rivalries" section already renders - pass
 * `buildRivalries(buildFinalsMeetings([...all four competitions...]))`
 * directly, the same call `src/pages/records.astro` already makes - so a
 * pair can qualify by meeting once each in two *different* competitions
 * (e.g. France vs. Italy via EURO 2000 + the 2006 World Cup), which is
 * exactly what makes this question distinct from the per-competition one.
 * This needed no new editorial research: the combined ranking was
 * independently hand-recomputed against every competition's own Champion/
 * Runner-up columns at the two-hundred-and-tenth intensive run, and is the
 * same data `/records` has displayed and had re-verified ever since.
 *
 * Same tie-and-sparse-data safety as every other generated question type
 * (no question when the top two pairs are tied on meetings, or fewer than 3
 * distinct pairs exist) - confirmed against the real combined ranking by
 * hand: Argentina vs. Uruguay is the clear leader at 13 meetings, well ahead
 * of Argentina vs. Brazil's 11, so this one does produce a question.
 */
export function fiercestRivalryQuestion(
  rivalries: Rivalry[],
  seedPrefix: string,
  locale: Locale = 'en',
): QuizQuestion[] {
  const [top, runnerUp] = rivalries;
  if (!top || !runnerUp || rivalries.length < 3) return [];
  if (top.meetings === runnerUp.meetings) return [];

  const pairLabel = (r: Rivalry) => `${r.teamADisplayName} vs ${r.teamBDisplayName}`;
  const correct = pairLabel(top);
  const pool = rivalries.map(pairLabel);
  const id = `${seedPrefix}:cross-rivalry`;
  const choice = buildChoice(id, correct, pool);
  if (!choice) return [];

  const category = locale === 'hr' ? 'Najžešći rivaliteti' : 'Fiercest rivalries';
  const prompt =
    locale === 'hr'
      ? 'Koje su se dvije reprezentacije najčešće susrele u finalima Svjetskog prvenstva, EURO-a, Copa Américe i Liga nacija zajedno?'
      : 'Which two national teams have met each other the most times across World Cup, EURO, Copa América and Nations League finals, combined?';

  return [{ id, category, prompt, ...choice }];
}

/**
 * "Which of these teams has reached a {competition} final without ever
 * winning the title?" - one question per entry in
 * `buildRunnerUpsWithoutTitle()`'s own "Nearly champions" ranking (see
 * `src/lib/editions.ts`), the generated `/records` ranking flagged
 * (two-hundred-and-fifteenth intensive run) as needing a genuinely new
 * question *shape* rather than a drop-in reuse of `mostTitlesQuestion()`'s
 * own pattern: "Nearly champions" is a list of every team that clears a bar
 * (reached a final, never won it), not a single superlative record, so there
 * is no one "most nearly-champion" team to ask about. This instead generates
 * one question per qualifying team, the same "iterate every qualifying
 * entry" shape `championByYearQuestions`/`hostByYearQuestions`/
 * `runnerUpByYearQuestions` already use, rather than `mostTitlesQuestion`'s
 * own "one question per competition" shape.
 *
 * The correct answer is drawn from `nearlyChampions`; distractors are drawn
 * from `champions` (`buildChampionsSummary()`'s own title-winners list) -
 * every distractor is genuinely wrong by construction, since a team in
 * `champions` has, by definition, won the competition at least once. Needs
 * at least 3 distinct champions to supply enough distractors
 * (`MIN_DISTRACTORS` = 2 plus the correct answer's own slot); a question is
 * simply skipped for any `nearlyChampions` entry where `buildChoice` can't
 * find enough, the same per-entry sparse-data behaviour
 * `championByYearQuestions` already has for an individual edition.
 */
export function nearlyChampionQuestions(
  nearlyChampions: ChampionSummary[],
  champions: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
): QuizQuestion[] {
  const pool = champions.map((c) => c.displayName);
  const questions: QuizQuestion[] = [];
  for (const entry of nearlyChampions) {
    const correct = entry.displayName;
    const id = `${seedPrefix}:nearly-champion:${entry.id}`;
    const choice = buildChoice(id, correct, pool);
    if (!choice) continue;
    questions.push({
      id,
      category: competition,
      prompt:
        locale === 'hr'
          ? `Koja je od ovih reprezentacija igrala u finalu natjecanja ${competition}, ali ga nikad nije osvojila?`
          : `Which of these teams has reached a ${competition} final without ever winning the title?`,
      ...choice,
    });
  }
  return questions;
}

/**
 * "Which of these teams has reached a {competition} semifinal without ever
 * reaching the final?" - the "Nearly champions" sibling question's own
 * one-tier-down counterpart, built the same way from
 * `buildNearlyFinalists()`'s own ranking (see `src/lib/editions.ts`): one
 * question per qualifying team, correct answers drawn from
 * `nearlyFinalists`, distractors drawn from `finalists` - every team that
 * has ever reached *any* final, winner or runner-up alike. `finalists` is
 * simply `champions` and `nearlyChampions` combined (exactly the union
 * `buildNearlyFinalists()` itself excludes from its own "Third"/"Fourth"
 * tally internally, via its own `finalistGroupIds` set) - callers already
 * have both lists in hand from the pool above, so no new editions.ts export
 * is needed to build it. Same per-entry sparse-data behaviour as
 * `nearlyChampionQuestions` - a question is skipped for any entry without
 * enough distinct finalists to supply three distractors.
 */
export function nearlyFinalistQuestions(
  nearlyFinalists: ChampionSummary[],
  finalists: ChampionSummary[],
  competition: string,
  seedPrefix: string,
  locale: Locale = 'en',
): QuizQuestion[] {
  const pool = finalists.map((f) => f.displayName);
  const questions: QuizQuestion[] = [];
  for (const entry of nearlyFinalists) {
    const correct = entry.displayName;
    const id = `${seedPrefix}:nearly-finalist:${entry.id}`;
    const choice = buildChoice(id, correct, pool);
    if (!choice) continue;
    questions.push({
      id,
      category: competition,
      prompt:
        locale === 'hr'
          ? `Koja je od ovih reprezentacija igrala u polufinalu natjecanja ${competition}, ali nikad nije igrala u finalu?`
          : `Which of these teams has reached a ${competition} semifinal without ever reaching the final?`,
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
