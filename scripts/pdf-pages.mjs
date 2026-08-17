// Single source of truth for which competition pages get a downloadable PDF,
// their page path, and which file(s) each page's rendered content is sourced
// from (World Cup and EURO also join in a per-year "Top scorer" column from
// Golden Boot, so a Golden Boot edit can make those two PDFs stale too, not
// just golden-boot.pdf itself). Paths are relative to the repo root.
//
// docs/PROJECT_STATUS.md ("Automated PDF-freshness check", 2026-08-06) added
// scripts/generate-pdfs.mjs and scripts/check-pdf-freshness.mjs with this
// exact same list duplicated by hand in both files, and flagged the drift
// risk explicitly: if a future page is added to only one of the two lists,
// the freshness check could silently pass or fail incorrectly. This module
// removes that risk by giving both scripts one shared list to import.
//
// Every page's own "References & review" section is rendered from
// docs/SOURCES.md (src/lib/competition.ts's loadCompetition() reads it for
// every competition), so it's a dependency of every PDF, not just the
// content/*.md edition table - a source-link fix or addition there changes
// what a downloaded PDF shows just as much as an edited table would, and
// previously wasn't tracked here at all (found while fixing a source-link
// extraction bug, 2026-08-10).
//
// `sources` also lists the rendering code each PDF depends on - the
// src/lib/*.ts helpers that turn a content/*.md table into what the page
// shows, and the src/components/*.astro (or src/pages/**.astro) files that
// lay it out - not just the editorial content files above. Content-only
// hashing had a real, confirmed blind spot: docs/PROJECT_STATUS.md's
// "Bug fix: Golden Boot joint-winner ties fragmenting/undercounting champions
// summary" (7bddb53) was a bug in src/lib/editions.ts's rendering logic, not
// in any content/*.md file, so `pnpm check:pdfs` had nothing to compare and
// silently kept calling the already-wrong committed golden-boot.pdf/
// golden-boot-hr.pdf "up to date" until an unrelated content-triggered
// regeneration happened to also pick up the fix (docs/PROJECT_STATUS.md,
// 2026-08-17 entry, "Left for a future pass"). These lists close that gap.
const SOURCES_MD = 'docs/SOURCES.md';

// Shared by every page: turns a content/*.md table into the CompetitionData
// (or PageMeta) each page renders. src/lib/competition.ts pulls in each of
// these itself; listed individually (rather than just competition.ts) so a
// change to any one of them - not only its caller - marks PDFs stale.
const COMPETITION_LIB = [
  'src/lib/competition.ts',
  'src/lib/editions.ts',
  'src/lib/markdownTable.ts',
  'src/lib/notes.ts',
  'src/lib/sources.ts',
  'src/lib/validate.ts',
];

// English competition pages other than Golden Boot compose these through the
// shared src/components/CompetitionView.astro; Golden Boot and every /hr/
// page assemble the same four leaf components by hand instead (see each
// page's own note on why) but render identically for this purpose.
const TABLE_COMPONENTS = [
  'src/components/TournamentTable.astro',
  'src/components/ChampionsSummary.astro',
  'src/components/EditorialNotes.astro',
  'src/components/References.astro',
];

// /records and /hr/records skip the per-edition TournamentTable/EditorialNotes
// entirely in favor of the aggregate ChampionsTimeline view.
const TIMELINE_COMPONENTS = [
  'src/components/ChampionsTimeline.astro',
  'src/components/ChampionsSummary.astro',
  'src/components/References.astro',
];

