// Independently recomputes every generated ranking on `/records` straight
// from the `content/*.md` source tables and diffs the result against the
// ranking's own JSON-LD block in the built page - a genuinely new angle on
// content-integrity checking, not a duplicate of anything else in this
// directory.
//
// Every other claim-ledger script here (`check-superlative-claims.mjs` and
// its siblings) scans hand-written `content/*.md` prose bullets for a
// specific phrasing and gates new/changed matches for manual re-verification.
// `check-award-tallies.mjs` cross-checks one hand-maintained tally table
// against the table it summarizes. Neither touches `/records` itself: its
// ~40 rankings (`src/pages/records.astro`, computed by `src/lib/editions.ts`
// and `src/lib/compare.ts`) are build-time *derived*, not hand-written, so
// they can't drift the way a hand-maintained table can - but a derivation
// bug (a wrong tie-break, a missed name-merge, an off-by-one in a streak or
// gap calculation) could still ship wrong and nothing before this script
// would catch it: `tests/unit/editions.test.ts`/`compare.test.ts` exercise
// the same functions, but only against small synthetic fixtures, never the
// real six-competition dataset with its real edge cases (tied Golden Boot
// winners, the 1959/1975-83 Copa América irregularities, the West
// Germany/Germany merge, a cancelled Ballon d'Or year).
//
// Deliberately re-implements each ranking's logic from scratch here rather
// than importing `src/lib/editions.ts`/`compare.ts` - reusing the same code
// to check itself would only catch a *rendering* bug (the template
// mis-wiring correct data), not a bug in the computation those functions
// share with the page. The two implementations agreeing on the full real
// dataset is the actual guarantee this script provides.
//
// Run manually (`pnpm check:records-consistency`) after `pnpm build`, or
// from CI - see .github/workflows/ci.yml. Reads the already-built English
// `/records` page's JSON-LD (the Croatian `/hr/records` page carries the
// same underlying numbers with translated labels, so checking English only
// is sufficient). Exits non-zero, listing every mismatch, if any computed
// ranking disagrees with the page.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTableByHeadingPrefix } from './check-award-tallies.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const RECORDS_PAGE = path.join(ROOT, 'dist', 'records', 'index.html');

export const GERMANY_ALIASES = { 'West Germany': 'Germany (incl. West Germany)', Germany: 'Germany (incl. West Germany)' };

function columnIndex(table, name) {
  return table.headers.findIndex((header) => header.trim().toLowerCase() === name.toLowerCase());
}

function cell(table, row, name) {
  const idx = columnIndex(table, name);
  if (idx === -1) throw new Error(`table "${table.heading}" has no "${name}" column`);
  return row[idx];
}

/** First year of a season string ("2018–19" -> 2018) or a plain year ("1990" -> 1990). */
export function firstYear(value) {
  const match = /(\d+)/.exec(value);
  if (!match) throw new Error(`cannot parse a year out of "${value}"`);
  return Number(match[1]);
}

/** Splits a "Player(s)"-style cell ("A; B; C") into trimmed names, dropping a "Not awarded" placeholder. */
export function splitNames(raw) {
  if (raw.trim().toLowerCase().startsWith('not awarded')) return [];
  return raw
    .split(';')
    .map((name) => name.trim())
    .filter(Boolean);
}

const EMPTY_CELL = new Set(['', '—', '-']);

export function isEmptyCell(value) {
  return EMPTY_CELL.has(value.trim());
}

/**
 * Builds {year, host, winner, runner, third, fourth, final} edition records from a competition's main table.
 * @param {{headers: string[], rows: string[][]}} table
 * @param {{year: string, host?: string, winner?: string, runner?: string, third?: string, fourth?: string, final?: string}} columns
 */
export function buildEditions(table, columns) {
  return table.rows.map((row) => ({
    year: cell(table, row, columns.year),
    host: columns.host ? cell(table, row, columns.host) : undefined,
    winner: columns.winner ? cell(table, row, columns.winner) : undefined,
    runner: columns.runner ? cell(table, row, columns.runner) : undefined,
    third: columns.third ? cell(table, row, columns.third) : undefined,
    fourth: columns.fourth ? cell(table, row, columns.fourth) : undefined,
    final: columns.final ? cell(table, row, columns.final) : undefined,
  }));
}

