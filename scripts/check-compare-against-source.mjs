// Independently recomputes the per-pair comparison data /compare and
// /compare-players embed in the built page (the `records`/`finalsMeetings`
// values every pair's head-to-head panel and client-side picker read, via
// `define:vars`) straight from `content/*.md`, and diffs the result against
// what the built page actually carries - the same "independently recompute
// from source, diff against the page's own data" technique
// `check-records-against-source.mjs`/`check-team-profiles-against-source.mjs`/
// `check-player-profiles-against-source.mjs` already applied to `/records`,
// `/teams/<slug>` and `/players/<slug>`, now applied to the last two
// generated/derived pages `docs/ROADMAP.md`'s "Open backlog" named as still
// untouched. /compare and /compare-players have no per-pair JSON-LD to diff
// against (the comparison pair is chosen at request time via `?a=`/`?b=`
// query params, not baked into a fixed per-entity page) - their equivalent
// is the full `records`/`finalsMeetings` array the page's own inline
// `<script is:inline define:vars={{...}}>` embeds as plain JSON, which both
// renders the page's default (no-JS) pair and powers every other pair the
// client script's own picker can render. Verifying that embedded data is
// exactly the same guarantee the JSON-LD diff gives the other four pages.
//
// Team-side (`/compare`): reuses only the *table schema* already exported
// from `check-records-against-source.mjs` (`TEAM_COMPETITIONS`,
// `GERMANY_ALIASES`, `buildEditions`, `isEmptyCell`, `firstYear`, `loadTable`)
// - never `src/lib/compare.ts`, whose title/runner-up/semifinal tallying and
// West Germany/Germany grouping is exactly what this script re-implements
// from scratch to verify independently.
//
// Player-side (`/compare-players`): reuses `buildExpectedPlayerProfiles()`
// from `check-player-profiles-against-source.mjs` - itself an independent,
// already-verified (including a deliberate corrupt-then-restore round trip)
// recomputation of every player's per-award appearance list from
// `content/*.md`, with none of `src/lib/comparePlayers.ts`'s own award-total
// tallying in it to reuse. This mirrors `check-team-profiles-against-
// source.mjs` reusing `check-records-against-source.mjs`'s table schema
// rather than re-deriving it a third time.
//
// Run manually (`pnpm check:compare-consistency`) after `pnpm build`, or
// from CI - see .github/workflows/ci.yml. Reads the already-built English
// `/compare`/`/compare-players` pages only - the Croatian `/hr/compare`/
// `/hr/compare-players` pages embed the exact same `records`/`finalsMeetings`
// data (confirmed directly), just with translated UI chrome, matching
// check-records-against-source.mjs's own "English only is sufficient"
// precedent. Exits non-zero, listing every mismatch, if either page's
// embedded comparison data disagrees with an independent recomputation from
// content/*.md.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GERMANY_ALIASES, TEAM_COMPETITIONS, buildEditions, firstYear, isEmptyCell, loadTable } from './check-records-against-source.mjs';
import { buildExpectedPlayerProfiles } from './check-player-profiles-against-source.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const COMPARE_PAGE = path.join(ROOT, 'dist', 'compare', 'index.html');
const COMPARE_PLAYERS_PAGE = path.join(ROOT, 'dist', 'compare-players', 'index.html');

// Matches src/lib/teamCompetitions.ts's loadTeamCompetitions() slug for each
// of TEAM_COMPETITIONS' own "key" title - the slug compare.astro's
// recordsForClient/finalsMeetingsForClient embed.
const SLUG_BY_KEY = {
  'FIFA World Cup': 'world-cup',
  'UEFA EURO': 'euro',
  'Copa América': 'copa-america',
  'UEFA Nations League': 'nations-league',
};

// src/lib/comparePlayers.ts's awardDefs, in the same order src/pages/
// compare-players.astro builds them (Ballon d'Or, then World Cup/EURO Golden
// Boot) - the individual-award equivalent of SLUG_BY_KEY above.
const PLAYER_AWARD_DEFS = [
  { title: "Ballon d'Or", slug: 'ballon-dor' },
  { title: 'FIFA World Cup Golden Boot', slug: 'golden-boot' },
  { title: 'UEFA EURO Golden Boot', slug: 'golden-boot' },
];

/** Resolve a raw winner/runner-up/third/fourth cell to its summaryGroupFor() id - a second, independent copy of src/lib/countries.ts's grouping, the same precedent check-team-profiles-against-source.mjs's appearancesByTeam() sets. */
export function groupId(raw) {
  const trimmed = raw.trim();
  return GERMANY_ALIASES[trimmed] ? 'germany' : trimmed.toLowerCase();
}

