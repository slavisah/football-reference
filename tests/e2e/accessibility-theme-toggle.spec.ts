import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openMenu } from './menu';

// The main accessibility.spec.ts sweep loads every page once per color scheme
// via Playwright's `colorScheme` emulation - it never actually clicks the
// theme-toggle button itself. That leaves the one truly interactive,
// client-side state change on every page of the site (`ThemeToggle.astro`)
// with zero test coverage of any kind before this run - not a Vitest unit
// test (there is no pure function here, it's a DOM script), not a Playwright
// functional test, not an axe pass. docs/PROJECT_STATUS.md's prior
// "Left for a future pass" note named exactly this gap: "the theme-toggle
// button's actual click interaction... has not been driven through axe as a
// live state change."

async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice', 'experimental', 'ACT', 'review-item'])
    .disableRules(['region', 'color-contrast-enhanced'])
    .analyze();
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

type AxeViolations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

function formatViolations(violations: AxeViolations): string {
  if (violations.length === 0) return '';
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
      return `${violation.id} (${violation.impact}): ${violation.help}\n  affected: ${targets}\n  see: ${violation.helpUrl}`;
    })
    .join('\n\n');
}

test.describe('theme toggle, English home page', () => {
  test('click toggles theme, aria-pressed, label text, and persists via localStorage', async ({
    page,
  }) => {
    await page.goto('');

    await openMenu(page);
    const toggle = page.locator('#theme-toggle');
    const label = page.locator('#theme-toggle .theme-toggle__label');
    const themeColorMeta = page.locator('#theme-color-meta');

    // Fresh visit, no saved preference: the client script's sync() runs once
    // on load and falls back to the emulated OS color scheme (Playwright's
    // default is 'light', per playwright.config.ts not overriding it here),
    // so both the label and aria-pressed already reflect "light" before any
    // click - not the static "Theme" text that only appears in the
    // server-rendered markup for a split second before hydration.
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(label).toHaveText('Light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
    // BaseLayout's before-paint script resolves the same light default and
    // points the mobile browser-chrome tint at --light-accent (global.css) -
    // confirming it never ships stuck on the server-rendered fallback value.
    await expect(themeColorMeta).toHaveAttribute('content', '#1f6f4f');

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(label).toHaveText('Dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
    // --dark-accent (global.css), so a dark-mode reader's browser chrome
    // tints to the same green the toggle icon/accent color already uses.
    await expect(themeColorMeta).toHaveAttribute('content', '#46c08a');

    // The click itself introduces no new DOM, but the whole page's rendered
    // colors are now driven by the dark palette - confirm that live state
    // still meets WCAG, not just the emulated colorScheme in
    // accessibility.spec.ts.
    await runAxe(page);

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(label).toHaveText('Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    await expect(themeColorMeta).toHaveAttribute('content', '#1f6f4f');

    await runAxe(page);
  });

  // Regression coverage for a real gap: before this run, the theme-toggle's
  // own visible label/aria-pressed and the theme-color meta tag only ever
  // resolved the OS color scheme once, at load - a reader who never clicked
  // the toggle but whose OS switched theme mid-session (e.g. a scheduled
  // dark-mode switch at sunset) would keep seeing "Light"/aria-pressed=false
  // and the light-mode browser-chrome tint until their next full reload,
  // even though every CSS color token already updated live via global.css's
  // own `@media (prefers-color-scheme: dark)` block.
  test('a live OS color-scheme change updates the toggle and theme-color meta without a reload, unless a manual choice was saved', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    await openMenu(page);

    const toggle = page.locator('#theme-toggle');
    const label = page.locator('#theme-toggle .theme-toggle__label');
    const themeColorMeta = page.locator('#theme-color-meta');

    await expect(label).toHaveText('Light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(themeColorMeta).toHaveAttribute('content', '#1f6f4f');

    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(label).toHaveText('Dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(themeColorMeta).toHaveAttribute('content', '#46c08a');
    // No manual choice was ever made by clicking the toggle, so this stays
    // an OS-driven preference, not a saved override.
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

    // Once a reader does make a manual choice, it must stick even if the OS
    // preference changes again afterward - the same "manual override wins"
    // rule `current()`/ThemeToggle's change-listener guard already apply.
    await toggle.click();
    await expect(label).toHaveText('Light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(label).toHaveText('Light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(themeColorMeta).toHaveAttribute('content', '#1f6f4f');
  });

  // Regression test for a real bug: `.site-menu.is-open` (the mobile drawer)
  // switches to `flex-direction: column` but, until fixed, kept inheriting
  // `.site-menu`'s own row-layout `flex-wrap: wrap` - so once the drawer's
  // stacked content (nav list + both search fields + lang switch + theme
  // toggle) grew taller than the drawer's own `max-height`, the column
  // wrapped into a second column pushed off past the viewport's right edge
  // instead of just overflowing vertically for `overflow-y: auto` to scroll.
  // The theme toggle, last in DOM order, landed almost entirely outside the
  // 360px viewport - invisible to a real touch/mouse user, even though every
  // other test in this file kept passing: `.click()` and attribute
  // assertions don't check whether an element is visually within its
  // scrollable container's own bounds, and `document.documentElement`'s own
  // scrollWidth never grew, because the drawer's own contained overflow-x
  // (computed 'auto' per spec, since only overflow-y was set) never
  // propagates to the document root - the exact blind spot
  // `check:reflow`/"the open drawer adds no horizontal overflow" (both of
  // which only ever measure document-level overflow) share.
  test('the theme toggle stays inside the drawer, not wrapped into an off-screen column', async ({
    page,
  }) => {
    await page.goto('');
    await openMenu(page);

    const menuBox = (await page.locator('#site-menu').boundingBox())!;
    // The language switch is the drawer's previous item in DOM order, inset
    // by the same padding as the toggle - the right basis for "same column,
    // full-width" rather than the padded `#site-menu` box itself.
    const langSwitchBox = (await page.locator('.lang-switch').boundingBox())!;
    const toggleBox = (await page.locator('#theme-toggle').boundingBox())!;

    // Same column, same width as its sibling controls - not sized down to
    // its own content and shunted into a second column.
    expect(toggleBox.x).toBeCloseTo(langSwitchBox.x, 0);
    expect(toggleBox.width).toBeCloseTo(langSwitchBox.width, 0);
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(menuBox.x + menuBox.width + 1);

    // Stacked after the language switch (the previous item in DOM order),
    // not floated back up to the top of a phantom next column.
    expect(toggleBox.y).toBeGreaterThan(langSwitchBox.y);
  });

  test('is keyboard-operable and the saved choice survives a reload', async ({ page }) => {
    await page.goto('');

    await openMenu(page);
    const toggle = page.locator('#theme-toggle');
    await toggle.focus();
    await expect(toggle).toBeFocused();

    // Native <button> elements activate on both Enter and Space; a reader
    // relying on a keyboard alone must be able to use either.
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    // Reloading re-runs BaseLayout's before-paint inline script, which reads
    // localStorage - the saved choice must survive a real navigation, not
    // just live in the current page's in-memory DOM state.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#theme-toggle .theme-toggle__label')).toHaveText('Dark');
  });
});

// The home page has no `is-winner` table cells or `is-correct`/`is-incorrect`
// quiz feedback - those contrast-sensitive dynamic states only exist on a
// competition page and /quiz. The prior entry's "Left for a future pass"
// note named exactly this gap: the live-click toggle path (real
// `data-theme` attribute + real ThemeToggle click, as opposed to
// `accessibility.spec.ts`'s `colorScheme` emulation) had only ever been
// exercised against the home page, so these two states had only ever been
// checked against the *emulated* dark palette, never the toggle-driven one.
test.describe('theme toggle, World Cup competition page', () => {
  test('live-click dark mode has no WCAG violations with is-winner cells visible', async ({
    page,
  }) => {
    await page.goto('competitions/world-cup');

    // Confirm the state this test exists to cover is actually present before
    // toggling, so a future markup change that drops the winner column can't
    // make this test pass vacuously.
    await expect(page.locator('#world-cup-table td.is-winner').first()).toBeVisible();

    await openMenu(page);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await runAxe(page);

    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await runAxe(page);
  });
});

test.describe('theme toggle, quiz page', () => {
  test('live-click dark mode has no WCAG violations with answered is-correct/is-incorrect states', async ({
    page,
  }) => {
    await page.goto('quiz');

    await openMenu(page);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Close the drawer before touching the quiz cards below it - now that it
    // correctly stacks every control in one column (see the fixed
    // `flex-wrap` bug this file's "stays inside the drawer" test guards),
    // its own scrollable height legitimately spans nearly the full viewport
    // at this screen size, covering the first couple of cards otherwise.
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#site-menu')).toBeHidden();

    // Answer the first two choice cards - one right, one deliberately wrong -
    // so both feedback classes render under the toggle-driven dark palette,
    // the same "one correct, one incorrect" pattern
    // accessibility-quiz-states.spec.ts uses for the colorScheme-emulated
    // sweep.
    const cards = page.locator('.quiz-card').filter({ has: page.locator('input[type="radio"]') });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 2; i += 1) {
      const card = cards.nth(i);
      const answerIndex = Number(await card.getAttribute('data-answer-index'));
      const radios = card.locator('input[type="radio"]');
      const radioCount = await radios.count();
      const pick = i === 0 ? answerIndex : (answerIndex + 1) % radioCount;
      await radios.nth(pick).check();
      await card.locator('.quiz-card__check').click();
    }

    await expect(page.locator('.quiz-card__choice.is-correct').first()).toBeVisible();
    await expect(page.locator('.quiz-card__choice.is-incorrect').first()).toBeVisible();

    await runAxe(page);
  });
});

// Canary coverage in the Croatian translation, confirming the toggle's
// localized labels (data-light-label/data-dark-label, wired through
// ThemeToggle's `locale` prop) actually reach the live-updated label text -
// not just the initial server render, which the main accessibility.spec.ts
// sweep already covers.
test.describe('theme toggle, Croatian home page', () => {
  test('click toggles the Croatian label text', async ({ page }) => {
    await page.goto('hr/');

    await openMenu(page);
    const toggle = page.locator('#theme-toggle');
    const label = page.locator('#theme-toggle .theme-toggle__label');

    // Same sync()-on-load reasoning as the English test: the label starts at
    // the Croatian "light" word, not the static "Tema" heading text.
    await expect(label).toHaveText('Svijetla');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(label).toHaveText('Tamna');
    await runAxe(page);

    await toggle.click();
    await expect(label).toHaveText('Svijetla');
  });
});
