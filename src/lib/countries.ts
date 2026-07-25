// Country identity for the GENERATED champions summary only.
//
// The edition tables always show the historical name used at the time
// (West Germany, Soviet Union, ...). For title *counts*, some sporting bodies
// conventionally group a nation with its predecessor. We keep that grouping
// tiny and explicit so we never silently rewrite history: only the
// West Germany / Germany continuity is merged, which is the single case the
// editorial content itself groups. Every other name counts as itself.

type Group = { id: string; displayName: string };

const SUCCESSOR_GROUPS: Record<string, Group> = {
  'west germany': { id: 'germany', displayName: 'Germany (incl. West Germany)' },
  germany: { id: 'germany', displayName: 'Germany (incl. West Germany)' },
};

/** Resolve a historical winner name to its champions-summary group. */
export function summaryGroupFor(name: string): Group {
  const key = name.trim().toLowerCase();
  return SUCCESSOR_GROUPS[key] ?? { id: key, displayName: name.trim() };
}
