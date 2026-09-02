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
- **"Tap a year to reveal a short story" for the two individual awards**:
  closed 2026-08-26 (eleventh intensive run) - `content/ballon-dor.md` and
  `content/golden-boot.md` (the latter split into "World Cup memorable
  moments"/"EURO memorable moments", one per table) now carry a "Memorable
  moments" section each, extending the feature the four team-competition
  pages already had. Every bullet is a fact already cross-checked
  elsewhere in the same content file (the table itself, the "Multiple
  winners"/"Notes" sections, or the existing team-competition EURO-2020-delay
  note) rather than new unverified biographical claims - the caution the
  "not pursued" note below still applies to (birth dates), this doesn't.
  Wired into both index pages (`ballon-dor.astro`'s `noteHeadings`;
  `golden-boot.astro`'s hand-built `buildYearStories()`/`storyColumn`, since
  that page composes its own two-table layout rather than using
  `CompetitionView`) and all four edition-page route trees
  (`ballon-dor/[year].astro`, `golden-boot/world-cup/[year].astro`,
  `golden-boot/euro/[year].astro`, plus their Croatian siblings with
  hand-translated `CROATIAN_MOMENTS`/`storyColumn` wiring kept in sync with
  each hr index page's own notes). All 700 PDFs regenerated
  (`pnpm build:pdfs`) and reverified with `pnpm check:pdfs` (zero drift);
  full health check (lint/test/build/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf`) also clean: 505/505 unit tests, 711 pages
  built, no page-weight or link regressions. The full `pnpm test:e2e` suite
  (804 tests) was run from a cold start too: it first caught two pre-existing
  Golden Boot notes-count assertions (`tests/e2e/mobile.spec.ts`) that
  hardcoded 3 `.notes__card` sections and needed updating to 5 now that each
  table has its own new moments section, plus a Croatian wording collision
  (this page's new EURO moment and the pre-existing EURO note both opened
  with "Michel Platini postigao je devet golova...", so a `getByText` match
  in the existing test became ambiguous) - reworded that one bullet's word
  order rather than the test, since the fact stands on its own without
  echoing the note verbatim. All 804 e2e tests pass after those two fixes.

- **Dead-code/unused-export sweep**: closed 2026-08-26 (twelfth intensive
  run) - ran `pnpm dlx knip --no-config-hints` (the tenth run's own
  suggestion for a pass that isn't another repeat health check) and fixed
  what it found: deleted the genuinely-unused `DEFAULT_LOCALE` constant
  (`src/lib/i18n.ts`) and dropped the unneeded `export` keyword from nine
  types across `comparePlayers.ts`, `editionProfile.ts`, `playerProfile.ts`,
  `tableSort.ts`, `teamProfile.ts` and `types.ts` that are used only inside
  their own file. One `knip`-flagged "unused file"
  (`scripts/test-preview-server.mjs`) was a false positive - it's invoked
  as a shell string from `playwright.config.ts`'s `webServer.command`,
  which static import-graph analysis can't see - confirmed and left as-is.
  All 700 PDFs regenerated and reverified clean after the edit (source
  files changed bytes even though behavior didn't). Full health check
  clean: 505/505 unit tests, 99.91%/99.42% coverage (unchanged), 711 pages
  built. See `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **Dependency patch bump (astro 7.2.7 -> 7.2.8, @types/node 26.3.0 ->
  26.4.0)**: closed 2026-08-27 (thirteenth intensive run) - `pnpm outdated`
  turned up two more in-range patch releases since the ninth run's bump;
  both installed cleanly and a full health check (lint/test/coverage/build/
  all four `check:*` scripts/full cold-start `pnpm test:e2e`) came back
  identical to the twelfth run's baseline: 505/505 unit, 804/804 e2e (6.6
  minutes), coverage unchanged at 99.91%/99.42%, 711 pages built. The
  `typescript` 7 upgrade is still blocked on `@astrojs/check`'s
  `typescript: '^5.0.0 || ^6.0.0'` peer ceiling (re-confirmed via `npm view
  @astrojs/check@latest peerDependencies` this run too); the
  `docs/SOURCES.md` link-liveness sweep is still blocked by this
  environment's outbound network policy (a direct `curl` to
  `en.wikipedia.org` was again rejected with a 403 by the egress proxy).
  See `docs/PROJECT_STATUS.md`'s matching entry.
- **Lighthouse audit (new verification method) plus standing health
  check**: closed 2026-08-27 (fourteenth intensive run) - `pnpm outdated`
  found nothing new (still just the blocked `typescript` 7 entry), and a
  fresh read of `docs/WEBSITE_REQUIREMENTS.md` against the live route tree
  and a spot-check of the hand-written "Champions by titles" content
  tables against the generated `buildChampionsSummary()` output turned up
  nothing missing or wrong. Rather than repeat the prior five runs'
  identical health check verbatim, this run ran a **Lighthouse audit** (a
  method no prior run had used) against seven diverse pages (home,
  `hr/records` [heaviest page], a Copa América edition page,
  `/compare-players`, `/quiz`, a player profile, a team profile): every
  page scored a perfect 1.00/1.00/1.00/1.00
  (performance/accessibility/best-practices/SEO) - no audit fired anywhere.
  The standing health check (lint/test/`check:links`/`check:sitemap`/
  `check:perf`/`check:precache`/`check:pdfs`) also came back clean and
  unchanged from the thirteenth run's baseline. No code change needed. See
  `docs/PROJECT_STATUS.md`'s matching entry, which also suggests a future
  run could turn the manual Lighthouse invocation into a committed
  `check:lighthouse` script if repeat manual runs turn out to be common
  enough to justify automating it.
- **`pnpm check:lighthouse` script**: closed 2026-08-27 (fifteenth intensive
  run) - the fourteenth run's suggestion, above, acted on: a committed
  `scripts/check-lighthouse.mjs` now runs the same seven-page Lighthouse
  audit against a `MIN_SCORE = 0.9`-per-category budget, reusing the `astro
  preview` daemon dance and Playwright's already-installed Chromium (driven
  over CDP) rather than adding a second browser-launch path. Deliberately
  not wired into CI (slow, pulls in `puppeteer-core` transitively) - stays a
  manual/intensive-run tool like `test:e2e:install`. Ran clean: all seven
  pages 1.00 across the board, matching the fourteenth run's manual
  baseline; full standing health check (including cold-start `pnpm
  test:e2e`) also clean. See `docs/PROJECT_STATUS.md`'s matching entry for
  detail.
- **`check:lighthouse` widened three more times (sixteenth-eighteenth
  intensive runs, 2026-08-27)**: every competition/award family's edition
  page, the Copa América landing page, and the `/teams`/`/players`
  directory indexes are now all in `PAGES_TO_AUDIT` (19 pages total, up from
  7) - all score a perfect 1.00 across every category. See
  `docs/PROJECT_STATUS.md`'s three matching entries for detail.
- **Accessibility: `prefers-reduced-motion` actually collapses every
  transition now**: closed 2026-08-28 (nineteenth intensive run) - rather
  than extend `check:lighthouse` a fourth consecutive run, this run found a
  genuine, previously-unfixed gap: the site's only `prefers-reduced-motion`
  rule (`global.css`) reset `scroll-behavior` but never touched any of the
  three real `transition` declarations in the codebase (the skip-link
  reveal, and the `.comp-card` hover effect on both language home pages), so
  a reader with that OS accommodation on still got full-speed motion from
  all three. Fixed with one blanket `*, *::before, *::after` override inside
  the existing media block, plus the site's first dedicated e2e coverage of
  this media feature (`tests/e2e/accessibility-reduced-motion.spec.ts`, four
  tests using `page.emulateMedia()` the same way the forced-colors spec
  already established, since `reducedMotion` isn't a `test.use()`-able
  option in the pinned Playwright version). Full standing health check
  (lint/test/build/all `check:*` scripts/cold-start `pnpm test:e2e`) clean;
  `pnpm outdated` and a fresh `WebFetch`/`curl` retry against
  `en.wikipedia.org` both re-confirmed the same two standing environment
  blockers. See `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **Lighthouse audit coverage for every competition/award family**: closed
  2026-08-27 (sixteenth intensive run) - `PAGES_TO_AUDIT` in
  `scripts/check-lighthouse.mjs` only ever audited one edition-page shape
  (Copa América), leaving World Cup, EURO, Nations League, Ballon d'Or and
  both Golden Boot trees with no Lighthouse coverage of their own page
  layout. Added one edition page per remaining family (the latest completed
  edition of each) plus the English `/records` (previously only its
  Croatian sibling ran), `/compare` and `/glossary` - 16 pages total, up
  from 7. All 16 scored a perfect 1.00/1.00/1.00/1.00. `pnpm outdated` found
  nothing new (still just the blocked `typescript` 7 entry); the standing
  health check (lint/unit test/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf`/`check:pdfs`/cold-start `pnpm test:e2e`) is
  also clean. See `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **Dependency patch bump (astro 7.2.8 -> 7.2.9) plus a genuinely
  profile-heavy Lighthouse pick**: closed 2026-08-27 (seventeenth intensive
  run) - `pnpm outdated` found one new in-range patch release; installed
  cleanly. The sixteenth run's own suggested next step ("one profile-heavy
  `/players/` entry with a very long award list") turned out not to be met
  by its own pick: Alfredo Di Stéfano has only 2 Ballon d'Or wins, not the
  long list intended. Swapped `check:lighthouse`'s player-profile page to
  Lionel Messi (8 Ballon d'Or wins, the most of any player), whose profile
  renders four times as many award rows. Full standing health check plus
  the widened 16-page Lighthouse audit (including the new Messi pick) all
  clean: 505/505 unit, 804/804 e2e (11.4 min), 711 pages built, every
  Lighthouse category >= 0.9 (all but home's 0.99 performance a perfect
  1.00), no broken links/sitemap/precache/PDF drift. See
  `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **Lighthouse coverage for the competition-landing-page shape**: closed
  2026-08-27 (eighteenth intensive run) - `pnpm outdated` found nothing new
  beyond the still-blocked `typescript` 7 entry, and `pnpm dlx knip
  --no-config-hints` matched the twelfth/sixteenth runs' baseline exactly
  (same one confirmed false positive). `check:lighthouse`'s 16 pages had
  covered every *edition* page shape and both `/records` languages, but
  never a competition *landing* page - the full multi-edition table with
  winner/year/host/team filter controls
  (`CompetitionView.astro`) - even though `check:perf` ranks
  `competitions/copa-america` as the third-heaviest page family on the
  site (270-273 KB), behind only `/records`. Added that page plus the
  `/teams` and `/players` directory index pages (another previously-unaudited
  shape: a plain alphabetical list with a live count) - 19 pages total, up
  from 16. All 19 scored a perfect 1.00/1.00/1.00/1.00. Full standing health
  check also clean: 505/505 unit, 804/804 e2e (6.7 min), 711 pages built,
  no broken links/sitemap/precache/PDF drift. See `docs/PROJECT_STATUS.md`'s
  matching entry for detail.
