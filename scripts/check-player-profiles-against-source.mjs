// Independently recomputes every /players/<slug> profile page's per-award
// appearance list straight from the same three individual-award tables
// src/pages/players/[slug].astro's own getStaticPaths() loads (Ballon d'Or's
// "Winners" table, and golden-boot.md's "FIFA World Cup top scorers"/"UEFA
// EURO top scorers" tables), and diffs the result against that page's own
// JSON-LD (`buildPlayerProfileItemList()`/`buildPlayerPersonJsonLd()` in
// `src/lib/jsonLd.ts`) in the built `dist/players/<slug>/index.html` - the
// same "independently recompute from source, diff against the page's own
// structured data" technique `check-records-against-source.mjs` and
// `check-team-profiles-against-source.mjs` already applied to `/records` and
// `/teams/<slug>`, now applied to the last generated/derived page family
// `docs/ROADMAP.md`'s "Open backlog" named as still untouched (`/compare`
// and `/compare-players` are live comparisons rather than a per-entity
// profile with its own structured data to diff against, so they don't fit
// this technique the same way).
//
// `AWARD_SOURCES` below only re-states which file/heading/columns hold what -
// the same three sources `[slug].astro` reads - never imports
// `src/lib/playerProfile.ts`, whose tied-winner/team-alignment matching is
// exactly what `teamFor()` below re-implements from scratch to verify
// independently. `playerProfileSlug()` is a second, independent copy of the
// identically named function in `playerProfile.ts` - pure string munging
// with no football-data logic, so copying it (rather than importing the
// thing under test) carries none of that risk, the same precedent
// `check-team-profiles-against-source.mjs`'s own `teamProfileSlug()` copy
// set.
//
// Run manually (`pnpm check:player-profiles-consistency`) after `pnpm
// build`, or from CI - see .github/workflows/ci.yml. Exits non-zero, listing
// every mismatch, if any player's computed profile disagrees with its built
// page.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { firstYear, isEmptyCell, loadTable, parsePageRankings, splitNames } from './check-records-against-source.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PLAYERS_DIR = path.join(ROOT, 'dist', 'players');

// Mirrors the three sources src/pages/players/[slug].astro's getStaticPaths()
// builds, in the same order (so a player's awards list in the same order the
// page renders them).
const AWARD_SOURCES = [
  {
    title: "Ballon d'Or",
    file: 'ballon-dor.md',
    heading: 'winners',
    yearCol: 'Year',
    winnerCol: 'Winner',
    teamCol: 'National team',
    goalsCol: undefined,
    ceremonyCol: 'Ceremony date',
  },
  {
    title: 'FIFA World Cup Golden Boot',
    file: 'golden-boot.md',
    heading: 'fifa world cup top scorers',
    yearCol: 'Year',
    winnerCol: 'Player(s)',
    teamCol: 'Team',
    goalsCol: 'Goals',
    ceremonyCol: undefined,
  },
  {
    title: 'UEFA EURO Golden Boot',
    file: 'golden-boot.md',
    heading: 'uefa euro top scorers',
    yearCol: 'Year',
    winnerCol: 'Player(s)',
    teamCol: 'Team',
    goalsCol: 'Goals',
    ceremonyCol: undefined,
  },
];

/** Second, independent copy of src/lib/playerProfile.ts's playerProfileSlug() - see the file header. */
export function playerProfileSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function columnIndex(table, name) {
  return table.headers.findIndex((header) => header.trim().toLowerCase() === name.toLowerCase());
}

function cellAt(table, row, name) {
  if (!name) return undefined;
  const idx = columnIndex(table, name);
  return idx === -1 ? undefined : row[idx];
}

// Golden Boot's Team column uses "Multiple" as a placeholder when a tie has
// too many scorers to name one team each - the same guard playerProfile.ts's
// own TEAM_TIE_PLACEHOLDER applies, re-stated here independently.
const TEAM_TIE_PLACEHOLDER = /^multiple$/i;

/**
 * This player's team for one edition, aligning a "; "-joined Team cell with
 * the same-index name in a "; "-joined winner cell - independent
 * re-implementation of playerProfile.ts's teamFor(), not an import of it.
 */
export function teamFor(teamCell, playerIndex, winnerCount) {
  if (teamCell === undefined || isEmptyCell(teamCell)) return undefined;
  const trimmed = teamCell.trim();
  if (TEAM_TIE_PLACEHOLDER.test(trimmed)) return undefined;
  const teams = trimmed.split(';').map((t) => t.trim());
  if (teams.length === winnerCount) return teams[playerIndex];
  if (winnerCount === 1) return trimmed;
  return undefined;
}

/** "Role (Year), ..." equivalent for players: the exact "Year (detail), ..." format defaultPlayerProfileDescription() in src/lib/jsonLd.ts builds. */
export function describeAppearances(appearances) {
  return appearances.map((a) => (a.detail ? `${a.year} (${a.detail})` : a.year)).join(', ');
}

