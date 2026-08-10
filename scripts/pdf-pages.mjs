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
const SOURCES_MD = 'docs/SOURCES.md';

export const PDF_PAGES = [
  {
    slug: 'world-cup',
    path: '/competitions/world-cup',
    sources: ['content/fifa-world-cup.md', 'content/golden-boot.md', SOURCES_MD],
  },
  {
    slug: 'euro',
    path: '/competitions/euro',
    sources: ['content/uefa-euro.md', 'content/golden-boot.md', SOURCES_MD],
  },
  {
    slug: 'nations-league',
    path: '/competitions/nations-league',
    sources: ['content/uefa-nations-league.md', SOURCES_MD],
  },
  {
    slug: 'copa-america',
    path: '/competitions/copa-america',
    sources: ['content/copa-america.md', SOURCES_MD],
  },
  {
    slug: 'ballon-dor',
    path: '/competitions/ballon-dor',
    sources: ['content/ballon-dor.md', SOURCES_MD],
  },
  {
    slug: 'golden-boot',
    path: '/competitions/golden-boot',
    sources: ['content/golden-boot.md', SOURCES_MD],
  },
];
