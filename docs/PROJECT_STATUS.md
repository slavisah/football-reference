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
pnpm test                      # 167 Vitest unit tests
pnpm build                     # static build + all content validation
PW_CHROME_CHANNEL=chrome pnpm test:e2e   # 242 Playwright tests at 360px (mobile
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

### "On this day" widget - third slice: UEFA Nations League

Added 2026-08-03 (intensive run). Continues the widget's rollout exactly as
predicted by the previous run's "Left for a future pass" note - Nations
League was next in line, and this routine's competition priority order
(Copa América > Nations League > Ballon d'Or > Golden Boot) also puts it
ahead of the two individual-award tables.

- **`content/uefa-nations-league.md`** gained a "Final date" column on its
  Finals table, filled in for all four completed editions (2018-19 through
  2024-25) - unlike Copa América, every Nations League Finals edition
  resolves with one single decisive match (a single-elimination final, no
  league-table or home-and-away eras to work around), so this is a complete
  fill, not a partial one. Dates researched via a research agent's
  WebSearch pass, then independently spot-verified with a direct WebSearch
  for the 2020-21 final (France 2-1 Spain, 10 October 2021, San Siro) against
  ESPN and UEFA.com directly, since the agent's second citation for that one
  edition was only another Wikipedia page rather than an independent outlet
  - both agreed regardless. All four dates cross-checked against Wikipedia's
  dedicated final-match article plus a second source (ESPN) where available;
  see the new "Final match dates audit" entry under `docs/SOURCES.md`'s UEFA
  Nations League section. Front matter `lastReviewed` bumped to
  `2026-08-03`; `status: review` unchanged (secondary sources, matching the
  precedent every other "Final date" pass has set).
- **`src/pages/index.astro`**: added
  `buildOnThisDayEntries(competitions.nationsLeague.editions, 'UEFA Nations League')`
  to the home page's `onThisDayEntries` array - no other library or component
  code changes needed, confirming (a third time) that extending the widget
  to another competition is purely additive.
- **`src/pages/hr/competitions/nations-league.astro`** gained a
  `'Final date': 'Datum finala'` entry in its `headerLabels` map, matching
  the World Cup/EURO/Copa América precedent (the Croatian home page still
  doesn't render the widget itself - unchanged from the previous run).
  Regenerated `public/downloads/nations-league.pdf` via `pnpm build:pdfs`
  since its Editions table gained a column; the other five PDFs were also
  regenerated by the same command but reverted before committing since only
  a build timestamp differed, same as every prior PDF-regeneration entry in
  this file.
- **Tests**: no unit test changes needed (`tests/unit/onThisDay.test.ts` uses
  synthetic fixtures, not the real content file). One Playwright assertion in
  `tests/e2e/mobile.spec.ts` ("falls back to an archive card on a non-final
  date") updated the same way the Copa América slice did - 1 January's
  deterministic fallback pick can now land on a Nations League entry instead
  of only the three previous competitions, so the regex gained
  `|UEFA Nations League`. Verified with `pnpm lint`, the full Vitest suite
  (134 cases, unchanged), and the full Playwright suite (191 cases,
  unchanged), all passing.

**Left for a future pass:**
- Ballon d'Or and Golden Boot still don't have a "Final date"/equivalent
  column - same additive pattern, next in this routine's priority order.
- The Croatian home page (`src/pages/hr/index.astro`) still doesn't render
  the widget at all - unchanged scope from the previous two runs.
- The "by team" filter remains the largest still-missing required
  capability from `docs/WEBSITE_REQUIREMENTS.md`.

### "On this day" widget - fourth slice: Men's Ballon d'Or (Ceremony date)

Added 2026-08-03 (intensive run). Continues the widget's rollout - Ballon
d'Or was next in this routine's priority order (Copa América > Nations
League > Ballon d'Or > Golden Boot), and was explicitly the next step named
in the previous run's "Left for a future pass" note. Unlike the four team
competitions, an individual award has no match to date, so this slice
introduces a second, parallel column concept rather than reusing "Final
date" as-is.

- **`content/ballon-dor.md`** gained a new "Ceremony date" column on its
  Winners table, filled in for all 69 awarded editions (1956-2025, excluding
  the cancelled 2020 award, which keeps "—"). Dates were researched via four
  parallel WebSearch research agents split by era (1956-1973, 1974-1991,
  1992-2009, 2010-2025), each cross-checking every year's Wikipedia article
  against a second independent source (France Football magazine issue
  listings, contemporaneous news archives, or - for the pre-1992 years, since
  France Football published weekly on Tuesdays in that era - a Tuesday-of-
  the-week consistency check). Two years had a genuine source conflict,
  resolved in favor of the Tuesday-consistent date (1965, 1973); six further
  years rest on a single source despite a real second-source search effort
  (1976, 1978, 1984, 1986, 2005). See the new "Ceremony dates audit" entry
  under `docs/SOURCES.md`'s Ballon d'Or section and the new "Important
  editorial note" section in `content/ballon-dor.md` for the full
  methodology and caveats - this environment's network policy blocks direct
  WebFetch access to Wikipedia and similar hosts, so every finding rests on
  WebSearch-summarized results rather than a directly-fetched primary
  source, flagged for a future re-verification pass. The 2010-2015 "FIFA
  Ballon d'Or" era's ceremonies were each held in January of the year *after*
  the award-year label (e.g. the "2010" award was presented 10 January
  2011); the Year column keeps the award-year label throughout (unchanged,
  matching every other column), while Ceremony date records the real
  calendar date - the same treatment EURO 2020's postponed final already
  gets. Front matter `lastReviewed` bumped to `2026-08-03`; `status: review`
  unchanged (secondary sources, same reasoning every other "Final/Ceremony
  date" pass has given).
- **`src/lib/onThisDay.ts`**: `buildOnThisDayEntries()` now also matches a
  "Ceremony date" header (alongside the existing "Final date"), and each
  entry carries a new `isAward` boolean so the display layer can tell an
  award ceremony apart from a match final. **Bug found and fixed in the same
  pass**: `OnThisDay.astro`'s fallback result text was hardcoded to
  `"{champion} won the final."` whenever an edition's `Final` score column
  was absent - accurate for tournaments (a final was still played, just
  without a recorded score, e.g. early Copa América editions), but wrong for
  the Ballon d'Or, which has no match at all. Both the server-rendered markup
  and the client-side re-check script (which can't import the shared helper
  and duplicates this logic, same constraint as `ThemeToggle`'s inline
  script) now branch on `isAward` to say "won the award" instead. This is a
  correctness fix or it would have shipped an inaccurate sentence in the same
  run that could have gone unnoticed - AGENTS.md's rule against altering
  historical facts. Covered by 2 new Vitest cases (`isAward: true` for a
  Ceremony-date entry, `isAward` absent for a Final-date entry).
- **`src/pages/index.astro`**: added
  `buildOnThisDayEntries(competitions.ballonDor.editions, "Men's Ballon d'Or")`
  to the home page's `onThisDayEntries` array - purely additive, as every
  prior slice predicted. Golden Boot is **deliberately not** given its own
  entry: its top-scorer facts are tied to the exact same World Cup/EURO
  finals already in the widget from those two competitions' own "Final date"
  columns, so adding it would only duplicate existing cards, not add new
  ones - noted in the file's own comment so a future pass doesn't
  "complete" it by mistake.
- **`src/pages/hr/competitions/ballon-dor.astro`** gained a
  `'Ceremony date': 'Datum svečanosti'` entry in its `headerLabels` map,
  matching the World Cup/EURO/Copa América/Nations League precedent (the
  Croatian home page still doesn't render the widget itself - unchanged from
  the previous two runs).
- Regenerated `public/downloads/ballon-dor.pdf` via `pnpm build:pdfs` since
  its Editions table gained a column; the other five PDFs were also
  regenerated by the same command but reverted before committing since only
  a build timestamp differed, same as every prior PDF-regeneration entry in
  this file.
- **Tests**: 2 new Vitest cases as above (136 total, up from 134) and 1 new
  Playwright case at 360px asserting an exact-date Ballon d'Or match (12
  December, the 2016 Cristiano Ronaldo ceremony - chosen because no World
  Cup/EURO/Copa América/Nations League decisive match has ever fallen on
  that date) shows "won the award", not "won the final" (192 total, up from
  191). The existing "falls back to an archive card" fallback test's regex
  widened to accept a Ballon d'Or entry, matching the same pattern the Copa
  América and Nations League slices used, since the fallback's day-of-year
  pick can shift once the entry pool changes size. Verified with `pnpm
  lint`, the full Vitest suite, and the full Playwright suite, all passing.

**Left for a future pass:**
- Golden Boot remains intentionally excluded from the widget (see above -
  not an oversight).
- The Croatian home page (`src/pages/hr/index.astro`) still doesn't render
  the widget at all - unchanged scope from every prior slice.
- The "by team" filter remains the largest still-missing required
  capability from `docs/WEBSITE_REQUIREMENTS.md`.
- A handful of Ballon d'Or ceremony dates (1965, 1973, 1976, 1978, 1984,
  1986, 2005) rest on single-source or conflict-resolved research rather
  than two independently agreeing sources - worth a follow-up pass with
  direct (non-WebSearch-only) source access if higher certainty is needed.

### "On this day" widget - Croatian translation

Added 2026-08-03 (intensive run). Closes the "Croatian home page doesn't
render the widget" item every one of the four prior slices left open - the
last remaining gap in the widget's rollout, since all five competitions/
awards that feed it are already localized elsewhere on the site.

- **`src/lib/onThisDay.ts`** gained three small, pure, locale-aware helpers
  rather than hardcoding English strings in the component: `monthNamesFor()`
  (12 month names per locale - Croatian in the grammatically-correct genitive
  case used in dates, e.g. "srpnja" not "Srpanj"), `formatOnThisDayDate()`
  (locale-appropriate bare-date formatting - "30 July" vs "30. srpnja", with
  the period Croatian convention requires), and `onThisDayResultText()` (the
  card's result line: the recorded score verbatim when there is one - scores
  are data, not translated, matching every other page's precedent - else a
  locale-appropriate "{champion} won the final/award" sentence). All three
  default to `'en'` so the existing English call sites needed no changes.
- **`OnThisDay.astro`** gained an optional `locale` prop (default `'en'`,
  byte-identical English output verified against a pre-change build) used for
  the heading (new `onThisDayHeading` i18n key, overridable via the existing
  `heading` prop same as before), the hint text (new `onThisDayHint` key) and
  the empty-state text (new `onThisDayEmpty` key). The **client-side re-check
  script** can't import `t()` or the new lib helpers (same `is:inline`
  constraint every other duplicated-logic script in this codebase documents),
  so it now receives `monthNames`/`locale`/`emptyText` via `define:vars` and
  carries its own `formatDate()`/`resultText()` mirroring the two new pure
  functions, alongside the pre-existing duplicated `entriesOnDate()`/
  `fallbackEntry()`.
- **`src/pages/hr/index.astro`** now loads `buildOnThisDayEntries()` for the
  same five competitions/awards as the English home page (World Cup, EURO,
  Copa América, Nations League, Ballon d'Or; Golden Boot excluded for the
  same reason noted on the English page), passing each competition's already-
  established Croatian display name from `homeCards.ts`'s `CARD_TEXT` (e.g.
  "FIFA Svjetsko prvenstvo", "Zlatna lopta") so a card's competition label
  matches the rest of the Croatian site. Renders `<OnThisDay
  entries={onThisDayEntries} locale="hr" />` in the same position between the
  competition cards and the features section as the English page. No new
  data was researched - reuses the exact "Final date"/"Ceremony date" columns
  already on the shared `content/*.md` files, so a card's underlying fact
  (year, champion, date) can never drift between languages, only the
  competition name, sentence wording and date format around it.
- Covered by 7 new Vitest cases (`tests/unit/onThisDay.test.ts`:
  `monthNamesFor` for both locales, `formatOnThisDayDate`'s English vs.
  Croatian-with-period formatting, `onThisDayResultText`'s score-verbatim/
  English-sentence/Croatian-sentence cases) and 3 new Playwright cases at
  360px in the Croatian home page describe block, mirroring the three
  existing English "On this day" cases exactly: an exact-date match (30 July,
  both 1930 and 1966 World Cup finals, translated heading and "30. srpnja"
  date), the archive-fallback hint (translated hint text, on 1 January), and
  the Ballon d'Or award-wording case (12 December 2016 Cristiano Ronaldo,
  asserting "je osvojio nagradu" appears and "finalu" does not). Verified
  with `pnpm lint` (0 errors/0 warnings - one pre-existing-pattern `astro
  check` hint on the client script's `define:vars`-only `monthNames`
  reference, the same false positive `entries` already had), the full Vitest
  suite (143 cases, up from 136) and the full Playwright suite (195 cases,
  up from 192 - including the unchanged 44-case WCAG sweep, which found no
  new contrast/keyboard violations on either home page), all passing. Also
  confirmed byte-for-byte that the built `dist/index.html` (English) widget
  markup is unchanged from before this run, and spot-checked the built
  `dist/hr/index.html` widget markup directly (translated heading/hint,
  genitive-case date, and the correct "je osvojio nagradu" sentence).

**Left for a future pass:**
- Golden Boot remains intentionally excluded from the widget on both
  languages (unchanged reasoning from the first slice).
- The "by team" filter remains the largest still-missing required
  capability from `docs/WEBSITE_REQUIREMENTS.md` - now the single largest
  item left in the entire backlog, since the widget's rollout (all four team
  competitions + Ballon d'Or + both languages) is complete.
- The same handful of Ballon d'Or ceremony dates noted in the previous slice
  still rest on single-source research.

### "By team" filter - added 2026-08-03 (intensive run)

Closes the item the previous three runs' "Left for a future pass" notes each
called out as "the single largest item left in the entire backlog" -
`docs/WEBSITE_REQUIREMENTS.md` requires filtering by "year, host, winner, and
team", and only the team filter was still missing across all six competition/
award pages, in both languages.

- **`src/lib/editions.ts`** gained `editionTeams()` and `distinctTeams()`.
  Rather than reusing the existing `winner` field (which would only surface
  the champion), `editionTeams()` reads every team-holding column of a row -
  Winner/Champion, Runner-up, Third, Fourth (and EURO's "Other semifinalist"
  variants, matched via a shared `/finalist/i` pattern since "semifinalist"
  contains "finalist") - so a team that only ever reached a final or
  semifinal, and never won, still surfaces when a reader filters by its name
  (e.g. Portugal has never won or been runner-up in the World Cup, but
  filtering by "Portugal" now correctly returns 1966, third place, and 2006,
  fourth place). One subtlety: on the individual-award tables (Ballon d'Or,
  Golden Boot) the "Winner" column holds a *player*, not a team, and a
  separate "National team"/"Team" column holds the actual country - so
  `editionTeams()` detects whether a row carries a dedicated team column and,
  if so, skips "Winner"/"Champion" for that row rather than treating a
  player's name as a team. Missing-data em dashes and "Not awarded"-style
  placeholders are excluded the same way the existing winner/host filters
  already do.
- **`src/components/TournamentTable.astro`** gained a `teams` prop (mirroring
  the existing `hosts` prop: pass `[]` or omit to hide the filter) plus a new
  `<select>` field, a `data-teams` attribute per row (pipe-joined, since team
  names contain spaces and can't safely share a space-joined attribute the
  way single-token values could), and full client-side wiring: the team
  filter combines with winner/year/host exactly like the existing filters,
  is restored from and written back to a `?team=` URL parameter (so a
  filtered view stays shareable), and is included in the reset button and the
  "Showing N of M" status text. `teamLabel`/`teamAllLabel`/`bitTeamPrefix`
  props follow the same override pattern every other filter label already
  uses, so localized pages can translate it.
- **`src/lib/competition.ts`**: `CompetitionData` gained a `teams: string[]`
  field (`distinctTeams(editions)`), threaded through automatically to every
  page that uses `loadCompetition()` + `CompetitionView.astro` (World Cup,
  EURO, Copa América, Nations League, Ballon d'Or). The English Golden Boot
  page and all six Croatian competition pages compose their own layout by
  hand (see earlier entries in this file for why), so each of those 8
  `TournamentTable` call sites needed its own `teams={...}` prop added
  directly - done for all of them in this pass, so the filter is live on
  every competition/award page in both languages, not a partial rollout.
  Croatian pages label it "Reprezentacija" / "Sve reprezentacije" (matching
  the existing Ballon d'Or/Golden Boot Croatian header translation for
  "National team"/"Team"), deliberately distinct from "Momčadi" (the
  existing translation of the World Cup/EURO team-*count* column) to avoid
  the two reading as the same concept.
  Every page's meta `description` (English and Croatian) was also updated to
  mention the team filter, matching what the page now actually offers.
- **Tests**: 9 new Vitest cases in `tests/unit/editions.test.ts`
  (`editionTeams`: every team-holding column, em-dash skipping, the shared
  EURO "finalist" pattern, the National-team-vs-Winner-as-player distinction,
  placeholder exclusion; `distinctTeams`: alphabetical dedup, a
  semifinal-only team surfacing where `distinctWinners` would miss it, and
  the empty-list case for a table with no team-holding column - 152 total,
  up from 143) and 1 new Playwright case at 360px on the World Cup page (the
  Portugal 1966/2006 scenario above, including the shareable `?team=` URL and
  reset behavior), plus one new assertion added to the existing Croatian
  World Cup "renders translated chrome, filters and column headers" case
  that `label[for="world-cup-team"]` reads "Reprezentacija" (196 total, up
  from 195). Verified with `pnpm lint` (0 errors/0 warnings, same
  pre-existing `monthNames` hint as every prior run), the full Vitest suite,
  and the full Playwright suite, all passing.

**Left for a future pass:**
- No known gaps in the team filter itself - it's live on all six
  competition/award pages, both languages, and combines correctly with every
  existing filter.
- With the team filter shipped, every "Required capability" listed in
  `docs/WEBSITE_REQUIREMENTS.md` is now implemented. The largest remaining
  work is on the "Nice-to-have" list (installable PWA and "on this day" are
  already done; a per-competition downloadable print sheet exists via the
  PDF links) - a future pass could revisit content-accuracy/quality passes
  instead, per this routine's fallback instruction.
- The same handful of Ballon d'Or ceremony dates noted in an earlier slice
  still rest on single-source research.

### "Required pages" fix: `/awards/ballon-dor` and `/awards/golden-boot` redirects

Added 2026-08-03 (intensive run). With the previous run's "by team" filter,
every item in `docs/WEBSITE_REQUIREMENTS.md`'s "Required capabilities" list
was implemented - but re-checking that same file's "Required pages" list
turned up a gap none of the prior ~20 intensive runs had flagged: it
specifies `/awards/ballon-dor` and `/awards/golden-boot`, while both pages
were actually built at `/competitions/ballon-dor` and
`/competitions/golden-boot` (grouped with the other four competition pages,
matching the site nav, the Croatian translations, the generated PDFs, the
sitemap, and every existing test - all of which already point at
`/competitions/...`).

Moving the canonical pages now would have meant touching every internal
link, both languages' `TRANSLATED_PATHS`, `NAV_LINKS`, the sitemap's
`CONTENT_ID_BY_PATH`, the generated PDF filenames, and every test that
already asserts a `/competitions/...` URL - a wide, purely mechanical,
higher-risk rename for zero reader-facing benefit. Instead, `astro.config.mjs`
gained a `redirects` entry so the documented required path actually resolves:

- `/awards/ballon-dor` -> `/competitions/ballon-dor`
- `/awards/golden-boot` -> `/competitions/golden-boot`

**Bug found and fixed in the same pass**: Astro's `redirects` config prepends
the site's `base` path (`/football-reference`) to the *source* path
automatically, but not to the *destination* - the first build produced a
redirect page whose meta-refresh target and canonical link both pointed at
`/competitions/ballon-dor` with no base prefix, which would 404 once deployed
under the GitHub Pages base path. Fixed by prepending `base` to both
destination strings by hand in the config (confirmed by inspecting the built
`dist/awards/ballon-dor/index.html` before and after: the meta refresh now
reads `content="0;url=/football-reference/competitions/ballon-dor"`). For a
static build, Astro's `redirects` produces a small HTML page with
`<meta http-equiv="refresh">`, `<meta name="robots" content="noindex">`, and a
canonical link pointing at the destination - so the redirect page itself is
excluded from the sitemap (which already only lists `NAV_LINKS`, unchanged)
and never gets indexed as a duplicate of the real page.

Covered by 3 new Playwright cases (`tests/e2e/mobile.spec.ts`, new
"Required-page redirects" describe block): both redirects land on the real
page's `<h1>`, and the raw response for `/awards/ballon-dor/` carries the
base-path-prefixed meta refresh and the `noindex` tag. Verified with `pnpm
lint` (0 errors/0 warnings, same pre-existing hint as every prior run), the
full Vitest suite (152 cases, unchanged - no library code changed), and the
full Playwright suite (199 cases, up from 196), all passing. No PDF
regeneration needed - no Editions table changed.

**Left for a future pass:** the Croatian competition pages
(`/hr/competitions/ballon-dor`, `/hr/competitions/golden-boot`) have no
`/hr/awards/...` equivalent - `docs/WEBSITE_REQUIREMENTS.md`'s "Required
pages" list predates localization and only lists the English paths, so this
wasn't treated as a gap; would be a one-line addition to the same
`redirects` map if ever wanted.

### Content-accuracy pass: UEFA Nations League full results audit - no discrepancies

Added 2026-08-04 (intensive run). With the team filter and required-pages
redirect both closed, and every "Required capability" in
`docs/WEBSITE_REQUIREMENTS.md` now implemented, this run followed the
previous two runs' own "Left for a future pass" notes toward a
content-accuracy pass instead of new features - Nations League is next in
this routine's stated competition-priority order (Copa América's own
third/fourth/Format audits are already closed) and had never had a dedicated
results audit of its own, only the narrower final-*date* audit from
2026-08-03.

- Verified every one of `content/uefa-nations-league.md`'s four completed
  editions (2018-19 through 2024-25) - Winner, Runner-up, Third, Fourth, and
  the Final score - via WebSearch, cross-checking UEFA.com's own match report
  against ESPN's box score per edition, the same two-independent-sources
  method the 2026-08-03 date audit used. The final-date audit already
  implicitly covered each Final's winner/score (same match, same source
  pair); this pass adds the third-place play-off specifically, which had
  never been independently checked.
- **No discrepancies found.** Every row matches exactly as authored: England
  beat Switzerland on penalties for third in 2019 (0-0 after 120, 6-5 pens);
  Italy beat Belgium 2-1 for third in 2021; Italy beat co-host Netherlands
  3-2 for third in 2023; France beat host Germany 2-0 for third in 2025. The
  "Key facts" bullets (Portugal's inaugural and first-repeat titles, Croatia's
  first final) were re-checked against the same sources and are also
  accurate.
- `docs/SOURCES.md` gained a "Third-place match audit" citation entry (UEFA.com
  + ESPN per edition, 8 links) alongside the existing final-dates entry.
  `content/uefa-nations-league.md`'s `lastReviewed` moved to 2026-08-04;
  `status` stays `review` (unchanged) - this pass used secondary sources
  (UEFA.com, ESPN), not primary competition records, matching the same
  reasoning every earlier secondary-sourced Copa América audit gave for not
  marking a page `verified`.
- No content, code, or test changes were needed since nothing was wrong - this
  is a clean audit-closed entry, the same shape as the Copa América
  "audit closed" passes. Verified with `pnpm lint` (0 errors/0 warnings, same
  pre-existing hint as every prior run) and the full Vitest/Playwright suites
  (152/199 cases, both unchanged from the prior run - no code or test changes
  were needed), all still passing.

**Left for a future pass:**
- EURO and World Cup have no dedicated third/fourth-place results audit of
  their own yet (only Copa América and now Nations League do) - EURO's and
  World Cup's editions are older and more thoroughly cross-referenced across
  independent secondary sources already, so this is lower priority than it
  was for Copa América's harder-to-source pre-1975 era, but still open.
- The same handful of Ballon d'Or ceremony dates noted in an earlier slice
  still rest on single-source research.

### Content-accuracy pass: UEFA EURO third-place play-off audit - no discrepancies

Added 2026-08-04 (intensive run). Directly closes half of the previous run's
own "Left for a future pass" note above - EURO's own third/fourth-place audit
was still open (only Copa América and Nations League had one). EURO's data
model differs from the other two: only six editions (1960-1980) played an
actual third-place match, under the old 4-team "final four" format; from 1984
onward UEFA does not rank the two defeated semifinalists, so there is nothing
to audit for the other eleven editions - `content/uefa-euro.md`'s own
"Historical format note" already documents this split, unchanged by this
pass.

