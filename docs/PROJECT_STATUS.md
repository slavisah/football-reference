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
pnpm test                      # 91 Vitest unit tests
pnpm build                     # static build + all content validation
PW_CHROME_CHANNEL=chrome pnpm test:e2e   # 74 Playwright tests at 360px
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
      - [x] "Put the champions in chronological order" - added 2026-07-30
        (intensive run), a second run against the `/quiz` page. New
        `chronologicalOrderQuestions()` in `src/lib/quiz.ts` builds one
        ranking question per team competition with a host column (FIFA World
        Cup, UEFA EURO, Copa América, UEFA Nations League - individual
        awards are excluded because a repeat winner, e.g. a second Ballon
        d'Or for the same player, would show as two identical, ambiguous
        tiles): it samples 4 editions with distinct years (Copa América's
        two 1959 editions are skipped, since a tie can't be strictly
        ordered), then shuffles their *display* order separately from which
        editions get picked, with its own seed so a shared link reproduces
        the same challenge. This is a genuinely different question shape
        from the existing multiple-choice ones (rank items, not pick one
        answer), so it got its own type (`QuizOrderQuestion`), its own card
        component (`QuizOrderCard.astro`, one "Rank..." `<select>` per
        champion instead of radio buttons), and its own "Champion order
        challenge" section on `/quiz` below the main question list, entirely
        separate from the shared score bar to avoid entangling two different
        scoring models. Same progressive-enhancement pattern as the rest of
        the quiz (rule 5): every item's correct rank is still readable
        without JS via the existing "Just show me the answer" `<details>`,
        and the "Check order" button stays `hidden` until JS confirms it
        can wire up the check. Covered by 6 new Vitest cases
        (`tests/unit/quiz.test.ts`: item count, correct chronological
        recovery, rank permutation, determinism, too-few-editions skip, and
        the duplicate-year drop) and 2 new Playwright cases at 360px
        (ranking correctly surfaces "Correct order!" and highlights every
        item, and the challenge is keyboard-focusable with its own answer
        fallback).
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
      "Downloadable print sheet per competition" - **added 2026-07-31
      (intensive run)**, see its own entry below.
- [x] Downloadable print sheet per competition - added 2026-07-31 (intensive
      run). The existing print stylesheet already covered on-screen "print
      this page"; this adds an actual downloadable file so a reader doesn't
      have to know to open the browser's print dialog. New
      `scripts/generate-pdfs.mjs` (`pnpm build:pdfs`, run manually after
      `pnpm build` - deliberately **not** part of `pnpm build`/`deploy.yml`,
      to keep deploys fast, the same call already made for Playwright/e2e)
      builds the static site, serves it with `astro preview` (so
      `BASE_PATH`/content are exactly what a reader sees), and drives the
      environment's pre-installed Playwright Chromium to open each of the six
      competition/award pages, emulate `print` media, and save a PDF with
      `page.pdf({ preferCSSPageSize: true })` - so it reuses the same
      `@media print` / `@page { size: A4 landscape }` rules already in
      `src/styles/global.css` rather than duplicating that layout, and the
      generated PDFs stay in lock-step with whatever the print stylesheet
      renders. Output is committed as static assets at
      `public/downloads/{world-cup,euro,nations-league,copa-america,
      ballon-dor,golden-boot}.pdf` (2-8 pages each, regenerated for this run).
      New `PrintDownloadLink.astro` (a `no-print` link + short caption) is
      wired into `CompetitionView.astro` via an optional `pdfSlug` prop (so
      the five pages that already use it only needed a one-line prop add) and
      directly into `golden-boot.astro`, which composes its layout by hand
      and has no single `CompetitionView` call for a single table to attach
      the prop to. `docs/ADDING_CONTENT.md` section 8 now tells a content
      editor to rerun `pnpm build:pdfs` after any Editions-table change, so
      the PDF can't silently go stale relative to the live table. Covered by
      2 new Playwright cases at 360px (World Cup and Golden Boot: the link is
      visible with the right `href`, and a real HTTP request for that PDF
      resolves with a `pdf` content-type) rather than a unit test, since
      there's no pure function here - the link markup and the generated file
      are what need checking.
