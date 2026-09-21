import { test, expect } from '@playwright/test';
import { openMenu } from './menu';

// Every disclosure widget on the site (the mobile drawer, the desktop "More"
// menu, both search comboboxes) opens/closes/navigates off a native `click`
// listener rather than `pointerdown`/`touchstart`, specifically so a
// press-drag-release gesture - dragging to scroll the drawer, dragging to
// select text in a search input, a mouse drag that starts on one control and
// releases on another - never fires it: browsers only dispatch `click` when
// mousedown/mouseup (or a touch tap) land on the same interactive target, not
// after an intervening drag. That invariant had never actually been
// exercised with a real drag gesture anywhere in the suite - every existing
// menu/combobox test drives a plain `.click()`, which can't tell a genuine
// click apart from a click-terminated drag. These tests simulate the drag
// itself (`mouse.down()`/`mouse.move({ steps })`/`mouse.up()`) and assert the
// widget stays in its starting state: a hundred-and-thirty-sixth intensive
// run finding, closing out the "drag interaction, never attempted" angle
// prior runs left open. See docs/PROJECT_STATUS.md's matching entry.

test.describe('mobile drawer survives a drag gesture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await openMenu(page);
  });

  test('dragging over a nav link scrolls/selects without navigating or closing the drawer', async ({ page }) => {
    const link = page.locator('#nav-list li a').first();
    const box = await link.boundingBox();
    if (!box) throw new Error('nav link has no bounding box');

    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(box.x + 5, box.y + 200, { steps: 10 });
    await page.mouse.up();

    await expect(page).toHaveURL(/\/football-reference\/?$/);
    await expect(page.locator('#site-menu')).toHaveClass(/is-open/);
  });
});

test.describe('desktop "More" menu survives a drag gesture (>=60rem)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('');
  });

  test('a drag starting on the toggle and releasing elsewhere does not open the menu', async ({ page }) => {
    const toggle = page.locator('#nav-more-toggle');
    const box = await toggle.boundingBox();
    if (!box) throw new Error('nav-more-toggle has no bounding box');

    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300, { steps: 10 });
    await page.mouse.up();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-more-menu')).toBeHidden();
  });

  test('a drag starting elsewhere and releasing on the toggle does not open the menu', async ({ page }) => {
    const toggle = page.locator('#nav-more-toggle');
    const box = await toggle.boundingBox();
    if (!box) throw new Error('nav-more-toggle has no bounding box');

    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 5, box.y + 5, { steps: 10 });
    await page.mouse.up();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-more-menu')).toBeHidden();
  });
});

test.describe('search combobox survives a drag gesture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await openMenu(page);
  });

  test('dragging from the team-search input into a result does not navigate away', async ({ page }) => {
    const input = page.locator('#team-search-input');
    await input.click();
    // Nav.astro's combobox listens for the input event, which fill() fires
    // just as well as the deprecated type() API this replaces - no need to
    // simulate real per-keystroke key events for a single-character value.
    await input.fill('a');
    const option = page.locator('#team-search-listbox li').first();
    await expect(option).toBeVisible();

    const inputBox = await input.boundingBox();
    const optionBox = await option.boundingBox();
    if (!inputBox || !optionBox) throw new Error('input or option has no bounding box');

    await page.mouse.move(inputBox.x + 5, inputBox.y + 5);
    await page.mouse.down();
    await page.mouse.move(optionBox.x + 5, optionBox.y + 5, { steps: 10 });
    await page.mouse.up();

    await expect(page).toHaveURL(/\/football-reference\/?$/);
  });
});
