// Automates the manual Lighthouse audit the fourteenth intensive run (see
// docs/PROJECT_STATUS.md, 2026-08-27) ran by hand against seven diverse pages
// (home, the heaviest built page, an edition page, both head-to-head
// comparison tools, a player profile and a team profile) and found a perfect
// 1.00/1.00/1.00/1.00 (performance/accessibility/best-practices/SEO) on every
// one. That run suggested turning the manual invocation into a committed
// script if repeat runs turned out to be common enough to justify it - this
// is that script, run as `pnpm check:lighthouse` against an already-built
// `dist/` (run `pnpm build` first, the same precondition `check:perf` has).
//
// Not wired into .github/workflows/ci.yml: `lighthouse` pulls in
// puppeteer-core/chrome-launcher and a full page-load-plus-audit run per
// page is much slower than this repo's other `check:*` scripts, so it stays
// a manual/intensive-run tool rather than a required PR gate, the same way
// `test:e2e:install` is manual infrastructure rather than part of `pnpm test`.
//
// Reuses the `astro preview` daemon dance `scripts/test-preview-server.mjs`
// already worked out (Astro 7 forks `astro preview` into a detached
// background process and returns immediately - see that script's own doc
// comment for the full story) rather than importing it: that script's
// "block forever, only exit on SIGTERM" shape is specific to being a
// Playwright `webServer.command`, and duplicating just the start/stop logic
// here is simpler than reshaping a script 804 e2e tests already depend on.
//
// Chromium launch mirrors playwright.config.ts's own escape hatches for a
// pinned `@playwright/test` version whose bundled browser build doesn't
// match what's on disk (this sandbox's pre-installed
// `/opt/pw-browsers/chromium` is one such case) - set PW_EXECUTABLE_PATH to
// point at it, or PW_CHROME_CHANNEL for a system Chrome/Chromium install; a
// normal contributor machine or CI runner that ran `pnpm test:e2e:install`
// needs neither and gets Playwright's own resolution.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;
const CDP_PORT = 9223;

// The fourteenth intensive run's manual audit picked seven diverse page
// shapes (table-heavy, form controls, long-form content): the home page,
// the single heaviest built page (Croatian /records - see
// PAGE_WEIGHT_BUDGET_BYTES's doc comment in check-page-weight.mjs), one
// per-edition page, both head-to-head comparison tools, one player profile
// and one team profile. That left five of the six competition/award
// families (World Cup, EURO, Nations League, Ballon d'Or, both Golden Boot
// trees) with no edition-page coverage of their own - only Copa América's
// shape was ever audited, so a regression specific to, say, the Golden
// Boot's two-table "Memorable moments" layout (see the eleventh intensive
// run) wouldn't be caught here. The sixteenth intensive run added one
// edition page per remaining family (the latest completed edition of
// each), plus the English /records (previously only its Croatian sibling
// ran), /glossary and /compare - still nowhere near all 711 pages, but wide
// enough now to cover every page family's own layout at least once. The
// seventeenth intensive run swapped the player-profile pick from Alfredo Di
// Stéfano (2 Ballon d'Or wins, 1957 + 1959) to Lionel Messi (8 Ballon d'Or
// wins, the most of any player - see content/ballon-dor.md's "Multiple
// winners" table) since that sixteenth-run entry's own suggested next step
// was "one profile-heavy /players/ entry with a very long award list": a
// player profile's "awards" section (src/lib/playerProfile.ts) only ever
// renders Ballon d'Or/Golden Boot rows, so Messi's eight-row table is a
// meaningfully longer render than Di Stéfano's two-row one.
export const PAGES_TO_AUDIT = [
  { label: 'home', path: '/' },
  { label: 'records (heaviest page family, EN)', path: '/records/' },
  { label: 'hr/records (heaviest built page)', path: '/hr/records/' },
  { label: 'copa-america/2024 edition page', path: '/competitions/copa-america/2024/' },
  { label: 'world-cup/2026 edition page', path: '/competitions/world-cup/2026/' },
  { label: 'euro/2024 edition page', path: '/competitions/euro/2024/' },
  { label: 'nations-league/2024-25 edition page', path: '/competitions/nations-league/2024-25/' },
  { label: "ballon-dor/2025 edition page", path: '/competitions/ballon-dor/2025/' },
  {
    label: 'golden-boot/world-cup/2026 edition page',
    path: '/competitions/golden-boot/world-cup/2026/',
  },
  { label: 'golden-boot/euro/2024 edition page', path: '/competitions/golden-boot/euro/2024/' },
  { label: '/compare', path: '/compare/' },
  { label: '/compare-players', path: '/compare-players/' },
  { label: '/glossary', path: '/glossary/' },
  { label: '/quiz', path: '/quiz/' },
  { label: 'player profile (lionel-messi, 8 Ballon d\'Or wins)', path: '/players/lionel-messi/' },
  { label: 'team profile (argentina)', path: '/teams/argentina/' },
];

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

