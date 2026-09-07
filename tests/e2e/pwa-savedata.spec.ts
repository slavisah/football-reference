import { test, expect, chromium, type LaunchOptions } from '@playwright/test';

// Real end-to-end coverage of installCacheUrls()'s Save-Data branch
// (src/pages/sw.js.ts), using the real browser Data-Saver signal instead of
// only asserting the generated script's source text (see the companion test
// below). This is possible via the Chrome DevTools Protocol's
// `Emulation.setDataSaverOverride` - but only if the override is applied to
// the service worker's *own* CDP target, not the page's: a page-level
// `context.newCDPSession(page)` override does change that page's own
// `navigator.connection.saveData`, but does not propagate to the separate
// worker execution context the service worker actually runs in, which is
// what `self.navigator.connection.saveData` reads. Playwright's public API
// has no way to reach a service worker's own CDP session, so this drives the
// devtools websocket directly: pause every newly created target on start
// (`Target.setAutoAttach` with `waitForDebuggerOnStart`), apply the override
// to the service worker target specifically before releasing it, and let
// every other target resume immediately.
const CDP_PORT = 9234; // Distinct from scripts/check-lighthouse.mjs's own 9223.
const PORT = 4321; // Matches playwright.config.ts's PORT.
const BASE = '/football-reference'; // Matches playwright.config.ts's BASE.

function chromiumLaunchOptions(): LaunchOptions {
  const options: LaunchOptions = { args: [`--remote-debugging-port=${CDP_PORT}`] };
  if (process.env.PW_EXECUTABLE_PATH) {
    options.executablePath = process.env.PW_EXECUTABLE_PATH;
  } else if (process.env.PW_CHROME_CHANNEL) {
    options.channel = process.env.PW_CHROME_CHANNEL;
  }
  return options;
}

type CdpMessage = {
  id?: number;
  method?: string;
  params?: { targetInfo?: { type?: string }; sessionId?: string };
  result?: unknown;
};

/**
 * Connects to the browser's own devtools websocket and overrides
 * `navigator.connection.saveData` for the very next service worker target
 * that starts, before it processes its `install` event. Resolves once that
 * override is armed (the worker itself may not have started yet).
 */
async function armDataSaverForNextServiceWorker(port: number): Promise<() => void> {
  const { webSocketDebuggerUrl } = (await (
    await fetch(`http://localhost:${port}/json/version`)
  ).json()) as { webSocketDebuggerUrl: string };

  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', () => reject(new Error('CDP websocket connection failed')));
  });

  let nextId = 1;
  const pending = new Map<number, (msg: CdpMessage) => void>();

  function send(method: string, params: Record<string, unknown> = {}, sessionId?: string) {
    return new Promise<CdpMessage>((resolve) => {
      const id = nextId++;
      pending.set(id, resolve);
      const payload: Record<string, unknown> = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(String(event.data)) as CdpMessage;
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)!(msg);
      pending.delete(msg.id);
      return;
    }
    if (msg.method === 'Target.attachedToTarget' && msg.params?.sessionId) {
      const { targetInfo, sessionId } = msg.params;
      void (async () => {
        if (targetInfo?.type === 'service_worker') {
          await send('Emulation.setDataSaverOverride', { dataSaverEnabled: true }, sessionId);
        }
        await send('Runtime.runIfWaitingForDebugger', {}, sessionId);
      })();
    }
  });

  await send('Target.setDiscoverTargets', { discover: true });
  await send('Target.setAutoAttach', {
    autoAttach: true,
    waitForDebuggerOnStart: true,
    flatten: true,
  });

  return () => ws.close();
}

test.describe('Service worker install-time Save-Data behavior (real CDP emulation)', () => {
  test('a Data-Saver reader only gets the two home pages precached on install', async () => {
    const browser = await chromium.launch(chromiumLaunchOptions());
    try {
      const disarm = await armDataSaverForNextServiceWorker(CDP_PORT);
      try {
        const context = await browser.newContext({ serviceWorkers: 'allow' });
        const page = await context.newPage();
        await page.goto(`http://localhost:${PORT}${BASE}/`);
        await page.evaluate(() => navigator.serviceWorker.ready);

        const cachedPaths = await page.evaluate(async () => {
          const cacheNames = await caches.keys();
          const cache = await caches.open(cacheNames[0]);
          const requests = await cache.keys();
          return requests.map((request) => new URL(request.url).pathname);
        });

        expect(cachedPaths.sort()).toEqual(
          [`${BASE}/`, `${BASE}/hr/`].sort(),
        );
      } finally {
        disarm();
      }
    } finally {
      await browser.close();
    }
  });

  test('the generated service worker script reads the real Save-Data signal', async ({ page }) => {
    // A fast, browser-emulation-free companion to the real test above: pins
    // the exact source shape selectInstallCacheUrls()/installCacheUrls()
    // must keep so a future edit that silently drops the check is caught
    // even without the slower real-CDP path.
    await page.goto('');
    const swSource = await page.evaluate(async () => {
      const response = await fetch('/football-reference/sw.js');
      return response.text();
    });
    expect(swSource).toContain('self.navigator.connection.saveData');
    expect(swSource).toContain('cache.addAll(installCacheUrls())');
    expect(swSource).toMatch(
      /return saveData \? Array\.from\(new Set\(\[HOME_URL_EN, HOME_URL_HR\]\)\) : PRECACHE_URLS;/,
    );
  });
});
