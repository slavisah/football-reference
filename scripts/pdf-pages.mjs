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
  'src/components/SectionJumpNav.astro',
  'src/components/References.astro',
];

// /records and /hr/records skip the per-edition TournamentTable/EditorialNotes
// entirely in favor of the aggregate ChampionsTimeline view, but render their
// own SectionJumpNav.astro directly (the same "Jump to a section" component
// EditorialNotes.astro uses, one pill per top-level ranking section instead
// of one per note card).
const TIMELINE_COMPONENTS = [
  'src/components/ChampionsTimeline.astro',
  'src/components/ChampionsSummary.astro',
  'src/components/SectionJumpNav.astro',
  'src/components/References.astro',
];

// Rendered into the actual PDF (generate-pdfs.mjs prints the live page under
// print media, podium cards included, not a separate PDF-only layout) but
// only opted into by the three team competitions with a genuine top-four
// finish in their table (World Cup, Nations League, Copa América - not
// EURO, see buildPodiums()'s own doc comment in src/lib/editions.ts), so
// it's listed per-entry below rather than folded into the universal
// TABLE_COMPONENTS.
const PODIUM_COMPONENT = 'src/components/PodiumCards.astro';

// Rendered into the actual PDF like PODIUM_COMPONENT above. Opted into by
// every team competition with a host column and at least one real,
// mappable host (World Cup, EURO, UEFA Nations League, Copa América - not
// the two individual awards, which have no host column at all) - see
// HostMap.astro's own doc comment. Listed per-entry rather than folded into
// TABLE_COMPONENTS for the same reason PODIUM_COMPONENT is.
const HOST_MAP_COMPONENT = 'src/components/HostMap.astro';
const HOST_MAP_DATA = 'src/lib/hostCoordinates.ts';

// /compare and /compare-players render their own custom "versus" layout by
// hand (not TournamentTable/ChampionsSummary/EditorialNotes - see
// docs/PROJECT_STATUS.md's 2026-08-22 "versus table" entry), so only
// References.astro from the shared component set actually applies to them.
const REFERENCES_COMPONENT = 'src/components/References.astro';

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
      PODIUM_COMPONENT,
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      PODIUM_COMPONENT,
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      PODIUM_COMPONENT,
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
  // PDF works. Also depends on src/lib/compare.ts (buildFinalsMeetings/
  // buildRivalries, behind the "Fiercest rivalries" section added
  // 2026-08-20) and src/lib/teamProfile.ts (teamProfileSlug, for that
  // section's per-team links) - found missing from this list entirely on a
  // fresh audit shortly after that section shipped, exactly the
  // content-only-hashing blind spot this file's own header comment already
  // warns about for rendering code in general.
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
      'src/lib/compare.ts',
      'src/lib/teamProfile.ts',
      'src/pages/records.astro',
    ],
  },
  // /compare's default-rendered pair (the two most-titled teams - see
  // src/pages/compare.astro's own "before any JS runs" comment) is exactly
  // what a printed page shows, the same progressive-enhancement precedent
  // every other PDF here already relies on (a reader who never runs JS still
  // gets a meaningful page). src/lib/teamCompetitions.ts is the shared loader
  // /compare and /team-index.json.ts both call; src/lib/compare.ts is the
  // ranking/head-to-head/finals-meetings logic itself.
  {
    slug: 'compare',
    path: '/compare',
    sources: [
      'content/fifa-world-cup.md',
      'content/uefa-euro.md',
      'content/copa-america.md',
      'content/uefa-nations-league.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/lib/teamCompetitions.ts',
      'src/lib/compare.ts',
      'src/lib/teamProfile.ts',
      REFERENCES_COMPONENT,
      'src/pages/compare.astro',
    ],
  },
  // Same precedent as /compare above, for the individual-award head-to-head
  // page. src/lib/comparePlayers.ts is the ranking/shared-award-years logic;
  // src/lib/playerProfile.ts builds the per-player profiles it ranks.
  {
    slug: 'compare-players',
    path: '/compare-players',
    sources: [
      'content/ballon-dor.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/lib/playerProfile.ts',
      'src/lib/comparePlayers.ts',
      REFERENCES_COMPONENT,
      'src/pages/compare-players.astro',
    ],
  },
  // Croatian counterparts of the eight pages above. Same underlying editorial
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
      PODIUM_COMPONENT,
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      PODIUM_COMPONENT,
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      PODIUM_COMPONENT,
      HOST_MAP_COMPONENT,
      HOST_MAP_DATA,
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
      'src/lib/compare.ts',
      'src/lib/teamProfile.ts',
      'src/pages/hr/records.astro',
    ],
  },
  {
    slug: 'compare-hr',
    path: '/hr/compare',
    sources: [
      'content/fifa-world-cup.md',
      'content/uefa-euro.md',
      'content/copa-america.md',
      'content/uefa-nations-league.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/lib/teamCompetitions.ts',
      'src/lib/compare.ts',
      'src/lib/teamProfile.ts',
      REFERENCES_COMPONENT,
      'src/pages/hr/compare.astro',
    ],
  },
  {
    slug: 'compare-players-hr',
    path: '/hr/compare-players',
    sources: [
      'content/ballon-dor.md',
      'content/golden-boot.md',
      SOURCES_MD,
      ...COMPETITION_LIB,
      'src/lib/playerProfile.ts',
      'src/lib/comparePlayers.ts',
      REFERENCES_COMPONENT,
      'src/pages/hr/compare-players.astro',
    ],
  },
  // /glossary renders content/glossary.md's own "## Term" sections as a plain
  // definition list (src/lib/glossary.ts's parseGlossaryEntries) - no
  // TournamentTable/ChampionsSummary/EditorialNotes/References, so none of
  // TABLE_COMPONENTS or SOURCES_MD apply here (tests/e2e/print-styles.spec.ts
  // already groups it with /compare and /teams for the same reason). Only
  // loadPageMeta (front matter + intro, from src/lib/competition.ts) and
  // parseGlossaryEntries (the term/definition list itself) determine what the
  // page shows.
  {
    slug: 'glossary',
    path: '/glossary',
    sources: [
      'content/glossary.md',
      'src/lib/competition.ts',
      'src/lib/glossary.ts',
      'src/pages/glossary.astro',
    ],
  },
  {
    slug: 'glossary-hr',
    path: '/hr/glossary',
    sources: [
      'content/glossary.md',
      'src/lib/competition.ts',
      'src/lib/glossary.ts',
      'src/pages/hr/glossary.astro',
    ],
  },
];