// Run 14 measured a perfect 1.00 on every category on every page. 0.9 leaves
// headroom for ordinary performance-metric timing noise (CPU contention on a
// shared runner) while still failing loudly on a real regression; if a
// genuine, deliberate trade-off ever lowers a score below this, raise the
// budget here the same considered way check-page-weight.mjs's budget has
// been raised over time - not by lowering it reflexively to silence a
// failure.
export const MIN_SCORE = 0.9;

function stopPreviewDaemon() {
  spawnSync(astroBin, ['preview', 'stop'], { cwd: ROOT, stdio: 'inherit' });
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

async function startPreviewDaemon() {
  stopPreviewDaemon();
  console.log('Starting `astro preview`...');
  spawnSync(astroBin, ['preview', '--port', PORT, '--host'], { cwd: ROOT, stdio: 'inherit' });
  await waitForServer(`${ORIGIN}${BASE}/`);
  console.log(`Preview server ready at ${ORIGIN}${BASE}/`);
}

async function launchChromium() {
  const launchOptions = {
    headless: true,
    args: [`--remote-debugging-port=${CDP_PORT}`],
  };
  if (process.env.PW_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PW_EXECUTABLE_PATH;
  } else if (process.env.PW_CHROME_CHANNEL) {
    launchOptions.channel = process.env.PW_CHROME_CHANNEL;
  }
  return chromium.launch(launchOptions);
}

/** Given a Lighthouse category-score map, which categories (if any) fall below MIN_SCORE. */
export function scoresBelowMin(categoryScores, minScore) {
  return Object.entries(categoryScores).filter(([, score]) => score < minScore);
}

async function auditPage({ label, path: pagePath }) {
  const url = `${ORIGIN}${BASE}${pagePath}`;
  const result = await lighthouse(url, {
    port: CDP_PORT,
    output: 'json',
    onlyCategories: CATEGORIES,
    logLevel: 'error',
  });
  const categoryScores = Object.fromEntries(
    CATEGORIES.map((key) => [key, result.lhr.categories[key].score]),
  );
  return { label, url, categoryScores };
}

async function main() {
  await startPreviewDaemon();
  const browser = await launchChromium();

  let results;
  try {
    results = [];
    for (const page of PAGES_TO_AUDIT) {
      const result = await auditPage(page);
      results.push(result);
      const summary = CATEGORIES.map((key) => `${key}: ${result.categoryScores[key].toFixed(2)}`).join(
        '  ',
      );
      console.log(`${result.label}\n  ${summary}`);
    }
  } finally {
    await browser.close();
    stopPreviewDaemon();
  }

  const failures = results.flatMap(({ label, categoryScores }) =>
    scoresBelowMin(categoryScores, MIN_SCORE).map(([category, score]) => ({ label, category, score })),
  );

  if (failures.length === 0) {
    console.log(`\nAll ${results.length} pages scored >= ${MIN_SCORE} in every category.`);
    return;
  }

  console.error(`\n${failures.length} category score(s) fell below the ${MIN_SCORE} budget:\n`);
  for (const { label, category, score } of failures) {
    console.error(`  ${label}: ${category} = ${score.toFixed(2)}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  stopPreviewDaemon();
  process.exitCode = 1;
});