/** The display name for the same grouping - "Germany (incl. West Germany)" for either alias, the raw name otherwise. */
export function groupDisplayName(raw) {
  const trimmed = raw.trim();
  return GERMANY_ALIASES[trimmed] ?? trimmed;
}

/**
 * One competition's title/runner-up/semifinal tally, independently
 * re-implementing src/lib/compare.ts's buildCountryCompetitionRecord() for
 * every team at once rather than one at a time.
 * @param {Array<any>} editions
 */
export function tallyCompetition(editions) {
  const byId = new Map();
  const ensure = (raw) => {
    const id = groupId(raw);
    if (!byId.has(id)) {
      byId.set(id, {
        displayName: groupDisplayName(raw),
        titles: 0,
        titleYears: [],
        runnerUps: 0,
        runnerUpYears: [],
        semifinals: 0,
      });
    }
    return byId.get(id);
  };

  for (const edition of editions) {
    if (edition.winner !== undefined && !isEmptyCell(edition.winner)) {
      const entry = ensure(edition.winner);
      entry.titles += 1;
      entry.titleYears.push(edition.year);
    }
    if (edition.runner !== undefined && !isEmptyCell(edition.runner)) {
      const entry = ensure(edition.runner);
      entry.runnerUps += 1;
      entry.runnerUpYears.push(edition.year);
    }
    // A team counts as one semifinal finish per edition even if it somehow
    // matched both the third and fourth cell - the same OR-not-sum shape
    // src/lib/compare.ts's own reachedSemifinal boolean has.
    const semifinalists = new Set();
    for (const raw of [edition.third, edition.fourth]) {
      if (raw !== undefined && !isEmptyCell(raw)) semifinalists.add(raw);
    }
    const seen = new Set();
    for (const raw of semifinalists) {
      const id = groupId(raw);
      if (seen.has(id)) continue;
      seen.add(id);
      ensure(raw).semifinals += 1;
    }
  }

  return byId;
}

/** Every team's full comparison record across all four TEAM_COMPETITIONS, matching src/lib/compare.ts's buildAllCountryRecords() shape (unsorted - this script diffs by id, not position). */
export async function buildExpectedCountryRecords() {
  const perCompetition = [];
  for (const comp of TEAM_COMPETITIONS) {
    const table = await loadTable(comp.file, comp.heading);
    const editions = buildEditions(table, comp.columns);
    perCompetition.push({ slug: SLUG_BY_KEY[comp.key], tally: tallyCompetition(editions) });
  }

  const allIds = new Set();
  for (const { tally } of perCompetition) for (const id of tally.keys()) allIds.add(id);

  const records = [];
  for (const id of allIds) {
    let displayName = id;
    const competitions = perCompetition.map(({ slug, tally }) => {
      const entry = tally.get(id);
      if (entry) displayName = entry.displayName;
      return {
        slug,
        titles: entry?.titles ?? 0,
        runnerUps: entry?.runnerUps ?? 0,
        semifinals: entry?.semifinals ?? 0,
      };
    });
    const totalTitles = competitions.reduce((sum, c) => sum + c.titles, 0);
    const totalRunnerUps = competitions.reduce((sum, c) => sum + c.runnerUps, 0);
    const totalSemifinals = competitions.reduce((sum, c) => sum + c.semifinals, 0);
    records.push({
      id,
      displayName,
      totalTitles,
      totalRunnerUps,
      totalSemifinals,
      totalFinals: totalTitles + totalRunnerUps,
      competitions,
    });
  }
  return records;
}

/** Every final actually played across TEAM_COMPETITIONS, matching src/lib/compare.ts's buildFinalsMeetings() - independently re-derived from the same buildEditions() rows, not imported. */
export async function buildExpectedFinalsMeetings() {
  const meetings = [];
  for (const comp of TEAM_COMPETITIONS) {
    const table = await loadTable(comp.file, comp.heading);
    const editions = buildEditions(table, comp.columns);
    for (const edition of editions) {
      const winnerName = edition.winner?.trim();
      if (winnerName === undefined || isEmptyCell(winnerName)) continue;
      const runnerUpName = edition.runner?.trim();
      if (runnerUpName === undefined || isEmptyCell(runnerUpName)) continue;
      const score = edition.final !== undefined && !isEmptyCell(edition.final) ? edition.final.trim() : null;

      meetings.push({
        competition: comp.key,
        year: edition.year,
        yearSort: firstYear(edition.year),
        winnerId: groupId(winnerName),
        winnerName,
        runnerUpId: groupId(runnerUpName),
        runnerUpName,
        score,
      });
    }
  }
  return meetings;
}

