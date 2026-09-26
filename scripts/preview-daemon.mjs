// Shared `astro preview` daemon start/stop and headless-Chromium launcher,
// used by every full-site sweep script that needs a running preview server
// to load pages against (check-reflow.mjs, check-text-zoom.mjs,
// check-print-width.mjs, check-lighthouse.mjs). Each of those four
// previously carried its own byte-identical copy of this dance; extracted
// here so the flakiness fix below only has to exist once.
//
// See docs/PROJECT_STATUS.md's hundred-and-forty-eighth intensive run entry:
// running several of those scripts back-to-back in the same shell
// occasionally left one of them failing with a bare `{ log: [], name:
// 'Error' }` and no other detail, then passing cleanly when re-run in
// isolation immediately afterward with no code change in between -
// diagnosed there as a transient `astro preview` start/stop timing race
// between scripts sharing the same port, and left as a "future pass could
// add a readiness wait or a retry-once wrapper" suggestion rather than
// shipped. This module is that fix: `astro preview stop`'s own CLI call
// returns as soon as the *stop command* finishes, not once the OS has
// actually released the port, so `stopPreviewDaemon()` now polls the port
// itself until it actually refuses connections before returning, and
// `startPreviewDaemon()` retries the whole stop/start/wait-for-ready dance
// once more if the first attempt doesn't come up cleanly.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const astroBin = path.join(ROOT, 'node_modules', '.bin', 'astro');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll `url` until it starts refusing connections (the port is free) or `timeoutMs` elapses. */
async function waitForPortFree(url, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url);
      await sleep(150);
    } catch {
      return;
    }
  }
}

/** Poll `url` until it responds `ok`, or throw once `timeoutMs` elapses. */
export async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(300);
  }
  throw new Error(`Preview server at ${url} did not become ready in time`);
}

/** Stop any running `astro preview` daemon and wait until its port is actually free. */
export async function stopPreviewDaemon(port = process.env.PORT ?? '4321') {
  spawnSync(astroBin, ['preview', 'stop'], { cwd: ROOT, stdio: 'inherit' });
  await waitForPortFree(`http://localhost:${port}/`);
}

async function launchPreviewOnce(port, base) {
  spawnSync(astroBin, ['preview', '--port', String(port), '--host'], { cwd: ROOT, stdio: 'inherit' });
  await waitForServer(`http://localhost:${port}${base}/`);
}

/**
 * Start a fresh `astro preview` daemon, stopping any prior one on the same
 * port first. Retries the whole stop/start/wait-for-ready sequence once more
 * if the first attempt doesn't come up cleanly, since `waitForPortFree`
 * closes off most of the race but a slow-starting daemon (or a port some
 * other process is briefly holding) can still make the first attempt fail.
 */
export async function startPreviewDaemon({
  port = process.env.PORT ?? '4321',
  base = process.env.BASE_PATH ?? '/football-reference',
} = {}) {
  const origin = `http://localhost:${port}`;
  await stopPreviewDaemon(port);
  console.log('Starting `astro preview`...');
  try {
    await launchPreviewOnce(port, base);
  } catch (error) {
    console.warn(`Preview server did not come up cleanly (${error.message}); retrying once...`);
    await stopPreviewDaemon(port);
    await launchPreviewOnce(port, base);
  }
  console.log(`Preview server ready at ${origin}${base}/`);
}

/** Launch headless Chromium, honoring this sandbox's PW_EXECUTABLE_PATH/PW_CHROME_CHANNEL escape hatches. */
export async function launchChromium(extraArgs = []) {
  const launchOptions = { headless: true };
  if (extraArgs.length > 0) launchOptions.args = extraArgs;
  if (process.env.PW_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PW_EXECUTABLE_PATH;
  } else if (process.env.PW_CHROME_CHANNEL) {
    launchOptions.channel = process.env.PW_CHROME_CHANNEL;
  }
  return chromium.launch(launchOptions);
}