// /teams/<slug> and /hr/teams/<slug> (one PDF per national team, per
// language - 40 teams as of 2026-08-18) aren't listed individually above the
// way the six competition pages and /records are, because - unlike those -
// there's no fixed, hand-typeable list of pages: the team roster itself is
// data, derived at build time from the same four team-competition content
// files (src/lib/teamCompetitions.ts), not hand-maintained here. Hard-coding
// 80 slugs in this file would silently drift the moment a new team's first
// tracked final/semifinal appearance lands in one of those files.
//
// Every team's page (src/pages/teams/[slug].astro,
// src/pages/hr/teams/[slug].astro) is built from exactly this same fixed set
// of files regardless of which team it is - there's no per-team content file
// - so this one shared list stands in for the "sources" array every entry in
// PDF_PAGES above carries individually:
//   - scripts/generate-pdfs.mjs asks the running preview server for the live
//     team list (GET /team-index.json, the same endpoint the site's own
//     "Find a team" search widget uses) and renders one PDF pair per team it
//     finds, recording this same TEAM_PDF_SOURCES list against each
//     `team-<slug>`/`team-<slug>-hr` manifest key.
//   - scripts/check-pdf-freshness.mjs has no running server (it runs before
//     `pnpm build` in CI), so it can't re-derive the live team list itself;
//     instead it trusts whichever `team-*` keys the last `pnpm build:pdfs`
//     already recorded in the manifest and re-hashes this list against each
//     of them. Any edit to one of these files - the only way a team can ever
//     be added, renamed, or removed - changes that file's hash, which
//     immediately flags every existing `team-*` manifest entry as stale
//     (they all share this one list) and forces a regeneration; that
//     regeneration is what actually discovers a brand-new team via the live
//     endpoint. So a new team is never silently missing a PDF forever - it's
//     one `pnpm build:pdfs` behind, the same lag every other PDF has between
//     a content edit and the next manual regeneration.
export const TEAM_PDF_SOURCES = [
  'content/fifa-world-cup.md',
  'content/uefa-euro.md',
  'content/copa-america.md',
  'content/uefa-nations-league.md',
  SOURCES_MD,
  ...COMPETITION_LIB,
  'src/lib/compare.ts',
  'src/lib/teamCompetitions.ts',
  'src/lib/teamProfile.ts',
  'src/components/References.astro',
  'src/pages/teams/[slug].astro',
  'src/pages/hr/teams/[slug].astro',
];

// /players/<slug> and /hr/players/<slug> (one PDF per award-winning player,
// per language - 98 players as of 2026-08-20) - the individual-award
// counterpart of TEAM_PDF_SOURCES above, for exactly the same reason: the
// player roster is derived at build time from the three award tables
// (src/lib/playerProfile.ts's buildAllPlayerProfiles()), not a fixed,
// hand-typeable list, so it can't be listed per-entry in PDF_PAGES the way
// the six competition pages and /records are.
//
// scripts/generate-pdfs.mjs asks the running preview server for the live
// player list (GET /player-index.json, this family's own endpoint - there's
// no "find a player" widget to share one with, unlike /team-index.json) and
// renders one PDF pair per player it finds, recording this same
// PLAYER_PDF_SOURCES list against each `player-<slug>`/`player-<slug>-hr`
// manifest key. scripts/check-pdf-freshness.mjs applies the identical
// trust-the-manifest-keys strategy TEAM_PDF_SOURCES's own doc comment
// explains, substituting the `player-` prefix for `team-`.
export const PLAYER_PDF_SOURCES = [
  'content/ballon-dor.md',
  'content/golden-boot.md',
  SOURCES_MD,
  ...COMPETITION_LIB,
  'src/lib/playerProfile.ts',
  'src/components/References.astro',
  'src/pages/players/[slug].astro',
  'src/pages/hr/players/[slug].astro',
];

