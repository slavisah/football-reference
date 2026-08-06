// Single source of truth for the site's top-level pages: the primary nav
// (Nav.astro) and the offline precache list (sw.js.ts) both read this so a
// new page can't be linked from one and silently missing from the other.
// Every path here has a Croatian translation in TRANSLATED_PATHS
// (src/lib/i18n.ts) - `labelHr` is this same nav item's short Croatian label,
// reusing the exact display names already established elsewhere on the
// Croatian site (src/lib/homeCards.ts's CARD_TEXT for the six competitions/
// awards, each hr page's own heading for the rest) rather than inventing new
// wording, the same way English `label` is a short nav form of each page's
// own full title (e.g. "World Cup" nav label for the "FIFA World Cup" page).

export type NavLink = {
  path: string;
  label: string;
  labelHr: string;
};

export const NAV_LINKS: NavLink[] = [
  { path: '/', label: 'Home', labelHr: 'Početna' },
  { path: '/competitions/world-cup', label: 'World Cup', labelHr: 'Svjetsko prvenstvo' },
  { path: '/competitions/euro', label: 'EURO', labelHr: 'EURO' },
  { path: '/competitions/nations-league', label: 'Nations League', labelHr: 'Liga nacija' },
  { path: '/competitions/copa-america', label: 'Copa América', labelHr: 'Copa América' },
  { path: '/competitions/ballon-dor', label: "Ballon d'Or", labelHr: 'Zlatna lopta' },
  { path: '/competitions/golden-boot', label: 'Golden Boot', labelHr: 'Zlatna kopačka' },
  { path: '/records', label: 'Records', labelHr: 'Rekordi' },
  { path: '/compare', label: 'Compare', labelHr: 'Usporedba' },
  { path: '/quiz', label: 'Quiz', labelHr: 'Kviz' },
  { path: '/about/sources', label: 'Sources', labelHr: 'Izvori' },
];
