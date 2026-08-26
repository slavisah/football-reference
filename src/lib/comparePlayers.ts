import type { PlayerProfile } from './playerProfile';

// Builds a "compare two players" record from the same PlayerProfile[]
// /players already computes (buildAllPlayerProfiles in playerProfile.ts) - no
// new editorial content. This is the individual-award equivalent of
// src/lib/compare.ts's "compare two national teams" records: /compare
// explicitly excludes Ballon d'Or and Golden Boot ("they recognize players,
// not national teams"), so this page is where that comparison lives instead.

type ComparePlayerAward = {
  title: string;
  slug: string;
  count: number;
  /** Years this player won this award, oldest first. */
  years: { year: string; yearSort: number }[];
};

export type ComparePlayerRecord = {
  id: string;
  displayName: string;
  /** One entry per award definition, in the given order, even when the count is 0 - so both sides of a head-to-head panel always render the same rows. */
  awards: ComparePlayerAward[];
  totalAwards: number;
};

export type ComparePlayerAwardDef = { title: string; slug: string };

/** Build one player's comparison record, with a 0-count row for every award they haven't won. */
export function buildComparePlayerRecord(
  profile: PlayerProfile,
  awardDefs: ComparePlayerAwardDef[],
): ComparePlayerRecord {
  const awards = awardDefs.map((def) => {
    const won = profile.awards.find((a) => a.title === def.title);
    return {
      title: def.title,
      slug: def.slug,
      count: won?.appearances.length ?? 0,
      years: (won?.appearances ?? []).map((a) => ({ year: a.year, yearSort: a.yearSort })),
    };
  });
  return {
    id: profile.id,
    displayName: profile.displayName,
    awards,
    totalAwards: profile.totalAwards,
  };
}

/**
 * Every player's comparison record, ranked by total awards then name - both
 * the data set the head-to-head picker chooses two rows from, and a
 * standalone "All players" reference table, matching
 * buildAllCountryRecords()'s dual role on /compare.
 */
export function buildAllComparePlayerRecords(
  profiles: PlayerProfile[],
  awardDefs: ComparePlayerAwardDef[],
): ComparePlayerRecord[] {
  return profiles
    .map((profile) => buildComparePlayerRecord(profile, awardDefs))
    .sort((a, b) => b.totalAwards - a.totalAwards || a.displayName.localeCompare(b.displayName));
}

export type SharedAwardYear = {
  year: string;
  yearSort: number;
  /** Award title(s) player A won in this year. */
  aAwards: string[];
  /** Award title(s) player B won in this year. */
  bAwards: string[];
};

/**
 * Every year both selected players won at least one award (not necessarily
 * the same one) - e.g. one won the Ballon d'Or while the other won a Golden
 * Boot in the same year. The individual-award equivalent of /compare's
 * "Finals meetings" panel: there's no head-to-head match between two
 * players, so this surfaces the closest analogous fact instead.
 */
export function buildSharedAwardYears(a: ComparePlayerRecord, b: ComparePlayerRecord): SharedAwardYear[] {
  const yearsFor = (record: ComparePlayerRecord) => {
    const map = new Map<string, { yearSort: number; titles: string[] }>();
    for (const award of record.awards) {
      for (const { year, yearSort } of award.years) {
        const entry = map.get(year) ?? { yearSort, titles: [] };
        entry.titles.push(award.title);
        map.set(year, entry);
      }
    }
    return map;
  };

  const aYears = yearsFor(a);
  const bYears = yearsFor(b);
  const shared: SharedAwardYear[] = [];
  for (const [year, aEntry] of aYears) {
    const bEntry = bYears.get(year);
    if (!bEntry) continue;
    shared.push({ year, yearSort: aEntry.yearSort, aAwards: aEntry.titles, bAwards: bEntry.titles });
  }
  return shared.sort((x, y) => x.yearSort - y.yearSort);
}
