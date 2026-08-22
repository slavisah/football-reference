# Implementation Notes

Milestone 1 of **The Ultimate Football Reference**: the smallest polished,
deployable slice of the site, built with Astro + TypeScript and deployable to
GitHub Pages.

## What is implemented

- Shared page shell (`BaseLayout`), sticky navigation, and footer.
- Home page with live champion counts pulled from the content tables.
- FIFA World Cup and UEFA EURO competition pages.
- A reusable, responsive tournament table that becomes labelled cards on narrow
  screens (no horizontal overflow at 360px).
- Filter by **winner** and **year**, kept in the URL so any view is shareable,
  with a screen-reader status line and keyboard-operable native controls.
- A **generated** champions summary (title counts + winning years) derived from
  the edition table, not a hand-maintained list.
- References section per competition with source links and a visible
  `lastReviewed` date, plus a content status badge.
- Accessible print styles (A4 landscape; the table prints in full even when the
  on-screen filter has hidden rows).
- Light and dark themes: follows the OS by default, with a toggle that persists
  in `localStorage` and applies before paint (no flash).

## Architecture and decisions

- **Markdown stays the source of truth.** Files under `content/` are loaded with
  Astro's content-collection glob loader. Front matter is validated with a zod
  schema in `src/content.config.ts`; a malformed file fails the build.
- **Tables are parsed at build time.** `src/lib/markdownTable.ts` is a small,
  dependency-free GitHub-flavoured-Markdown table parser. `src/lib/editions.ts`
  normalizes rows into structured editions while preserving every original cell
  for display. No `generated/` JSON is introduced yet; it was not needed.
- **Validation** (`src/lib/validate.ts`) implements the checks from
  `docs/CONTENT_MODEL.md`: required winner, parseable year, positive team count,
  unique year/season (with an `allowDuplicateYears` escape hatch for cases like
  the two 1959 South American Championships), no duplicate headers, and one cell
  per column. Failures throw and stop the build.
- **Champions grouping is deliberately tiny** (`src/lib/countries.ts`): only the
  West Germany / Germany continuity is merged for title *counts*, because that is
  the single grouping the editorial content itself makes. Every other name is
  counted exactly as written. Edition tables always show the historical name.
- **Source links** are extracted from `docs/SOURCES.md` at build time so the
  references section cannot drift from the editorial source list.
- **Base path is repository-agnostic.** `astro.config.mjs` reads `SITE_URL` and
  `BASE_PATH` from the environment; the deploy workflow fills them from
  `actions/configure-pages`, so the site works regardless of the repo name.

## Content caveats (nothing was silently "corrected")

- Historical names are preserved verbatim: *West Germany*, *Soviet Union*,
  *Czechoslovakia*, *Türkiye*, *Yugoslavia*, etc. They therefore appear as
  distinct entries in the winner filter (e.g. both "West Germany" and "Germany").
- EURO uses neutral "other semifinalist" wording from 1984 onward, matching the
  editorial guide; the table headers are rendered exactly as authored.
- The generated Germany total (WC = 4, EURO = 3) matches the hand-written totals
  in the content. The hand-written "Champions by titles" tables in the Markdown
  are intentionally *not* rendered; the page generates that summary instead.
- World Cup and EURO are the only two competitions surfaced in Milestone 1. The
  other content files (Copa América, Nations League, Ballon d'Or, Golden Boot,
  Records) are still validated as front matter but do not yet have pages.

## Tests

- **Vitest** unit tests (`tests/unit/`): table parser, edition normalization,
  champions grouping/sorting, winner list, validation success/failure paths, and
  source extraction. 19 tests.
- **Playwright** mobile smoke test (`tests/e2e/mobile.spec.ts`) at a 360px
  viewport: no horizontal overflow, find the 2018 champion, filter to Spain's
  title years, keyboard-operate + reset the filters, and see the `lastReviewed`
  date and source links.

### Running locally

```bash
pnpm install
pnpm lint        # astro check (types)
pnpm test        # vitest unit tests
pnpm build       # static output to dist/
pnpm dev         # local dev server

# Mobile smoke test. If Playwright's bundled Chromium is not installed,
# either run `pnpm test:e2e:install`, or reuse system Chrome:
PW_CHROME_CHANNEL=chrome pnpm test:e2e
```

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and publishes
`dist/` to GitHub Pages. It runs `pnpm lint` and `pnpm test` before building,
but intentionally skips the Playwright smoke test to keep the deploy fast.
`.github/workflows/ci.yml` runs on every pull request instead: lint, unit
tests, `pnpm test:e2e:install`, then the full Playwright mobile smoke test
against a production preview build.

To enable hosting: in the repository settings, set **Pages → Build and
deployment → Source** to **GitHub Actions**.

## Next logical milestone

Every page and capability named in `docs/WEBSITE_REQUIREMENTS.md` is live,
including `/about/sources`, sort controls that preserve historical notes,
full Croatian/English localization, and the "by team" filter (shipped
2026-08-03: `TournamentTable.astro`'s `teams` prop/`<select>`, filtering by
any team that appears in a Winner/Runner-up/Third/Fourth/semifinalist
column) - see `docs/PROJECT_STATUS.md` for the complete, continuously-updated
list (it now also covers `/compare`, `/teams`, a PWA/offline mode,
downloadable print PDFs, and an "On this day" widget, none of which existed
when this section was last accurate).
**Correction (2026-08-20 intensive run):** this section previously named the
"by team" filter as the one still-missing requirement. That was stale - the
filter has been live since 2026-08-03; the note only ever meant a *stricter*
reading (full per-edition participant lists, not just teams that reached the
latter stages) would need new editorial content, but stated it as if the
filter didn't exist at all. See `docs/PROJECT_STATUS.md`'s 2026-08-20
"Correction" entry for the full explanation. `docs/PROJECT_STATUS.md`'s own
"Left for a future pass" notes are the accurate, current source of truth for
what (if anything) remains; this file only covers the original Milestone-1
slice.