/**
 * Tallies how many times each (aliased) value in `pick(edition)` occurs, in first-occurrence order.
 * @param {Array<any>} editions
 * @param {(edition: any) => string | undefined} pick
 * @param {{alias?: Record<string, string>, excludeValue?: string}} [options]
 */
export function tallyByYear(editions, pick, { alias = {}, excludeValue } = {}) {
  const tally = new Map();
  for (const edition of editions) {
    const raw = pick(edition);
    if (raw === undefined || isEmptyCell(raw) || raw === excludeValue) continue;
    const name = alias[raw] ?? raw;
    if (!tally.has(name)) tally.set(name, []);
    tally.get(name).push(edition.year);
  }
  return tally;
}

/** Most-successful/most-frequent-style ranking: sorted by count desc, then by earliest year asc. */
export function rankTally(tally) {
  return [...tally.entries()]
    .map(([name, years]) => ({ name, count: years.length, years }))
    .sort((a, b) => b.count - a.count || firstYear(a.years[0]) - firstYear(b.years[0]));
}

/**
 * Editions a (aliased) team won while also hosting, tallied the same way as rankTally.
 * @param {Array<any>} editions
 * @param {Record<string, string>} [alias]
 */
export function homeSoilTitles(editions, alias = {}) {
  const tally = new Map();
  for (const edition of editions) {
    if (isEmptyCell(edition.host) || isEmptyCell(edition.winner)) continue;
    const host = alias[edition.host] ?? edition.host;
    const winner = alias[edition.winner] ?? edition.winner;
    if (host !== winner) continue;
    if (!tally.has(winner)) tally.set(winner, []);
    tally.get(winner).push(edition.year);
  }
  return rankTally(tally);
}

/**
 * Maximal runs of consecutive editions (by table row order, which is
 * chronological) won by the same (aliased) name(s) - an edition can have
 * several tied winners (Golden Boot ties), each tracked independently.
 * @param {Array<any>} editions
 * @param {{alias?: Record<string, string>, multiWinner?: boolean}} [options]
 */
export function backToBackStreaks(editions, { alias = {}, multiWinner = false } = {}) {
  const winnersPerEdition = editions.map((edition) => {
    if (!multiWinner) {
      if (isEmptyCell(edition.winner)) return [];
      return [alias[edition.winner] ?? edition.winner];
    }
    return edition.winner;
  });
  const streaks = [];
  for (let i = 0; i < editions.length; i++) {
    for (const name of winnersPerEdition[i]) {
      const precededBySameName = i > 0 && winnersPerEdition[i - 1].includes(name);
      if (precededBySameName) continue; // only start a streak at its first edition
      let j = i;
      while (j + 1 < editions.length && winnersPerEdition[j + 1].includes(name)) j++;
      if (j > i) streaks.push({ name, years: editions.slice(i, j + 1).map((e) => e.year) });
    }
  }
  return streaks;
}

/**
 * Teams/players who reached `field` but never won the competition outright.
 * @param {Array<any>} editions
 * @param {string} field
 * @param {{alias?: Record<string, string>, excludeFields?: string[]}} [options]
 */
export function nearlyTally(editions, field, { alias = {}, excludeFields = ['winner'] } = {}) {
  const winners = new Set();
  for (const excludeField of excludeFields) {
    for (const edition of editions) {
      const raw = edition[excludeField];
      if (raw === undefined || isEmptyCell(raw)) continue;
      winners.add(alias[raw] ?? raw);
    }
  }
  const tally = tallyByYear(editions, (e) => e[field], { alias });
  for (const name of winners) tally.delete(name);
  return rankTally(tally);
}

/**
 * Longest single gap (in calendar years) between any (aliased) team/player's own titles.
 * @param {Array<any>} editions
 * @param {{alias?: Record<string, string>, multiWinner?: boolean}} [options]
 */