- Verified all six 1960-1980 editions' third-place play-offs via WebSearch,
  cross-checking UEFA.com's own match/history pages against a second
  independent source (eu-football.info, 11v11, or a contemporaneous match
  report) per edition, the same two-independent-sources method the Nations
  League third-place audit used. The check specifically targets whether the
  content table's "Other semifinalist" (3rd) / "Other semifinalist / fourth"
  (4th) column *order* is correct for these rows, since neither column is
  explicitly labeled "Third"/"Fourth" - the ranking is encoded purely by
  which column a team appears in.
- **No discrepancies found.** All six third-place results match exactly as
  the column order already implies: Czechoslovakia beat France 2-0 (1960),
  Hungary beat Denmark 3-1 after extra time (1964), England beat the Soviet
  Union 2-0 (1968), Belgium beat Hungary 2-1 (1972), Netherlands beat
  Yugoslavia 3-2 after extra time (1976), and Czechoslovakia beat host Italy
  1-1 (a.e.t.), 9-8 on penalties (1980).
- `docs/SOURCES.md` gained a "Third-place play-off audit" citation entry
  under the UEFA EURO section (6 UEFA.com/eu-football.info links, one per
  edition). `content/uefa-euro.md`'s `lastReviewed` moved to 2026-08-04;
  `status` stays `review` (unchanged) - secondary sources, not a primary
  UEFA competition record, matching the same reasoning every earlier
  secondary-sourced audit in this file has given.
- No content, code, or test changes were needed since nothing was wrong -
  the table's existing data was already correct, so this is a clean
  audit-closed entry, the same shape as the Nations League and Copa América
  "audit closed" passes. Verified with `pnpm lint` (0 errors/0 warnings, same
  pre-existing hint as every prior run) and the full Vitest/Playwright
  suites (152/199 cases, both unchanged from the prior run - no code or test
  changes were needed), all still passing.

**Left for a future pass:**
- World Cup remains the only competition without a dedicated third/fourth-
  place results audit of its own (Copa América, Nations League, and now
  EURO all have one) - its 22 editions and mixed formats (some early
  editions had no third-place match at all) make it the largest remaining
  audit in this series, next in line.
- The same handful of Ballon d'Or ceremony dates noted in an earlier slice
  still rest on single-source research.

### Content-accuracy pass: FIFA World Cup third/fourth-place results audit - no discrepancies

Added 2026-08-04 (intensive run). Closes the previous run's own "Left for a
future pass" note directly above: World Cup was the last of the four team
competitions without its own dedicated third/fourth-place audit (Copa
América, Nations League, and EURO all already had one). This is the largest
of the four - 22 editions spanning nearly a century of format changes,
including the two edge cases (1930, 1950) where no separate third-place
match was ever played.

- Verified the "Third"/"Fourth / other semifinalist" columns for all 21
  completed editions (1930-2022) in `content/fifa-world-cup.md` via three
  parallel WebSearch research passes split by era (1930-1962, 1966-1994,
  1998-2022), each edition cross-checked against at least two independent
  sources - ESPN's match archive/box scores and FIFA.com's official match
  pages as the primary pair, supplemented by other outlets search surfaced
  (Wikinews, France24, CBS News, Sky Sports, Athlet.org) where useful. 2026
  is the site's own forward-looking scheduled entry, not a completed
  tournament to fact-check against outside sources, so it was excluded from
  audit scope (same reasoning every other page's "Final date" audits have
  applied to any not-yet-played fixture).
- **No discrepancies found in any of the 21 editions.** Both format edge
  cases already documented in the page's "Editorial notes" section were
  independently reconfirmed rather than merely trusted: 1930 played no
  third-place match at all, with the United States (3rd) and Yugoslavia
  (4th) coming from FIFA's own 1986 technical-committee retrospective
  ranking; 1950 had no separate match either, with Sweden (3rd) and Spain
  (4th) read directly off the four-team final round-robin group's points
  table (Uruguay 5, Brazil 4, Sweden 2, Spain 1). The other 19 editions'
  documented third-place winners and losers all matched their real
  third-place play-off results exactly.
- `docs/SOURCES.md` gained a "Third/fourth-place audit" entry under FIFA
  World Cup with the full source list per era.
  `content/fifa-world-cup.md`'s `lastReviewed` moved to 2026-08-04; `status`
  stays `review` (unchanged) - secondary sources (ESPN, FIFA.com, and other
  outlets), not a single primary competition record, matching the same
  reasoning every earlier secondary-sourced audit in this file has given.
- No content, code, or test changes were needed beyond the front-matter date
  and the sources entry, since nothing in the existing table was wrong -
  this is a clean audit-closed entry, the same shape as the Copa América,
  Nations League, and EURO "audit closed" passes. Verified with `pnpm lint`
  (0 errors/0 warnings, same pre-existing hint as every prior run) and the
  full Vitest/Playwright suites, both unchanged from the prior run (no code
  or test changes were needed), all still passing.

This closes the third/fourth-place audit series across all four team
competitions - Copa América, Nations League, EURO, and now the World Cup -
every one of the site's team-competition tables has now had its
runner-up/third/fourth data independently cross-checked against outside
sources at least once.

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in an earlier slice
  still rest on single-source research.
- With every team competition's third/fourth-place data now audited and
  every required/nice-to-have backlog item from `docs/WEBSITE_REQUIREMENTS.md`
  and `AGENTS.md` implemented, a future run should look for a fresh
  content-accuracy angle (e.g. auditing the individual-award tables' winner/
  runner-up-equivalent data, or a full source-link liveness check across
  `docs/SOURCES.md`) rather than assuming there's nothing left to verify.

### Content-accuracy pass: Men's Ballon d'Or winners audit - no discrepancies

Added 2026-08-04 (intensive run). Follows directly from the previous run's own
"Left for a future pass" suggestion: with every team competition's third/
fourth-place data now audited, this run turns to the individual-award tables -
the Ballon d'Or "Winner"/"National team" columns themselves had never been
independently audited (only the separate Ceremony date column got a dedicated
pass on 2026-08-03). This is the routine's next-highest-priority competition
per its stated order (Copa América and Nations League are both fully audited;
Ballon d'Or comes before Golden Boot).

- Verified all 69 awarded editions (1956-2025, excluding the cancelled 2020
  award) in `content/ballon-dor.md` via four parallel WebSearch research
  agents split by era (1956-1973, 1974-1991, 1992-2009, 2010-2025 - the same
  era split the ceremony-dates audit used), each cross-checking every
  winner's name and national team against multiple independent sources
  (ESPN, Sky Sports, BBC, Goal.com, UEFA.com, France Football retrospectives,
  Wikipedia search snippets - WebSearch only, since direct WebFetch to
  Wikipedia/RSSSF-type hosts remains blocked by this environment's network
  policy, the same constraint every prior secondary-sourced audit in this
  file has documented).
- Specifically targeted the two nationality-naturalization cases in the
  1956-1973 era most likely to hide a subtle error - a player's country of
  birth silently swapped in for the country they actually represented:
  **1960 Luis Suárez** (Spanish-born, correctly attributed to Spain) and
  **1961 Omar Sívori** (Argentine-born, naturalized Italian and playing for
  the Italy national team by 1961, correctly attributed to Italy rather than
  Argentina). Both confirmed correct as already authored.
- Also re-confirmed **2020**'s "Not awarded"/"—" row is the genuine historical
  fact (France Football cancelled the award due to COVID-19 disrupting the
  football calendar, not a data-entry gap), and spot-checked the "Multiple
  winners through 2025" summary table's two largest totals (Messi 8,
  Cristiano Ronaldo 5) against the same sources.
- **No discrepancies found in any of the 69 rows or either summary total.**
  Every winner name (including diacritics: Alfredo Di Stéfano, Flórián
  Albert, Eusébio, Pavel Nedvěd, Kaká) and every national-team attribution
  matches independent sources exactly.
- `docs/SOURCES.md` gained a "Winners and national-team audit" entry under
  Ballon d'Or documenting the method and the two nationality edge cases.
  `content/ballon-dor.md`'s `lastReviewed` moved to 2026-08-04; `status`
  stays `review` (unchanged) - secondary sources, not a primary France
  Football archive, matching the same reasoning every earlier
  secondary-sourced audit in this file has given.
- No content, code, or test changes were needed since nothing was wrong -
  this is a clean audit-closed entry, the same shape as the Copa América,
  Nations League, EURO, and World Cup "audit closed" passes. Verified with
  `pnpm lint` (0 errors/0 warnings, same pre-existing hint as every prior
  run) and the full Vitest/Playwright suites (152/199 cases, both unchanged
  from the prior run - no code or test changes were needed), all still
  passing.

This closes the first individual-award content-accuracy audit - every team
competition's third/fourth-place data and now the Ballon d'Or's winner/team
data have each had at least one independent cross-check against outside
sources.

**Left for a future pass:**
- **Golden Boot** (`content/golden-boot.md`) is the one remaining
  competition/award table with no dedicated content-accuracy audit of its
  own - its 39 rows (23 World Cup + 16 EURO top-scorer editions, several with
  multi-way ties) have never been independently cross-checked, and it also
  has the oldest `lastReviewed` date on the site (2026-07-23). Natural next
  step per this routine's priority order.
- The same handful of Ballon d'Or ceremony dates noted in an earlier slice
  still rest on single-source research (unchanged - this pass audited
  winner/team data, not ceremony dates).
- A full source-link liveness check across `docs/SOURCES.md` remains
  unstarted, per the previous run's note.

### Content-accuracy pass: Golden Boot top-scorer audit - one discrepancy found and fixed