- **`check:lighthouse` widened to every competition/award landing page**:
  closed 2026-08-28 (twentieth intensive run) - the eighteenth run's own
  entry above only covered Copa América's landing page; World Cup, EURO,
  Nations League, Ballon d'Or and Golden Boot landing pages had none.
  Measured each family's built page weight first, then added all five to
  `scripts/check-lighthouse.mjs`'s `PAGES_TO_AUDIT` with that context in the
  label - 24 pages total, up from 19. All 24 scored a perfect
  1.00/1.00/1.00/1.00. Full standing health check also clean: 505/505 unit,
  808/808 e2e (6.8 min), 711 pages built, no broken links/sitemap/precache/
  PDF drift. See `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **`check:lighthouse` closes its last uncovered page shape (`/about/sources`)
  plus a standing health check**: closed 2026-08-28 (twenty-first intensive
  run) - `pnpm outdated` found nothing new (still just the blocked
  `typescript` 7 entry, re-confirmed), and a fresh content-accuracy spot
  check via `WebSearch` (which this run confirmed still works even though
  direct `WebFetch`/`curl` to specific domains like `en.wikipedia.org`
  remains egress-blocked, re-confirmed again this run) on the site's two
  newest, least-reviewed facts - the 2026 World Cup final (Spain 1-0
  Argentina a.e.t., Ferran Torres, 19 July 2026) and the 2025 Ballon d'Or
  winner (Ousmane Dembélé, France, 22 September 2025) - matched the site
  exactly, no discrepancy. `PAGES_TO_AUDIT` in `scripts/check-lighthouse.mjs`
  covered every landing-page and edition-page shape already but had never
  once audited `/about/sources` (155.3 KB built), the site's long
  external-link reference list - a distinct DOM shape from every table/form/
  profile page already covered. Added it; all 25 pages (up from 24) scored a
  perfect 1.00/1.00/1.00/1.00. Full standing health check also clean:
  `pnpm lint` (0/0/0 across 166 files), `pnpm test` (505/505 unit,
  99.91%/99.42% coverage unchanged), `pnpm build` (711 pages), `check:links`
  (715 pages), `check:sitemap` (710 entries), `check:precache` (37 URLs),
  `check:perf` (heaviest page still `hr/records`, within budget),
  `check:pdfs` (700 PDFs), full cold-start `pnpm test:e2e` (808/808, 8.0
  min), and `pnpm dlx knip --no-config-hints` (same one confirmed false
  positive as every prior run). No other backlog item found - the six
  competition/award page families, every edition/landing/profile/directory
  page, and the full content set (through the 2026 World Cup and 2025
  Ballon d'Or) are all live and independently re-verified accurate this run.
- **WCAG 2.2 AA (`target-size`) coverage plus a real skip-link/header-logo
  overlap fix**: closed 2026-08-28 (twenty-second intensive run) - every
  prior accessibility sweep only ever checked WCAG 2.1 tags; added
  `wcag22aa` to all 37 `AxeBuilder.withTags()` call sites across
  `tests/e2e/`, which caught a real bug: the focused skip link overlapped
  the header's `.brand` logo (both anchored to the same top-left corner),
  failing the new `target-offset`/`target-size` check with only ~2.8px of
  clearance instead of the required 24px. Fixed in `global.css` by pushing
  `.site-header` down by the skip link's own footprint while it's focused.
  Full standing health check plus a full cold-start `pnpm test:e2e` both
  clean: 505/505 unit, 808/808 e2e (unchanged count - existing checks
  widened, no new test cases), 25/25 Lighthouse pages still a perfect
  1.00 across every category. See `docs/PROJECT_STATUS.md`'s matching
  entry for detail.
- **Golden Boot tie-resolution consistency audit**: closed 2026-08-28
  (twenty-third intensive run) - acted on the twenty-second run's own
  suggestion (a content-side angle: the Golden Boot prose-notes
  accuracy spot check). Rather than re-check names/goals/diacritics a
  third time (already double-audited), this run checked a different,
  never-audited angle: whether each EURO edition's "shown as a tie" vs.
  "shown as a single winner" choice in `content/golden-boot.md` matches
  that edition's real award history. Found and fixed one real
  documentation bug (a 2026-08-07 `docs/SOURCES.md` audit entry had
  mis-described the table's 2020 row as a Ronaldo/Schick tie; it has
  always credited Ronaldo alone, correctly). Also traced *why* 2012's
  row is deliberately still a six-way "Multiple" tie despite Fernando
  Torres's official UEFA tiebreak award: `src/lib/editions.ts`'s
  `buildChampionsSummary()` doc comment shows this is load-bearing for
  Cristiano Ronaldo's "2 EURO Golden Boots" total in the site's "Most
  awards" ranking (his 2012 tie-share plus his outright 2020 win) - not
  an unexamined leftover, so left unchanged, this time with the reasoning
  on record. No `content/golden-boot.md` data changed. Full standing
  health check clean (lint/unit test/build/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf`); all 700 PDFs regenerated and reverified
  clean after the `docs/SOURCES.md` edit (every PDF's shared References
  section depends on it, so any edit marks all of them stale, by design -
  `pnpm build:pdfs` then `pnpm check:pdfs`). See
  `docs/PROJECT_STATUS.md`'s matching entry for detail.
