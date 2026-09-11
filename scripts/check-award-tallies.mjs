// Cross-checks every hand-authored "titles won per nation/player" tally table
// against the results table it summarizes - a real content-integrity gap
// nothing before this run checked. `content/fifa-world-cup.md`'s "Champions
// by titles after 2026", `content/uefa-euro.md`'s "Champions by titles",
// `content/copa-america.md`'s "Titles after 2024" and `content/ballon-dor.md`'s
// "Multiple winners through 2025" are each a second, independently
// hand-maintained table - not derived at build time from the "Editions"/
// "Winners" table the way `/records`' generated rankings are (see
// `src/lib/editions.ts`'s `buildChampionsSummary`, which *is* build-time
// derived and therefore can't drift). A future edit to either table (a new
// year added to one but not the other, a typo'd count, a name that stops
// matching its alias) would ship silently: `validateEditions()`
// (`src/lib/validate.ts`) only checks the source table's own structural
// shape, and no unit or e2e test reads these two tables against each other.
//
// Deliberately does not enforce row order: Copa América's own tie-break
// order among nations on the same title count doesn't follow any single
// derivable rule (checked by hand against the source table before writing
// this), unlike World Cup/EURO's "earliest title year" ordering - enforcing
// an unwritten order convention here would produce false positives on a
// legitimate future edit, not catch a real bug. What *is* checked: every
// count is arithmetically correct against the source table (with the one
// known nation-name merge, "West Germany" folded into "Germany, including
// West Germany", applied), and the tally table's rows are exactly the set
// the source table implies - no nation/player missing, none extra, and (for
// Ballon d'Or's "multiple winners" table specifically) no single-time winner
// wrongly included.
//
// Plain regex/string parsing of `content/*.md`, no build or browser needed -
// the same territory as `check:spelling` (well under a second), so this is
// wired into `.github/workflows/ci.yml` as a required PR gate.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');

// A small, dependency-free Markdown pipe-table parser - deliberately kept
// local rather than imported from `src/lib/markdownTable.ts`: every other
// `scripts/check-*.mjs` file is plain Node ESM with no TypeScript import, and
// this file follows the same convention.

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell.replace(/\s+/g, '')));
}

/** Extract every Markdown table in document order, tagged with its nearest preceding heading. */
export function parseMarkdownTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];
  let currentHeading;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    const headingMatch = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      continue;
    }

    if (!lines[i].includes('|') || i + 1 >= lines.length) continue;

    const headers = splitRow(lines[i]);
    const separator = splitRow(lines[i + 1]);
    if (separator.length !== headers.length || !isSeparatorRow(separator)) continue;

    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim() !== '' && lines[j].includes('|')) {
      rows.push(splitRow(lines[j]));
      j++;
    }

    tables.push({ headers, rows, heading: currentHeading });
    i = j - 1;
  }

  return tables;
}

/** Find the first table whose nearest heading starts with `prefix` (case-insensitive). */
export function findTableByHeadingPrefix(markdown, prefix) {
  const target = prefix.trim().toLowerCase();
  return parseMarkdownTables(markdown).find((table) =>
    table.heading?.trim().toLowerCase().startsWith(target),
  );
}

function columnIndex(table, name) {
  return table.headers.findIndex((header) => header.trim().toLowerCase() === name.toLowerCase());
}

const INVALID_NAMES = new Set(['', '—', '-', 'not awarded']);

function isValidName(value) {
  return !INVALID_NAMES.has(value.trim().toLowerCase());
}

/**
 * Recomputes a name -> {count, years} tally from a source table's year/name
 * columns, applying `aliases` (raw name -> canonical display name) so e.g.
 * "West Germany" and "Germany" merge into one bucket the way the hand-authored
 * tally tables already merge them.
 */
export function computeTally(sourceTable, { yearColumn, nameColumn, aliases = {} }) {
  const yearIdx = columnIndex(sourceTable, yearColumn);
  const nameIdx = columnIndex(sourceTable, nameColumn);
  if (yearIdx === -1) throw new Error(`source table has no "${yearColumn}" column`);
  if (nameIdx === -1) throw new Error(`source table has no "${nameColumn}" column`);

  const tally = new Map();
  for (const row of sourceTable.rows) {
    const rawName = row[nameIdx];
    if (!isValidName(rawName)) continue;
    const canonical = aliases[rawName] ?? rawName;
    const year = row[yearIdx];
    if (!tally.has(canonical)) tally.set(canonical, { count: 0, years: [] });
    const entry = tally.get(canonical);
    entry.count += 1;
    entry.years.push(year);
  }
  return tally;
}

/**
 * Compares a computed tally against a hand-authored tally table's rows.
 * `mode: 'full'` requires every computed name to appear (a complete roll of
 * honour); `mode: 'multiple'` requires every name with count >= 2 to appear
 * and none with count < 2 (a "repeat winners only" table, e.g. Ballon d'Or's).
 * Returns a list of human-readable problem strings, empty when consistent.
 */
