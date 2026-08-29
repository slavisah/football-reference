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
