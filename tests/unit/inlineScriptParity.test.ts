import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  entriesOnDate,
  fallbackEntry,
  formatOnThisDayDate,
  monthNamesFor,
  onThisDayResultText,
  type OnThisDayEntry,
} from '../../src/lib/onThisDay';
import { compareCellText } from '../../src/lib/tableSort';

// `OnThisDay.astro` and `TournamentTable.astro` each ship an `is:inline`
// `<script>` that hand-duplicates a handful of functions from `src/lib/`
// (documented in both files as "kept in sync manually" - `define:vars`
// only works on `is:inline` scripts, which can't `import` a module, so this
// duplication is a real framework constraint, not an oversight). That is
// exactly the shape that has produced real, shipped bugs elsewhere on this
// site before a permanent check existed (`check:award-tallies`,
// `check:i18n-notes`, `check:edition-header-labels` each closed one such
// gap) - so rather than re-reading both copies by eye once more, this
// extracts the *actual* shipped inline-script source from each `.astro`
// file with `new Function(...)` and runs it, side by side with the real
// `src/lib/` implementation, across a shared table of inputs (including
// edge cases neither hand-copy is likely to get wrong the same way twice:
// a leap-day date, an empty entry list, multiple entries on one calendar
// day, both locales, both sort directions). A future edit that changes one
// copy without the other fails this test immediately instead of shipping
// silently.

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Slices `source` from the first `{` after `startIndex` to its matching closing `}` (inclusive), by brace-depth counting. */
function sliceBalancedBraces(source: string, searchFrom: number): string {
  const braceStart = source.indexOf('{', searchFrom);
  if (braceStart === -1) throw new Error('no opening brace found');
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(searchFrom, i + 1);
    }
  }
  throw new Error('unterminated block (unbalanced braces)');
}

/** Extracts one `function <name>(...) { ... }` declaration's full source from a script body. */
function extractFunctionSource(scriptBody: string, functionName: string): string {
  const match = new RegExp(`function\\s+${functionName}\\s*\\(`).exec(scriptBody);
  if (!match) throw new Error(`function ${functionName} not found in inline script`);
  return sliceBalancedBraces(scriptBody, match.index);
}

/** Extracts the content of a `.astro` file's one `is:inline` `<script>` block. */
function extractInlineScriptBody(componentRelativePath: string): string {
  const source = readFileSync(path.join(ROOT, componentRelativePath), 'utf8');
  const match = /<script[^>]*\bis:inline\b[^>]*>([\s\S]*?)<\/script>/.exec(source);
  if (!match) throw new Error(`${componentRelativePath}: no is:inline <script> block found`);
  return match[1];
}