export function longestWait(editions, { alias = {}, multiWinner = false } = {}) {
  const titleYears = new Map();
  for (const edition of editions) {
    const names = multiWinner
      ? edition.winner
      : isEmptyCell(edition.winner)
        ? []
        : [alias[edition.winner] ?? edition.winner];
    for (const name of names) {
      if (!titleYears.has(name)) titleYears.set(name, []);
      titleYears.get(name).push(edition.year);
    }
  }
  const results = new Map();
  for (const [name, years] of titleYears) {
    if (years.length < 2) continue;
    const sorted = [...years].sort((a, b) => firstYear(a) - firstYear(b));
    let best = { gap: -1, from: null, to: null };
    for (let i = 1; i < sorted.length; i++) {
      const gap = firstYear(sorted[i]) - firstYear(sorted[i - 1]);
      if (gap > best.gap) best = { gap, from: sorted[i - 1], to: sorted[i] };
    }
    results.set(name, best);
  }
  return results;
}

/** Final-score margin ("3–1", "0–0; ... pens" -> 0) ranking, sorted by margin desc then year asc. */
export function biggestMargins(editions) {
  return editions
    .map((edition) => {
      const match = /(\d+)\D+(\d+)/.exec(edition.final);
      if (!match) throw new Error(`cannot parse a score out of "${edition.final}"`);
      const margin = Math.abs(Number(match[1]) - Number(match[2]));
      return { final: edition.final, margin, year: edition.year };
    })
    .sort((a, b) => b.margin - a.margin || firstYear(a.year) - firstYear(b.year));
}

/**
 * Head-to-head final meetings between every pair of (aliased) teams across
 * every team competition's finals, each competition ordered by the year of
 * the pair's first meeting in it - the same order the page itself uses.
 * @param {Array<{winner: string, runner: string, year: string, competition: string}>} allFinals
 * @param {Record<string, string>} [alias]
 */
export function rivalries(allFinals, alias = {}) {
  const pairs = new Map();
  for (const { winner, runner, year, competition } of allFinals) {
    const w = alias[winner] ?? winner;
    const r = alias[runner] ?? runner;
    const key = [w, r].sort().join(' vs ');
    if (!pairs.has(key)) {
      pairs.set(key, { wins: new Map(), competitionFirstYear: new Map(), lastYear: -Infinity, lastSort: -Infinity });
    }
    const entry = pairs.get(key);
    entry.wins.set(w, (entry.wins.get(w) ?? 0) + 1);
    const y = firstYear(year);
    if (!entry.competitionFirstYear.has(competition) || y < entry.competitionFirstYear.get(competition)) {
      entry.competitionFirstYear.set(competition, y);
    }
    if (y > entry.lastSort) {
      entry.lastSort = y;
      entry.lastYear = year;
      entry.lastCompetition = competition;
    }
  }
  const results = [];
  for (const [key, entry] of pairs) {
    const total = [...entry.wins.values()].reduce((a, b) => a + b, 0);
    if (total < 2) continue;
    const competitions = [...entry.competitionFirstYear.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);
    results.push({
      pair: key,
      total,
      wins: entry.wins,
      competitions,
      lastYear: entry.lastYear,
      lastCompetition: entry.lastCompetition,
    });
  }
  return results.sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// JSON-LD extraction from the built page
// ---------------------------------------------------------------------------

/** Every ItemList JSON-LD block on the page, keyed by its own "name". */
export function parsePageRankings(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const rankings = new Map();
  for (const [, json] of blocks) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      continue;
    }
    if (data['@type'] !== 'ItemList' || !data.name) continue;
    const items = (data.itemListElement ?? []).map((entry) => ({
      name: entry.item?.name,
      description: entry.item?.description,
    }));
    rankings.set(data.name, items);
  }
  return rankings;
}

function parseCountAndYears(description) {
  const match = /^(\d+)[^(]*\(([^)]*)\)/.exec(description);
  if (!match) return null;
  return { count: Number(match[1]), years: match[2].split(',').map((y) => y.trim()) };
}

