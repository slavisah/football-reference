import type { ChampionSummary, Edition, MarkdownTable, TimelineEntry } from './types';
import { summaryGroupFor } from './countries';
import type { Locale } from './i18n';

// Turn a parsed Markdown table into normalized editions, and derive the
// champions summary from those editions (rather than trusting a hand-maintained
// totals table). Column roles are detected from the header text so the same code
// works for the World Cup and EURO tables even though their columns differ.

export function findColumn(headers: string[], matchers: RegExp[]): number {
  return headers.findIndex((h) => matchers.some((re) => re.test(h.toLowerCase())));
}

function leadingYear(label: string): number {
  const match = /\d{4}/.exec(label);
  return match ? Number(match[0]) : Number.NaN;
}

/** Convert a table into structured editions, preserving every column for display. */
export function buildEditions(table: MarkdownTable): Edition[] {
  const { headers, rows } = table;
  const yearCol = findColumn(headers, [/year/, /season/]);
  const winnerCol = findColumn(headers, [/winner/, /champion/, /player/]);
  const hostCol = findColumn(headers, [/host/]);
  const teamsCol = findColumn(headers, [/team/]);

  return rows.map((row) => {
    const cells = headers.map((label, index) => ({
      label,
      value: row[index] ?? '',
    }));

    const yearRaw = yearCol >= 0 ? (row[yearCol] ?? '') : '';

    // Only derive a team count when the table actually has a teams column with
    // a value, so validation can distinguish "no column" from a bad "0".
    let teams: number | undefined;
    if (teamsCol >= 0) {
      const digits = (row[teamsCol] ?? '').replace(/[^\d]/g, '');
      if (digits !== '') teams = Number(digits);
    }

    return {
      year: yearRaw,
      yearSort: leadingYear(yearRaw),
      winner: winnerCol >= 0 ? (row[winnerCol] ?? '') : '',
      host: hostCol >= 0 ? (row[hostCol] ?? '') : undefined,
      teams,
      cells,
    };
  });
}

/**
 * Some editorial tables have a genuine "no winner" row (e.g. the 2020 Ballon
 * d'Or, not awarded because of the pandemic) - the winner cell is filled in
 * with a placeholder phrase rather than left blank, so it still passes the
 * "every row needs a winner" build validation and reads correctly in the raw
 * edition table. Aggregates derived from the winner column (the generated
 * champions summary, the winner filter) should not count that placeholder as
 * a one-off "champion" - it is not a country/player, it is a note that no one
 * won. `buildTimeline` intentionally still shows it verbatim: "Not awarded"
 * is itself the accurate historical fact for that year's timeline card.
 */
const PLACEHOLDER_WINNERS = /^(not awarded|not held|no award(ed)?|cancell?ed)$/i;

export function isPlaceholderWinner(winner: string): boolean {
  return PLACEHOLDER_WINNERS.test(winner.trim());
}

/**
 * Generate champions totals from editions, grouping sporting successors.
 *
 * Splits each winner cell on `;` first, the same way `distinctWinners()`
 * does, for the same reason: Golden Boot's "Player(s)" column holds
 * "; "-separated joint-winner ties (e.g. 2012's six-way EURO tie). Without
 * the split, a tie year was grouped as one bogus multi-name "champion"
 * entirely disconnected from that same player's solo years elsewhere in the
 * table - e.g. Cristiano Ronaldo's outright 2020 EURO Golden Boot didn't
 * combine with his share of the 2012 tie, so the "Most awards" ranking
 * undercounted him (1 instead of 2) and showed a nonsensical six-name row
 * for 2012. Each tied player now earns credit for that edition individually,
 * matching how `distinctWinners()` already lets a reader filter by any one
 * of them.
 */
