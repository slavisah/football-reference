# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full history of every feature, bug fix and decision
lives in `docs/PROJECT_STATUS.md` (append-only, one entry per change); this
file only tracks the open backlog, not the log of what already shipped.

## Status: original backlog complete

Every milestone named in `AGENTS.md`'s "Recommended first milestone" and
every requirement in `docs/WEBSITE_REQUIREMENTS.md` is live, in English and
Croatian: all six competition/award pages (FIFA World Cup, UEFA EURO, UEFA
Nations League, Copa América, Men's Ballon d'Or, Golden Boot), `/records`,
`/compare`, `/compare-players`, `/teams/<slug>` and `/players/<slug>`
profile directories, `/glossary`, the Family Quiz, per-edition pages for
every competition and both individual awards
(`/competitions/<competition>/<year>`), light/dark mode, a print stylesheet,
downloadable print PDFs, a PWA/offline mode, and an "On this day" widget.
See `docs/PROJECT_STATUS.md`'s "Known caveats" section (near the end of the
file) for the authoritative, always-current summary of what exists and any
standing quirks.

## Open backlog

- **Per-edition print PDFs**: closed 2026-08-25 - every
  `/competitions/<competition>/<year>` page (and its Croatian sibling) now
  has a downloadable PDF, the same "Download printable PDF" convention every
  other page family already had. See `docs/PROJECT_STATUS.md`'s matching
  entry for the implementation.
- **Per-edition SportsEvent JSON-LD**: closed 2026-08-25 (fifth intensive
  run) - every `/competitions/<competition>/<year>` page (all 14 route
  files, EN + HR) now carries its own `SportsEvent` structured-data block
  via the new `buildEditionSportsEvent()` (`src/lib/jsonLd.ts`), closing a
  gap `EditionProfile.champion`'s own doc comment had predicted since the
  edition-page rollout but that was never actually wired up. See
  `docs/PROJECT_STATUS.md`'s matching entry for the implementation.