Added 2026-08-04 (intensive run). Follows directly from the previous run's own
"Left for a future pass" note: Golden Boot was the one remaining competition/
award table on the site with no dedicated content-accuracy audit, and had the
oldest `lastReviewed` date (2026-07-23). This is the routine's
next-highest-priority item per its stated order (Copa América, Nations
League, and Ballon d'Or are all fully audited; Golden Boot is last).

- Verified all 39 rows of `content/golden-boot.md`'s two tables - the FIFA
  World Cup top scorers (23 editions, 1930-2026) and UEFA EURO top scorers
  (16 editions, 1960-2024) - via five parallel WebSearch research passes
  split by era/competition (World Cup 1930-1966, 1970-2002, 2006-2026; EURO
  1960-1992, 1996-2024), each row cross-checked against multiple independent
  sources (ESPN, BBC, Sky Sports, Goal.com, FIFA.com, UEFA.com, CBS Sports,
  Sports Illustrated, Transfermarkt, Wikipedia search snippets - WebSearch
  only, since direct WebFetch to Wikipedia/RSSSF-type hosts remains blocked
  by this environment's network policy, the same constraint every prior
  secondary-sourced audit in this file has documented).
- Every multi-way tie got special attention for completeness (no missing or
  extra names) and diacritic accuracy: the 1962 World Cup's six-way tie; the
  1960 (five-way), 1964 (three-way), and 1992 (four-way) EURO ties; and the
  2012 and 2024 EURO six-way ties. All confirmed correct as authored.
- The 2026 World Cup row (Kylian Mbappé, France, 10 goals) got deliberate
  extra scrutiny as the newest, highest-risk entry on the page - the 2026
  tournament's scheduled final (19 July) predates this run's date, so a real
  result should be independently verifiable rather than assumed from
  training data. Confirmed by FIFA.com's own official award-winners page for
  the 2026 tournament plus six further independent outlets (ESPN, Sky
  Sports, NBC Sports, Fox Sports, Yahoo Sports, Real Madrid's own site);
  Mbappé became the first player to win the World Cup Golden Boot twice
  (also 2022), and his 10 goals ties Gerd Müller's 1970 tally as the highest
  single-tournament total since then.
- **One discrepancy found and fixed:** the 1950 row credited Ademir (Brazil)
  with 8 goals; the consensus figure across independent sources (Wikipedia,
  Goal.com, Sports Illustrated, OneFootball, worldcupranking.com) is **9
  goals**. Corrected in `content/golden-boot.md`. This is the same shape as
  two other pre-1940s totals already on this page that historical sources
  have revised over time (Oldřich Nejedlý's 1934 total, corrected from 4 to
  5; Leônidas's 1938 total, corrected from 8 to 7) - both already correct as
  authored, confirmed by this same research pass.
- No other discrepancies found across either table's 39 rows.
- `docs/SOURCES.md` gained a "Golden Boot (top-scorer) audit" entry under
  both the FIFA World Cup and UEFA EURO headings (not a new "Golden Boot"
  heading - the Golden Boot page's own References section reads from those
  two existing headings via `sourcesHeading: 'FIFA World Cup' | 'UEFA EURO'`
  in `golden-boot.astro`, and `/about/sources` explicitly documents that
  Golden Boot has no source section of its own; a standalone heading would
  have silently orphaned the new links from the page that actually cites
  them, and contradicted that page's own explanatory text).
  `content/golden-boot.md`'s `lastReviewed` moved to 2026-08-04; `status`
  stays `review` (unchanged) - secondary sources, not a primary
  FIFA/UEFA statistics archive, matching the same reasoning every earlier
  secondary-sourced audit in this file has given.
- Verified with `pnpm lint` (0 errors/0 warnings, same pre-existing hint as
  every prior run) and the full Vitest/Playwright suites, both unchanged
  from the prior run (a one-number content fix needed no code or test
  changes), all still passing.

This closes the individual-award content-accuracy audit series - every
competition/award table on the site (World Cup, EURO, Copa América, Nations
League third/fourth-place data; Ballon d'Or and now Golden Boot winner/
scorer data) has now had at least one independent cross-check against
outside sources, and the one real error found in the whole series (1950
Ademir's goal count) is fixed.

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in an earlier slice
  still rest on single-source research.
- A full source-link liveness check across `docs/SOURCES.md` remains
  unstarted, per two previous runs' notes now.
- With every competition/award table's core data now independently audited
  at least once, a future pass should look for a different quality angle
  entirely - e.g. accessibility/performance sweeps, the source-link
  liveness check above, or a second independent cross-check of the tables
  that have only had one audit pass so far - rather than assuming there is
  nothing left to verify.

### Content-accuracy pass: 2026 FIFA World Cup final result, plus five Ballon d'Or ceremony-date second sources

Added 2026-08-04 (intensive run). Before starting a new quality angle, this
run checked whether `docs/SOURCES.md`'s stated liveness-check idea was
actually executable in this environment: WebFetch returned HTTP 403 for
every host tried (fifa.com, espn.com, en.wikipedia.org, rsssf.org - not just
Wikipedia/RSSSF, which earlier audits already knew were blocked). A source
"liveness check" built on WebFetch would therefore mark every single link
"dead" regardless of its real status, so that idea is not viable here and
was skipped in favor of two bounded, WebSearch-based tasks that are.

**1. 2026 FIFA World Cup final result (real discrepancy, fixed).** The
2026-08-02 final-dates audit and the 2026-08-04 third/fourth-place audit
both explicitly excluded the 2026 edition as "the scheduled/forward-looking
final" - true when this routine's audit series began, but stale by the time
either pass actually ran: the final was played 19 July 2026, weeks before
either audit's own run date. This run re-checked the full 2026 row in
`content/fifa-world-cup.md` as a genuinely completed tournament. Host,
teams, winner, runner-up, final date, and the third/fourth-place result
(England beat France 6-4, the highest-scoring bronze match in World Cup
history) were already correct. **One discrepancy found and fixed:** the
Final column read "Spain 1-0 Argentina" with no extra-time marker, but
Ferran Torres settled it in the 106th minute of extra time - corrected to
"Spain 1-0 Argentina (a.e.t.)" to match this table's own notation for every
other extra-time final decided without penalties. See `docs/SOURCES.md`'s
new "2026 final result audit" entry for sources and a process note: don't
exclude the current year's edition from an audit's scope just because an
earlier pass labeled it forward-looking - check the actual date first.

**2. Ballon d'Or ceremony dates: second sources for the last five
single-sourced years.** The 2026-08-03 ceremony-dates audit left five years
(1976, 1978, 1984, 1986, 2005) on a single corroborating source. This run
found a genuine second independent source for all five (RSSSF, France
Football's own social accounts, Sky Sports, and other outlets) - no date
changes needed, every year confirmed as already authored. Along the way it
resolved one further conflict (Dynamo Kyiv's own site claims 29 December for
Belanov's 1986 award; the weekly-Tuesday-publication pattern plus RSSSF and
France Football's own account confirm 30 December, as already authored) and
found one genuine exception to that same Tuesday-publication heuristic
(1978's well-corroborated date, 27 December, was a Wednesday) - flagged in
`content/ballon-dor.md`'s editorial note so a future conflict resolution
doesn't treat the Tuesday pattern as decisive on its own. See
`docs/SOURCES.md`'s new entry under Ballon d'Or for the full per-year source
list.

Verified with `pnpm lint` (0 errors/0 warnings, same pre-existing hint as
every prior run), the full Vitest suite (152/152, unchanged), and the full
Playwright suite (199/199, unchanged) - the pre-installed Chromium needed
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` this run since the default
bundled browser Playwright's own `pnpm install` pulled didn't match what's
preinstalled in this container; noted here in case a future run hits the
same "Executable doesn't exist" error.

**Left for a future pass:**
- A source-link liveness check remains infeasible in this specific
  environment (WebFetch 403s on every host, not just Wikipedia/RSSSF) -
  drop this idea unless a future run confirms different network access,
  rather than re-attempting it as-is.
- Accessibility is already automated (`tests/e2e/accessibility.spec.ts` runs
  an axe WCAG 2.1 A/AA sweep across every nav page, both languages, both
  color schemes) and performance has little surface on this
  image-light static content site - a future pass should look for a
  concrete gap in either (e.g. pages/states outside `NAV_LINKS` that axe
  doesn't reach, like individual quiz question states) rather than a broad,
  likely-low-yield sweep.
- A second independent cross-check of the tables that have only had one
  audit pass so far (World Cup/EURO/Copa América/Nations League
  winner-runner-up-final data beyond 2026, which the final-date audits only
  partially covered) remains open. **Copa América's Champion/Runner-up
  columns are now closed** (see the entry below, 2026-08-05) - World
  Cup/EURO/Nations League Champion/Runner-up/Final-score data is still open.

### Content-accuracy pass: Copa América Champion/Runner-up audit - no discrepancies

Added 2026-08-05 (intensive run). Closes the "second independent cross-check"
item left open by the 2026-08-04 run above, scoped to Copa América - the
competition prioritized first by this routine's backlog ordering. Unlike the
Format, third/fourth-place, and Final-date columns (each already audited in
earlier runs), the core **Champion** and **Runner-up** columns in
`content/copa-america.md` had never had a dedicated second-source pass of
their own; they had only been implicitly checked against the "Titles after
2024" per-team totals table (which is itself derived from the same editorial
source, not an independent check).

This run cross-checked all 49 editions (1916-2024) via WebSearch against each
edition's dedicated Wikipedia article, plus RSSSF, CONMEBOL's own recap
articles, or another independent outlet (ESPN, Bleacher Report, Fox Sports)
where available - the same WebSearch-snippet approach the 2026-08-04 run
established, since direct WebFetch to these hosts still returns HTTP 403 in
this environment. **Result: zero discrepancies.** Every Champion and
Runner-up value already in the table matched, including the five
level-on-points playoff deciders (1919, 1922, 1937, 1949, 1953), the two
1959 editions, the three home-and-away finals (1975, 1979, 1983), the two
closing-group editions (1989, 1991), and every penalty-shootout final (1995,
2015, 2016). See `docs/SOURCES.md`'s new "Champion/Runner-up audit" entry
under Copa América for the full per-edition citation list. Added a summary
note to `content/copa-america.md`'s "Important editorial warning" section
recording the audit (mirrors how the Format/third-fourth/Final-date audits
are each documented there) and bumped `lastReviewed` to 2026-08-05.

No code changes - this is a content-only verification pass, so `pnpm lint`,
the full Vitest suite, and the full Playwright suite are all unaffected
(unchanged from the 2026-08-04 run's 0 errors / 152/152 / 199/199).

**Left for a future pass:** the same Champion/Runner-up/Final-score audit for
UEFA EURO, FIFA World Cup, and UEFA Nations League - none of the three has
had this specific column pair independently cross-checked yet (their prior
audits covered third/fourth place, final dates, and the 2026 World Cup final
specifically, not the full historical Champion/Runner-up/Final-score
columns). UEFA Nations League is the smallest (4 completed editions) and the
natural next candidate. Correction to this note: Nations League's Winner/
Runner-up/Final score *had* already been checked once, in the 2026-08-04
"full results audit" entry above (against UEFA.com + ESPN) - this note should
have said "only one audit pass," not "none." The entry below closes that gap
with a second, independently-sourced pass.

### Content-accuracy pass: UEFA Nations League Champion/Runner-up/Final-score - second independent cross-check, no discrepancies

Added 2026-08-05 (intensive run). Nations League ranks above EURO and World
Cup in this routine's stated competition-priority order, and its own
Champion/Runner-up/Final-score data had already had exactly one audit pass
(2026-08-04, UEFA.com + ESPN) - the smallest gap of the three competitions
named in the note above, and the natural next candidate per that note.

This run re-verified all four completed editions (2018-19 through 2024-25) -
Winner, Runner-up, and Final score - via WebSearch, using a source pair
deliberately distinct from the 2026-08-04 pass: each edition's dedicated
Wikipedia final article plus one independent news outlet not used before
(CBS Sports for 2019, Al Jazeera for 2021, Sky Sports for 2023, Euronews for
2025 - ESPN was intentionally avoided as a repeat source for 2023 and 2025).
**No discrepancies found.** Every Winner, Runner-up, and Final score already
in `content/uefa-nations-league.md` matches both new sources exactly,
including both penalty-shootout finals (2023: Spain 5-4 pens after 0-0;
2025: Portugal 5-3 pens after 2-2).

`docs/SOURCES.md` gained a "Champion/Runner-up/Final-score second-source
audit" entry under UEFA Nations League. `lastReviewed` moved to 2026-08-05;
`status` stays `review` (secondary sources, same reasoning as every prior
secondary-sourced audit in this file). No content, code, or test changes
were needed since nothing was wrong. Verified with `pnpm lint` (0 errors/0
warnings, same pre-existing hint as every prior run) and the full Vitest/
Playwright suites, both unchanged from the prior run.

This closes UEFA Nations League's Champion/Runner-up/Final-score item with
two independent audit passes now on record (2026-08-04 and 2026-08-05).

**Left for a future pass:** the same Champion/Runner-up/Final-score audit -
first pass, not yet done once - for UEFA EURO (17 editions) and FIFA World
Cup (22 editions), the two remaining competitions from the note above. Both
are larger research tasks than Nations League's four editions; EURO is the
smaller of the two and the natural next candidate.

### Content-accuracy pass: UEFA EURO Champion/Runner-up/Final-score audit - no discrepancies

Added 2026-08-05 (intensive run). Closes the item the previous run's "Left
for a future pass" note called the natural next candidate: UEFA EURO's core
**Winner**, **Runner-up**, and **Final** (score line) columns had never had
a dedicated cross-check of their own, distinct from the existing final-date
(2026-08-02) and third-place-play-off (2026-08-04) audits already on record
for this competition.

This run cross-checked all 17 editions (1960-2024) via three parallel
WebSearch passes split by era (1960-1980, 1984-2004, 2008-2024), the same
era-split approach earlier Golden Boot and Ballon d'Or audits used, each
edition checked against at least two independent outlets (UEFA.com match
and history pages, Wikipedia final articles, RSSSF, ESPN, Sky Sports, BBC,
CNN, and others) rather than relying on training-data recall. **Result: zero
discrepancies.** Every Winner, Runner-up, and Final value already in
`content/uefa-euro.md` matched, including every non-regulation final on the
page: the 1960 and 2016 a.e.t. results, the 1968 final's 1-1 draw and
2-0 replay, the 1976 and 2020 penalty shoot-outs (with 1976's Panenka
chip specifically re-confirmed), and the 1996 and 2000 golden-goal
deciders. See `docs/SOURCES.md`'s new entry under UEFA EURO for the full
per-edition source list.

`content/uefa-euro.md`'s `lastReviewed` moved to 2026-08-05; `status` stays
`review` (secondary sources, same reasoning as every prior secondary-sourced
audit in this file). No content, code, or test changes were needed since
nothing was wrong.

This leaves FIFA World Cup (22 editions) as the only competition on the site
whose Champion/Runner-up/Final-score data has not yet had a dedicated audit
pass of its own - the natural next candidate, and the last item in this
particular audit series.

### Content-accuracy pass: FIFA World Cup Champion/Runner-up/Final-score audit - no discrepancies

Added 2026-08-05 (intensive run). Closes the last item in the
Champion/Runner-up/Final-score audit series named by the entry above: World
Cup was the only one of the site's four team competitions (Copa América,
Nations League, EURO already closed) whose core Winner/Runner-up/Final
columns had never had a dedicated cross-check of their own, distinct from
the existing final-date (2026-08-02), third/fourth-place (2026-08-04), and
2026-specific (2026-08-04) audits already on record for this competition.

- Verified all 21 completed editions (1930-2022; 2026 was already
  independently audited in the entry above) in `content/fifa-world-cup.md`
  via three parallel WebSearch research passes split by era (1930-1962,
  1966-1994, 1998-2022) - the same era-split approach the third/fourth-place
  audit used - each edition cross-checked against at least two independent
  sources (FIFA.com, ESPN's match archive, Wikipedia's dedicated final
  articles, BBC, CNN, CBS News, Britannica, and other outlets search
  surfaced).
- **No discrepancies found in any of the 21 editions.** Every extra-time and
  penalty-shootout final was specifically re-confirmed: 1934, 1966, and 1978
  (a.e.t., no penalties); 1994, 2006, and 2022 (penalty shoot-outs); 2010 and
  2014 (a.e.t.). 1950's unusual format (no single knockout final - the title
  was decided by the final round-robin group's last match, Uruguay 2-1
  Brazil, the *Maracanazo*) was reconfirmed as correctly represented,
  matching the page's existing "Editorial notes" text. One apparent conflict
  surfaced mid-audit - a single ESPN search-snippet title suggesting the
  1938 final was "2-1" - was resolved against five other independent sources
  that unanimously confirmed the authored 4-2 scoreline, so it was treated
  as a snippet/caching artifact rather than a genuine discrepancy.
- `docs/SOURCES.md` gained a "Champion/Runner-up/Final-score audit" entry
  under FIFA World Cup with the full per-era source list.
  `content/fifa-world-cup.md`'s `lastReviewed` moved to 2026-08-05; `status`
  stays `review` (unchanged) - secondary sources, not a single primary FIFA
  competition record, matching the same reasoning every earlier
  secondary-sourced audit in this file has given.
- No content, code, or test changes were needed since nothing was wrong -
  this is a clean audit-closed entry, the same shape as the Copa América,
  Nations League, and EURO closures in this same series. Verified with
  `pnpm lint` (0 errors/0 warnings, same pre-existing hint as every prior
  run) and the full Vitest/Playwright suites, both unchanged from the prior
  run (no code or test changes were needed), all still passing.

This closes the Champion/Runner-up/Final-score audit series across all four
team competitions (Copa América, Nations League, EURO, and now World Cup) -
every one has now had at least one independent cross-check of its core
result columns against outside sources.

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  still rest on single-source research.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- With every competition/award table's core result columns and every
  third/fourth-place column now independently audited at least once, and
  every required/nice-to-have feature from `docs/WEBSITE_REQUIREMENTS.md`
  and `AGENTS.md` already implemented, a future run should look for a
  second independent cross-check of the tables that have only had one audit
  pass so far, a fresh accessibility/performance angle (e.g. individual quiz
  question states, which sit outside the axe sweep's `NAV_LINKS` coverage),
  or another concrete content/quality gap - rather than assuming there is
  nothing left to verify.

### Accessibility: quiz interactive-state coverage, plus a real sticky-header bug it found

Added 2026-08-05 (intensive run). Closes the specific gap the previous entry's
"Left for a future pass" note named: the main axe sweep
(`tests/e2e/accessibility.spec.ts`) only ever visits each `NAV_LINKS` page in
its untouched initial DOM state, so it never audited the quiz page's
interactive states - answered choices (`is-correct`/`is-incorrect` classes,
the `aria-live` feedback text, disabled radios), the order-challenge's own
answered state, the expanded "just show me the answer" `<details>`, or the
post-restart state.

**New test file:** `tests/e2e/accessibility-quiz-states.spec.ts` drives the
quiz to two additional DOM states - "answered" (every choice card and order
card answered with a deliberate mix of correct/incorrect picks, every reveal
expanded) and "restarted-after-answering" - and runs the same axe WCAG
2.1 A/AA sweep as the main file against each, for both languages and both
color schemes (8 new tests). Each state assertion includes a sanity check
(e.g. an `is-incorrect` choice is actually visible) so a future markup
change that silently breaks the quiz script can't pass vacuously by auditing
a page that never actually reached the state its test name claims.

**Real bug found and fixed while building this.** Driving the "answered"
state (which requires scrolling through all ~20+ quiz cards) surfaced a
genuine, previously-undetected defect, not a test artifact: `.quiz__score`'s
sticky score/restart bar used a hardcoded `top: 3.6rem`, sized for a
single-line nav header. But `Nav.astro`'s eleven links plus the theme toggle
(and, on translated pages, the language switch) don't fit on one line even
at the page's own `--maxw` container width - the header actually wraps to
2-6 lines depending on viewport and locale, with a real height anywhere from
~188px (desktop) to ~300-700px (phone widths). Since the sticky header has a
higher z-index than the sticky score bar, once both are "stuck" during a
scroll, the header visually and functionally covers the *entire* score bar -
including the restart button - on effectively every viewport width tested
(360px, 1280px, 1920px), confirmed with `elementFromPoint` and a screenshot
before the fix (see this run's browser session). A mouse user could not
click "Restart quiz" at all once scrolled past the first question.

**Fix:** `Nav.astro` now measures its own real height with a `ResizeObserver`
(falling back to a `resize` listener) and exposes it as `--site-header-height`
on the document root; `quiz.astro`/`hr/quiz.astro`'s `.quiz__score` reads
`top: var(--site-header-height, 3.6rem)` instead of the hardcoded value
(3.6rem kept only as the no-JS fallback). The same wrap also meant
`scroll-into-view` targets (keyboard focus, anchor links, Playwright's own
actionability auto-scroll) could land underneath the sticky header
site-wide, not just on the quiz page - fixed generally by adding
`scroll-padding-top: var(--site-header-height, 3.6rem)` to `html` in
`global.css`. The quiz page has a *second* sticky bar stacked below the
header, so it additionally needs `--quiz-score-height` (set by
`QuizScript.astro` once the bar is shown) added into its own
`scroll-padding-top` via a small `<style is:global>` block scoped to
`html:has(#quiz-score)`.

Verified with `pnpm lint` (0 errors/0 warnings, same pre-existing hint as
every prior run), the full Vitest suite (152/152, unchanged), and the full
Playwright suite, now 207/207 (199 previous + 8 new) - confirmed passing
only after killing two stale `astro preview` processes left over from this
run's own manual browser reproduction, which Playwright's
`reuseExistingServer` option had silently reused instead of rebuilding
against; a future run hitting inexplicably-stale Playwright results should
check `ps aux` for a leftover preview server before assuming the code is
wrong.

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  still rest on single-source research.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- A second independent cross-check of the Champion/Runner-up/Final-score
  tables (closed on their first pass for all four team competitions) remains
  open as a "belt and suspenders" idea, per the previous entry's note.
- This run's fix was scoped to the one sticky-stacking bug the new quiz
  tests actually surfaced; a broader sweep for other sticky/z-index
  interactions elsewhere on the site (there don't appear to be any today -
  `TournamentTable.astro`'s sticky table header is the only other `position:
  sticky` user, and it's `top: 0` inside its own scroll container, not
  stacked under the site header) has not been done and would need a reason
  to suspect one exists before spending time on it.

### Accessibility: quiz answer-state color contrast, use-of-color, and a hidden localization gap

Added 2026-08-05 (intensive run). The previous entry's new
`tests/e2e/accessibility-quiz-states.spec.ts` sweep already ran axe against
the quiz's answered state and passed 8/8 - but a manual WCAG contrast
calculation on the "wrong answer" styling (`is-incorrect`, hardcoded
`#c0392b`) found two real failures axe's automated color-contrast rule never
flagged: axe's rule operates on real DOM text nodes and this indicator's
"✓ correct" / "✗ your answer" wording lived entirely in CSS `::after`
generated content, which axe-core (like most screen readers) does not
reliably read - so the check never ran against it at all, on any page state,
in either commit. Confirmed by hand: `#c0392b` as text against its own
16%-mixed background tint measures ~4.27:1 in light mode (just under the
4.5:1 AA minimum for normal-weight text) and ~2.65:1 in dark mode (a major
failure, not a marginal one - the mixed-in dark background pulls luminance
down further than the light theme's white-based one does).

**Fixed in three parts, all in `QuizCard.astro`, `QuizOrderCard.astro`,
`QuizScript.astro`, `src/lib/i18n.ts`, and `global.css`:**

1. **Real DOM text instead of CSS-generated content.** Both
   `is-correct`/`is-incorrect` indicators now render as an actual
   `<span class="quiz-card__result-badge">`, populated by
   `QuizScript.astro` when a question is checked (and cleared on restart) -
   not just for contrast-checkability, but because generated content isn't
   part of the accessible name/description of an element in every
   AT/browser combination, so relying on it to convey "correct"/"incorrect"
   was itself a fragile pattern independent of the color issue.
2. **A theme-tuned `--danger` token.** `global.css` gained `--danger:
   #b3261e` (light) / `#ff7b72` (dark) alongside the existing `--accent`
   pair, replacing every hardcoded `#c0392b`. Both new values were chosen by
   computing the same "danger color as text over its own 16%-mixed
   background" contrast the bug used and confirming ≥4.5:1 in both themes
   (light ≈5.0:1, dark ≈4.95:1) - documented inline in `global.css` so a
   future edit doesn't casually swap in a prettier-looking red that fails
   again.
3. **Use-of-color fix on the order-challenge cards (WCAG 1.4.1), found
   along the way.** `QuizOrderCard.astro`'s `is-correct`/`is-incorrect`
   items had no text equivalent at all before this run - only a
   border/background color change - unlike the multiple-choice cards, which
   at least had (contrast-failing) `::after` text. They now get the same
   real-DOM result badge as the choice cards.
4. **Incidental localization fix.** The multiple-choice `::after` text was
   hardcoded English ("✓ correct" / "✗ your answer") in component-scoped
   CSS, so it rendered in English even on `/hr/quiz` despite every other
   piece of quiz chrome being translated. Moving to real DOM text populated
   from new `quizAnswerCorrectLabel` / `quizAnswerIncorrectLabel` /
   `quizOrderResultCorrectLabel` / `quizOrderResultIncorrectLabel` keys in
   `src/lib/i18n.ts` (English and Croatian) fixed this as a side effect of
   the accessibility fix, not a separate change.

No new test file was needed - `accessibility-quiz-states.spec.ts`'s existing
8 tests already assert an `is-correct` and an `is-incorrect` element are
visible in the answered state and run the full axe sweep (which includes
`color-contrast`) against it; they now exercise real text nodes instead of
generated content, so this is the first time that assertion has actually
been meaningful. Verified with `pnpm lint` (0 errors/0 warnings, same
pre-existing hint), the full Vitest suite (152/152, unchanged), and the
full Playwright suite (207/207, unchanged pass count - this was a fix to
what the suite was checking, not new coverage).

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  still rest on single-source research.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- A second independent cross-check of the Champion/Runner-up/Final-score
  tables (closed on their first pass for all four team competitions) remains
  open as a "belt and suspenders" idea.
- This run's discovery process (hand-computing contrast for a color axe
  couldn't check) suggests it may be worth a future pass specifically
  auditing the site for other meaningful `::before`/`::after` generated
  content that neither axe nor a screen reader would reliably surface - a
  quick grep of `content:` declarations across `src/**/*.astro` found only
  this one non-decorative case, but that grep was not exhaustive of every
  component's scoped `<style>` block.

### Accessibility: mobile-card column labels weren't reliably exposed to assistive tech

Added 2026-08-06 (intensive run). Follows up on the previous entry's own
"Left for a future pass" note by doing the fuller `content:` grep it flagged
as not-yet-exhaustive. It found exactly one more non-decorative case, and a
much higher-blast-radius one: `TournamentTable.astro`'s responsive mobile
card layout (`@media (max-width: 40rem)`, i.e. every phone-width visitor)
labels each value with its column name (Year, Winner, Host, Teams, etc.)
purely via `.t-table td::before { content: attr(data-label); }`. This is the
exact same category of bug as the quiz "wrong answer" indicator fixed two
entries above - CSS generated content isn't reliably exposed to assistive
tech - except `TournamentTable` is the single most shared component in the
codebase (every one of the six competition/award pages, in both English and
Croatian, all render their entire results table through it on mobile). A
screen reader user on a phone hitting any tournament table would have heard
only the raw values row by row ("1930", "Uruguay", "Argentina", "4-2") with
no reliable way to tell which value was the year, the winner, or the score -
the mobile-card layout's whole reason for existing (labeling values once the
table no longer visually reads left-to-right by column) silently didn't
reach assistive tech at all. Confirmed the failure mode by hand: Chromium's
accessibility tree (inspected via CDP) omits `::before`/`::after` generated
text from any accessible-name/description computation for a plain `<td>`,
matching the same root cause already written up for the quiz bug.

**Fix:** each `<td>` in `TournamentTable.astro` now also carries a real
`aria-label` (e.g. `aria-label="Winner: Uruguay"`), built server-side from
the exact same `data-label`/value pair the CSS `::before` already displays
visually - so the visible mobile-card styling is completely unchanged (the
`::before` rule stays, now commented as visual-only) while assistive tech
gets a reliable, always-present accessible name regardless of viewport,
browser, or whether that browser happens to expose generated content. This
covers both the per-column table cells and the joined-in Golden Boot
"Top scorer" `extraColumn` cell on the World Cup/EURO pages. Deliberately
not scoped to the mobile media query - the label is harmless, mildly
reinforcing context at desktop widths too, and CSS can't conditionally add
or remove an ARIA attribute by viewport anyway.

No new test file was needed: the existing full Playwright suite (207 tests,
unchanged pass count) already exercises `TournamentTable` on every page
including the WCAG 2.1 A/AA axe sweep, and none of the existing
`td[data-label="..."]` assertions (`tests/e2e/mobile.spec.ts`) check
`aria-label`, so they were unaffected by adding it - `toHaveText`/
`toContainText` read visible text content, not the accessible name. Verified
with `pnpm lint` (0 errors/0 warnings, same pre-existing hint), the full
Vitest suite (152/152, unchanged - no library code changed), and the full
Playwright suite (207/207).

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  still rest on single-source research.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- A second independent cross-check of the Champion/Runner-up/Final-score
  tables (closed on their first pass for all four team competitions) remains
  open as a "belt and suspenders" idea.
- The `content:` grep run for this entry is now exhaustive across
  `src/**/*.astro` (all `<style>` blocks, scoped and global) and found no
  further non-decorative generated-content cases - the two found across
  both entries in this series (quiz's correct/incorrect indicator, and this
  table column label) both had real fixes shipped, so this specific angle is
  believed closed pending any newly written component introducing a new
  `content:` rule in future.

### Accessibility: `/compare`'s head-to-head panel updated silently for screen-reader users

Added 2026-08-06 (intensive run, later slice). Continues the same "sweep
interactive client-JS states the main axe pass never reaches" series as the
two quiz-state entries and the mobile table-label entry above - this time
against `/compare`, the one other page on the site whose client script
rewrites page content in place after load (`src/pages/compare.astro` and
`src/pages/hr/compare.astro`).

- Picking a different team in the "Team A"/"Team B" `<select>`s, or clicking
  "Swap", rewrites the head-to-head panel's `<h3>` name and every stat cell
  via `textContent` - but nothing in either page announced that change to a
  screen-reader user. A sighted user sees the new numbers appear instantly;
  a keyboard/screen-reader user's focus stays on the `<select>` they just
  changed, so without an `aria-live` region there was no way to know the
  panel below had actually updated - the exact same silent-DOM-update shape
  that motivated the quiz interactive-state fixes two entries above, just on
  a page that series hadn't reached yet.
- **Fix:** both pages gain a `role="status" aria-live="polite"` paragraph
  (`#compare-status`, visually hidden - the panel's own heading already
  shows the same information visually, so a duplicate visible line would
  just be redundant noise for sighted users) that announces
  "Comparing {A} vs {B}." (English) / "Usporedba: {A} protiv {B}." (Croatian)
  whenever `render()` runs - on team reselection, on Swap, and on the
  initial URL-param restore. Mirrors the exact pattern
  `TournamentTable.astro`'s existing `#…-status` filter region already uses
  in production: a server-rendered initial value plus an unconditional
  `textContent` update inside the same function that already redraws the
  rest of the state, driven by a `data-template` attribute (`{a}`/`{b}`
  placeholders) so the client script - which is `is:inline` and can't
  `import t()` - still gets the correctly localized wording per page,
  the same data-attribute trick `ThemeToggle.astro` and `TournamentTable`
  already use for their own client-only strings.
- New `tests/e2e/accessibility-compare-states.spec.ts` (8 new Playwright
  cases: English/Croatian x light/dark, re-selecting Team A and clicking
  Swap) runs the same WCAG 2.1 A/AA axe sweep the quiz-states file runs
  against each resulting DOM state, plus a functional assertion that
  `#compare-status`'s text actually changes and the visible heading matches
  the newly selected team - so a future regression that silently breaks the
  live-region update (or the swap/reselect logic itself) fails a real
  assertion, not just an unchanged axe pass.
- Verified with `pnpm lint` (0 errors/0 warnings, same pre-existing hint),
  the full Vitest suite (152/152, unchanged - no library code changed), and
  the full Playwright suite (215/215, up from 207).

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  still rest on single-source research.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- A second independent cross-check of the Champion/Runner-up/Final-score
  tables (closed on their first pass for all four team competitions) remains
  open as a "belt and suspenders" idea.
- The interactive-state accessibility angle (quiz, mobile table labels, and
  now `/compare`) has now covered every page on the site with a client
  script that rewrites content after load - a future pass should look for a
  different quality angle (e.g. the second cross-check above) rather than
  assuming there's a third page in this specific series.

### Bug fix: the primary nav (and the offline cache) silently dropped Croatian readers back into English

Added 2026-08-06 (intensive run). Every backlog item and nice-to-have from
`docs/WEBSITE_REQUIREMENTS.md`/`AGENTS.md` was already complete going into
this run (per the previous entry's own note), so this is the "genuinely
useful quality pass" fallback - a real, previously-undetected bug, found by
re-reading `src/components/Nav.astro` and `src/lib/offlineCache.ts` end to
end rather than assuming the localization rollout (11 nav pages, both
languages, per earlier entries) was airtight just because every individual
page had been translated.

**The bug:** `Nav.astro` built every primary nav link - and the logo/brand
link - from `NAV_LINKS` (`src/lib/routes.ts`) using each link's plain
English `path`, with no branch on the `locale` prop it already receives.
`src/lib/i18n.ts`'s `TRANSLATED_PATHS` (the same map the sitemap and every
page's language-switcher link already use) was never consulted here. The
practical effect: a reader on any of the ten Croatian pages
(`/hr/competitions/world-cup`, `/hr/quiz`, `/hr/records`, ...) saw the page
itself correctly in Croatian, but clicking *any* nav item other than the
explicit "English"/"Hrvatski" language switch - including the site logo -
silently took them back to the English version of that section. A Croatian
reader could never actually browse the site in Croatian past the first page
they landed on. This is the same class of bug as the earlier sticky-header
and generated-content accessibility fixes in this file: a real, user-facing
defect that every per-page Playwright test missed because each test only
ever visits one Croatian page directly by URL and never clicks through the
nav to a second one.
The offline service worker (`src/pages/sw.js.ts`, built from
`buildPrecacheUrls()` in `src/lib/offlineCache.ts`) had the matching gap:
`buildPrecacheUrls()` only ever read `NAV_LINKS`' English paths, so none of
the ten Croatian pages were precached on install - a Croatian reader got no
"already works offline" guarantee at all unless they had individually
visited each hr page online first - and the navigate handler's offline
fallback was hardcoded to `precacheUrls[0]` (the English home page), so an
offline Croatian reader hitting an uncached URL was bounced to an English
page even when a perfectly good cached Croatian home page existed.

**Fix, three parts:**
1. **`src/lib/routes.ts`**: `NavLink` gained a `labelHr` field, one short
   Croatian nav label per entry, reusing exactly the display names already
   established elsewhere (`src/lib/homeCards.ts`'s `CARD_TEXT` for the six
   competitions/awards, e.g. "Zlatna lopta", "Liga nacija"; each hr page's
   own heading for the rest, shortened the same way the English label is
   already a short form of the full page title, e.g. "Rekordi", "Kviz",
   "Izvori", "Usporedba", "Početna" for Home) - not new wording invented for
   this fix.
2. **`src/components/Nav.astro`**: the nav-link list and the brand/logo href
   now branch on `locale`, mapping each `NAV_LINKS` path through
   `TRANSLATED_PATHS` (and label through `labelHr`) when `locale === 'hr'` -
   the exact same source of truth the sitemap and the language switcher
   already trusted, so this can't drift out of sync with either. English
   pages render byte-identical nav markup to before this fix (verified via
   the build output).
3. **`src/lib/offlineCache.ts`**/**`src/pages/sw.js.ts`**: `buildPrecacheUrls()`
   now emits both language's URL for every `NAV_LINKS` path (28 precached
   URLs total, up from 17), and the generated service worker's offline
   navigate-fallback picks between a Croatian and an English cached home URL
   based on whether the failed request's own path falls under `/hr/`,
   instead of always falling back to English. `withBasePath()` was extracted
   as its own exported helper (previously an unexported closure inside
   `buildPrecacheUrls`) so `sw.js.ts` can derive the Croatian home URL
   without re-deriving the same base-path logic twice. `CACHE_VERSION`
   bumped to `v2` so returning visitors' browsers evict the old
   English-only precache instead of keeping it forever.

**Tests:** 2 new Vitest cases in `tests/unit/routes.test.ts` (every
`labelHr` is non-empty and unique), 3 new cases in
`tests/unit/offlineCache.test.ts` (every Croatian nav page is precached,
every `NAV_LINKS` path has a `TRANSLATED_PATHS` entry, and the new
`withBasePath` export - the doubled-precache-count assertion updates an
existing case rather than adding a new one), and 4 new Playwright cases in
`tests/e2e/mobile.spec.ts`: a "Primary nav stays in the current language"
block asserting every nav href (English and Croatian) matches its own
language and that clicking a translated nav item actually lands on and
stays on the Croatian equivalent page; and two additions to the existing
"Installability and offline reading" block - an hr page that was never
individually visited still renders offline (proves the precache fix) and an
uncached hr URL falls back to the cached Croatian home page rather than the
English one (proves the fallback fix). Verified with `pnpm lint` (0
errors/0 warnings, same pre-existing hint as every prior run), the full
Vitest suite (157/157, up from 152), and the full Playwright suite
(219/219, up from 215).

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  were already re-confirmed with a genuine second source as of the
  2026-08-04 slice - this repeated note across several earlier entries in
  this file was stale by the time it was last copied forward; there is no
  known open ceremony-date sourcing gap today.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- A second independent cross-check of the Champion/Runner-up/Final-score
  tables (closed on their first pass for all four team competitions) remains
  open as a "belt and suspenders" idea.
- This fix closes the specific "nav points to the wrong language" bug found
  by re-reading the shared chrome components; a future pass could do the
  same close read of another still-unaudited shared component (e.g.
  `ThemeToggle.astro`, `PrintDownloadLink.astro`) rather than assuming this
  was the only one, though a quick check while fixing this one found no
  equivalent path/label mismatch in either.

### Accessibility/localization: champions-bar's screen-reader label was English on every Croatian page

Added 2026-08-06 (intensive run). Continues the "close read of another
still-unaudited shared component" idea the previous entry's own "Left for a
future pass" note suggested, this time against `ChampionsSummary.astro` - the
component behind every "Champions by titles" / "Most awards" ranking on the
site (every one of the six competition/award pages, `/records`, in both
languages).

**The bug:** each ranking bar's `role="img"` `aria-label` was built as a
template literal with a hardcoded English word - `` `${champion.titles} of
${max}` `` - with no branch on locale and no overridable prop, unlike every
other piece of copy in this component (`heading`, `description`, `unit`,
`winningYearsLabel` are all already overridable, and every Croatian page that
renders this component already overrides them with Croatian text). The
practical effect: a screen-reader user on any of the nine `ChampionsSummary`
instances across the seven Croatian pages
(`/hr/records` x2, and all six `/hr/competitions/*`) heard an English
fragment - e.g. "5 of 23" - stitched into an otherwise fully Croatian
ranking list, the same "one hardcoded English string slipped through a
component whose other strings were all translated" shape as the primary-nav
bug fixed earlier today, just in a different component.

**Fix:** `ChampionsSummary.astro` gained an optional `ofLabel` prop (default
`'of'`, so every English page - `CompetitionView`-driven pages and the
English `/records` page - renders byte-identical output). A new
`championsBarOfLabel` key was added to `src/lib/i18n.ts`'s `UI_STRINGS`
(`'of'`/`'od'`) for consistency with the dictionary, though the nine Croatian
call sites pass the literal `ofLabel="od"` directly, matching the existing
convention every one of them already uses for `winningYearsLabel` and the
`description`/`heading` text (hand-written Croatian strings inline in the
page, not routed through `t()`, since these pages compose their own layout
by hand rather than importing the shared dictionary for per-instance props).

**Tests:** 1 new Vitest case (`tests/unit/i18n.test.ts`, asserting
`championsBarOfLabel` is `'of'`/`'od'` and differs per locale) and 1 new
Playwright case in the existing Croatian records-page describe block
(`tests/e2e/mobile.spec.ts`: asserts a champions-bar `aria-label` matches
`/^\d+ od \d+$/` and never contains the English `" of "`) - covers the
shared component, so the fix is verified once rather than once per page it
appears on, matching how the earlier `TournamentTable` mobile-label fix was
tested. Verified with `pnpm lint` (0 errors/0 warnings, same pre-existing
hint as every prior run), the full Vitest suite (158/158, up from 157), and
the full Playwright suite (220/220, up from 219). Also spot-checked the
built `dist/hr/records/index.html` and every `dist/hr/competitions/*`
directly: no remaining `aria-label="… of …"` fragment anywhere under `dist/hr/`.

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  were already re-confirmed with a genuine second source as of the
  2026-08-04 slice - no known open ceremony-date sourcing gap today.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- A second independent cross-check of the Champion/Runner-up/Final-score
  tables (closed on their first pass for all four team competitions) remains
  open as a "belt and suspenders" idea.
- The "close read of an unaudited shared component" angle has now found and
  fixed two real bugs in two different components today (`Nav.astro`/
  `offlineCache.ts`'s locale-blind nav links, and now `ChampionsSummary`'s
  hardcoded English bar label) - a future pass could do the same close read
  of the remaining shared components not yet covered by name in this file
  (`CompetitionView.astro`, `PrintDownloadLink.astro` was already checked
  and found clean, `QuizCard.astro`/`QuizOrderCard.astro`/`QuizScript.astro`
  already went through the dedicated quiz-localization pass) rather than
  assuming this specific bug class is now fully closed.

### Bug fix: two downloadable PDFs were stale relative to their own source tables

Added 2026-08-06 (intensive run, later slice). Every backlog item and every
UI/localization bug found by this routine's earlier close-reads was already
closed going into this run, so this is another "genuinely useful quality
pass" fallback - found by checking, for the first time, whether the
generated `public/downloads/*.pdf` files (added 2026-07-31, regenerated
manually via `pnpm build:pdfs` whenever a content-accuracy pass changes an
Editions table, per `docs/ADDING_CONTENT.md` section 8) actually still
matched their source content, rather than assuming every prior run remembered
to rerun the regeneration step.

**The bug:** they hadn't. `git log` on `public/downloads/` showed the PDFs
were last regenerated at 2026-08-04 16:59 UTC (the Golden Boot audit run),
but `content/fifa-world-cup.md` and `content/ballon-dor.md` were both edited
*after* that, at 2026-08-04 21:04 UTC, by the very next run - fixing the 2026
World Cup final's missing "(a.e.t.)" marker on its score. That fix reached
the live HTML page immediately (it's read at build time), but
`public/downloads/world-cup.pdf` is a committed static snapshot, so it kept
showing the pre-fix score ("Spain 1–0 Argentina", no extra-time marker) for
two days across two merged PRs (#33, #34) - the exact "silently goes stale"
failure mode `docs/ADDING_CONTENT.md` section 8 exists to prevent, missed
because no run had actually checked PDF-vs-content freshness before.
The other 2026-08-05 content commits (Copa América/EURO/Nations
League/World Cup Champion-Runner-up-Final-score audits) turned out to be
`lastReviewed`-date-only edits with no discrepancies found, so their PDFs
were still byte-accurate on data - only the two 08-04 files were genuinely
wrong.

**Fix:** regenerated all six PDFs via `PW_EXECUTABLE_PATH=<preinstalled
Chromium> pnpm build:pdfs` (the documented command assumes a plain
`chromium` binary path; this environment's pre-installed Chromium lives one
level deeper, so the override was needed - noted here in case a future run
hits the same path mismatch). Confirmed the fix landed by diffing the built
HTML the PDF step screenshots (`dist/competitions/world-cup/index.html` now
contains "Spain 1–0 Argentina (a.e.t.)") and checking each PDF's file size
changed. Five of the six PDFs also picked up the 2026-08-05
Champion/Runner-up/Final-score audits' `lastReviewed` footer date and the
2026-08-04 Ballon d'Or ceremony-date sourcing-note expansion in the process
(ballon-dor.pdf's byte size is unchanged since that content isn't on the
printed page itself - only the References section's `lastReviewed` line,
already bumped to 08-04 before the last regen). No test changes needed - the
existing PDF-link Playwright cases only assert the link/content-type, not
PDF byte content, so this was a manual verification, same as every prior PDF
regeneration in this file's history.

**Second fix, closes an explicitly-flagged gap:** the 2026-08-03 run that
added the `/awards/ballon-dor` and `/awards/golden-boot` redirects (for
`docs/WEBSITE_REQUIREMENTS.md`'s "Required pages" list) had explicitly left
"Croatian equivalents" for a future pass, since the requirements doc predates
localization. Added `/hr/awards/ballon-dor` -> `/hr/competitions/ballon-dor`
and `/hr/awards/golden-boot` -> `/hr/competitions/golden-boot` to
`astro.config.mjs`'s `redirects` map, same base-path-prefixing the English
redirects already need (confirmed via the built
`dist/hr/awards/ballon-dor/index.html` meta refresh target). 3 new Playwright
cases in the existing "Required-page redirects" describe block (mirroring the
3 English ones): both Croatian redirects land on the real page's `<h1>`, and
noindex/base-path assertions for the Croatian redirect page.

**Tests:** full Vitest suite unchanged (158/158 - no library code touched)
and the full Playwright suite, now 223/223 (up from 220, the 3 new redirect
cases). `pnpm lint` clean (0 errors/0 warnings, same pre-existing hint as
every prior run).

**Left for a future pass:**
- The same handful of Ballon d'Or ceremony dates noted in earlier slices
  were already re-confirmed with a genuine second source as of the
  2026-08-04 slice - no known open ceremony-date sourcing gap today.
- A full source-link liveness check across `docs/SOURCES.md` remains
  infeasible in this environment (WebFetch 403s on every host tried), per
  prior runs' notes.
- This run adds "PDF freshness vs. source content" to the list of things a
  future run should spot-check after any content-accuracy pass, alongside
  the existing `docs/ADDING_CONTENT.md` section 8 instruction - a
  lightweight `git log` comparison between `public/downloads/*.pdf` and the
  six `content/*.md` files (the check this run did by hand) would be a
  reasonable thing to script if this class of staleness recurs.

### Automated PDF-freshness check - added 2026-08-06 (intensive run)

Every backlog item and every previously-flagged bug was already closed going
into this run - the entire `docs/WEBSITE_REQUIREMENTS.md` "Required
capabilities" list, all six competition/award pages in both languages, and
every quality-pass audit logged above. Per this routine's fallback
instruction, this is another quality pass: it scripts the exact gap the
previous run ("Bug fix: two downloadable PDFs were stale relative to their
own source tables", above) explicitly flagged as worth automating, rather
than leaving PDF freshness as a manual `git log` check nobody is guaranteed
to remember to run before every merge.

That prior entry's own suggestion - diffing `git log` timestamps between
`public/downloads/*.pdf` and `content/*.md` - turns out to have a real flaw:
`.github/workflows/ci.yml`'s `actions/checkout@v4` step uses the default
shallow clone (fetch depth 1), so `git log` on a path in CI only ever sees
whichever single commit happens to be in that shallow slice - it would give
a false "fresh" or false "stale" answer depending on what that commit
happened to touch, not a real answer. Content hashing sidesteps this
entirely and works identically locally and in CI.

- **`scripts/check-pdf-freshness.mjs`** (new): hashes (SHA-256) each of the
  content files a PDF depends on and compares against
  `public/downloads/.pdf-manifest.json`, a manifest recorded the last time
  `pnpm build:pdfs` ran. Reports exactly which PDF(s) are stale and which
  source file changed, and exits non-zero. World Cup and EURO's PDFs depend
  on *two* content files each (their own table plus `content/golden-boot.md`,
  joined in as the "Top scorer" column per the earlier "tournament-level
  best scorer facts" entry above) - missing that second dependency would have
  silently under-detected staleness, so it's covered explicitly.
- **`scripts/generate-pdfs.mjs`**: now writes `.pdf-manifest.json` after
  generating the six PDFs, hashing the same content file(s) it just rendered
  onto each page (kept in sync by hand with `check-pdf-freshness.mjs`'s
  source list, since both need the identical Golden Boot join dependency for
  World Cup/EURO).
- **`.github/workflows/ci.yml`**: new "PDF freshness check" step (`pnpm
  check:pdfs`) runs right after unit tests, before the Playwright browser
  install - it needs no browser and completes in well under a second, so it
  catches a forgotten PDF regeneration on every pull request instead of
  only when someone happens to check by hand (as the previous run did, the
  first time in this project's history anyone had).
- **`docs/ADDING_CONTENT.md`** section 8: now tells an editor that CI backs
  up the manual regeneration reminder with this check.
- Regenerated all six PDFs and the new manifest via `PW_EXECUTABLE_PATH=
  <preinstalled Chromium> pnpm build && pnpm build:pdfs` (same environment
  path override the previous run noted) so the manifest reflects the
  already-current content confirmed fresh by that run; `pnpm check:pdfs`
  passes cleanly against it. Manually verified the check actually catches
  staleness by appending a line to `content/copa-america.md`, confirming
  `pnpm check:pdfs` reported exactly that one PDF as stale with the right
  file name, then reverting the edit and re-confirming a clean pass.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (158/158) and `pnpm lint` is clean (0 errors/0 warnings, same
pre-existing `monthNames` hint every prior run has logged). These two new
Node scripts have no Playwright coverage of their own (there's no page to
smoke-test) - correctness was verified by hand as described above, the same
way the original PDF generation script's correctness has always been spot
checked rather than unit tested.

**Left for a future pass:**
- The manifest is a plain JSON file, not enforced by any schema/type - if
  `PDF_SOURCES` in `check-pdf-freshness.mjs` and `PAGES[].sources` in
  `generate-pdfs.mjs` ever drift apart by hand-editing only one of them, the
  check could pass or fail incorrectly. They're small and rarely touched
  (new competition pages are the only thing that changes them), so a shared
  constants module felt like premature abstraction for two four-line lists,
  but a future run adding a seventh competition/award page should double
  check both stay in sync.
- Source-link liveness and Ballon d'Or ceremony-date sourcing remain as
  noted in the entry above - no change this run.

### Content-accuracy pass: UEFA EURO Champion/Runner-up/Final-score - second independent cross-check, no discrepancies

Added 2026-08-07 (intensive run). Every backlog item, every required and
nice-to-have capability from `docs/WEBSITE_REQUIREMENTS.md`, and every
previously-flagged bug were already closed going into this run - so, per
this routine's fallback instruction, this continues the "second independent
cross-check" series the 2026-08-05 UEFA Nations League entry started: of the
four team competitions, only Nations League had a genuine second-source pass
on its core Winner/Runner-up/Final-score data; Copa América, EURO, and FIFA
World Cup each had exactly one. EURO (17 editions) is the smaller of the two
remaining candidates (World Cup has 22), so it's the natural next one.

Re-verified all 17 editions (1960-2024) via three parallel WebSearch passes
(1960-1980, 1984-2004, 2008-2024), deliberately drawing from a source mix
distinct from the 2026-08-05 pass (which leaned on UEFA.com, Wikipedia,
RSSSF, ESPN, Sky Sports, BBC, and CNN): this pass mainly used CNN's original
match report, Bleacher Report, Al Jazeera, CBS Sports, Olympics.com, NBC
News, Gulf News, RFE/RL, Taipei Times, and independent retrospectives
(thesefootballtimes.co, the Irish Times, FIFA.com's own recap of the 1992
final). **No discrepancies found.** Every Winner, Runner-up, and Final value
already in `content/uefa-euro.md` matches both audit passes now, including
every non-regulation final: the 1960 and 2016 a.e.t. results, the 1968
replay (drawn 1-1, replay won 2-0), the 1976 and 2020 penalty shoot-outs,
and the 1996 and 2000 golden-goal deciders.

See `docs/SOURCES.md`'s new "Champion/Runner-up/Final-score second-source
audit" entry under UEFA EURO for the full per-edition citation list.
`content/uefa-euro.md`'s `lastReviewed` moved to 2026-08-07; `status` stays
`review` (secondary sources, same reasoning as every prior secondary-sourced
audit in this file). No content or code changes were needed since nothing
was wrong - the only file changes are the `lastReviewed` bump, the new
source citations, and this entry.

Bumping `lastReviewed` did change `content/uefa-euro.md`'s SHA-256, which
`pnpm check:pdfs` (added 2026-08-06) correctly flagged as making
`public/downloads/euro.pdf` stale - a live demonstration of that check doing
its job on real content churn, not just the synthetic edit-and-revert test
from its own introduction. Regenerated all six PDFs and the manifest via
`PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`; `pnpm
check:pdfs` now passes cleanly.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (158/158) and `pnpm lint` is clean (0 errors/0 warnings, same
pre-existing `monthNames` hint every prior run has logged). The full
Playwright suite (223/223) also passes unchanged - a `lastReviewed` date
bump has no assertion anywhere in the suite for this page (only the World
Cup page's mobile spec pins an exact `lastReviewed` date via
`time[datetime="..."]`, and that page's own date - and its PDF - are
untouched by this run).

**Left for a future pass:**
- The same second independent cross-check for FIFA World Cup (22 editions,
  the last of the four team competitions still on a single audit pass) is
  the natural next candidate in this series.
- The manifest schema-enforcement, source-link liveness, and Ballon d'Or
  ceremony-date items noted in the entry above are unchanged this run.

### Content-accuracy pass: Copa América Champion/Runner-up - second independent cross-check, no discrepancies

Added 2026-08-07 (intensive run, later slice). Every backlog item and every
required/nice-to-have capability from `docs/WEBSITE_REQUIREMENTS.md` was
already closed going into this run, so per this routine's fallback
instruction this continues the "second independent cross-check" series -
and per this routine's own stated priority order (Copa América > Nations
League > Ballon d'Or > Golden Boot), Copa América comes first among the two
team competitions still on a single audit pass (the previous entry's "Left
for a future pass" note named only FIFA World Cup, overlooking that Copa
América itself hadn't had a second pass yet either - corrected here).

Re-verified all 48 editions (1916-2024) via three parallel research passes
(1916-1949, 1953-1991, 1993-2024), deliberately drawing from a source mix
distinct from the 2026-08-05 first pass (which leaned on Wikipedia, RSSSF,
and CONMEBOL's own recaps): this pass used national-federation histories
(AFA, AUF), sports-history/statistics sites (worldfootball.net,
footballdatabase.eu, athlet.org, topendsports.com, 11v11.com, todor66.com,
bolavip.com), and independent press (El Gráfico, La Nación, El Economista,
UPI, Washington Post, ESPN, CNN, BBC, Al Jazeera, Fox News, Bleacher Report,
Sky Sports, and others). **No discrepancies found** across any of the 48
editions, including all five level-on-points playoff deciders (1919, 1922,
1937, 1949, 1953) and all three penalty-shootout finals (1995, 2015, 2016).
In the course of this pass, one of the sub-agents also noticed the site's
own prose mis-stated the edition count as "49" in two places (the table has
48 rows: two separate 1959 editions, one each in Argentina and Ecuador,
already correctly listed as distinct rows) - corrected the count in
`content/copa-america.md`'s audit paragraph while touching that file anyway;
left the historical 2026-08-05 changelog entry above as-written since this
file is an append-only record of what each run did and believed at the time.

See `docs/SOURCES.md`'s expanded Copa América section for the full
per-edition citation list. `content/copa-america.md`'s `lastReviewed` moved
to 2026-08-07; `status` stays `review` (secondary sources, same reasoning as
every prior secondary-sourced audit in this file). No table data changed -
the only file changes are the `lastReviewed` bump, the corrected edition
count, the new source citations, and this entry.

Bumping `lastReviewed` changed `content/copa-america.md`'s SHA-256, which
`pnpm check:pdfs` (added 2026-08-06) correctly flagged as making
`public/downloads/copa-america.pdf` stale. Regenerated all six PDFs and the
manifest via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`;
`pnpm check:pdfs` now passes cleanly.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (158/158) and `pnpm lint` is clean (0 errors/0 warnings, same
pre-existing `monthNames` hint every prior run has logged). The full
Playwright suite (223/223) also passes unchanged - a `lastReviewed` date
bump and a prose word-count edit have no assertion anywhere in the suite for
this page.

**Left for a future pass:**
- FIFA World Cup (22 editions) is now the last of the four team competitions
  still on a single Champion/Runner-up/Final-score audit pass - the natural
  next candidate in this series.
- The manifest schema-enforcement, source-link liveness, and Ballon d'Or
  ceremony-date items noted in earlier entries are unchanged this run.

### Content-accuracy pass: FIFA World Cup Champion/Runner-up/Final-score - second independent cross-check, no discrepancies

Added 2026-08-07 (intensive run, later slice). Every backlog item and every
required/nice-to-have capability from `docs/WEBSITE_REQUIREMENTS.md` was
already closed going into this run, so per this routine's fallback
instruction this continues the "second independent cross-check" series. The
two entries immediately above (UEFA EURO and Copa América, both 2026-08-07)
each closed their own second pass; FIFA World Cup was the one team
competition still on a single audit pass (its first pass, 2026-08-05, is
recorded above and explicitly named itself "the last of the site's four team
competitions to get this specific column-pair check" - closing that first
pass is exactly what makes this second pass the correct next move now, per
the same reasoning the EURO and Copa América second passes used).

Re-verified all 21 completed editions (1930-2022; 2026 is the site's own
forward-looking scheduled entry, out of scope for a factual audit) via three
parallel WebSearch passes split by era (1930-1962, 1966-1994, 1998-2022),
deliberately drawing from a source mix distinct from the 2026-08-05 first
pass (which leaned on FIFA.com, ESPN's match archive, Wikipedia's dedicated
final articles, BBC, and CNN): this pass mainly used RSSSF, Britannica,
worldfootball.net, Transfermarkt, 11v11.com, Sky Sports, BBC Sport, CBS
Sports, Bleacher Report, athlet.org, footballhistory.org, planetworldcup.com,
national-football-teams.com, EBSCO Research Starters, UPI's wire archives,
TheFA.com, englandstats.com, and beIN Sports. **No discrepancies found**
across any of the 21 editions, including every extra-time and
penalty-shootout final (1934, 1966, 1978 a.e.t.; 1994, 2006, 2022 penalty
shoot-outs; 2010, 2014 golden-goal-era a.e.t.) and 1950's unusual
final-round-robin-group format (Uruguay 2-1 Brazil, the "Maracanazo").

See `docs/SOURCES.md`'s new "Champion/Runner-up/Final-score second-source
audit" entry under FIFA World Cup for the full per-edition citation list.
`content/fifa-world-cup.md`'s `lastReviewed` moved to 2026-08-07; `status`
stays `review` (secondary sources, same reasoning as every prior
secondary-sourced audit in this file). No table data changed - the only file
changes are the `lastReviewed` bump, the new source citations, and this
entry. Since this page's `lastReviewed` date is pinned by an exact-match
Playwright assertion (`tests/e2e/mobile.spec.ts`, the one page in the suite
that checks a literal date rather than just presence), that test's expected
value was updated alongside the content change.

This closes the "second independent cross-check" series across all four team
competitions (Copa América, Nations League, EURO, World Cup) - every one now
has at least two independent audit passes on record for its core
Champion/Runner-up/Final-score data.

Bumping `lastReviewed` changed `content/fifa-world-cup.md`'s SHA-256, which
`pnpm check:pdfs` (added 2026-08-06) correctly flagged as making
`public/downloads/world-cup.pdf` stale. Regenerated all six PDFs and the
manifest via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`;
`pnpm check:pdfs` now passes cleanly.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged and `pnpm lint` is clean (0 errors/0 warnings, same pre-existing
`monthNames` hint every prior run has logged). The full Playwright suite
passes with the one intentional update noted above (the World Cup page's
pinned `lastReviewed` date, 2026-08-05 -> 2026-08-07).

**Left for a future pass:**
- With all four team competitions now on at least two Champion/Runner-up/
  Final-score audit passes, a natural next candidate in this series is
  extending it to the individual awards (Ballon d'Or's Winner column, and
  Golden Boot's two top-scorer tables) if a future run wants a comparably
  deep second-source check there too - today those tables' most recent audit
  is each competition's single first pass (see the entries earlier in this
  file).
- The manifest schema-enforcement, source-link liveness, and Ballon d'Or
  ceremony-date items noted in earlier entries are unchanged this run.

### Content-accuracy pass: Ballon d'Or Winner/National-team - second independent cross-check, no discrepancies

Added 2026-08-07 (intensive run, later slice). Every backlog item and every
required/nice-to-have capability from `docs/WEBSITE_REQUIREMENTS.md` was
already closed going into this run, and the previous entry (FIFA World Cup)
had just closed the "second independent cross-check" series for all four
team competitions, naming individual awards as the natural next candidate:
Ballon d'Or's Winner column, and Golden Boot's two top-scorer tables. This
run does the Ballon d'Or half of that (Golden Boot remains on a single audit
pass - the natural next candidate for a future run).

Re-verified all 69 awarded editions (1956-2025, excluding the cancelled 2020
award) via three parallel WebSearch passes split by era (1956-1978,
1979-2001, 2002-2025), deliberately drawing from a source mix distinct from
the 2026-08-04 first pass (which used ESPN, Sky Sports, BBC, Goal.com,
UEFA.com, France Football retrospectives, and Wikipedia): this pass mainly
used RSSSF, Transfermarkt, Bleacher Report, CBS Sports, OneFootball, NBC
Sports, Olympics.com, official club/federation sites (Real Madrid, SL
Benfica, FC Dynamo Kyiv, Scottish FA), IFFHS, Britannica, kicker.de, and
Spanish-language outlets. **No discrepancies found** across any of the 69
rows, including the two nationality-naturalization cases specifically
re-checked (1960 Luis Suárez to Spain, 1961 Omar Sívori to Italy) and the
2020 cancellation. Also reconfirmed the "Multiple winners through 2025"
summary table's two largest totals (Messi 8, Cristiano Ronaldo 5).

One genuine labeling nuance surfaced, not an error: 1990's National team
("West Germany" for Lothar Matthäus) is defensible either way depending on
whether a source keys off the team he won the award *for* (West Germany's
July 1990 World Cup win) or the country as it existed on the December 1990
announcement date (ten weeks post-reunification). Kept as "West Germany" for
consistency with every other pre-1990 row - documented as a footnote in
`content/ballon-dor.md`'s "Important editorial note" section and in
`docs/SOURCES.md` rather than silently changed either way. 1996 (Matthias
Sammer) has no such ambiguity and is unambiguously "Germany" in every
source, unchanged.

See `docs/SOURCES.md`'s expanded Ballon d'Or section for the full per-era
source breakdown. `content/ballon-dor.md`'s `lastReviewed` moved to
2026-08-07; `status` stays `review` (secondary sources, same reasoning as
every prior secondary-sourced audit in this file). No table data changed -
the only file changes are the `lastReviewed` bump, the new "West
Germany"/"Germany" footnote, the new source citations, and this entry.

Bumping `lastReviewed` changed `content/ballon-dor.md`'s SHA-256, which
`pnpm check:pdfs` (added 2026-08-06) correctly flagged as making
`public/downloads/ballon-dor.pdf` stale. Regenerated all six PDFs and the
manifest via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`;
`pnpm check:pdfs` now passes cleanly.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged and `pnpm lint` is clean (0 errors/0 warnings, same pre-existing
`monthNames` hint every prior run has logged). The full Playwright suite
passes unchanged - a `lastReviewed` date bump and a footnote addition have
no assertion anywhere in the suite for this page.

**Left for a future pass:**
- Golden Boot's two top-scorer tables (World Cup and EURO) are now the last
  competition/award data still on a single audit pass - the natural next
  candidate in this series.
- The manifest schema-enforcement and source-link liveness items noted in
  earlier entries are unchanged this run. The Ballon d'Or ceremony-date item
  is now fully closed (see the second-source follow-up entry above,
  2026-08-04) - dropping it from this recurring note going forward.

### Content-accuracy pass: Golden Boot (World Cup + EURO top scorers) - second independent cross-check, no discrepancies

Added 2026-08-07 (intensive run, later slice). Every backlog item and every
required/nice-to-have capability from `docs/WEBSITE_REQUIREMENTS.md` was
already closed going into this run, and the previous entry (Ballon d'Or)
named Golden Boot's two top-scorer tables as the last competition/award data
still on a single audit pass - closing that gap is exactly this run's slice
of the "second independent cross-check" series, which now covers every
competition/award table on the site.

Re-verified both tables in `content/golden-boot.md` via five parallel
research passes: three for the FIFA World Cup table split by era
(1930-1962, 1966-2002, 2006-2026, 23 editions) and two for the UEFA EURO
table split by era (1960-1992, 1996-2024, 16 editions) - matching the same
per-table pass count the 2026-08-04 first audit used. Each pass
deliberately drew from a source mix distinct from its first-pass
counterpart: RSSSF, English and German Wikipedia, Britannica,
worldfootball.net, 11v11.com, Transfermarkt, fussballdaten.de, IFFHS,
eu-football.info, Wikidata, national football museums/federations, and
independent retrospectives, rather than the first pass's ESPN/BBC/Sky
Sports/Goal.com/FIFA.com/CBS Sports/Sports Illustrated/UEFA.com/Transfermarkt
mix. **No discrepancies found** across any of the 39 rows (23 World Cup +
16 EURO), including every multi-way tie - 1962's six-way tie, 1994's
Stoichkov/Salenko tie, 1960's five-way tie, 1964's three-way tie, 1992's
four-way tie, and 2012's and 2024's six-way ties - with every individual
name and diacritic re-checked for completeness and correct spelling.

Two non-discrepancy notes surfaced, recorded in `docs/SOURCES.md` rather
than changing any table data: 1934's Oldřich Nejedlý total has a known
historical footnote (an older FIFA tally once split his goals differently
among teammates) that doesn't affect the now-standard 5-goal figure already
on the page; and 2010's Thomas Müller tied on 5 goals with three other
players and won on FIFA's own tiebreak, which the page's existing generic
"World Cup notes" bullet about tiebreakers already covers, consistent with
how EURO 2012's Torres tiebreak is already handled the same way. The 2026
World Cup row (Mbappé, France, 10 goals) got the same extra scrutiny the
first pass gave it, re-checked via a dozen independently-phrased searches
across a dozen outlets, all mutually consistent on the final and
third-place match details - reconfirmed as genuine data, not fabricated.

One tooling limitation applied to every pass this run: direct WebFetch to
primary-source domains (rsssf.org, wikipedia.org, worldfootball.net, and
others) was blocked by this environment's egress policy, so verification
relied on WebSearch's synthesized result snippets rather than directly
rendered pages. This is noted in `docs/SOURCES.md` as a caveat on the
audit's strength, not a data concern - convergence across five-plus
independently-sourced snippets per row is still strong evidence, and a
future run without that restriction could upgrade confidence further.

See `docs/SOURCES.md`'s two new "second independent cross-check" entries
under FIFA World Cup and UEFA EURO for full per-era source lists.
`content/golden-boot.md`'s `lastReviewed` moved to 2026-08-07; `status`
stays `review` (secondary sources, same reasoning as every prior
secondary-sourced audit in this file). No table data changed - the only
file changes are the `lastReviewed` bump, the new source citations, and
this entry.

This closes the "second independent cross-check" series across every
competition and award table on the site (Copa América, Nations League,
EURO, World Cup, Ballon d'Or, and now Golden Boot) - every one now has at
least two independent audit passes on record for its core data.

**Tests:** no library code under `src/` changed, so the full Vitest suite
is unchanged and `pnpm lint` is clean. The full Playwright suite is
unchanged - a `lastReviewed` date bump has no assertion anywhere in the
suite for this page. Bumping `lastReviewed` changed
`content/golden-boot.md`'s SHA-256, which `pnpm check:pdfs` correctly
flagged as making the Golden Boot section of the affected PDFs stale;
regenerated all six PDFs and the manifest via `PW_EXECUTABLE_PATH=
<preinstalled Chromium> pnpm build:pdfs`, and `pnpm check:pdfs` now passes
cleanly.

**Left for a future pass:**
- With every competition/award table now on at least two independent audit
  passes, this specific "second independent cross-check" series is
  complete. A third-pass series, or a first-ever audit of secondary
  columns not yet covered by any pass (e.g. host nation, attendance,
  qualifying-round detail), would be the natural next content-accuracy
  candidate if a future run wants to continue in this vein.
- The manifest schema-enforcement and source-link liveness items noted in
  earlier entries are unchanged this run.

### Content-completeness pass: `/quiz` and the home page were silently dropping their own reader-facing prose - fixed 2026-08-07 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, and the "second independent cross-check" content-
accuracy series (see the five entries above) had just closed out across
every competition/award table, naming secondary columns as the natural next
content-accuracy candidate - but a re-read of `content/quiz.md` and
`content/index.md` (prompted by the routine's own "left for a future pass"
notes) turned up a real content-completeness gap instead, not a duplicate of
the two items already on record and rejected below (Copa América's "Titles
after 2024" / Ballon d'Or's "Multiple winners through 2025" tables, which
duplicate `ChampionsSummary`'s own numbers).

**The gap:** `content/quiz.md` has always had `## How it works` (explaining
the "Check answer" button, the "Just show me the answer" no-JS fallback,
"Restart quiz", and the separately-scored "Champion order challenge") and
`## Question types in this quiz` - genuinely useful onboarding copy for a
family/kid-facing quiz. `content/index.md` has always had `## How to use the
reference` and `## Important historical naming note` (the West
Germany/Germany, Soviet Union/Russia, Czechoslovakia/Czechia editorial
convention explainer) - real transparency copy for first-time readers.
Neither page ever rendered any of the four sections, in either language:
`src/pages/quiz.astro`/`hr/quiz.astro` only rendered `meta.intro` (the first
paragraph) via `loadPageMeta('quiz')`, and `src/pages/index.astro`/
`hr/index.astro` are fully hand-authored and never touched the Markdown body
at all beyond front matter (`title`/`description`). Both had been silently
dead content since the pages were first built.

**The fix:** reused the exact existing `extractSections()`/
`renderInlineMarkdown()`/`EditorialNotes.astro` machinery every competition
page already relies on for its own "Memorable moments" etc. sections - no
new parsing or rendering code needed.
- `loadPageMeta()` (`src/lib/competition.ts`) gained an optional
  `noteHeadings` second argument, mirroring `loadCompetition()`'s existing
  option, and now always returns a `notes: NoteSection[]` field (empty when
  no headings are requested, so every existing caller - `records.astro`,
  `compare.astro`, `about/sources.astro`, `sitemap.xml.ts`, and their `hr/`
  equivalents - is unaffected).
- `quiz.astro` requests `['How it works', 'Question types in this quiz']`
  and renders `<EditorialNotes sections={meta.notes} />` right after the
  page intro, before the score bar and question list, so a reader sees the
  mechanics before playing.
- `hr/quiz.astro` hand-translates the same two sections into a local
  `NoteSection[]` constant (`Kako funkcionira` / `Vrste pitanja u ovom
  kvizu`), the same "hand-translated notes, not routed through content/ or
  `t()`" convention the six Croatian competition pages already use for their
  own notes.
- `index.astro` (which uses `getEntry()` directly rather than
  `loadPageMeta()`, since it also needs the page's optional `description`
  front-matter field that `PageMeta` doesn't expose) now calls the same
  `extractSections()` directly and renders both sections after the features
  section, at the foot of the page.
- `hr/index.astro` hand-translates the same two sections
  (`Kako koristiti ovaj pregled` / `Važna napomena o povijesnim nazivima`),
  same convention.

`content/quiz.md` and `content/index.md` themselves are untouched - both
sections already existed verbatim; this was purely a rendering gap.

**Tests:** `extractSections()`/`renderInlineMarkdown()` already have 10
Vitest cases (`tests/unit/notes.test.ts`) covering this exact code path, so
no new unit tests were needed. Added 4 new Playwright cases at 360px
(`tests/e2e/mobile.spec.ts`): English quiz page and home page each assert
both new `.notes__card` sections are present with real body text, and the
Croatian equivalents assert the translated headings/body text. `pnpm lint`
- 0 errors, 0 warnings, the one pre-existing unrelated hint; `pnpm test` -
158/158 (unchanged, no library logic changed); `pnpm build` succeeds and the
four new sections were spot-checked in the built HTML
(`dist/quiz/index.html`, `dist/index.html`, `dist/hr/quiz/index.html`,
`dist/hr/index.html`); the full Playwright suite passes with
`PW_EXECUTABLE_PATH` pointed at the environment's preinstalled Chromium
(bundled `chromium_headless_shell` isn't present in this sandbox).

**Left for a future pass:** the two already-rejected table-rendering items
(Copa América "Titles after 2024", Ballon d'Or "Multiple winners through
2025") are unchanged - still considered not a gap, see above. A first-ever
audit of secondary columns (host nation, attendance, qualifying detail) not
yet covered by any content-accuracy pass remains the natural next candidate
if a future run wants to continue that series instead.

### Tooling fix: PDF manifest schema-drift risk closed, plus first-ever Host(s)/Teams audit for World Cup and EURO - added 2026-08-08 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, and the previous entry's "Left for a future pass" note
named the manifest schema-drift risk (from "Automated PDF-freshness check",
2026-08-06) and a first-ever audit of secondary columns (host nation, team
counts) as the two concrete candidates on record. This run closes both.

**Tooling fix:** `scripts/generate-pdfs.mjs` and `scripts/check-pdf-freshness.mjs`
each hand-maintained their own copy of the slug/path/content-dependency list
for the six downloadable PDFs, with the 2026-08-06 entry explicitly flagging
the drift risk if a future page were added to only one of the two lists. New
`scripts/pdf-pages.mjs` exports a single `PDF_PAGES` array; both scripts now
import it instead of keeping their own copy, so the two lists can no longer
disagree by construction. Purely a refactor - no behavioral change, verified
by re-running `pnpm check:pdfs` (still reports all six PDFs up to date
against the unchanged manifest).

**Content-accuracy audit:** the "Host(s)" and "Teams" (participating-team
count) columns in `content/fifa-world-cup.md` (23 editions, 1930-2026) and
`content/uefa-euro.md` (17 editions, 1960-2024) had never been specifically
audited before - every prior content-accuracy pass in this file covered
Champion/Runner-up/Third/Fourth/Final-score columns only. Verified via four
parallel WebSearch research passes (two per competition, split by era:
World Cup 1930-1970/1974-2026, EURO 1960-1992/1996-2024), each edition
cross-checked against 2-3 independent sources (Wikipedia, RSSSF,
footballhistory.org, UEFA.com, topendsports.com, Sofascore, and others).
**No discrepancies found across any of the 40 rows.** This includes every
format-boundary and edge-case edition: World Cup 1938 (16 teams qualified
but Austria's slot went vacant after the Anschluss, 15 actually competed)
and 1950 (16 qualified, 3 withdrew, 13 actually competed) - both already-
documented nuances reconfirmed, not silently trusted; and EURO's five
tournament-format expansions (1980's 8-team, 1996's 16-team, 2016's
24-team) plus 1992's Denmark/Yugoslavia late substitution (host/team count
unaffected) and 2020's eleven-city pan-European hosting (confirmed as
accurate standard phrasing, not an error). The World Cup pass also
independently corroborated, via multiple July 2026 news sources (ABC News,
CBS News, NBC News, NPR, France24), that the 2026 edition's 48-team,
three-host (Canada/Mexico/United States) format was the format actually
played, not merely the pre-tournament plan - consistent with this site's
already-recorded Spain-champion result for that edition.

See `docs/SOURCES.md`'s new entries under FIFA World Cup and UEFA EURO for
the full per-era source breakdown, including the same WebFetch-blocked-by-
egress-policy caveat every recent audit in this file has already noted (this
pass relied on WebSearch's synthesized snippets rather than directly
rendered pages).

No table data changed - the only content file changes are the
`lastReviewed` bump on both `content/fifa-world-cup.md` and
`content/uefa-euro.md` (both -> 2026-08-08) and the new source citations.
Bumping `lastReviewed` changed both files' SHA-256, which `pnpm check:pdfs`
(now importing the shared `PDF_PAGES` list above) correctly flagged as
making `public/downloads/world-cup.pdf` and `public/downloads/euro.pdf`
stale; regenerated all six PDFs and the manifest via `PW_EXECUTABLE_PATH=
<preinstalled Chromium> pnpm build:pdfs`, and `pnpm check:pdfs` now passes
cleanly again.

**Tests:** no library code under `src/` changed (only the two Node scripts'
internal source-of-truth for the PDF list, and content front matter), so the
full Vitest suite is unchanged (158/158) and `pnpm lint` is clean (0
errors/0 warnings, same pre-existing `monthNames` hint every prior run has
logged). The full Playwright suite is unchanged - a `lastReviewed` date bump
has no assertion anywhere in the suite for either page.

**Left for a future pass:**
- Nations League's "Finals host" and Copa América's "Host / format" and
  "Teams" columns are now the only competition tables whose host/team-count
  data hasn't had a dedicated audit pass - the natural next candidate in
  this series (World Cup and EURO are now closed).
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Content-accuracy audit: first-ever Copa América Host and Nations League Finals-host verification - added 2026-08-08 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, and the previous entry's "Left for a future pass" note
named Nations League's "Finals host" and Copa América's "Host / format"
column's host-country value as the only remaining competition-table columns
with no dedicated content-accuracy audit on record (World Cup and EURO's
Host(s)/Teams columns had just been closed by the prior run). This run closes
both. (Note: neither Nations League nor Copa América actually has a "Teams"
participating-team-count column - both tables only have a host column, unlike
World Cup/EURO - so this run audits exactly what exists, not a team count that
was never on the page.)

Verified via three parallel WebSearch research passes: two for Copa América's
"Host / format" column split by era (1916-1957, 25 editions; 1959-2024, 23
editions including both 1959 tournaments) and one for Nations League's
"Finals host" column (all 4 completed editions). Sources: each edition's
dedicated Wikipedia article, RSSSF's historical tables, UEFA.com and
CONMEBOL's own host-announcement pages, cross-checked against a second
independent source per edition (aggregate host-list sites, national-
federation histories, press coverage, Fotmob, or venue announcements).
**No discrepancies found across any of the 52 rows audited** (48 Copa América
editions + 4 Nations League editions).

Special attention went to two known edge cases, both reconfirmed correct as
already on the page: the two 1959 Copa América editions are not mixed up
(the regular Campeonato Sudamericano was hosted by Argentina; a separate
one-off "Extraordinario" edition, requested by Ecuador to inaugurate a new
stadium in Guayaquil, was hosted by Ecuador and is recorded as a second,
distinct 1959 row); and 1975, 1979, and 1983 genuinely had no single host
country (two-legged home-and-away finals played across the finalists' own
countries, not hosted by a third nation), matching the "Home-and-away" label
already in the "Host / format" column for those three rows - this is
distinct from (and confirms, rather than duplicates) the separate Format
column classification audited on 2026-08-02, which covered the
League-table/Final-playoff/Home-and-away/Knockout-final/Centenary
*classification* rather than which country actually hosted.

One tooling limitation applied to every pass, same as every prior audit in
this file: direct WebFetch to primary-source domains was blocked by this
environment's egress policy, so verification relied on WebSearch's
synthesized result snippets rather than directly rendered pages - noted as a
caveat on the audit's strength, not a data concern, given convergence across
2+ independently-sourced snippets per row.

See `docs/SOURCES.md`'s new entries under UEFA Nations League and Copa
América for the full per-era source lists. `content/uefa-nations-league.md`
and `content/copa-america.md` both had their `lastReviewed` bumped to
2026-08-08; `status` stays `review` (secondary sources, same reasoning as
every prior secondary-sourced audit in this file). No table data changed -
the only file changes are the two `lastReviewed` bumps, the new source
citations, and this entry.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (158/158) and `pnpm lint` is clean (0 errors/0 warnings, the one
pre-existing unrelated `monthNames` hint every prior run has logged). The
full Playwright suite is unchanged - a `lastReviewed` date bump has no
assertion anywhere in the suite for either page. Bumping `lastReviewed`
changed both files' SHA-256, which `pnpm check:pdfs` correctly flagged as
making `public/downloads/nations-league.pdf` and
`public/downloads/copa-america.pdf` stale; regenerated all six PDFs and the
manifest via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`,
and `pnpm check:pdfs` now passes cleanly again.

**Left for a future pass:** with this run, every competition/award table's
host and team-count columns that actually exist on the site (World Cup,
EURO, Nations League, Copa América) now have at least one dedicated
content-accuracy audit pass, on top of the completed "second independent
cross-check" series for Champion/Runner-up/Final-score columns across all
six tables. Remaining candidates for a future content-accuracy pass: a
third-pass series on any table (going beyond the current one-or-two-pass
coverage), or a first audit of columns not yet covered by any pass at all
(e.g. Copa América's per-edition "Final date", added 2026-08-03 but not
independently re-verified since). Source-link liveness remains infeasible in
this environment (WebFetch 403s on every host tried), per prior runs' notes
- unchanged.

### Content-accuracy audit: Copa América "Final date" column, first-ever pass - added 2026-08-08 (intensive run)

Closes the exact gap the previous entry's "Left for a future pass" note
named: the "Final date" column in `content/copa-america.md` (added
2026-08-03, alongside the Format column) had never had a dedicated
content-accuracy audit of its own, even though the Champion/Runner-up and
Format columns it sits next to had each been audited at least once.

Verified all 19 dated rows - every edition decided by a single-match
final-playoff, knockout-final, or the 2016 centenary final (the other 30
rows, League table and Home-and-away editions, correctly carry no single
final date and were left alone). Split into two WebSearch research passes:
the five pre-1960 final-playoff dates (1919, 1922, 1937, 1949, 1953) and the
14 knockout-final-era dates (1987 through 2024), each date cross-checked
against its Wikipedia final/play-off article plus at least one independent
source (RSSSF, ESPN, Transfermarkt, or copaamerica.com's own recap).

**No discrepancies found across any of the 19 dated rows.** Every date,
including the less-documented pre-1960 playoffs (e.g. 1953's 1 April final
in Lima, 1922's 6 November final in Rio), matched the page exactly.

See `docs/SOURCES.md`'s Copa América section for the full per-edition source
list, with the same egress-blocked-domains caveat every prior audit in this
file has noted (WebSearch snippets, not direct page loads).

No table data changed - `content/copa-america.md`'s `lastReviewed` was
already 2026-08-08 from the prior run in this same intensive session, so no
further bump was needed; only `docs/SOURCES.md` gained the new source
citations and this entry. No PDF regeneration was needed since the content
file's bytes didn't change.

**Tests:** no library code under `src/` and no content file changed, so the
full Vitest suite is unchanged (158/158) and `pnpm lint` is clean (0
errors/0 warnings, the one pre-existing unrelated `monthNames` hint every
prior run has logged). The full Playwright suite is unchanged for the same
reason.

**Left for a future pass:** with this run, every dated/audited column across
all six competition/award tables (Champion/Runner-up/Final-score, Format,
Host(s)/Teams, Third/Fourth-place, and now Copa América's Final date) has at
least one independent content-accuracy audit on record. Remaining
candidates: a second independent cross-check of columns/tables that have
only had one audit pass so far (most of them, at this point), a first audit
of Ballon d'Or's or Golden Boot's less-common columns if any remain
unchecked, or a fresh accessibility/performance pass (the last dedicated one
was 2026-08-05's quiz interactive-state sweep). Source-link liveness remains
infeasible in this environment (WebFetch 403s on every host tried), per
prior runs' notes - unchanged.

### Accessibility: every TournamentTable's filter/sort/empty-result states, first-ever audit - added 2026-08-08 (intensive run)

Every backlog item was already closed going into this run, and the previous
entry's "Left for a future pass" note named a fresh accessibility pass as one
of three remaining candidates - specifically warning that it should target
"a concrete gap... rather than a broad, likely-low-yield sweep" (a lesson
from the 2026-08-04 entry, which found performance has little surface on
this image-light static site). This run found and closed exactly that kind
of concrete gap: `tests/e2e/accessibility.spec.ts`'s automated WCAG sweep
loads every `NAV_LINKS` page exactly once, in its untouched initial DOM
state, and `accessibility-quiz-states.spec.ts`/`accessibility-compare-
states.spec.ts` already closed the equivalent gap for those two pages' own
interactive states - but every one of the six competition/award pages' own
`TournamentTable` filter/sort/empty-result states had never been driven
through axe, or even through a plain functional test. In particular, the
`#{id}-empty` "No editions match those filters" block
(`src/components/TournamentTable.astro`) - which appears whenever a winner
and year filter combination matches zero rows, with its own "Clear filters"
button - has existed since the original filter feature shipped but had
literally **zero** test coverage of any kind (functional or accessibility)
before this run; every prior test, across the whole suite's history, only
ever exercised filter combinations that returned at least one row.

New `tests/e2e/accessibility-table-states.spec.ts` covers all seven table
ids on the site (`world-cup`, `euro`, `copa-america`, `nations-league`,
`ballon-dor`, `golden-boot-world-cup`, `golden-boot-euro`) with two states
each: the no-results state (reaching it via a `findNoResultsCombo()` helper
that reads each table's own live row `dataset` in the browser to find a
genuinely non-matching winner/year pair, rather than a guessed pair that
could silently stop being a real gap after a future content edit - and then
confirms the "Clear filters" button is keyboard-focusable, activates on
`Enter`, and actually restores the default view), and a combined
filtered-and-re-sorted state (a real winner filter plus a changed "Sort by"
option at once, since sorting only reorders `<tr>` elements in place while
filtering hides some of them - a combination the existing `mobile.spec.ts`
coverage always exercised separately, never together). A further canary test
re-runs the no-results state against the Croatian World Cup page in the dark
color scheme, since the underlying filter/sort/empty script is identical
across locales and themes (same element ids, same logic) but the rendered
labels and CSS custom properties differ - one representative table stands in
for re-running all seven a second and third time, the same "vertical slice"
reasoning this project's localization work used throughout.

**No WCAG violations found in any of the 15 new cases** - this is a
coverage-gap closure, not a bug-fix pass; the empty state's copy, the "Clear
filters" button, and the reordered/filtered table all already meet WCAG 2.1
A/AA, they simply had never been checked. No `src/` or `content/` changes
were needed.

**Tests:** 15 new Playwright cases (242 total, up from 227), all passing
against the environment's preinstalled Chromium
(`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,
noted here since the plain `chromium` symlink Playwright reports in its own
error message does not resolve on its own in this container - a future run
hitting the same "Executable doesn't exist" error should point at the
versioned `chromium-1194/chrome-linux/chrome` path directly). `pnpm lint` is
clean (0 errors/0 warnings, the one pre-existing unrelated `monthNames`
hint) and the full Vitest suite is unchanged (158/158 - no library code
changed, this is a test-only addition).

**Left for a future pass:**
- The same three candidates the previous entry named remain otherwise open:
  a second independent content-accuracy cross-check of columns/tables with
  only one audit pass so far, a first audit of Ballon d'Or's/Golden Boot's
  remaining less-common columns if any, or further concrete accessibility
  gaps (e.g. the theme-toggle button's actual click interaction, as opposed
  to the main sweep's `colorScheme`-forced page loads, has not been driven
  through axe as a live state change).
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Accessibility: theme-toggle button's live click interaction, first-ever test coverage - added 2026-08-08 (intensive run)

Closes the exact gap the previous entry's "Left for a future pass" note
named. `ThemeToggle.astro` (rendered in `Nav.astro` on every page, English
and Croatian) is the one genuinely interactive, client-scripted control that
sits outside any `TournamentTable`/quiz/compare state, and it had **zero**
test coverage of any kind before this run - not a Vitest unit test (there is
no pure function here, it's a DOM click handler), not a Playwright
functional test, not an axe pass. The main `accessibility.spec.ts` sweep
only ever loads pages once per Playwright-emulated `colorScheme`; it never
actually clicks the button and drives the real `data-theme`
attribute/`aria-pressed`/label-swap/`localStorage` logic in
`ThemeToggle.astro`'s inline script.

New `tests/e2e/accessibility-theme-toggle.spec.ts` covers, on the English
home page: the initial state (confirming `sync()` runs once on load and
already reflects the emulated OS color scheme - Playwright's un-set default
is `light` - rather than the static server-rendered "Theme" label text,
which the test comments explain to avoid a future false assumption);
clicking toggles `aria-pressed`, the visible label text ("Light"/"Dark"),
`<html data-theme>`, and `localStorage.getItem('theme')`, checked in both
directions, with a live axe pass after each click (not just the emulated-
`colorScheme` page loads the main sweep already covers); keyboard operability
(`Tab`-focus then both `Enter` and `Space`, since a native `<button>` must
accept either); and that a saved choice survives a real `page.reload()`
(exercising `BaseLayout.astro`'s before-paint inline script reading
`localStorage`, not just the in-memory DOM state of the current page). A
second `describe` block re-runs the click-and-relabel check on the Croatian
home page, confirming the toggle's localized `data-light-label`/
`data-dark-label` (wired through `ThemeToggle`'s `locale` prop) actually
reach the live-updated text ("Svijetla"/"Tamna"), not just the initial
server render already covered by the main sweep.

**No WCAG violations found** - this is a coverage-gap closure, not a
bug-fix pass; the toggle already meets WCAG 2.1 A/AA in both states, it had
simply never been driven through axe as a live interaction. No `src/` or
`content/` changes were needed.

**Tests:** 3 new Playwright cases (245 total, up from 242), all passing
against the environment's preinstalled Chromium
(`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).
`pnpm lint` is clean (0 errors/0 warnings, the one pre-existing unrelated
`monthNames` hint) and the full Vitest suite is unchanged (158/158 - no
library code changed, this is a test-only addition). `pnpm build` succeeds
(22 pages).

**Left for a future pass:**
- A second independent content-accuracy cross-check of columns/tables with
  only one audit pass so far, or a first audit of Ballon d'Or's/Golden
  Boot's remaining less-common columns if any, remain the main open
  candidates - the accessibility side has now had two consecutive
  concrete-gap closures (table filter/sort/empty states, then the
  theme-toggle interaction) and no further specific gap is known offhand;
  a future pass should look for one rather than run a broad, likely-low-
  yield sweep, per the lesson already on record in this file.
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Content-accuracy pass: Copa América Format column - second independent cross-check

Added 2026-08-08 (intensive run). The previous entry's "Left for a future
pass" note named a second independent cross-check of any column/table still
on a single audit pass as a main open candidate; the per-edition "Format"
column in `content/copa-america.md`'s Champions timeline table (League
table / Final playoff / Home-and-away / Knockout final / Special centenary
edition, 48 editions) was the one flagged specifically - it had only had its
first pass on 2026-08-02, unlike Champion/Runner-up/Final-score (all four
team competitions now on a second pass) and Host/Final-date (each on a first
pass added just earlier today).

Re-verified all 48 editions (1916-2024, including both 1959 tournaments) in
four WebSearch passes split by era, mirroring how the first pass itself was
split: 1916-1929 (12 editions), 1935-1967 including both 1959s (17
editions), 1975-1987 - the home-and-away-to-knockout-final transition (4
editions), and 1989-2024 - the knockout-final era plus the two closing-group
League table editions and the 2016 centenary edition (15 editions).
Deliberately drew on a source mix distinct from the first pass (which leaned
on Wikipedia's per-edition/play-off articles and RSSSF's tables): this pass
added sports-history and stats sites not used the first time around
(worldfootball.net's era, todor66.com, Liquipedia's lab wiki, Grokipedia,
soccernostalgia.blogspot.com, Soccer Wizdom's retrospective series) and
Wikipedia's dedicated `*_knockout_stage` articles for the modern era rather
than only the final-match articles the first pass cited.

**No discrepancies found.** Every classification already on the page held
up under the second pass:

- The five level-on-points playoff deciders (1919, 1922, 1937, 1949, 1953)
  each re-confirmed as needing an extra decider match after the round-robin
  table finished tied - including 1922's three-way tie where Uruguay
  withdrew from the scheduled playoff in protest, leaving Brazil to beat
  Paraguay for the title.
- Every other pre-1975 edition re-confirmed as a plain single (or, in 1925's
  three-team case, double) round-robin table decided outright on points, no
  extra match needed.
- 1975, 1979, and 1983 re-confirmed as two-legged home-and-away finals
  (with a third, neutral-venue decider in 1975 and 1979, when each side won
  one leg), not hosted in a fixed venue.
- 1987 re-confirmed as the first knockout-final-era edition: a group stage
  feeding a single-elimination bracket (with defending champions Uruguay
  entering directly at the semifinal), ending in a one-off final.
- 1989 and 1991 re-confirmed as League table editions in the specific sense
  the content file's warning section already describes: two opening groups
  feeding a four-team closing round-robin group, not a single final match -
  genuinely different from both the pre-1975 shape and the 1993-onward
  knockout-final shape, but still decided by table standings rather than a
  bracket.
- 1993 through 2024 (except 2016) re-confirmed as group stage into a
  single-elimination knockout bracket ending in a one-off final.
- 2016 (Copa América Centenario) re-confirmed as the deliberate outlier kept
  in its own "Special centenary edition" category: structurally a group-
  stage-into-knockout tournament like every edition from 1993 onward, but
  played outside the normal four-year cycle, hosted for the first time ever
  outside South America (the United States), and expanded to 16 teams (10
  CONMEBOL plus 6 CONCACAF) rather than the usual 10 or 12 - the same
  reasoning the first pass gave for not folding it into "Knockout final".

See `docs/SOURCES.md`'s expanded Copa América section (new "Format-column
second-source audit" entry) for the full per-era citation list.
`content/copa-america.md` gained one new prose paragraph in the "Important
editorial warning" section documenting this second pass, in the same style
as the existing Champion/Runner-up second-cross-check paragraph immediately
below it. `lastReviewed` was already `2026-08-08` from two earlier passes in
this same intensive session (the Host/Finals-host audit and the Final-date
audit), so no further date bump was needed; `status` stays `review`
(secondary sources, same reasoning as every prior secondary-sourced audit in
this file). No table data changed - the only file changes are the new
content-file paragraph, the new `docs/SOURCES.md` citations, and this entry.

Adding the new paragraph changed `content/copa-america.md`'s bytes (even
though no table cell changed), which `pnpm check:pdfs` correctly flagged as
making `public/downloads/copa-america.pdf` stale. Regenerated all six PDFs
and the manifest via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm
build:pdfs`; `pnpm check:pdfs` now passes cleanly.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (158/158) and `pnpm lint` is clean (0 errors/0 warnings, the one
pre-existing unrelated `monthNames` hint every prior run has logged). The
Playwright suite was not re-run for this pass (a prose-only content change
with no assertion anywhere in the suite pinned to that paragraph's text or
byte count, and the instruction for this pass didn't require it); the full
Vitest suite and `pnpm lint` were run and are clean.

**Left for a future pass:**
- With this run, the Format column joins Champion/Runner-up/Final-score as
  having at least two independent audit passes; Host/Final-date each still
  have only their first pass (both added earlier today) and are the
  natural next candidates for a second cross-check.
- Third/fourth-place and the remaining columns not yet covered by any
  second pass remain open, per the same "Left for a future pass" note this
  run picked up from.
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Performance: first-ever page-weight budget check - added 2026-08-09 (intensive run)

Every "Required capability" and "Nice-to-have capability" in
`docs/WEBSITE_REQUIREMENTS.md` was already shipped going into this run, and
the recent content-accuracy series had reached genuine diminishing returns
(the last several passes each re-confirmed data a prior pass had already
verified, finding no discrepancies). Of the fallback quality-pass categories
this routine's instructions name (content accuracy, missing data,
accessibility, performance), **performance** was the one dimension no prior
run had ever measured or guarded - every other category had multiple passes
on record.

Measured the actual site first rather than assuming there was a problem:
`pnpm build` produces 26 static HTML pages, none reference an image (the
site has none - `AGENTS.md` rule 4 forbids scraped photographs) or a web
font (`--font-sans`/`--font-mono` are both system-font stacks, confirmed in
`src/styles/global.css`), and there are only two small shared CSS bundles
(~6.4 KB and ~10.7 KB) - so the site is already lightweight by construction,
not something this pass needed to fix. But nothing had ever put a number on
that or would catch a future regression (a stray large asset, an
accidentally duplicated inline script block, an unminified debug dump)
before it shipped - the same gap `check:pdfs` (2026-08-06) closed for PDF
staleness, just for page weight instead.

New `scripts/check-page-weight.mjs` (`pnpm check:perf`, modeled directly on
`scripts/check-pdf-freshness.mjs`'s shape): walks every `dist/**/*.html`
file after a build, sums each page's own HTML bytes with every same-origin
CSS asset it references (resolved under `dist/_astro/` regardless of the
site's `BASE_PATH`, so it works both locally and under GitHub Pages'
`/football-reference/` prefix), and fails with a full over-budget listing if
any page exceeds `PAGE_WEIGHT_BUDGET_BYTES` (300 KB). That budget was set
from a real measurement, not a guess: the heaviest page today is English
`/records` at ~227.7 KB (genuinely the densest page on the site - it
aggregates seven tables' worth of generated timeline/ranking content, not
bloat), so 300 KB leaves real headroom for that content to keep growing
while still catching an accidental regression well before production. Wired
into `.github/workflows/ci.yml` as a new "Page-weight budget check" step
(with its own "Build" step ahead of it, since - unlike `check:pdfs`, which
only hashes `content/*.md` - this check needs a real `dist/`); left out of
`deploy.yml` on purpose, matching that workflow's existing "keep deploys
fast" policy for `check:pdfs` and Playwright.

Covered by 9 new Vitest cases (`tests/unit/checkPageWeight.test.ts`:
`findCssRefs` dedup and the no-stylesheet case, `resolveDistAsset`'s
base-path-agnostic resolution and its "not an `/_astro/` asset" null case,
`pageWeight` summation, and `overBudget`'s filtering/sort/exactly-at-budget
boundary). Also manually verified the failure path end-to-end against the
real build (temporarily set the budget to a value below every page's size,
confirmed all 26 pages were reported with a non-zero exit code, then
restored the real 300 KB budget) - the pure functions are unit-tested, but
the script's file I/O and process-exit behavior are not, matching how
`check-pdf-freshness.mjs` itself has no dedicated test file either.

**Result: every page is already within budget today** (heaviest: 229.0 KB
`hr/records`, 227.7 KB `records`, then quiz and Copa América at 174 KB and
156 KB) - this pass adds a guard rail against future regressions, it did not
find or fix an existing one.

**Tests:** 167/167 Vitest (up from 158), `pnpm lint` clean (0 errors/0
warnings, the one pre-existing unrelated `monthNames` hint every prior run
has logged - confirmed again this run to be a known Astro `define:vars`
type-checker limitation, not a real bug: the client script's `monthNames` is
injected at runtime by `define:vars={{ ..., monthNames, ... }}`, which the
static type checker has no visibility into). Playwright suite unchanged (no
page markup or client behavior changed, only new build/CI tooling).

**Left for a future pass:**
- The content-accuracy series' open items are unchanged from the note
  above (Host/Final-date second cross-checks, remaining third/fourth-place
  columns) and remain valid future work, just no longer the single
  highest-value option every run - now that performance has a first pass on
  record too, whichever category has gone longest without one is the
  natural next pick.
- This check measures HTML + CSS weight only (the two things that vary
  per-page); it deliberately does not count the service worker
  (`sw.js`, fetched lazily on registration, not part of initial page load)
  or the downloadable PDFs (opt-in downloads, not part of the page itself).
  A future pass could add a similar budget for total JS execution
  (currently all `is:inline`, so there is no separate JS file size to
  measure) if that ever changes.
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Accessibility: print stylesheet, first-ever test coverage - plus the `monthNames` hint was a real (tiny) fixable bug, not a checker limitation - added 2026-08-09 (intensive run)

The previous entry's "Left for a future pass" note pointed at whichever
quality category had gone longest without a pass; content-accuracy audits
had already reached diminishing returns (a dozen-plus consecutive "no
discrepancies" passes) and this session's own prior two entries had just
closed concrete gaps in accessibility (table filter/sort/empty states,
theme-toggle) and performance (page-weight budget) - all three within the
same day. Before picking one of those to repeat, this run measured what was
actually still uncovered rather than assuming: every existing Playwright
spec (`mobile.spec.ts`, all four `accessibility*.spec.ts` files) only ever
renders the default **screen** media. `src/styles/global.css`'s `@media
print` block - required by `AGENTS.md` rule 7 and live since Milestone 1 (A4
landscape, on-screen-filtered rows forced back to visible, the mobile card
layout reverted to a real `<table>`, interactive chrome hidden, colors
flipped to pure black-on-white) - had **zero** test coverage of any kind,
confirmed by grepping the whole suite for `emulateMedia`/`media: 'print'`
before starting. This print path is also exactly what the six downloadable
per-competition PDFs (`scripts/generate-pdfs.mjs`) render from, so a print-
stylesheet regression would silently ship into those PDFs too, with nothing
to catch it.

New `tests/e2e/print-styles.spec.ts` (13 cases) covers English and Croatian
World Cup (a single full-featured `TournamentTable`) and the two-table
Golden Boot page, each driven through `page.emulateMedia({ media: 'print'
})`:
- a full axe WCAG 2.1 A/AA pass under print media (the print palette had
  never actually been checked for contrast/other violations - screen-media
  axe runs say nothing about it);
- the interactive chrome (`.site-header`, `.site-footer`, `.theme-toggle`,
  `.skip-link`) is actually hidden;
- `body` really flips to pure `rgb(255, 255, 255)` background /
  `rgb(0, 0, 0)` text;
- the mobile card `<td>` layout (`display: grid` at the suite's 360px
  screen viewport) reverts to a real `display: table-cell` under print.

A separate case confirms the specific behavior the print sheet exists to
guarantee: filtering World Cup down to one winner on screen (hiding most
rows via the native `hidden` attribute), then switching to print media and
checking that same `tr[hidden]` row is visible again with a live axe pass -
i.e., a reader who filtered the on-screen table and then hits print/PDF
still gets every edition, not just the filtered subset.

**No WCAG violations found under print media** - like the theme-toggle
pass, this is a coverage-gap closure, not a discovered bug in the print
styles themselves.

**Also fixed while in this area, correcting a prior run's conclusion:** the
2026-08-09 page-weight entry above states the long-standing `astro check`
`monthNames` hint (`src/components/OnThisDay.astro:138`) is "a known Astro
`define:vars` type-checker limitation, not a real bug." That conclusion was
wrong, and this run corrected it rather than repeating it a third time: the
same `define:vars={{ entries, monthNames, locale, emptyText }}` call injects
four names into the inline script, and only `monthNames` was ever flagged -
`entries`, `locale`, and `emptyText` all resolve cleanly throughout the same
script, which a genuine "no visibility into `define:vars`" limitation could
not explain. The actual cause: one line below, `formatDate()` declares a
same-scoped local `const monthName` (singular) that reads from `monthNames`
- close enough to the injected plural name that Astro's language-service
diagnostic misattributed the reference and suggested the wrong one ("Did you
mean 'monthName'?"). Renamed the local to `name` - a pure rename, zero
behavior change (`formatDate()`'s return value is identical for every
input, confirmed by the unchanged 167/167 Vitest run and the unchanged
print/on-this-day Playwright cases). `pnpm lint` now reports **0 errors, 0
warnings, 0 hints** - the first clean run in this file's recorded history,
after months of every prior run logging the same hint as "pre-existing" and
moving on without checking it.

**Tests:** 13 new Playwright print-media cases (271 total, up from 258).
`pnpm lint` - 0/0/0 (previously 0/0/1). `pnpm test` - 167/167 unchanged (no
library logic touched, pure rename). `pnpm build` succeeds (22 pages);
`pnpm check:pdfs` and `pnpm check:perf` both still pass cleanly (no content
or page-weight changes). Full Playwright suite - **258/258 passing** before
this run's additions, all green together with the 13 new cases after,
against the environment's preinstalled Chromium (`PW_EXECUTABLE_PATH=/opt/pw-
browsers/chromium-1194/chrome-linux/chrome`, same constraint every prior run
has noted).

**Left for a future pass:**
- Print coverage here deliberately checked three representative pages
  (World Cup EN/HR, Golden Boot's two-table shape) rather than all six
  competition/award pages plus Records/Compare/Quiz/Sources - a future pass
  could extend the same pattern to the remaining pages if full instance-by-
  instance coverage is wanted, the same "representative shape vs exhaustive"
  tradeoff the table-states pass already documented for its own two-table
  choice.
- Content-accuracy: a second independent cross-check of columns/tables that
  have only had one audit pass so far remains the standing candidate,
  unchanged from prior entries - still likely low-yield given the run of
  "no discrepancies" results, but the only category not touched today.
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Accessibility: print-media coverage extended to every remaining page, plus a real "answer key vanishes on paper" quiz bug found and fixed - added 2026-08-09 (intensive run)

The previous entry's print-stylesheet pass deliberately checked three
representative pages (World Cup EN/HR, Golden Boot's two-table shape) and
left extending the same pattern to the rest of the site as explicit future
work. This run did that extension - and, in the process of driving the
`/quiz` page through print media for the first time, found the pass's
highest-value catch of the day: a real, user-facing bug, not just a
coverage gap.

**Coverage extension:** `tests/e2e/print-styles.spec.ts`'s `PRINT_PAGES`
table-driven block (WCAG-under-print, interactive chrome hidden, black-on-
white colors, mobile-card-to-real-`<table>` reversion) now also covers EURO,
Copa América, Nations League and Ballon d'Or (the four single-table
competition pages the previous pass hadn't reached yet). A new
`OTHER_PRINT_PAGES` block adds the same WCAG/chrome/colors trio for Records,
Compare and `/about/sources` - three pages with no `TournamentTable` at all,
so the mobile-card-reversion check doesn't apply to them. `/compare` also
gets a page-specific check that its team-picker `<select>`s are hidden on
paper (`.compare__picker.no-print`, same mechanism the filters already use).

**The bug:** while writing the Quiz page's print tests, `.quiz-card__reveal`
- the "Just show me the answer" `<details>` disclosure in both
`QuizCard.astro` and `QuizOrderCard.astro` - turned out to carry the
`no-print` class alongside the JS-only "Check answer" button/feedback
controls. `docs/PROJECT_STATUS.md`'s own quiz entry documents the intended
design explicitly: "a no-JS visitor sees a clean answer-key quiz sheet
(also print-friendly) rather than dead buttons." `no-print` on the reveal
did the opposite - it hid the one thing a printed/no-JS quiz sheet actually
needs, the answer itself, while correctly hiding the JS-only controls that
share the class. A parent who printed the quiz for a kid, or opened it with
JS disabled and hit print, got questions with no way to check any answer.

Fix: dropped `no-print` from `.quiz-card__reveal` in both components, then
added a `@media print` rule in `src/styles/global.css` forcing the answer
text visible regardless of the `<details>`'s open/closed state (a printed
page can't reflect that interactive state anyway). The first attempt
(`.quiz-card__reveal > :not(summary) { display: block !important; }`,
overriding the child directly) looked right in the CSS but the new
Playwright assertions caught it as still failing - modern Chromium/Firefox
hide a closed `<details>`'s non-summary content via an internal
`::details-content` box using `content-visibility: hidden`, not a plain
`display: none` on the children, so overriding the child's own `display`
did nothing. Verified support first (`CSS.supports('selector(::details-
content)')` is `true` in this environment's Chromium 141) and targeting the
pseudo-element itself (`content-visibility: visible !important` +
`display: block !important`) is what actually works - confirmed with a
minimal standalone repro before touching the real stylesheet, then with the
real Playwright assertions.

New Quiz print-media tests (`tests/e2e/print-styles.spec.ts`): a WCAG pass;
one confirming the score bar and every card's JS-only controls stay hidden
while the answer-key `<details>` and its non-empty answer text are visible;
and a second for the chronological-order challenge cards, which share the
same `QuizCard`-adjacent pattern in `QuizOrderCard.astro` and had the
identical bug.

**Tests:** 29 new Playwright cases (287 total, up from 258).
`pnpm test` - 167/167 unchanged (no library logic touched). `pnpm lint` -
0 errors/0 warnings/0 hints, unchanged. `pnpm build` succeeds (22 pages);
`pnpm check:pdfs` and `pnpm check:perf` both still pass cleanly (no content
or page-weight changes - the CSS/markup edits here are bytes, not a new
column). Full Playwright suite - **287/287 passing**, run twice: once to
catch the `::details-content` bug (2 real failures, both in the new Quiz
tests, everything else green), and once after the fix to confirm all 42
print-media cases plus the full 287-case suite pass together.

**Left for a future pass:**
- Print coverage is now complete for every page except the individual
  competition pages' Croatian variants (only World Cup's HR page has a
  dedicated print test, matching the previous pass's "representative shape"
  choice) - a future pass could add the remaining five HR competition pages
  if full instance-by-instance coverage across both languages is wanted.
- Content-accuracy's standing candidate (a second independent cross-check of
  columns/tables that have only had one audit pass) remains unchanged and
  still likely low-yield, per prior entries' notes.
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Accessibility: print-media coverage extended to the remaining five Croatian competition pages - added 2026-08-09 (intensive run)

The previous entry's "Left for a future pass" note named this exact gap:
print-media coverage was complete for every page in both languages except
five of the six individual competition pages' Croatian variants (only World
Cup's HR page had a dedicated print test, kept as a "representative shape"
choice at the time). This run closed it. `tests/e2e/print-styles.spec.ts`'s
`PRINT_PAGES` table-driven block now also covers `hr/competitions/euro`,
`hr/competitions/copa-america`, `hr/competitions/nations-league`,
`hr/competitions/ballon-dor` and `hr/competitions/golden-boot` (its
two-table layout), each getting the same four checks every other row gets:
WCAG-under-print, interactive chrome hidden, black-on-white colors, and
mobile-card-to-real-`<table>` reversion. No component or stylesheet changes
were needed - the existing `@media print` rules in `src/styles/global.css`
already apply uniformly regardless of `lang`, so this was pure coverage
extension, not a bug hunt; all 20 new cases passed on the first run.

Print-media coverage is now complete for every page in both languages: all
six competition pages (EN+HR), Records, Compare, Sources and Quiz (EN+HR
covered indirectly via the shared `@media print` sheet's page-agnostic
rules; the competition pages were specifically the ones still missing
per-instance Playwright assertions).

**Tests:** 20 new Playwright cases (307 total, up from 287). `pnpm test` -
167/167 unchanged (no library logic touched). `pnpm lint` - 0 errors/0
warnings/0 hints, unchanged. `pnpm build` succeeds (22 pages);
`pnpm check:pdfs` and `pnpm check:perf` both still pass cleanly (test-only
change, no content or markup touched). Full Playwright suite -
**307/307 passing**.

**Left for a future pass:**
- Print-media coverage is now genuinely complete across the page inventory;
  the standing content-accuracy and source-link-liveness candidates below
  are the only recurring open items left in this file.
- Content-accuracy's standing candidate (a second independent cross-check of
  columns/tables that have only had one audit pass) remains unchanged and
  still likely low-yield, per prior entries' notes.
- Source-link liveness remains infeasible in this environment (WebFetch
  403s on every host tried), per prior runs' notes - unchanged.

### Content-accuracy audit: FIFA World Cup, UEFA EURO and UEFA Nations League "Final date" columns - second independent cross-check, no discrepancies - added 2026-08-09 (intensive run)

Closes the standing candidate this file's last several entries kept naming:
"Final date" was one of the few columns still on only a single audit pass
for three of the four team competitions - World Cup and EURO's dates were
verified once when the column was first added (2026-08-02), Nations
League's once at 2026-08-03, and only Copa América had since received a
dedicated, independent *second* pass (2026-08-08). This run closes the same
gap symmetrically for the other three.

- Verified all 44 dated rows across the three tables (World Cup 23,
  1930-2026; EURO 17, 1960-2024; Nations League 4, 2019-2025) via six
  parallel WebSearch research passes (three eras for World Cup, two for
  EURO, one for Nations League), each date cross-checked against at least
  two independent sources distinct from the first pass's own mix -
  FIFA.com, Britannica, 11v11.com, and Al Jazeera supplemented Wikipedia/
  ESPN this time round.
- **No discrepancies found across any of the 44 dates.** Every previously
  flagged edge case was independently reconfirmed rather than merely
  trusted: the 1950 World Cup's "Maracanazo" final-group decider (16 July
  1950), the 2022 World Cup's off-cycle Qatar slot (18 December 2022), the
  2026 World Cup as a genuinely completed tournament by this audit's run
  date (19 July 2026, not a forward-looking placeholder), EURO 1968's
  replay date rather than the original drawn match (10 June, not 8 June),
  and EURO 2020's real 2021 final date under its "2020" edition label (11
  July 2021).
- `docs/SOURCES.md` gained three new "Final match dates second independent
  cross-check" entries (FIFA World Cup, UEFA EURO, UEFA Nations League)
  with the full per-era source lists. `content/fifa-world-cup.md`,
  `content/uefa-euro.md` and `content/uefa-nations-league.md`'s
  `lastReviewed` all moved to 2026-08-09; `status` stays `review`
  (unchanged) - secondary sources, matching every prior secondary-sourced
  audit's reasoning in this file.
- No table data changed - this is a clean audit-closed entry, the same
  shape as the Copa América Final-date pass it mirrors. `pnpm test` -
  167/167 unchanged (no library logic touched); `pnpm lint` - 0 errors/0
  warnings/0 hints, unchanged. Regenerated the three affected PDFs
  (`world-cup.pdf`, `euro.pdf`, `nations-league.pdf`) via `pnpm build:pdfs`
  since their source `lastReviewed` bytes changed; `pnpm check:pdfs` now
  passes cleanly. The full Playwright suite is unchanged for the same
  reason a `lastReviewed`-only content change has never needed new
  Playwright cases in any prior audit entry.

This closes the "Final date" second-cross-check gap across all four team
competitions - Copa América (2026-08-08), and now World Cup, EURO and
Nations League (this run) - every dated column on the site now has at
least two independent audit passes on record.

**Left for a future pass:** with this closure, essentially every
competition/award table and every one of their columns has at least two
independent content-accuracy passes on record. A future run should treat
a *third* pass as genuinely low-yield unless a specific reason to suspect
an error surfaces, and instead look toward: Ballon d'Or's still-single-
sourced ceremony dates (the same handful noted in several earlier entries),
a source-link liveness check (infeasible in this environment - WebFetch
403s on every host tried, unchanged across many prior attempts), or a
fresh angle entirely outside the audit series (this file's accessibility
and performance coverage is already extensive - print-media, quiz
interactive states, table filter/sort/empty states, and page-weight budgets
are all covered per the entries above).

Note: the "Ballon d'Or ceremony dates" candidate named above is itself a
stale repeat - the 2026-08-04 slice (see its own entry earlier in this file)
already re-confirmed every single-sourced ceremony date with a genuine
second source, and a later entry ("champions-bar's screen-reader label",
2026-08-06) already flagged this exact note as stale once. Recorded here
again so a future run doesn't have to re-derive that from two different
places in the file.

### Quality pass: custom 404 page - added 2026-08-09 (intensive run)

Every "Required"/"Nice-to-have" capability from `docs/WEBSITE_REQUIREMENTS.md`
and `AGENTS.md` was already shipped, both languages were already fully
translated, and the last several entries' own "Left for a future pass" notes
agreed a third content-accuracy pass would be low-yield without a specific
reason to suspect an error - so this run took the "fresh angle entirely
outside the audit series" option instead of another audit pass. A close read
of `src/pages/` and `astro.config.mjs` turned up a real, previously-unnoticed
gap: the site had no `404.astro` at all. GitHub Pages project sites serve
`dist/404.html` automatically for any URL under the base path that doesn't
match a real file, so every broken/mistyped link (in either language) was
silently falling through to GitHub's own generic, unstyled, English-only 404
page instead of the site's own chrome - a real reader-facing dead end that
none of the many accessibility/SEO/print passes in this file had ever
covered, since none of them look for a *missing* page.

**The fix:** `src/pages/404.astro`, built on the existing `BaseLayout`
(so it gets the same nav, footer, theme toggle, skip link and offline
service-worker registration as every real page) rather than a bespoke shell.
Since a static host can't route a 404 by locale - one file has to answer for
both `/competitions/nonexistent` and `/hr/competitions/nonexistent` alike -
the page shows its message in both languages on one screen (`lang="hr"` on
the Croatian paragraph/section, matching the per-fragment `lang` attribute
convention already used elsewhere for mixed-language text) rather than
guessing or defaulting to English-only. Two "Popular pages"/"Popularne
stranice" link grids are generated directly from the existing
`NAV_LINKS`/`TRANSLATED_PATHS` (`src/lib/routes.ts`/`src/lib/i18n.ts`) - the
same two lists `Nav.astro` and the sitemap already read from - so the 404
page's link list can never drift out of sync with the site's real nav as
pages are added or renamed.
`BaseLayout.astro` gained a small additive `noindex` prop (defaults to
`false`, so every existing page's output is byte-identical) that renders
`<meta name="robots" content="noindex">` when set, so the 404 page itself is
never accidentally indexed as a duplicate/thin-content page - the same
`noindex` treatment the `/awards/...` redirect pages already get, just now
generalized into the shared layout instead of being unique to Astro's
built-in `redirects` output.

**Tests:** 6 new Playwright cases in `tests/e2e/mobile.spec.ts` (a new "404
page" describe block: no 360px overflow, the raw HTTP response is a genuine
404 status with the noindex tag, both languages' headings/text render, all
22 link-grid hrefs - 11 nav pages x 2 languages - actually resolve, and the
"home page" link lands back on a real page) plus the 404 path added to the
existing WCAG 2.1 A/AA sweep (`tests/e2e/accessibility.spec.ts`) in both
light and dark color schemes, so it gets the same automated accessibility
coverage every real page already has. Verified with `pnpm lint` (0 errors/0
warnings/0 hints, same pre-existing hint as every prior run), the full
Vitest suite (167/167 unchanged - no library logic touched), and the full
Playwright suite (**314/314 passing**, up from 307). `pnpm build` confirms
`dist/404.html` is produced at the site root (not nested under a
`/404/index.html` directory, which GitHub Pages would not find) and contains
both languages' content plus the noindex tag. `pnpm check:pdfs` and
`pnpm check:perf` both still pass cleanly (no content file or Editions table
touched; the new page's weight isn't among the heaviest 5 pages reported).

**Left for a future pass:**
- The 404 page's own popular-pages link list is generated from `NAV_LINKS`,
  so it needs no maintenance as pages are added - no known gap here.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates from the entry above
  are unchanged.
- A future pass could look at whether any other GitHub-Pages-specific static
  hosting convention is similarly missing (e.g. a `CNAME` file is
  intentionally not needed here since the site is served from the default
  `github.io` subdomain, not a custom domain) - nothing else surfaced in this
  run's read of `astro.config.mjs` and `.github/workflows/deploy.yml`.

### Bug fix: source-link extraction was silently dropping and corrupting real citations - fixed 2026-08-10 (intensive run)

Every "Required"/"Nice-to-have" capability was already shipped, the recent
audit series had reached the same diminishing-returns conclusion the last
several entries already recorded, and a live-link check remains infeasible
in this environment (confirmed again this run - WebFetch still returns
`EGRESS_BLOCKED` on both `en.wikipedia.org` and `copaamerica.com`, matching
every prior attempt). Rather than a fourth content-accuracy WebSearch pass
of the same tables, this run re-read `docs/CONTENT_MODEL.md`'s own
build-time validation checklist against what `src/lib/validate.ts` actually
checks - and found it: "source URLs are valid" has been on that checklist
since the file was first written, and nothing in the codebase has ever
enforced it. `extractSources()` (`src/lib/sources.ts`) extracted whatever
its regex matched and never validated the result.

**Two real bugs, found by testing the parser against the real
`docs/SOURCES.md` rather than just its fixtures:**

1. **Dropped citations.** `extractSources()` matched only the *first* URL on
   each line (`/(https?:\/\/\S+)/.exec(line)`). 25 lines in `docs/SOURCES.md`
   - mostly the Copa América pre-1975 era, cited as
   `- <rsssf table url> ; <wikipedia article url>` - carry two citations per
   line. Every one of those second URLs was silently missing from the
   competition page's "References & review" section and from
   `/about/sources`, in both languages, since the day each was added.
2. **Corrupted URLs.** The trailing-punctuation cleanup
   (`.replace(/[).,]+$/, '')`) stripped every trailing `)` unconditionally,
   assuming it was always markdown-link noise. Five citations across three
   sections are genuine Wikipedia disambiguation URLs that legitimately end
   in `)` - `.../1959_South_American_Championship_(Argentina)` and
   `_(Ecuador)` - and had their real closing paren stripped, turning a live
   link into a dead, truncated one. This was already rendered into
   `dist/competitions/copa-america/index.html` and `dist/about/sources/`
   before this fix (confirmed by inspecting the built HTML).

**The fix**, both in `src/lib/sources.ts`:
- `extractSources()` now matches every URL on a line (`line.match(/.../g)`)
  instead of only the first.
- The trailing-punctuation stripper (`stripTrailingPunctuation()`) still
  strips a trailing `.`/`,` unconditionally (never legitimately part of a
  URL in this corpus), but now only strips a trailing `)` while it is
  *unbalanced* - more `)` than `(` in the URL so far - so a markdown-link's
  outer paren is still stripped while a URL's own balanced parenthetical
  (like the 1959 disambiguation pages) survives intact.
- New `validateSourceSections()` closes the actual gap named above: given
  every section `extractSourceSections()` finds, it throws a build-failing
  `ContentValidationError` (reusing the same class `validateEditions()`
  already uses) if any URL fails to parse, uses a non-http(s) protocol, or
  has unbalanced parentheses - the same signal that would have caught bug 2
  outright. A true liveness check is still infeasible here, so this
  validates only what's decidable without a network call. Wired into
  `src/pages/about/sources.astro` right after `extractSourceSections()`,
  which already reads every heading in the whole file, so this one call
  site gives full-file build-time coverage regardless of which competition
  pages exist.

**Related blind spot closed in the same pass:** `scripts/check-pdf-freshness.mjs`
tracked each PDF's `content/*.md` table file(s) as its only staleness
dependency, never `docs/SOURCES.md` - even though every PDF's own
References section is rendered from it (`loadCompetition()` reads
`docs/SOURCES.md` for every competition, not just its own `content/*.md`
table). A source-link fix exactly like this one would have silently left
every downloadable PDF showing the old broken/missing links with
`pnpm check:pdfs` still reporting green. `scripts/pdf-pages.mjs`'s
`PDF_PAGES` entries now list root-relative paths and every entry includes
`docs/SOURCES.md`; `check-pdf-freshness.mjs`/`generate-pdfs.mjs` updated to
resolve paths from the repo root instead of assuming a `content/` prefix.
Regenerated all six PDFs and the manifest (`pnpm build:pdfs`); `pnpm
check:pdfs` now correctly flags all six as stale before the regeneration
and clean after.

**Tests:** 8 new Vitest cases in `tests/unit/sources.test.ts`
(`extractSources`: multi-URL-per-line extraction, a balanced-parenthesis
URL surviving intact, a markdown-wrapped URL still losing its outer paren,
trailing sentence punctuation after a parenthesised URL;
`validateSourceSections`: accepts well-formed links, rejects an unparseable
URL, a non-http(s) protocol, and unbalanced parentheses - 175 total, up from
167). No existing test's fixtures had more than one URL per line, so all
prior cases pass unchanged. `pnpm lint` - 0 errors/0 warnings/0 hints.
`pnpm build` succeeds (23 pages) and the fix was confirmed directly in the
output: `dist/competitions/copa-america/index.html` and
`dist/about/sources/index.html` both now show the corrected
`..._(Argentina)`/`..._(Ecuador)` URLs with their closing parens intact,
and the previously-missing second citation on each affected line (e.g. the
`1937_South_American_Championship` Wikipedia article, previously dropped
entirely) is now present. Full Playwright suite - **314/314 passing**,
including the WCAG-under-print and reference-list assertions on
`/about/sources` and `/hr/about/sources`. `pnpm check:pdfs` and `pnpm
check:perf` both pass cleanly after regeneration.

**Left for a future pass:**
- Source-link *liveness* (an actual HTTP check, not just syntax) remains
  infeasible in this environment - reconfirmed this run, unchanged from
  every prior attempt.
- The standing content-accuracy (third-pass, low-yield) candidate is
  unchanged.
- `validateSourceSections()` only checks syntax (parses, http/https,
  balanced parens) since that's all that's decidable offline - it would not
  catch, for example, a URL that's syntactically fine but points to the
  wrong article entirely. That class of error is exactly what the ongoing
  content-accuracy WebSearch audits are for, not this build-time check.

### Bug fix: the row-width content-validation check was structurally dead code - fixed 2026-08-10 (intensive run)

Same shape as the prior run's source-link fix: rather than another
low-yield third content-accuracy pass, this run re-verified an existing
build-time validation check against what it actually does, instead of
trusting that it works because `docs/CONTENT_MODEL.md` lists it. It doesn't.

`docs/CONTENT_MODEL.md`'s validation checklist requires "no duplicate table
headers" *and*, implicitly (it's the same class of structural check),
that every row actually has one cell per header - `validateEditions()`
(`src/lib/validate.ts`) has a check with exactly that comment. It has
never been able to fire. `buildEditions()` (`src/lib/editions.ts`) builds
each row's `cells` as `headers.map((label, index) => ({ label, value:
row[index] ?? '' }))` - by construction this **always** produces exactly
`headers.length` cells, silently padding a short row with empty strings
(or truncating a long one). The validator was comparing
`edition.cells.length` against `table.headers.length`, i.e. a value against
itself after it had already been forced to match - a check that can never
be false. Confirmed with a throwaway repro (not committed): a table with
`Year | Host | Winner | Runner-up` headers and a row missing one
pipe-delimited value (`Belgium` as the raw third-place value with no
"Runner-up" cell) built silent, wrong data - `Belgium` mislabeled as
`Runner-up`, the real runner-up dropped, "Third" blank - with no build
failure. All six of today's content tables happen to be well-formed, which
is exactly why this has never been noticed in the wild; the risk is a
future edit (human or agent) that drops or adds a pipe mid-row in any of
the six `content/*.md` tables.

**The fix** (`src/lib/validate.ts`): compare the raw parsed row width -
`table.rows[i].length`, from the `MarkdownTable` already passed into
`validateEditions()` - against `table.headers.length`, instead of the
derived, always-padded `edition.cells.length`. Uses data that hasn't
already been normalized to agree with itself.

Also considered and set aside as not a fresh finding, per the agent
research pass behind this entry: `content/fifa-world-cup.md`'s "Champions
by titles after 2026" and `content/uefa-euro.md`'s "Champions by titles"
sections are unparsed, unrendered duplicate tables - but this is the exact
pattern already examined and explicitly rejected for Copa América's
"Titles after 2024" and Ballon d'Or's "Multiple winners through 2025"
tables (2026-07-30 entry above: verified by hand to match the generated
`ChampionsSummary`, so a renderer would only duplicate it) - not a new gap.

**Tests:** 2 new Vitest cases in `tests/unit/validate.test.ts` reproducing
the exact bug class (a row with one too few cells, a row with one too many)
against the fixed check - 177 total, up from 175. `pnpm lint` - 0 errors/0
warnings/0 hints. `pnpm build` - 23 pages, unchanged. No content file
changed (all six tables are already well-formed), so `pnpm check:pdfs` and
`pnpm check:perf` both pass unchanged with no regeneration needed. Full
Playwright suite unaffected for the same reason - this check only changes
what happens on a malformed row, and no page's content or markup changed.

**Left for a future pass:**
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.
- This class of bug - a derived value validated against itself instead of
  against its raw input - is worth a skeptical second look anywhere else
  validation logic exists (e.g. `validateSourceSections()`, added last run,
  does validate against raw extracted URLs rather than a re-derived value,
  so it doesn't share this specific flaw, but a fresh pair of eyes on it
  wouldn't hurt).

### Three real bugs found by re-reading `src/lib/*.ts` against its own doc comments and the real content files - fixed 2026-08-10 (intensive run)

Every "Required"/"Nice-to-have" capability was already shipped and the
content-accuracy audit series had reached the diminishing-returns conclusion
recorded in the last several entries, so this run continued the pattern from
the prior two ("dead validation check", "source-link extraction bugs"):
critically re-read library code against its own claims and against the real
`content/*.md` data, rather than re-verifying a score via WebSearch. Found
three real, previously-unnoticed bugs:

1. **`extractSection()` (`src/lib/notes.ts`) silently dropped a lead-in
   sentence whenever a note section mixed prose and a bullet list.** The
   function built two buffers (`paragraph`, `bullets`) but returned only one
   - bullets unconditionally won when both were non-empty. `content/index.md`'s
   "How to use the reference" section is exactly this shape: an intro line
   ("Each competition page contains:") followed by six bullets. Verified live
   on the home page: readers saw six disconnected fragments ("a concise
   introduction;", "a champions summary;"...) with no lead-in sentence, in
   both languages (the Croatian `hr/index.astro` hand-translation has the
   same gap, since it mirrors the same content shape). `tests/unit/notes.test.ts`'s
   10 existing cases tested "bullets only" and "paragraph only" separately,
   never the mixed case that actually occurs in the real content.
   **Fix:** `NoteSection` gained an optional `intro?: string` field; when a
   section has both a leading paragraph and bullets, both are now returned
   instead of the paragraph being discarded. `EditorialNotes.astro` renders
   `section.intro` (when present) as a `<p class="notes__intro">` above the
   list, with its own small bottom margin so it doesn't run into the list.
   `hr/index.astro`'s hand-translated section gained the matching Croatian
   sentence ("Svaka stranica natjecanja sadrži:"). 2 new Vitest cases
   (mixed-shape section keeps its intro; a bullets-only section leaves
   `intro` undefined); the English and Croatian home-page Playwright cases
   now also assert the intro sentence is visible.

2. **`editionTeams()` (`src/lib/editions.ts`) never split Golden Boot's
   "; "-separated joint-team ties, breaking the Team filter for those rows.**
   `content/golden-boot.md`'s "Team" column legitimately holds values like
   `"Bulgaria; Russia"` (1994, Stoichkov/Salenko's joint top-scorer award)
   and the six-way-tie placeholder `"Multiple"` (1962, 1960, 1992, 2012,
   2024). `editionTeams()` added the whole cell value as one string, so the
   Team filter - one of the filters `docs/WEBSITE_REQUIREMENTS.md` explicitly
   requires - had no standalone "Russia" option; a reader could never find
   Oleg Salenko's 1994 award by filtering on "Russia" (only the compound
   "Bulgaria; Russia" surfaced it, alphabetized under B), and "Multiple"
   leaked into the dropdown as a nonsensical filter value.
   `src/lib/compare.ts`'s own doc comment already named this exact data shape
   as the reason Golden Boot/Ballon d'Or are excluded from the country-compare
   feature - that reasoning was never carried over to fix the shared
   `editionTeams()` the Golden Boot page's own filter actually uses.
   **Fix:** `editionTeams()` now splits each team-holding cell's value on
   `;` and adds each trimmed name individually, and a new `TEAM_TIE_PLACEHOLDER`
   check drops the "Multiple" too-many-to-name placeholder from the team
   list. 2 new Vitest cases (a "; "-joint tie splits into two distinct teams;
   "Multiple" is excluded). Verified in the actual `pnpm build` output:
   `<option value="Russia">` and `<option value="Bulgaria">` now both exist
   on the Golden Boot page, `<option value="Bulgaria; Russia">` and
   `<option value="Multiple">` do not, and the row's `data-teams` attribute
   is correctly `"Bulgaria|Russia"`.

3. **`distinctHosts()` (`src/lib/editions.ts`) offered Copa América's
   "Home-and-away" host placeholder as a filterable "country".**
   `src/lib/quiz.ts` already defines `NOT_A_HOST` (`/home-and-away|no host|not held/i`)
   specifically because Copa América's 1975/1979/1983 rows record
   "Home-and-away" in the host cell (no single host - a two-legged final) -
   but that exclusion was only ever wired into the quiz's own question
   builder, not into the shared `distinctHosts()` that every competition
   page's actual Host filter dropdown uses. Lower severity than #1/#2 (it
   didn't produce wrong results - selecting it correctly showed those three
   rows - just a non-country value cluttering a country filter). **Fix:**
   moved `NOT_A_HOST` to `src/lib/editions.ts` as a shared, exported constant
   (closing the exact "two lists that can silently disagree" risk this
   project's PDF-manifest fix on 2026-08-08 was written to avoid elsewhere);
   `quiz.ts` now imports it instead of keeping its own copy; `distinctHosts()`
   excludes it. 1 new Vitest case. Verified in the build output: the Copa
   América page's `data-host="Home-and-away"` row attribute (used by the Year
   filter's row matching) is untouched, but the host `<select>` no longer
   offers a "Home-and-away" option.

**Tests:** 5 new Vitest cases total (182/182, up from 177). `pnpm lint` - 0
errors/0 warnings/0 hints. `pnpm build` - 23 pages, unchanged page count.
No `content/*.md` file changed, so `pnpm check:pdfs` and `pnpm check:perf`
both pass unchanged with no PDF regeneration needed. Full 314-case Playwright
suite passing (unchanged count - these are filter/rendering fixes, not new
UI surface).

**Left for a future pass:**
- This run closes every concrete "worth a skeptical second look" candidate
  named by the prior two runs. A further pass in this vein would mean
  picking a fresh `src/lib/*.ts` module (e.g. `homeCards.ts`, `i18n.ts`,
  `offlineCache.ts`) and testing it against real edge-case content rather
  than trusting existing test fixtures, the same method used here.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

### Fixed the Golden Boot Winner/Player filter for joint-tie editions - same bug class as the Team filter, one column over (2026-08-10, intensive run)

Followed up on this run's suggested next step (a fresh look at `homeCards.ts`,
`i18n.ts`, `offlineCache.ts`) by first spawning a research agent to weigh that
against other candidates; it found a stronger, concrete lead instead: the
exact bug class fixed for `editionTeams()`/the Team filter earlier today
(2026-08-10 entry above) was still present in `distinctWinners()` and the
Winner/Player filter, one column over.

`content/golden-boot.md`'s "Player(s)" column legitimately holds `"; "`-joined
joint-tie values for 7 of its 40 rows across both tables (World Cup 1962,
1994; EURO 1960, 1964, 1992, 2012, 2024) - e.g. 1962's six-way tie
`"Garrincha; Vavá; Leonel Sánchez; Flórián Albert; Valentin Ivanov; Dražan
Jerković"`. `distinctWinners()` (`src/lib/editions.ts`) added each cell as one
opaque string, so the Winner/Player `<select>` on the Golden Boot page (both
languages) offered the whole compound string as a single option instead of
each name - confirmed in the built `dist/competitions/golden-boot/index.html`
before the fix. A reader could never filter to just "Vavá" or "Oleg Salenko";
worse, filtering to "Cristiano Ronaldo" alone silently dropped his 2012 tied
EURO award and surfaced only his solo 2020 one, since the compound 2012 string
never equality-matched the plain "Cristiano Ronaldo" option value.
`tests/unit/editions.test.ts`'s `distinctWinners` block never tested a
`;`-joined value, mirroring the exact coverage gap that let the Team-filter
version of this bug through.

**Fix:** `distinctWinners()` now splits each winner cell on `;`, trims, and
excludes placeholder winners ("Not awarded" etc.) per split value - mirroring
`editionTeams()`'s pattern, rewritten as a `Set` build + one alphabetical
sort (previously a separate `seen` Set plus an array, doing the same
dedupe/sort in a more roundabout way). `TournamentTable.astro`'s row markup
now writes `data-winner` as a `|`-joined list of the split, trimmed names
(matching `data-teams`'s existing pipe-separated convention) instead of the
raw unsplit cell value, and the client-side filter match changed from
`row.dataset.winner === winner` to `(row.dataset.winner || '').split('|').includes(winner)`
- again mirroring the Team filter's own matching logic exactly. Non-Golden-Boot
tables are unaffected: none of their Winner/Champion cells contain `;`, so
splitting is a no-op and `data-winner` renders byte-identical to before.

**Tests:** 2 new Vitest cases (`distinctWinners` splits a six-way and a
two-way joint tie into individual names; a player who won both solo and
tied in different editions, e.g. Cristiano Ronaldo's 2012 tie/2020 solo
EURO awards, is listed once) - 184/184, up from 182. `pnpm lint` - 0
errors/0 warnings/0 hints. `pnpm build` - 23 pages, unchanged page count.
Verified in the rebuilt `dist/competitions/golden-boot/index.html`: `<option
value="Vavá">` now exists standalone, the old compound-string option is
gone, and the 2012 EURO row's `data-winner` now contains `Cristiano Ronaldo`
as one of six pipe-separated names (previously only exact-matched the full
compound string). Full Playwright suite (`accessibility-table-states.spec.ts`'s
golden-boot cases specifically, plus a full run) passing - the "no-results"
combo finder in that spec reads live `<option>`/`data-winner` values off the
page rather than hardcoding them, so it adapted to the new per-name options
without any test changes needed.

**Left for a future pass:**
- No further `;`-joined-value gaps are known to remain: `editionTeams()` (Team
  filter) and `distinctWinners()` (Winner filter) are now the only two
  functions that read Golden Boot's tie-holding columns for filter options,
  and both split correctly.
- The `homeCards.ts`/`i18n.ts`/`offlineCache.ts` "fresh module" suggestion from
  the prior entry is still open if a future run wants it - this run's research
  pass read all three against real content and found them correct and already
  well-tested (`i18n.test.ts`, `offlineCache.test.ts`), aside from `homeCards.ts`
  itself still lacking a dedicated unit test file (only exercised indirectly
  via the home-page Playwright specs).

### Closed the `homeCards.ts` test-coverage gap named by the prior entry - added 2026-08-10 (intensive run)

Followed up on the standing "fresh module" suggestion: `homeCards.ts` was the
one library module with no dedicated unit test file, only ever exercised
indirectly through the home-page Playwright specs.

Before writing tests, re-checked `buildChampionsSummary()` (`src/lib/editions.ts`)
against the real Golden Boot content as a candidate bug, since it groups each
edition's raw `edition.winner` cell value into the champions leaderboard
without splitting `"; "`-joined joint ties the way `distinctWinners()`/
`editionTeams()` do for their filters - e.g. the EURO table's 1962/2012/2024
multi-player ties. This looked like the same bug class fixed three times
already today, and would have made Cristiano Ronaldo's EURO 2012 tie +
2020 solo award count as two champions instead of one two-time champion.
**Turned out not to be a bug**: both `golden-boot.astro` pages (English and
Croatian) pass the Champions Summary component an explicit, deliberate
description - "Tied top scorers are counted as the joint entry shown in the
table, exactly as the source lists them." - so grouping by the whole
compound tie string is the documented, intended behavior for this specific
leaderboard, unlike the Team/Winner *filters* (which do need per-name
splitting so a reader can filter to one name). Reverted the speculative
change before it was committed; no `src/lib/editions.ts` change went in this
run. Worth recording so a future pass doesn't re-investigate the same lead.

Wrote `tests/unit/homeCards.test.ts` (6 new Vitest cases) for `buildHomeCards()`:
card order/count matches `HomeCompetitions`, each card's `editions`/`topChampion`
come from its own competition data (not a shared default), `topChampion` is
`undefined` when a competition has no champions yet, `statLabel` ("Most
awards") is set only for the two individual-award cards (Ballon d'Or, Golden
Boot) and unset for the four team competitions, English/Croatian locales
swap title/blurb text without changing the underlying numbers, and every
card gets a distinct accent color plus a `withBase()`-built href. Testing
`buildHomeCards()` directly (rather than only through Playwright) required a
`vi.mock('astro:content', ...)` stub, since `homeCards.ts` also imports
`loadCompetition` from `./competition` at module scope for
`loadHomeCompetitions()`, and that module imports `astro:content` - even
though `buildHomeCards()` itself never touches it. That's the reason no one
had written this test file before.

**Tests:** 190/190 (up from 184 - the 6 new `homeCards.test.ts` cases).
`pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages, unchanged.
No `src/lib/*.ts` or `content/*.md` file changed, so `pnpm check:pdfs` and
`pnpm check:perf` both pass unchanged and the full Playwright suite is
unaffected.

**Left for a future pass:**
- `i18n.ts` and `offlineCache.ts` were already confirmed correct and tested
  in the prior run; `homeCards.ts` is now the last of that trio covered too.
  A further "fresh module" pass would mean picking a different `src/lib/*.ts`
  file not yet covered by this method (e.g. `jsonLd.ts`'s `buildChampionsItemList`
  already has a test file, but `competition.ts`'s `loadCompetition`/`loadPageMeta`
  and `countries.ts`'s `summaryGroupFor` have never been read against real
  content the way `editions.ts` was in the last several runs).
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

### Closed the `competition.ts`/`countries.ts`/`url.ts` test-coverage gap named by the prior entry - added 2026-08-10 (intensive run)

The prior run's "Left for a future pass" note named `competition.ts`'s
`loadCompetition()`/`loadPageMeta()`/`firstParagraph()` and `countries.ts`'s
`summaryGroupFor()` as the two `src/lib/*.ts` modules never read against real
content the way `editions.ts` was in several earlier runs (which found three
real bugs). This run closed that gap, plus a third module found the same way
while auditing: `url.ts`'s `withBase()`/`absolutePageUrl()`, used on every
page for hrefs/canonical URLs/JSON-LD but likewise never covered by a
dedicated test.

Traced `firstParagraph()` (the private helper behind both `loadCompetition()`
and `loadPageMeta()`'s `intro` field) against every shape actually present in
`content/*.md`: a single-line paragraph, a hard-wrapped multi-line paragraph
(joined with spaces - matches `content/quiz.md`'s wrapped intro), leading
blank lines before the first heading, and two consecutive heading lines with
no paragraph between them (matches `content/golden-boot.md`'s "# Golden Boot
Winners" immediately followed by "# FIFA World Cup top scorers" as its next
table heading, no intro paragraph of its own between them) - all read
correctly. No bug was found in `firstParagraph()` itself; the function
matches its doc comment.

`url.ts`'s `withBase()` has a `|| '/'` fallback (line 8) that turned out to be
dead code once traced: `clean` is built as `path.startsWith('/') ? path :
'/' + path`, so it always starts with `/` and the concatenated result can
never be an empty string - confirmed by a test asserting the empty-string and
root-path inputs still both resolve to `'/'` via the `clean` branch, not the
fallback. Left as-is rather than removed: it is harmless, documents the
author's intent defensively, and removing it is a separate cleanup with no
behavioral difference, not a bug fix.

New `tests/unit/competition.test.ts` (12 cases, using the same
`vi.mock('astro:content', ...)` stub pattern `tests/unit/homeCards.test.ts`
established) covers `loadPageMeta()`'s front-matter/intro/notes wiring, the
"entry not found" error message for both `loadCompetition()` and
`loadPageMeta()`, a non-default `editionsHeading`, the "table not found"
error message, `allowDuplicateYears` actually suppressing the duplicate-year
validation error it's meant to (and the same table still throwing without
it), and one live integration check against the real `docs/SOURCES.md` file
(a real heading resolves sources, a nonexistent one returns `[]` rather than
throwing) so the `sourcesRaw` wiring itself is exercised, not just mocked.
New `tests/unit/countries.test.ts` (4 cases) pins the West Germany/Germany
merge (case-insensitive, trimmed), that the other three historical-successor
pairs named in `AGENTS.md` (Soviet Union/Russia, Czechoslovakia/Czechia,
Yugoslavia/successors) are deliberately *not* grouped, and that any other
name passes through as its own group with original display casing preserved.
New `tests/unit/url.test.ts` (5 cases) covers `withBase()`'s leading-slash
normalization and the dead-fallback finding above, plus `absolutePageUrl()`
against both a configured `site` and the local-dev fallback (mirrors the
`site ?? url` pattern already used by `BaseLayout.astro`/`sitemap.xml.ts`).

**Tests:** 211/211 (up from 190 - 21 new cases across the three new files).
`pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages, unchanged.
`pnpm check:perf` - all 27 pages within the 300 KB budget (heaviest:
`hr/records` at 232.0 KB, unchanged). No `content/*.md` file changed, so
`pnpm check:pdfs` and the full Playwright suite are unaffected.

**Left for a future pass:**
- Every `src/lib/*.ts` module now has a dedicated test file. A further "fresh
  module" pass would need to look at component-level coverage instead (e.g.
  confirming `EditorialNotes.astro`'s `intro` rendering, added alongside the
  `notes.ts` fix a few runs back, has explicit Playwright assertions beyond
  "is visible" - flagged as lower-confidence and unverified during this run's
  scoping, worth a quick look before treating it as a real gap).
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

### Accessibility: first-ever automated WCAG scan of the "On this day" widget's exact-match states - added 2026-08-11 (intensive run)

This run first ran down the prior entry's own flagged candidate -
`EditorialNotes.astro`'s `intro` rendering - and confirmed it is **not** a
real gap: both `tests/e2e/mobile.spec.ts` "How to use the reference" cases
(English `page.getByText('Each competition page contains:')` at line ~907,
Croatian `page.getByText('Svaka stranica natjecanja sadrži:')` at line ~1004)
already assert the intro paragraph's actual text, not just heading
visibility. No code or test change was needed there; recorded here so a
future run doesn't re-open it a second time.

Every required/nice-to-have capability was already shipped, content-accuracy
had reached its own diminishing-returns point (every table double-audited),
performance and PDF freshness both check out clean (`pnpm check:perf`,
`pnpm check:pdfs`), and this environment's egress policy still blocks direct
fetches to source domains (confirmed again this run: `curl` to
en.wikipedia.org and rsssf.org both fail with a 403 CONNECT-tunnel error), so
source-link liveness remains off the table. Went looking for a genuinely new
angle instead and found one: `tests/e2e/accessibility.spec.ts`'s sitewide
automated axe sweep scans every page using **whatever the real calendar date
is when the suite runs** - which means the "On this day" widget
(`src/components/OnThisDay.astro`) has two structurally different DOM states
(an exact-final-date match: hint hidden, one-or-more result `<li>`s; the
fallback archive pick: hint visible, exactly one `<li>`) and the sweep has
essentially only ever exercised the fallback state, since a specific
competition final or Ballon d'Or ceremony lands on only a couple dozen of the
year's 365 days. `tests/e2e/mobile.spec.ts` already has hand-written content
assertions for both states (added when the widget shipped), but none of them
ran through axe.

**Fix:** new tests appended to `tests/e2e/accessibility.spec.ts`, reusing its
existing `AxeBuilder`/`formatViolations` setup. `page.clock.setFixedTime()`
(the same pattern `mobile.spec.ts` already uses for this widget) pins the
browser to two known exact-match dates - 30 July (the two-entry state: both
the 1930 and 1966 World Cup finals render as separate `<li>`s) and 12
December (the Ballon d'Or award-wording branch, "won the award" instead of
"won the final") - then scans just `.on-this-day` (`.include()`, keeping the
scan focused on the widget rather than re-running the whole-page sweep) on
both the English and Croatian home pages, under both light and dark color
schemes (8 new cases total). **No violations found** in any of the 8
combinations - this is a coverage-gap closure, not a bug fix, matching the
same "closes a concrete, previously-unexercised DOM state" shape as the
`TournamentTable`/theme-toggle/print-media audits earlier in this file,
several of which did turn up real bugs but this one didn't.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (211/211) and `pnpm lint` is clean (0 errors/0 warnings/0 hints).
Full Playwright suite: 322/322 (up from 314 - the 8 new cases), including the
unchanged whole-page WCAG sweep and the existing hand-written "On this day"
content assertions. `pnpm build` unchanged (23 pages); `pnpm check:perf`
(all pages within the 300 KB budget, heaviest unchanged at `hr/records`
232.0 KB) and `pnpm check:pdfs` (all six PDFs up to date) both pass - no
`content/*.md` file changed this run.

**Left for a future pass:**
- With the "On this day" widget's exact-match states now covered, no other
  component is known to have a similarly date/state-gated DOM that the
  sitewide sweep might be silently skipping - worth a quick scan for that
  pattern specifically (any component whose rendered structure depends on
  the build/request date or another external condition, not just a URL
  filter param) before assuming there is nothing left to check there.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment, reconfirmed again this run)
  candidates are unchanged.

### Quality pass: theme-token single-source-of-truth refactor, plus a regression test for the drift class that already bit `--danger` - added 2026-08-11 (intensive run)

Followed up on the prior entry's own flagged lead ("no other component is
known to have a similarly date/state-gated DOM... worth a quick scan for
that pattern"). A scan of every `Date`/`new Date()` call site in
`src/components/*.astro` and `src/pages/**/*.astro` confirmed that lead is
closed - `References.astro`, `about/sources.astro` (both locales) and
`Footer.astro` only format text into an unchanged element, none branch DOM
*structure* the way `OnThisDay.astro` does. That scan surfaced a different,
real gap instead: `src/styles/global.css` resolved its color tokens
(`--bg`, `--text`, `--danger`, etc.) via **four separately hand-maintained
blocks** - the `:root` light default, the `@media (prefers-color-scheme:
dark)` block, `:root[data-theme='light']`, and `:root[data-theme='dark']` -
each repeating the same ~11 literal hex values. The file's own comment on
`--danger` already documents that this exact duplication caused a real bug
once: a contrast fix (the WCAG-failing ~2.65:1 red) landed in the
media-query block but not the matching `[data-theme='dark']` block, so a
reader who let the OS pick dark mode got the fixed color while a reader who
explicitly clicked the toggle to dark did not. Test coverage for the two
*mechanisms* was asymmetric in the same way: the sitewide axe sweep
(`accessibility.spec.ts`) only ever emulates `prefers-color-scheme`, while
`accessibility-theme-toggle.spec.ts` only drives the live `data-theme` click
path on the English/Croatian home pages - nothing asserted the two
mechanisms actually produce the *same* colors anywhere.

**Fix:** `src/styles/global.css`'s `:root` block now defines each theme's
values exactly once, as `--light-*`/`--dark-*` constants (e.g. `--light-bg`,
`--dark-bg`). The three resolution blocks (media-query default,
`[data-theme='light']`, `[data-theme='dark']`) now only ever assign
`var(--light-*)`/`var(--dark-*)` to the real tokens components read - never
a literal color - so a future contrast fix can miss a block by omission
(still possible, CSS has no cross-block `@media`+attribute-selector "OR")
but can no longer silently apply to one block's *copy* of a value and leave
another's stale, which is what actually happened before. New
`tests/e2e/theme-token-parity.spec.ts` (2 cases) reads
`getComputedStyle(document.documentElement)` for all 12 tokens under two
independent browser contexts per case - OS `colorScheme: 'dark'` with no
toggle interaction vs. OS `colorScheme: 'light'` with the toggle clicked to
force `data-theme='dark'` (and the mirror pair for light) - and asserts the
two token sets are identical. This test would have caught the original
`--danger` drift; it's a regression guard for the drift *class*, not a
one-off fix.

**Tests:** Vitest unchanged (211/211 - no `src/lib/*.ts` logic changed).
`pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages,
unchanged. Full Playwright suite: 324/324 (up from 322 - the 2 new parity
cases), including the existing whole-page WCAG sweep and the theme-toggle
click-path suite, confirming the refactor is computed-value-identical to
the pre-refactor CSS (same colors, same specificity resolution order) for
every page exercised. `pnpm check:perf` (all pages within the 300 KB
budget, heaviest unchanged at `hr/records` ~233 KB) and `pnpm check:pdfs`
(all six PDFs up to date) both pass - no `content/*.md` file changed this
run.

**Left for a future pass:**
- Extend `accessibility-theme-toggle.spec.ts`'s live-click axe coverage
  beyond the home page to a representative competition page and `/quiz`,
  so contrast-sensitive dynamic states (table `is-winner` highlighting,
  quiz `is-correct`/`is-incorrect`) get scanned via the actual toggle click
  path, not only via `colorScheme` emulation on the main sweep. Scoped and
  ready to pick up; not done this run to keep this pass focused on the
  token-duplication fix itself.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

### Accessibility: theme-toggle live-click coverage extended to a competition page and `/quiz`, plus a real dark-mode contrast bug it found and fixed - added 2026-08-11 (intensive run)

Closed the exact gap the prior entry's "Left for a future pass" note named:
`accessibility-theme-toggle.spec.ts` had only ever driven the real
click-then-`data-theme` path against the home page, which has neither a
`TournamentTable` (`is-winner` highlighted cells) nor a quiz card
(`is-correct`/`is-incorrect` feedback) - so those two contrast-sensitive
dynamic states had only ever been scanned via `accessibility.spec.ts`'s
`colorScheme` emulation, never via an actual toggle click. Two new test
cases: `/competitions/world-cup` (chosen as the one table with the full
winner/year/host/team/sort filter set, same "representative table"
reasoning `accessibility-table-states.spec.ts` already uses) clicks the
toggle to dark, confirms an `is-winner` cell is visible, and runs axe both
ways; `/quiz` clicks the toggle to dark, answers two choice cards (one right,
one deliberately wrong, same pattern `accessibility-quiz-states.spec.ts`
already uses) to produce both feedback classes, and runs axe.

**The World Cup case passed; the quiz case did not** - a real
`color-contrast` violation, not a flake: `#quiz-restart` ("Restart quiz")
rendered black text (`#000000`) on the dark theme's `#1e2b3d` background
(1.46:1, WCAG AA requires 4.5:1). Root cause: `#quiz-restart` was the one
interactive button in the codebase missing an explicit `color` declaration -
every other button (`.quiz-card__check`, `.filters__reset`, `.compare__swap`,
`ThemeToggle`'s own button) sets `color: var(--text)` or
`var(--accent-contrast)` explicitly, but `#quiz-restart` only set
`background: var(--bg-subtle)`, leaving text color to the browser's native
`ButtonText` default. That default happens to track Playwright's *emulated*
`colorScheme` (so the existing `colorScheme: 'dark'` test in
`accessibility-quiz-states.spec.ts` never saw a problem - the OS-level dark
preference gave the button light-on-dark UA colors for free) but does
**not** track this site's own click-driven `data-theme` attribute, which
only repaints CSS custom properties, not native form-control defaults - so a
reader who explicitly clicks the toggle (rather than relying on OS
preference) got the broken black-on-dark button. This is the same root
cause class the immediately preceding entry's regression test targeted -
OS-emulation coverage and real-click coverage silently diverging - just
surfacing as a genuine WCAG violation instead of a token-value mismatch, and
in exactly the place that entry's own scan didn't look (an unstyled UA
default, not a CSS custom property).

**Fix:** added `color: var(--text);` to `#quiz-restart` in both
`src/pages/quiz.astro` and `src/pages/hr/quiz.astro` (the Croatian page has
its own copy of the same rule) - matching every other button's existing
pattern, not a new one. No other button in the codebase was missing `color`
(checked every `cursor: pointer` rule site-wide).

**Tests:** the two new live-click cases (2, both now passing) plus the
existing 3 theme-toggle cases: 5/5. Full Playwright suite: 326/326 (up from
324). Vitest unchanged (211/211 - no `src/lib/*.ts` logic changed).
`pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages,
unchanged. `pnpm check:perf` and `pnpm check:pdfs` both pass - no
`content/*.md` file changed this run (a component-CSS fix, not editorial
content).

**Left for a future pass:**
- The other named lead from the prior entry - the standing content-accuracy
  (third-pass, low-yield) and source-link liveness (infeasible in this
  environment) candidates - is unchanged.
- No other live-click/OS-emulation divergence is known, but this is now the
  second time that exact class of bug has surfaced in two consecutive runs
  (a CSS-token duplication, then a missing-`color` native-control default) -
  worth keeping in mind as a recurring risk category if a future pass adds
  more toggle-adjacent or native-form-control-heavy UI.

### Content-accuracy pass: FIFA World Cup Third/Fourth-place - first-ever second independent cross-check, no discrepancies - added 2026-08-11 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, so per this routine's fallback instruction this
continued the standing content-accuracy series. Picked the one lead the
file's own "Left for a future pass" notes had named repeatedly but never
closed: the "Third"/"Fourth / other semifinalist" columns in
`content/fifa-world-cup.md` had only ever had their first audit pass
(2026-08-04) - every other core column pair on the World Cup page
(Champion/Runner-up/Final-score, Host(s)/Teams, Final date) already had a
second independent cross-check on record, but Third/Fourth did not, a gap
first flagged on 2026-08-08 and repeated unresolved in several entries
since.

Re-verified all 23 editions (1930-2026) via three parallel WebSearch passes
split by era (1934-1962, 1966-1994, 1998-2022), plus two dedicated searches
for the 1930 (no third-place match played) and 1950 (final round-robin
group table) format edge cases and one for the 2026 bronze match,
deliberately drawing from a source mix distinct from the first pass (ESPN,
plus.fifa.com, athlet.org, beIN Sports, Liquisearch): this pass used NBC
Bay Area, Yahoo Sports, soccergraph.com, chaseyoursport.com,
getmoresports.com, RSSSF, sport-histoire.fr, Grokipedia, and Al Jazeera.

**No discrepancies found across any of the 23 editions.** Every row already
on the page - including every third-place match decided by a routine
scoreline and the two structural edge cases - matched independently. 1930's
United States/Yugoslavia ranking (no match was ever played; FIFA's later
technical-committee ranking is the only source, and remains a genuine
historian's dispute rather than a settled fact - already the framing used
in the page's own "Editorial notes") and 1950's Sweden/Spain positions
(re-derived from the full four-team final-group points table: Uruguay 5,
Brazil 4, Sweden 2, Spain 1) were both independently reconfirmed rather
than merely trusted. The 2026 bronze match (England 6-4 France) was also
reconfirmed by this distinct source mix, matching the row already on the
page and the earlier 2026-08-04 result-specific audit.

See `docs/SOURCES.md`'s new "Third/fourth-place second independent
cross-check" entry under FIFA World Cup for the full citation list.
`content/fifa-world-cup.md`'s `lastReviewed` moved to 2026-08-11; `status`
stays `review` (secondary sources, same reasoning as every prior
secondary-sourced audit in this file). No table data changed - the only
file changes are the `lastReviewed` bump and the new source citations.
Since this page's `lastReviewed` date is pinned by an exact-match
Playwright assertion (`tests/e2e/mobile.spec.ts`), that test's expected
value was updated alongside the content change (2026-08-09 -> 2026-08-11).

Bumping `lastReviewed` changed `content/fifa-world-cup.md`'s SHA-256, which
`pnpm check:pdfs` correctly flagged as making `public/downloads/world-cup.pdf`
(and, since `docs/SOURCES.md` is a shared dependency of every competition
PDF, all six PDFs) stale. Regenerated all six PDFs and the manifest via
`PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`; `pnpm
check:pdfs` now passes cleanly.

This closes the "second independent cross-check" series for every core
column on the FIFA World Cup page (Champion/Runner-up/Final-score,
Host(s)/Teams, Final date, and now Third/Fourth) - the World Cup joins Copa
América (whose Format column got the same closing treatment on 2026-08-08)
as fully covered by at least two independent passes on every column its
table tracks.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (211/211) and `pnpm lint` is clean (0 errors/0 warnings/0 hints).
`pnpm build` - 23 pages, unchanged. Full Playwright suite: 326/326, with the
one intentional update noted above (the World Cup page's pinned
`lastReviewed` date). `pnpm check:perf` (all pages within the 300 KB
budget, heaviest unchanged at `hr/records` ~234.8 KB) and `pnpm check:pdfs`
(all six PDFs regenerated and up to date) both pass.

**Left for a future pass:**
- EURO's "Other semifinalist" / "Other semifinalist / fourth" columns and
  Nations League's "Third"/"Fourth" columns are each still on only their
  first audit pass (2026-08-04), and Copa América's third/fourth-place data
  is still on its own first pass too (2026-08-02, a different column from
  the Format column that got its second pass on 2026-08-08) - the same gap
  this run closed for World Cup is the natural next candidate, one
  competition at a time.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

## Known caveats

- World Cup, EURO, Nations League, Copa América, Ballon d'Or, Golden Boot,
  Records and Timelines, Compare National Teams, and the Family Quiz all have
  live pages now.
- Historical names appear as distinct winner-filter entries by design.
- First-ever Pages deploy can hang in GitHub's `updating_pages` provisioning and
  time out; re-running the deploy clears it (it did here).

See also `IMPLEMENTATION_NOTES.md` (decisions/testing detail) and
`docs/ADDING_CONTENT.md` (how to add or edit content).