export function diffTally(tallyTable, computed, { nameColumn, countColumn, yearsColumn = '', mode }) {
  const problems = [];
  const nameIdx = columnIndex(tallyTable, nameColumn);
  const countIdx = columnIndex(tallyTable, countColumn);
  const yearsIdx = yearsColumn ? columnIndex(tallyTable, yearsColumn) : -1;
  if (nameIdx === -1) problems.push(`tally table has no "${nameColumn}" column`);
  if (countIdx === -1) problems.push(`tally table has no "${countColumn}" column`);
  if (yearsColumn && yearsIdx === -1) problems.push(`tally table has no "${yearsColumn}" column`);
  if (problems.length > 0) return problems;

  const seenInTally = new Set();
  for (const row of tallyTable.rows) {
    const name = row[nameIdx];
    const listedCount = Number.parseInt(row[countIdx], 10);
    seenInTally.add(name);

    const entry = computed.get(name);
    if (!entry) {
      problems.push(`"${name}" appears in the tally table but has no matching wins in the source table`);
      continue;
    }
    if (entry.count !== listedCount) {
      problems.push(
        `"${name}" is listed with ${listedCount} title(s) but the source table has ${entry.count}`,
      );
    }
    if (mode === 'multiple' && entry.count < 2) {
      problems.push(`"${name}" is listed in a multiple-winners table with only ${entry.count} win`);
    }
    if (yearsIdx !== -1) {
      const listedYears = row[yearsIdx].split(',').map((y) => y.trim());
      const computedYears = [...entry.years].sort((a, b) => Number(a) - Number(b));
      const sortedListed = [...listedYears].sort((a, b) => Number(a) - Number(b));
      if (JSON.stringify(sortedListed) !== JSON.stringify(computedYears)) {
        problems.push(
          `"${name}" is listed with winning years [${listedYears.join(', ')}] but the source table has [${computedYears.join(', ')}]`,
        );
      }
    }
  }

  for (const [name, entry] of computed) {
    if (seenInTally.has(name)) continue;
    if (mode === 'multiple' && entry.count < 2) continue;
    problems.push(`"${name}" has ${entry.count} title(s) in the source table but is missing from the tally table`);
  }

  return problems;
}

const CHECKS = [
  {
    file: 'fifa-world-cup.md',
    sourceHeading: 'Editions',
    tallyHeadingPrefix: 'Champions by titles',
    yearColumn: 'Year',
    nameColumn: 'Winner',
    tallyNameColumn: 'Nation',
    tallyCountColumn: 'Titles',
    tallyYearsColumn: 'Winning years',
    mode: 'full',
    aliases: {
      'West Germany': 'Germany, including West Germany',
      Germany: 'Germany, including West Germany',
    },
  },
  {
    file: 'uefa-euro.md',
    sourceHeading: 'Editions',
    tallyHeadingPrefix: 'Champions by titles',
    yearColumn: 'Year',
    nameColumn: 'Winner',
    tallyNameColumn: 'Nation',
    tallyCountColumn: 'Titles',
    mode: 'full',
    aliases: {
      'West Germany': 'Germany, including West Germany',
      Germany: 'Germany, including West Germany',
    },
  },
  {
    file: 'copa-america.md',
    sourceHeading: 'Champions timeline',
    tallyHeadingPrefix: 'Titles after',
    yearColumn: 'Year',
    nameColumn: 'Champion',
    tallyNameColumn: 'Nation',
    tallyCountColumn: 'Titles',
    mode: 'full',
    aliases: {},
  },
  {
    file: 'ballon-dor.md',
    sourceHeading: 'Winners',
    tallyHeadingPrefix: 'Multiple winners',
    yearColumn: 'Year',
    nameColumn: 'Winner',
    tallyNameColumn: 'Player',
    tallyCountColumn: 'Awards',
    mode: 'multiple',
    aliases: {},
  },
];

async function main() {
  console.log(`Checking ${CHECKS.length} hand-authored title-tally table(s) against their source tables...`);

  const problems = [];
  for (const check of CHECKS) {
    const markdown = await readFile(path.join(CONTENT_DIR, check.file), 'utf8');
    const sourceTable = parseMarkdownTables(markdown).find(
      (table) => table.heading?.trim().toLowerCase() === check.sourceHeading.toLowerCase(),
    );
    const tallyTable = findTableByHeadingPrefix(markdown, check.tallyHeadingPrefix);

    if (!sourceTable) {
      problems.push(`${check.file}: no "${check.sourceHeading}" source table found`);
      continue;
    }
    if (!tallyTable) {
      problems.push(`${check.file}: no tally table found with a heading starting "${check.tallyHeadingPrefix}"`);
      continue;
    }

    const computed = computeTally(sourceTable, {
      yearColumn: check.yearColumn,
      nameColumn: check.nameColumn,
      aliases: check.aliases,
    });
    const fileProblems = diffTally(tallyTable, computed, {
      nameColumn: check.tallyNameColumn,
      countColumn: check.tallyCountColumn,
      yearsColumn: check.tallyYearsColumn,
      mode: check.mode,
    });
    for (const problem of fileProblems) {
      problems.push(`${check.file} ("${tallyTable.heading}"): ${problem}`);
    }
  }

  if (problems.length === 0) {
    console.log(`\nEvery tally table matches its source table (${CHECKS.length} checked, 0 problems).`);
    return;
  }

  console.error(`\n${problems.length} tally problem(s) found:\n`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
