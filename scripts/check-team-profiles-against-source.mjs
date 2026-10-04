// Independently recomputes every /teams/<slug> profile page's per-competition
// appearance list and title-trophy list straight from the same four
// team-competition `content/*.md` tables `check-records-against-source.mjs`
// already loads, and diffs the result against that page's own JSON-LD
// (`buildTeamProfileItemList()`/`buildTeamSportsTeamJsonLd()` in
// `src/lib/jsonLd.ts`) in the built `dist/teams/<slug>/index.html` - the same
// "independently recompute from source, diff against the page's own
// structured data" technique `check-records-against-source.mjs` applied to
// `/records`, now applied to one of the generated/derived pages that run's
// own write-up named as still untouched (`docs/ROADMAP.md`'s "Open backlog").
//
// Reuses only the *table schema* from check-records-against-source.mjs
// (`TEAM_COMPETITIONS`: which file/heading/column holds what, plus
// `GERMANY_ALIASES`/`isEmptyCell`/`buildEditions`/`firstYear`/`loadTable`) -
// never `src/lib/compare.ts` or `src/lib/teamProfile.ts`, whose winner/
// runner-up/semifinal matching and West Germany/Germany grouping is exactly
// what this script re-implements from scratch to verify independently.
// `teamProfileSlug()` below is a second, independent copy of the identically
// named function in `src/lib/teamProfile.ts` - pure string munging with no
// football-data logic, so copying it (rather than importing the thing under
// test) carries none of that risk.
//
// Run manually (`pnpm check:team-profiles-consistency`) after `pnpm build`,
// or from CI - see .github/workflows/ci.yml. Exits non-zero, listing every
// mismatch, if any team's computed profile disagrees with its built page.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GERMANY_ALIASES,
  TEAM_COMPETITIONS,
  buildEditions,
  firstYear,
  isEmptyCell,
  loadTable,
  parsePageRankings,
} from './check-records-against-source.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TEAMS_DIR = path.join(ROOT, 'dist', 'teams');

/** Second, independent copy of src/lib/teamProfile.ts's teamProfileSlug() - see the file header. */
export function teamProfileSlug(id) {
  return id
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Every (aliased) team that appears as winner/runner-up/third/fourth across
 * one competition's editions, each with its own chronological appearance
 * list - `role` is "Champion", "Runner-up", or the source table's own
 * third/fourth column label verbatim (e.g. "Other semifinalist"), exactly
 * the labels src/lib/teamProfile.ts's appearancesFor() attaches.
 * @param {Array<any>} editions
 * @param {{third?: string, fourth?: string}} columns
 */
export function appearancesByTeam(editions, columns) {
  const byId = new Map();
  const add = (raw, role, year) => {
    if (raw === undefined || isEmptyCell(raw)) return;
    const trimmed = raw.trim();
    const id = GERMANY_ALIASES[trimmed] ? 'germany' : trimmed.toLowerCase();
    const displayName = GERMANY_ALIASES[trimmed] ?? trimmed;
    if (!byId.has(id)) byId.set(id, { displayName, appearances: [] });
    byId.get(id).appearances.push({ year, role });
  };
  for (const edition of editions) {
    add(edition.winner, 'Champion', edition.year);
    add(edition.runner, 'Runner-up', edition.year);
    if (columns.third) add(edition.third, columns.third, edition.year);
    if (columns.fourth) add(edition.fourth, columns.fourth, edition.year);
  }
  for (const entry of byId.values()) {
    entry.appearances.sort((a, b) => firstYear(a.year) - firstYear(b.year));
  }
  return byId;
}

/** "Role (Year), Role (Year), ..." - the exact format defaultTeamProfileDescription() in src/lib/jsonLd.ts builds. */
export function describeAppearances(appearances) {
  return appearances.map((a) => `${a.role} (${a.year})`).join(', ');
}

/** Every team, across all four competitions, with its per-competition appearance list (competitions in TEAM_COMPETITIONS order). */
export async function buildExpectedTeamProfiles() {
  const perTeam = new Map();
  for (const comp of TEAM_COMPETITIONS) {
    const table = await loadTable(comp.file, comp.heading);
    const editions = buildEditions(table, comp.columns);
    const byId = appearancesByTeam(editions, comp.columns);
    for (const [id, { displayName, appearances }] of byId) {
      if (!perTeam.has(id)) perTeam.set(id, { displayName, byCompetition: new Map() });
      perTeam.get(id).byCompetition.set(comp.key, appearances);
    }
  }
  return perTeam;
}

/** Every `@type":"SportsTeam"` JSON-LD block on a page, keyed by its own "name". */
export function parseTeamSportsTeamBlocks(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const result = new Map();
  for (const [, json] of blocks) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      continue;
    }
    if (data['@type'] !== 'SportsTeam' || !data.name) continue;
    result.set(data.name, data.award ?? []);
  }
  return result;
}

function diffTeamProfile(displayName, expectedItems, expectedAward, pageRankings, pageSportsTeams, problems) {
  const itemListKey = `${displayName} - competition appearances`;
  const pageItems = pageRankings.get(itemListKey);
  if (!pageItems) {
    problems.push(`${displayName}: no "${itemListKey}" ItemList found on its /teams page`);
  } else {
    const pageMap = new Map(pageItems.map((i) => [i.name, i.description]));
    const expectedMap = new Map(expectedItems.map((i) => [i.name, i.description]));
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

  const pageAward = pageSportsTeams.get(displayName);
  if (!pageAward) {
    problems.push(`${displayName}: no SportsTeam JSON-LD found on its /teams page`);
  } else if (JSON.stringify(pageAward) !== JSON.stringify(expectedAward)) {
    problems.push(`${displayName} - award list: page has ${JSON.stringify(pageAward)}, computed ${JSON.stringify(expectedAward)}`);
  }
}

export async function verifyAgainstSource() {
  const perTeam = await buildExpectedTeamProfiles();
  const problems = [];

  for (const [id, { displayName, byCompetition }] of perTeam) {
    const slug = teamProfileSlug(id);
    const pagePath = path.join(TEAMS_DIR, slug, 'index.html');
    let html;
    try {
      html = await readFile(pagePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        problems.push(`${displayName}: expected a built page at dist/teams/${slug}/index.html but found none`);
        continue;
      }
      throw error;
    }

    const presentCompetitions = TEAM_COMPETITIONS.filter((comp) => byCompetition.has(comp.key));
    const expectedItems = presentCompetitions.map((comp) => ({
      name: comp.key,
      description: describeAppearances(byCompetition.get(comp.key)),
    }));
    const expectedAward = presentCompetitions.flatMap((comp) =>
      byCompetition
        .get(comp.key)
        .filter((a) => a.role === 'Champion')
        .map((a) => `${comp.key} ${a.year}`),
    );

    const pageRankings = parsePageRankings(html);
    const pageSportsTeams = parseTeamSportsTeamBlocks(html);
    diffTeamProfile(displayName, expectedItems, expectedAward, pageRankings, pageSportsTeams, problems);
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
    console.log(`/teams/<slug>: every team profile's appearances and titles match an independent recomputation from content/*.md.`);
    return;
  }

  console.error(`${problems.length} /teams profile discrepancy(ies) found:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