// One PDF pair (English + Croatian) per tournament/award edition - the
// per-edition counterpart of TEAM_PDF_SOURCES/PLAYER_PDF_SOURCES above, for
// the same reason: an edition's slug is derived from its content/*.md row at
// build time (buildEditionProfiles(), src/lib/editionProfile.ts), not a
// fixed, hand-typeable list, so it can't be listed per-entry in PDF_PAGES
// the way the six competition pages and /records are.
//
// Unlike TEAM_PDF_SOURCES/PLAYER_PDF_SOURCES (one shared file list for every
// team/player, since every /teams/<slug> or /players/<slug> page is built
// from the exact same fixed set of content files regardless of which team or
// player it is), each edition family below reads from a *different*
// content/*.md table - a Nations League edition's PDF has nothing to do
// with content/copa-america.md - so this is a map keyed by the same `family`
// string src/pages/edition-index.json.ts stamps on every entry it returns,
// one source list per family instead of one list for all of them.
//
// scripts/generate-pdfs.mjs asks the running preview server for the live
// edition list (GET /edition-index.json) and renders one PDF pair per entry
// it finds, recording EDITION_PDF_SOURCES[family] against each
// `edition-<family>-<slug>`/`edition-<family>-<slug>-hr` manifest key.
// scripts/check-pdf-freshness.mjs applies the same trust-the-manifest-keys
// strategy TEAM_PDF_SOURCES's own doc comment explains, recovering `family`
// from the manifest key itself via editionFamilyFromSlug() below (the
// `family` string is always a valid, non-ambiguous prefix of the full
// `edition-<family>-...` key - see that function's own comment).
const EDITION_VIEW = 'src/components/EditionView.astro';
const EDITION_LIB = 'src/lib/editionProfile.ts';

export const EDITION_PDF_SOURCES = {
  'world-cup': [
    'content/fifa-world-cup.md',
    'content/golden-boot.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/pages/competitions/world-cup/[year].astro',
    'src/pages/hr/competitions/world-cup/[year].astro',
  ],
  euro: [
    'content/uefa-euro.md',
    'content/golden-boot.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/pages/competitions/euro/[year].astro',
    'src/pages/hr/competitions/euro/[year].astro',
  ],
  'nations-league': [
    'content/uefa-nations-league.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/pages/competitions/nations-league/[year].astro',
    'src/pages/hr/competitions/nations-league/[year].astro',
  ],
  'copa-america': [
    'content/copa-america.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/pages/competitions/copa-america/[year].astro',
    'src/pages/hr/competitions/copa-america/[year].astro',
  ],
  'ballon-dor': [
    'content/ballon-dor.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/lib/playerProfile.ts',
    'src/pages/competitions/ballon-dor/[year].astro',
    'src/pages/hr/competitions/ballon-dor/[year].astro',
  ],
  'golden-boot-world-cup': [
    'content/golden-boot.md',
    'content/ballon-dor.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/lib/playerProfile.ts',
    'src/pages/competitions/golden-boot/world-cup/[year].astro',
    'src/pages/hr/competitions/golden-boot/world-cup/[year].astro',
  ],
  'golden-boot-euro': [
    'content/golden-boot.md',
    'content/ballon-dor.md',
    SOURCES_MD,
    ...COMPETITION_LIB,
    EDITION_LIB,
    EDITION_VIEW,
    REFERENCES_COMPONENT,
    'src/lib/playerProfile.ts',
    'src/pages/competitions/golden-boot/euro/[year].astro',
    'src/pages/hr/competitions/golden-boot/euro/[year].astro',
  ],
};

// Recovers an EDITION_PDF_SOURCES key from a `edition-<family>-<slug>[-hr]`
// manifest key, for scripts/check-pdf-freshness.mjs (no running server, so it
// can't ask /edition-index.json which family a given entry belongs to).
// Longest-prefix-first avoids "golden-boot-world-cup"/"golden-boot-euro"
// ever being shadowed by a shorter, unrelated family name.
export function editionFamilyFromSlug(slug) {
  if (!slug.startsWith('edition-')) return undefined;
  const families = Object.keys(EDITION_PDF_SOURCES).sort((a, b) => b.length - a.length);
  return families.find((family) => slug.startsWith(`edition-${family}-`));
}