/** Every player's comparison record across PLAYER_AWARD_DEFS, matching src/lib/comparePlayers.ts's buildAllComparePlayerRecords() shape. */
export async function buildExpectedComparePlayerRecords() {
  const perPlayer = await buildExpectedPlayerProfiles();
  const records = [];
  for (const [name, byTitle] of perPlayer) {
    const awards = PLAYER_AWARD_DEFS.map((def) => {
      const appearances = byTitle.get(def.title) ?? [];
      return {
        title: def.title,
        slug: def.slug,
        count: appearances.length,
        years: appearances.map((a) => ({ year: a.year, yearSort: a.yearSort })),
      };
    });
    records.push({
      id: name,
      displayName: name,
      totalAwards: awards.reduce((sum, a) => sum + a.count, 0),
      awards,
    });
  }
  return records;
}

// ---------------------------------------------------------------------------
// Extracting the embedded `const <name> = [...]` arrays from the built page
// ---------------------------------------------------------------------------

/**
 * Finds `const <varName> = [...]` in an Astro `define:vars` inline script and
 * parses the array - bracket-depth counting rather than a lazy regex, since a
 * lazy `\[.*?\]` would stop at the first `]` inside the JSON, not the array's
 * actual end.
 */
export function extractJsonArray(html, varName) {
  const marker = `const ${varName} = `;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`no "${marker}" found in the built page`);
  const arrayStart = html.indexOf('[', start + marker.length);
  if (arrayStart === -1) throw new Error(`"${marker}" wasn't followed by an array`);

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = arrayStart; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`no matching "]" found for "${marker}"`);
  return JSON.parse(html.slice(arrayStart, end + 1));
}

// ---------------------------------------------------------------------------
// Diffing - order-independent on object keys (define:vars' own JSON.stringify
// key order is an implementation detail, not something worth gating on),
// order-sensitive on arrays.
// ---------------------------------------------------------------------------

export function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

function diffById(label, expected, page, problems) {
  const expectedMap = new Map(expected.map((r) => [r.id, r]));
  const pageMap = new Map(page.map((r) => [r.id, r]));
  for (const id of new Set([...expectedMap.keys(), ...pageMap.keys()])) {
    const e = expectedMap.get(id);
    const p = pageMap.get(id);
    if (!e) {
      problems.push(`${label}: page has "${p.displayName}", nothing computed for it from content/*.md`);
      continue;
    }
    if (!p) {
      problems.push(`${label}: computed "${e.displayName}" from content/*.md, but it's missing from the page`);
      continue;
    }
    if (!deepEqual(e, p)) {
      problems.push(`${label}: "${e.displayName}" - page has ${JSON.stringify(p)}, computed ${JSON.stringify(e)}`);
    }
  }
}

function diffFinalsMeetings(expected, page, problems) {
  const key = (m) => `${m.competition}|${m.year}`;
  const expectedMap = new Map(expected.map((m) => [key(m), m]));
  const pageMap = new Map(page.map((m) => [key(m), m]));
  for (const k of new Set([...expectedMap.keys(), ...pageMap.keys()])) {
    const e = expectedMap.get(k);
    const p = pageMap.get(k);
    if (!e) {
      problems.push(`/compare finals meetings: page has "${k}", nothing computed for it from content/*.md`);
      continue;
    }
    if (!p) {
      problems.push(`/compare finals meetings: computed "${k}" from content/*.md, but it's missing from the page`);
      continue;
    }
    if (!deepEqual(e, p)) {
      problems.push(`/compare finals meetings: "${k}" - page has ${JSON.stringify(p)}, computed ${JSON.stringify(e)}`);
    }
  }
}

async function readPage(pagePath) {
  try {
    return await readFile(pagePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`expected a built page at ${path.relative(ROOT, pagePath)} but found none. Run \`pnpm build\` first.`);
    }
    throw error;
  }
}

export async function verifyAgainstSource() {
  const problems = [];

  const compareHtml = await readPage(COMPARE_PAGE);
  const expectedRecords = await buildExpectedCountryRecords();
  const pageRecords = extractJsonArray(compareHtml, 'records');
  diffById('/compare', expectedRecords, pageRecords, problems);

  const expectedMeetings = await buildExpectedFinalsMeetings();
  const pageMeetings = extractJsonArray(compareHtml, 'finalsMeetings');
  diffFinalsMeetings(expectedMeetings, pageMeetings, problems);

  const comparePlayersHtml = await readPage(COMPARE_PLAYERS_PAGE);
  const expectedPlayerRecords = await buildExpectedComparePlayerRecords();
  const pagePlayerRecords = extractJsonArray(comparePlayersHtml, 'records');
  diffById('/compare-players', expectedPlayerRecords, pagePlayerRecords, problems);

  return problems;
}

async function main() {
  const problems = await verifyAgainstSource();

  if (problems.length === 0) {
    console.log('/compare and /compare-players: every embedded comparison record matches an independent recomputation from content/*.md.');
    return;
  }

  console.error(`${problems.length} /compare(-players) discrepancy(ies) found:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
