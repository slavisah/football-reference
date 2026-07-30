# Project status and handoff

Snapshot for the next contributor (human or coding agent) of **The Ultimate
Football Reference**. It says what is built, what was decided, and what is left.

- **Repo:** <https://github.com/slavisah/football-reference> (public)
- **Live site:** <https://slavisah.github.io/football-reference/>
- **Stack:** Astro + TypeScript + pnpm, static output, Markdown as source of
  truth. Vitest (unit) + Playwright (mobile smoke). Deploys via GitHub Actions
  to GitHub Pages.

## How to run

```bash
pnpm install
pnpm dev                       # local preview
pnpm lint                      # astro check (types)
pnpm test                      # 76 Vitest unit tests
pnpm build                     # static build + all content validation
PW_CHROME_CHANNEL=chrome pnpm test:e2e   # 48 Playwright tests at 360px
```

Publishing: push to `main`; the Pages workflow builds and deploys.

## Done - Milestone 1 (complete and verified)

All Milestone 1 items from `prompts/INITIAL_CODING_AGENT_PROMPT.md` are
implemented, and every acceptance scenario passes.

- [x] Shared page shell, navigation, footer
- [x] Home page (with live champion counts read from the tables)
- [x] FIFA World Cup page
- [x] UEFA EURO page
- [x] Reusable responsive tournament table (stacks into cards on mobile)
- [x] Filter by **winner** and **year**, shareable via URL query params
- [x] **Generated** champions summary (from the table, not hand-maintained)
- [x] References section with source links (from `docs/SOURCES.md`)
- [x] Visible `lastReviewed` date per page
- [x] Accessible print styles (A4 landscape; hidden rows still print)
- [x] Mobile layout at 360px with no horizontal overflow
- [x] Light and dark themes (OS default + persisted toggle, no flash)
- [x] Build-time validation of front matter and tables
- [x] Vitest unit tests (19) and Playwright mobile smoke test (5)
- [x] GitHub Pages deploy workflow (live and green)

### Acceptance scenarios -> status

1. Child finds the 2018 World Cup champion on a phone, no overflow - **pass**
2. Selecting Spain shows Spain's title years - **pass**
3. Print the World Cup table on A4 landscape - **pass** (print stylesheet)
4. Every competition page shows `lastReviewed` and source links - **pass**
5. Keyboard users can operate filters - **pass**
6. `pnpm build`, `pnpm test`, mobile Playwright test pass - **pass**
7. Deploys to GitHub Pages via Actions - **pass**

### Where the important code is

- `src/lib/markdownTable.ts` - GFM table parser
- `src/lib/editions.ts` - normalizes rows, builds champions summary + winner list
- `src/lib/validate.ts` - build-time validation rules
- `src/lib/countries.ts` - the West Germany/Germany grouping
- `src/lib/competition.ts` - loads a competition (editions + summary + sources)
- `src/components/TournamentTable.astro` - table + filters (client script)
- `src/components/ChampionsSummary.astro`, `References.astro`, `CompetitionView.astro`
- `src/content.config.ts` - front-matter schema (zod)
- `.github/workflows/deploy.yml` - CI build + Pages deploy

## Decisions on record

- **West Germany is counted as Germany** in the generated title totals only,
  displayed as "Germany (incl. West Germany)". This is the single sporting-
  successor grouping applied, because it is the only one the source content
  itself makes. The **edition tables always keep the historical name**, and the
  winner filter lists "West Germany" and "Germany" separately on purpose.
  Implemented in `src/lib/countries.ts`; explained on-page under the summary.
- **Emoji policy = allowed in UI accents and in Markdown content ("Both").**
  Decided, but **not yet implemented** (see "Left to do"). Conventions are
  written in `docs/ADDING_CONTENT.md` section 6: family-friendly and sparing,
  never inside data-table cells, and **no flag emojis for defunct nations**
  (West Germany, Soviet Union, Yugoslavia, Czechoslovakia).
- **Markdown stays the source of truth**; tables are parsed at build time. No
  `generated/` JSON was needed yet.
- **Champions summary is generated**, so any hand-written totals table in a
  content file is intentionally not rendered.
- **Base path is repository-agnostic**: `astro.config.mjs` reads `SITE_URL` and
  `BASE_PATH` from env, which the deploy workflow fills from
  `actions/configure-pages`.

