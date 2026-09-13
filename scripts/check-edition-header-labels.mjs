// Cross-checks every Croatian per-edition page's `HEADER_LABELS` translation
// map against the real column headers of its English source table - a gap
// nothing before this run checked. `EditionView.astro`'s `label()` helper
// (`headerLabels[raw] ?? raw`) silently falls back to the raw English column
// header when a locale page's map is missing a key, so a table column added
// or renamed in `content/*.md` without a matching edit to the seven
// `src/pages/hr/competitions/**/[year].astro` files' `HEADER_LABELS` objects
// would ship an English `<dt>` label on an otherwise fully Croatian page -
// the exact bug shape `check:award-tallies`/`check:i18n-notes` already guard
// against for other hand-maintained cross-language/cross-table pairs, just
// for this one un-swept spot. A hundred-and-fourteenth-run manual read of
// all seven pairs found today's maps already complete (see docs/PROJECT_STATUS.md);
// this script is the permanent backstop so the next content-table edit can't
// silently regress that.
//
// Plain regex/string parsing of `content/*.md` and the seven `.astro` route
// files, no build or browser needed - the same territory as
// `check:award-tallies`/`check:spelling` (well under a second) - so this is
// wired into `.github/workflows/ci.yml` as a required PR gate.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownTables } from './check-award-tallies.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const PAGES_DIR = path.join(ROOT, 'src', 'pages', 'hr', 'competitions');

/** Column labels never rendered as a `<dt>` fact - the Year/Season key column
 * `EditionProfile.facts` deliberately excludes (see `isYearLabel` in
 * `src/lib/editionProfile.ts`), kept in sync with that same regex. */
function isYearLabel(label) {
  const lower = label.trim().toLowerCase();
  return /year/.test(lower) || /season/.test(lower);
}

const FAMILIES = [
  {
    name: 'FIFA World Cup',
    contentFile: 'fifa-world-cup.md',
    sourceHeading: 'Editions',
    astroFile: 'world-cup/[year].astro',
  },
  {
    name: 'UEFA EURO',
    contentFile: 'uefa-euro.md',
    sourceHeading: 'Editions',
    astroFile: 'euro/[year].astro',
  },
  {
    name: 'UEFA Nations League',
    contentFile: 'uefa-nations-league.md',
    sourceHeading: 'Finals',
    astroFile: 'nations-league/[year].astro',
  },
  {
    name: 'Copa América',
    contentFile: 'copa-america.md',
    sourceHeading: 'Champions timeline',
    astroFile: 'copa-america/[year].astro',
  },
  {
    name: "Ballon d'Or",
    contentFile: 'ballon-dor.md',
    sourceHeading: 'Winners',
    astroFile: 'ballon-dor/[year].astro',
  },
  {
    name: 'Golden Boot (World Cup)',
    contentFile: 'golden-boot.md',
    sourceHeading: 'FIFA World Cup top scorers',
    astroFile: 'golden-boot/world-cup/[year].astro',
  },
  {
    name: 'Golden Boot (EURO)',
    contentFile: 'golden-boot.md',
    sourceHeading: 'UEFA EURO top scorers',
    astroFile: 'golden-boot/euro/[year].astro',
  },
];

/** Extracts the `HEADER_LABELS` object literal's string keys from a `.astro` file's frontmatter. */
export function parseHeaderLabelKeys(source) {
  const match = /HEADER_LABELS[^{]*\{([\s\S]*?)\n\s*\};/.exec(source);
  if (!match) return null;
  const body = match[1];
  const keyPattern = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][A-Za-z0-9_$]*))\s*:/gm;
  const keys = [];
  let m;
  while ((m = keyPattern.exec(body))) {
    keys.push(m[1] ?? m[2] ?? m[3]);
  }
  return keys;
}

async function main() {
  const problems = [];

  for (const family of FAMILIES) {
    const markdown = await readFile(path.join(CONTENT_DIR, family.contentFile), 'utf8');
    const table = parseMarkdownTables(markdown).find(
      (t) => t.heading?.trim().toLowerCase() === family.sourceHeading.toLowerCase(),
    );
    if (!table) {
      problems.push(`${family.name}: no "${family.sourceHeading}" source table found in ${family.contentFile}`);
      continue;
    }

    const astroSource = await readFile(path.join(PAGES_DIR, family.astroFile), 'utf8');
    const keys = parseHeaderLabelKeys(astroSource);
    if (!keys) {
      problems.push(`${family.name}: no HEADER_LABELS object found in ${family.astroFile}`);
      continue;
    }
    const keySet = new Set(keys);

    const factColumns = table.headers.filter((header) => !isYearLabel(header));
    for (const column of factColumns) {
      if (!keySet.has(column)) {
        problems.push(
          `${family.name}: HEADER_LABELS in ${family.astroFile} has no Croatian translation for column "${column}" (would render the raw English label)`,
        );
      }
    }

    for (const key of keySet) {
      if (!factColumns.includes(key)) {
        problems.push(
          `${family.name}: HEADER_LABELS in ${family.astroFile} has a stale key "${key}" that no longer matches any column in ${family.contentFile}`,
        );
      }
    }
  }

  if (problems.length === 0) {
    console.log(
      `\nEvery Croatian per-edition page's HEADER_LABELS map is complete and matches its source table (${FAMILIES.length} families checked, 0 problems).`,
    );
    return;
  }

  console.error(`\n${problems.length} header-label problem(s) found:\n`);
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
