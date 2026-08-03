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
pnpm test                      # 119 Vitest unit tests
pnpm build                     # static build + all content validation
PW_CHROME_CHANNEL=chrome pnpm test:e2e   # 188 Playwright tests at 360px (mobile
                                          # smoke + a WCAG 2.1 A/AA sweep, light
                                          # and dark, across every page)
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
      editions. Page at `src/pages/competitions/copa-america.astro`. The page's
      own "needs-detailed-audit" content status is resolved by the dedicated
      quality pass below (2026-08-02) - see that entry for the per-edition
      "Format" audit.
- [x] UEFA Nations League (`content/uefa-nations-league.md`) - uses seasons
      like `2018-19`; the parser already handles season labels. Page at
      `src/pages/competitions/nations-league.astro`.
- [x] Men's Ballon d'Or (`content/ballon-dor.md`) - reused the existing
      `loadCompetition`/`CompetitionView` pattern as-is (`editionsHeading:
      'Winners'`); the generic table already handles "winner + national team,
      no host/teams" since it only renders columns that are present. Page at
      `src/pages/competitions/ballon-dor.astro`. The 2020 "Not awarded" row is
      preserved verbatim and passes validation (non-empty winner). It no
      longer appears as a one-off entry in the generated champions summary or
      winner filter - see the quality-pass entry near the end of this file
      (2026-08-01, intensive run) for the fix.
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
  - [x] `/competitions/ballon-dor` - third of the six competition/award
    pages translated, added 2026-08-01 (intensive run). Confirms the
    reusable infrastructure needed zero further changes for an
    individual-award page with no host column: `hosts` stays the
    `TournamentTable` default `[]`, which already omits the host
    filter/label for free (no new prop plumbing). New
    `src/pages/hr/competitions/ballon-dor.astro` composes its own layout by
    hand (like the Croatian Copa América and Nations League pages), loading
    the exact same `loadCompetition('ballon-dor', ...)` call as the English
    page so the table data, generated champions summary (award/title counts)
    and reference links can never drift between languages. The page's own
    "Zlatna lopta" display name and `<title>` reuse the exact string already
    established on the Croatian home page (`homeCards.ts`'s `CARD_TEXT`),
    rather than `data.title` (the raw English front-matter value "Men's
    Ballon d'Or"), matching how the Croatian Nations League page handles its
    own display name. The "Winner"/"National team" column headers translate
    via `headerLabels` ("Pobjednik"/"Reprezentacija") the same way the two
    prior pages did; the `ChampionsSummary` heading/description are left at
    their translated-default wording (matching the English page, which
    itself doesn't override them via `CompetitionView` even though this is
    an individual award, not a team competition - a pre-existing minor
    copy inconsistency on the English site, out of scope here, so the
    Croatian page mirrors it exactly rather than silently fixing it). The
    "Notes" section (`content/ballon-dor.md`) is hand-translated Croatian
    prose local to this page only, same precedent as the two prior pages'
    Memorable-moments/Key-facts sections. `TRANSLATED_PATHS` gained
    `/competitions/ballon-dor` -> `/hr/competitions/ballon-dor`, and the
    English page now passes `alternateHref` so its language switcher
    appears (the same one-line gap every previously-translated page had
    before its own translation). Covered by 1 new Vitest case
    (`alternatePath` both directions) and 9 new Playwright cases at 360px
    (English page: no overflow, language switcher opens the Croatian one;
    Croatian page: no overflow, translated filter labels/column headers,
    filtering by "pobjednik" Lionel Messi updates the URL and status text,
    champion totals match the English page exactly, sorting by winner still
    preserves the 2020 "Not awarded" historical note verbatim, the
    translated Notes section renders, the PDF download link shows the
    translated label and resolves, and the switcher returns to English).
  - [x] `/competitions/world-cup` and `/competitions/euro` - fourth and fifth
    of the six competition/award pages translated, added 2026-08-01
    (intensive run). Confirms the reusable infrastructure needed only one
    small, genuinely new piece for these two: both pages join in a per-year
    "Top scorer" `extraColumn` from Golden Boot data
    (`buildTopScorerFacts()`), and that helper's generated detail string
    hardcoded the English word "goals" (e.g. "Harry Kane (England, 6
    goals)"). Rather than duplicating the whole function, it gained an
    optional trailing `locale: Locale = 'en'` parameter - the same pattern
    already used for every `src/lib/quiz.ts` question builder - that only
    swaps the unit word via a small `GOALS_WORD` lookup ("goals"/"golova");
    the player name, team and goal count are still the exact same underlying
    data either way, so a fact can never drift between languages. Everything
    else follows the Ballon d'Or slice directly: new
    `src/pages/hr/competitions/world-cup.astro` and `.../euro.astro` compose
    their own layout by hand (like the three prior Croatian competition
    pages) rather than through the shared English-only `CompetitionView`,
    loading the exact same `loadCompetition('fifa-world-cup' | 'uefa-euro',
    ...)` plus `loadCompetition('golden-boot', ...)` calls as their English
    counterparts. Both pages' own display names ("FIFA Svjetsko prvenstvo",
    "UEFA Europsko prvenstvo") reuse the strings already established on the
    Croatian home/records/compare pages. World Cup hand-translates its three
    note sections (Format milestones, Memorable moments, Editorial notes);
    EURO hand-translates its two (Historical format note - a single
    paragraph, same as the English page's non-bulleted rendering - and
    Memorable moments) - same precedent as the three prior Croatian
    competition pages' hand-translated prose, `content/*.md` itself
    untouched. `TRANSLATED_PATHS` gained both paths, and both English pages
    now pass `alternateHref` so their language switchers appear. Covered by
    2 new Vitest cases (`buildTopScorerFacts` with `locale: 'hr'`) and 24 new
    Playwright cases at 360px across both languages and both pages (language
    switchers each direction; translated chrome/filters/column headers
    including the new "Najbolji strijelac" column; filtering by
    prvak/domaćin; champion totals matching the English page exactly; the
    top-scorer column showing the "golova" wording; all translated note
    sections including the *Maracanazo* italic check and the EURO
    paragraph-vs-list rendering; the PDF download link's translated label;
    and World Cup's filter/sort/host tests already covered by the existing
    English suite carrying over unchanged).
  - [x] `/competitions/golden-boot` - sixth and last of the six competition/
    award pages, added 2026-08-01 (intensive run). **The full localization
    backlog from `AGENTS.md`/`docs/WEBSITE_REQUIREMENTS.md` is now complete -
    every page on the site has a Croatian translation.** New
    `src/pages/hr/competitions/golden-boot.astro` follows the same
    two-table-in-one-page shape as the English page (two separate
    `loadCompetition('golden-boot', ...)` calls - World Cup top scorers, EURO
    top scorers - composed by hand under one shared header/References, no
    `CompetitionView`), reusing the exact ids the English page already uses
    (`golden-boot-world-cup(-table/-winner/-sort)`,
    `golden-boot-euro(-table/-winner/-sort)`, and the two `ChampionsSummary`
    ids) so the two tables keep filtering/sorting independently. Both notes
    sections ("World Cup notes"/"EURO notes" from `content/golden-boot.md`)
    are hand-translated; `winnerLabel="Igrač"` reuses the same override
    pattern the English page uses for `winnerLabel="Player"` on a top-scorer
    table. `TRANSLATED_PATHS` gained `/competitions/golden-boot` ->
    `/hr/competitions/golden-boot`, and the English page now passes
    `alternateHref` so its language switcher appears (the same gap every
    other competition page had before its own Croatian translation shipped).
    Covered by 1 new Vitest case (`alternatePath` both directions, replacing
    the now-obsolete "no translation yet" case, repointed at a nonexistent
    path) and 9 new Playwright cases at 360px mirroring the existing English
    Golden Boot coverage (no overflow with two tables stacked; translated
    chrome/filters/headers; the 1958 World Cup and 1984 EURO top scorers
    render; both translated notes sections; independent per-table filtering
    by player; the World Cup award ranking's top total matches the English
    page exactly; the downloadable PDF link and its translated label; the
    switcher opens the Croatian page from English and returns from
    Croatian).

### Quality pass: "Not awarded" placeholder no longer pollutes generated aggregates

Added 2026-08-01 (intensive run). By this point every required and
nice-to-have item from `docs/WEBSITE_REQUIREMENTS.md` and `AGENTS.md`'s
milestone list has a live page, including the full Croatian localization
backlog finished earlier the same day - so this run is the "genuinely useful
quality pass" fallback rather than a new page. It fixes a bug in code, not a
content correction: the 2020 Ballon d'Or's "Not awarded" placeholder winner
(`content/ballon-dor.md`, kept verbatim per editorial policy - no historical
fact was touched) was leaking into two places that treat the winner column as
a real answer:

- The generated champions summary (`buildChampionsSummary`) was counting it
  as a one-off "champion" with 1 title, and the winner filter dropdown
  (`distinctWinners`) offered "Not awarded" as something a reader could
  filter the table down to - both flagged as a known rough edge in this file
  and in `IMPLEMENTATION_NOTES.md`'s "Content caveats" section but not
  previously fixed.
- The `/quiz` and `/hr/quiz` question generator (`questionsFromWinners` in
  `src/lib/quiz.ts`, feeding `championByYearQuestions`) could ask "Who won
  the Ballon d'Or in 2020?" with "Not awarded" as the correct multiple-choice
  answer, and could offer "Not awarded" as a nonsensical wrong-answer choice
  for every *other* year's question.

New `isPlaceholderWinner()` in `src/lib/editions.ts` (a small regex covering
"not awarded", "not held", "no award(ed)", "cancelled/canceled") is now
checked everywhere a winner value feeds an aggregate or a set of answer
choices. `buildTimeline()` (the Records-page timeline and the Croatian
records page) is deliberately **not** changed - "Not awarded" is itself the
correct historical fact for that year's timeline card, so it still renders
there verbatim. The raw Editions table row is untouched either way; only the
*derived* summary/filter/quiz outputs change. Generalized rather than
hardcoded to Ballon d'Or/2020, so it would also catch a future "Not held"
row on another award page without new code. Covered by 6 new Vitest cases
(`tests/unit/editions.test.ts`: `isPlaceholderWinner`, the summary-exclusion
case, the filter-exclusion case, and the timeline verbatim case;
`tests/unit/quiz.test.ts`: the question-skip + no-distractor-leak case) and 1
new Playwright case at 360px confirming "Not awarded" is absent from both the
winner `<select>` options and the champions-summary section on the live
Ballon d'Or page.

### Quality pass: automated WCAG 2.1 A/AA sweep, plus two real contrast/keyboard bugs it found

Added 2026-08-01 (intensive run). With every backlog item and the full
localization pass complete, the site had hand-written accessibility checks
(keyboard focus, filter operability, no-360px-overflow) but nothing that
automatically audits WCAG rules like color contrast, landmark structure, or
scrollable-region keyboard access across the whole site. New
`tests/e2e/accessibility.spec.ts` uses `@axe-core/playwright` to run an axe
scan (`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` tags, `region` rule disabled -
the skip-link's target anchor legitimately sits just outside `<main>`)
against all 22 live pages (the 11 `NAV_LINKS` plus their 11
`TRANSLATED_PATHS` Croatian equivalents), under **both** light and dark
`colorScheme` (`test.describe` per scheme via `test.use`) - 44 cases total.
Testing only the default (light) scheme during development missed real
dark-mode-only failures, which is why both are covered permanently now, not
just light.

The sweep found and fixed two genuine bugs, both pre-existing (not
introduced by this run):

- **Home page card links failed color contrast in one theme or the other.**
  Each competition card's accent color (`homeCards.ts`) is reused directly
  as the "Open table" link's text color; the World Cup/EURO/Nations
  League/Golden Boot accents are dark enough to read fine on the light
  theme's white card background but fail AA (2.5-2.6:1, need 4.5:1) against
  the dark theme's near-black background, while the Copa América/Ballon d'Or
  gold accents are the reverse - fine in dark mode, fail (2.9:1) on white.
  `homeCards.ts` now carries two additional per-card fields,
  `accentTextLight`/`accentTextDark` (~5.7:1 against `--bg-elevated` in each
  theme, computed by holding each accent's hue/saturation fixed and solving
  for a lightness that hits the target contrast - not just an eyeballed
  darken/lighten), rendered as `--card-accent-text-light`/
  `-dark` custom properties (`index.astro`, `hr/index.astro`) alongside the
  existing `--card-accent` (unchanged, still used for the purely decorative
  top bar and hover border, which have no text-contrast requirement). The
  CSS picks between them with the same `@media (prefers-color-scheme: dark)`
  + `:root[data-theme]` precedence the rest of the site already uses for
  theme switching (`ThemeToggle.astro`'s icon rule was the existing
  precedent for the `:root:not([data-theme='light'])` guard, needed so an OS
  dark preference doesn't override an explicit manual "light" choice).
- **The `/compare` page's two side-by-side tables and its all-teams ranking
  table had no keyboard way to scroll their horizontally-overflowing
  `.t-wrap` wrapper** (`axe`'s `scrollable-region-focusable`) - a mouse/touch
  user could scroll them at 360px, a keyboard-only user could not. Fixed by
  adding `tabindex="0" role="region" aria-label="..."` (reusing each table's
  existing caption text) to the three wrappers in `compare.astro` and their
  Croatian equivalents in `hr/compare.astro`. `TournamentTable.astro`'s own
  `.t-wrap` (used by every competition table) got the same treatment
  defensively, even though it wasn't flagged today - its tables collapse to
  non-scrolling stacked cards at the tested 360px width, but a future wider
  table or a desktop-only overflow case would hit the identical bug, and the
  fix has no visual effect either way (`[tabindex]:focus-visible` was
  already a global rule, so no new CSS was needed).

No other page or theme combination had a violation. Covered entirely by the
new Playwright suite above (44 cases) - there's no pure function to unit
test here, only rendered contrast and DOM structure.

### Quality pass: SEO essentials - canonical/Open Graph tags, sitemap.xml, robots.txt

Added 2026-08-01 (intensive run). With the full backlog, localization, and the
WCAG sweep already done, the site had no discoverability layer at all: no
canonical URLs, no Open Graph/Twitter Card tags (a shared link showed a bare
URL with no preview), no `sitemap.xml`, and no `robots.txt`. All four are
implemented the same way the site's other generated files already are
(`manifest.webmanifest.ts`, `sw.js.ts`): computed at build time from
`Astro.site`/`BASE_PATH` so nothing is hand-typed for one deployment, and
driven from the single existing route lists (`NAV_LINKS` in `src/lib/
routes.ts`, `TRANSLATED_PATHS` in `src/lib/i18n.ts`) so a page can't be added
to the nav and silently missed here, the same guarantee those two lists
already gave the offline precache list.

- **`BaseLayout.astro`** now renders a `<link rel="canonical">`, a matching
  hreflang alternate-link pair on every translated page (reusing the
  `alternateHref` prop every page already passes for the language switcher -
  no new prop needed), and Open Graph + Twitter Card meta tags (`og:type`,
  `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale` +
  `og:locale:alternate`, `og:image`, `twitter:card`/`title`/`description`/
  `image`). `og:description`/`twitter:description` reuse each page's existing
  `description` prop, so nothing needed adding per-page. `og:image` points at
  the existing `icon-512.png` PWA icon (already in `public/icons/`, not a
  scraped photograph, so it doesn't touch the "never copy copyrighted photos"
  rule in `AGENTS.md`) rather than requiring new per-page social images.
- **`src/pages/sitemap.xml.ts`** (new) generates one `<url>` per locale of
  every `NAV_LINKS` page (22 total today), each with an `xhtml:link
  rel="alternate"` pair back to its translation and a `<lastmod>` read from
  that page's own `lastReviewed` front matter via `getEntry('pages', id)` -
  the same field the page itself already displays, so the sitemap can't claim
  a different freshness date than the page does.
- **`src/pages/robots.txt.ts`** (new) allows all crawling and points at the
  generated sitemap's real absolute URL.
- Both new routes follow the exact `export const prerender = true` /
  `APIRoute` shape `manifest.webmanifest.ts` and `sw.js.ts` already use, so no
  new pattern was introduced.

Covered by 4 new Playwright cases (`tests/e2e/mobile.spec.ts`): canonical +
Open Graph + Twitter Card tags on the World Cup page; a translated pair's
hreflang links pointing at each other correctly in both directions;
`robots.txt`'s `Allow`/`Sitemap` lines; and `sitemap.xml`'s URL count,
locale pairing and `<lastmod>` format. No unit test was added - there's no
pure function here beyond what `getEntry`/`withBase` already cover elsewhere.
Verified locally with a full `pnpm build` (22 pages + the two new generated
routes) and the full Playwright suite (179 cases, up from 175) passing
together, confirming the `BaseLayout.astro` change didn't regress any
existing page.

**Left for a future pass:** JSON-LD structured data (e.g. `SportsOrganization`/
`Article` schema) was considered and deliberately deferred - it would need a
per-competition-type schema shape to be genuinely useful to search engines
rather than boilerplate, which is a bigger design decision than fits a single
quality-pass item.

### Quality pass: JSON-LD structured data (BreadcrumbList, champions ItemList, latest-edition SportsEvent)

Added 2026-08-02 (intensive run). Picks up the "left for a future pass" item
right above: the earlier SEO pass added canonical/OG/sitemap but no
structured data at all, so a search engine only ever saw plain HTML. The
"per-competition-type schema shape" problem that deferred this turned out to
have a generic answer rather than needing bespoke schema per competition:

- **`src/lib/jsonLd.ts`** (new) has three pure builders, all schema.org:
  `buildBreadcrumbList()` (a "Home > page" trail), `buildChampionsItemList()`
  (a ranked `ItemList` of `Thing`s - name + a "N title(s) (years)" description
  - built directly from the exact `ChampionSummary[]` every page already
    computes for its on-page Champions summary, no recomputation, no new
    facts), and `buildLatestEditionSportsEvent()` (the most recently completed
  edition as a `SportsEvent`: name, host as `location`, winner as
  `competitor`, `startDate` as the bare year already in the Editions table -
  no calendar date is invented, since none exists in the editorial source).
  `ItemList` is genuinely generic across both team competitions and
  individual awards (Ballon d'Or, Golden Boot), which is what made the
  earlier "per-type schema" concern moot; `SportsEvent` is only attached to
  the four team competitions (World Cup, EURO, Copa América, Nations League)
  - an individual award isn't a sporting *event*, so Ballon d'Or/Golden Boot
  get an `ItemList` only, no `SportsEvent`.
- **`BaseLayout.astro`** renders the `BreadcrumbList` automatically for every
  page except the home page (computed from the same `canonicalURL`/`title`
  every page already passes in - zero new props needed on any of the 22
  pages for this part) and takes an optional `jsonLd?: JsonLdObject[]` prop
  for page-specific objects, each rendered as its own
  `<script type="application/ld+json">` (simpler and equally valid to merging
  into one `@graph`). New `homeBreadcrumb` UI string in `src/lib/i18n.ts`
  ("Home"/"Početna").
- Each of the twelve competition/award pages (six English, six Croatian) now
  computes its own `jsonLd` array via the new `absolutePageUrl()` helper in
  `src/lib/url.ts` (mirrors the `site ?? url` fallback `sitemap.xml.ts`
  already uses) and passes it to `BaseLayout`. Golden Boot passes two
  `ItemList`s (one per table), matching how its `ChampionsSummary` is already
  duplicated on that page.
- Verified the generated markup directly, not just that the build succeeds:
  parsed every `<script type="application/ld+json">` block across all 22
  built pages (42 total) as JSON - all valid - and spot-checked the World Cup
  page's three blocks (`BreadcrumbList`, `ItemList` topped by Brazil's 5
  titles, `SportsEvent` for "2026 FIFA World Cup" with Canada/Mexico/United
  States as `location` and Spain as `competitor`), the home page (correctly
  has none), and Ballon d'Or (`ItemList` only, no `SportsEvent`).
- Covered by 7 new Vitest cases (`tests/unit/jsonLd.test.ts`: breadcrumb
  shape, ItemList with default vs. overridden unit wording, SportsEvent
  picking the latest year regardless of source order, omitting
  location/competitor when absent, excluding a placeholder "Not awarded"
  winner from `competitor`, and returning `undefined` when no edition has a
  parseable year) and 5 new Playwright cases in the existing
  `tests/e2e/mobile.spec.ts` SEO describe block (home page has none; the
  World Cup page's three-block shape and content; an individual-award page
  has no `SportsEvent`; Golden Boot's two `ItemList`s; a translated page's
  Croatian breadcrumb/`ItemList` names). Verified with `pnpm lint`, the full
  Vitest suite (119 cases, up from 112) and the full Playwright suite (184
  cases, up from 179), all passing.

### Content-accuracy pass: Copa América per-edition "Format" audit

Added 2026-08-02 (intensive run). `content/copa-america.md` was the one
content file still marked `status: needs-detailed-audit` (every other page is
`review` or `verified`), and its own "Important editorial warning" section
spelled out exactly what a future coding agent should do about it: audit each
edition's format and display a "format" badge (league table / final playoff /
knockout final / home-and-away / special centenary edition) before ever
considering adding third/fourth places to every row. This run does that first
half of the ask - a badge, not the placings, which still needs its own
separate per-tournament audit and stays explicitly open (see the rewritten
warning section in the content file).

- Researched all 48 Champions-timeline rows (1916-2024, including both 1959
  editions) via web search against Wikipedia's per-edition articles and RSSSF,
  rather than trusting memory for 20+ early-20th-century tournaments - see the
  new citations in `docs/SOURCES.md`. Confirmed five, and only five, editions
  where the round-robin table finished level on points and needed a separate
  decider match (1919, 1922, 1937, 1949, 1953 - each has its own Wikipedia
  "play-off" article); every other pre-1975 edition, plus the 1989/1991 group-
  stage-then-final-round-robin-group editions, was decided by table standings
  alone ("League table"). 1975/1979/1983 keep the "Home-and-away" label already
  present in the Host/format column; 1987 and every edition from 1993 onward
  except 2016 get "Knockout final" (group stage into a single-elimination
  bracket); 2016 (Copa América Centenario, played outside the normal cycle for
  the 100th anniversary) gets "Special centenary edition".
- New "Format" column appended to the Champions timeline table - no new parser
  or library code needed, since `buildEditions` already preserves every column
  in `Edition.cells` and `TournamentTable.astro` already renders whatever
  columns the source table has. The one small addition: `TournamentTable.astro`
  now detects a column literally named "Format" (mirroring how it already
  detects the winner column by header text) and wraps that cell's value in the
  same `.badge` pill already used for the page's "Verified"/"In review" status
  eyebrow, rather than plain text, matching what the warning asked for. No
  other page has a "Format" column, so `formatColIndex` is simply `-1`
  everywhere else and nothing about them changes.
- `src/pages/hr/competitions/copa-america.astro` gained a `Format: 'Format'`
  header-label entry (the word is identical in Croatian); the badge *values*
  ("League table", "Home-and-away", etc.) stay in English on the Croatian page,
  the same precedent the existing "Home-and-away" host-column value already
  set - column headers/chrome are translated, editorial data values are not.
- Front matter: `lastReviewed: 2026-08-02`, `status: review` (downgraded from
  `needs-detailed-audit`, not straight to `verified`, since this used secondary
  sources per `docs/SOURCES.md`'s review policy rather than the primary
  CONMEBOL history PDF already cited there).
- Regenerated all six `public/downloads/*.pdf` via `pnpm build:pdfs` per
  `docs/ADDING_CONTENT.md` section 8, since the Copa América table's columns
  changed.
- **Also found and fixed in passing**: the Copa América competition page
  itself had no dedicated Playwright describe block at all - every other of
  the six competition/award pages has both an English and a Croatian "page on
  a 360px phone" block, but Copa América only had the Croatian one; its one
  English-page assertion (the language-switcher test) had been left stranded
  inside the unrelated Ballon d'Or describe block, presumably a copy-paste
  slip from an earlier translation run. Added the missing `'Copa América page
  on a 360px phone'` block and moved that stray test into it.
  Covered by 4 new Playwright cases in the new English block (no 360px
  overflow, the Format badge on five representative editions spanning every
  category, sorting by champion doesn't detach the badge from its row, the
  language switcher) and 1 new case in the existing Croatian block (the badge
  value matches the English page exactly, i.e. it isn't translated) - 5 new
  cases total, no new pure function to unit-test since the change is a content
  column plus a small display-only component branch. Verified with `pnpm
  lint`, the full Vitest suite (119 cases, unchanged) and the full Playwright
  suite (188 cases, up from 184), all passing, including the existing WCAG
  sweep (44 cases, unchanged - the badge reuses an already-audited style).

### Content-accuracy pass: Copa América third/fourth place for the knockout-final era

Added 2026-08-02 (intensive run). Picks up the other open item the Format
audit above left unresolved: `content/copa-america.md`'s "Champions timeline"
table gained two new columns, "Third" and "Fourth", filled in for every
edition that decided that placing with a single, discrete third-place match -
1987, then every edition from 1993 onward including the 2016 centenary
edition (14 editions total). Researched against official CONMEBOL/Copa
América recaps where available and match reports otherwise (see
`docs/SOURCES.md`'s new "Third/fourth-place audit" entry), including the two
upset results worth double-checking carefully rather than assuming the
higher-ranked side finished third: Honduras beat Uruguay on penalties for
third in 2001, and Uruguay needed penalties over Canada for third in 2024.
The pre-1975 league-table/final-playoff era and the 1989/1991 editions are
**deliberately left as "—"**, not a guess - those years had no standalone
third-place fixture, so the placing would have to be read off a full final
standings table rather than one match result, which the rewritten "Important
editorial warning" note in the content file now describes as the remaining
open item for a future pass.

This unexpectedly touched `/compare` (the "compare two national teams"
page), which was built (2026-07-29, see the "Nice-to-have / later" entry
above) on the explicit assumption that Copa América had no third/fourth
column at all - its `tracksSemifinalColumn()` check is per-table, not
per-row, so the moment *any* Copa América row has a "Third"/"Fourth" header
the whole competition switches from showing "—" to showing a real generated
count for every team, including the 34 rows that still don't have the data.
Two follow-on fixes were needed, not just the new content:

- **`src/lib/compare.ts` would have turned the new "—" placeholder cells
  into a phantom country.** `distinctCountryGroups` and the internal
  `matchesGroup` helper previously treated any non-empty cell as a team
  name; a new shared `isMissingCell()` check (matching the "—"/empty
  convention `TournamentTable.astro`'s own sort comparator already uses)
  makes both skip it, the same category of bug the "Not awarded" quality
  pass (2026-08-01) fixed for the champions summary and quiz. Without this,
  "—" would have shown up as a selectable team in the picker and in the
  all-teams ranking table.
- **The English and Croatian `/compare` pages' explanatory note** ("Copa
  América's table has no such column, shown as '—'") was now false - it does
  have the column, just partial coverage - so both were reworded to explain
  the 1987/1993-onward cutoff instead of claiming the column doesn't exist.

Covered by 3 new Vitest cases (`tests/unit/compare.test.ts`: Copa América's
`tracksSemifinalColumn` flips to `true`, a partially-filled column's real
names are collected while "—" never becomes a phantom group, and a country's
semifinal count is correct while a literal `'—'` group id never accrues a
finish) and 4 new Playwright cases at 360px (the audited Third/Fourth values
for 2024 and 1987, "—" still shown for 1916; the Croatian page's translated
"Treći"/"Četvrti" column headers; and `/compare` now showing Colombia's real
Copa América count of 6 third/fourth finishes instead of the old hardcoded
em-dash expectation, which the existing test for that exact scenario was
rewritten in place rather than duplicated). Regenerated
`public/downloads/copa-america.pdf` via `pnpm build:pdfs` since the Editions
table's columns changed again. Verified with `pnpm lint`, the full Vitest
suite (121 cases, up from 119) and the full Playwright suite (189 cases, up
from 188), all passing, including the unchanged WCAG sweep (44 cases) and
the unchanged SEO/JSON-LD suites.

**Left for a future pass:** the pre-1987 third/fourth audit (round-robin
standings for 1916-1983, plus the 1989/1991 final round-robin groups) is
real remaining work, not a "nice to have" - it's the one piece of the
Format-audit warning note still open.

### Quality pass: Copa América third/fourth for the 1989 and 1991 closing groups

Added 2026-08-02 (intensive run). Picks up half of the "left for a future
pass" note directly above: the 1989 and 1991 editions are `League table`
format but, unlike the pre-1975 single round-robin era, each was decided by
a small **closing group** of just four teams (the top two from each of two
opening groups), so third and fourth read directly off that group's final
standings without needing a full ten-plus-team table audit - a genuinely
different, much more tractable case than the remaining pre-1975 rows.

- `content/copa-america.md`: 1989 gets Third: Argentina, Fourth: Paraguay
  (Brazil won the closing group 3-0-0, Uruguay second at 2-0-1; Argentina and
  Paraguay both finished 0-1-2 at 1 point, Argentina ahead on goal
  difference, 0-4 vs 0-6). 1991 gets Third: Chile, Fourth:
  Colombia (Argentina won at 2W-1D, Brazil second at 2W-1L, Chile third at
  2D-1L, Colombia fourth at 1D-2L). Both cross-checked against independent
  match-by-match results, not just a single standings snapshot.
- `docs/SOURCES.md` gained the two citations; the content file's "Important
  editorial warning" section now explains the 1989/1991 closing-group
  reasoning and narrows the still-open item to the pre-1975 league-table/
  final-playoff era only (1916-1967 - the 1975-1983 home-and-away era has no
  standings table to read at all, so it was never part of this open item).
- `tests/e2e/mobile.spec.ts`'s `/compare` Copa América count test updated
  from 6 to 7 (Colombia's new 1991 fourth-place finish adds one more
  semifinal-or-better count) - the underlying number changing is the correct,
  expected effect of adding real historical data, not a bug.
- Regenerated all six downloadable PDFs (`pnpm build:pdfs`; the script
  rebuilds the whole static site from the preview server for each one, so
  every PDF's bytes shift slightly even though only Copa América's content
  changed - consistent with every prior PDF-regeneration run in this file).
- Environment note for future runs: this session's Playwright browser
  wasn't at the `chrome` channel path `PW_CHROME_CHANNEL` expects
  (`/opt/google/chrome/chrome` - not installed here); `playwright.config.ts`
  already has a `PW_EXECUTABLE_PATH` escape hatch for exactly this, so
  `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` was used
  instead and is the more portable command going forward. Verified: `pnpm
  lint`, the full Vitest suite (121 cases, unchanged), and the full
  Playwright suite (189 cases, unchanged count - one assertion's expected
  value updated, no cases added or removed), all passing.

**Left for a future pass:** the pre-1975 League table/Final playoff era
(1916-1967, 30 editions) is the one remaining open item in the Copa América
editorial warning. Unlike 1989/1991, most of these had no small closing
group - third/fourth would have to be read off a single round-robin table of
up to ten teams, for which reliable secondary sources are considerably
harder to find and cross-check era-by-era; a future pass should budget for
researching (and citing) each edition individually rather than assuming a
single source covers all thirty at once.

### Content-accuracy pass: Copa América third/fourth for the full pre-1975 era - audit closed

Added 2026-08-02 (intensive run). Closes the item directly above and the
Copa América third/fourth audit as a whole: the remaining 29 editions from
1916-1967 (every edition in the pre-1975 League table/Final playoff era
except the 1919/1922/1937/1949/1953 playoff years' already-known result,
which still needed their own third/fourth read from the pre-playoff group
table) now have researched third- and fourth-place teams in
`content/copa-america.md`'s Champions timeline table, replacing "—".

- Research was fanned out across three parallel research agents (1916-1927,
  1929-1947, 1949-1967), each cross-checking RSSSF's per-edition table pages
  against Wikipedia's per-edition articles and an internal points-arithmetic
  consistency check (reported points must be consistent with the number of
  matches played and, where teams tied on points, the stated goal
  difference/average must actually separate them in the claimed order).
  Their reported "high"/"medium" confidence split was not taken at face
  value: this session's own direct `WebFetch` of both rsssf.org and
  en.wikipedia.org pages returned HTTP 403 (the outbound network policy
  blocks direct fetches to those hosts), matching what the research agents
  had already found, so every one of the 29 results - including the four
  the agents rated only "medium" confidence (1917, 1920, 1926, 1945), which
  lacked a full recoverable points table - was independently re-verified
  with fresh `WebSearch` queries before being written into the content file,
  not just carried over from the agents' output.
- **1922** is a documented edge case rather than a simple table read: Brazil,
  Paraguay, and Uruguay finished level on both points and goal difference,
  triggering a three-way title playoff; Uruguay withdrew from it in protest
  at refereeing decisions, finishing third by that elimination rather than a
  table tiebreak, with Argentina (not level with the top three) fourth. This
  is spelled out in the rewritten "Important editorial warning" section
  rather than left as an unexplained table cell.
- **1925** is the one edition that keeps a "—": only three teams entered
  (Argentina, Brazil, Paraguay) playing a double round-robin, so third
  (Paraguay) exists but a fourth-place team structurally never did. This is
  the historical fact, not a sourcing gap - explained in the content file's
  warning section so a future editor doesn't mistake it for unfinished work.
- The 1975/1979/1983 Home-and-away "—" cells are unchanged and explained as
  permanent (no standings table or third-place fixture of any kind exists
  for a two-legged final).
- `docs/SOURCES.md` gained one citation entry per edition (RSSSF table page
  + Wikipedia article where both were checked), plus a note on the 403
  network restriction and the re-verification method, so a future reader can
  see exactly how confident to be in each row.
- `tests/e2e/mobile.spec.ts`'s Copa América Format/Third/Fourth test
  (previously asserting 1916 showed "—") now asserts real values for 1916
  and 1922 (including the withdrawal case), the 1925 partial-"—" case, and
  moves the "no data exists" assertion to 1975 (Home-and-away), which is now
  the only kind of row that still shows "—" as a permanent fact rather than
  an open item. `tests/unit/compare.test.ts` needed no changes - it tests
  `src/lib/compare.ts`'s pure functions against synthetic fixtures, not the
  real content file, and the existing "—"-skipping logic (`isMissingCell()`,
  added in the earlier knockout-era third/fourth pass) already handles the
  new 1925 partial-data row correctly with no code change. The `/compare`
  page's all-teams ranking numbers do shift for any country that reached
  third/fourth in 1916-1967 (e.g. Brazil, Uruguay, Chile, Argentina,
  Paraguay, Peru all gain finishes) - Colombia's existing e2e test assertion
  (count of 7) is unaffected since Colombia never appears in this era's
  results, and no other test hardcoded a specific country's Copa América
  semifinal count for this range.
- Front matter: `lastReviewed: 2026-08-02` (unchanged), `status: review`
  (unchanged - this pass used secondary sources per `docs/SOURCES.md`'s
  review policy, not the primary CONMEBOL history PDF already cited there,
  same reasoning the Format-audit pass gave for not marking `verified`).
  Regenerated `public/downloads/copa-america.pdf` via `pnpm build:pdfs`
  since the Editions table's cell values changed.
- Verified with `pnpm lint`, the full Vitest suite, and the full Playwright
  suite, all passing (see exact counts in the commit this entry ships with).

This closes the entire Copa América Third/Fourth backlog item: every edition
from 1916 to 2024 now shows either a real, sourced placing or an explained
"—" that is itself the historical fact, and the content file's "Important
editorial warning" section documents both.

### Nice-to-have: "On this day in football history" widget - first vertical slice (World Cup + EURO)

Added 2026-08-02 (intensive run). With the entire required-pages backlog, the
full Croatian localization pass, and every Copa América content-accuracy item
now closed, this run picked the one clearly unbuilt item left from
`docs/WEBSITE_REQUIREMENTS.md`'s nice-to-have list: "on this day" cards. It
had never been started - no code, no data - unlike the "by team" filter
(also still missing from Required capabilities), which needs a full
participating-teams roster per edition across every competition and is a
much larger research task than this feature, which only needed one new fact
per edition: the calendar date of the final.

- **`content/fifa-world-cup.md` and `content/uefa-euro.md`** each gained a
  new "Final date" column (e.g. "30 July 1930") on their Editions tables -
  the two most prominent competitions, as a deliberate vertical slice rather
  than researching all six competitions/awards in one run (Copa América,
  Nations League, Ballon d'Or and Golden Boot don't have this column yet;
  see "Left for a future pass" below). Dates were researched via WebSearch
  (two parallel research agents, one per competition) rather than trusted
  from memory, cross-checking Wikipedia's per-edition final articles against
  ESPN/UEFA.com/Transfermarkt match records; see the new "Final match dates
  audit" entries under `docs/SOURCES.md`'s FIFA World Cup and UEFA EURO
  sections for the full citation list and the two documented edge cases
  (1950's de facto final was a final-group decider, not a knockout match;
  EURO 2020's final was actually played in 2021 - the column records the
  real 2021 date while the edition keeps its "2020" label). Adding a column
  needed no library or component changes beyond the new feature itself -
  `docs/ADDING_CONTENT.md` already documents "you can add columns freely,"
  and `buildEditions`/`TournamentTable` already render whatever columns a
  source table has.
- **`src/lib/onThisDay.ts`** (new): `parseFinalDate()` parses a "D Month
  YYYY" cell; `buildOnThisDayEntries()` reduces editions with a "Final date"
  column into a flat, calendar-day-searchable list (mirrors the
  cellValue-by-label lookup `buildTimeline`/`buildTopScorerFacts` already use
  in `editions.ts`, kept local since no other module needs it); editions
  without the column, or with an unparseable value, are skipped rather than
  guessed at. `entriesOnDate()` filters by month/day regardless of year;
  `fallbackEntry()` picks a deterministic "featured" entry (keyed by
  day-of-year, not `Math.random()`) for the many calendar days with no exact
  final match, so the widget always has something to show. Covered by 13 new
  Vitest cases (`tests/unit/onThisDay.test.ts`): date parsing (valid,
  case-insensitive month, unparseable, unknown month, out-of-range day),
  entry building (skips unparseable/missing dates), date matching (same
  month/day across different years and competitions, no-match case), and the
  fallback (deterministic per date, empty-list case, always picks a real
  entry).
- **`src/components/OnThisDay.astro`** (new) + a new section on the home
  page (`src/pages/index.astro`, English only this run - see "Left for a
  future pass"), built from the World Cup and EURO editions the home page
  already loads via `loadHomeCompetitions()` (no extra data fetch).
  Progressive enhancement per `AGENTS.md` rule 5: the initial HTML is
  server-rendered using the build's own current date (so a no-JS visitor
  still sees real content, same precedent as the rest of the static site),
  then a `<script>` re-checks the visitor's actual browser date and swaps
  the card in if the site hasn't been rebuilt since that day - the same
  data-driven-script pattern `ThemeToggle`/`TournamentTable` already use,
  since an inline script can't `import` a module. On an exact calendar-day
  match (e.g. 30 July matches both the 1930 and 1966 World Cup finals) it
  lists every match played that day, newest first; otherwise it shows the
  deterministic fallback pick with a small "no final was played on this
  exact date" note rather than an empty card. Covered by 2 new Playwright
  cases at 360px in the existing "Home page" describe block, using
  `page.clock.setFixedTime()` to pin the browser's date: 30 July shows both
  the 1930 and 1966 finals with the hint hidden; 1 January (no World Cup or
  EURO final has ever fallen on it) shows the fallback note and exactly one
  card. Verified with `pnpm lint`, the full Vitest suite (134 cases, up from
  121) and the full Playwright suite (191 cases, up from 189 - including the
  unchanged 44-case WCAG sweep, which found no new violations), all passing.
  Regenerated `public/downloads/world-cup.pdf` and `.../euro.pdf` via `pnpm
  build:pdfs` since both Editions tables gained a column.
- **`src/pages/hr/competitions/world-cup.astro` and `.../euro.astro`** each
  gained a `'Final date': 'Datum finala'` entry in their `headerLabels` map,
  so the new column's header translates on the Croatian competition pages
  even though the widget itself isn't on the Croatian home page yet - the
  raw data column exists on both languages' tables either way, since
  `content/*.md` is the single shared editorial source.

**Left for a future pass:**
- The other four competitions (Copa América, Nations League, Ballon d'Or,
  Golden Boot) don't have a "Final date" column yet, so the widget only ever
  surfaces World Cup/EURO matches. Extending it is additive - research each
  competition's final dates the same way, add the column, and append
  `buildOnThisDayEntries(...)` calls in `index.astro`; no changes to
  `src/lib/onThisDay.ts` or `OnThisDay.astro` should be needed.
- **`src/pages/hr/index.astro`** does not yet render the widget - this run
  shipped English first, matching the precedent every other feature on this
  site followed (English vertical slice, then a dedicated translation pass).
  Would need Croatian heading/hint copy plus a `locale` prop on
  `OnThisDay.astro` (currently English-only strings), following the same
  `t()`/data-attribute pattern used for `ThemeToggle`'s client script.
- The "by team" filter (`docs/WEBSITE_REQUIREMENTS.md`'s other still-missing
  required capability) remains **not implemented** - it needs a full
  participating-teams roster per edition, not just one new fact, so it's a
  substantially larger research task than this widget was.

### "On this day" widget - second slice: Copa América

Added 2026-08-03 (intensive run). Continues the widget's rollout, picked
because Copa América ranks highest in this routine's competition priority
order and was explicitly called out as the next step in the previous run's
"Left for a future pass" note above.

- **`content/copa-america.md`** gained a "Final date" column on its Champions
  timeline table, filled in for the 19 editions (of 55) that have one
  clearly identifiable decisive match: the five **Final playoff** deciders
  (1919, 1922, 1937, 1949, 1953), the 13 **Knockout final** editions (1987,
  and 1993 onward except 2016), and the 2016 centenary final. The other 36
  editions keep "—" by design, not as a research gap - explained in a new
  paragraph in the page's "Important editorial warning" section: the
  **League table** era (1916-1967, plus 1989/1991) had no single title
  match, and the three **Home-and-away** finals (1975, 1979, 1983) were
  decided over two legs on two different dates, so neither format has one
  date to record without an arbitrary pick. This mirrors how the World
  Cup/EURO pass already treated 1950's final-group decider and EURO 2020's
  postponed final as documented edge cases rather than silently guessed
  values. Dates were researched via WebSearch (two parallel research
  agents, one for the Final-playoff era and one for the Knockout-final era)
  cross-checking each edition's dedicated Wikipedia final/play-off article
  against a second source (RSSSF, ESPN, Transfermarkt, 11v11, or
  copaamerica.com) where available; see the new "Final match dates audit"
  entry under `docs/SOURCES.md`'s Copa América section for the full
  citation list and two flagged edge cases (1922's date has only a single
  corroborating source; 1999 had one outlier source giving a different day,
  resolved in favor of the three sources that agree). Front matter
  `lastReviewed` bumped to `2026-08-03`; `status: review` unchanged, same
  reasoning as the previous Copa América passes (secondary sources, not the
  primary CONMEBOL history PDF).
- **`src/pages/index.astro`**: added
  `buildOnThisDayEntries(competitions.copaAmerica.editions, 'Copa América')`
  to the home page's `onThisDayEntries` array - no other code changes
  needed, confirming the previous run's prediction that extending the
  widget to another competition is purely additive.
- **`src/pages/hr/competitions/copa-america.astro`** gained a
  `'Final date': 'Datum finala'` entry in its `headerLabels` map, so the new
  column's header translates on the Croatian competition page, matching the
  World Cup/EURO precedent (the Croatian home page still doesn't render the
  widget itself - unchanged from the previous run, see below).
  Regenerated `public/downloads/copa-america.pdf` via `pnpm build:pdfs`
  since its Editions table gained a column; the other five PDFs were also
  regenerated by the same command but reverted before committing since
  their content didn't change (only a build timestamp differed).
- **Tests**: no unit test changes needed (`tests/unit/onThisDay.test.ts` uses
  synthetic fixtures, not the real content file). One Playwright assertion
  in `tests/e2e/mobile.spec.ts` ("falls back to an archive card on a
  non-final date") needed updating - 1 January's deterministic fallback pick
  can now land on a Copa América entry instead of only World Cup/EURO, so
  the regex the test matches against gained `|Copa América`. Verified with
  `pnpm lint`, the full Vitest suite (134 cases, unchanged), and the full
  Playwright suite (191 cases, unchanged), all passing.

**Left for a future pass:**
- Nations League, Ballon d'Or, and Golden Boot still don't have a "Final
  date" column - same additive pattern (research dates, add the column,
  append one `buildOnThisDayEntries(...)` call).
- The League-table and Home-and-away Copa América eras (36 editions)
  intentionally have no "Final date" - see the content file's editorial
  warning for why a single date can't be assigned without guessing. This is
  a permanent design decision for those formats, not an open item.
- The Croatian home page (`src/pages/hr/index.astro`) still doesn't render
  the widget at all - unchanged scope from the previous run.
- The "by team" filter remains the largest still-missing required
  capability from `docs/WEBSITE_REQUIREMENTS.md`.

## Known caveats

- World Cup, EURO, Nations League, Copa América, Ballon d'Or, Golden Boot,
  Records and Timelines, Compare National Teams, and the Family Quiz all have
  live pages now.
- Historical names appear as distinct winner-filter entries by design.
- First-ever Pages deploy can hang in GitHub's `updating_pages` provisioning and
  time out; re-running the deploy clears it (it did here).

See also `IMPLEMENTATION_NOTES.md` (decisions/testing detail) and
`docs/ADDING_CONTENT.md` (how to add or edit content).
