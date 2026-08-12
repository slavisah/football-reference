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
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF_PAGES as PAGES } from './pdf-pages.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 4399;
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;
const OUT_DIR = path.join(ROOT, 'public', 'downloads');
const MANIFEST_PATH = path.join(OUT_DIR, '.pdf-manifest.json');

// One PDF per required competition page (src/pages/competitions/*.astro),
// plus which file(s) each page's rendered content is sourced from (its
// content/*.md edition table, plus docs/SOURCES.md for the References
// section every page shares) - the shared PDF_PAGES list
// (scripts/pdf-pages.mjs) so this can never drift from
// scripts/check-pdf-freshness.mjs's PDF_SOURCES.

async function buildManifest() {
  const manifest = {};
  for (const { slug, sources } of PAGES) {
    manifest[slug] = {};
    for (const file of sources) {
      const contents = await readFile(path.join(ROOT, file), 'utf8');
      manifest[slug][file] = createHash('sha256').update(contents).digest('hex');
    }
  }
  return manifest;
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
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // already gone
    }
  };
  process.on('exit', stopServer);

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

      for (const { slug, path: pagePath } of PAGES) {
        const url = `${ORIGIN}${BASE}${pagePath}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        const outFile = path.join(OUT_DIR, `${slug}.pdf`);
        await page.pdf({ path: outFile, preferCSSPageSize: true, printBackground: true });
        console.log(`Wrote ${path.relative(ROOT, outFile)}`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    stopServer();
  }

  const manifest = await buildManifest();
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
