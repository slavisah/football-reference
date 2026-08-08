// Single source of truth for which competition pages get a downloadable PDF,
// their page path, and which content/*.md file(s) each page's table data is
// sourced from (World Cup and EURO also join in a per-year "Top scorer"
// column from Golden Boot, so a Golden Boot edit can make those two PDFs
// stale too, not just golden-boot.pdf itself).
//
// docs/PROJECT_STATUS.md ("Automated PDF-freshness check", 2026-08-06) added
// scripts/generate-pdfs.mjs and scripts/check-pdf-freshness.mjs with this
// exact same list duplicated by hand in both files, and flagged the drift
// risk explicitly: if a future page is added to only one of the two lists,
// the freshness check could silently pass or fail incorrectly. This module
// removes that risk by giving both scripts one shared list to import.

export const PDF_PAGES = [
  { slug: 'world-cup', path: '/competitions/world-cup', sources: ['fifa-world-cup.md', 'golden-boot.md'] },
  { slug: 'euro', path: '/competitions/euro', sources: ['uefa-euro.md', 'golden-boot.md'] },
  { slug: 'nations-league', path: '/competitions/nations-league', sources: ['uefa-nations-league.md'] },
  { slug: 'copa-america', path: '/competitions/copa-america', sources: ['copa-america.md'] },
  { slug: 'ballon-dor', path: '/competitions/ballon-dor', sources: ['ballon-dor.md'] },
  { slug: 'golden-boot', path: '/competitions/golden-boot', sources: ['golden-boot.md'] },
];
