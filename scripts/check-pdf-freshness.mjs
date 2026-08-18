// Checks whether public/downloads/*.pdf still match the editorial content
// they were rendered from, without needing a browser or a full git history.
//
// docs/PROJECT_STATUS.md ("Bug fix: two downloadable PDFs were stale
// relative to their own source tables", 2026-08-06) found that a content
// edit can land on the live HTML page immediately while the committed PDF
// snapshot silently keeps showing the old data for days, because
// regenerating the PDF (`pnpm build:pdfs`) is a manual step nothing
// previously verified actually happened. This script closes that gap: it
// compares a SHA-256 of each PDF's source content file(s), taken at the
// moment `pnpm build:pdfs` last ran (recorded in
// public/downloads/.pdf-manifest.json), against the current file(s) on
// disk. A git-log-timestamp approach was considered instead and rejected -
// it silently degrades to useless on a shallow checkout (CI's default
// `actions/checkout` fetch depth), where `git log` on a path only sees
// whichever commits happen to be in that shallow slice. Content hashing has
// no such blind spot and works identically locally and in CI.
//
// Run manually (`pnpm check:pdfs`) or from CI - see .github/workflows/ci.yml.
// Exits non-zero, listing exactly which PDFs are stale, if content has
// moved on since the last `pnpm build:pdfs`.

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF_PAGES, TEAM_PDF_SOURCES } from './pdf-pages.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = path.join(ROOT, 'public', 'downloads', '.pdf-manifest.json');

// Derived from the single shared PDF_PAGES list (scripts/pdf-pages.mjs), so
// this can never drift from what scripts/generate-pdfs.mjs actually rendered.
const PDF_SOURCES = Object.fromEntries(PDF_PAGES.map(({ slug, sources }) => [slug, sources]));

// The ~80 `team-<slug>`/`team-<slug>-hr` PDFs aren't in PDF_PAGES (see
// scripts/pdf-pages.mjs's TEAM_PDF_SOURCES doc comment for why: the team
// roster is data, not a hand-typed list, and this script - unlike
// generate-pdfs.mjs - has no running preview server to ask for the live
// roster, since `pnpm check:pdfs` runs *before* `pnpm build` in CI). Instead,
// this trusts whichever `team-*` keys the last `pnpm build:pdfs` already
// recorded in the manifest, and re-hashes TEAM_PDF_SOURCES - the one fixed
// file list every team PDF actually depends on - against each of them. A
// content edit that adds/removes/renames a team necessarily edits one of
// those same files, so it flags every existing team-* entry stale and forces
// a regeneration; that regeneration is what discovers the new roster via the
// live endpoint. A team that has never had a PDF generated for it at all
// (brand new roster entry, manifest has no `team-*` key for it yet) has
// nothing here to flag it missing - a real but narrow gap, no worse than the
// one build:pdfs lag every other PDF already has between a content edit and
// its next manual regeneration.
function teamSourcesFromManifest(manifest) {
  return Object.fromEntries(
    Object.keys(manifest)
      .filter((slug) => slug.startsWith('team-'))
      .map((slug) => [slug, TEAM_PDF_SOURCES]),
  );
}

async function hashFile(relativePath) {
  const contents = await readFile(path.join(ROOT, relativePath), 'utf8');
  return createHash('sha256').update(contents).digest('hex');
}

async function currentHashes(sources) {
  const files = [...new Set(Object.values(sources).flat())];
  const entries = await Promise.all(
    files.map(async (file) => [file, await hashFile(file)]),
  );
  return Object.fromEntries(entries);
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const manifest = await loadManifest();
  if (!manifest) {
    console.error(
      `No PDF manifest found at ${path.relative(ROOT, MANIFEST_PATH)}.\n` +
        'Run `pnpm build && pnpm build:pdfs` to generate the PDFs and their manifest.',
    );
    process.exitCode = 1;
    return;
  }

  const sources = { ...PDF_SOURCES, ...teamSourcesFromManifest(manifest) };
  const current = await currentHashes(sources);
  const stale = [];

  for (const [slug, files] of Object.entries(sources)) {
    const recorded = manifest[slug] ?? {};
    const outOfDate = files.filter((file) => recorded[file] !== current[file]);
    if (outOfDate.length > 0) {
      stale.push({ slug, outOfDate });
    }
  }

  if (stale.length === 0) {
    console.log(
      `All ${Object.keys(sources).length} PDFs in public/downloads/ are up to date with their source content.`,
    );
    return;
  }

  console.error('Stale PDF(s) detected - content has changed since the last `pnpm build:pdfs`:\n');
  for (const { slug, outOfDate } of stale) {
    console.error(`  public/downloads/${slug}.pdf  <-  ${outOfDate.join(', ')}`);
  }
  console.error(
    '\nRegenerate with `pnpm build && pnpm build:pdfs`, then commit the updated PDF(s) and manifest.',
  );
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
