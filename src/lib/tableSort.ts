import { findColumn } from './editions';
import { t, type Locale } from './i18n';

export type SortDirection = 'asc' | 'desc';
type SortRole = 'year' | 'quantity' | 'text';

export type SortOption = {
  /** Stable key for the URL query param and the <option> value, e.g. "year-desc". */
  value: string;
  label: string;
  colIndex: number;
  dir: SortDirection;
  role: SortRole;
};

const YEAR_RE = /year|season/;
const WINNER_RE = [/winner/, /champion/, /player/];
const HOST_RE = /host/;
const QUANTITY_RE = /^(teams|goals)$/;

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'col';
}

export type BuildSortOptionsConfig = {
  /** UI language for the "(newest first)"/"(A-Z)" etc. suffix wording. Defaults to English. */
  locale?: Locale;
  /** Display-only header overrides (e.g. Croatian column names), keyed by the raw English header. */
  headerLabels?: Record<string, string>;
};

/**
 * Build "sort by" <select> options for a tournament table. Only offers the
 * columns TournamentTable already treats as meaningful (Year/Season,
 * Winner/Champion/Player, Host, and a numeric quantity column such as Teams
 * or Goals), detected with the same matchers `buildEditions` uses, so the
 * roles stay consistent everywhere. A competition missing a role (e.g.
 * Ballon d'Or has no host column) simply doesn't get that option pair.
 */
export function buildSortOptions(headers: string[], config: BuildSortOptionsConfig = {}): SortOption[] {
  const { locale = 'en', headerLabels = {} } = config;
  const roles: Array<{ index: number; kind: SortRole }> = [
    { index: findColumn(headers, [YEAR_RE]), kind: 'year' },
    { index: findColumn(headers, WINNER_RE), kind: 'text' },
    { index: findColumn(headers, [HOST_RE]), kind: 'text' },
    { index: findColumn(headers, [QUANTITY_RE]), kind: 'quantity' },
  ];

  const seen = new Set<number>();
  const options: SortOption[] = [];

  for (const role of roles) {
    if (role.index < 0 || seen.has(role.index)) continue;
    seen.add(role.index);
    const rawHeader = headers[role.index];
    const header = headerLabels[rawHeader] ?? rawHeader;
    const base = slug(rawHeader);

    let ascLabel: string;
    let descLabel: string;
    if (role.kind === 'year') {
      ascLabel = `${header} ${t(locale, 'sortOldestFirst')}`;
      descLabel = `${header} ${t(locale, 'sortNewestFirst')}`;
    } else if (role.kind === 'quantity') {
      ascLabel = `${header} ${t(locale, 'sortFewestFirst')}`;
      descLabel = `${header} ${t(locale, 'sortMostFirst')}`;
    } else {
      ascLabel = `${header} ${t(locale, 'sortAZ')}`;
      descLabel = `${header} ${t(locale, 'sortZA')}`;
    }

    options.push({
      value: `${base}-asc`,
      label: ascLabel,
      colIndex: role.index,
      dir: 'asc',
      role: role.kind,
    });
    options.push({
      value: `${base}-desc`,
      label: descLabel,
      colIndex: role.index,
      dir: 'desc',
      role: role.kind,
    });
  }

  return options;
}

/** Default selection: Year/Season newest-first (matches the table's default row order), else the first option. */
export function defaultSortValue(options: SortOption[]): string {
  const yearDesc = options.find((o) => o.role === 'year' && o.dir === 'desc');
  return yearDesc?.value ?? options[0]?.value ?? '';
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Compare two cell text values for sorting a table column. Blank cells and
 * the "no data" em dash always sort last regardless of direction, and
 * numbers embedded in text (years, goal counts) compare numerically rather
 * than lexically ("2" before "10"). This only ever compares/reorders whole
 * rows - it never rewrites cell text, so a historical note in a cell (e.g.
 * "Not awarded") is preserved verbatim wherever the row lands.
 */
export function compareCellText(a: string, b: string, dir: SortDirection): number {
  const av = a.trim();
  const bv = b.trim();
  const aMissing = av === '' || av === '—';
  const bMissing = bv === '' || bv === '—';
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  const cmp = collator.compare(av, bv);
  return dir === 'desc' ? -cmp : cmp;
}
