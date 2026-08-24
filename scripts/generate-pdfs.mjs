// Regenerates the "Download printable PDF" files under public/downloads/.
//
// These are static assets, committed to the repo and served like any other
// public/ file - NOT generated during `pnpm build` or the GitHub Pages
// deploy, on purpose: that keeps deploys fast (docs/PROJECT_STATUS.md
// already made this call for Playwright/e2e) and avoids adding a browser
// automation dependency to the production build/deploy path. Instead, run
// this manually after editing content that changes a competition table:
//
//   pnpm build && pnpm build:pdfs
//
// It builds the static site, serves it with `astro preview` (so BASE_PATH
// and all data are exactly what a reader sees), opens each competition page
// with the pre-installed Playwright Chromium, emulates print media (so the
// existing @media print / @page rules in src/styles/global.css apply - same
// A4-landscape layout a reader gets from Ctrl+P), and saves a PDF per page.
//
// It also writes public/downloads/.pdf-manifest.json - a content-hash
// fingerprint of each PDF's source file(s), so scripts/check-pdf-freshness.mjs
// (`pnpm check:pdfs`) can later tell whether a PDF still matches the
// content it was rendered from, without needing a browser or git history.

import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF_PAGES as PAGES, TEAM_PDF_SOURCES, PLAYER_PDF_SOURCES } from './pdf-pages.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 4399;
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;
const OUT_DIR = path.join(ROOT, 'public', 'downloads');
const MANIFEST_PATH = path.join(OUT_DIR, '.pdf-manifest.json');

// One PDF per required competition page (src/pages/competitions/*.astro)
// plus /records, and which file(s) each page's rendered content is sourced
// from (its content/*.md edition table, plus docs/SOURCES.md for the
// References section every page shares) - the shared PDF_PAGES list
// (scripts/pdf-pages.mjs) so this can never drift from
// scripts/check-pdf-freshness.mjs's PDF_SOURCES.

async function hashSources(sources) {
  const hashes = {};
  for (const file of sources) {
    const contents = await readFile(path.join(ROOT, file), 'utf8');
    hashes[file] = createHash('sha256').update(contents).digest('hex');
  }
  return hashes;
}

async function buildManifest(entries) {
  const manifest = {};
  for (const { slug, sources } of entries) {
    manifest[slug] = await hashSources(sources);
  }
  return manifest;
}

