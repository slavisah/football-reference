import { defineConfig, devices } from '@playwright/test';

// One critical mobile smoke test. Playwright builds the static site and serves
// the production preview, then drives it at a narrow phone viewport.
const PORT = 4321;
const BASE = '/football-reference';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'list',
  use: {
    // Trailing slash matters: a relative goto('competitions/...') then resolves
    // under the /football-reference/ base rather than replacing it.
    baseURL: `http://localhost:${PORT}${BASE}/`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        // Pin the width to the 360px requirement from the brief.
        viewport: { width: 360, height: 740 },
        // Use the system-installed Chrome channel when it is present (set
        // PW_CHROME_CHANNEL=chrome), otherwise fall back to bundled Chromium
        // (which CI installs with `pnpm test:e2e:install`).
        ...(process.env.PW_CHROME_CHANNEL
          ? { channel: process.env.PW_CHROME_CHANNEL }
          : {}),
        ...(process.env.PW_EXECUTABLE_PATH
          ? { launchOptions: { executablePath: process.env.PW_EXECUTABLE_PATH } }
          : {}),
      },
    },
  ],
  webServer: {
    // scripts/test-preview-server.mjs wraps `astro preview`: Astro 7 made
    // `astro preview` always fork into a detached background daemon and
    // return immediately once it's listening, which Playwright's webServer
    // treats as "exited early" on a fresh spawn (see that script's own doc
    // comment for the full story and why the 2026-08-23 Astro upgrade
    // didn't catch this).
    command: 'pnpm build && node scripts/test-preview-server.mjs',
    url: `http://localhost:${PORT}${BASE}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { PORT: String(PORT), BASE_PATH: BASE },
  },
});
