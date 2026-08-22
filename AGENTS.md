# AGENTS.md

## Mission

Build a fast, accessible, family-friendly football-history website from the Markdown in this repository.

## Non-negotiable rules

1. Treat `content/` as editorial source material.
2. Do not silently alter historical facts.
3. Preserve source links and historical-format notes.
4. Never scrape or copy copyrighted photographs into the repository.
5. Prefer static generation and progressive enhancement.
6. The site must work well on phones, tablets, and desktop screens.
7. Use accessible semantic HTML and keyboard-friendly controls.
8. Do not add advertising, gambling, betting odds, tracking pixels, or manipulative engagement features.
9. Make all filters shareable through URL query parameters.
10. Add automated schema and link validation.

## Recommended first milestone

Create a static site with:

- home page
- competition landing pages
- responsive tournament tables
- filters by country, year, host, and champion
- champions timelines
- print stylesheet
- light/dark mode
- source drawer or references section
- basic quizzes generated from structured content

## Mobile-first UI conventions

The 360px phone is the design target, not an afterthought - write the phone
layout as the base stylesheet state and use `min-width` media queries to
restore wider layouts, never the reverse. Patterns already established, worth
following rather than reinventing:

- **The header nav lives in a drawer** (`Nav.astro`) below `60rem`: brand plus
  one `#menu-toggle` button, everything else inside `#site-menu`. The button
  ships `hidden` and the drawer ships expanded; the inline script adds
  `.site-header--js` and reveals the button, so a reader without JavaScript
  keeps a full, always-visible header. Keep that no-JS fallback intact.
- **Comparisons are transposed, not stacked.** Two entities are compared in a
  single "versus" table - A's value, the statistic, B's value - one row per
  statistic (`/compare`, `/compare-players`). Two side-by-side tables put the
  numbers a reader wants to compare on different screens at 360px, which is
  the bug this pattern exists to prevent.
- **Interactive targets are at least 44px** in any touch-facing control.
- **Never signal state with colour alone**: pair it with weight, a marker or a
  shape, and add a `forced-colors: active` outline. Applies to leader cells,
  winner cells, and active listbox options alike.
- **Anything sticky below the header** reads its offset from the
  `--site-header-height` custom property `Nav.astro` measures at runtime;
  the header's real height varies by viewport, page and locale, so never
  hardcode it.

## Data extraction

For v1, Markdown tables may be parsed at build time. If this becomes awkward, introduce generated JSON under `generated/`; never make generated files the editorial source of truth.

## Definition of done

- `pnpm test`, `pnpm lint`, and `pnpm build` pass
- all pages are statically generated
- no horizontal overflow on a 360px viewport
- tables have accessible captions and column headers
- historical names are preserved where editorially relevant
- a visible “Last reviewed” date appears on each page
- e2e tests that drive a header control (nav link, either search widget, the
  language switch, the theme toggle) open the drawer first via
  `openMenu(page)` from `tests/e2e/menu.ts` - at the 360px test viewport those
  controls are collapsed behind the menu button