/** Every player, across all three award sources, with their per-award chronological appearance list. */
export async function buildExpectedPlayerProfiles() {
  const perPlayer = new Map();

  for (const source of AWARD_SOURCES) {
    const table = await loadTable(source.file, source.heading);
    for (const row of table.rows) {
      const year = cellAt(table, row, source.yearCol).trim();
      const winnersRaw = cellAt(table, row, source.winnerCol);
      const winners = splitNames(winnersRaw);
      if (winners.length === 0) continue;

      const teamCell = cellAt(table, row, source.teamCol);
      const goalsCell = cellAt(table, row, source.goalsCol);
      const ceremonyCell = cellAt(table, row, source.ceremonyCol);
      const goals = goalsCell !== undefined && !isEmptyCell(goalsCell) ? goalsCell.trim() : undefined;
      const ceremony = ceremonyCell !== undefined && !isEmptyCell(ceremonyCell) ? ceremonyCell.trim() : undefined;

      winners.forEach((name, index) => {
        const team = teamFor(teamCell, index, winners.length);
        const detail = [team, goals ? `${goals} goals` : undefined, ceremony].filter(Boolean).join(' · ');

        if (!perPlayer.has(name)) perPlayer.set(name, new Map());
        const byTitle = perPlayer.get(name);
        if (!byTitle.has(source.title)) byTitle.set(source.title, []);
        byTitle.get(source.title).push({ year, yearSort: firstYear(year), detail });
      });
    }
  }

  for (const byTitle of perPlayer.values()) {
    for (const appearances of byTitle.values()) {
      appearances.sort((a, b) => a.yearSort - b.yearSort);
    }
  }

  return perPlayer;
}

/** Every `@type":"Person"` JSON-LD block on a page, keyed by its own "name". */
export function parsePlayerPersonBlocks(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const result = new Map();
  for (const [, json] of blocks) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      continue;
    }
    if (data['@type'] !== 'Person' || !data.name) continue;
    result.set(data.name, data.award ?? []);
  }
  return result;
}

function diffPlayerProfile(displayName, expectedAwards, pageRankings, pagePersons, problems) {
  const itemListKey = `${displayName} - full award history`;
  const pageItems = pageRankings.get(itemListKey);
  if (!pageItems) {
    problems.push(`${displayName}: no "${itemListKey}" ItemList found on its /players page`);
  } else {
    const pageMap = new Map(pageItems.map((i) => [i.name, i.description]));
    const expectedMap = new Map(expectedAwards.map((a) => [a.title, a.description]));
    for (const name of new Set([...pageMap.keys(), ...expectedMap.keys()])) {
      const page = pageMap.get(name);
      const expected = expectedMap.get(name);
      if (page !== expected) {
        problems.push(
          `${displayName} - ${name}: page says ${JSON.stringify(page ?? null)}, computed ${JSON.stringify(expected ?? null)}`,
        );
      }
    }
  }

  const expectedPersonAward = expectedAwards.flatMap((a) => a.appearances.map((appearance) => `${a.title} ${appearance.year}`));
  const pageAward = pagePersons.get(displayName);
  if (!pageAward) {
    problems.push(`${displayName}: no Person JSON-LD found on its /players page`);
  } else if (JSON.stringify(pageAward) !== JSON.stringify(expectedPersonAward)) {
    problems.push(`${displayName} - Person award list: page has ${JSON.stringify(pageAward)}, computed ${JSON.stringify(expectedPersonAward)}`);
  }
}

export async function verifyAgainstSource() {
  const perPlayer = await buildExpectedPlayerProfiles();
  const problems = [];

  for (const [name, byTitle] of perPlayer) {
    const slug = playerProfileSlug(name);
    const pagePath = path.join(PLAYERS_DIR, slug, 'index.html');
    let html;
    try {
      html = await readFile(pagePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        problems.push(`${name}: expected a built page at dist/players/${slug}/index.html but found none`);
        continue;
      }
      throw error;
    }

    const expectedAwards = AWARD_SOURCES.filter((source) => (byTitle.get(source.title)?.length ?? 0) > 0).map((source) => {
      const appearances = byTitle.get(source.title);
      return { title: source.title, appearances, description: describeAppearances(appearances) };
    });

    const pageRankings = parsePageRankings(html);
    const pagePersons = parsePlayerPersonBlocks(html);
    diffPlayerProfile(name, expectedAwards, pageRankings, pagePersons, problems);
  }

  return problems;
}

async function main() {
  const problems = await verifyAgainstSource().catch((error) => {
    if (error.code === 'ENOENT') {
      console.error(`${error.message}\nRun \`pnpm build\` first.`);
      process.exitCode = 1;
      return null;
    }
    throw error;
  });
  if (problems === null) return;

  if (problems.length === 0) {
    console.log(`/players/<slug>: every player profile's awards match an independent recomputation from content/*.md.`);
    return;
  }

  console.error(`${problems.length} /players profile discrepancy(ies) found:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