## Left to do

### Home page follow-up (found in UI review, 2026-07-28)

- [x] Home page cards - fixed 2026-07-28 (intensive run). `index.astro` now
      loads all six live competitions (World Cup, EURO, Copa América,
      Nations League, Ballon d'Or, Golden Boot) and renders a card for each,
      in that order, matching the nav. Individual-award cards (Ballon d'Or,
      Golden Boot) use a `statLabel` override ("Most awards" instead of
      "Most titles") so the copy still reads correctly. Kept the hero
      "explore" buttons limited to the top 2 (World Cup, EURO) per the
      earlier open question, since 6 buttons would clutter the hero; the
      features section now links to the new `/records` page instead.
- [x] Nav on narrow viewports - checked 2026-07-28 with the new 8th link
      (Records) added; `.nav-list` still wraps cleanly at 360px (covered by
      the new Playwright "no horizontal page overflow" home-page test). No
      "More" grouping needed yet.
- [x] Add tournament-level "best scorer" facts to competition pages, sourced
      from `content/golden-boot.md` - added 2026-07-29 (intensive run). The
      World Cup and EURO pages (`world-cup.astro`, `euro.astro`) now load the
      matching Golden Boot table (by year, which lines up exactly with both
      competitions' editions) alongside their own data and join it in as an
      extra "Top scorer" table column, e.g. "Just Fontaine (France, 13
      goals)". Implemented as a generic `extraColumn` prop on
      `TournamentTable.astro` (label + a `Map<year, text>`, forwarded through
      `CompetitionView.astro`) rather than a one-off - reusable for a future
      "best goalkeeper" fact if that content is ever added - and the new
      `buildTopScorerFacts()` in `src/lib/editions.ts` builds the display
      string from the Player(s)/Team/Goals columns, falling back to just the
      player name when team/goals aren't present. A missing year (there are
      none today for these two competitions) renders an em dash rather than
      breaking the row. This is purely a joined display column, not new
      editorial content, so no validation or filter changes were needed; the
      existing per-row `data-label` mobile-card CSS handles it for free.
      Covered by 3 new Vitest cases (`buildTopScorerFacts`) and 2 new
      Playwright cases (World Cup 1930/2018, EURO 2016) at 360px, plus the
      existing no-overflow checks now also run against a new EURO
      `describe` block (previously untested on its own).
      "Best goalkeeper" is **not implemented** - no goalkeeper-award
      editorial content exists in `content/` yet, would need that added
      first.
- [x] Table sort order - fixed 2026-07-28. The year-sort was only wired up
      for the filter dropdown; the actual table rows rendered in source
      (oldest-first) order. `TournamentTable.astro` now renders a
      `displayEditions` copy sorted newest-first, applied to every
      competition page since they share this component.

### Emoji decision ("Both") - implemented 2026-07-29 (intensive run)

- **UI accents** (decorative, `aria-hidden="true"`): 🏆 on the "Champions by
  titles" heading (`ChampionsSummary.astro`, so it reads correctly wherever the
  component is reused, e.g. "Most awards"); 📚 on the References heading
  (`References.astro`); a per-competition icon on each home page card's `<h2>`
  and a small icon per line in the home page feature list
  (`src/pages/index.astro`).
- **Content emojis**: not added to the Markdown prose itself (see the new
  "Editorial notes sections" entry below - that content now renders on the
  page verbatim, and `docs/ADDING_CONTENT.md` section 6 already covers new
  emoji added to `content/*.md` going forward).

### Editorial notes sections (Memorable moments, etc.) - added 2026-07-29 (intensive run)