// Mirrors src/lib/teamProfile.ts's teamProfileSlug() exactly (a pure string
// transform, no Astro/content dependency) so a team fetched from the live
// /team-index.json endpoint below lands on the same /teams/<slug> URL the
// site itself generated for it. Duplicated rather than imported for the same
// reason scripts/pdf-pages.mjs's own doc comment gives for not hand-listing
// team slugs: this script runs under plain Node, not Vite, and
// src/lib/teamProfile.ts's sibling module (src/lib/compare.ts) imports
// `astro:content`, which only resolves inside an Astro build.
function teamProfileSlug(id) {
  return id
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// Mirrors src/lib/playerProfile.ts's playerProfileSlug() exactly, for the
// same plain-Node reason teamProfileSlug() above is duplicated rather than
// imported.
function playerProfileSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Preview server at ${url} did not become ready in time`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log('Starting `astro preview`...');
  // Spawn the astro binary directly (not through `pnpm exec`) and detached
  // into its own process group, so killing it also kills the Vite/preview
  // server it starts internally - killing just the pnpm wrapper process
  // leaves that grandchild running and the script hanging on exit.
  const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');
  const server = spawn(astroBin, ['preview', '--port', String(PORT), '--host'], {
    cwd: ROOT,
    stdio: 'inherit',
    detached: true,
  });

  let stopped = false;
  const stopServer = () => {
    if (stopped) return;
    stopped = true;
    // Astro 7 changed `astro preview` to fork its real server into a
    // detached background daemon and let this immediate `server` process
    // exit as soon as it's confirmed listening (see `astro preview
    // status`/`stop`) - so by the time this runs, `server`'s own process
    // (and therefore its process group) is typically already gone, and
    // killing it no longer reaches the actual running server the way it did
    // under Astro 5. Found as a real bug: a `pnpm build:pdfs` run that
    // appeared to finish cleanly left an `astro preview` daemon still
    // listening on PORT afterward. `astro preview stop` is the only
    // reliable way to stop the daemon itself now; the process-group kill is
    // kept alongside it as a harmless no-op once the daemon is Astro's own
    // responsibility, in case a future Astro version reverts this.
    spawnSync(astroBin, ['preview', 'stop'], { cwd: ROOT, stdio: 'inherit' });
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // already gone
    }
  };
  process.on('exit', stopServer);

  let teamEntries = [];
  let playerEntries = [];

  try {
    await waitForServer(`${ORIGIN}${BASE}/`);

    // Match the executable-path override tests/e2e uses (playwright.config.ts):
    // some environments pre-install Chromium under a build the installed
    // @playwright/test version doesn't recognize by default.
    const browser = await chromium.launch(
      process.env.PW_EXECUTABLE_PATH
        ? { executablePath: process.env.PW_EXECUTABLE_PATH }
        : {},
    );
    try {
      const page = await browser.newPage();
      await page.emulateMedia({ media: 'print' });

      const pdfOptions = (outFile) => ({
        path: outFile,
        preferCSSPageSize: true,
        printBackground: true,
        // `tagged` emits a PDF/UA-style structure tree (headings, table
        // roles, reading order) so a screen reader can navigate the
        // downloaded file the same way it navigates the live page, instead
        // of falling back to raw text-position guessing; `outline` embeds
        // the same structure as PDF bookmarks for sighted keyboard/reader
        // navigation. Both are native to Playwright's Chromium print-to-PDF
        // (no new dependency) - previously omitted, so every downloadable
        // PDF was untagged.
        tagged: true,
        outline: true,
      });

      for (const { slug, path: pagePath } of PAGES) {
        const url = `${ORIGIN}${BASE}${pagePath}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        const outFile = path.join(OUT_DIR, `${slug}.pdf`);
        await page.pdf(pdfOptions(outFile));
        console.log(`Wrote ${path.relative(ROOT, outFile)}`);
      }

      // One PDF pair (English + Croatian) per national team - see
      // scripts/pdf-pages.mjs's TEAM_PDF_SOURCES doc comment for why this
      // list comes from the live site instead of a hand-typed slug list the
      // way PAGES above does.
      console.log('Fetching live team list from /team-index.json...');
      const teamIndexRes = await fetch(`${ORIGIN}${BASE}/team-index.json`);
      if (!teamIndexRes.ok) {
        throw new Error(`GET /team-index.json returned ${teamIndexRes.status}`);
      }
      const teamIndex = await teamIndexRes.json();
      console.log(`Found ${teamIndex.length} teams.`);

      const teamManifestEntries = [];
      const seenTeamSlugs = new Set();
      for (const { id, displayName } of teamIndex) {
        const slug = teamProfileSlug(id);
        // Same collision guard src/pages/teams/[slug].astro's own
        // getStaticPaths() applies at build time - fail loudly rather than
        // silently overwrite one team's PDF with another's.
        if (seenTeamSlugs.has(slug)) {
          throw new Error(`Two national teams produced the same team PDF slug: "${slug}" (${displayName})`);
        }
        seenTeamSlugs.add(slug);

        for (const [pagePath, fileSlug] of [
          [`/teams/${slug}`, `team-${slug}`],
          [`/hr/teams/${slug}`, `team-${slug}-hr`],
        ]) {
          const url = `${ORIGIN}${BASE}${pagePath}`;
          await page.goto(url, { waitUntil: 'networkidle' });
          const outFile = path.join(OUT_DIR, `${fileSlug}.pdf`);
          await page.pdf(pdfOptions(outFile));
          teamManifestEntries.push({ slug: fileSlug, sources: TEAM_PDF_SOURCES });
        }
        console.log(`Wrote team-${slug}.pdf / team-${slug}-hr.pdf (${displayName})`);
      }

      teamEntries = teamManifestEntries;

      // One PDF pair (English + Croatian) per award-winning player - the
      // individual-award counterpart of the team loop above, see
      // scripts/pdf-pages.mjs's PLAYER_PDF_SOURCES doc comment.
      console.log('Fetching live player list from /player-index.json...');
      const playerIndexRes = await fetch(`${ORIGIN}${BASE}/player-index.json`);
      if (!playerIndexRes.ok) {
        throw new Error(`GET /player-index.json returned ${playerIndexRes.status}`);
      }
      const playerIndex = await playerIndexRes.json();
      console.log(`Found ${playerIndex.length} players.`);

      const playerManifestEntries = [];
      const seenPlayerSlugs = new Set();
      for (const { id, displayName } of playerIndex) {
        const slug = playerProfileSlug(id);
        // Same collision guard src/pages/players/[slug].astro's own
        // getStaticPaths() applies at build time - fail loudly rather than
        // silently overwrite one player's PDF with another's.
        if (seenPlayerSlugs.has(slug)) {
          throw new Error(`Two players produced the same player PDF slug: "${slug}" (${displayName})`);
        }
        seenPlayerSlugs.add(slug);

        for (const [pagePath, fileSlug] of [
          [`/players/${slug}`, `player-${slug}`],
          [`/hr/players/${slug}`, `player-${slug}-hr`],
        ]) {
          const url = `${ORIGIN}${BASE}${pagePath}`;
          await page.goto(url, { waitUntil: 'networkidle' });
          const outFile = path.join(OUT_DIR, `${fileSlug}.pdf`);
          await page.pdf(pdfOptions(outFile));
          playerManifestEntries.push({ slug: fileSlug, sources: PLAYER_PDF_SOURCES });
        }
        console.log(`Wrote player-${slug}.pdf / player-${slug}-hr.pdf (${displayName})`);
      }

      playerEntries = playerManifestEntries;
    } finally {
      await browser.close();
    }
  } finally {
    stopServer();
  }

  const manifest = await buildManifest([...PAGES, ...teamEntries, ...playerEntries]);
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    // The detached preview server's stdio is inherited, which can otherwise
    // keep this process's event loop alive after everything is done.
    process.exit(process.exitCode ?? 0);
  });
