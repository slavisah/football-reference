import type { Page } from '@playwright/test';

// Every e2e project runs at a 360px viewport (playwright.config.ts), where
// the header's nav links, both search widgets, the language switch and the
// theme toggle live inside the collapsed #site-menu drawer (Nav.astro).
// Tests that drive any of those controls open the drawer first. Idempotent:
// calling it when the drawer is already open, or on a viewport wide enough
// that the menu button is gone, does nothing.
export async function openMenu(page: Page): Promise<void> {
  const toggle = page.locator('#menu-toggle');
  if (!(await toggle.isVisible())) return;
  if ((await toggle.getAttribute('aria-expanded')) === 'true') return;
  await toggle.click();
}