- **Ballon d'Or/Golden Boot index-page SportsEvent**: closed 2026-08-25
  (sixth intensive run) - `ballon-dor.astro` and `golden-boot.astro` (both
  EN + HR) now call `buildLatestEditionSportsEvent()` the same way the four
  team-competition index pages already did. Resolved the "generic title"
  blocker by passing an explicit per-award name at each call site instead of
  reusing `loadCompetition()`'s content-frontmatter `title`: Ballon d'Or
  keeps `data.title`/the page's own Croatian `title` constant (already
  unambiguous, one table per page), while Golden Boot's two same-titled
  loads each get their own name ("FIFA World Cup Golden Boot"/"UEFA EURO
  Golden Boot", "Zlatna kopačka Svjetskog prvenstva"/"Zlatna kopačka EURA"),
  matching the convention the per-edition Golden Boot pages already
  established. See `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **Test-coverage sweep (edition/player/compare-player linking)**: closed
  2026-08-26 (seventh intensive run) - `src/lib/editionProfile.ts`,
  `comparePlayers.ts` and `playerProfile.ts` are now 100%/100%
  statement/branch coverage; the four remaining sub-100%-branch lines
  (`quiz.ts` line 283, `sources.ts` line 33, `tableSort.ts` line 22, `url.ts`
  line 8) stay as-is, unchanged from the 2026-08-23 sweep that classified
  them as defensively unreachable given the code's own invariants, not
  undertested - see `docs/PROJECT_STATUS.md`'s matching entry.
- No other concrete, named backlog item is currently known. An eighth
  full-repo health check (`pnpm lint`/`test`/`test:coverage`/`build`/
  `check:*`, plus the full `pnpm test:e2e` suite from a cold start) ran clean
  2026-08-26 - 505/505 unit, 804/804 e2e, coverage unchanged at
  99.91%/99.42%, no code change needed. The next intensive-run pass should
  repeat that same health-check-first approach rather than assume this
  conclusion is still current - the same standing advice the 2026-08-19 and
  2026-08-24 "quality pass" entries in `docs/PROJECT_STATUS.md` set. An
  external link-liveness sweep of `docs/SOURCES.md` stays blocked by this
  environment's outbound network policy - confirmed again 2026-08-26 (a
  direct `curl` to `en.wikipedia.org` was rejected with a `403` by the
  egress proxy), not just assumed from an earlier note - so it still needs a
  session with broader network access than this one has. The `typescript` 7
  upgrade is also still blocked, confirmed again 2026-08-26: `@astrojs/check`
  0.9.10 (latest published) only declares `typescript: '^5.0.0 || ^6.0.0'` as
  a peer dependency.
- **Dependency patch bump (astro 7.2.4 -> 7.2.7, @types/node 26.2.0 ->
  26.3.0)**: closed 2026-08-26 (ninth intensive run) - `pnpm outdated` turned
  up two in-range patch/minor releases; both installed cleanly, and a full
  health check (lint/test/coverage/build/all four `check:*` scripts/full
  cold-start `pnpm test:e2e`) came back identical to the eighth run's
  baseline: 505/505 unit, 804/804 e2e, coverage unchanged at 99.91%/99.42%,
  711 pages built. `@astrojs/check`'s `typescript: '^5.0.0 || ^6.0.0'` peer
  ceiling is still the blocker on the `typescript` 7 upgrade (re-confirmed
  via `npm view @astrojs/check@latest peerDependencies` this run too). See
  `docs/PROJECT_STATUS.md`'s matching entry.
- **Tenth-run health check plus three targeted audits**: closed 2026-08-26
  (tenth intensive run) - the standing full health check (`pnpm outdated`
  through cold-start `pnpm test:e2e`) came back byte-identical to the ninth
  run's baseline again (505/505 unit, 804/804 e2e, 99.91%/99.42% coverage,
  711 pages), so this run also ran a WCAG contrast-ratio audit of every
  light/dark theme color-token pair (all clear AA), a "Last reviewed" date
  coverage audit across all 49 page templates (complete - the five EN
  competition landing pages carry it via `CompetitionView.astro`'s
  `References` component), and a composition check of the heaviest built
  page (`hr/records`, 498.8/510 KB) confirming its size is legitimate
  JSON-LD/content, not bloat. No code change needed; see
  `docs/PROJECT_STATUS.md`'s matching entry, which also suggests a future
  pass look past this same health-check shape (dead-code sweep, or a fresh
  read of `docs/WEBSITE_REQUIREMENTS.md` against the live site) since
  repeat clean health checks add less each time.

## Ideas not yet scoped as backlog

Raised in passing across `docs/PROJECT_STATUS.md` entries but never turned
into a concrete plan - worth a look next time the health check above comes
back clean:

- Extend "Tap a year to reveal a short story" (currently the four
  team-competition tables) to the two individual awards. Checked
  2026-08-25: `content/ballon-dor.md` and `content/golden-boot.md` have no
  "Memorable moments" section (the four team-competition files each do),
  so this is blocked on new editorial narrative content, not a code change
  - see the "not pursued" note below for why that is not something to
  fabricate in an unattended run.
- **Correction (2026-08-25):** the `/records`-style individual-award
  aggregate ranking this line used to ask for is **already live** - "most
  award years apart" is the existing "Longest wait between titles" section,
  which loops over `allLoaded` (every team competition *and* both
  individual awards, see `src/pages/records.astro`) and already renders
  `title-gaps-ballon-dor`/`title-gaps-golden-boot-world-cup`/
  `title-gaps-golden-boot-euro` sections; "Back-to-back champions" is the
  same story. The one genuinely open piece is **"youngest winner"**, which
  needs a per-player birth date - data that exists nowhere in `content/`
  today. **Not pursued this run:** fabricating ~130 players' birth dates
  (70 Ballon d'Or + Golden Boot winners, several tied) from memory in an
  unattended run, with no reliable per-player source cross-checked the way
  every other fact on this site has been (see the many "second independent
  cross-check" entries in `docs/PROJECT_STATUS.md`), risks shipping
  confidently-wrong biographical history with no human review before
  merge - the same caution that has already shelved the "by team" filter's
  full participant lists and the flag-emoji idea in earlier runs. Left for
  whenever someone sources that data deliberately.