- [x] Optional Croatian/English localization - first vertical slice added
  2026-07-30 (intensive run). New `src/lib/i18n.ts` (a `Locale = 'en' | 'hr'`
  type, a small `UI_STRINGS` dictionary for shared chrome text, and a `t()`
  helper) plus optional `locale`/`alternateHref` props on `BaseLayout.astro`,
  `Nav.astro`, and `Footer.astro` - every prop defaults to `'en'` with the
  exact original English strings, so all existing pages render byte-identical
  output and needed no test changes. A new `src/pages/hr/index.astro` is a
  full Croatian translation of the home page (hero, six competition cards,
  features section, nav brand, footer), reachable via a new "Hrvatski"/
  "English" language-switch link that only appears on the two translated
  pages (`alternateHref` is `undefined` everywhere else, so the switcher is
  invisible on untranslated pages rather than linking somewhere confusing).
  The English and Croatian home pages share one data loader,
  `loadHomeCompetitions()`/`buildHomeCards()` in the new `src/lib/homeCards.ts`
  (extracted from `index.astro`, which previously inlined this) - both pages
  call the exact same `loadCompetition()` calls, so the numbers (editions
  count, top champion, title count) can never drift between languages; only
  the card titles/blurbs differ, from a `CARD_TEXT` table keyed by locale.
  `<html lang>` is set correctly per page (verified in the built HTML).
  Covered by 5 new Vitest cases (`tests/unit/i18n.test.ts`: `t()` per locale,
  `alternatePath()` both directions and the not-yet-translated case) and 4 new
  Playwright cases at 360px (no overflow, translated chrome + six cards
  render, the World Cup edition count matches the English page exactly, the
  language switcher round-trips both ways with the right `<html lang>`).
  - [x] `ThemeToggle.astro`'s "Theme"/"Light"/"Dark" labels - localized
    2026-07-31 (intensive run). It now takes an optional `locale` prop
    (`Nav.astro` forwards its own `locale`), and the initial label plus the
    `aria-label` render through three new `t()` keys (`themeLabel`,
    `themeLight`, `themeDark`, `themeToggleAriaLabel`). The client script
    that swaps the label on click can't import `t()` (it runs in the
    browser, after Astro hoists it out), so the Light/Dark words it needs
    are passed through `data-light-label`/`data-dark-label` attributes on
    the button instead - the same pattern `TournamentTable`'s inline script
    already uses for server values. Covered by 1 new Vitest case plus new
    assertions in the existing "has both locales non-empty" test
    (`tests/unit/i18n.test.ts`).
  - [x] `/about/sources` - second translated page, added 2026-07-31
    (intensive run). New `src/pages/hr/about/sources.astro` calls the exact
    same `loadPageMeta('about-sources')` / `extractSourceSections()` as the
    English page, so the source links, status, and `lastReviewed` date can
    never drift between languages - only this page's own prose (intro,
    section headings, the "How sources are reviewed" policy list) and the
    competition-group heading labels are Croatian. The competition-group
    labels reuse the exact names already on the Croatian home page
    (`homeCards.ts`'s `CARD_TEXT`, e.g. "FIFA Svjetsko prvenstvo") so a
    competition is never called two different things across the site; the
    links themselves still point at the English competition pages, since
    those aren't translated yet. `docs/SOURCES.md` itself is **not**
    translated - it is one shared file backing both languages' References
    sections, so per-locale link labels would make the English page drift.
    `TRANSLATED_PATHS` gained `/about/sources` -> `/hr/about/sources`, and
    `Footer.astro`'s "Sources & review policy" link is now locale-aware
    (points at the Croatian page from Croatian pages) rather than always
    pointing at English. Covered by 1 new Vitest case (`alternatePath`
    both directions) and 5 new Playwright cases at 360px (the English
    sources page's switcher opens the Croatian one; on the Croatian page:
    no overflow, translated headings + same `lastReviewed` date as English,
    Croatian competition-group names linking to the right English page, and
    the switcher returning to English).
  - [x] `/records` - third translated page, added 2026-07-31 (intensive
    run). New `src/pages/hr/records.astro` loads the exact same seven
    `loadCompetition()` calls as the English page (four team competitions +
    Ballon d'Or + both Golden Boot tables), so every timeline entry and
    ranking number can never drift between languages - only this page's own
    headings/prose and the competition/award display names are translated,
    reusing the exact Croatian names already established on the Croatian
    home page (`homeCards.ts`'s `CARD_TEXT`) and the Croatian sources page.
    Needed three small, backward-compatible prop additions since this is the
    first Croatian page to reuse `ChampionsTimeline.astro` and
    `References.astro` (`ChampionsSummary.astro` already supported enough
    overrides): `ChampionsTimeline` gained optional `hostedByLabel`/
    `runnerUpLabel` props (default "Hosted by"/"Runner-up:", unchanged for
    every existing call site), `ChampionsSummary` gained an optional
    `winningYearsLabel` prop (default "Winning years: "), and `References`
    gained optional `heading`/`statusPrefix`/`statusText`/
    `lastReviewedPrefix`/`noSourcesText`/`noteText`/`dateLocale` props -
    `statusText` defaults to the raw `status` value so every other page's
    output is byte-identical, while the Croatian page passes a translated
    "Provjereno"/"U pregledu" word and `dateLocale="hr-HR"` for the reviewed
    date, matching the pattern the Croatian sources page already established
    by hand. `TRANSLATED_PATHS` gained `/records` -> `/hr/records`, and the
    English `/records` page now passes `alternateHref` so its language
    switcher appears (it was missing one before this run). Covered by 1 new
    Vitest case (`alternatePath` both directions) and 6 new Playwright cases
    (English page: language switcher opens the Croatian one; Croatian page:
    no 360px overflow, all four section headings + a timeline card render,
    the Ballon d'Or "Most awards" total matches the English page's number
    exactly, the historical nation-name rules text is translated, and the
    switcher returns to English).
  - [x] `/compare` - fourth translated page, added 2026-07-31 (intensive
    run). New `src/pages/hr/compare.astro` loads the exact same four
    `loadCompetition()` calls as the English page and calls the same
    `buildAllCountryRecords()`/`tracksSemifinalColumn()`, so every
    title/runner-up/semifinal count can never drift between languages -
    only this page's own headings/prose, table column headers, and the
    four competition display names are translated (reusing the exact
    Croatian names already established on the Croatian home page and
    records page: "FIFA Svjetsko prvenstvo", "UEFA Europsko prvenstvo",
    "Copa América", "UEFA Liga nacija"). Country/team names themselves are
    left as-is, matching the precedent set by the Croatian records page
    (they're the underlying data, not UI chrome). No component prop
    changes were needed - unlike `/records`, this page composes its own
    markup directly rather than through shared components, so the table
    headers, the head-to-head picker labels, and the client-side swap
    button text were just written in Croatian directly in the new file
    (the client script itself has no UI strings - it only pushes numbers
    into `data-field` cells already labeled by the server-rendered
    Croatian headers). `TRANSLATED_PATHS` gained `/compare` ->
    `/hr/compare`, and the English `/compare` page now passes
    `alternateHref` so its language switcher appears (it was missing one
    before this run, same gap `/records` had). Covered by 1 new Vitest
    case (`alternatePath` both directions) and 5 new Playwright cases
    (English page: language switcher opens the Croatian one; Croatian
    page: no 360px overflow, translated headings + a translated
    competition name in the head-to-head table, team-select + swap still
    works, the all-teams ranking's top row matches the English page
    exactly, and the switcher returns to English).
  - [x] `/quiz` - fifth translated page, added 2026-07-31 (intensive run).
    New `src/pages/hr/quiz.astro` loads the exact same seven
    `loadCompetition()` calls as the English page, so every question's
    underlying fact (a champion, host, runner-up or top scorer) can never
    drift between languages - only the generated prompt wording and this
    page's own chrome/prose are translated. Every question-builder in
    `src/lib/quiz.ts` (`championByYearQuestions`, `topScorerByYearQuestions`,
    `hostByYearQuestions`, `runnerUpByYearQuestions`,
    `chronologicalOrderQuestions`) gained an optional trailing `locale:
    Locale = 'en'` parameter that only switches the prompt *template*
    (competition names are still whatever string the caller passes in, so
    the Croatian page passes the same Croatian names already established on
    the Croatian home/records/compare pages, e.g. "FIFA Svjetsko
    prvenstvo"); the choice-building/shuffling/seeding logic is untouched,
    so a Croatian question has the exact same correct answer and distractor
    set as its English counterpart, just asked in Croatian. `QuizCard.astro`
    and `QuizOrderCard.astro` gained an optional `locale` prop (default
    `'en'`, byte-identical output for every existing call site) for their
    static strings ("Check answer", "Just show me the answer", "Rank...",
    etc.) via new `i18n.ts` keys. The **client-side script** couldn't
    import `t()` (it's `is:inline`, hoisted out and run in the browser), so
    its "Correct!" / "Not quite..." / "Correct order!" feedback strings are
    now read from `data-i18n-*` attributes rendered per-card by
    `QuizCard`/`QuizOrderCard` - the same pattern `ThemeToggle.astro`
    already uses for its Light/Dark labels. The ~150-line script itself was
    extracted from `quiz.astro` into a new shared `QuizScript.astro`
    component so both the English and Croatian pages include it without
    duplicating the logic. `TRANSLATED_PATHS` gained `/quiz` -> `/hr/quiz`,
    and the English `/quiz` page now passes `alternateHref` so its language
    switcher appears (it was missing one before this run, same gap
    `/records` and `/compare` had). Covered by 6 new Vitest cases in
    `tests/unit/quiz.test.ts` (one Croatian-prompt case per question
    builder, asserting the underlying answer/items/ranks stay identical to
    the English call) and 14 new UI-string assertions in
    `tests/unit/i18n.test.ts`, plus 6 new Playwright cases at 360px (English
    page: language switcher opens the Croatian one; Croatian page: no
    overflow, translated prompts/controls, a correct multiple-choice answer
    shows "Točno!" and updates the score, a correct order-challenge ranking
    shows "Točan redoslijed!", and the switcher returns to English).
  - [x] `/competitions/copa-america` - first of the six competition/award
    pages translated, added 2026-07-31 (intensive run), as a deliberate
    vertical slice of this backlog item (see the still-English list below
    for the other five). The earlier note here worried that translating a
    table's headers would require making `findColumn`'s role-detection
    matchers themselves locale-aware; that turned out to be unnecessary.
    `findColumn`/`buildEditions` still only ever run against the raw English
    headers from `content/copa-america.md` (detection is completely
    unchanged, for every locale), and a new **display-only** `headerLabels`
    prop on `TournamentTable.astro` (`Record<rawEnglishHeader,
    translatedHeader>`) swaps in the translated text purely for the
    rendered `<th>`/mobile-card `data-label`, after detection has already
    run. `TournamentTable` also gained ~15 other optional locale props
    (`yearLabel`, `hostAllLabel`, `sortByLabel`, `showingAllTemplate`, etc.),
    every one defaulting to the exact original English string/template, so
    the five untouched English competition pages needed zero changes and
    render byte-identical HTML (verified by diffing a pre-change build
    against a post-change build of `/competitions/world-cup` and
    `/competitions/euro` - the only bytes that differ are the new,
    English-default `define:vars` the client filter script now carries).
    `buildSortOptions` (`src/lib/tableSort.ts`) gained the same
    `{ locale, headerLabels }` config so the "Sort by" dropdown's wording
    ("(newest first)", "(A-Z)", etc., now in `src/lib/i18n.ts`) and header
    text translate too; fixed a latent locale-bugfix in passing while there
    - `defaultSortValue()` used to pick the default option by checking
    whether its *label* ended in the English string `"(newest first)"`,
    which would have silently broken (falling back to the first option
    instead of Year-newest-first) the moment any locale's suffix wording
    differed. Each `SortOption` now carries an explicit `role: 'year' |
    'quantity' | 'text'` field instead, so the default-selection logic
    checks `role === 'year' && dir === 'desc'` directly and is locale-proof;
    covered by 2 new Vitest cases plus a 3rd asserting the Croatian label
    and header translation. `PrintDownloadLink.astro` gained optional
    `label`/`hint` props (defaults unchanged) for the same reason.
    This page composes its own layout by hand (`src/pages/hr/competitions/
    copa-america.astro`), like `hr/records.astro` and `hr/compare.astro`
    already do, rather than through the shared English-only
    `CompetitionView.astro` - so `CompetitionView` itself (used by the other
    five English pages) needed no changes and no new prop surface. Loads the
    exact same `loadCompetition('copa-america', ...)` call as the English
    page, so the table data, generated champions summary (title counts) and
    reference links can never drift between languages. The "Memorable
    moments" bullets are hand-translated Croatian text local to this page
    only (`content/copa-america.md` itself is untouched - still the single
    English editorial source of truth); this follows the precedent already
    set by `hr/records.astro`'s hand-written Croatian identity-rules prose
    rather than an automated translation of editorial content. Country/team
    names, years and scores are left as-is throughout (matching the
    Compare/Records precedent that underlying data isn't translated, only
    UI chrome and short hand-checked prose). `TRANSLATED_PATHS` gained
    `/competitions/copa-america` -> `/hr/competitions/copa-america`, and the
    English page now passes `alternateHref` so its language switcher
    appears (the same one-line gap `/records`, `/compare` and `/quiz` each
    had before their own translation). Covered by 3 new Vitest cases
    (`tableSort`) and 7 new Playwright cases at 360px (English page's
    switcher opens the Croatian one; Croatian page: no overflow, translated
    filter labels/column headers, filtering by "prvak" updates the URL and
    status text, champion totals match the English page exactly, the
    translated Memorable-moments section renders, the PDF download link
    shows the translated label and actually resolves, and the switcher
    returns to English).
  - [x] `/competitions/nations-league` - second of the six competition/award
    pages translated, added 2026-07-31 (intensive run). Confirms the reusable
    infrastructure from the Copa América slice needed zero further changes -
    this page is exactly the props-and-prose slice the note above predicted.
    New `src/pages/hr/competitions/nations-league.astro` composes its own
    layout by hand (like the Croatian Copa América page), loading the exact
    same `loadCompetition('uefa-nations-league', ...)` call as the English
    page so the table data, generated champions summary and reference links
    can never drift between languages. Unlike Copa América, this table's
    "Season" column (not "Year") and its "Finals host"/"Third"/"Fourth"/
    "Final" columns needed their own `headerLabels` entries and a
    `yearLabel="Sezona"`/`bitYearPrefix="sezona"` override (Copa América's
    props already supported this - just different values). The page's own
    "UEFA Liga nacija" display name and its `<title>` reuse the exact string
    already established on the Croatian home/records pages
    (`homeCards.ts`'s `CARD_TEXT`), rather than `data.title` (the raw English
    front-matter value), matching how `hr/records.astro` and
    `hr/compare.astro` already handle a translated competition name. The
    "Key facts" section (`content/uefa-nations-league.md`) is hand-translated
    Croatian prose local to this page only, same precedent as Copa América's
    Memorable moments. `TRANSLATED_PATHS` gained `/competitions/nations-league`
    -> `/hr/competitions/nations-league`, and the English page now passes
    `alternateHref` so its language switcher appears (the same one-line gap
    every previously-translated page had before its own translation).
    Covered by 2 new Vitest cases (`alternatePath` both directions - also
    backfilled the missing Copa América `alternatePath` case, which
    `docs/PROJECT_STATUS.md` had claimed as done in the prior run but was
    never actually added) and 9 new Playwright cases at 360px (English page:
    no overflow, language switcher opens the Croatian one; Croatian page: no
    overflow, translated filter labels/column headers including "Sezona",
    filtering by "prvak" Portugal updates the URL and status text, champion
    totals match the English page exactly, the translated Key facts section
    renders, the PDF download link shows the translated label and resolves,
    and the switcher returns to English).
  - [ ] Still English-only: the other four competition/award pages (World
    Cup, EURO, Ballon d'Or, Golden Boot). The reusable infrastructure for
    this is now proven twice over (Copa América + Nations League) - each
    remaining page is a props-and-prose slice, not new engineering: write
    `src/pages/hr/competitions/<slug>.astro` composing the same components
    by hand, supply a `headerLabels` map for that table's own English
    headers, translate the filter/status strings (copy the Copa América/
    Nations League pages' Croatian values - they're competition-agnostic
    chrome text) and hand-translate that page's own "Memorable moments"/
    notes prose. Golden Boot is the one exception worth flagging in advance:
    its English page doesn't use `CompetitionView` either (it composes two
    `TournamentTable`s by hand for the two top-scorer tables), so its
    Croatian version can follow the same pattern used here rather than
    `CompetitionView`. World Cup and EURO both also join in a per-year "Top
    scorer" `extraColumn` from Golden Boot data (see the "tournament-level
    best scorer facts" entry above) - their Croatian pages will need an
    `extraColumn.label` override too, which `TournamentTable` already
    supports as a plain string prop.

## Known caveats

- World Cup, EURO, Nations League, Copa América, Ballon d'Or, Golden Boot,
  Records and Timelines, Compare National Teams, and the Family Quiz all have
  live pages now.
- Historical names appear as distinct winner-filter entries by design.
- First-ever Pages deploy can hang in GitHub's `updating_pages` provisioning and
  time out; re-running the deploy clears it (it did here).

See also `IMPLEMENTATION_NOTES.md` (decisions/testing detail) and
`docs/ADDING_CONTENT.md` (how to add or edit content).