export const PDF_PAGES = [
  {
    slug: 'world-cup',
    path: '/competitions/world-cup',
    sources: [
      'content/fifa-world-cup.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/components/CompetitionView.astro',
      ...TABLE_COMPONENTS,
      'src/pages/competitions/world-cup.astro',
    ],
  },
  {
    slug: 'euro',
    path: '/competitions/euro',
    sources: [
      'content/uefa-euro.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/components/CompetitionView.astro',
      ...TABLE_COMPONENTS,
      'src/pages/competitions/euro.astro',
    ],
  },
  {
    slug: 'nations-league',
    path: '/competitions/nations-league',
    sources: [
      'content/uefa-nations-league.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/components/CompetitionView.astro',
      ...TABLE_COMPONENTS,
      'src/pages/competitions/nations-league.astro',
    ],
  },
  {
    slug: 'copa-america',
    path: '/competitions/copa-america',
    sources: [
      'content/copa-america.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/components/CompetitionView.astro',
      ...TABLE_COMPONENTS,
      'src/pages/competitions/copa-america.astro',
    ],
  },
  {
    slug: 'ballon-dor',
    path: '/competitions/ballon-dor',
    sources: [
      'content/ballon-dor.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/components/CompetitionView.astro',
      ...TABLE_COMPONENTS,
      'src/pages/competitions/ballon-dor.astro',
    ],
  },
  {
    slug: 'golden-boot',
    path: '/competitions/golden-boot',
    sources: [
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/competitions/golden-boot.astro',
    ],
  },
  // /records draws on all six competition/award tables (see
  // src/pages/records.astro's seven loadCompetition() calls - Golden Boot is
  // loaded twice, once per competition's top-scorer table) plus SOURCES_MD
  // for its own References section, so any one of them can make this PDF
  // stale, not just a single content file the way each competition's own
  // PDF works.
  {
    slug: 'records',
    path: '/records',
    sources: [
      'content/fifa-world-cup.md',
      'content/uefa-euro.md',
      'content/copa-america.md',
      'content/uefa-nations-league.md',
      'content/ballon-dor.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TIMELINE_COMPONENTS,
      'src/pages/records.astro',
    ],
  },
  // Croatian counterparts of the six pages above. Same underlying editorial
  // source files (content/ stays English-only, per AGENTS.md - only each
  // /hr/ page's own chrome is translated), but a distinct `/hr/...` page
  // path so the rendered PDF actually carries the Croatian labels/headers
  // that page shows, not just an English PDF wearing a Croatian button
  // label (docs/PROJECT_STATUS.md, "Bug fix: Croatian PDF downloads served
  // English content"). Each /hr/ page assembles TournamentTable/
  // ChampionsSummary/EditorialNotes/References by hand rather than through
  // the English-only CompetitionView, so its own page file (not
  // CompetitionView.astro) is the slug-specific dependency here.
  {
    slug: 'world-cup-hr',
    path: '/hr/competitions/world-cup',
    sources: [
      'content/fifa-world-cup.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/hr/competitions/world-cup.astro',
    ],
  },
  {
    slug: 'euro-hr',
    path: '/hr/competitions/euro',
    sources: [
      'content/uefa-euro.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/hr/competitions/euro.astro',
    ],
  },
  {
    slug: 'nations-league-hr',
    path: '/hr/competitions/nations-league',
    sources: [
      'content/uefa-nations-league.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/hr/competitions/nations-league.astro',
    ],
  },
  {
    slug: 'copa-america-hr',
    path: '/hr/competitions/copa-america',
    sources: [
      'content/copa-america.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/hr/competitions/copa-america.astro',
    ],
  },
  {
    slug: 'ballon-dor-hr',
    path: '/hr/competitions/ballon-dor',
    sources: [
      'content/ballon-dor.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/hr/competitions/ballon-dor.astro',
    ],
  },
  {
    slug: 'golden-boot-hr',
    path: '/hr/competitions/golden-boot',
    sources: [
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TABLE_COMPONENTS,
      'src/pages/hr/competitions/golden-boot.astro',
    ],
  },
  {
    slug: 'records-hr',
    path: '/hr/records',
    sources: [
      'content/fifa-world-cup.md',
      'content/uefa-euro.md',
      'content/copa-america.md',
      'content/uefa-nations-league.md',
      'content/ballon-dor.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      ...TIMELINE_COMPONENTS,
      'src/pages/hr/records.astro',
    ],
  },
];
