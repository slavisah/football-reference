import { distinctWinners, isPlaceholderWinner } from './editions';
import type { Edition } from './types';

// Builds a full player "profile" page: every Ballon d'Or and Golden Boot
// (FIFA World Cup + UEFA EURO) award a given player has won, across the
// three individual-award tables content/ballon-dor.md and content/golden-boot.md
// already carry. /teams/<slug> does the same aggregation for national teams
// across the four team competitions; this is the individual-award equivalent
// content/teams.md itself flags as out of scope for that page ("Individual
// awards ... are not included here since they recognize players, not
// national teams").

export type PlayerAppearance = {
  year: string;
  yearSort: number;
  /** Human-readable facts for this award (team, goals, ceremony date), already joined - empty when the source table has none of those columns. */
  detail: string;
};

export type PlayerProfileAward = {
  title: string;
  slug: string;
  /** Chronological, oldest first. */
  appearances: PlayerAppearance[];
};

export type PlayerProfile = {
  id: string;
  displayName: string;
  /** Only awards this player has actually won at least once. */
  awards: PlayerProfileAward[];
  totalAwards: number;
};

/** Find a cell's value by matching its column label, e.g. "Ceremony date". */
function cellValue(edition: Edition, matcher: RegExp): string | undefined {
  const cell = edition.cells.find((c) => matcher.test(c.label.trim()));
  return cell?.value.trim() || undefined;
}

// Golden Boot's Team column uses "Multiple" as a placeholder when a tie has
// too many scorers to name one team each (e.g. 1962's six-way tie) - not a
// real team name, so it must not be shown as if it were this player's team.
// Exported for editionProfile.ts's own tied-scorer splitting, which needs
// the exact same guard.
export const TEAM_TIE_PLACEHOLDER = /^multiple$/i;

/**
 * This player's team for one edition, aligning a "; "-joined Team cell with
 * the same-index name in a "; "-joined Player(s)/Winner cell (e.g. 1994's
 * "Hristo Stoichkov; Oleg Salenko" / "Bulgaria; Russia" - Salenko's team is
 * the *second* name, not the whole joined string). Falls back to the whole
 * cell only when it isn't itself a joined list (a single-winner row), and
 * omits it entirely when the counts disagree (e.g. the "Multiple" placeholder
 * paired with six tied names) rather than guessing.
 */
function teamFor(edition: Edition, playerIndex: number, winnerCount: number): string | undefined {
  const teamCell = cellValue(edition, /^(national team|team)$/i);
  if (!teamCell || TEAM_TIE_PLACEHOLDER.test(teamCell)) return undefined;
  const teams = teamCell.split(';').map((t) => t.trim());
  if (teams.length === winnerCount) return teams[playerIndex];
  if (winnerCount === 1) return teamCell;
  return undefined;
}

/**
 * Options carried through the profile builders. `goalsLabel` is the unit word
 * appended to a Golden Boot row's goal count ("8 goals"); it defaults to
 * English "goals" so every existing caller is unchanged, and the Croatian
 * pages pass their own ("golova") - the team name and ceremony-date strings
 * are source-derived data and are deliberately left untranslated, matching the
 * same "only UI chrome is translated, not the underlying facts" precedent the
 * Croatian /teams pages set.
 */
export type PlayerProfileOptions = { goalsLabel?: string };

function appearancesFor(
  playerName: string,
  editions: Edition[],
  goalsLabel: string,
): PlayerAppearance[] {
  const appearances: PlayerAppearance[] = [];

  for (const edition of editions) {
    const winners = edition.winner.split(';').map((w) => w.trim());
    const index = winners.findIndex((w) => w === playerName);
    if (index === -1) continue;

    const team = teamFor(edition, index, winners.length);
    const goals = cellValue(edition, /^goals$/i);
    const ceremonyDate = cellValue(edition, /^ceremony date$/i);
    const detail = [team, goals ? `${goals} ${goalsLabel}` : undefined, ceremonyDate]
      .filter(Boolean)
      .join(' · ');

    appearances.push({ year: edition.year, yearSort: edition.yearSort, detail });
  }

  return appearances.sort((a, b) => a.yearSort - b.yearSort);
}

export type PlayerAwardSource = { title: string; slug: string; editions: Edition[] };

/** Build one player's full profile from every individual-award table they might appear in. */
export function buildPlayerProfile(
  playerName: string,
  sources: PlayerAwardSource[],
  options: PlayerProfileOptions = {},
): PlayerProfile {
  const { goalsLabel = 'goals' } = options;
  const awards = sources
    .map((source) => ({
      title: source.title,
      slug: source.slug,
      appearances: appearancesFor(playerName, source.editions, goalsLabel),
    }))
    .filter((award) => award.appearances.length > 0);

  return {
    id: playerName,
    displayName: playerName,
    awards,
    totalAwards: awards.reduce((sum, award) => sum + award.appearances.length, 0),
  };
}

/** Every distinct player who has won at least one of the given awards, alphabetically. */
export function distinctPlayers(sources: PlayerAwardSource[]): string[] {
  const seen = new Set<string>();
  for (const source of sources) {
    for (const name of distinctWinners(source.editions)) seen.add(name);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** Build every player's profile from the given award sources, alphabetically by display name. */
export function buildAllPlayerProfiles(
  sources: PlayerAwardSource[],
  options: PlayerProfileOptions = {},
): PlayerProfile[] {
  return distinctPlayers(sources)
    .filter((name) => !isPlaceholderWinner(name))
    .map((name) => buildPlayerProfile(name, sources, options))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * URL-safe slug for a player's profile page path (`/players/<slug>`), the
 * same ASCII-folding convention `teamProfileSlug()` uses for `/teams/<slug>`
 * - a path segment reads better, and avoids a new class of encoding bugs, as
 * plain ASCII than a name with diacritics (e.g. "Flórián Albert", "Dražan
 * Jerković").
 */
export function playerProfileSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
