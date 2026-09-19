import { test, expect } from '@playwright/test';

// First no-JS coverage of any kind on this site (a hundred-and-thirty-
// seventh intensive run finding) - every existing e2e test drives the site
// with JavaScript enabled, the Playwright default, so nothing had ever
// exercised what a reader without JavaScript actually sees. /compare and
// /compare-players (both languages) support a shareable `?a=<id>&b=<id>`
// link - the nav's own "Find a team"/"Find a player" widgets send readers
// there, and the picker's own `writeParams()` keeps the URL in sync so a
// reader can copy/paste it to share a specific comparison. But reading those
// params and filling the panel is 100% client-side (`readParams()`/
// `render()` in each page's own inline script) - a static site has no server
// to read a request's query string at render time, so the pre-built HTML
// always shows the same default pair (the two most-titled teams/most-awarded
// players) regardless of the URL. Without JavaScript, following a shared
// `/compare?a=brazil&b=germany` link silently showed an unrelated default
// comparison (Argentina vs Uruguay) with no indication anything was off -
// a "silently wrong answer" rather than an error, the same defect shape as
// several other bugs this site's own manual-walkthrough passes have already
// found. Since a static site genuinely cannot honour the link's params
// without JavaScript, the fix is disclosure, not a full server-side fix: a
// `<noscript>` note naming the exact pair actually shown and stating plainly
// that neither the picker above nor a link's own params can change it
// without JavaScript enabled.
//
// Asserted against `page.content()` (the raw response HTML) rather than
// `page.locator('noscript').textContent()`: this environment's bundled
// Chromium (the same `/opt/pw-browsers/chromium` build documented elsewhere -
// see docs/PROJECT_STATUS.md's `hyphens: auto` entry for its other
// ICU-data gap - as a browser with its own real quirks, not a stand-in for
// every real browser) reads back an empty string from a `<noscript>`
// element's own DOM `textContent` under `javaScriptEnabled: false`, even
// though the exact same content is present in the response HTML and (per a
// full-page accessibility snapshot taken while debugging this test) is
// genuinely rendered. `page.content()` sidesteps that DOM-read quirk
// entirely by reading the response body directly. The companion "this note
// must stay invisible with JavaScript on" regression lives in
// tests/e2e/mobile.spec.ts's and tests/e2e/compare-players.spec.ts's own
// existing (JavaScript-enabled) describe blocks instead of here - a
// `javaScriptEnabled: false` set anywhere in this file was found, while
// building this test, to also affect any `browser.newContext()` created
// later in the same file/worker (not just the `page` fixture it's
// documented to configure), so a same-file "with JS this time" context
// can't be trusted to actually run with JavaScript enabled at all.
test.use({ javaScriptEnabled: false });

test.describe('compare pages without JavaScript', () => {
  test('/compare discloses that a shared link’s pair is ignored', async ({ page }) => {
    await page.goto('compare?a=brazil&b=germany');
    await expect(page.locator('#compare-a-name')).toHaveText('Argentina');
    await expect(page.locator('#compare-b-name')).toHaveText('Uruguay');
    const html = await page.content();
    expect(html).toContain(
      'This picker needs JavaScript to work. Without it, the comparison below is always Argentina vs Uruguay',
    );
  });

  test('/hr/compare discloses the same limitation in Croatian', async ({ page }) => {
    await page.goto('hr/compare?a=brazil&b=germany');
    await expect(page.locator('#compare-a-name')).toHaveText('Argentina');
    await expect(page.locator('#compare-b-name')).toHaveText('Uruguay');
    const html = await page.content();
    expect(html).toContain(
      'Za promjenu reprezentacija potreban je JavaScript. Bez njega usporedba ispod uvijek prikazuje Argentina protiv Uruguay',
    );
  });

  test('/compare-players discloses that a shared link’s pair is ignored', async ({ page }) => {
    await page.goto('compare-players?a=pele&b=diego-maradona');
    await expect(page.locator('#compare-a-name')).toHaveText('Lionel Messi');
    await expect(page.locator('#compare-b-name')).toHaveText('Cristiano Ronaldo');
    const html = await page.content();
    expect(html).toContain(
      'This picker needs JavaScript to work. Without it, the comparison below is always Lionel Messi vs Cristiano Ronaldo',
    );
  });

  test('/hr/compare-players discloses the same limitation in Croatian', async ({ page }) => {
    await page.goto('hr/compare-players?a=pele&b=diego-maradona');
    await expect(page.locator('#compare-a-name')).toHaveText('Lionel Messi');
    await expect(page.locator('#compare-b-name')).toHaveText('Cristiano Ronaldo');
    const html = await page.content();
    expect(html).toContain(
      'Za promjenu igrača potreban je JavaScript. Bez njega usporedba ispod uvijek prikazuje Lionel Messi protiv Cristiano Ronaldo',
    );
  });
});
