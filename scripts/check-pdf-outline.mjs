// Verifies every downloadable PDF's outline (its bookmark/table-of-contents
// tree, shown in a real PDF reader's sidebar) actually reflects the page's
// own heading structure, not just a single flat top-level entry.
//
// docs/ROADMAP.md carried an open, high-risk-flagged lead across many
// intensive runs (first raised the hundred-and-forty-sixth run): "no PDF
// bookmark/outline entry per note-card section within a single long page
// (only one top-level bookmark per PDF today, via `outline: true`)",
// re-investigated and reconfirmed as needing "new, unverified low-level PDF
// surgery with no way to empirically verify short of opening every affected
// PDF in a real reader" (hundred-and-forty-seventh run) - rejecting `pdf-lib`
// for the same reason `scripts/pdf-metadata.mjs` already documents (a full
// re-serialize drops the tagged/outline structure entirely) and never
// finding a safer alternative.
//
// A direct empirical check of an actually-shipped PDF (this run, via a
// throwaway `pypdf` script - installed standalone in a venv, verification
// only, same posture as the hundred-and-forty-eighth run's own
// `pdfminer.six` use) overturns that read: `scripts/generate-pdfs.mjs`'s
// `outline: true` (a native Playwright/Chromium `page.pdf()` option, not
// hand-rolled) already walks the *entire* page's real `<h1>`-`<h6>` heading
// structure and emits one nested PDF bookmark per heading, not one flat
// top-level entry - confirmed against `copa-america.pdf` (65 bookmarks: the
// page title, "Podium by edition" plus all 48 edition-year sub-entries
// nested under it, "Champions by titles", the host-map region breakdown,
// and one entry per `EditorialNotes.astro` `<h2>` note-card section - "How
// it works", "Final venues", "Golden Boot winners", etc.), `world-cup.pdf`
// (45), `records.pdf` (63), an edition PDF, a team PDF and a player PDF
// (see docs/PROJECT_STATUS.md's matching entry for the full breakdown). The
// feature this backlog item wanted was already shipped as a side effect of
// `outline: true` walking real headings - nothing to build, only to notice
// and protect with a permanent check, since nothing had ever verified it
// before and a future Chromium/Playwright version (or a change to this
// site's own heading markup) could silently regress it back to a flat,
// single-entry outline with no automated test catching it.
//
// The exact, spec-defined relationship confirmed across every PDF family
// (competition landing pages, `/records`, per-edition, team and player
// profiles - see the empirical breakdown above): the outline root's own
// `/Count` (PDF 32000-1:2008 7.7.3.4 - "the total number of open items at
// all levels of the outline", and every item this site's PDFs produce is a
// plain, always-open leaf/branch, so this is just the flat descendant
// count) equals the number of real `<h1>`-`<h6>` elements the built page
// has, MINUS its `.visually-hidden` ones. Chromium's outline generation
// silently skips a `.visually-hidden` heading (the screen-reader-only table
// caption `<h2 id="...-heading" class="visually-hidden">` pattern used by
// `TournamentTable.astro`, `EditionView.astro`, the team/player/index
// "A to Z" pages and `hr/glossary.astro`) - confirmed by diffing
// `extractHeadings()`'s full 46-heading list for `/competitions/world-cup`
// against `world-cup.pdf`'s own 45-title outline dump: the sole heading
// missing from the PDF was exactly that page's own hidden table-caption
// `<h2>`, nothing else.
//
// Reads only already-built output (this run's own `pnpm build` and the
// already-committed `public/downloads/*.pdf` files, the same posture
// `check-pdf-freshness.mjs`/`check-image-dimensions.mjs` already take) - no
// browser, no PDF-editing library, no regeneration. Run manually after
// `pnpm build` (`pnpm check:pdf-outline`); also wired into
// `.github/workflows/ci.yml`, since - unlike `check:reflow`/`check:text-
// zoom`/`check:print-width`/`check:lighthouse`'s real-browser, per-page-load
// sweeps - this is pure regex over already-on-disk files, the same fast
// territory `check:pdfs`/`check:heading-outline`/`check:jsonld` already
// occupy (well under a second for all 700 PDFs).

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF_PAGES } from './pdf-pages.mjs';
import { extractHeadings } from './check-heading-outline.mjs';
import { candidateDistPaths } from './check-internal-links.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const DOWNLOADS_DIR = path.join(ROOT, 'public', 'downloads');

