// Guards against an accidental page-weight regression (e.g. a big embedded
// asset, a runaway generated table, or a duplicated script block) shipping to
// the live static site unnoticed. Nothing previously measured this - this
// repo has no images (AGENTS.md rule 4 forbids scraped photographs) and no
// web fonts, so every page's weight is just its own HTML plus the shared CSS
// bundle(s) it references, which is exactly what this script sums and checks
// against a fixed budget.
//
// Run manually (`pnpm check:perf`) after `pnpm build`, or from CI - see
// .github/workflows/ci.yml. Exits non-zero, listing every page over budget,
// if a page's HTML + CSS weight exceeds PAGE_WEIGHT_BUDGET_BYTES.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

// The heaviest page today (Croatian "/records", which - like its English
// counterpart - aggregates seven tables' worth of generated timeline/ranking
// content, including the "Back-to-back champions" streaks section added
// 2026-08-15, the "Nearly champions" and "Longest wait between titles"
// sections added 2026-08-16, the "Titles won on home soil" section added
// later the same day, the "Biggest final wins" ranking added still later
// (2026-08-16, a later intensive run), and the "Nearly finalists" ranking
// added 2026-08-18 (intensive run) - genuinely the densest page on the site,
// not bloat) weighs ~489.0 KB of HTML + CSS - over the previous 480 KB
// budget. Raised to 510 KB (itself raised six times already, from an initial
// ~234 KB measurement, then 300 KB, then 360 KB, then 400 KB, then 420 KB,
// then 440 KB, then 480 KB) the same deliberate way this script's own
// guidance recommends: real new generated content, not a regression. This
// budget leaves headroom for that content to keep growing while still
// catching an accidental multi-page regression (a stray large asset, a
// duplicated script block, an unminified debug dump) well before it reaches
// production.
export const PAGE_WEIGHT_BUDGET_BYTES = 510 * 1024;

/** Every same-origin CSS asset path (e.g. "/football-reference/_astro/foo.css") referenced by an HTML page. */
export function findCssRefs(html) {
  const matches = html.matchAll(/href="([^"]+\.css)"/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

/**
 * Resolve a referenced asset's on-disk path under `dist/`, regardless of
 * which base path (e.g. "/football-reference/") the site was built with -
 * every build output still lands under `dist/_astro/`, so matching on that
 * fixed segment sidesteps needing to know BASE_PATH here at all.
 */
export function resolveDistAsset(distDir, href) {
  const marker = '/_astro/';
  const index = href.indexOf(marker);
  if (index === -1) return null;
  return path.join(distDir, '_astro', href.slice(index + marker.length));
}

/** Given a page's HTML size and its resolved CSS asset sizes, the total weight the browser downloads for it. */
export function pageWeight(htmlBytes, cssSizes) {
  return htmlBytes + cssSizes.reduce((sum, n) => sum + n, 0);
}

/** Pure budget check: which pages (already measured) exceed the byte budget, heaviest first. */
export function overBudget(pages, budgetBytes) {
  return pages.filter((p) => p.bytes > budgetBytes).sort((a, b) => b.bytes - a.bytes);
}

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(full);
      return entry.name.endsWith('.html') ? [full] : [];
    }),
  );
  return files.flat();
}

async function measurePage(filePath) {
  const html = await readFile(filePath, 'utf8');
  const htmlBytes = Buffer.byteLength(html, 'utf8');
  const cssRefs = findCssRefs(html);
  const cssSizes = await Promise.all(
    cssRefs.map(async (href) => {
      const assetPath = resolveDistAsset(DIST_DIR, href);
      if (!assetPath) return 0;
      try {
        return (await stat(assetPath)).size;
      } catch (error) {
        if (error.code === 'ENOENT') return 0;
        throw error;
      }
    }),
  );
  return {
    page: path.relative(DIST_DIR, filePath),
    bytes: pageWeight(htmlBytes, cssSizes),
  };
}

async function main() {
  let htmlFiles;
  try {
    htmlFiles = await listHtmlFiles(DIST_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`No build output found at ${path.relative(ROOT, DIST_DIR)}. Run \`pnpm build\` first.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const pages = await Promise.all(htmlFiles.map(measurePage));
  const heaviest = [...pages].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
  console.log(`Measured ${pages.length} pages. Heaviest:`);
  for (const { page, bytes } of heaviest) {
    console.log(`  ${(bytes / 1024).toFixed(1)} KB  ${page}`);
  }

  const over = overBudget(pages, PAGE_WEIGHT_BUDGET_BYTES);
  if (over.length === 0) {
    console.log(`All pages are within the ${(PAGE_WEIGHT_BUDGET_BYTES / 1024).toFixed(0)} KB page-weight budget.`);
    return;
  }

  console.error(
    `\n${over.length} page(s) exceed the ${(PAGE_WEIGHT_BUDGET_BYTES / 1024).toFixed(0)} KB page-weight budget:\n`,
  );
  for (const { page, bytes } of over) {
    console.error(`  ${(bytes / 1024).toFixed(1)} KB  ${page}`);
  }
  console.error(
    '\nIf this growth is genuinely new editorial content, raise PAGE_WEIGHT_BUDGET_BYTES in ' +
      'scripts/check-page-weight.mjs deliberately; if not, find and trim what regressed.',
  );
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