export function buildChampionsSummary(editions: Edition[]): ChampionSummary[] {
  const groups = new Map<string, ChampionSummary>();

  for (const edition of editions) {
    for (const rawWinner of edition.winner.split(';')) {
      const winner = rawWinner.trim();
      if (!winner || isPlaceholderWinner(winner)) continue;
      const group = summaryGroupFor(winner);
      const existing = groups.get(group.id);
      if (existing) {
        existing.titles += 1;
        existing.years.push(edition.year);
        if (!existing.names.includes(winner)) existing.names.push(winner);
      } else {
        groups.set(group.id, {
          id: group.id,
          displayName: group.displayName,
          titles: 1,
          years: [edition.year],
          names: [winner],
        });
      }
    }
  }

  return [...groups.values()]
    .map((summary) => ({
      ...summary,
      years: [...summary.years].sort((a, b) => leadingYear(a) - leadingYear(b)),
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

/** Find a cell's value by matching its column label, e.g. "Runner-up". */
function cellValue(edition: Edition, matcher: RegExp): string | undefined {
  const cell = edition.cells.find((c) => matcher.test(c.label.trim()));
  return cell?.value.trim() || undefined;
}

/**
 * Reduce editions to champions-timeline cards: year, host, champion,
 * runner-up and final score. Runner-up/final are omitted when the source
 * table has no such column (e.g. Copa América has no "Final" score column).
 */
export function buildTimeline(editions: Edition[]): TimelineEntry[] {
  return editions.map((edition) => ({
    year: edition.year,
    yearSort: edition.yearSort,
    champion: edition.winner,
    host: edition.host,
    runnerUp: cellValue(edition, /runner-up|finalist/i),
    final: cellValue(edition, /^final$/i),
  }));
}

/**
 * Extracts the goal margin (absolute difference) from a "Final" score line
 * like "Brazil 5–2 Sweden" or a penalty-decided "1–1; Italy 3–2 pens" - the
 * *first* score pair in the string is always the regulation/extra-time
 * result, since a penalty shootout only ever follows a draw, so those finals
 * correctly come out with a margin of 0 rather than the penalty score being
 * mistaken for a goal difference. Returns undefined when there's no cell or
 * no "digit-dash-digit" pair to parse (defensive - every current "Final"
 * value on the site has one).
 */
function finalMargin(final: string | undefined): number | undefined {
  if (!final) return undefined;
  const match = /(\d+)\s*[–-]\s*(\d+)/.exec(final);
  if (!match) return undefined;
  return Math.abs(Number(match[1]) - Number(match[2]));
}

/**
 * Every final ranked by goal margin, biggest win first - for competitions
 * whose table has a "Final" score column (Copa América does not, same
 * omission `buildTimeline` already documents). Reuses `ChampionSummary`'s
 * shape the way `buildLongestTitleGaps` does for a non-title-count stat:
 * `displayName` holds the final's score line (it already names both teams),
 * `titles` holds the goal margin, and `years` holds the single year that
 * final was played.
 */
export function buildBiggestFinalMargins(editions: Edition[]): ChampionSummary[] {
  const margins: ChampionSummary[] = [];
  for (const edition of editions) {
    const final = cellValue(edition, /^final$/i);
    const margin = finalMargin(final);
    if (final === undefined || margin === undefined) continue;
    margins.push({ id: edition.year, displayName: final, titles: margin, years: [edition.year], names: [] });
  }
  return margins.sort(
    (a, b) => b.titles - a.titles || leadingYear(a.years[0]) - leadingYear(b.years[0]),
  );
}

/**
 * Build a year -> display-text map of top-scorer facts (player, team, goals),
 * for joining Golden Boot editions onto another competition's table by year
 * (e.g. the World Cup and EURO pages showing that edition's top scorer).
 * Team/goals are appended only when those columns are present.
 */
const GOALS_WORD: Record<Locale, string> = { en: 'goals', hr: 'golova' };

/**
 * `locale` only swaps the "goals" word in the generated detail text (e.g. for
 * a Croatian competition page's "Top scorer" column) - the player/team names
 * and goal count themselves are the same underlying data either way.
 */
export function buildTopScorerFacts(editions: Edition[], locale: Locale = 'en'): Map<string, string> {
  const facts = new Map<string, string>();
  for (const edition of editions) {
    const player = edition.winner.trim();
    if (!player) continue;
    const team = cellValue(edition, /^team$/i);
    const goals = cellValue(edition, /^goals$/i);
    const detail = [team, goals ? `${goals} ${GOALS_WORD[locale]}` : undefined]
      .filter(Boolean)
      .join(', ');
    facts.set(edition.year, detail ? `${player} (${detail})` : player);
  }
  return facts;
}

/**
 * Distinct winners for populating the filter control, alphabetically.
 *
 * Golden Boot's "Player(s)" column also holds "; "-separated ties for a
 * joint top scorer (e.g. 1962's six-way "Garrincha; Vavá; Leonel Sánchez;
 * Flórián Albert; Valentin Ivanov; Dražan Jerković") - each name is split
 * out as its own winner, the same way `editionTeams()` splits Golden Boot's
 * "; "-joined Team column, so a reader can filter by e.g. "Vavá" or "Oleg
 * Salenko" individually instead of only the whole compound string being
 * filterable (and a player tied once and outright another year, e.g.
 * Cristiano Ronaldo in EURO 2012/2020, isn't split into two unmatched
 * strings that each only surface one of their editions).
 */
export function distinctWinners(editions: Edition[]): string[] {
  const seen = new Set<string>();
  for (const edition of editions) {
    for (const rawValue of edition.winner.split(';')) {
      const winner = rawValue.trim();
      if (winner && !isPlaceholderWinner(winner)) seen.add(winner);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

// Host values that aren't an actual country - e.g. Copa América's 1975,
// 1979 and 1983 editions, played home-and-away with no single host, record
// "Home-and-away" in the host cell instead. Shared with quiz.ts's
// "Which country hosted...?" question builder (which needs the exact same
// exclusion so it never asks a reader to name the host of an edition with no
// host) so the two can't silently disagree on what counts as a real host.
export const NOT_A_HOST = /home-and-away|no host|not held/i;

/**
 * Distinct hosts for populating the filter control, alphabetically. Returns
 * an empty list when the source table has no host column (e.g. Ballon d'Or,
 * Golden Boot), so callers can hide the filter entirely rather than showing
 * an empty one. Excludes non-country host placeholders like Copa América's
 * "Home-and-away" (see NOT_A_HOST) - those rows are still reachable via the
 * Year filter, just not offered as a nonsensical "country" to filter by.
 */
export function distinctHosts(editions: Edition[]): string[] {
  const seen = new Set<string>();
  const hosts: string[] = [];
  for (const edition of editions) {
    const host = edition.host?.trim();
    if (host && !NOT_A_HOST.test(host) && !seen.has(host)) {
      seen.add(host);
      hosts.push(host);
    }
  }
  return hosts.sort((a, b) => a.localeCompare(b));
}

/**
 * Generate hosting totals from editions, in the same `ChampionSummary` shape
 * `buildChampionsSummary` returns (`titles` here means "times hosted",
 * `years` the editions hosted) so it can be rendered by the same
 * `ChampionsSummary.astro` component with different labels/copy, the same
 * way that component already relabels for the Golden Boot's "awards".
 *
 * Unlike `buildChampionsSummary`, this does **not** group West Germany under
 * Germany. That merge is a specific, documented editorial decision about
 * *title* totals only (see `src/lib/countries.ts` and the "How historical
 * nation names are handled" card on `/records`) - hosting is a plain
 * historical fact about a specific edition, not a sporting-successor
 * question, so West Germany (1974 World Cup, EURO 1988) and Germany (2006
 * World Cup, EURO 2024) are kept as the distinct hosts the source content
 * already records them as.
 *
 * A co-hosted edition's host cell (e.g. "Belgium and Netherlands", "Canada,
 * Mexico and United States") is counted as one atomic host value, matching
 * `distinctHosts()`/the host filter, which already treat that whole string
 * as a single option rather than splitting it into per-country entries -
 * this function does not invent a split the source content and the rest of
 * the site don't make.
 */
export function buildHostsSummary(editions: Edition[]): ChampionSummary[] {
  const groups = new Map<string, ChampionSummary>();

  for (const edition of editions) {
    const host = edition.host?.trim();
    if (!host || NOT_A_HOST.test(host)) continue;
    const existing = groups.get(host);
    if (existing) {
      existing.titles += 1;
      existing.years.push(edition.year);
    } else {
      groups.set(host, { id: host, displayName: host, titles: 1, years: [edition.year], names: [host] });
    }
  }

  return [...groups.values()]
    .map((summary) => ({
      ...summary,
      years: [...summary.years].sort((a, b) => leadingYear(a) - leadingYear(b)),
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

/**
 * Titles won on home soil - editions where the winner cell exactly matches
 * that same row's host cell - ranked by count, grouped the same way
 * `buildChampionsSummary()` groups title totals (West Germany counts as
 * Germany). The generated "home advantage" trivia (Uruguay's seven Copa
 * América titles won on home soil, 1930's inaugural World Cup won by host
 * Uruguay), computed purely from two columns every team-competition table
 * already loads, combined in a way no existing `/records` ranking does.
 *
 * A co-hosted edition's host cell is a single combined string (e.g. "Belgium
 * and Netherlands", "Canada, Mexico and United States") - this deliberately
 * requires an *exact* match against the winner cell, so a co-host that goes
 * on to win (a single-country name) never matches the multi-country host
 * string, the same "does not invent a split the source content doesn't make"
 * choice `buildHostsSummary()` already documents for the same host cells.
 * Spain's 2026 FIFA World Cup win, with the tournament co-hosted by Canada,
 * Mexico and United States, is real data that already exercises exactly this
 * case: Spain does not count as a "home soil" win.
 *
 * Individual awards (Ballon d'Or, Golden Boot) have no host column, so every
 * edition is naturally skipped rather than needing a separate competition
 * check - callers only need to render this for the four team competitions,
 * matching the "Nearly champions" precedent (`buildRunnerUpsWithoutTitle`).
 */
export function buildHomeSoilTitles(editions: Edition[]): ChampionSummary[] {
  const groups = new Map<string, ChampionSummary>();

  for (const edition of editions) {
    const host = edition.host?.trim();
    const winner = edition.winner.trim();
    if (!host || !winner || isPlaceholderWinner(winner) || host !== winner) continue;

    const group = summaryGroupFor(winner);
    const existing = groups.get(group.id);
    if (existing) {
      existing.titles += 1;
      existing.years.push(edition.year);
      if (!existing.names.includes(winner)) existing.names.push(winner);
    } else {
      groups.set(group.id, {
        id: group.id,
        displayName: group.displayName,
        titles: 1,
        years: [edition.year],
        names: [winner],
      });
    }
  }

  return [...groups.values()]
    .map((summary) => ({
      ...summary,
      years: [...summary.years].sort((a, b) => leadingYear(a) - leadingYear(b)),
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

/**
 * Every run of two or more *consecutive editions* (adjacent rows in the
 * source table, not adjacent calendar years - matters for the World Cup,
 * which skipped 1942/1946, and for Copa América's irregular early
 * calendar) won by the exact same winner value, reusing the
 * `ChampionSummary` shape so it can render through the same
 * `ChampionsSummary.astro` component every other ranking on `/records`
 * already uses (with `titles` standing in for streak length here).
 *
 * Deliberately uses the raw winner string, not `summaryGroupFor()` - a
 * "back-to-back" streak is a fact about the exact same team/player
 * repeating, not about sporting succession, so West Germany and Germany
 * (already kept distinct everywhere except title *totals*, see
 * `buildChampionsSummary`) cannot silently chain into one streak here
 * either. A placeholder winner (e.g. the 2020 Ballon d'Or's "Not awarded")
 * breaks any streak spanning it - Messi's 2019 and 2021 Ballon d'Or wins
 * are not "back-to-back" with a cancelled year between them, even though
 * they're adjacent table rows.
 *
 * A competition/award with no repeat winner in a row (true of UEFA Nations
 * League and the EURO Golden Boot as of 2026) simply returns an empty
 * array - callers should handle that case in their own copy rather than
 * treating an empty list as a bug.
 */
export function buildLongestStreaks(editions: Edition[]): ChampionSummary[] {
  const sorted = [...editions].sort((a, b) => a.yearSort - b.yearSort);
  const runs: { winner: string; years: string[] }[] = [];
  let current: { winner: string; years: string[] } | null = null;

  for (const edition of sorted) {
    const winner = edition.winner.trim();
    if (!winner || isPlaceholderWinner(winner)) {
      current = null;
      continue;
    }
    if (current && current.winner === winner) {
      current.years.push(edition.year);
    } else {
      current = { winner, years: [edition.year] };
      runs.push(current);
    }
  }

  return runs
    .filter((run) => run.years.length > 1)
    .map((run) => ({
      id: `${run.winner}-${run.years[0]}`,
      displayName: run.winner,
      titles: run.years.length,
      years: run.years,
      names: [run.winner],
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

// Same exact-match convention as compare.ts's own RUNNER_UP_COLUMN - kept as
// a separate local constant rather than a shared import, since editions.ts
// has no existing dependency on compare.ts and this is the only place here
// that needs the runner-up column specifically (buildTimeline's own
// cellValue lookup uses a looser /runner-up|finalist/i pattern because it
// only needs *a* result, relying on column order to land on Runner-up first
// - too fragile for a ranking that must never conflate Runner-up with a
// Third/Fourth-place finish).
const RUNNER_UP_COLUMN = /^runner-up$/i;

/**
 * Countries that have reached a final - a "Runner-up" cell in one of the
 * four team-competition tables - at least once, but have never won that
 * competition outright, ranked by runner-up count. The generated Golden
 * Boot/Ballon d'Or equivalent of "best team never to win it" trivia (e.g.
 * the Netherlands' three lost World Cup finals), except computed, not
 * hand-picked, from data every competition page already loads and has
 * already been independently double-checked.
 *
 * Grouped the same way `buildChampionsSummary()` groups title totals (e.g.
 * West Germany counts as Germany), so a team already excluded here for
 * having *ever* won under either name is not double-counted as "title-less"
 * under the other. Excludes Czechoslovakia/Czech Republic from merging with
 * each other for the same reason `buildChampionsSummary()` does: no
 * explicit editorial rule groups them, so each is judged on its own record.
 *
 * A team that lost a final before eventually winning the competition (e.g.
 * a country that lost in 1990 and won in 1994) is excluded entirely, not
 * given partial credit for its earlier runner-up finishes - this ranking
 * answers "has this team ever won", using the full dataset, not "how did
 * this team's record look at some earlier point in time".
 */
export function buildRunnerUpsWithoutTitle(editions: Edition[]): ChampionSummary[] {
  const titledGroupIds = new Set(buildChampionsSummary(editions).map((champion) => champion.id));
  const groups = new Map<string, ChampionSummary>();

  for (const edition of editions) {
    const runnerUp = cellValue(edition, RUNNER_UP_COLUMN);
    if (!runnerUp || runnerUp === '—' || isPlaceholderWinner(runnerUp)) continue;
    const group = summaryGroupFor(runnerUp);
    if (titledGroupIds.has(group.id)) continue;

    const existing = groups.get(group.id);
    if (existing) {
      existing.titles += 1;
      existing.years.push(edition.year);
      if (!existing.names.includes(runnerUp)) existing.names.push(runnerUp);
    } else {
      groups.set(group.id, {
        id: group.id,
        displayName: group.displayName,
        titles: 1,
        years: [edition.year],
        names: [runnerUp],
      });
    }
  }

  return [...groups.values()]
    .map((summary) => ({
      ...summary,
      years: [...summary.years].sort((a, b) => leadingYear(a) - leadingYear(b)),
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

// Same convention as compare.ts's own SEMIFINAL_COLUMN (kept as a separate
// local constant for the same reason RUNNER_UP_COLUMN above is): World Cup's
// "Third"/"Fourth / other semifinalist", EURO's "Other semifinalist"/"Other
// semifinalist / fourth", Nations League's "Third"/"Fourth", and Copa
// América's "Third"/"Fourth" (knockout-final era only - earlier editions have
// no such column, or a "—" placeholder in it, both handled below).
const SEMIFINAL_COLUMN = /third|fourth|semifinalist/i;

/**
 * The "Nearly champions" ranking's one-tier-down sibling: teams that have
 * reached a semifinal - a "Third", "Fourth", or "Other semifinalist" finish -
 * at least once, but have never actually reached a final (no title, no
 * runner-up finish either), ranked by semifinal-finish count. A team is
 * dropped from this list the moment it reaches *any* final, whether it goes
 * on to win it or not - matching `buildRunnerUpsWithoutTitle`'s own "no
 * partial credit once the higher bar is cleared" rule, one level up.
 *
 * Grouped the same way `buildChampionsSummary()` groups title totals (e.g.
 * West Germany counts as Germany). A row can name two different teams in its
 * Third and Fourth columns at once (World Cup, Nations League); both are
 * counted as separate semifinal appearances for their own team, never
 * conflated with each other.
 */
export function buildNearlyFinalists(editions: Edition[]): ChampionSummary[] {
  const finalistGroupIds = new Set<string>();
  for (const edition of editions) {
    const winner = edition.winner.trim();
    if (winner && !isPlaceholderWinner(winner)) {
      finalistGroupIds.add(summaryGroupFor(winner).id);
    }
    const runnerUp = cellValue(edition, RUNNER_UP_COLUMN);
    if (runnerUp && runnerUp !== '—' && !isPlaceholderWinner(runnerUp)) {
      finalistGroupIds.add(summaryGroupFor(runnerUp).id);
    }
  }

  const groups = new Map<string, ChampionSummary>();
  for (const edition of editions) {
    const semifinalCells = edition.cells.filter((c) => SEMIFINAL_COLUMN.test(c.label.trim()));
    for (const cell of semifinalCells) {
      const value = cell.value.trim();
      if (!value || value === '—' || isPlaceholderWinner(value)) continue;
      const group = summaryGroupFor(value);
      if (finalistGroupIds.has(group.id)) continue;

      const existing = groups.get(group.id);
      if (existing) {
        existing.titles += 1;
        existing.years.push(edition.year);
        if (!existing.names.includes(value)) existing.names.push(value);
      } else {
        groups.set(group.id, {
          id: group.id,
          displayName: group.displayName,
          titles: 1,
          years: [edition.year],
          names: [value],
        });
      }
    }
  }

  return [...groups.values()]
    .map((summary) => ({
      ...summary,
      years: [...summary.years].sort((a, b) => leadingYear(a) - leadingYear(b)),
    }))
    .sort(
      (a, b) =>
        b.titles - a.titles ||
        leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
        a.displayName.localeCompare(b.displayName),
    );
}

/**
 * For every team/player with two or more titles, the longest calendar-year
 * gap between any two of their *chronologically consecutive* title wins -
 * the generated "longest wait for another title" trivia (Italy's 44 years
 * between its 1938 and 1982 FIFA World Cup wins). Reuses
 * `buildChampionsSummary()`'s own grouping (West Germany counts as Germany,
 * same as every other title-totals ranking) so this never disagrees with
 * "Most successful teams" about who has won what.
 *
 * Deliberately the opposite question from `buildLongestStreaks()`: that
 * function finds the *shortest* possible gap (adjacent editions, the same
 * winner twice in a row); this one finds the *longest* gap in a title
 * holder's own record, measured in calendar years between the two bounding
 * editions' years (not table-row adjacency, since the years being compared
 * are rarely adjacent rows once every other winner in between is accounted
 * for). A team whose only two titles happen to be back-to-back still gets
 * an entry here too (a small gap, e.g. 4 years) - the two rankings answer
 * different questions and are not mutually exclusive.
 *
 * Reuses the `ChampionSummary` shape with `titles` repurposed to mean "years
 * between" and `years` narrowed to just the two editions bounding the
 * longest gap (not every title year), so it renders through the same
 * `ChampionsSummary.astro` component as every other `/records` ranking,
 * with `winningYearsLabel` overridden to describe the two bounding years. A
 * team with only one title, or the vanishingly unlikely case where every
 * gap works out to zero, is excluded rather than shown with a meaningless
 * zero-year gap.
 */
export function buildLongestTitleGaps(editions: Edition[]): ChampionSummary[] {
  const gaps: ChampionSummary[] = [];

  for (const champion of buildChampionsSummary(editions)) {
    if (champion.titles < 2) continue;

    let widestGap = 0;
    let gapStart = champion.years[0];
    let gapEnd = champion.years[1];
    for (let i = 1; i < champion.years.length; i++) {
      const gap = leadingYear(champion.years[i]) - leadingYear(champion.years[i - 1]);
      if (gap > widestGap) {
        widestGap = gap;
        gapStart = champion.years[i - 1];
        gapEnd = champion.years[i];
      }
    }
    if (widestGap <= 0) continue;

    gaps.push({
      id: champion.id,
      displayName: champion.displayName,
      titles: widestGap,
      years: [gapStart, gapEnd],
      names: champion.names,
    });
  }

  return gaps.sort(
    (a, b) =>
      b.titles - a.titles ||
      leadingYear(a.years[0]) - leadingYear(b.years[0]) ||
      a.displayName.localeCompare(b.displayName),
  );
}

/**
 * Column labels that hold a team/national-team name rather than a count, a
 * date or a score line - covers every team-competition editions table
 * (Winner/Champion, Runner-up, Third, Fourth or "Other semifinalist" in its
 * various header spellings) plus the individual awards' "National team"/
 * "Team" columns. `/finalist/i` alone matches both "Other semifinalist" and
 * "Other semifinalist / fourth" since "semifinalist" contains "finalist".
 */
const WINNER_LABEL_PATTERN = /^(winner|champion)$/i;
const DEDICATED_TEAM_LABEL_PATTERN = /^(national team|team)$/i;
const OTHER_TEAM_LABEL_PATTERNS: RegExp[] = [/runner-up/i, /finalist/i, /^third$/i, /^fourth/i];

function isTeamCellLabel(label: string): boolean {
  const trimmed = label.trim();
  return (
    WINNER_LABEL_PATTERN.test(trimmed) ||
    DEDICATED_TEAM_LABEL_PATTERN.test(trimmed) ||
    OTHER_TEAM_LABEL_PATTERNS.some((re) => re.test(trimmed))
  );
}

// Golden Boot's "Team" column uses "Multiple" as a placeholder when a tie has
// too many scorers to name one team (e.g. 1962's six-way tie) - not a real
// team name, so it must not become a filterable option (see the "; "-split
// case below for the two-or-three-way ties that *do* name real teams).
const TEAM_TIE_PLACEHOLDER = /^multiple$/i;

/**
 * Every team name appearing in a team-holding column of this edition - not
 * just the champion. Powers the "Team" filter (required alongside year, host
 * and winner by docs/WEBSITE_REQUIREMENTS.md) so, e.g., searching "Portugal"
 * on the World Cup page surfaces 1966 (fourth place) even though Portugal
 * has never won it.
 *
 * "Winner"/"Champion" is a team name on every team-competition table (World
 * Cup, EURO, Copa América, Nations League) but a *player* name on the
 * individual-award tables (Ballon d'Or, Golden Boot) - those tables carry a
 * separate "National team"/"Team" column instead, so its presence on the same
 * row is the signal to skip "Winner"/"Champion" here rather than double-count
 * the player as if they were a team.
 *
 * Golden Boot's "Team" column also holds "; "-separated ties for a joint top
 * scorer from different countries (e.g. 1994's "Bulgaria; Russia") - each
 * name is split out as its own team so, e.g., filtering by "Russia" surfaces
 * that edition instead of only the unsplit compound string being filterable.
 */
export function editionTeams(edition: Edition): string[] {
  const hasDedicatedTeamColumn = edition.cells.some((cell) =>
    DEDICATED_TEAM_LABEL_PATTERN.test(cell.label.trim()),
  );
  const teams = new Set<string>();
  for (const cell of edition.cells) {
    const label = cell.label.trim();
    if (hasDedicatedTeamColumn && WINNER_LABEL_PATTERN.test(label)) continue;
    if (!isTeamCellLabel(label)) continue;
    for (const rawValue of cell.value.split(';')) {
      const value = rawValue.trim();
      if (value && value !== '—' && !isPlaceholderWinner(value) && !TEAM_TIE_PLACEHOLDER.test(value)) {
        teams.add(value);
      }
    }
  }
  return [...teams];
}

/** Distinct teams across all editions, alphabetically, for the team filter's options. */
export function distinctTeams(editions: Edition[]): string[] {
  const seen = new Set<string>();
  for (const edition of editions) {
    for (const team of editionTeams(edition)) seen.add(team);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}