// Mirrors src/lib/teamProfile.ts's teamProfileSlug() exactly - duplicated
// for the same plain-Node reason scripts/generate-pdfs.mjs's own copy gives
// (this script runs outside Vite/Astro, so the astro:content-dependent
// sibling module teamProfileSlug() actually lives next to can't be
// imported here).
function teamProfileSlug(id) {
  return id
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// Mirrors src/lib/playerProfile.ts's playerProfileSlug() exactly, same
// reason as teamProfileSlug() above.
function playerProfileSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

const VISUALLY_HIDDEN_HEADING_RE = /<h[1-6]\b[^>]*class="[^"]*\bvisually-hidden\b[^"]*"[^>]*>/gi;

/** Pure: how many outline bookmarks a page with this HTML should produce. */
export function expectedOutlineCount(html) {
  const headings = extractHeadings(html);
  const hiddenCount = (html.match(VISUALLY_HIDDEN_HEADING_RE) ?? []).length;
  return headings.length - hiddenCount;
}

// Matches the one Outlines dictionary Chromium's PDF writer emits - a plain
// flat `<< /Type /Outlines /First n 0 R /Last n 0 R /Count n >>`, the same
// classic (non-compressed) object shape pdf-metadata.mjs's own header
// comment documents this site's PDFs as always using. `[^>]*?` (forbidding
// a literal '>') is safe here as long as the dict itself never embeds a hex
// string (`<...>`) - true for every outline root this site has generated,
// since its only values are a type name, two indirect references and an
// integer.
const OUTLINES_DICT_RE = /<<([^>]*?\/Type\s*\/Outlines[^>]*?)>>/;

/** Pure: how many outline bookmarks a PDF's own Outlines root reports (0 if none/malformed). */
export function actualOutlineCount(pdfBuffer) {
  const text = pdfBuffer.toString('latin1');
  const match = OUTLINES_DICT_RE.exec(text);
  if (!match) return 0;
  const countMatch = /\/Count\s+(-?\d+)/.exec(match[1]);
  return countMatch ? Number(countMatch[1]) : 0;
}

async function readDistHtml(pagePath) {
  for (const candidate of candidateDistPaths(pagePath)) {
    try {
      return await readFile(path.join(DIST_DIR, candidate), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return null;
}

/** Every {pdfFile, pagePath} pair this site downloads a PDF for. */
async function collectEntries() {
  const entries = PDF_PAGES.map(({ slug, path: pagePath }) => ({
    pdfFile: `${slug}.pdf`,
    pagePath,
  }));

  const editionIndex = JSON.parse(await readFile(path.join(DIST_DIR, 'edition-index.json'), 'utf8'));
  for (const { pdfSlug, path: pagePath } of editionIndex) {
    entries.push({ pdfFile: `${pdfSlug}.pdf`, pagePath });
  }

  const teamIndex = JSON.parse(await readFile(path.join(DIST_DIR, 'team-index.json'), 'utf8'));
  for (const { id } of teamIndex) {
    const slug = teamProfileSlug(id);
    entries.push({ pdfFile: `team-${slug}.pdf`, pagePath: `/teams/${slug}` });
    entries.push({ pdfFile: `team-${slug}-hr.pdf`, pagePath: `/hr/teams/${slug}` });
  }

  const playerIndex = JSON.parse(await readFile(path.join(DIST_DIR, 'player-index.json'), 'utf8'));
  for (const { id } of playerIndex) {
    const slug = playerProfileSlug(id);
    entries.push({ pdfFile: `player-${slug}.pdf`, pagePath: `/players/${slug}` });
    entries.push({ pdfFile: `player-${slug}-hr.pdf`, pagePath: `/hr/players/${slug}` });
  }

  return entries;
}

async function main() {
  const entries = await collectEntries();
  console.log(`Checking the outline/bookmark tree of ${entries.length} downloadable PDFs against their own page's heading structure...`);

  const failures = [];
  for (const { pdfFile, pagePath } of entries) {
    const pdfPath = path.join(DOWNLOADS_DIR, pdfFile);
    let pdfBuffer;
    try {
      pdfBuffer = await readFile(pdfPath);
    } catch (error) {
      failures.push(`${pdfFile}: could not read PDF (${error.code ?? error.message})`);
      continue;
    }

    const html = await readDistHtml(pagePath);
    if (html === null) {
      failures.push(`${pdfFile}: no built page found at ${pagePath} - can't determine its expected outline`);
      continue;
    }

    const expected = expectedOutlineCount(html);
    const actual = actualOutlineCount(pdfBuffer);
    if (actual !== expected) {
      failures.push(
        `${pdfFile}: outline has ${actual} bookmark(s), expected ${expected} (one per visible heading on ${pagePath})`,
      );
    }
  }

  if (failures.length === 0) {
    console.log(
      `\nEvery PDF's outline exactly matches its own page's visible heading count (${entries.length} checked).`,
    );
    return;
  }

  console.error(`\n${failures.length} PDF outline mismatch(es) found:\n`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