- **Croatian translation audit: factual sync (all six families) plus prose
  quality for the three families never proofread this way**: closed
  2026-08-29 (twenty-fifth intensive run) - `pnpm outdated`/`pnpm dlx knip
  --no-config-hints` found nothing new (same blocked `typescript` 7 entry,
  same one confirmed false positive). Read all six English `content/*.md`
  files and all six `hr/competitions/*.astro` index pages in full and
  cross-checked every hand-translated "How it works"/"Format milestones"/
  "Historical format note"/"Key facts"/"Memorable moments"/"Editorial
  notes" note section against its English source - a factual-sync check no
  prior run had done for this hand-duplicated bilingual prose (as opposed
  to the table data itself, which both languages already share from one
  `loadCompetition()` call and can't drift). Also extended the
  twenty-fourth run's prose-quality (grammar/declension) proofreading pass
  to the three families it never covered - FIFA World Cup, UEFA EURO, Copa
  América. Confirmed the six edition-page route trees'
  `CROATIAN_MOMENTS`/`WORLD_CUP_MOMENTS`/`EURO_MOMENTS` constants are
  byte-identical to their already-checked index-page counterparts, so no
  separate edition-page pass was needed. **Zero discrepancies found**,
  factual or grammatical - no `content/*.md` or `.astro` file needed a
  change. Full standing health check plus a full cold-start `pnpm test:e2e`
  both clean. See `docs/PROJECT_STATUS.md`'s matching entry for detail,
  including the specific grammar edge cases checked (foreign-name genitive
  declension, gendered/plural verb agreement with country-name subjects,
  numeral-noun agreement).
- **SEO: meta description length audit**: closed 2026-08-28 (twenty-fourth
  intensive run) - a never-before-checked angle: 13 of the site's 30 static
  `<BaseLayout description="...">` values (the `<meta name="description">`/
  Open Graph text) were over the ~160-character length search engines
  typically truncate at, one as long as 436 characters. Trimmed all 13 to
  fit 50-160 characters without adding or dropping any fact, across
  `compare`, `records`, `compare-players`, `glossary`, `quiz`, `teams`
  (Croatian only) and the Croatian `euro`/`world-cup`/`golden-boot`
  landing pages, both languages. Also ran a Croatian-translation
  proofreading pass (prose quality, not factual sync - never tried before)
  over the Nations League/Ballon d'Or/Golden Boot hand-written Croatian
  text: no errors found. Full standing health check clean, including a
  cold-start `pnpm test:e2e` (808/808) and PDF regeneration/reverification
  (700 PDFs). See `docs/PROJECT_STATUS.md`'s matching entry for detail,
  including a documented `PW_EXECUTABLE_PATH` fallback for environments
  with no `chrome` browser channel installed.
- **Person/SportsTeam structured-data entity blocks for profile pages**:
  closed 2026-08-29 (twenty-sixth intensive run) - `pnpm outdated` found
  nothing new (still just the blocked `typescript` 7 entry). Every
  generated-ranking page family already carries its own `ItemList` JSON-LD
  (see `docs/PROJECT_STATUS.md`'s many prior structured-data entries), but
  `/players/<slug>` and `/teams/<slug>` never emitted a real schema.org
  entity type for the player/team the page is actually about - only the
  generic `ItemList` of their awards/appearances. Added
  `buildPlayerPersonJsonLd()` (`Person`, `award` = every award this player
  has actually won, "<Award title> <Year>") and `buildTeamSportsTeamJsonLd()`
  (`SportsTeam`, `award` = only this team's actual title wins, filtered to
  `role === 'Champion'` so a runner-up/semifinal finish is never
  misrepresented as an award) in `src/lib/jsonLd.ts`, wired into all four
  page files (`players/[slug].astro`, `hr/players/[slug].astro`,
  `teams/[slug].astro`, `hr/teams/[slug].astro`) alongside their existing
  `ItemList` block, not replacing it. Deliberately no `birthDate`/
  `nationality` on the `Person` block: that data doesn't exist in `content/`
  today, the same reason this file's "Ideas not yet scoped" section below
  already gives for not pursuing "youngest winner". New unit test coverage
  in `tests/unit/jsonLd.test.ts` (both builders) plus e2e coverage in
  `tests/e2e/mobile.spec.ts` (`/teams/brazil`'s exact JSON-LD type list
  updated to include `SportsTeam`; a new `/players/lionel-messi` test
  checks his `Person` block lists all eight Ballon d'Or wins). All 700 PDFs
  regenerated and reverified clean (the four edited `.astro` files are PDF
  sources for every player/team PDF). Full standing health check clean:
  510/510 unit tests (up from 505, same 99.91%/99.42% coverage), 711 pages
  built, no broken links/sitemap/precache/PDF drift, full cold-start `pnpm
  test:e2e` 809/809 (8.4 min, up from 808 - the one new Messi test). See
  `docs/PROJECT_STATUS.md`'s matching entry for detail.

- **Dedicated 1200x630 Open Graph/Twitter Card image**: closed 2026-08-29
  (twenty-seventh intensive run) - `pnpm outdated` found nothing new (still
  just the blocked `typescript` 7 entry), and content accuracy re-checked
  (Copa América/Nations League/Ballon d'Or/World Cup `lastCompletedEdition`
  values all match the real-world record, no gap). The 2026-08-01
  SEO-essentials entry that first added `og:image`/`twitter:image`
  deliberately pointed both at the square `icons/icon-512.png` PWA icon
  rather than build a dedicated social-card image - a genuine, still-open
  gap, since a square image gets cropped or letterboxed by most link-unfurl
  surfaces (Slack, Discord, iMessage, X/Twitter's `summary_large_image`
  card), which expect roughly a 1.91:1 image. Added
  `scripts/generate-og-image.mjs` (`pnpm generate:og-image`), a one-time/
  on-demand generator - not a build step, output committed to
  `public/og-image.png` the same way `public/icons/icon-*.png` already are -
  that renders one SVG (the favicon's ball mark enlarged, the site name, a
  tagline listing all six competition/award families, on the site's own
  `--light-accent` green) and rasterizes it with `sharp` (already a
  transitive dependency of Astro's own image pipeline; added as an explicit
  devDependency for this script). `BaseLayout.astro`'s `ogImageURL` now
  points at it, plus new `og:image:width`/`og:image:height` meta tags and
  `twitter:card` upgraded from `summary` to `summary_large_image` now that
  there's a real large image to show. `tests/e2e/mobile.spec.ts`'s existing
  Open Graph/Twitter Card test updated to match. Full standing health check
  clean: `pnpm lint` (0/0/0), `pnpm test` (510/510 unit, unchanged
  coverage), `pnpm build` (711 pages), `check:links`/`check:sitemap`/
  `check:precache`/`check:perf` all clean, `check:pdfs` unaffected (700
  PDFs still fresh - `BaseLayout.astro` isn't a PDF source file), full
  cold-start `pnpm test:e2e` (809/809, 8.3 min), `check:lighthouse` (25/25
  pages still a perfect 1.00 across every category), `pnpm dlx knip
  --no-config-hints` (same one confirmed false positive, after registering
  the new script as a `pnpm` command). See `docs/PROJECT_STATUS.md`'s
  matching entry for detail.

- **Stale `lastReviewed` fix for six content files**: closed 2026-08-29
  (twenty-eighth intensive run) - `docs/ADDING_CONTENT.md` says "Update
  `lastReviewed` whenever you revise a page," but six of the fifteen
  `content/*.md` files had a `lastReviewed` date that predated a later
  commit which added real new editorial prose still on the page today
  (`copa-america.md`/`fifa-world-cup.md`/`uefa-euro.md`/
  `uefa-nations-league.md`'s 2026-08-19 "How it works" sections;
  `ballon-dor.md`/`golden-boot.md`'s 2026-08-26 "Memorable moments"
  sections) - a previously-unaudited angle no prior health check had
  checked. This is visible to readers (the "Last reviewed" line on every
  page, and the `/teams` pages' max-across-competitions version of it) and
  a `docs/ADDING_CONTENT.md` rule violation, not just a cosmetic nit. Fixed
  all six dates, one stale hardcoded e2e assertion, regenerated and
  reverified all 700 PDFs. See `docs/PROJECT_STATUS.md`'s matching entry
  for detail, including why `content/index.md`'s own out-of-order date was
  deliberately left alone (a squash-merge artifact, not the same bug).

- **CollectionPage schema for directory/landing pages**: closed 2026-08-29
  (twenty-ninth intensive run) - the idea the twenty-sixth run raised and the
  twenty-seventh/twenty-eighth runs both declined to scope (see the "Ideas
  not yet scoped as backlog" entry below, now resolved) is implemented:
  `/teams`, `/players` and all six competition/award landing pages (EN + HR,
  16 pages total) now wrap their directory/champions `ItemList` in a
  `CollectionPage` via the new `buildCollectionPageJsonLd()`
  (`src/lib/jsonLd.ts`). `/records`, `/compare` and `/compare-players` stay
  unwrapped by design (multiple independent rankings, not a single list the
  page *is*). See `docs/PROJECT_STATUS.md`'s matching entry for detail.

- **`check:lighthouse` widened to Croatian pages**: closed 2026-08-29
  (thirtieth intensive run) - `pnpm outdated` found nothing new (still just
  the blocked `typescript` 7 entry), and `pnpm dlx knip --no-config-hints`
  matched every prior run's baseline (same one confirmed false positive).
  `PAGES_TO_AUDIT` in `scripts/check-lighthouse.mjs` had grown to cover every
  page *shape* in English across the sixteenth-to-twenty-first runs, but only
  one Croatian page (`hr/records`) had ever been audited - every other `hr/*`
  route (landing pages, edition pages, `/compare`, `/compare-players`,
  `/glossary`, `/quiz`, player/team profiles and directories,
  `/about/sources`) had zero Lighthouse coverage of its own layout, even
  though the same components render longer Croatian strings that could in
  principle lay out differently. Added one Croatian entry per remaining
  shape (12 pages, 25 -> 37 total) - `hr/competitions/copa-america` turned
  out to be the single heaviest *landing* page on the whole site, EN
  included (273.3 KB vs. its English sibling's 270.8 KB). All 37 pages
  scored a perfect 1.00 across every category (home's pre-existing 0.99
  performance unchanged). Full standing health check also clean: `pnpm lint`
  (0/0/0), `pnpm test` (513/513 unit, unchanged, coverage unchanged at
  99.91%/99.42%), `pnpm build` (711 pages), `check:links`/`check:sitemap`/
  `check:precache`/`check:perf`/`check:pdfs` all clean, full cold-start
  `pnpm test:e2e` (809/809, `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`,
  the same env var this environment's Chromium has needed since the
  twenty-fourth run's entry first documented it). See
  `docs/PROJECT_STATUS.md`'s matching entry for detail.

- **FIFA World Cup Golden Glove (best goalkeeper) winners**: closed
  2026-08-30 (thirty-first intensive run) - `pnpm outdated` found nothing new
  (still just the blocked `typescript` 7 entry, re-confirmed), and `pnpm dlx
  knip --no-config-hints` matched every prior run's baseline (same one
  confirmed false positive). The twenty-sixth run's own "Add tournament-level
  best scorer facts" entry (2026-07-29, see `docs/PROJECT_STATUS.md`) had
  explicitly left "best goalkeeper" unimplemented, noting "no goalkeeper-award
  editorial content exists in `content/` yet, would need that added first" -
  a genuine, previously-flagged gap rather than a repeat health check. Added
  a new "Golden Glove winners" note section to `content/fifa-world-cup.md`
  listing all nine winners since the award's 1994 introduction (Michel
  Preud'homme through 2026's Unai Simón), each verified via two independent
  WebSearch passes (see `docs/SOURCES.md`'s matching new entry for the full
  citation list) - deliberately scoped to a prose note section rather than
  extending `TournamentTable`'s shared `extraColumn` mechanism to a second
  column, since the award only covers 9 of the page's 23 editions (no
  pre-1994 equivalent existed) and a prose list avoids touching the shared
  component's contract used by all four team-competition landing/edition
  pages. Wired into `world-cup.astro`'s `noteHeadings` (English) and
  hand-translated into `hr/competitions/world-cup.astro`'s own `notes` array
  as "Dobitnici Zlatne rukavice" (Croatian, matching the page's existing
  hand-translated-notes convention). `content/fifa-world-cup.md`'s
  `lastReviewed` bumped to 2026-08-30. All 700 PDFs regenerated and
  reverified clean (`pnpm build:pdfs` then `pnpm check:pdfs`, since this
  content edit and the `docs/SOURCES.md` addition both mark every PDF's
  shared References section stale, by design). Full standing health check
  clean: `pnpm lint` (0/0/0), `pnpm test` (513/513 unit, unchanged),
  `pnpm build` (711 pages), `check:links` (715 pages), `check:sitemap` (710
  entries), `check:precache` (37 URLs), `check:perf` (heaviest page still
  `hr/records`, within budget), full cold-start `pnpm test:e2e` (809/809,
  after updating three pre-existing `tests/e2e/mobile.spec.ts` World Cup
  assertions - a stale `lastReviewed` date and two `.notes__card` counts
  hardcoded to 4 - to account for the new section, the same "existing
  hardcoded assertion needed updating" pattern several prior content-adding
  runs have hit). See `docs/PROJECT_STATUS.md`'s matching entry for detail.
  EURO's own
  goalkeeper-award history is less consistently documented across editions
  than the World Cup's uninterrupted FIFA award, so was deliberately left
  out of this run's scope rather than risk a less-verifiable per-edition
  claim - a candidate for a future run if that data turns out to be
  reliably sourceable.
- **FIFA World Cup Golden Ball (best player) winners**: closed 2026-08-30
  (thirty-second intensive run) - `pnpm outdated` and `pnpm dlx knip
  --no-config-hints` found nothing new (still just the blocked `typescript`
  7 entry, same one confirmed false positive). Investigated the
  thirty-first run's own flagged idea (a EURO "best goalkeeper" equivalent)
  first via `WebSearch` and confirmed its caution was correct: UEFA's EURO
  goalkeeper award was unofficial for 1984-1992 and has no single
  consistent name across sources, so it stays out of scope. Found a
  cleaner, better-scoped gap instead while researching that: the World Cup
  had a "Golden Glove" note section (added last run) but no equivalent for
  the Golden Ball (best player) - FIFA's other permanent individual award,
  continuous and unambiguous since 1982, with no partial/unofficial years
  to navigate. Added a new "Golden Ball winners" note section to
  `content/fifa-world-cup.md` listing all twelve winners (Paolo Rossi
  1982 through Rodri 2026), each verified via two independent WebSearch
  passes (see `docs/SOURCES.md`'s matching new entry for the full citation
  list) - the second pass specifically re-checked the newest, least-settled
  fact (Rodri's 2026 win, which several outlets called contested against
  Messi's tournament stats) against FIFA.com's own award article to confirm
  it was FIFA's actual pick regardless of the surrounding debate. Placed
  before the existing "Golden Glove winners" section (headline best-player
  award ahead of the specialist goalkeeper one) in both the section itself
  and `world-cup.astro`'s `noteHeadings`; hand-translated into
  `hr/competitions/world-cup.astro`'s own `notes` array as "Dobitnici
  Zlatne lopte", matching the page's existing hand-translated-notes
  convention. `content/fifa-world-cup.md`'s `lastReviewed` was already
  2026-08-30 from the prior run, so left unchanged. All 700 PDFs
  regenerated and reverified clean (`pnpm build:pdfs` then `pnpm
  check:pdfs`, since this content edit and the `docs/SOURCES.md` addition
  both mark every PDF's shared References section stale, by design). Full
  standing health check clean: `pnpm lint` (0/0/0), `pnpm test` (513/513
  unit, unchanged), `pnpm build` (711 pages), `check:links` (715 pages),
  `check:sitemap` (710 entries), `check:precache` (37 URLs), `check:perf`
  (heaviest page still `hr/records`, within budget), full cold-start `pnpm
  test:e2e` after updating two pre-existing `tests/e2e/mobile.spec.ts`
  World Cup `.notes__card` count assertions (EN and HR pages, 5 -> 6) to
  account for the new section - the same "existing hardcoded assertion
  needed updating" pattern several prior content-adding runs have hit. See
  `docs/PROJECT_STATUS.md`'s matching entry for detail.

- **UEFA EURO Player of the Tournament winners**: closed 2026-08-30
  (thirty-third intensive run) - the thirty-second run's own "left for a
  future pass" note (in `docs/PROJECT_STATUS.md`) flagged EURO's "Player of
  the Tournament" award as unresearched. Investigated via two independent
  WebSearch passes and found it a clean fit for the same treatment as the
  World Cup's Golden Ball/Golden Glove sections: a single official UEFA
  award, continuous since 1996 (not 2020, correcting an inaccurate date in
  that same prior note - 2020 was only when a goalkeeper first won it, per
  UEFA.com's own EURO 2024 award article), with no partial/unofficial years
  to navigate the way EURO's still-out-of-scope goalkeeper award has. Added
  a new "Player of the Tournament winners" note section to
  `content/uefa-euro.md` listing all eight winners (Matthias Sammer 1996
  through Rodri 2024), wired into `euro.astro`'s `noteHeadings` (English)
  and hand-translated into `hr/competitions/euro.astro`'s own `notes` array
  as "Dobitnici nagrade za igrača turnira" (Croatian, matching the page's
  existing hand-translated-notes convention). `content/uefa-euro.md`'s
  `lastReviewed` bumped to 2026-08-30. All 700 PDFs regenerated and
  reverified clean (`pnpm build:pdfs` then `pnpm check:pdfs`, since this
  content edit and the `docs/SOURCES.md` addition both mark every PDF's
  shared References section stale, by design). Full standing health check
  clean: `pnpm lint` (0/0/0), `pnpm test` (513/513 unit, unchanged), `pnpm
  build` (711 pages), `check:links` (715 pages), `check:sitemap` (710
  entries), `check:precache` (37 URLs), `check:perf` (heaviest page still
  `hr/records`, within budget), `pnpm dlx knip --no-config-hints` (same one
  confirmed false positive as every prior run), full cold-start `pnpm
  test:e2e` after updating two pre-existing `tests/e2e/mobile.spec.ts` EURO
  assertions (English and Croatian pages' Historical-format-note test) to
  also check the new section's heading and a "Rodri" excerpt. See
  `docs/PROJECT_STATUS.md`'s matching entry for detail. **Left for a future
  pass:** Copa América and UEFA Nations League don't yet have an equivalent
  individual "best player of the tournament" note section - worth
  researching next, following this same two-independent-source pattern, if
  each has a similarly clean, continuous, single-name-per-edition award
  history.

- **Copa América Best Player winners and UEFA Nations League Player of the
  Finals winners**: closed 2026-08-30 (thirty-fourth intensive run) - acted
  on the thirty-third run's own "left for a future pass" note directly
  above. Both competitions turned out to be a clean fit for the same
  treatment as the World Cup's Golden Ball/Golden Glove and EURO's Player of
  the Tournament sections. Added a "Best Player winners" section to
  `content/copa-america.md` (16 winners, one per edition since the award's
  1987 introduction - Carlos Valderrama 1987 through James Rodríguez 2024)
  and a "Player of the Finals winners" section to
  `content/uefa-nations-league.md` (all four completed editions - Bernardo
  Silva 2019 through Nuno Mendes 2025, documenting the award's real
  mid-competition rename from "Player of the Tournament" to "Player of the
  Finals" after 2019), each verified via two independent WebSearch passes.
  Wired into `copa-america.astro`'s/`nations-league.astro`'s `noteHeadings`
  and hand-translated into both Croatian sibling pages. Both content files'
  `lastReviewed` bumped to 2026-08-30. All 700 PDFs regenerated and
  reverified clean; full standing health check clean: `pnpm lint` (0/0/0),
  `pnpm test` (513/513 unit), `pnpm build` (711 pages), `check:links`/
  `check:sitemap`/`check:precache`/`check:perf` all clean, full cold-start
  `pnpm test:e2e` after adding new EN+HR assertions for both new sections.
  See `docs/PROJECT_STATUS.md`'s matching entry for detail, including why
  1993's goalkeeper winner and the two non-champion winners (Guevara 2001,
  James Rodríguez 2024) got extra scrutiny. **Left for a future pass:** the
  same environment-blocked items as every recent run (`typescript` 7,
  `docs/SOURCES.md` link-liveness). Every competition/award family now has
  its own individual best-player-style note section wherever the award has
  a clean, continuous history to draw on - the next content-gap pass likely
  needs a genuinely new angle rather than another award-history section.

- **FIFA World Cup Young Player Award and UEFA EURO Young Player of the
  Tournament winners**: closed 2026-08-30 (thirty-fifth intensive run) -
  `pnpm outdated` found nothing new (still just the blocked `typescript` 7
  entry, re-confirmed). The thirty-fourth run's own closing note ("every
  competition/award family now has its own individual best-player-style
  note section... the next content-gap pass likely needs a genuinely new
  angle") held: rather than a seventh best-player-style section, this run
  found the World Cup's and EURO's *young*-player awards (FIFA's "Young
  Player Award", continuous since 2006; UEFA's "Young Player of the
  Tournament", continuous since 2016) still uncovered - a genuinely
  different award from the Golden Ball/Player of the Tournament sections
  already on those same two pages, not a repeat. Added a "Young Player
  Award winners" section to `content/fifa-world-cup.md` (six winners, Lukas
  Podolski 2006 through Pau Cubarsí 2026 - the first defender to win it) and
  a "Young Player of the Tournament winners" section to
  `content/uefa-euro.md` (three winners, Renato Sanches 2016 through Lamine
  Yamal 2024), each verified via two independent WebSearch passes. Wired
  into `world-cup.astro`'s/`euro.astro`'s `noteHeadings` and hand-translated
  into both Croatian sibling pages. `hr/records`'s page weight crossed the
  510 KB budget (513.5 KB) because `/records`' `sourcesHeading`-keyed
  `extractSources()` call pulls in every new `docs/SOURCES.md` citation URL
  under "FIFA World Cup"/"UEFA EURO" - raised `PAGE_WEIGHT_BUDGET_BYTES` to
  520 KB in `scripts/check-page-weight.mjs`, the seventh such deliberate
  raise, with the reasoning on record in that file's own comment. All 700
  PDFs regenerated and reverified clean; full standing health check clean:
  `pnpm lint` (0/0/0), `pnpm test` (513/513 unit), `pnpm build` (711 pages),
  `check:links`/`check:sitemap`/`check:precache`/`check:perf` all clean,
  full cold-start `pnpm test:e2e` (812/812) after updating the World
  Cup/EURO EN+HR notes-count and heading assertions in
  `tests/e2e/mobile.spec.ts`, plus one `exact: true` strict-mode fix the
  EURO English heading assertion needed once "Young Player of the
  Tournament winners" made the old substring match ambiguous. See
  `docs/PROJECT_STATUS.md`'s matching entry for detail. **Left for a future
  pass:** the same environment-blocked items as every recent run
  (`typescript` 7, `docs/SOURCES.md` link-liveness). Both individual awards
  (Ballon d'Or, Golden Boot) and Copa América/Nations League don't have a
  well-known continuous "best young player" equivalent the way World
  Cup/EURO do - worth checking again if one turns up, but not assumed here.

- **Copa América Golden Glove (best goalkeeper) winners**: closed 2026-08-30
  (thirty-sixth intensive run) - `pnpm outdated` found nothing new (still
  just the blocked `typescript` 7 entry, re-confirmed), and `pnpm dlx knip
  --no-config-hints` matched every prior run's baseline (same one confirmed
  false positive). CONMEBOL introduced a Golden Glove for Copa América in
  2011 - a genuinely different, previously-uncovered award from this same
  page's existing Best Player winners section, and (unlike EURO's still
  out-of-scope goalkeeper award) continuous and unambiguous across all six
  editions since its introduction (2011, 2015, 2016, 2019, 2021, 2024), the
  same clean-fit pattern that has driven every award-history addition since
  the thirty-first run. Added a new "Golden Glove winners" note section to
  `content/copa-america.md`, each winner verified via two independent
  WebSearch passes (see `docs/SOURCES.md`'s matching new entry for the full
  citation list). Wired into `copa-america.astro`'s `noteHeadings` (English)
  and hand-translated into `hr/competitions/copa-america.astro`'s own
  `notes` array as "Dobitnici nagrade za najboljeg vratara" (Croatian,
  matching the page's existing hand-translated-notes convention).
  `content/copa-america.md`'s `lastReviewed` was already 2026-08-30 from an
  earlier run this same day, so left unchanged. New e2e coverage in
  `tests/e2e/mobile.spec.ts` (EN + HR heading/content assertions for the new
  section). All 700 PDFs regenerated and reverified clean (`pnpm build:pdfs`
  then `pnpm check:pdfs`, since this content edit and the `docs/SOURCES.md`
  addition both mark every PDF's shared References section stale, by
  design). Full standing health check clean: `pnpm lint` (0/0/0), `pnpm
  test` (513/513 unit, unchanged), `pnpm build` (711 pages), `check:links`
  (715 pages), `check:sitemap` (710 entries), `check:precache` (37 URLs),
  `check:perf` (heaviest page still `hr/records`, within budget). See
  `docs/PROJECT_STATUS.md`'s matching entry for detail. **Left for a future
  pass:** the same environment-blocked items as every recent run
  (`typescript` 7, `docs/SOURCES.md` link-liveness). Nations League's own
  individual-award landscape (only four completed Finals editions, and a
  Golden Glove/Best Young Player mention found for 2021 only in passing
  during this run's research) is murkier than Copa América's clean
  continuous history - worth a dedicated look next time, but not assumed
  here without stronger multi-source confirmation.

- **UEFA Nations League individual-award re-check (confirmed still not
  viable) plus Ballon d'Or Kopa Trophy winners**: closed 2026-08-31
  (thirty-seventh intensive run) - re-investigated the thirty-sixth run's
  flagged Nations League Golden Glove/Young Player of the Finals idea via
  two fresh independent WebSearch passes: **still not viable** - UEFA has
  never presented a Nations League Finals Golden Glove at all (only Team of
  the Tournament/Player of the Match selections), and the Young Player of
  the Finals award has a confirmed name/winner for only one of four
  completed editions (2019, Frenkie de Jong). Not pursued, same reasoning
  as before - this closes the loop rather than leaving it open, and a
  future pass shouldn't re-attempt it without a genuinely new source lead.
  Found a real gap instead: the Ballon d'Or's own companion "best young
  player" prize, the **Kopa Trophy** (continuous since 2018, skipping only
  the cancelled 2020), had never been added. Verified via two independent
  WebSearch passes across all seven awarded editions - Kylian Mbappé (2018)
  through Lamine Yamal (2024 and 2025, the first repeat winner) - no
  discrepancies. Added a "Kopa Trophy winners" section to
  `content/ballon-dor.md`, wired into `competitions/ballon-dor.astro`'s
  `noteHeadings` and hand-translated into
  `hr/competitions/ballon-dor.astro`. New e2e coverage (EN + HR). All 700
  PDFs regenerated and reverified clean (twice - content edit, then the
  `docs/SOURCES.md` addition). Full standing health check clean including a
  full cold-start `pnpm test:e2e`: 816/816 passed (11.8 min, up from 812).
  See `docs/PROJECT_STATUS.md`'s matching entry for detail. **Left for a
  future pass:** the same environment-blocked items as every recent run
  (`typescript` 7, `docs/SOURCES.md` link-liveness). With the Nations
  League gap now confirmed twice as not viable and the Kopa Trophy closing
  the site's last reachable "best young player" gap, the next content-gap
  pass likely needs a genuinely new award family or a different quality
  angle (accessibility, performance, SEO) entirely.

- **FIFA World Cup Silver Ball and Bronze Ball (Golden Ball runners-up)
  winners**: closed 2026-08-31 (thirty-eighth intensive run) - a standing
  health check first (`pnpm outdated`/`pnpm dlx knip --no-config-hints`
  found nothing new; lint/unit/build/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf`/`check:pdfs` all clean, matching the
  thirty-seventh run's baseline exactly). The thirty-seventh run's own
  closing note asked for "a genuinely new award family" - found one right
  next to the World Cup's existing Golden Ball section: the award's two
  runners-up each year, the Silver Ball and Bronze Ball, awarded at every
  edition alongside the Golden Ball since 1982 but never added despite
  being the same award family, not a new one requiring fresh research
  scaffolding. Added a "Silver Ball and Bronze Ball winners" section to
  `content/fifa-world-cup.md` (12 editions, 1982-2026, verified via three
  independent WebSearch passes - full network access to fetch pages
  directly, e.g. FBref or RSSSF, is still blocked, so this run leaned on
  WebSearch's own result snippets and cross-referenced them across
  distinct source domains per fact instead), wired into
  `world-cup.astro`'s `noteHeadings` and hand-translated into
  `hr/competitions/world-cup.astro`. Because `hr/records`'s page weight
  was already at 519.8 KB against the 520 KB budget before this change (0.2
  KB of headroom), raised `PAGE_WEIGHT_BUDGET_BYTES` to 540 KB in
  `scripts/check-page-weight.mjs` (the eighth such deliberate raise) ahead
  of the edit landing it over budget, not after. New e2e coverage (EN + HR
  heading/content assertions, `.notes__card` counts bumped 7 -> 8 for both
  languages) in `tests/e2e/mobile.spec.ts`, which also needed one unrelated
  fix: `content/fifa-world-cup.md`'s `lastReviewed` bump to 2026-08-31 made
  a hardcoded `time[datetime="2026-08-30"]` assertion stale, same as every
  prior content-dated-content run. All 700 PDFs regenerated and reverified
  clean (`pnpm build:pdfs` then `pnpm check:pdfs`, since this content edit
  and the `docs/SOURCES.md` addition both mark every PDF's shared
  References section stale, by design). Full standing health check clean
  including a full cold-start `pnpm test:e2e`: 816/816 passed (8.8
  minutes, unchanged count - a like-for-like heading/count update, no new
  test cases). See `docs/PROJECT_STATUS.md`'s matching entry for detail.
  **Left for a future pass:** the same environment-blocked items as every
  recent run (`typescript` 7, `docs/SOURCES.md` link-liveness, and now also
  direct `WebFetch` access to fbref.com/rsssf.org/blog.wego.com, all
  confirmed `EGRESS_BLOCKED` this run alongside the already-known
  `en.wikipedia.org` block - the egress policy appears to block arbitrary
  external domains broadly, not a specific denylist, so `WebSearch` stays
  the only working verification path). The World Cup's own Golden Ball
  family (Golden Ball, Silver/Bronze Ball, Golden Glove, Young Player
  Award) is now fully covered; the next content-gap pass likely needs
  either a genuinely new award family elsewhere or a different quality
  angle entirely, the same fork the thirty-seventh run's note already
  named.

- **Copa América Golden Boot (top scorer) winners**: closed 2026-08-31
  (thirty-ninth intensive run) - a standing health check first (`pnpm
  install` to restore missing `node_modules`, then lint/unit test/build/
  `check:links`/`check:sitemap`/`check:precache`/`check:perf` all clean:
  513/513 unit tests, 711 pages built, heaviest page still `hr/records`
  within the 540 KB budget). Investigated the thirty-eighth run's own
  closing note (a new award family or a different quality angle) and found
  a clean fit next to Copa América's existing Best Player and Golden Glove
  sections: CONMEBOL's top-scorer award, colloquially the "Golden Boot" the
  same way this site's dedicated Golden Boot page already labels the World
  Cup/EURO scoring races - and, unlike Best Player (1987-) and Golden Glove
  (2011-), derivable for every edition back to the first in 1916, not just
  from a formal introduction year. Ruled out the symmetric UEFA Nations
  League idea first: its four completed Finals mini-tournaments have no
  formally named top-scorer trophy and resolve to messy multi-way ties (14
  players tied on 1 goal in the 2023 Finals) rather than a clean single
  fact per edition - the same "not a reliable single-name award" reasoning
  that already shelved that competition's Golden Glove/Young Player ideas
  twice (thirty-sixth and thirty-seventh runs), so left alone again. Added
  a "Golden Boot winners" note section to `content/copa-america.md`
  covering all 48 editions (1916-2024, both 1959 tournaments), each
  verified via four era-based WebSearch passes plus a second, independent
  cross-check pass using Spanish-language sources for the earliest span and
  two targeted re-checks (1937's winner's correct name; 1959 Argentina's
  edition specifically) - see `docs/SOURCES.md`'s matching new entry for
  the full citation list and methodology. Wired into
  `copa-america.astro`'s `noteHeadings` (English) and hand-translated into
  `hr/competitions/copa-america.astro`'s own `notes` array as "Dobitnici
  Zlatne kopačke" (Croatian, matching the page's existing
  hand-translated-notes convention and the World Cup/EURO Golden Boot
  page's own Croatian label). `content/copa-america.md`'s `lastReviewed`
  bumped to 2026-08-31. New e2e coverage (EN + HR heading/content
  assertions) in `tests/e2e/mobile.spec.ts`. All 700 PDFs regenerated and
  reverified clean (`pnpm build:pdfs` then `pnpm check:pdfs`, using the
  `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` fallback this environment's
  Chromium needs, since this content edit and the `docs/SOURCES.md`
  addition both mark every PDF's shared References section stale, by
  design). Full standing health check clean: `pnpm lint` (0/0/0), `pnpm
  test` (513/513 unit), `pnpm build` (711 pages), `check:links` (715
  pages), `check:sitemap` (710 entries), `check:precache` (37 URLs),
  `check:perf` (heaviest page still `hr/records`, within the 540 KB
  budget). **Left for a future pass:** the same environment-blocked items as
  every recent run (`typescript` 7, `docs/SOURCES.md` link-liveness). With
  Copa América's own top-scorer gap now closed and the Nations League
  equivalent confirmed a third time as not viable, every competition/award
  family on the site now has either a full individual-award set (World Cup:
  Golden Ball, Silver/Bronze Ball, Golden Glove, Young Player Award; EURO:
  Player of the Tournament, Young Player of the Tournament; Copa América:
  Best Player, Golden Glove, Golden Boot; Ballon d'Or: Kopa Trophy) or a
  documented, twice-to-thrice-confirmed reason why a given individual award
  isn't reliably sourceable (EURO's goalkeeper award; Nations League's
  goalkeeper/young-player/top-scorer awards) - the next content-gap pass
  likely needs a genuinely different angle (accessibility, performance,
  SEO, or a fresh read of `docs/WEBSITE_REQUIREMENTS.md` against the live
  site) rather than another award-history section.

- **FIFA World Cup and UEFA Nations League winning managers**: closed
  2026-08-31 (fortieth intensive run) - a standing health check first (`pnpm
  install` to restore missing `node_modules`, then lint/unit test/build/
  `check:links`/`check:sitemap`/`check:precache`/`check:perf`/`pnpm dlx knip
  --no-config-hints` all clean, matching the thirty-ninth run's baseline
  exactly: 513/513 unit tests, 711 pages built, same one confirmed knip false
  positive). The thirty-ninth run's own closing note asked for "a genuinely
  different angle" now that every family has either a full individual-award
  set or a documented reason one isn't sourceable - found one: **who managed
  the winning team**, a fact never added anywhere on the site despite every
  team-competition landing page already listing the winning *team*. Added a
  new "Winning managers" note section to `content/fifa-world-cup.md` (all 23
  champions, 1930-2026, verified via four independent WebSearch passes across
  three era blocks plus a dedicated 2026 re-check) and to
  `content/uefa-nations-league.md` (all four completed Finals, 2019-2025,
  verified via two independent passes) - see `docs/SOURCES.md`'s two matching
  new entries for the full citation list and methodology. Deliberately did
  **not** attempt this for Copa América despite its top billing in this
  routine's own priority order: an initial WebSearch pass for its 48 editions
  (1916-2024) returned specific manager names for the 1916-1924 span that the
  search tool's own summary explicitly flagged as incomplete/unconfirmed
  coverage - the same "no reliable per-fact source" caution that has already
  kept fabricated birth dates out of the site (see "Ideas not yet scoped"
  below) - so left alone rather than risk shipping unverified early-20th-
  century names unattended. Wired into `world-cup.astro`'s/
  `nations-league.astro`'s `noteHeadings` and hand-translated into both
  Croatian sibling pages as "Izbornici prvaka". New e2e coverage (EN + HR
  heading/content assertions for both pages; World Cup's `.notes__card` count
  bumped 8 -> 9 for both languages, Nations League has no fixed count
  assertion to update). `content/uefa-nations-league.md`'s `lastReviewed`
  bumped to 2026-08-31; `content/fifa-world-cup.md`'s was already 2026-08-31
  from the thirty-eighth run, so left unchanged. All 700 PDFs regenerated and
  reverified clean (`pnpm build:pdfs` then `pnpm check:pdfs`, using the
  `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` fallback this environment's
  Chromium needs). Full standing health check clean: `pnpm lint` (0/0/0),
  `pnpm test` (513/513 unit), `pnpm build` (711 pages), `check:links` (715
  pages), `check:sitemap` (710 entries), `check:precache` (37 URLs),
  `check:perf` (heaviest page still `hr/records`, 528.7 KB, within the 540 KB
  budget). **Left for a future pass:** the same environment-blocked items as
  every recent run (`typescript` 7, `docs/SOURCES.md` link-liveness), plus
  Copa América winning managers specifically - worth revisiting only if a
  more authoritative, fully-attributable source for the 1916-1950s span turns
  up (e.g. a dedicated RSSSF or CONMEBOL history page reachable despite the
  standing egress block), not by trusting an unqualified WebSearch summary
  for names that old. EURO winning managers (8 editions, 1960-2024) remain
  unresearched and are likely a safe, well-documented follow-up given the
  World Cup/Nations League experience this run.

- **UEFA EURO winning managers**: closed 2026-08-31 (forty-first intensive
  run) - a standing health check first (`pnpm install` to restore missing
  `node_modules`, then lint/unit test/build/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf` all clean, matching the fortieth run's
  baseline: 513/513 unit tests, 711 pages built). Acted directly on the
  fortieth run's own closing note ("EURO winning managers... likely a safe,
  well-documented follow-up"). Added a new "Winning managers" note section to
  `content/uefa-euro.md` listing the head coach of every champion across all
  17 editions (1960-2024), verified via three independent WebSearch passes
  across three era blocks plus a dedicated fourth pass for 1988's winner
  (Rinus Michels, whose name didn't surface in the first block's round-up
  excerpt) - see `docs/SOURCES.md`'s matching new entry for the full citation
  list and methodology, including the cross-check of Berti Vogts's
  player-and-manager double (1972 as a player, 1996 as Germany's manager),
  the same pattern World Cup winners Zagallo/Beckenbauer/Deschamps already
  document. Wired into `euro.astro`'s `noteHeadings` (English) and
  hand-translated into `hr/competitions/euro.astro`'s own `notes` array as
  "Izbornici prvaka" (also refreshed that file's own stale top-of-array
  comment, which still said "four headings" despite already carrying six).
  `content/uefa-euro.md`'s `lastReviewed` bumped to 2026-08-31. New e2e
  coverage (EN + HR heading/content assertions) in `tests/e2e/mobile.spec.ts`;
  the EURO page has no fixed `.notes__card` count assertion to bump (unlike
  World Cup's). All 700 PDFs regenerated and reverified clean (`pnpm
  build:pdfs` then `pnpm check:pdfs`, using the
  `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` fallback this environment's
  Chromium needs). Full standing health check clean: `pnpm lint` (0/0/0),
  `pnpm test` (513/513 unit), `pnpm build` (711 pages), `check:links` (715
  pages), `check:sitemap` (710 entries), `check:precache` (37 URLs),
  `check:perf` (heaviest page still `hr/records`, 531.5 KB, within the 540 KB
  budget), `pnpm dlx knip --no-config-hints` (same one confirmed false
  positive as every prior run), full cold-start `pnpm test:e2e` (819/819,
  9.0 minutes). **Left for a future pass:** the
  same environment-blocked items as every recent run (`typescript` 7,
  `docs/SOURCES.md` link-liveness), plus Copa América winning managers
  specifically (still blocked on the same unreliable-early-span sourcing the
  fortieth run found). With World Cup, Nations League and now EURO all
  carrying a winning-managers section, the next content-gap pass likely
  needs either a fresh crack at Copa América's sourcing problem or a
  genuinely different angle (accessibility, performance, SEO, or a fresh read
  of `docs/WEBSITE_REQUIREMENTS.md` against the live site).

- **Ballon d'Or Yashin Trophy (best goalkeeper) winners**: closed 2026-09-01
  (forty-second intensive run) - a standing health check first (`pnpm
  install` to restore missing `node_modules`; `pnpm outdated` found one new
  in-range patch release, astro 7.2.9 -> 7.2.10, installed this run; `pnpm
  dlx knip --no-config-hints` matched every prior run's baseline). Tried the
  forty-first run's first suggestion (a fresh crack at Copa América's
  winning-manager sourcing) and confirmed it's still not viable: two
  independent WebSearch passes for the 1916-1921 span **contradicted each
  other** on three of five years, validating rather than overturning the
  earlier caution. Found a genuinely different, well-scoped gap instead: the
  Ballon d'Or's own companion "best goalkeeper" award, the Yashin Trophy
  (continuous since 2019, skipping only the cancelled 2020) - the same shape
  as the already-added Kopa Trophy section on the same page, and distinct
  from the page's existing unrelated "Lev Yashin remains the only goalkeeper
  to win the men's award" note. Verified all six awarded editions (2019,
  2021-2025) via two independent WebSearch passes plus a third targeted
  re-check of the two facts most easily conflated with other Ballon d'Or-
  night storylines - no discrepancies. Added a "Yashin Trophy winners"
  section to `content/ballon-dor.md`, wired into
  `competitions/ballon-dor.astro`'s `noteHeadings` and hand-translated into
  `hr/competitions/ballon-dor.astro`. New e2e coverage (EN + HR). All 700
  PDFs regenerated and reverified clean. Full standing health check clean:
  `pnpm lint` (0/0/0), `pnpm test` (513/513 unit), `pnpm build` (711 pages),
  `check:links`/`check:sitemap`/`check:precache`/`check:perf`/`check:pdfs`
  all clean, full cold-start `pnpm test:e2e`. See `docs/PROJECT_STATUS.md`'s
  matching entry for detail. **Left for a future pass:** the same
  environment-blocked items as every recent run (`typescript` 7,
  `docs/SOURCES.md` link-liveness), plus Copa América winning managers
  specifically - now confirmed twice as genuinely contradictory-sourced for
  its earliest span, not just thinly sourced, so a future pass needs a
  better source lead than general WebSearch summaries before retrying. With
  the Ballon d'Or's own individual-award companions now complete, the next
  content-gap pass likely needs a genuinely different angle (accessibility,
  performance, SEO, or a fresh read of `docs/WEBSITE_REQUIREMENTS.md`
  against the live site).

- **FIFA World Cup winning captains**: closed 2026-09-01 (forty-third
  intensive run) - a standing health check first (`pnpm install`, `pnpm
  outdated`/`pnpm dlx knip --no-config-hints` found nothing new, full
  lint/test/build/`check:*` suite matched the forty-second run's baseline).
  The forty-second run's own closing note asked for "a genuinely new angle";
  found one next to the existing "Winning managers" sections: who captained
  the winning team, never recorded anywhere on the site. Scoped to the World
  Cup only this run (23 editions, 1930-2026, verified via two independent
  WebSearch passes with zero discrepancies - see `docs/SOURCES.md`'s
  matching entry). Added a "Winning captains" section to
  `content/fifa-world-cup.md`, wired into `world-cup.astro`'s `noteHeadings`
  and hand-translated into `hr/competitions/world-cup.astro` as "Kapetani
  prvaka". New e2e coverage (EN + HR, `.notes__card` counts 9 -> 10). All
  700 PDFs regenerated and reverified clean; full standing health check
  clean including a cold-start `pnpm test:e2e`. See
  `docs/PROJECT_STATUS.md`'s matching entry for detail. **Left for a future
  pass:** the same environment-blocked items as every recent run
  (`typescript` 7, `docs/SOURCES.md` link-liveness), plus Copa América
  winning managers specifically (still blocked on contradictory early
  sourcing). **Next up:** UEFA EURO and UEFA Nations League winning
  captains - both already have a proven-sourceable "Winning managers"
  section to sit alongside, the same low-risk pattern. Copa América
  captains would face the same early-span sourcing risk already documented
  for its managers, so should wait for a better source lead. `hr/records`'s
  page weight is at 537.7 KB against the 540 KB budget (2.3 KB headroom) -
  the next content addition that grows `docs/SOURCES.md` further will
  likely need another deliberate budget raise in
  `scripts/check-page-weight.mjs`.

- **UEFA EURO and UEFA Nations League winning captains**: closed 2026-09-01
  (forty-fourth intensive run) - a standing health check first (`pnpm
  install`, `pnpm outdated` found nothing new beyond the still-blocked
  `typescript` 7 entry, `pnpm dlx knip --no-config-hints` matched every prior
  run's baseline). Acted directly on the forty-third run's own "Next up"
  note: added a "Winning captains" section to `content/uefa-euro.md` (all 17
  editions, 1960-2024) and `content/uefa-nations-league.md` (all four
  completed editions, 2019-2025), the same shape as the World Cup's own
  section from the prior run, verified via two independent WebSearch passes
  per competition (see `docs/SOURCES.md`'s two matching new entries for the
  full citation list and methodology, including the specific re-check of
  Bernard Dietz's 1980 EURO captaincy and Jordi Alba's 2023 Nations League
  captaincy). Wired into `euro.astro`'s/`nations-league.astro`'s
  `noteHeadings` and hand-translated into both Croatian sibling pages as
  "Kapetani prvaka". `content/uefa-euro.md`'s and
  `content/uefa-nations-league.md`'s `lastReviewed` bumped to 2026-09-01.
  New e2e coverage (EN + HR heading/content assertions for both pages) in
  `tests/e2e/mobile.spec.ts`. `hr/records`'s page weight crossed the 540 KB
  budget (540.8 KB) because `/records`' `sourcesHeading`-keyed
  `extractSources()` call pulls in the two new `docs/SOURCES.md` citation
  blocks - raised `PAGE_WEIGHT_BUDGET_BYTES` to 560 KB in
  `scripts/check-page-weight.mjs` (the ninth such deliberate raise, reasoning
  on record in that file's own comment). All 700 PDFs regenerated and
  reverified clean (`pnpm build:pdfs` then `pnpm check:pdfs`, since these
  content edits and the `docs/SOURCES.md` additions both mark every PDF's
  shared References section stale, by design). Full standing health check
  clean: `pnpm lint` (0/0/0), `pnpm test` (513/513 unit, unchanged), `pnpm
  build` (711 pages), `check:links` (715 pages), `check:sitemap` (710
  entries), `check:precache` (37 URLs), `check:perf` (heaviest page
  `hr/records`, within the new 560 KB budget), `check:pdfs` (700/700 fresh).
  A full cold-start `pnpm test:e2e` confirmed the new assertions: 822/822
  passed (13.2 minutes), up from the forty-third run's 821/821, with no
  pre-existing assertion needing an update. See `docs/PROJECT_STATUS.md`'s
  matching entry for detail. **Left for a future pass:**
  the same environment-blocked items as every recent run (`typescript` 7,
  `docs/SOURCES.md` link-liveness), plus Copa América winning
  managers/captains specifically (still blocked on contradictory early
  sourcing). With World Cup, EURO and Nations League all carrying a
  "Winning captains" section, the next content-gap pass likely needs either
  a fresh crack at Copa América's sourcing problem or a genuinely different
  angle (accessibility, performance, SEO, or a fresh read of
  `docs/WEBSITE_REQUIREMENTS.md` against the live site).

- **Copa América winning managers (1975-2024, scoped)**: closed 2026-09-01
  (forty-fifth intensive run) - a standing health check first (`pnpm
  install`, `pnpm outdated` found nothing new beyond the still-blocked
  `typescript` 7 entry, `pnpm dlx knip --no-config-hints` matched every prior
  run's baseline, full lint/unit/build/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf`/`check:pdfs` all clean). Acted on the
  forty-fourth run's own closing note ("a fresh crack at Copa América's
  sourcing problem or a genuinely different angle"): rather than retry the
  full 1916-2024 span a third time (already found contradictory in the
  fortieth and forty-second runs), scoped the new "Winning managers" section
  to the 19 editions from 1975 onward - the year Copa América adopted its
  current name and modern home-and-away/knockout format - where sourcing
  proved reliably cross-confirmed, the same "since the era/award actually
  started" scoping this page's own Best Player (1987-) and Golden Glove
  (2011-) sections already use. Verified all 19 post-1975 editions via two
  independent WebSearch passes with zero discrepancies (see
  `docs/SOURCES.md`'s matching new entry for the full citation list and
  methodology). Wired into `copa-america.astro`'s `noteHeadings` (English)
  and hand-translated into `hr/competitions/copa-america.astro`'s own
  `notes` array as "Izbornici prvaka", matching the World Cup/EURO/Nations
  League pages' existing convention for this exact section name.
  `content/copa-america.md`'s `lastReviewed` bumped to 2026-09-01. New e2e
  coverage (EN + HR heading/content assertions) in `tests/e2e/mobile.spec.ts`.
  All 700 PDFs regenerated and reverified clean (`pnpm build:pdfs` then `pnpm
  check:pdfs`, using the `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`
  fallback this environment's Chromium needs, since this content edit and the
  `docs/SOURCES.md` addition both mark every PDF's shared References section
  stale, by design). Full standing health check clean: `pnpm lint` (0/0/0),
  `pnpm test` (513/513 unit, unchanged - presentation-layer content, no new
  unit-testable logic), `pnpm build` (711 pages, unchanged - no new route),
  `check:links` (715 pages), `check:sitemap` (710 entries), `check:precache`
  (37 URLs), `check:perf` (heaviest page `hr/records`, 544.7 KB, within the
  560 KB budget - 15.3 KB of headroom left). **Left for a future pass:** the
  same environment-blocked items as every recent run (`typescript` 7,
  `docs/SOURCES.md` link-liveness), plus Copa América winning **captains**
  specifically - not attempted this run since the managers-only scope was
  already a full vertical slice; captains for the same 1975-2024 span are the
  natural next step now that the sourcing pattern for this era is proven
  reliable, following the same World Cup/EURO/Nations League
  managers-then-captains order already established. Copa América's own
  pre-1975 managers/captains stay out of scope entirely (confirmed
  contradictory-sourced three times now: fortieth, forty-second and this
  run's own decision not to retry).

- **Copa América winning captains (2011-2024, narrowly scoped)**: closed
  2026-09-01 (forty-sixth intensive run) - a standing health check first
  (`pnpm install`, `pnpm outdated` found nothing new beyond the still-blocked
  `typescript` 7 entry, `pnpm dlx knip --no-config-hints` matched every prior
  run's baseline, full lint/unit/build all clean). Acted on the
  forty-fifth run's own "natural next step" note (captains for the same
  1975-2024 span the Winning managers section now covers) and found the
  premise didn't hold: captain identification is a materially harder fact
  to source than manager identification, not the same reliable pattern.
  A first WebSearch pass found plausible names for 1975 and 1979 but
  repeatedly failed for 1983, 1987 and 1989 - one attempt for 1987 returned
  an outright fabricated answer (a former Uruguayan head of state's name,
  not a footballer). A second, more rigorous cross-check pass then
  **directly contradicted** two editions this run had initially logged as
  confirmed: 1995 (one pass said Bengoechea captained "in Francescoli's
  absence"; a second, sourced from an ESPN Deportes retrospective, said
  Francescoli himself was captain and lifted the trophy) and 2004 (a
  summary naming Alex as 2004 captain also, in the same breath, wrongly
  credited him with the 1999 captaincy independently attributed to Cafu).
  Given two directly contradictory results on facts already logged as
  confirmed, the entire 1975-2010 span was dropped rather than ship any of
  it unverified - not just the outright-fabricated years. Narrowed instead
  to the same six editions the page's own Golden Glove section already
  covers (2011-2024), each re-verified against an unambiguous source (an
  official CONMEBOL/copaamerica.com article, a multi-outlet-corroborated
  news event, or undisputed public record for the two Messi editions) with
  no contradiction across any of them: 2011 Diego Lugano, 2015/2016 Claudio
  Bravo, 2019 Dani Alves (took the armband from Neymar after an off-field
  incident), 2021/2024 Lionel Messi. See `docs/SOURCES.md`'s matching new
  entry for the full citation list and methodology, including the specific
  contradictions found. Wired into `copa-america.astro`'s `noteHeadings`
  (English) and hand-translated into `hr/competitions/copa-america.astro`'s
  own `notes` array as "Kapetani prvaka", matching the World Cup/EURO/
  Nations League pages' existing convention for this exact section name,
  with its own scoping note explaining the narrower range (unlike those
  three pages' captains sections, which cover their full winning-managers
  span). `content/copa-america.md`'s `lastReviewed` was already
  2026-09-01 from the forty-fifth run, so left unchanged. New e2e coverage
  (EN + HR heading/content assertions) in `tests/e2e/mobile.spec.ts`. All
  700 PDFs regenerated and reverified clean (`pnpm build:pdfs` then `pnpm
  check:pdfs`, using the `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`
  fallback this environment's Chromium needs, since this content edit and
  the `docs/SOURCES.md` addition both mark every PDF's shared References
  section stale, by design). Full standing health check clean: `pnpm lint`
  (0/0/0), `pnpm test` (513/513 unit, unchanged - presentation-layer
  content, no new unit-testable logic), `pnpm build` (711 pages, unchanged
  - no new route), `check:links` (715 pages), `check:sitemap` (710
  entries), `check:precache` (37 URLs), `check:perf` (heaviest page
  `hr/records`, 546.4 KB, within the 560 KB budget - 13.6 KB of headroom
  left). **Left for a future pass:** the same environment-blocked items as
  every recent run (`typescript` 7, `docs/SOURCES.md` link-liveness), plus
  Copa América winning captains for 1975-2010 specifically - this run's
  finding is that this span isn't safely recoverable via WebSearch-only
  verification (two independent passes actively disagreed, not just gaps),
  so a future pass would need a genuinely better source lead (e.g. direct
  Wikipedia squad-page or RSSSF access, both still egress-blocked here)
  rather than another round of the same search method. With every
  reliably-sourceable individual-award and personnel angle across all six
  competition/award families now shipped, the next content-gap pass likely
  needs either that better source lead or a genuinely different quality
  angle (accessibility, performance, SEO, or a fresh read of
  `docs/WEBSITE_REQUIREMENTS.md` against the live site).

- **`prefers-contrast: more` support plus a dependency patch bump**: closed
  2026-09-01 (forty-seventh intensive run) - `pnpm outdated` found one new
  in-range patch release (`@types/node` 26.4.0 -> 26.4.1, installed),
  `pnpm dlx knip --no-config-hints` matched every prior run's baseline, and
  `pnpm audit` reported no known vulnerabilities. Tried the content angle
  first per the forty-sixth run's closing note: two independent WebSearch
  passes each investigated a Copa América "Best Young Player" award and a
  Copa América "Fair Play Award" as new sections - both confirmed
  unreliable (the former only awarded "intermittently" per its own
  Wikipedia summary; the latter returned a winner for only one of six
  candidate editions), so neither was pursued, matching the standing
  "don't ship a partial/unreliable per-edition dataset" rule. Pivoted to
  accessibility and found a genuine gap: `global.css` already handles
  `prefers-reduced-motion` and `forced-colors` but never
  `prefers-contrast: more`. Added four new contrast-mode color tokens
  (`--light-contrast-border`/`--light-contrast-text-muted`/
  `--dark-contrast-border`/`--dark-contrast-text-muted`), each chosen by
  computing exact WCAG ratios against every background token (light border
  1.29:1 -> 5.15:1, light text-muted 5.80:1 -> 9.05:1 AAA, dark border
  1.59:1 -> 5.72:1, dark text-muted 8.30:1 -> 11.95:1), wired through a new
  `@media (prefers-contrast: more)` block that mirrors the existing
  four-block color-scheme resolution shape exactly (default, OS-dark
  override, explicit light, explicit dark) to avoid the same split-theme
  bug class the `--danger` token comment already documents. New
  `tests/e2e/accessibility-prefers-contrast.spec.ts` (6 cases) covers all
  four color-scheme x contrast combinations plus two no-preference
  baselines. No PDF regeneration needed (`global.css` isn't a tracked PDF
  source file). Full standing health check clean: `pnpm lint` (0/0/0),
  `pnpm test` (513/513 unit, unchanged), `pnpm build` (711 pages,
  unchanged), `check:links` (715 pages), `check:sitemap` (710 entries),
  `check:precache` (37 URLs), `check:perf` (heaviest page `hr/records`,
  547.0 KB, within the 560 KB budget), `pnpm audit` clean, full cold-start
  `pnpm test:e2e` - 832/832 passed (up from the forty-fourth run's 822/822
  baseline, +10: this run's 6 new `accessibility-prefers-contrast.spec.ts`
  cases plus a few the forty-fifth/forty-sixth content-only runs added; 2
  tests flaked with a transient `net::ERR_CONNECTION_REFUSED` against the
  preview server on the full run, both confirmed passing on an isolated
  16/16 re-run of their file, not a regression from this run's change).
  See `docs/PROJECT_STATUS.md`'s matching entry for the full reasoning,
  including why the two content-angle ideas were rejected.
  **Left for a future pass:** the same environment-blocked items as every
  recent run (`typescript` 7, `docs/SOURCES.md` link-liveness), plus Copa
  América winning captains for 1975-2010 (needs a genuinely different
  verification path). `prefers-reduced-data` is the only remaining
  standing OS accessibility media-feature preference left unexamined,
  though likely low-yield given this site has very little heavy media to
  begin with.

- **FIFA World Cup Fair Play Award winners**: closed 2026-09-02
  (forty-eighth intensive run) - a standing health check first (`pnpm
  install`, `pnpm outdated` found nothing new beyond the still-blocked
  `typescript` 7 entry, `pnpm dlx knip --no-config-hints` matched every
  prior run's baseline, full lint/unit/build clean: 513/513 unit tests, 711
  pages built). The forty-seventh run investigated a Copa América "Fair
  Play Award" and found it unreliable (a winner for only one of six
  candidate editions); this run found a distinct, well-scoped gap right on
  the World Cup's own page instead - FIFA's own team Fair Play Award,
  continuous since 1970 (unlike Copa América's intermittent one), never
  added despite sitting next to five other individual/team award sections
  already on `content/fifa-world-cup.md`. Verified via four independent
  WebSearch passes covering all 15 award instances (1970-2026): the first
  pass's own summary implied a post-2018 discontinuation that a second pass
  directly contradicted (England won in 2022); a third pass confirmed the
  2026 winner (Netherlands, cross-checked against an NL Times article and
  FIFA's own Facebook announcement) and independently reproduced the full
  1970-2026 list with no disagreement on any pre-2022 year; a fourth pass
  re-checked the award's only two shared/tied years (1998: England and
  France; 2006: Brazil and Spain) - see `docs/SOURCES.md`'s matching new
  entry for the full citation list and methodology, including why the
  first pass's discontinuation claim was set aside as a misreading rather
  than a sourced fact. Added a "Fair Play Award winners" section to
  `content/fifa-world-cup.md` between "Young Player Award winners" and
  "Winning managers", wired into `world-cup.astro`'s `noteHeadings`
  (English) and hand-translated into `hr/competitions/world-cup.astro`'s
  own `notes` array as "Dobitnici nagrade Fair Play". `content/fifa-world-
  cup.md`'s `lastReviewed` bumped to 2026-09-02. Also removed two stale,
  never-rendered planning notes found while reading the six competition
  content files end to end: `content/uefa-nations-league.md`'s "Website
  idea" section (a podium-card-plus-league-explanation suggestion that
  `PodiumCards`/the page's own "How it works" section had already fully
  implemented) and `content/fifa-world-cup.md`'s "Suggested child-friendly
  features" section (all three ideas - tap-a-year stories, a champion-guess
  quiz question, and a visual title-count comparison - already live via the
  edition-page "Memorable moments" reveal, `championByYearQuestions`/
  `hostByYearQuestions` in `src/lib/quiz.ts`, and `ChampionsSummary.astro`'s
  bar chart respectively); neither heading was ever wired into a page's
  `noteHeadings`, so removing them changes no rendered page.
  `content/uefa-nations-league.md`'s `lastReviewed` was left unchanged (no
  reader-visible fact changed, only dead scaffolding text removed). New e2e
  coverage (EN + HR heading/content assertions, `.notes__card` counts 10 ->
  11 for both languages) in `tests/e2e/mobile.spec.ts`. All 700 PDFs
  regenerated and reverified clean (`pnpm build:pdfs` then `pnpm
  check:pdfs`, using the `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`
  fallback this environment's Chromium needs, since these content edits and
  the `docs/SOURCES.md` addition both mark every PDF's shared References
  section stale, by design). Full standing health check clean: `pnpm lint`
  (0/0/0), `pnpm test` (513/513 unit, unchanged - presentation-layer
  content, no new unit-testable logic), `pnpm build` (711 pages,
  unchanged), `check:links` (715 pages), `check:sitemap` (710 entries),
  `check:precache` (37 URLs), `check:perf` (heaviest page `hr/records`,
  550.4 KB, within the 560 KB budget), `check:pdfs` (700/700 fresh). A full
  cold-start `pnpm test:e2e` first caught one pre-existing hardcoded
  assertion needing an update - `tests/e2e/mobile.spec.ts`'s World Cup
  "last reviewed" date locator was still pinned to `2026-09-01` - the same
  "existing hardcoded assertion needed updating" pattern several prior
  content-adding runs have hit; fixed, then a clean re-run passed 832/832
  (matching the forty-seventh run's own 832/832 baseline unchanged - this
  run's new assertions extended existing `test()` blocks rather than adding
  new ones). **Left for a future pass:** the same
  environment-blocked items as every recent run (`typescript` 7,
  `docs/SOURCES.md` link-liveness), plus Copa América winning captains for
  1975-2010 (needs a genuinely different verification path). With the
  World Cup's own individual/team award set now also covering Fair Play,
  the next content-gap pass likely needs either a fresh look at whether
  EURO or Copa América has an equally reliable, continuous team-level award
  never yet checked (Fair Play or otherwise), or a genuinely different
  quality angle (accessibility, performance, SEO, or a fresh read of
  `docs/WEBSITE_REQUIREMENTS.md` against the live site).

- **Ballon d'Or Gerd Müller Trophy (top goalscorer) winners**: closed
  2026-09-02 (forty-ninth intensive run) - a standing health check first
  (`pnpm install`, `pnpm outdated` found nothing new beyond the still-blocked
  `typescript` 7 entry, `pnpm dlx knip --no-config-hints` matched every prior
  run's baseline, full lint/unit/build/`check:links`/`check:sitemap`/
  `check:precache`/`check:perf` all clean, 513/513 unit tests, 711 pages
  built). Investigated the forty-eighth run's own closing note first: two
  targeted WebSearch passes confirmed **EURO has no official per-tournament
  team Fair Play award at all** (its five official post-tournament awards are
  Player of the Tournament, Top Scorer, Young Player, Man of the Match and
  Team of the Tournament - Fair Play isn't among them, a definitive negative
  finding rather than the "unofficial/inconsistent naming" caution already on
  record for its goalkeeper award), and a fresh WebSearch independently
  reconfirmed Nations League Finals top-scorer data is still an unreliable
  multi-way-tie award (2023's Finals: 14 players tied on 1 goal each),
  matching the thirty-ninth run's existing "not a reliable single-name award"
  finding. Found a genuinely new, well-scoped gap instead: the Ballon d'Or's
  own third companion award, the **Gerd Müller Trophy** (top goalscorer,
  club and country combined) - the same shape as the already-added Kopa and
  Yashin Trophy sections on the same page, continuous since 2021 with no gap
  year (unlike Kopa/Yashin, it started after the 2020 Ballon d'Or
  cancellation rather than spanning it). Verified all five awarded editions
  via two independent WebSearch passes with zero discrepancies: Robert
  Lewandowski (2021 and 2022, the only repeat winner), Erling Haaland (2023),
  Harry Kane and Kylian Mbappé jointly (2024, the trophy's only tie), Viktor
  Gyökeres (2025) - both passes also agreed on a genuine naming nuance worth
  recording: the award was first presented in 2021 as "Striker of the Year"
  and renamed the Gerd Müller Trophy from 2022 onward, honoring Müller after
  his August 2021 death (see `docs/SOURCES.md`'s matching new entry for the
  full citation list). Added a "Gerd Müller Trophy winners" section to
  `content/ballon-dor.md`, wired into `competitions/ballon-dor.astro`'s
  `noteHeadings` (English) and hand-translated into
  `hr/competitions/ballon-dor.astro`'s own `notes` array as "Dobitnici
  nagrade Gerd Müller Trophy". `content/ballon-dor.md`'s `lastReviewed`
  bumped to 2026-09-02. New e2e coverage (EN + HR heading/content
  assertions) in `tests/e2e/mobile.spec.ts`; this page has no fixed
  `.notes__card` count assertion to bump (unlike World Cup's). All 700 PDFs
  regenerated and reverified clean (`pnpm build:pdfs` then `pnpm
  check:pdfs`, using the `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`
  fallback this environment's Chromium needs, since this content edit and
  the `docs/SOURCES.md` addition both mark every PDF's shared References
  section stale, by design). Full standing health check clean: `pnpm lint`
  (0/0/0), `pnpm test` (513/513 unit, unchanged - presentation-layer
  content, no new unit-testable logic), `pnpm build` (711 pages, unchanged -
  no new route), `check:links` (715 pages), `check:sitemap` (710 entries),
  `check:precache` (37 URLs), `check:perf` (heaviest page `hr/records`,
  553.2 KB, within the 560 KB budget - 6.8 KB of headroom left). A first
  push to CI caught a real strict-mode locator bug in two of the new e2e
  assertions (both "Kylian Mbappé (France)" and "Robert Lewandowski
  (Poland)" collided with an existing mention elsewhere on the same page);
  fixed with `.first()` and reverified both locally (full cold-start `pnpm
  test:e2e`, 834/834, up from 832) and on CI (green on the fix commit). See
  `docs/PROJECT_STATUS.md`'s matching entry for detail. **Left for a future
  pass:** the same environment-blocked items
  as every recent run (`typescript` 7, `docs/SOURCES.md` link-liveness),
  plus Copa América winning captains for 1975-2010 (needs a genuinely
  different verification path). With EURO's Fair Play idea now definitively
  ruled out (not just "less reliable" but confirmed not an official award at
  all) and Nations League's top-scorer idea reconfirmed unviable a second
  time, and the Ballon d'Or's own companion-award set now complete (Kopa,
  Yashin, Gerd Müller), the next content-gap pass likely needs either a
  fresh source lead for Copa América's pre-1975/1975-2010 sourcing problems
  or a genuinely different quality angle - `hr/records`'s page weight has
  only 6.8 KB of headroom left against the 560 KB budget, so a future
  content addition that grows `docs/SOURCES.md` further will likely need
  another deliberate budget raise in `scripts/check-page-weight.mjs`.

## Ideas not yet scoped as backlog

Raised in passing across `docs/PROJECT_STATUS.md` entries but never turned
into a concrete plan - worth a look next time the health check above comes
back clean:

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
