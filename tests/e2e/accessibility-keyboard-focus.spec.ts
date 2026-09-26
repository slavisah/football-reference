import { test, expect, type Page } from '@playwright/test';
import { openMenu } from './menu';

// A from-scratch keyboard-only walkthrough (Tab through every page family,
// reading the real focused element rather than another axe-core/Lighthouse
// sweep - neither tool audits WCAG 2.4.7 Focus Visible) turned up exactly one
// spot in the whole codebase where a focus outline is deliberately suppressed
// on the focused element itself: `.team-search__input:focus-visible {
// outline: none }` (Nav.astro), relied on because the *wrapping*
// `.team-search__field:focus-within` rule paints the outline around the
// whole field (icon + input) instead, so the ring reads as "this search box"
// rather than a thin line hugging just the caret. `grep -rn "outline: none"
// src/` confirms this is the only such override anywhere on the site - every
// other interactive element keeps the browser/global default focus-visible
// outline untouched - which makes it the one place a future edit could
// silently drop the outline-none override's replacement and leave keyboard
// users with no visible focus indicator at all on this control. Both search
// widgets (team and player) share the same `.team-search__field`/
// `.team-search__input` classes, so one pair of assertions covers both.
test.describe('search widgets keep a visible keyboard-focus indicator', () => {
  async function fieldAndInput(page: Page, inputId: string) {
    await page.goto('');
    await openMenu(page);
    const input = page.locator(`#${inputId}`);
    await input.focus();
    await expect(input).toBeFocused();
    const field = page.locator(`#${inputId}`).locator('xpath=ancestor::div[contains(@class, "team-search__field")]');
    return { input, field };
  }

  test('team search: the input suppresses its own outline, the field wrapper shows one', async ({
    page,
  }) => {
    const { input, field } = await fieldAndInput(page, 'team-search-input');

    const inputOutline = await input.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(inputOutline).toBe('none');

    const fieldStyle = await field.evaluate((el) => {
      const style = getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(fieldStyle.outlineStyle).not.toBe('none');
    expect(parseFloat(fieldStyle.outlineWidth)).toBeGreaterThan(0);
  });

  test('player search: the input suppresses its own outline, the field wrapper shows one', async ({
    page,
  }) => {
    const { input, field } = await fieldAndInput(page, 'player-search-input');

    const inputOutline = await input.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(inputOutline).toBe('none');

    const fieldStyle = await field.evaluate((el) => {
      const style = getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(fieldStyle.outlineStyle).not.toBe('none');
    expect(parseFloat(fieldStyle.outlineWidth)).toBeGreaterThan(0);
  });

  test('Croatian home page: the search widget keeps the same indicator', async ({ page }) => {
    await page.goto('hr/');
    await openMenu(page);
    const input = page.locator('#player-search-input');
    await input.focus();
    await expect(input).toBeFocused();
    const field = input.locator('xpath=ancestor::div[contains(@class, "team-search__field")]');
    const fieldOutline = await field.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(fieldOutline).not.toBe('none');
  });
});