// ---------------------------------------------------------------------------
// Diffing helpers - every one returns a list of human-readable problems
// ---------------------------------------------------------------------------

function diffCountedRanking(label, computedEntries, pageItems, problems) {
  const computedMap = new Map(computedEntries.map((e) => [e.name, { count: e.count, years: e.years }]));
  const pageMap = new Map();
  for (const { name, description } of pageItems) {
    const parsed = parseCountAndYears(description);
    if (parsed) pageMap.set(name, parsed);
  }
  for (const name of new Set([...computedMap.keys(), ...pageMap.keys()])) {
    const computed = computedMap.get(name);
    const page = pageMap.get(name);
    const same = computed && page && computed.count === page.count && computed.years.join(',') === page.years.join(',');
    if (!same) {
      problems.push(
        `${label}: "${name}" - page says ${page ? JSON.stringify(page) : 'absent'}, computed ${computed ? JSON.stringify(computed) : 'absent'}`,
      );
    }
  }
}

function diffStreaks(label, computedStreaks, pageItems, problems) {
  const computedSet = new Set(computedStreaks.map((s) => `${s.name}|${s.years.join(',')}`));
  const pageSet = new Set();
  for (const { name, description } of pageItems) {
    const parsed = parseCountAndYears(description);
    if (parsed) pageSet.add(`${name}|${parsed.years.join(',')}`);
  }
  for (const key of new Set([...computedSet, ...pageSet])) {
    if (computedSet.has(key) !== pageSet.has(key)) {
      problems.push(`${label}: streak "${key}" - page has it: ${pageSet.has(key)}, computed has it: ${computedSet.has(key)}`);
    }
  }
}

function diffGaps(label, computedGaps, pageItems, problems) {
  const pageMap = new Map();
  for (const { name, description } of pageItems) {
    const match = /^(\d+) years? \((.*), (.*)\)$/.exec(description);
    if (match) pageMap.set(name, { gap: Number(match[1]), from: match[2], to: match[3] });
  }
  const names = new Set([...computedGaps.keys(), ...pageMap.keys()]);
  for (const name of names) {
    const computed = computedGaps.get(name);
    const page = pageMap.get(name);
    const same = computed && page && computed.gap === page.gap && computed.from === page.from && computed.to === page.to;
    if (!same) {
      problems.push(`${label}: "${name}" - page says ${JSON.stringify(page)}, computed ${JSON.stringify(computed)}`);
    }
  }
}

function diffMargins(label, computed, pageItems, problems) {
  if (computed.length !== pageItems.length) {
    problems.push(`${label}: page has ${pageItems.length} finals listed, computed ${computed.length}`);
    return;
  }
  for (let i = 0; i < computed.length; i++) {
    const page = pageItems[i];
    const expectedDescription = `${computed[i].margin} goal${computed[i].margin === 1 ? '' : 's'} (${computed[i].year})`;
    if (page.name !== computed[i].final || page.description !== expectedDescription) {
      problems.push(
        `${label}: position ${i + 1} - page has "${page.name}" / "${page.description}", computed "${computed[i].final}" / "${expectedDescription}"`,
      );
    }
  }
}