Every competition content file has "Memorable moments" / "Editorial notes" /
"Format milestones" / "Key facts" / etc. sections under `## ` headings that
were being parsed only for the Editions table and then silently dropped - none
of that writing ever reached a page. New `src/lib/notes.ts`
(`extractSection`/`extractSections`, mirrors the `extractSources` pattern in
`src/lib/sources.ts`) pulls a section verbatim by heading text: one item per
bullet, or the section's lines joined into a paragraph when it has no
bullets. `loadCompetition()` gained an optional `noteHeadings` option
(`src/lib/competition.ts`) so each page opts into the specific headings worth
showing readers; the new `EditorialNotes.astro` component renders them as
cards (🎉 accent for "Memorable moments", 📝 for the rest) between the
champions summary and the references section, via `CompetitionView.astro`
(and directly on the golden-boot page, which composes its layout by hand).
Meta/internal-note headings that talk to a coding agent rather than a reader
(Copa América's "Important editorial warning", Nations League's "Website
idea", World Cup's "Suggested child-friendly features") are intentionally
**not** requested, so they stay out of the reader-facing page. One stray
meta-sounding sentence inside Golden Boot's otherwise reader-facing "EURO
notes" section ("A website should distinguish...") was reworded into plain
reader-facing prose (`content/golden-boot.md`) - no scores, names, or years
were touched.
Pages now show: World Cup (Format milestones, Memorable moments, Editorial
notes), EURO (Historical format note, Memorable moments), Copa América
(Memorable moments), Nations League (Key facts), Ballon d'Or (Notes), Golden
Boot (World Cup notes, EURO notes). A single non-bulleted section (EURO's
"Historical format note") renders as a paragraph instead of a one-item list.
Inline `**bold**`/`*italic*`/`` `code` `` in the note text is converted to
real HTML via a small `renderInlineMarkdown()` (escapes first, so it can't be
used to inject markup) - not a general Markdown parser, just the three forms
these notes actually use.
Covered by 10 new Vitest cases (`tests/unit/notes.test.ts`) and 3 new
Playwright cases at 360px (World Cup's three sections incl. the *Maracanazo*
italic check, EURO's paragraph-vs-list rendering, Golden Boot's two merged
note sections).
- [ ] Not yet done: Copa América's "Titles after 2024" and Ballon d'Or's
  "Multiple winners through 2025" are full Markdown tables, not bullet/prose
  sections, so `extractSection()` doesn't handle them and they're still
  unused - would need a small table-rendering variant of this feature if a
  future pass wants them on the page too (the generated `ChampionsSummary`
  already covers similar ground for both, so this is a nice-to-have, not a
  gap).

### Milestone 2: remaining pages (content already exists in `content/`)

Reuse the same `loadCompetition` + `CompetitionView` pattern (see
`docs/ADDING_CONTENT.md` section 7). Note the table headings in these files may
differ from `## Editions` and will need the matching `editionsHeading`:

- [x] Copa América (`content/copa-america.md`) - used `editionsHeading:
      'Champions timeline'` and `allowDuplicateYears: ['1959']` for the two 1959
      editions. Page at `src/pages/competitions/copa-america.astro`.
- [x] UEFA Nations League (`content/uefa-nations-league.md`) - uses seasons
      like `2018-19`; the parser already handles season labels. Page at
      `src/pages/competitions/nations-league.astro`.
- [x] Men's Ballon d'Or (`content/ballon-dor.md`) - reused the existing
      `loadCompetition`/`CompetitionView` pattern as-is (`editionsHeading:
      'Winners'`); the generic table already handles "winner + national team,
      no host/teams" since it only renders columns that are present. Page at
      `src/pages/competitions/ballon-dor.astro`. The 2020 "Not awarded" row is
      preserved verbatim and passes validation (non-empty winner), though it
      does appear as its own one-off entry in the generated champions summary
      and winner filter - a known minor rough edge, not fixed here.
- [x] Golden Boot / top scorers (`content/golden-boot.md`) - two tables (World
      Cup and EURO top scorers) in one file. Page at
      `src/pages/competitions/golden-boot.astro`. Since one content file holds
      two tables, `loadCompetition('golden-boot', ...)` is called twice with a
      different `editionsHeading` per table ("FIFA World Cup top scorers" /
      "UEFA EURO top scorers"), and the page composes two
      `TournamentTable` + `ChampionsSummary` blocks under one shared header and
      a single, merged `References` section. The "Player(s)" column is now
      recognized as the winner/champion column (`/player/` added to the
      matcher in `src/lib/editions.ts` and the highlight regex in
      `TournamentTable.astro`), and both `TournamentTable` (`winnerLabel` prop)
      and `ChampionsSummary` (`heading`/`description`/`unit` props) gained
      small optional overrides so the copy reads correctly for a top-scorer
      award instead of a "champion" competition - existing pages are
      unaffected since every new prop defaults to the old text. Added a
      Playwright block covering the two-table layout at 360px and independent
      per-table filtering.
- [x] Records and timelines (`content/records-and-timelines.md`) -> `/records`,
      added 2026-07-28 (intensive run). Composes three generated sections from
      the World Cup, EURO, Copa América and Nations League data (no new
      editorial content needed - the four competitions' `loadCompetition`
      calls already produce everything used here):
      - **Champions timeline**: one card per edition (year, host, champion,
        runner-up, final score), newest-first, via the new
        `buildTimeline()` in `src/lib/editions.ts` (reads the "Runner-up"
        and "Final" columns from `Edition.cells` by label, so it degrades
        gracefully for Copa América which has no "Final" score column) and
        the new `src/components/ChampionsTimeline.astro` card grid.
      - **Most successful teams**: reuses `ChampionsSummary.astro` per
        competition (top ranking, same generated data as each competition's
        own page) with a link back to the full table.
      - **Historical identity rules**: a static explainer card covering the
        four rules from `docs/WEBSITE_REQUIREMENTS.md` (West Germany/Germany
        merged in totals only; Soviet Union/Russia, Czechoslovakia/Czechia,
        and Yugoslavia's successors are each kept separate).
      Added `loadPageMeta()` to `src/lib/competition.ts` for loading a
      content page's front matter + intro without requiring an editions
      table (records-and-timelines.md has no table of its own). Linked from
      `Nav.astro` (8th link) and from the home page features section.
      Covered by 2 new Vitest cases for `buildTimeline` and 3 new Playwright
      cases (no 360px overflow, timeline/ranking content present, identity
      rules text present).
      - [x] Ballon d'Or / Golden Boot "Most awards" timeline and ranking -
        added 2026-07-30 (intensive run). `records.astro` now also loads
        `ballon-dor` and both `golden-boot` tables (World Cup top scorers,
        EURO top scorers - same two-load pattern the Golden Boot page itself
        uses) and renders two new sections, kept deliberately separate from
        "Champions timeline" / "Most successful teams" above: "Individual
        award winners timeline" (one `ChampionsTimeline` per award, reusing
        the existing `buildTimeline()` - it already degrades gracefully with
        no host/runner-up/final for an individual award, the same way it
        already does for Copa América's missing "Final" column) and "Most
        awards" (one `ChampionsSummary` per award with the existing
        `unit={['award','awards']}` override, exactly as the Golden Boot page
        itself already labels its own two rankings). No new library code was
        needed - both components already generalized cleanly. Considered and
        rejected a different approach first: rendering Copa América's
        "Titles after 2024" and Ballon d'Or's "Multiple winners through 2025"
        hand-written Markdown tables verbatim (the other open item in this
        section) - verified by hand that both tables' numbers exactly
        reproduce what `buildChampionsSummary` already computes from the
        editions table, so building a renderer for them would only have
        duplicated the `ChampionsSummary` already on each page; leaving that
        item as-is below. Source links and `lastReviewed` on the Records page
        now aggregate across all seven loaded tables (four team competitions
        + three individual-award tables), still deduped by URL. Covered by 1
        new Playwright case at 360px (both new section headings visible, the
        2025 Ballon d'Or winner appears in both the timeline and the
        ranking).
      - [ ] Not yet done: Copa América's "Titles after 2024" and Ballon d'Or's
        "Multiple winners through 2025" Markdown tables are still unrendered
        (see the reasoning above for why) - not considered a gap.

### From `docs/WEBSITE_REQUIREMENTS.md`, still missing

- [x] `/quiz` - family quiz generated from the structured editions, added
      2026-07-29 (intensive run). `src/lib/quiz.ts` generates multiple-choice
      questions straight from the same `Edition`/`TimelineEntry` data every
      competition page already loads - no hand-typed trivia:
      - "Who won the {competition} in {year}?" (`championByYearQuestions`,
        all four team competitions plus Ballon d'Or);
      - "Which country hosted the {year} {competition}?"
        (`hostByYearQuestions`, World Cup/EURO/Copa América/Nations League;
        excludes non-country host values like Copa América's early
        "Home-and-away" editions);
      - "Who did {champion} beat in the {year} final?" (`runnerUpByYearQuestions`,
        reuses `buildTimeline`);
      - "Who was the {competition} top scorer in {year}?"
        (`topScorerByYearQuestions`, both Golden Boot tables).
      Choices and distractors are picked with a seeded PRNG (`mulberry32` +
      an FNV-1a-style string hash), not `Math.random()`, so the generated
      quiz - and the unit tests - are fully deterministic; a question is
      skipped outright if its competition doesn't yet have 2 distinct
      alternative answers to build a fair multiple-choice question from
      (e.g. would matter for a very new competition). `selectQuiz()` picks a
      capped number of questions per competition/type (26 total today) and
      shuffles them into one order, at `src/pages/quiz.astro`.
      Progressive enhancement per `AGENTS.md` rule 5: every question renders
      as a real `<fieldset>`/radio-button group plus a native
      `<details>`/`<summary>` "Just show me the answer" disclosure that
      works with zero JS. The interactive "Check answer" button and running
      score bar are `hidden` in the markup and only revealed by the
      `is:inline` script, so a no-JS visitor sees a clean answer-key quiz
      sheet (also print-friendly) rather than dead buttons. Scoring, restart,
      and keyboard operability (native radios + a real `<button>`) are
      covered by 12 new Vitest cases (`tests/unit/quiz.test.ts`) and 5 new
      Playwright cases at 360px. Linked from `Nav.astro` (9th link) and the
      home page features section. Content lives in `content/quiz.md`.
      - [ ] Not yet done: "put the champions in chronological order" (listed
        as a quiz idea in `content/records-and-timelines.md`) needs a
        drag-and-drop or ranking control, not multiple choice - left for a
        future pass.
- [x] `/about/sources` - a sources index page, added 2026-07-29 (intensive
      run). `src/pages/about/sources.astro` groups every source link by
      competition, read live from `docs/SOURCES.md` via the new
      `extractSourceSections()` in `src/lib/sources.ts` (loops the file's `##`
      headings through the existing `extractSources()` per heading, so the
      index can never drift from what each competition's own References
      section shows - no new parser, no duplicated data). Each group heading
      links to the competition page it backs (Golden Boot has no section of
      its own - a note explains it cites the FIFA World Cup/EURO sources,
      matching how its page already loads them). A second card gives the
      reader-facing "How sources are reviewed" policy. Content/front matter
      lives in `content/about-sources.md` (status: verified, its own
      `lastReviewed`), loaded with the existing `loadPageMeta()`. Linked from
      `Nav.astro` (10th link) and `Footer.astro`. Covered by 3 new Vitest
      cases (`extractSourceSections`) and 4 new Playwright cases (no 360px
      overflow, grouping + competition links, review policy + last-reviewed
      date visible, reachable from nav/footer).
- [x] Additional filters mentioned in `AGENTS.md` (by host) - added 2026-07-29
      (intensive run). `TournamentTable.astro` gained an optional `hosts` prop
      and a third "Host" `<select>` filter alongside Winner/Year, wired
      through the same pattern: `data-host` on each row, a `host` URL query
      param (shareable link, restored on load), combines with the other two
      filters (AND), and is omitted entirely when a competition has no host
      column (Ballon d'Or, Golden Boot) rather than rendering an empty
      dropdown. New `distinctHosts()` in `src/lib/editions.ts` (mirrors
      `distinctWinners()`) feeds the new `hosts: string[]` field on
      `CompetitionData` (`src/lib/competition.ts`), so World Cup, EURO, Copa
      América and Nations League all get the filter for free via
      `CompetitionView.astro`; Golden Boot's two tables wire it explicitly
      since that page doesn't use `CompetitionView`. Covered by 2 new Vitest
      cases (`distinctHosts`, including the "no host column" case) and 2 new
      Playwright cases (filter by host alone; winner+host combined) at 360px.
      "By team" is **not implemented**: the source tables only have a
      numeric team-count column, not a list of participating teams, so
      there's no data to filter on - would need new editorial content first.
- [x] Sort controls that preserve historical notes - added 2026-07-30
      (intensive run). Every tournament table gains a fourth "Sort by"
      `<select>` alongside Winner/Year/Host, listing only the columns worth
      sorting by - Year/Season, Winner/Champion/Player, Host (when present),
      and a numeric quantity column (Teams or Goals, when present) - detected
      with the exact same matchers `buildEditions` uses for those roles
      (`findColumn`, now exported from `src/lib/editions.ts`), so the options
      offered are always consistent with what the page already treats as
      "the winner column" etc. New `src/lib/tableSort.ts`:
      `buildSortOptions()` generates the option list/labels/URL-safe slugs
      server-side (Year gets "newest/oldest first" wording, a quantity
      column gets "most/fewest first", everything else gets "A–Z"/"Z–A"),
      and `defaultSortValue()` picks Year newest-first to match the table's
      existing default row order, so no client-side re-sort runs on first
      load. Sorting only ever reorders the actual `<tr>` elements already in
      the DOM (`tbody.appendChild` in source-comparator order) - it never
      touches cell content - so a historical note in any cell (e.g. Ballon
      d'Or's 2020 "Not awarded" row) survives verbatim wherever the row
      lands; a new Playwright case sorts that table by Winner and asserts
      the row is still there with its text intact. The comparator
      (`compareCellText`, duplicated inline in the component's script since
      `define:vars` scripts can't `import`) is numeric-aware
      (`Intl.Collator({numeric: true})`, so "2" sorts before "10" instead of
      after it) and always sorts blank/em-dash cells last regardless of
      direction. Selection is shareable via a `?sort=` URL query param
      (same restore-on-load pattern as the existing filters, e.g.
      `?sort=winner-asc`) and Reset clears it back to the default. Covered
      by 12 new Vitest cases (`tests/unit/tableSort.test.ts`: option
      generation/labels/omission per role, default selection, the
      comparator's numeric-aware and missing-last behavior) and 6 new
      Playwright cases at 360px (Winner A–Z groups ties correctly, Teams
      fewest-first, Reset restores default order and clears the URL param, a
      shared `?sort=` link restores the order on load, Golden Boot's Goals
      most-first surfaces Just Fontaine's 1958 record, and the Ballon d'Or
      historical-note case above).

### Nice-to-have / later

- [x] Add the Playwright smoke test as a CI job - added 2026-07-30 (intensive
      run). Until now the repository had no pull-request CI at all:
      `.github/workflows/deploy.yml` only triggers on push to `main` and
      intentionally skips Playwright there to keep deploys fast, so nothing
      actually validated a PR's diff (build, unit tests, or the 360px mobile
      smoke test) before it merged - a real gap for a repo whose changes
      mostly arrive as PRs. New `.github/workflows/ci.yml` runs on every
      `pull_request` (plus `workflow_dispatch`): type check, unit tests, then
      `pnpm test:e2e:install` (`playwright install --with-deps chromium`)
      followed by `pnpm test:e2e`, which builds and serves the production
      preview itself per `playwright.config.ts`. A `concurrency` group
      cancels a PR's superseded runs so pushes don't queue up, and a
      failure uploads `test-results/` (Playwright's traces/screenshots on a
      failed, retried test) as a build artifact for debugging. `deploy.yml`
      is unchanged.
- [x] Compare two national teams - added 2026-07-29 (intensive run). New
      `/compare` page, generated from the same World Cup, EURO, Copa América
      and Nations League edition tables the rest of the site already loads
      (individual awards excluded: Ballon d'Or/Golden Boot "Team" cells can
      hold semicolon-separated ties, e.g. the 1962 Golden Boot's six-way tie,
      which isn't safe to attribute to one country). New `src/lib/compare.ts`:
      `buildAllCountryRecords()` ranks every country that has won, been
      runner-up, or reached a tracked semifinal in at least one of the four
      competitions, by titles then finals reached then name; grouping reuses
      the existing West Germany/Germany `summaryGroupFor()` rule so totals
      stay consistent with the champions summaries elsewhere. A head-to-head
      picker (two `<select>`s + a swap button) lets a reader compare any two
      teams' titles/runner-up/semifinal/finals-reached, per competition and
      combined; selection is shareable via `?a=`/`?b=` URL query params
      (restored on load, same pattern as the existing winner/year/host
      filters). Progressive enhancement per `AGENTS.md` rule 5: the default
      pair (the two most-titled teams) and the full all-teams ranking table
      are rendered as plain server-side HTML tables that work with zero JS;
      the JS only swaps in a different pair's numbers and updates the URL.
      Competitions that don't track a third/fourth-place finish (Copa
      América's table has no such column) render "—" rather than a
      misleading 0, via the new `tracksSemifinalColumn()`. Linked from
      `Nav.astro` (between Records and Quiz) and the home page features
      section. Covered by 9 new Vitest cases (`tests/unit/compare.test.ts`:
      `distinctCountryGroups`, `buildCountryCompetitionRecord`,
      `buildCountryRecord`, `buildAllCountryRecords`, `tracksSemifinalColumn`)
      and 5 new Playwright cases at 360px (no overflow, default pair +
      ranking table, select-a-team + swap, `?a=`/`?b=` URL restore, the "—"
      no-data-column case).
- [x] Installable PWA / offline reading - added 2026-07-30 (intensive run). A
      generated `manifest.webmanifest` (`src/pages/manifest.webmanifest.ts`)
      and a generated service worker (`src/pages/sw.js.ts`) make the site
      installable and readable offline, both computed at build time so they
      pick up the same repository-agnostic `BASE_PATH` every other page
      already uses (`withBase()` from `src/lib/url.ts`), rather than being
      hand-written for one deployment. New `src/lib/routes.ts` holds the
      single list of top-level nav pages (`NAV_LINKS`); `Nav.astro` now reads
      from it instead of its own inline copy, and the new
      `buildPrecacheUrls()` in `src/lib/offlineCache.ts` builds the service
      worker's precache list from that same list plus the manifest/icons/
      favicon, so a newly added nav page can't silently go missing from
      offline caching. The service worker's strategy: HTML navigations are
      network-first (a visitor with a connection always gets the latest
      content) falling back to the cache, then the cached home page, when
      offline; everything else (CSS, images, the manifest) is cache-first,
      filled in as pages are visited. It's registered only for production
      builds (`import.meta.env.PROD`), since a caching service worker would
      just get in the way of `astro dev`. New icons at
      `public/icons/icon-{192,512}.png` and
      `icon-maskable-{192,512}.png` reuse the exact ball design from
      `public/favicon.svg`, rasterized from SVG (not committed - a one-off
      local conversion) since PNG is required for manifest icons/maskable
      support that SVG can't cover consistently across platforms.
      **Bug found and fixed in the same pass**: while wiring the new
      manifest/icon `<link>` tags into `BaseLayout.astro`, the existing
      favicon link (`href={\`${import.meta.env.BASE_URL}favicon.svg\`}`) turned
      out to already be broken - the currently installed Astro (5.18.2, up
      from whatever produced the original `pnpm-lock.yaml`) no longer
      guarantees a trailing slash on `import.meta.env.BASE_URL`, so that
      concatenation was actually rendering as
      `/football-referencefavicon.svg` in the built HTML (confirmed by
      grepping `dist/index.html`), a silent 404 on the live site. Fixed by
      switching the favicon link, and the new manifest/apple-touch-icon
      links and the service worker's registration URLs, to the existing
      `withBase()` helper (`src/lib/url.ts`), which already normalizes this
      correctly and is what `Nav.astro` has used all along. Covered by 3 new
      Vitest cases (`tests/unit/offlineCache.test.ts`) and 5 new Playwright
      cases (manifest fields/start_url/icons, theme-color + apple-touch-icon
      meta tags, service worker reaches `navigator.serviceWorker.ready`, a
      previously visited page keeps rendering its content with
      `context.setOffline(true)`, and an uncached URL falls back to the
      cached home page rather than a browser error offline).
      "Downloadable print sheet per competition" is **not implemented** -
      the existing print stylesheet already covers on-screen "print this
      page" for every competition table; a separate downloadable-file
      version (e.g. build-time PDF generation) is a distinct, larger feature
      left for a future pass.
- [ ] Optional Croatian/English localization

## Known caveats

- World Cup, EURO, Nations League, Copa América, Ballon d'Or, Golden Boot,
  Records and Timelines, Compare National Teams, and the Family Quiz all have
  live pages now.
- Historical names appear as distinct winner-filter entries by design.
- First-ever Pages deploy can hang in GitHub's `updating_pages` provisioning and
  time out; re-running the deploy clears it (it did here).

See also `IMPLEMENTATION_NOTES.md` (decisions/testing detail) and
`docs/ADDING_CONTENT.md` (how to add or edit content).
