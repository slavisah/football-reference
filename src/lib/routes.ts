// Single source of truth for the site's top-level pages: the primary nav
// (Nav.astro) and the offline precache list (sw.js.ts) both read this so a
// new page can't be linked from one and silently missing from the other.

export type NavLink = {
  path: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { path: '/', label: 'Home' },
  { path: '/competitions/world-cup', label: 'World Cup' },
  { path: '/competitions/euro', label: 'EURO' },
  { path: '/competitions/nations-league', label: 'Nations League' },
  { path: '/competitions/copa-america', label: 'Copa América' },
  { path: '/competitions/ballon-dor', label: "Ballon d'Or" },
  { path: '/competitions/golden-boot', label: 'Golden Boot' },
  { path: '/records', label: 'Records' },
  { path: '/compare', label: 'Compare' },
  { path: '/quiz', label: 'Quiz' },
  { path: '/about/sources', label: 'Sources' },
];