describe('OnThisDay.astro inline script matches src/lib/onThisDay.ts', () => {
  const scriptBody = extractInlineScriptBody('src/components/OnThisDay.astro');

  /** Builds the four shipped helper functions as real, running code, closed over `monthNames`/`locale` the same way `define:vars` wires them in the browser. */
  function loadShippedHelpers(monthNames: string[], locale: string) {
    const source = [
      extractFunctionSource(scriptBody, 'entriesOnDate'),
      extractFunctionSource(scriptBody, 'fallbackEntry'),
      extractFunctionSource(scriptBody, 'formatDate'),
      extractFunctionSource(scriptBody, 'resultText'),
      'return { entriesOnDate, fallbackEntry, formatDate, resultText };',
    ].join('\n');
    // Deliberately running the real shipped script source via new Function - see file header.
    const factory = new Function('monthNames', 'locale', source) as (
      monthNames: string[],
      locale: string,
    ) => {
      entriesOnDate: (all: OnThisDayEntry[], date: Date) => OnThisDayEntry[];
      fallbackEntry: (all: OnThisDayEntry[], date: Date) => OnThisDayEntry | undefined;
      formatDate: (month: number, day: number) => string;
      resultText: (entry: OnThisDayEntry) => string;
    };
    return factory(monthNames, locale);
  }

  const sampleEntries: OnThisDayEntry[] = [
    { competition: 'FIFA World Cup', year: '2018', month: 7, day: 15, champion: 'France', final: '4–2' },
    { competition: 'FIFA World Cup', year: '1998', month: 7, day: 12, champion: 'France', final: '3–0' },
    { competition: 'UEFA EURO', year: '2021', month: 7, day: 11, champion: 'Italy' },
    { competition: "Ballon d'Or", year: '2023', month: 10, day: 30, champion: 'Lionel Messi', isAward: true },
    { competition: 'FIFA World Cup', year: '1930', month: 7, day: 30, champion: 'Uruguay', final: '4–2' },
    { competition: 'UEFA EURO', year: '2024', month: 2, day: 29, champion: 'Placeholder (leap day)' },
  ];

  const testDates = [
    new Date(2026, 6, 15), // matches the 2018/1998 France entries (month/day only, year-independent)
    new Date(2000, 6, 12), // matches the 1998 entry from a different year
    new Date(2026, 9, 30), // matches the Ballon d'Or ceremony-date entry
    new Date(2024, 1, 29), // leap day: matches the synthetic leap-day entry
    new Date(2025, 1, 28), // no Feb 29 in a non-leap year - exercises fallbackEntry
    new Date(2026, 0, 1), // no entries on Jan 1 - exercises fallbackEntry
    new Date(2026, 11, 31), // no entries on Dec 31 - exercises fallbackEntry, year-boundary dayOfYear math
  ];

  it('entriesOnDate returns identical results for every test date', () => {
    const shipped = loadShippedHelpers(monthNamesFor('en'), 'en');
    for (const date of testDates) {
      expect(shipped.entriesOnDate(sampleEntries, date)).toEqual(entriesOnDate(sampleEntries, date));
    }
  });

  it('fallbackEntry returns identical results for every test date, including an empty entry list', () => {
    const shipped = loadShippedHelpers(monthNamesFor('en'), 'en');
    for (const date of testDates) {
      expect(shipped.fallbackEntry(sampleEntries, date)).toEqual(fallbackEntry(sampleEntries, date));
    }
    for (const date of testDates) {
      expect(shipped.fallbackEntry([], date)).toEqual(fallbackEntry([], date));
    }
  });

  it.each(['en', 'hr'] as const)('formatDate matches formatOnThisDayDate for every month/day in %s', (locale) => {
    const shipped = loadShippedHelpers(monthNamesFor(locale), locale);
    for (let month = 1; month <= 12; month++) {
      for (const day of [1, 15, 29, 30, 31]) {
        expect(shipped.formatDate(month, day)).toBe(formatOnThisDayDate(month, day, locale));
      }
    }
  });

  it.each(['en', 'hr'] as const)('resultText matches onThisDayResultText for every sample entry in %s', (locale) => {
    const shipped = loadShippedHelpers(monthNamesFor(locale), locale);
    for (const entry of sampleEntries) {
      expect(shipped.resultText(entry)).toBe(onThisDayResultText(entry, locale));
    }
    // An award entry with no recorded final (Ballon d'Or's actual shape) and
    // a tournament entry with no recorded final (the "won the final"/"pobijedio
    // u finalu" sentence path) - both branches of the isAward ternary.
    const awardNoFinal: OnThisDayEntry = { competition: "Ballon d'Or", year: '2020', month: 12, day: 1, champion: 'Nobody', isAward: true };
    const tournamentNoFinal: OnThisDayEntry = { competition: 'UEFA Nations League', year: '2021', month: 10, day: 10, champion: 'France' };
    expect(shipped.resultText(awardNoFinal)).toBe(onThisDayResultText(awardNoFinal, locale));
    expect(shipped.resultText(tournamentNoFinal)).toBe(onThisDayResultText(tournamentNoFinal, locale));
  });
});

describe('TournamentTable.astro inline script matches src/lib/tableSort.ts', () => {
  const scriptBody = extractInlineScriptBody('src/components/TournamentTable.astro');

  function loadShippedCompareCellText() {
    const collatorMatch = /const collator = new Intl\.Collator\([^;]*\);/.exec(scriptBody);
    if (!collatorMatch) throw new Error('TournamentTable.astro: collator declaration not found');
    const source = [collatorMatch[0], extractFunctionSource(scriptBody, 'compareCellText'), 'return compareCellText;'].join(
      '\n',
    );
    // Deliberately running the real shipped script source via new Function - see file header.
    const factory = new Function(source) as () => (a: string, b: string, dir: 'asc' | 'desc') => number;
    return factory();
  }

  const samplePairs: Array<[string, string]> = [
    ['2', '10'], // numeric-aware: "2" must sort before "10"
    ['10', '2'],
    ['Argentina', 'argentina'], // case-insensitive (sensitivity: 'base')
    ['', 'Brazil'], // blank cell sorts last
    ['—', 'Brazil'], // em dash "no data" sorts last, same as blank
    ['—', '—'],
    ['', ''],
    ['France', 'France'],
    ['Ćorić', 'Coric'], // locale-collated accent handling
    ['  Spain  ', 'Spain'], // surrounding whitespace is trimmed before comparing
  ];

  it.each(['asc', 'desc'] as const)('compareCellText matches for every sample pair, dir=%s', (dir) => {
    const shipped = loadShippedCompareCellText();
    for (const [a, b] of samplePairs) {
      expect(shipped(a, b, dir)).toBe(compareCellText(a, b, dir));
    }
  });
});
