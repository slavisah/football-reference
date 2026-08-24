// Wraps `astro preview` for Playwright's `webServer.command`
// (playwright.config.ts).
//
// Playwright's `webServer` feature expects `command` to keep running in the
// foreground for the whole test run - if the spawned process exits, even
// with code 0, Playwright reports "Process from config.webServer exited
// early" and aborts before running any tests. Astro 7 changed `astro
// preview` (and `astro dev`) to always fork its real server into a detached
// background daemon and let the invoking CLI process return as soon as the
// server is confirmed listening (see `astro preview status`/`stop`) - this
// broke that assumption for every *fresh* invocation (no daemon already
// running), which is exactly what a clean checkout in CI does on every PR
// (.github/workflows/ci.yml's "Mobile smoke test" step calls `pnpm
// test:e2e` with nothing else running first). It went unnoticed by the
// 2026-08-23 Astro 5->7 upgrade's own validation only because
// `reuseExistingServer: !process.env.CI` (below) silently reused a preview
// server left over from earlier manual testing in that same local session,
// instead of ever exercising a truly fresh spawn the way CI does.
//
// This script starts the daemon, waits for it to answer, then blocks
// forever so Playwright sees a live foreground process for as long as the
// test run needs one; on SIGTERM (how Playwright stops `webServer.command`
// once the run finishes) it stops the daemon via `astro preview stop`
// before exiting, so no background process is left running afterward.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = process.env.PORT ?? '4321';
const BASE = process.env.BASE_PATH ?? '/football-reference';
const ORIGIN = `http://localhost:${PORT}`;
const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');

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

function stopDaemon() {
  // Safe to call even when nothing is running (astro preview stop just
  // reports "No preview server is running" and exits 0) - used both as
  // start-of-run cleanup for a daemon stranded by an earlier interrupted run
  // and as this script's own shutdown step.
  spawnSync(astroBin, ['preview', 'stop'], { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  stopDaemon();

  console.log('Starting `astro preview`...');
  spawnSync(astroBin, ['preview', '--port', PORT, '--host'], { cwd: ROOT, stdio: 'inherit' });
  await waitForServer(`${ORIGIN}${BASE}/`);
  console.log(`Preview server ready at ${ORIGIN}${BASE}/`);

  const shutdown = () => {
    stopDaemon();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Block forever - the actual HTTP server already lives in the detached
  // daemon `astro preview` just started; this process only needs to stay
  // alive so Playwright doesn't treat its exit as a startup failure. A bare
  // `await new Promise(() => {})` does NOT do that on its own - an
  // unresolved promise with nothing else pending isn't a libuv handle, so
  // Node's event loop still sees "nothing left to do" and exits right after
  // this line, taking the still-running daemon's own readiness with it
  // (confirmed empirically: that was the first version of this script, and
  // it caused this exact "exited early" failure by exiting a few hundred ms
  // after printing "ready", every time). A recurring timer is a real handle
  // that keeps the event loop - and therefore this process - alive until
  // `shutdown()` above calls `process.exit()` explicitly.
  await new Promise(() => setInterval(() => {}, 60_000));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