function diffRivalries(label, computed, pageItems, problems) {
  for (const { name, description } of pageItems) {
    const [a, b] = name.split(' vs ');
    const match = computed.find((r) => r.pair === [a, b].sort().join(' vs '));
    if (!match) {
      problems.push(`${label}: page lists "${name}" (${description}), nothing computed for that pair`);
      continue;
    }
    const winsText = `${a} ${match.wins.get(a) ?? 0}, ${b} ${match.wins.get(b) ?? 0}`;
    const expected = `${match.total} meeting${match.total === 1 ? '' : 's'} (${winsText}) across ${match.competitions.join(', ')}, most recently ${match.lastYear} (${match.lastCompetition})`;
    if (description !== expected) {
      problems.push(`${label}: "${name}" - page says "${description}", computed "${expected}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Per-competition verification
// ---------------------------------------------------------------------------

// Exported so scripts/check-team-profiles-against-source.mjs can read the
// same four team-competition tables/columns without redefining this schema a
// second time and risking the two drifting apart - it's just "which file,
// heading and column holds what," not any of the ranking/matching logic
// itself, so sharing it carries none of the "reusing the code under test"
// risk the file's own top comment warns about.
export const TEAM_COMPETITIONS = [
  {
    key: 'FIFA World Cup',
    file: 'fifa-world-cup.md',
    heading: 'editions',
    columns: { year: 'Year', host: 'Host(s)', winner: 'Winner', runner: 'Runner-up', third: 'Third', fourth: 'Fourth / other semifinalist', final: 'Final' },
    alias: GERMANY_ALIASES,
    hasMargins: true,
  },
  {
    key: 'UEFA EURO',
    file: 'uefa-euro.md',
    heading: 'editions',
    columns: { year: 'Year', host: 'Host(s)', winner: 'Winner', runner: 'Runner-up', third: 'Other semifinalist', fourth: 'Other semifinalist / fourth', final: 'Final' },
    alias: GERMANY_ALIASES,
    hasMargins: true,
  },
  {
    key: 'Copa América',
    file: 'copa-america.md',
    heading: 'champions timeline',
    columns: { year: 'Year', host: 'Host / format', winner: 'Champion', runner: 'Runner-up', third: 'Third', fourth: 'Fourth', final: undefined },
    alias: {},
    hostExclude: 'Home-and-away',
    hasMargins: false,
  },
  {
    key: 'UEFA Nations League',
    file: 'uefa-nations-league.md',
    heading: 'finals',
    columns: { year: 'Season', host: 'Finals host', winner: 'Winner', runner: 'Runner-up', third: 'Third', fourth: 'Fourth', final: 'Final' },
    alias: GERMANY_ALIASES,
    hasMargins: true,
  },
];

const INDIVIDUAL_AWARDS = [
  { key: "Ballon d'Or", file: 'ballon-dor.md', heading: 'winners', columns: { year: 'Year', winner: 'Winner' } },
  { key: 'Golden Boot (World Cup)', file: 'golden-boot.md', heading: 'fifa world cup top scorers', columns: { year: 'Year', winner: 'Player(s)' } },
  { key: 'Golden Boot (EURO)', file: 'golden-boot.md', heading: 'uefa euro top scorers', columns: { year: 'Year', winner: 'Player(s)' } },
];

export async function loadTable(file, heading) {
  const markdown = await readFile(path.join(CONTENT_DIR, file), 'utf8');
  const table = findTableByHeadingPrefix(markdown, heading);
  if (!table) throw new Error(`no table found under a heading starting with "${heading}" in ${file}`);
  return table;
}

export async function verifyAgainstSource(pageRankings) {
  const problems = [];
  const allFinals = [];

  for (const comp of TEAM_COMPETITIONS) {
    const table = await loadTable(comp.file, comp.heading);
    const editions = buildEditions(table, comp.columns);
    for (const e of editions) {
      if (isEmptyCell(e.winner) || isEmptyCell(e.runner)) continue;
      allFinals.push({ winner: e.winner, runner: e.runner, year: e.year, competition: comp.key });
    }

    diffCountedRanking(
      `${comp.key} - Most successful teams`,
      rankTally(tallyByYear(editions, (e) => e.winner, { alias: comp.alias })),
      pageRankings.get(`${comp.key} - Most successful teams`) ?? [],
      problems,
    );
    diffCountedRanking(
      `${comp.key} - Most frequent hosts`,
      rankTally(tallyByYear(editions, (e) => e.host, { excludeValue: comp.hostExclude })),
      pageRankings.get(`${comp.key} - Most frequent hosts`) ?? [],
      problems,
    );
    diffCountedRanking(
      `${comp.key} - Titles won on home soil`,
      homeSoilTitles(editions, comp.alias),
      pageRankings.get(`${comp.key} - Titles won on home soil`) ?? [],
      problems,
    );
    diffStreaks(
      `${comp.key} - Back-to-back champions`,
      backToBackStreaks(editions, { alias: comp.alias }),
      pageRankings.get(`${comp.key} - Back-to-back champions`) ?? [],
      problems,
    );
    diffCountedRanking(
      `${comp.key} - Nearly champions`,
      nearlyTally(editions, 'runner', { alias: comp.alias }),
      pageRankings.get(`${comp.key} - Nearly champions`) ?? [],
      problems,
    );
    const thirdTally = tallyByYear(editions, (e) => e.third, { alias: comp.alias });
    const fourthTally = tallyByYear(editions, (e) => e.fourth, { alias: comp.alias });
    const semifinalTally = new Map(thirdTally);
    for (const [name, years] of fourthTally) {
      semifinalTally.set(name, [...(semifinalTally.get(name) ?? []), ...years]);
    }
    for (const [name, years] of semifinalTally) {
      semifinalTally.set(
        name,
        [...years].sort((a, b) => firstYear(a) - firstYear(b)),
      );
    }
    const winnersAndRunners = new Set([
      ...editions.map((e) => comp.alias[e.winner] ?? e.winner),
      ...editions.map((e) => comp.alias[e.runner] ?? e.runner),
    ]);
    for (const name of winnersAndRunners) semifinalTally.delete(name);
    diffCountedRanking(
      `${comp.key} - Nearly finalists`,
      rankTally(semifinalTally),
      pageRankings.get(`${comp.key} - Nearly finalists`) ?? [],
      problems,
    );

    const gaps = longestWait(editions, { alias: comp.alias });
    const pageGapItems = pageRankings.get(`${comp.key} - Longest wait between titles`) ?? [];
    diffGaps(`${comp.key} - Longest wait between titles`, gaps, pageGapItems, problems);

    if (comp.hasMargins) {
      const pageMarginItems = pageRankings.get(`${comp.key} - Biggest final wins`);
      if (pageMarginItems) diffMargins(`${comp.key} - Biggest final wins`, biggestMargins(editions), pageMarginItems, problems);
    }
  }

  for (const award of INDIVIDUAL_AWARDS) {
    const table = await loadTable(award.file, award.heading);
    const editions = buildEditions(table, { year: award.columns.year, winner: award.columns.winner }).map((e) => ({
      ...e,
      winner: splitNames(e.winner),
    }));

    diffCountedRanking(
      `${award.key} - Most awards`,
      rankTally(tallyByYear(editions.flatMap((e) => e.winner.map((name) => ({ year: e.year, winner: name }))), (e) => e.winner)),
      pageRankings.get(`${award.key} - Most awards`) ?? [],
      problems,
    );
    const pageStreakItems = pageRankings.get(`${award.key} - Back-to-back champions`);
    if (pageStreakItems) {
      diffStreaks(`${award.key} - Back-to-back champions`, backToBackStreaks(editions, { multiWinner: true }), pageStreakItems, problems);
    }
    const gaps = longestWait(editions, { multiWinner: true });
    const pageGapItems = pageRankings.get(`${award.key} - Longest wait between titles`) ?? [];
    diffGaps(`${award.key} - Longest wait between titles`, gaps, pageGapItems, problems);
  }

  const pageRivalryItems = pageRankings.get('Fiercest rivalries');
  if (pageRivalryItems) {
    diffRivalries('Fiercest rivalries', rivalries(allFinals, GERMANY_ALIASES), pageRivalryItems, problems);
  }

  return problems;
}

async function main() {
  let html;
  try {
    html = await readFile(RECORDS_PAGE, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`No build output found at ${path.relative(ROOT, RECORDS_PAGE)}. Run \`pnpm build\` first.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const pageRankings = parsePageRankings(html);
  const problems = await verifyAgainstSource(pageRankings);

  if (problems.length === 0) {
    console.log(`/records: every generated ranking matches an independent recomputation from content/*.md.`);
    return;
  }

  console.error(`${problems.length} /records ranking discrepancy(ies) found:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
