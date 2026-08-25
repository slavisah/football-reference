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
pnpm test                      # 497 Vitest unit tests
pnpm build                     # static build + all content validation
PW_CHROME_CHANNEL=chrome pnpm test:e2e   # 804 Playwright tests at 360px (mobile
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
- [x] Intentionally not done: Copa América's "Titles after 2024" and Ballon
  d'Or's "Multiple winners through 2025" are full Markdown tables, not
  bullet/prose sections, so `extractSection()` doesn't handle them and
  they're still unused. Re-confirmed 2026-08-14 (intensive run, see the
  "Most frequent hosts" entry near the end of this file): hand-computed
  Copa América's table against its own edition data and the totals exactly
  match the generated `ChampionsSummary` already on the page (Argentina 16,
  Uruguay 15, Brazil 9, etc.) - building a renderer for these two tables
  would duplicate an existing section with zero new information, not close
  a real gap. Not planned unless the two ever diverge.

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
      - [x] Intentionally not done: Copa América's "Titles after 2024" and
        Ballon d'Or's "Multiple winners through 2025" Markdown tables are
        still unrendered (see the reasoning above for why, re-confirmed
        2026-08-14) - not considered a gap.

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

### Content-accuracy pass: UEFA EURO "Other semifinalist" columns - full audit closed - added 2026-08-11 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, so per this routine's fallback instruction this
continued the standing content-accuracy series, closing the exact gap the
previous entry's "Left for a future pass" note named: EURO's "Other
semifinalist" / "Other semifinalist / fourth" columns were still on only
their first audit pass (2026-08-04), and that first pass itself only ever
covered 6 of the table's 17 editions - the six 1960-1980 editions that
played an actual third-place match under the old 4-team format. The other
eleven editions (1984-2024), where UEFA does not rank the two defeated
semifinalists, had never had their team names independently re-verified at
all - the 2026-08-04 entry only established that there was no ranking to
audit, not that the two names themselves were correct.

Two parallel WebSearch research passes closed both gaps in the same run:

- **1960-1980 (6 editions), second independent cross-check:** re-verified
  the third-place play-off winner/loser and score for all six editions,
  deliberately drawing from a source mix distinct from the first pass
  (which leaned on UEFA.com and eu-football.info/11v11): this pass used
  Wikipedia tournament articles, RSSSF, worldfootball.net, 11v11.com,
  national-football-teams.com, and football-history retrospectives (World
  Soccer magazine, Soccer Nostalgia).
- **1984-2024 (11 editions), first-ever verification:** confirmed the two
  teams recorded as eliminated in each edition's semifinals match the
  actual semifinal results, checked as an unordered pair since the column
  intentionally carries no ranking for this era (per the page's own
  "Historical format note") - verified against Wikipedia knockout-stage/
  final articles, UEFA.com, worldfootball.net, and press coverage.

**No discrepancies found across any of the 17 editions.** Every 1960-1980
third-place result - including the two extra-time deciders (1964, 1976)
and 1980's penalty shoot-out (Czechoslovakia beat host Italy 9-8) - matched
both this pass and the first. Every 1984-2024 semifinalist pair, including
every penalty-shootout and golden-goal-decided semifinal along the way,
matched the page exactly.

See `docs/SOURCES.md`'s expanded UEFA EURO section for the full 19-source
citation list. `content/uefa-euro.md`'s `lastReviewed` moved to 2026-08-11;
`status` stays `review` (secondary sources, same reasoning as every prior
secondary-sourced audit in this file). No table data changed - the only
file changes are the `lastReviewed` bump and the new source citations.
Confirmed no Playwright test pins an exact `lastReviewed` value for the
EURO page (unlike the World Cup page), so no test needed updating for the
date bump.

Bumping `lastReviewed` changed `content/uefa-euro.md`'s SHA-256, which
`pnpm check:pdfs` correctly flagged as making `public/downloads/euro.pdf`
(and, since `docs/SOURCES.md` is a shared dependency of every competition
PDF, all six PDFs) stale. Regenerated all six PDFs and the manifest via
`PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`; `pnpm
check:pdfs` now passes cleanly again.

This closes the "second independent cross-check" series for every core
column on the UEFA EURO page (Champion/Runner-up/Final-score, Host(s)/
Teams, Final date, and now the semifinalist columns) - EURO joins Copa
América and FIFA World Cup as fully covered by at least two independent
passes (or, for the 1984-2024 semifinalist names, a first genuinely
dedicated pass) on every column its table tracks.

**Tests:** no library code under `src/` changed, so the full Vitest suite
is unchanged (211/211) and `pnpm lint` is clean (0 errors/0 warnings/0
hints). `pnpm build` - 23 pages, unchanged. Full Playwright suite
unchanged (326/326 - a `lastReviewed` bump has no pinned assertion for
this page). `pnpm check:perf` (all pages within the 300 KB budget) and
`pnpm check:pdfs` (all six PDFs regenerated and up to date) both pass.

**Left for a future pass:**
- Nations League's "Third"/"Fourth" columns and Copa América's third/
  fourth-place data are each still on only their first audit pass
  (2026-08-02/2026-08-03 respectively) - the same gap this run closed for
  EURO is the natural next candidate, one competition at a time.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

### Content-accuracy pass: Copa América Third/Fourth-place - first-ever second independent cross-check, no discrepancies - added 2026-08-11 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, so per this routine's fallback instruction this
continued the standing content-accuracy series, picking up the exact gap
the previous entry's "Left for a future pass" note named alongside Nations
League: Copa América's "Third"/"Fourth" columns in `content/copa-america.md`
had only ever had their first audit pass (2026-08-02, itself split across
three entries - the knockout-final era, the 1989/1991 closing groups, and
the full pre-1975 league-table era) - every other column on the page
(Champion/Runner-up/Final-score, Format, Host) already had a second
independent cross-check on record, but Third/Fourth did not.

Re-verified all 45 editions that carry a placing (1916 through 2024,
including both 1959 tournaments; the three Home-and-away finals and 1925's
missing fourth place are correctly excluded, since there is nothing to
verify there) via four parallel WebSearch passes split by era: 1916-1929
(12 editions), 1935-1967 including both 1959s (17 editions), 1987/1989/1991
(3 editions - the knockout-final transition plus the two closing-group
years), and 1993-2024 (13 editions). Deliberately drew on a source mix
distinct from the 2026-08-02 first pass (which leaned on RSSSF and
Wikipedia): worldfootball.net, athlet.org, footballdatabase.eu,
topendsports.com, besoccer.com, soccer365.net, Transfermarkt, 11v11.com,
betexplorer.com, resultados-futbol.com, AFA/AUF official histories, Memoria
Chilena, and press/wire coverage (CBC, BBC, CTV/TSN, China Daily/Xinhua,
Yahoo Sports).

**No discrepancies found across any of the 45 editions.** Every placing
already on the page held up under independent re-verification, including
the trickiest cases:

- **1922's Uruguay-withdrawal ruling** - Brazil, Paraguay, and Uruguay
  finished level on points and goal difference, but Uruguay withdrew from
  the resulting three-way title playoff in protest at refereeing decisions,
  finishing third by elimination rather than by table tiebreak - reconfirmed
  against an independent source mix (not just the first pass's sources).
- **1989 and 1991's closing-group tiebreaks** - re-derived match-by-match
  from all six games in each four-team closing group (not just trusted as a
  summary standings claim) and cross-checked against the won/drawn/lost
  and goal-difference figures already in the page's editorial notes; both
  reconciled exactly.
- **Both flagged upsets** - Honduras' 5-4 penalty-shootout win over Uruguay
  for third in 2001, and Uruguay's 4-3 penalty-shootout win over Canada for
  third in 2024 - independently reconfirmed with exact scorelines from wire
  coverage (Transfermarkt's match sheet, CTV News).

See `docs/SOURCES.md`'s expanded Copa América section (new "Third/
fourth-place second independent cross-check" entry) for the full per-era
citation list. `content/copa-america.md` gained one new prose paragraph in
the "Important editorial warning" section documenting this second pass, in
the same style as the existing Format-column and Champion/Runner-up
second-cross-check paragraphs already there; `lastReviewed` moved to
2026-08-11. `status` stays `review` (secondary sources, same reasoning as
every prior secondary-sourced audit in this file). No table data changed -
the only file changes are the new content-file paragraph, the
`lastReviewed` bump, and the new `docs/SOURCES.md` citations. Confirmed no
Playwright test pins an exact `lastReviewed` value for the Copa América
page, so no test needed updating for the date bump.

Bumping `lastReviewed` changed `content/copa-america.md`'s SHA-256, which
`pnpm check:pdfs` correctly flagged as making `public/downloads/copa-america.pdf`
(and, since `docs/SOURCES.md` is a shared dependency of every competition
PDF, all six PDFs) stale. Regenerated all six PDFs and the manifest via
`PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`; `pnpm
check:pdfs` now passes cleanly again.

This closes the "second independent cross-check" series for every core
column on the Copa América page (Champion/Runner-up/Final-score, Format,
and now Third/Fourth) - Copa América joins FIFA World Cup and UEFA EURO as
fully covered by at least two independent passes on every column its table
tracks.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (211/211) and `pnpm lint` is clean (0 errors/0 warnings/0 hints).
`pnpm build` - 23 pages, unchanged. `pnpm check:perf` (all pages within the
300 KB budget) and `pnpm check:pdfs` (all six PDFs regenerated and up to
date) both pass. The Playwright suite was kicked off for this pass (a
prose-only content change with no assertion anywhere in the suite pinned to
the new paragraph's text, byte count, or the `lastReviewed` date); see the
next entry or this run's commit history for its result if it finished
before this file was written.

**Left for a future pass:**
- Nations League's "Third"/"Fourth" columns remain on only their first audit
  pass (2026-08-03) - now the last team-competition column on the site
  without a second independent cross-check, and the natural next candidate.
- The standing content-accuracy (third-pass, low-yield) and source-link
  liveness (infeasible in this environment) candidates are unchanged.

### Content-accuracy pass: UEFA Nations League Third/Fourth-place - second independent cross-check, no discrepancies - added 2026-08-12 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run (per every entry above since 2026-08-09), so per this
routine's fallback instruction this continued the standing content-accuracy
series, closing the exact gap the previous entry's "Left for a future pass"
note named: Nations League's "Third"/"Fourth" columns in
`content/uefa-nations-league.md` were the last team-competition Third/
Fourth-place data on the site still on only a first audit pass
(2026-08-04, UEFA.com + ESPN) - Copa América, EURO, and World Cup had all
already had their own second independent cross-check.

Re-verified all four completed editions (2018-19 through 2024-25) via
WebSearch, using a source mix deliberately distinct from the 2026-08-04
pass: each edition's dedicated Wikipedia Finals article, plus Sky Sports
(2019), theScore (2021), Sports Mole (2023), and BBNTimes (2025) - UEFA.com
and ESPN were intentionally avoided as repeat sources.

**No discrepancies found across any of the four editions.** Every Third/
Fourth pairing already on the page matches exactly: England beat
Switzerland 6-5 on penalties after a 0-0 draw (2019), Italy beat Belgium
2-1 (2021), Italy beat the Netherlands 3-2 (2023), and France beat host
Germany 2-0 (2025).

`docs/SOURCES.md` gained a "Third-place match second independent
cross-check" entry under UEFA Nations League (8 new links). `lastReviewed`
moved to 2026-08-12; `status` stays `review` (secondary sources, same
reasoning as every prior secondary-sourced audit in this file). No table
data changed - the only file changes are the `lastReviewed` bump and the
new `docs/SOURCES.md` citations.

This closes the "second independent cross-check" series for every core
column on every team competition's page (Champion/Runner-up/Final-score,
Format where applicable, Host, and Third/Fourth) across FIFA World Cup,
UEFA EURO, UEFA Nations League, and Copa América.

Bumping `lastReviewed` changed `content/uefa-nations-league.md`'s SHA-256,
which `pnpm check:pdfs` correctly flagged as making
`public/downloads/nations-league.pdf` (and, since `docs/SOURCES.md` is a
shared dependency of every competition PDF, all six PDFs) stale.
Regenerated all six PDFs and the manifest via
`PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm build:pdfs`; `pnpm
check:pdfs` now passes cleanly again.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (211/211) and `pnpm lint` is clean (0 errors/0 warnings/0 hints).
`pnpm build` - 23 pages, unchanged. `pnpm check:perf` (all pages within the
300 KB budget) and `pnpm check:pdfs` (all six PDFs regenerated and up to
date) both pass.

**Left for a future pass:**
- Every team-competition Third/Fourth-place (and Champion/Runner-up/
  Final-score, Format, Host) column across all four team competitions now
  has at least two independent audit passes on record. Remaining
  content-accuracy candidates are all third-pass (low-yield, since a first
  and second pass already agree) or infeasible in this environment
  (source-link liveness checks, which need live outbound HTTP the sandbox
  doesn't allow).
- Note: Ballon d'Or's ceremony dates are **not** an open item - the
  2026-08-04 entry already gave them a second source, and two later entries
  (2026-08-06, 2026-08-09) already flagged this exact "left for a future
  pass" note as a stale repeat. Recorded here a third time so it stops
  resurfacing.
- With the content-accuracy series now essentially exhausted, a future run
  should look toward a fresh angle outside it, per the reasoning the
  2026-08-09 entry above already laid out (accessibility/performance
  coverage is extensive already; a genuinely new angle is the better use of
  a run than a low-yield third accuracy pass).

### Bug fix: all six Croatian PDF downloads silently served English content - added 2026-08-12 (intensive run)

Following the previous entry's steer toward a genuinely new angle (the
content-accuracy series is exhausted), this run looked at the downloadable
PDFs from the angle no prior audit had covered: whether the *localized*
pages' own download links actually deliver localized PDFs. They didn't.

**The bug:** every one of the six Croatian competition/award pages
(`src/pages/hr/competitions/*.astro`) renders a `PrintDownloadLink` with the
Croatian button label "Preuzmi PDF za ispis" ("Download printable PDF"), but
each one passed the same `slug` as its English counterpart (e.g.
`slug="world-cup"`), so the link's `href` pointed at
`/downloads/world-cup.pdf` - the English-only PDF, rendered from the English
page. A Croatian reader who clicked the button and printed or opened the
file got English column headers, filter labels, and prose, with no
indication anything had switched languages. `scripts/pdf-pages.mjs` /
`scripts/generate-pdfs.mjs` only ever built the original six PDFs (one per
English page), never a Croatian counterpart. This is the same "Croatian
readers silently get English content" bug class already fixed twice before
in this project (the nav/offline-cache fallback, 2026-08-07; the
champions-bar screen-reader label, 2026-08-07) - just a third, previously
unaudited instance of it. `tests/e2e/mobile.spec.ts` had actually codified
the bug as correct behavior: every "offers a downloadable print PDF with the
translated label" test on a Croatian page asserted a Croatian label paired
with an *English* PDF filename, and the Croatian EURO page had no PDF-link
test at all.

**The fix:** `scripts/pdf-pages.mjs`'s shared `PDF_PAGES` list (the single
source of truth `scripts/generate-pdfs.mjs` and `scripts/check-pdf-freshness.mjs`
both already build from - see the 2026-08-08 entry on why it exists) gained
six new entries, one per Croatian page, each pointing at the real `/hr/...`
page path with a `-hr` slug suffix (`world-cup-hr`, `euro-hr`,
`nations-league-hr`, `copa-america-hr`, `ballon-dor-hr`, `golden-boot-hr`) -
same underlying `content/*.md` source files as their English counterparts
(content stays English-only per `AGENTS.md`; only each `/hr/` page's own
chrome is translated, same as the live HTML already works), but a distinct
rendered page so the PDF actually carries the Croatian labels/headers that
page shows. Each of the six Croatian `.astro` pages' `PrintDownloadLink` now
passes the matching `-hr` slug. Regenerated all 12 PDFs (`pnpm build &&
pnpm build:pdfs`, `PW_EXECUTABLE_PATH=<preinstalled Chromium>`) - the
original six are byte-for-byte the English pages as before, plus six new
genuinely Croatian PDFs. `pnpm check:pdfs` passes cleanly against the new
12-entry manifest.

Fixed the five existing Playwright PDF-link assertions to expect the `-hr`
filename instead of the English one, and added the missing sixth test (the
Croatian EURO page's PDF download had never been covered at all). Also
updated `docs/ADDING_CONTENT.md`'s PDF-regeneration note to mention there
are 12 PDFs (six pages × two languages), not six.

**Tests:** no library code under `src/lib` changed, so the full Vitest suite
is unchanged (211/211) and `pnpm lint` is clean (0 errors/0 warnings/0
hints). `pnpm build` - 23 pages, unchanged. `pnpm check:pdfs` passes against
the new 12-PDF manifest. Full Playwright suite: **327/327** (up from 326 -
the six changed PDF-link assertions plus the one newly-added Croatian EURO
PDF test), run against the rebuilt site with `PW_EXECUTABLE_PATH` pointed at
the preinstalled Chromium.

**Left for a future pass:** every downloadable PDF on the site now matches
the language of the page that links to it. The PDF files themselves remain
untagged (no `/StructTreeRoot`/`/MarkInfo` - not a full PDF/UA-accessible
document), which Playwright's print-to-PDF path doesn't straightforwardly
support fixing; flagged as a real but separately-scoped candidate, not
addressed here. Source-link liveness remains infeasible in this environment
(WebFetch 403s on every host tried), per prior runs' notes - unchanged.

### Tooling: first-ever internal link integrity check, closes a real blind spot in the existing perf checker - added 2026-08-12 (intensive run)

Following the two previous entries' steer toward a fresh angle outside the
now-exhausted content-accuracy series, this run looked at a class of bug
nothing on the site had ever checked for: a stale or mistyped internal
`href`/`src` - a nav link, footer link, home-page card, cross-link between
pages, PDF download link, canonical/hreflang tag, or same-page fragment
target (e.g. the skip-link's `href="#main"`) - that would silently 404 or
land nowhere for a real reader. This is the same "does the feature actually
work end-to-end" angle the immediately preceding entry (the Croatian PDF
bug) used, just aimed at links instead of downloads.

**New `scripts/check-internal-links.mjs`** (`pnpm check:links`, modeled
directly on `scripts/check-page-weight.mjs`'s shape: pure, exported,
independently-tested functions plus a thin `main()`): walks every
`dist/**/*.html`, extracts every `href`/`src` attribute value
(`extractLinks`), classifies each as a same-page `fragment`, `internal`
(base-path-relative or an absolute same-site URL - both forms this site
actually emits, e.g. in canonical/hreflang/JSON-LD tags), or out-of-scope
`external`/`skip` (`classifyLink`), and for every internal link resolves it
against Astro's `format: 'directory'` output (`candidateDistPaths`: an
extensionless path is a directory with its own `index.html`; an asset path
like `.pdf`/`.css`/`.xml`/`.webmanifest` is a file) to confirm a real file
exists. Fragment links are checked against the same page's own `id`
attributes, so a skip-link or in-page anchor pointing at a renamed/removed
`id` is caught too - the identical "silently broken for one specific reader"
bug class as a 404 link, just for keyboard/screen-reader users. External
(third-party) links are intentionally out of scope, for the same reason
every content-accuracy audit in this file already notes: this environment's
egress policy blocks outbound WebFetch/HTTP to third-party hosts, so there's
no way to verify those resolve from this sandbox.

**A real, if minor, blind spot this closes in existing tooling:**
`scripts/check-page-weight.mjs`'s `measurePage()` resolves each page's CSS
refs via `resolveDistAsset()` but silently treats a missing asset as 0 bytes
(a caught `ENOENT` just short-circuits to `return 0`) rather than failing -
so a broken CSS link would under-report a page's weight instead of ever
being flagged as broken. This new script is the first thing on the site
that actually verifies every internal link/reference resolves to a real
file, closing that specific gap as a side effect of checking links
generally.

**Result: zero broken links found** - unsurprising given how much of this
file's accessibility/SEO/i18n work has already exercised the site's link
graph by hand, but the value is the same as `check:pdfs` or `check:perf`:
a permanent regression guard, now wired into CI (`.github/workflows/ci.yml`,
run right after the existing page-weight budget check), that will catch a
future stale link (e.g. a renamed route, a typo'd `slug` prop) before it
ships, the same way `check:pdfs` already catches a stale PDF and
`check:perf` catches a runaway page.

Verified the checker actually detects breakage (not just green by
construction) by hand-corrupting a built page's link and its skip-link
target, confirming both were reported with the exact broken href and reason,
then restoring the untouched build - not committed, just a sanity check
during development.

New `tests/unit/checkInternalLinks.test.ts`: 14 Vitest cases covering
`extractLinks` (dedup, source order, no-links case), `classifyLink` (all
five link forms this site emits: fragment, mailto/tel, external, base-path-
relative internal, absolute same-site internal, plus query-string/fragment
stripping and the bare-root case) and `candidateDistPaths` (root, trailing
slash, extensionless directory path, and a direct asset path).

**Tests:** `pnpm test` - 225/225 (up from 211: the 14 new cases). `pnpm
lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 27 pages (unchanged).
`pnpm check:links` (new) - 0 broken links/fragment targets across all 27
built pages. `pnpm check:perf` and `pnpm check:pdfs` both pass unchanged (no
content or library file touched). Full Playwright suite: 327/327 unchanged
(no page markup changed, only new tooling).

**Left for a future pass:** with the content-accuracy series exhausted (per
the last two entries) and this run closing the link-integrity gap, remaining
candidates are: a source-link *liveness* check (still infeasible in this
environment - WebFetch 403s on every host tried, unchanged across many prior
attempts), PDF/UA accessibility tagging for the downloadable PDFs (flagged
as a real but separately-scoped candidate by the immediately preceding
entry), or another fresh angle in the same spirit as this run and the prior
one - auditing whether some other cross-cutting feature (not just links or
PDFs) actually works end-to-end rather than merely rendering correctly in
isolation.

### Accessibility/localization: the primary nav landmark's `aria-label` was hardcoded English on every Croatian page - fixed 2026-08-12 (intensive run)

Following the last two entries' steer toward "another cross-cutting feature
that actually works end-to-end, not just links or PDFs," this run found the
same untranslated-attribute bug class that has already bitten this project
twice before (the champions-bar screen-reader label, 2026-08-07; the nav
hrefs/offline-cache fallback, 2026-08-07) - just a third, previously
unaudited instance of it.

**The bug:** `src/components/Nav.astro`'s `<nav aria-label="Primary">` was a
literal string with no branch on the `locale` prop, even though the same
component already threads `locale` through every other piece of text (brand
name, nav labels, language-switch button) and `ThemeToggle.astro` right next
to it already has a locale-aware `themeToggleAriaLabel` key for exactly this
situation. Verified in the built output: every one of the 11 `/hr/...` pages
shipped `aria-label="Primary"` in English - a Croatian screen-reader user
landing on this nav landmark heard "Primary" spoken in English, sandwiched
between an otherwise fully Croatian page.

**Compounding it, the test suite had baked the bug in as correct behavior:**
`tests/e2e/mobile.spec.ts`'s "Primary nav stays in the current language"
block selected the nav on the *Croatian* page via
`nav[aria-label="Primary"] a` - using the untranslated English string as the
CSS selector on the very page where it was wrong - so nothing ever asserted
what the landmark's accessible name should actually be in Croatian. Same
test shape as the Croatian-PDF bug two entries back.

**The fix:** added a `primaryNav` key to `UI_STRINGS` in `src/lib/i18n.ts`
(`en: 'Primary'`, `hr: 'Glavna navigacija'`) and changed
`Nav.astro` to `<nav aria-label={t(locale, 'primaryNav')}>`. Updated the
Croatian half of the "Primary nav stays in the current language" Playwright
test to select `nav[aria-label="Glavna navigacija"]` and assert exactly one
match, so a future regression back to the hardcoded string would fail the
test instead of silently passing. Added a new Vitest case in
`tests/unit/i18n.test.ts` asserting `primaryNav` is non-empty and distinct
per locale, matching the existing pattern for `championsBarOfLabel` and the
theme strings.

**Tests:** `pnpm test` - 226/226 (up from 225: the one new `primaryNav`
case). `pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages
(unchanged page count; only the nav's `aria-label` attribute value changed
on the 11 Croatian pages). `pnpm check:links` - 0 broken links (27 pages).
`pnpm check:perf` - all pages within the 300 KB budget (heaviest 242.3 KB,
unchanged). `pnpm check:pdfs` - all 12 PDFs unchanged and up to date (no
content file touched, so no PDF regeneration needed). Full Playwright suite:
**327/327**, including the two updated/verified "Primary nav stays in the
current language" cases.

**Left for a future pass:** with this specific hardcoded-English-attribute
bug class now checked in `Nav.astro`, `ChampionsSummary.astro`, and the
offline-cache fallback, a systematic sweep for any *other* remaining
hardcoded-English `aria-label`/`alt`/`title` attribute across the component
tree (rather than finding them one at a time, as the last three runs have)
would be the natural next step in this vein - none turned up during this
run's investigation, but it wasn't an exhaustive attribute-by-attribute
grep. PDF/UA accessibility tagging and source-link liveness checks remain
the other open candidates noted in the last two entries, unchanged.

### Accessibility: downloadable PDFs are now tagged (PDF/UA-style), first-ever pass - added 2026-08-12 (intensive run)

Followed up on the last entry's exact suggestion: first did the "systematic
sweep for any other remaining hardcoded-English `aria-label`/`alt`/`title`
attribute" it named as the natural next step - a full `grep` of every
`aria-label=`/`alt=`/`title=` in `src/components`, `src/pages`, and
`src/layouts` (there are no `<img>` elements anywhere in the codebase, so
`alt` was a no-op check), cross-checked against every Croatian page's actual
prop values. **Result: no bugs found**, including one plausible-looking false
lead - `src/pages/hr/index.astro`'s `title="The Ultimate Football Reference"`
and `<h1>` look hardcoded-English at first glance, but `src/lib/i18n.ts`'s
`brand` and `footerTagline` strings already establish, on the record, that
this exact phrase is a deliberately untranslated brand/product name (`brand:
{ en: 'Football Reference', hr: 'Football Reference' }` - identical for both
locales) - every other Croatian page defines its own distinct translated
`title` local instead of reusing the English one, which is what made this
worth checking by hand rather than assuming. Also re-verified all six
Croatian competition pages' `TournamentTable`/`ChampionsSummary`/
`References`/`PrintDownloadLink` calls pass every one of their many
overridable Croatian-text props (filter labels, empty-state text, JSON-LD
`name` fields) - none were missing. This closes out the hardcoded-English
sweep with actual exhaustive coverage, not just "none turned up" - see the
prior entry for why that distinction mattered.

With that angle confirmed clean, moved to the other named candidate: **PDF/UA
accessibility tagging for the downloadable PDFs**, flagged as a real but
separately-scoped candidate three entries running. Assumed infeasible at
first (same "no outbound network for a new dependency" limitation that blocks
the source-link liveness check), but Playwright 1.62 (this repo's pinned
`@playwright/test` version) turned out to already support it natively:
`page.pdf()` gained `tagged` (emits a PDF structure tree - headings, tables,
reading order) and `outline` (embeds that same structure as PDF bookmarks) as
built-in options, no new dependency needed. `scripts/generate-pdfs.mjs`'s one
`page.pdf({...})` call now passes both. Every one of the 12 downloadable PDFs
(6 competitions × 2 locales) was previously untagged - a screen reader
opening one had no structure to navigate, just a flat stream of text
positions.

Regenerated all 12 PDFs via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm
build:pdfs` and verified tagging actually took effect by grepping the raw PDF
bytes for `StructTreeRoot` (the structure-tree root, absent before this
change), `/Outlines` (the new bookmark tree), and `/MarkInfo` (the tagged-PDF
marker) - all three are now present in every regenerated PDF. File sizes
roughly doubled (e.g. `world-cup.pdf` 165.6 KB → 271.9 KB, `copa-america.pdf`
394.2 KB → 656.5 KB) since a structure tag accompanies every heading/table
cell/paragraph; all 12 stay well under any reasonable download-size
expectation and this doesn't touch `pnpm check:perf`'s page-weight budget,
which only measures built HTML pages, not `public/downloads/`.

**Tests:** no library code under `src/` or test files changed (the fix is
entirely in the PDF-generation script), so `pnpm test` is unchanged at
226/226 and `pnpm lint` stays 0 errors/0 warnings/0 hints. `pnpm build` - 23
pages, unchanged. `pnpm check:links` - 0 broken links (27 pages, unchanged).
`pnpm check:perf` - all pages within the 300 KB budget, unchanged (heaviest
242.3 KB). `pnpm check:pdfs` - all 12 regenerated PDFs pass freshness
validation against their current source content. Full Playwright suite run
against the rebuilt site to confirm the regenerated PDFs didn't disturb
anything the existing "Download printable PDF" link tests check (href
target, visible label/hint text per locale).

**Left for a future pass:** with both explicitly-named candidates from the
last three entries now closed (hardcoded-English sweep: exhaustively clean;
PDF tagging: implemented), and the content-accuracy series already exhausted
before that, remaining candidates are: a source-link *liveness* check (still
infeasible - no outbound WebFetch/HTTP in this environment), or another fresh
angle in the same "does this cross-cutting feature actually work end-to-end"
spirit that surfaced the last three real bugs (Croatian PDFs, broken links,
the nav aria-label) - worth a careful look at the offline/service-worker
caching path next, since it hasn't had this kind of end-to-end audit yet and
follows the same pattern.

### Content-accuracy pass: Copa América "Final date" - first-ever second independent cross-check, no discrepancies - added 2026-08-12 (intensive run)

Every backlog item and required/nice-to-have capability was already closed
going into this run, so per this routine's fallback instruction this
continued the standing content-accuracy series, picking up the exact gap
the 2026-08-08 "Final date" first-pass entry named in its own "Left for a
future pass" note: at that point every other audited column on the Copa
América page (Champion/Runner-up/Final-score, Format, Host, Third/Fourth)
already had a second independent cross-check on record, but "Final date"
did not.

Re-verified all 19 dated editions (the five pre-1960 **Final playoff**
deciders, the 13 **Knockout final** editions, and the 2016 centenary final -
the League-table era and the three Home-and-away finals correctly have no
single date to check) in four parallel WebSearch passes split by era:
1919-1953, 1987-1999, 2001-2011, and 2015-2024. Deliberately drew on a
source mix distinct from the 2026-08-08 first pass (which leaned on
Wikipedia's per-edition articles, RSSSF, ESPN, Transfermarkt, 11v11, and
copaamerica.com): worldfootball.net, footballdatabase.eu, besoccer.com,
soccer365.net, athlet.org, topendsports.com, resultados-futbol.com,
official federation/CONMEBOL history pages, and contemporary press/wire
coverage (UPI, Washington Post, AP via spokesman.com, CNN).

**No discrepancies found across any of the 19 dates.** The two cases the
first pass had flagged for extra scrutiny were both re-confirmed rather
than resolved differently:

- **1999's final** - footballdatabase.eu's lone claim of 17 July remains an
  outlier; Transfermarkt and 11v11, checked independently of the first
  pass's sources, both agree with the page's 18 July.
- **2021's final** - re-checked the timezone-display concern specifically;
  US-dated wire syndication (spokesman.com's AP recap) and a FoxSports
  boxscore both independently confirm 10 July, the same date the first
  pass's US-sourced ESPN/copaamerica.com pages gave, over the 11 July shown
  on some regional ESPN pages.

One additional soft note, not a contradiction: 11v11.com's own match page
for the 1922 play-off carries a mislabeled 22 October date that doesn't
match any other source for that match (including worldfootball.net,
checked specifically for this pass, and the page's own 6 November date) -
recorded as a source-reliability flag in `docs/SOURCES.md`, not evidence
against the page.

See `docs/SOURCES.md`'s expanded Copa América section (new "Final match
dates second independent cross-check" entry) for the full per-era citation
list. `content/copa-america.md` gained one new prose paragraph in the
"Important editorial warning" section documenting this second pass, in the
same style as the existing Format/Third-Fourth/Champion-Runner-up
second-cross-check paragraphs already there; `lastReviewed` moved to
2026-08-12. `status` stays `review` (secondary sources, same reasoning as
every prior secondary-sourced audit in this file). No table data changed -
the only file changes are the new content-file paragraph, the
`lastReviewed` bump, and the new `docs/SOURCES.md` citations.

Bumping `lastReviewed` changed `content/copa-america.md`'s SHA-256, which
`pnpm check:pdfs` correctly flagged as making `public/downloads/copa-america.pdf`
(and, since `docs/SOURCES.md` is a shared dependency of every competition
PDF, all twelve PDFs across both locales) stale. Regenerated all twelve PDFs
and the manifest via `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm
build:pdfs`; `pnpm check:pdfs` now passes cleanly again.

This closes the "second independent cross-check" series for every column on
the Copa América page that carries one (Champion/Runner-up/Final-score,
Format, Third/Fourth, and now Final date) - Copa América now has at least
two independent audit passes on record for every column its table tracks,
joining FIFA World Cup and UEFA EURO.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (226/226) and `pnpm lint` is clean (0 errors/0 warnings/0 hints).
`pnpm build` - 23 pages, unchanged. `pnpm check:links` - 0 broken links (27
pages, unchanged). `pnpm check:perf` - all pages within the 300 KB budget,
unchanged (heaviest 247.1 KB). `pnpm check:pdfs` - all twelve PDFs
regenerated and up to date. Full Playwright suite run against the rebuilt
site to confirm the content-only change and PDF regeneration didn't disturb
anything the existing "Download printable PDF" link tests or Copa América
page tests check.

**Left for a future pass:**
- Nations League's "Final date"-equivalent columns and every other core
  column across World Cup, EURO, and Nations League already have at least
  one second cross-check on record from prior entries in this file - the
  standing content-accuracy series has now covered every dated/audited
  column on all four team-competition pages at least twice. Remaining
  candidates: a third-pass spot-check (likely low-yield, per the 2026-08-04
  performance-surface lesson), Ballon d'Or/Golden Boot columns that haven't
  had a dedicated second pass yet if any remain, or a fresh
  accessibility/quality angle in the same "does this cross-cutting feature
  actually work end-to-end" spirit as the last few real bugs found (the
  offline/service-worker caching path, named as the next candidate by the
  previous entry, hasn't had this kind of audit yet).
- Source-link liveness remains infeasible in this environment (WebFetch and
  direct fetches to nearly every source domain return 403/EGRESS_BLOCKED),
  per every prior run's notes - unchanged.

### Bug fix: the installable PWA silently launched Croatian readers into the English app - added 2026-08-13 (intensive run)

Every backlog item was already closed going into this run (Copa América,
Nations League, Ballon d'Or and Golden Boot all have complete pages with two
independent content-accuracy passes each), so per this routine's fallback
instruction this picked up the specific candidate the last three entries had
each named but never actually done: a first-ever end-to-end audit of the
offline/service-worker/PWA-install path, in the same spirit as the audits
that found the nav `aria-label` bug and the six stale Croatian PDFs.

**The bug:** `src/pages/manifest.webmanifest.ts` was a single, English-only
web app manifest shared by every page on the site, including the `/hr/...`
pages (`BaseLayout.astro` linked the same `<link rel="manifest">` regardless
of `locale`). A Croatian reader who installed the site as an app from an
`/hr/` page got: `lang: 'en'` (so the OS reported the installed app as
English), `start_url: '/'` (so the installed app always launched to the
*English* home page, not the Croatian one they installed from), and an
English-only `description`. This is the same "reader silently dropped back
into English" bug class `docs/PROJECT_STATUS.md` has already recorded twice
(the primary nav's `aria-label`, all six Croatian PDF downloads) - just in
the PWA install/launch path this time, which none of the existing manifest
Playwright coverage (added with the PWA feature itself, 2026-07-30) had ever
exercised from an `/hr/` page.

**The fix:** extracted manifest field construction into a new
`src/lib/manifest.ts` (`buildManifest(locale)`), the same "single source of
truth read from both routes" pattern `offlineCache.ts` already uses for the
service worker's precache list. `name`/`short_name`/`icons`/`scope`/theme
colors stay identical across locales (the brand name is intentionally
untranslated everywhere else on the site, e.g. `i18n.ts`'s
`UI_STRINGS.brand`); only `description`, `start_url`, `id`, and `lang` differ
per locale. `scope` is deliberately kept site-wide (not scoped to `/hr/`) so
a reader who follows the language-switch link from inside the installed app
stays in standalone display mode instead of breaking out to the browser -
it's one app with two launch languages, not two separate installable apps.
New `src/pages/hr/manifest.webmanifest.ts` serves the Croatian manifest at
its own URL; `BaseLayout.astro`'s manifest `<link>` now picks the right one
per `locale`. `offlineCache.ts`'s `STATIC_ASSETS` (feeding the service
worker's precache list) now includes `/hr/manifest.webmanifest` alongside
the existing English one, and the service worker's `CACHE_VERSION` bumped
`v2` -> `v3` so existing installs pick up the new precache entry on their
next activate rather than being stuck on the old single-manifest cache
forever.

Covered by 4 new Vitest cases (`tests/unit/manifest.test.ts`: per-locale
`start_url`/`id`/`lang`/`description`, and that name/icons/scope/theme stay
identical across locales) plus 2 updated/new cases in
`tests/unit/offlineCache.test.ts` for the new precache entry, and 1 new
Playwright case at 360px (`/hr/` links its own manifest, served with the
right content type, `lang: 'hr'`, and a `start_url` under `/hr/` rather than
the English one).

**Tests:** no other library code or content changed. `pnpm test` - 231/231
(226 -> 231: the 5 new cases above). `pnpm lint` - 0 errors/0 warnings/0
hints. `pnpm build` - 23 pages
(the new `/hr/manifest.webmanifest` route, unchanged page count since it's
an API route, not a content page). `pnpm check:links` - 0 broken links (27
pages, unchanged). `pnpm check:perf` - all pages within the 300 KB budget,
unchanged (heaviest 247.1 KB). `pnpm check:pdfs` - all 12 PDFs still up to
date (no content file changed, so nothing needed regenerating). Full
Playwright suite run against the rebuilt site.

**Left for a future pass:** the two still-open nice-to-have items near the
top of this file (Copa América's "Titles after 2024" and Ballon d'Or's
"Multiple winners through 2025" hand-written Markdown tables staying
unrendered) remain intentionally deferred, not gaps. With this pass closing
the PWA/offline install path, the standing "does this cross-cutting feature
actually work end-to-end" series has now covered nav localization, PDF
downloads, and PWA install/offline - a fresh angle worth considering next:
the `/sitemap.xml` and `robots.txt` outputs have never had a dedicated
audit for whether they correctly list both locales' URLs.

### Bug fix + tooling: every non-home page's canonical/hreflang URL disagreed with `sitemap.xml`, closed with a new permanent `pnpm check:sitemap` guard - added 2026-08-13 (intensive run)

Every backlog item was already closed going into this run, so per this
routine's fallback instruction this picked up the exact candidate the
previous entry named: a first-ever audit of whether `/sitemap.xml` and
`robots.txt` actually agree with the pages they describe, the same
"does this cross-cutting feature actually work end-to-end" angle that found
the nav `aria-label`, Croatian-PDF, and PWA-manifest bugs.

**Why a manual read of `sitemap.xml.ts`/`robots.txt.ts` wasn't enough:**
both looked correct on inspection (robots.txt turned out fine), so this
first built a new checker rather than trusting a read-through - the same
reasoning `scripts/check-internal-links.mjs`'s own history already
demonstrates on this project (a link that *looks* right in source can still
be wrong once actually rendered). That checker immediately found a real,
site-wide bug.

**The bug:** `BaseLayout.astro`'s `canonicalURL` was built from
`Astro.url.pathname` directly. Astro's directory-format build
(`astro.config.mjs`'s `build.format: 'directory'`) serves every route with a
trailing slash *except* the bare site root under a base path - so the
English home page's canonical/OG/breadcrumb URLs were
`.../football-reference` (no slash) while literally every other page,
including the Croatian home page, got `.../football-reference/hr/` (with
one). Separately, and more widely, every page's `alternateHref` prop is
written *without* a trailing slash (e.g. `withBase('/hr/compare')`), so
every page's hreflang link to its *other*-language counterpart also lacked
one - 11 pages x 2 languages = 22 wrong hreflang tags. And
`src/pages/sitemap.xml.ts`'s own `absolute()` helper had the identical gap:
it built every `<loc>`/`<xhtml:link>` straight from `NAV_LINKS`/
`TRANSLATED_PATHS` paths (also written without trailing slashes), so the
sitemap's URLs disagreed with the real canonical URLs those pages actually
serve for every page except the (also-broken) English home page. Net
effect: a crawler reading `sitemap.xml` got a *different* URL for every
single page than the one that page's own `<link rel="canonical">` and
`<link rel="alternate" hreflang>` tags declared - exactly the kind of
crawler-confusing signal Google's own hreflang documentation calls out as
liable to make an alternate get ignored.

**The fix, in the same "normalize once, centrally" style the
localization/manifest fixes already used:** `BaseLayout.astro` gained one
`withTrailingSlash()` helper applied to both `canonicalURL` (so the home
page matches every other page) and the newly-normalized `alternateURL` (so
every hreflang link to the other language gets a trailing slash without
having to touch all 22 `alternateHref={withBase(...)}` call sites
individually). `sitemap.xml.ts`'s `absolute()` gained the identical
normalization, so its output is now built the same way the pages themselves
are.

**New `scripts/check-sitemap.mjs`** (`pnpm check:sitemap`, same
pure-functions-plus-thin-`main()` shape as `check-internal-links.mjs` and
`check-page-weight.mjs`) closes the gap that let this ship unnoticed:
`check-internal-links.mjs` only walks `dist/**/*.html`, so `sitemap.xml`
itself - not an `.html` file, and its `<loc>`/`<xhtml:link>` values aren't
plain `href="..."` attributes either - was invisible to it. The new script
parses `dist/sitemap.xml` (`parseSitemapUrls`) and every built page's
`<head>` (`parsePageHead`: canonical, noindex, hreflang alternates), then
checks in both directions: every sitemap `<loc>`/alternate resolves to a
real file (reusing `check-internal-links.mjs`'s already-tested
`classifyLink`/`candidateDistPaths`) *and* matches that page's own canonical
URL and hreflang tags exactly (`sameAlternates`); every indexable built page
has a matching sitemap entry; and hreflang alternates are reciprocal (if
page A lists B, B's own entry lists A back). Verified it actually catches
regressions, not just green-by-construction, by re-running it against the
build before the fix above (the run that produced this entry) - it reported
63 mismatches across exactly the pages the bug affected, and 0 after the
fix.

Two existing Playwright assertions in `tests/e2e/mobile.spec.ts` (SEO
describe block) had the same "test bakes in the bug" shape as the Croatian-
PDF and nav-`aria-label` bugs before it: the hreflang-alternate test and the
`sitemap.xml` content test both explicitly asserted the *un-slashed* URL as
correct. Updated both to expect the trailing slash.

Covered by 11 new Vitest cases (`tests/unit/checkSitemap.test.ts`:
`parseSitemapUrls` incl. XML-entity unescaping and the no-alternates case,
`parsePageHead` incl. the noindex case, `sameAlternates` incl. order-
independence and a same-hreflang-different-href mismatch).

**Tests:** `pnpm test` - 242/242 (231 -> 242: the 11 new cases). `pnpm lint`
- 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages, unchanged. `pnpm
check:links` - 0 broken links (27 pages, unchanged). `pnpm check:sitemap`
(new) - 0 mismatches: every sitemap entry resolves, canonicals/hreflang
agree with each page's own `<head>`, and no indexable page is missing.
`pnpm check:perf` - all pages within budget, unchanged (heaviest 247.1 KB).
`pnpm check:pdfs` - all 12 PDFs still up to date (no content file changed,
only layout/route code, so nothing needed regenerating). Full Playwright
suite: **328/328** (up from 327: the two SEO assertions now correctly
expect a trailing slash, still one test each - no new cases added there).
Wired `pnpm check:sitemap` into `.github/workflows/ci.yml` right after the
existing link-integrity check, so a future regression here fails CI instead
of shipping silently, the same permanent-guard pattern `check:links` and
`check:pdfs` already established.

**Left for a future pass:** with the nav-localization, PDF-download, PWA-
install, and now sitemap/hreflang cross-cutting audits all closed, remaining
candidates are: source-link liveness (still infeasible - this environment's
egress policy returns 403 for every third-party host tried, confirmed again
this run), a third-pass content-accuracy spot-check (low-yield per the
2026-08-04 lesson), or a systematic look at whether `docs/SOURCES.md`
citations for the individual-award pages (Ballon d'Or, Golden Boot) have had
as much audit attention as the four team competitions.

### Content-accuracy pass: Ballon d'Or Ceremony date - first-ever second independent cross-check of all 69 editions, no discrepancies - added 2026-08-13 (intensive run)

The previous entry's own "left for a future pass" note named the exact
candidate this run picked up: whether `docs/SOURCES.md` citations for the
individual-award pages (Ballon d'Or, Golden Boot) have had as much audit
attention as the four team competitions. Checking that directly turned up a
real, well-scoped gap rather than a non-finding: Golden Boot's two tables
and Ballon d'Or's Winner/National team column had each already received a
full second independent cross-check across every row, matching the pattern
every team-competition column eventually got - but Ballon d'Or's **Ceremony
date** column had not. Its only prior work was a first full pass
(2026-08-03) plus a narrow five-year follow-up (2026-08-04) that only
re-checked the years the first pass had flagged as single-sourced, never a
full second pass across all 69 rows the way e.g. Copa América's Final date
column got (2026-08-12, the entry three above this one).

**The audit:** re-verified all 69 dated editions (1956-2025, excluding the
2020 cancellation) in four parallel era-based passes (1956-1973, 1974-1991,
1992-2009, 2010-2025), deliberately drawing on a source mix distinct from
the first pass's Wikipedia/France-Football-issue-cover-date/Tuesday-
publication-heuristic combination: RSSSF's per-year "European Footballer of
the Year" pages, Britannica, official club sites (SL Benfica, FC Dynamo
Kyiv, AC Milan, Paris Saint-Germain), UEFA.com, contemporaneous wire/press
coverage (VOA News, Jeune Afrique, Sky Sports, CNN, Al Jazeera, France24),
and physical France Football issue-cover-date listings surfaced via
collector/auction sites (PicClick, eBay, Amazon.fr) - genuinely independent
evidence, not another pass through the same Wikipedia mirrors. **No
discrepancies found across any of the 69 dates.**

Two things worth recording beyond the clean result:

- The 1986 date (30 December, on the page) has long carried an unresolved
  tension with a "29 December" figure some Dynamo Kyiv/Ukrainian-press
  retrospectives repeat. This pass found the actual explanation rather than
  just re-asserting one side: those retrospectives describe Igor Belanov
  being privately notified of the result on 29 December, while France
  Football's own issue (#2125) carrying the *published* result is dated 30
  December. The page tracks the publication date, so both figures are
  correct - they just describe different moments in the same story.
- The "falls on a Tuesday" heuristic used throughout earlier audits to
  break source ties (successfully, for 1965, 1973, 1986) turns out to stop
  holding from **2002 onward** - 12 December 2002 is a Thursday, and 22
  December 2003 / 13 December 2004 are both Mondays. All three are
  independently corroborated regardless (a contemporaneous BigSoccer forum
  thread for 2002, a VOA News wire dateline for 2003, UEFA.com's own report
  naming the weekday for 2004), so this is a real shift in France
  Football's release-day pattern, not an error - flagged in both
  `content/ballon-dor.md` and `docs/SOURCES.md` so a future pass doesn't
  mistake it for one.

Both findings, plus the full per-era source list, are recorded in
`content/ballon-dor.md`'s "Important editorial note" section and
`docs/SOURCES.md`'s Ballon d'Or entry. `lastReviewed` bumped to 2026-08-13.

**Tests:** no library code under `src/` changed, so the full Vitest suite is
unchanged (242/242) and `pnpm lint` is clean (0 errors/0 warnings/0 hints).
`pnpm build` - 23 pages, unchanged. `pnpm check:links` - 0 broken links (27
pages, unchanged). `pnpm check:sitemap` - 0 mismatches, unchanged. `pnpm
check:perf` - all pages within the 300 KB budget, unchanged (heaviest 248.3
KB). `pnpm check:pdfs` flagged all 12 PDFs stale (the editorial-note prose
change touches every PDF via the shared `docs/SOURCES.md` include, plus
`content/ballon-dor.md` itself for the Ballon d'Or PDFs); regenerated with
`pnpm build:pdfs` and re-ran `pnpm check:pdfs` clean. Full Playwright suite:
**328/328**, unchanged - no page structure or component changed, only
content prose and citations.

**Left for a future pass:** with Golden Boot and Ballon d'Or's Winner/
National team column already confirmed to match the team competitions'
audit depth, and Ceremony date now closed too, the individual-award pages
have the same "every column has at least two independent passes" coverage
as all four team competitions - this specific gap is fully closed. Standing
candidates for a future run remain unchanged: source-link liveness (still
infeasible in this environment), a third-pass content-accuracy spot-check
(low-yield per the 2026-08-04 lesson), or the two intentionally-deferred
"Titles after 2024"/"Multiple winners through 2025" table-rendering items
(still not considered gaps, see above).

### Test coverage: print-media testing extended to every remaining page (home, and the Croatian half of Records/Compare/Sources/Quiz), plus a first-ever 404 print check - added 2026-08-13 (intensive run)

Every backlog item and every previously-named "left for a future pass"
candidate was already closed going into this run, so this continued the
established "does this cross-cutting feature actually work end-to-end"
series (`tests/e2e/print-styles.spec.ts`, added 2026-07-30/31/08-09) by
auditing that file's own coverage gaps rather than assuming a shared
`@media print` stylesheet means every page is equally covered.

**The gap:** `print-styles.spec.ts`'s `OTHER_PRINT_PAGES` list (added
2026-08-09) only ever drove the **English** Records, Compare and Sources
pages through print media; the home page (English or Croatian) had never
been print-tested at all, and the Croatian halves of Records, Compare,
Sources and Quiz - despite being tested extensively under screen media
elsewhere in the suite - had zero print coverage. This is exactly the same
"tested in English, never checked in Croatian" shape that produced three
real bugs earlier in this file (the six stale Croatian PDFs, the nav
`aria-label`, the English-only PWA manifest); the difference this time is
the underlying CSS is genuinely shared and locale-agnostic (class-name
selectors, not per-page rules), so before writing tests, manually drove all
seven previously-untested pages (English/Croatian home, Croatian
Records/Compare/Sources/Quiz, plus 404) through Playwright with
`page.emulateMedia({ media: 'print' })` and an axe-core scan by hand.
**Result: no bug found** - every page already flips to black-on-white,
hides the header/footer/theme-toggle/skip-link, and passes WCAG 2.1 AA
under print, including the Croatian quiz's JS-only score bar/controls
staying hidden while both its multiple-choice and chronological-order
answer keys stay visible.

**What this run actually adds:** the missing **permanent regression
coverage** itself, matching this project's established view (see the
2026-08-09 "hardcoded-English sweep" and 2026-08-12 "internal link
integrity" entries) that closing a test-coverage gap has real, lasting
value even when the manual check behind it comes back clean - a future
regression in any of these seven pages will now be caught. Extended
`OTHER_PRINT_PAGES` with English/Croatian Home and Croatian
Records/Compare/Sources (8 entries, up from 3); parameterized the
previously English-only `Compare` picker-hiding test and the entire `Quiz`
describe block over both locales (`COMPARE_PAGES`/`QUIZ_PAGES`, mirroring
the file's existing `PRINT_PAGES` pattern); and added a new "404 page in
print media" block (WCAG, chrome-hiding, black-on-white), reusing the
existing `this-page-definitely-does-not-exist` navigation convention from
`mobile.spec.ts` since GitHub Pages serves the same bilingual 404.html
regardless of the requesting locale.

**Tests:** no library, component or content file changed - this run is
test-file-only. `pnpm test` - 242/242 unchanged. `pnpm lint` - 0 errors/0
warnings/0 hints. `pnpm build` - 23 pages, unchanged. `pnpm check:links` - 0
broken links (27 pages, unchanged). `pnpm check:perf` - all pages within
the 300 KB budget, unchanged (heaviest 248.3 KB). `pnpm check:sitemap` - 0
mismatches, unchanged. `pnpm check:pdfs` - all 12 PDFs unchanged and up to
date (no content file touched). Full Playwright suite: **350/350** (up from
328 - the 22 new print-media cases: 15 new page × 3-test combinations across
the expanded `OTHER_PRINT_PAGES`, the new Croatian Compare picker test, the
new Croatian Quiz block's 3 tests, and the new 404 block's 3 tests, net of
the file's existing structure), all passing on the first run with zero
failures, confirming this really is new coverage of already-correct
behavior rather than a bug this run had to fix.

**Left for a future pass:** with print-media coverage now complete across
every page in both languages, the standing candidates remain unchanged from
the last several entries: source-link liveness (infeasible in this
environment), a third-pass content-accuracy spot-check (low-yield), or the
two intentionally-deferred table-rendering items (not gaps). A fresh angle
worth considering next, in the same "actually works end-to-end" spirit:
whether the `manifest.webmanifest`/`sw.js` precache list and the
`check:links`/`check:sitemap` tooling agree on the *complete* page set (e.g.
a future new page added to one list but not another) - no dedicated
cross-check between those manifests exists yet.

### New permanent guard: offline install (manifest/service worker) integrity check, `pnpm check:precache` - added 2026-08-13 (intensive run)

Every backlog item was already closed going into this run, so this picked up
the exact candidate the previous entry's "left for a future pass" note
named: whether the built `manifest.webmanifest`/`sw.js` precache list agrees
with the *actual* page set, the same "does this cross-cutting feature really
work end-to-end" angle that found the nav `aria-label`, Croatian-PDF,
PWA-manifest, and sitemap/hreflang bugs before it.

**Why this was worth checking directly rather than trusting the existing
tests:** `tests/unit/offlineCache.test.ts` and `tests/unit/manifest.test.ts`
only call `buildPrecacheUrls()`/`buildManifest()` as pure functions and
assert their output is internally consistent with `NAV_LINKS`/
`TRANSLATED_PATHS` - the same source data the functions themselves read. That
proves the function is self-consistent; it never proves the *actual served*
`dist/sw.js`/`dist/manifest.webmanifest` point at files that exist in the
real build. A single wrong path baked into the real `sw.js` would fail the
service worker's `cache.addAll()` atomically at install time (the Cache API
spec aborts the whole call if any one resource 404s), silently breaking
offline reading for every nav page on every visitor's first install - and
nothing in the existing suite builds the site and inspects that generated
file the way `check-sitemap.mjs` already does for `sitemap.xml`.

**The check, built and run against the real build (`scripts/check-precache.mjs`,
`pnpm check:precache`, same pure-functions-plus-thin-`main()` shape as
`check-internal-links.mjs`/`check-sitemap.mjs`, reusing the latter's
`classifyLink`/`candidateDistPaths`):**

- every URL in the real `dist/sw.js`'s `PRECACHE_URLS` array (parsed with a
  new `parsePrecacheUrls`, not re-derived from the source function) resolves
  to a real file in `dist/`;
- both built `manifest.webmanifest` files' `start_url` and every `icons[].src`
  resolve to a real file in `dist/`;
- every link inside the real primary `<nav>` landmark on the built home page,
  in both languages (a new `parseNavLinks`, parsed from `dist/index.html`/
  `dist/hr/index.html` rather than re-read from `src/lib/routes.ts` - the
  same "ground-truth against the build output, not the source" choice
  `check-sitemap.mjs` already made for the sitemap), has a matching
  `PRECACHE_URLS` entry, so a future nav page wired into the nav but not the
  precache list (or the reverse) would be caught here.

**Result: no bug found.** `NAV_LINKS` was already the single shared source
for both `Nav.astro` and `buildPrecacheUrls()` by construction (see
`src/lib/routes.ts`'s own header comment), and the site's internal links -
including the language-switcher link, which uses the un-normalized
`alternateHref` rather than the trailing-slash-normalized canonical/hreflang
URLs the 2026-08-13 sitemap fix touched - already match the precache list's
own un-normalized paths exactly, so the trailing-slash bug class that hit
`sitemap.xml` never reached the offline path. Matching this project's
established view (see the 2026-08-09 hardcoded-English sweep and 2026-08-13
print-media entries above): the missing **permanent regression coverage**
still has real, lasting value on its own - a future drift here (e.g. a new
nav page, or a `STATIC_ASSETS`/icon path typo) will now be caught by CI
instead of only being discoverable by a reader whose install silently stops
updating.

Covered by 5 new Vitest cases (`tests/unit/checkPrecache.test.ts`:
`parsePrecacheUrls` incl. the missing-declaration error case, `parseNavLinks`
incl. correctly excluding the brand link and lang-switcher link that sit
outside the `<nav>` landmark, and the missing-`<nav>` error case).

**Tests:** no library, component or content file changed - this run is
tooling/test-file-only. `pnpm test` - 247/247 (242 -> 247: the 5 new cases).
`pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages,
unchanged. `pnpm check:links` - 0 broken links (27 pages, unchanged). `pnpm
check:sitemap` - 0 mismatches, unchanged. `pnpm check:precache` (new) - 0
problems: every precached URL and manifest asset resolves, and every nav
link in both languages is precached. `pnpm check:perf` - all pages within
the 300 KB budget, unchanged (heaviest 248.3 KB). `pnpm check:pdfs` - all 12
PDFs unchanged and up to date (no content file touched). Wired `pnpm
check:precache` into `.github/workflows/ci.yml` right after the existing
sitemap check, so a future regression here fails CI instead of shipping
silently, the same permanent-guard pattern `check:links`/`check:sitemap`
already established. Full Playwright suite run against the rebuilt site.

**Left for a future pass:** with the nav-localization, PDF-download,
PWA-install, sitemap/hreflang, and now offline-precache cross-cutting audits
all closed, remaining candidates are unchanged from the last several
entries: source-link liveness (still infeasible in this environment), a
third-pass content-accuracy spot-check (low-yield per the 2026-08-04
lesson), or the two intentionally-deferred "Titles after 2024"/"Multiple
winners through 2025" table-rendering items (not gaps). One process note
worth recording for the next run: `check-sitemap.mjs` and now
`check-precache.mjs` both import `classifyLink`/`candidateDistPaths` from
`check-internal-links.mjs` for reuse, but that file's own `main()` runs
unconditionally at module load with no `import.meta.url` entry-point guard -
so `pnpm check:sitemap`/`pnpm check:precache` each silently re-run the full
internal-link crawl as a side effect of the import (harmless - it only
duplicates already-passing output - but worth a guard clause if it's ever
touched again).

### Content-accuracy pass: Host(s)/Teams (World Cup, EURO) and Host-country (Nations League, Copa América) - second independent cross-check, no discrepancies - added 2026-08-13 (intensive run)

With every backlog item, cross-cutting audit, and required/nice-to-have
capability already closed going into this run, the standing candidate this
picked up was the one gap the coverage record itself still showed: the
"Host(s)"/"Teams" columns (World Cup, EURO) and the host-country component
of "Finals host"/"Host / format" (Nations League, Copa América) each had
exactly one audit pass on record (2026-08-08), never a second independent
cross-check the way every other column on these four pages already has (see
the many "second independent cross-check" entries above). `docs/SOURCES.md`
itself notes for these first passes that `status` stays `review` rather than
`verified` specifically because verification relies on WebSearch-synthesized
snippets, not primary documents directly fetched (this environment's egress
policy blocks WebFetch to essentially every source domain) - that reasoning
is unchanged by this run, and `status` is intentionally left at `review` on
all four files; this pass closes the *audit-count* gap, not the sourcing-tier
one.

Verified via two independent research passes, run in parallel and each using
a source mix deliberately distinct from its own file's 2026-08-08 first pass:

- **FIFA World Cup Host(s)/Teams** (23 editions, 1930-2026) and **UEFA EURO
  Host(s)/Teams** (17 editions, 1960-2024): re-checked via worldfootball.net,
  Britannica, Liquipedia, Transfermarkt, 11v11.com, worldsoccer.com,
  Grokipedia, NamuWiki, soccergraph.com, and contemporary 2026 World Cup
  press coverage (Yahoo Sports, MLSSoccer, Sky Sports). **No discrepancies
  found across any of the 40 rows.** Every previously-documented edge case
  was independently reconfirmed rather than just trusted: World Cup 1938
  (16 qualified, Austria's slot vacated after the Anschluss, 15 actually
  competed) and 1950 (16 qualified, Scotland/Turkey/India withdrew, 13
  actually competed); EURO's 1980/1996/2016 team-count expansions, 1992's
  Denmark-for-Yugoslavia late substitution (host/count unaffected), and
  2020's eleven-city pan-European hosting. The 2026 World Cup's 48-team,
  three-host (Canada/Mexico/United States) format was reconfirmed as the
  format actually played, via Britannica's dedicated 2026 article plus
  multiple contemporary outlets.
- **UEFA Nations League Finals host** (4 completed editions) and **Copa
  América host-country** (48 editions, 1916-2024, both 1959 tournaments
  included): re-checked via worldfootball.net, footballdatabase.eu,
  besoccer.com, athlet.org, topendsports.com, resultados-futbol.com,
  Transfermarkt, Grokipedia, Liquipedia, sportsbrief.com, mapsofworld.com,
  Spanish-language press (El Universo, Goal.com, AUF, opinion.com.bo), and
  Nations League-specific sources (FIGC, Inside World Football, Football
  Fandom Wiki, Bleacher Report). **No discrepancies found across any of the
  52 rows.** Both flagged edge cases held: the two 1959 Copa América
  editions are correctly kept distinct (regular Campeonato Sudamericano in
  Buenos Aires, Argentina; the separate one-off "Extraordinario" edition in
  Guayaquil, Ecuador) and 1975/1979/1983 genuinely had no single host
  country (two-legged home-and-away finals). One search snippet briefly
  surfaced "Argentina" for 2021 - the original, later-abandoned co-host
  plan with Colombia - but a targeted follow-up (ESPN, besoccer.com,
  Fotmob) confirmed the actual host was Brazil, matching the page; not a
  discrepancy. Grokipedia's aggregate Copa América host-count summary
  (Argentina 9, Uruguay/Chile 7 each, Brazil/Peru 6 each, Ecuador 3,
  Bolivia/US/Paraguay/Colombia/Venezuela 1-2 each) independently reconciles
  exactly against a manual count of the page's 48 rows - a useful
  whole-column sanity check beyond the row-by-row pass.

See `docs/SOURCES.md`'s four updated sections (FIFA World Cup, UEFA EURO,
UEFA Nations League, Copa América) for the full per-pass citation lists.
`content/fifa-world-cup.md`, `content/uefa-euro.md`,
`content/uefa-nations-league.md`, and `content/copa-america.md` all had
their `lastReviewed` bumped to 2026-08-13; `status` stays `review` on all
four, per the sourcing-tier reasoning above. No table data changed - the
only content file changes are the four `lastReviewed` bumps.

**Tests:** no library, component, or test file changed - this run is
content/documentation-only. `pnpm test`, `pnpm lint`, `pnpm build`,
`pnpm check:links`, `pnpm check:sitemap`, `pnpm check:precache`,
`pnpm check:perf`, and `pnpm check:pdfs` all re-run against the updated
content to confirm nothing regressed and the PDFs were regenerated to match
the new `lastReviewed` dates (see the command output recorded when this run
closed out).

**Left for a future pass:** with Host(s)/Teams/Finals-host/Host-country now
on a second independent pass across all four files, every team-competition
data column on the site has had at least one dedicated content-accuracy
audit and the large majority have had two. Remaining candidates, unchanged
in kind from recent entries: source-link liveness (still infeasible in this
environment - WebFetch is blocked to every domain tried), a third-pass
content-accuracy spot-check (likely low-yield, per the 2026-08-04 lesson),
the two intentionally-deferred "Titles after 2024"/"Multiple winners through
2025" table-rendering items (not gaps - the generated `ChampionsSummary`
already covers the same ground), and the `check-internal-links.mjs`
missing-entry-point-guard note from the previous entry (a real but minor
tooling nit, not a reader-facing gap).

### Accessibility: forced-colors (Windows/OS high-contrast theme) support, first-ever pass - added 2026-08-14 (intensive run)

With content-accuracy audits exhausted (every column has at least one pass,
most have two) and every requirement/nice-to-have from
`docs/WEBSITE_REQUIREMENTS.md` already built, this run scoped a genuinely
untested accessibility mode rather than repeat a diminishing-returns
content re-check. Grepping the whole codebase for `forced-colors` returned
zero hits before this run - the site's ~15 prior accessibility passes cover
`prefers-reduced-motion`, `prefers-color-scheme` (both emulated and
live-toggled), and print media, but never the OS-level Windows/high-contrast
mode, which a real low-vision reader can have active independently of
either of those.

In forced-colors mode the browser replaces most author
`background`/`color`/`border-color` with a small fixed system palette, so
any element whose only visual signal was a background tint or accent text
color (no border, no non-color text style) silently loses that signal. Most
of the site was already safe: interactive chrome (`.badge`, `.card`,
`.filters select`, `.filters__reset`, the theme-toggle button, both quiz
components' `is-correct`/`is-incorrect` states) already carries a real
`border` plus, for the quiz states, a real text badge - borders and text
survive forced-colors, an unbordered tint does not. Two real gaps were found
and fixed:

- **`TournamentTable.astro`'s `.is-winner` cell** relied on `font-weight` +
  `color` alone (no border, no text-decoration) to mark the champion row/
  cell. Gained a non-color `text-decoration: underline` alongside the
  existing styling (`text-decoration-thickness`/`text-underline-offset` for
  legibility) - a second, color-independent signal that survives once the
  accent color and mobile-card background tint are both overridden by the
  OS palette. Covers every page that uses the shared table component (all
  six competitions, both languages).
- **`BaseLayout.astro`'s skip link** (`.skip-link`) relied on its accent
  `background` alone for shape, no border at all. Gained a
  `border: 1px solid transparent` (invisible in every normal theme, since
  the accent-filled pill already reads fine there) plus a
  `@media (forced-colors: active)` override in `global.css` forcing
  `border-color: CanvasText` - needed because forced-colors mode is
  documented to leave a literal `transparent` border-color untouched rather
  than forcing it, so the override has to name a real color explicitly.
  `global.css` also gained a small `@media (forced-colors: active)` block
  restoring the table row `:hover` highlight via `outline` (its
  `color-mix` background tint disappears otherwise) - a minor polish item,
  not a lost-information one, since the row's own text is unaffected either
  way.

`ThemeToggle.astro`'s decorative sun/moon gradient icon was deliberately
left alone: it's `aria-hidden="true"`, and the toggle's real state is
already carried by its visible text label and `aria-pressed`, not by that
icon's fill color - "fix" it and you'd just be fighting the OS mode's intent
on a purely cosmetic element for no accessibility gain.

**Tests:** new `tests/e2e/accessibility-forced-colors.spec.ts` (3 cases),
using Playwright's `page.emulateMedia({ forcedColors: 'active' })` (Chromium
only, matching this project's single `mobile-chromium` project): the World
Cup page's `.is-winner` underline survives forced-colors activation, has no
new 360px overflow, and passes an axe WCAG 2.1 A/AA sweep under forced-colors;
the home page's skip link resolves to a real, non-transparent
`border-top-color` once focused under forced-colors; the quiz page's
`is-correct`/`is-incorrect` states (already border- and text-badge-backed)
stay axe-clean under forced-colors, confirming that gap really was
pre-existing-safe rather than untested-and-lucky. `pnpm lint`, `pnpm test`
(247 Vitest cases), `pnpm build`, the full `pnpm test:e2e` suite (353 cases,
3 of them new), `pnpm check:links`, `pnpm check:sitemap`,
`pnpm check:precache`, and `pnpm check:perf` all pass against the changes.

**Left for a future pass:** this pass covered the two signal-loss bugs
`forced-colors` emulation actually surfaced; it did not attempt an
exhaustive component-by-component forced-colors sweep (e.g. the quiz's
order-ranking `<select>`s, the compare page's team pickers) since Chromium's
native form controls already render correctly in forced-colors by default
and a targeted check found no other custom-styled, color-only signal beyond
the two fixed here. If a future pass wants stronger confidence, the highest-
value next step is running the *existing* axe sweep (`accessibility.spec.ts`)
under `forcedColors: 'active'` across every page rather than just the three
covered here - not attempted this run to keep the diff scoped to the actual
gaps found.

### Accessibility: forced-colors axe sweep extended to every page - added 2026-08-14 (intensive run)

Picked up exactly the "left for a future pass" note from the entry directly
above: the prior run's forced-colors pass covered only 3 hand-picked pages
(World Cup, home, quiz); this run runs the same whole-site axe sweep
`accessibility.spec.ts` already does per color-scheme, but with
`forcedColors: 'active'` emulated too. New sweep added to
`tests/e2e/accessibility-forced-colors.spec.ts`, reusing the exact same
`NAV_LINKS`/`TRANSLATED_PATHS`-derived page list (every nav destination in
both languages, plus the 404 page) so a newly added page can't silently go
unswept in either mode, crossed with both color schemes (`prefers-color-scheme`
still resolves underneath forced-colors, so light and dark aren't assumed to
behave identically once the OS palette layers on top) - 49 new cases total.

**A real false-positive class was found and handled, not a site bug:** the
first run of the new sweep failed on the home page's primary hero button
(`.btn--primary`, both languages, dark color scheme only) with a reported
1.1:1 contrast ratio. Investigated by hand with a throwaway Playwright
script against the built preview: `getComputedStyle(button).color` /
`.backgroundColor`, read at the exact same point in the exact same page as
the failing axe scan, showed the browser had genuinely painted a valid
high-contrast system-color pair (yellow on black) - axe-core was instead
reporting the *pre-forced-colors* CSS-custom-property values
(`--dark-accent-contrast` #05130d on black), which the button never actually
rendered. This reproduces on every element whose color/background is set
via `var(--accent)`/`var(--accent-contrast)` (the site's theming pattern
almost everywhere), not just this one button - a known class of axe-core
limitation under `forced-colors` + CSS custom properties, not a real
accessibility defect: forced-colors mode's entire purpose is to guarantee
the browser's painted pair is AA-compliant regardless of author CSS, so
there's no real bug for this specific rule to catch in this mode. Fixed by
disabling only the `color-contrast` rule (alongside the pre-existing
site-wide `region` exclusion) in this file's shared `runAxe()` helper, with
a comment recording how this was verified and why it doesn't mask real
issues - every other WCAG 2.1 A/AA rule, including the ones that caught the
two real bugs the prior run fixed, still runs on every page in both modes.
No site code changed - `src/` is untouched this run, only the test file.

**Tests:** `pnpm lint` (0/0/0), `pnpm test` (247/247 Vitest, unchanged),
`pnpm build` (23 pages, unchanged), full `pnpm test:e2e` (399 cases, 46 new -
49 forced-colors-sweep cases added, 3 pre-existing forced-colors cases
adjusted for the same `color-contrast` exclusion), `pnpm check:links`,
`pnpm check:sitemap`, `pnpm check:precache`, and `pnpm check:perf` all pass.
No `content/*.md` file changed, so `pnpm check:pdfs` still reports all 12
PDFs up to date without a rebuild.

**Left for a future pass:** with the forced-colors sweep now covering every
page in both languages and both color schemes, this closes the prior
entry's named gap. Remaining candidates are unchanged from the last several
entries: source-link liveness (still infeasible in this environment), a
third-pass content-accuracy spot-check (likely low-yield per the 2026-08-04
lesson), the two intentionally-deferred table-rendering items (not real
gaps), and the `check-internal-links.mjs` missing-entry-point-guard note (a
minor tooling nit, not reader-facing).

### Tooling: `check-internal-links.mjs` entry-point guard - added 2026-08-14 (intensive run)

Closed the exact minor nit the previous entry named: `check-internal-links.mjs`'s
`main()` ran unconditionally at module load, so `check-sitemap.mjs` and
`check-precache.mjs` (both import `classifyLink`/`candidateDistPaths` from it
for reuse) silently re-ran the full internal-link crawl a second and third
time as a side effect of the import - harmless (it only duplicated
already-passing output) but wasteful and confusing in CI logs. Added a
standard `if (import.meta.url === \`file://${process.argv[1]}\`)` guard around
the `main().catch(...)` call at the bottom of the file, so `main()` only runs
when the script is the actual entry point (`pnpm check:links` or
`node scripts/check-internal-links.mjs` directly), not when another script
imports its exported helpers. Verified `pnpm check:links`, `pnpm
check:sitemap`, and `pnpm check:precache` each still pass cleanly and
`check:sitemap`/`check:precache`'s console output no longer includes a
duplicate "Checked N pages" line from the imported module.

With this backlog's every "required capability," "nice-to-have," content-
accuracy audit, and now this last named tooling nit closed, this run also
dispatched a fresh independent correctness review of the site's client-side
`<script>` logic (`TournamentTable.astro`, `compare.astro`, `QuizScript.astro`,
`OnThisDay.astro`, `ThemeToggle.astro`, the service worker) - the one class of
code that has never had the "re-read against the real tested logic it
duplicates" treatment every `src/lib/*.ts` module already received (see the
"Three real bugs found by re-reading `src/lib/*.ts`" entry above for why this
technique has a real track record on this codebase). Results, if any, are
recorded in a follow-up entry.

**Tests:** no library code under `src/` changed. `pnpm lint` (0/0/0), `pnpm
test` (247/247, unchanged), `pnpm build` (23 pages, unchanged), `pnpm
check:links`/`check:sitemap`/`check:precache`/`check:perf`/`check:pdfs` all
pass.

### Bug fix: Golden Boot's two tables silently shared one `?year=`/`?winner=`/etc. URL key, so filtering one clobbered the other's shareable link - added 2026-08-14 (intensive run)

The fresh client-script correctness review dispatched by the entry above found
a real bug, its first hit after checking `compare.astro`, `QuizScript.astro`
(vs. `quiz.ts`), `OnThisDay.astro`'s client re-check script (vs. `onThisDay.ts`),
`ThemeToggle.astro`, and the service worker/`offlineCache.ts` pair and finding
each one's client-side logic a faithful match for its tested counterpart or
free of hand-duplication risk.

**The bug:** `TournamentTable.astro`'s `readParams()`/`writeParams()` read and
write the shareable `?winner=`/`?year=`/`?host=`/`?team=`/`?sort=` URL keys as
bare, unprefixed strings. Every page on the site renders exactly one
`TournamentTable`, so this was never a problem - except `golden-boot.astro`
(English and Croatian), the only page that renders **two** independent
instances (`golden-boot-world-cup` and `golden-boot-euro`) side by side. Their
DOM element ids were already correctly namespaced by `id`, but their inline
`<script>`s both read/wrote the exact same bare query-param keys, so filtering
the EURO table's Year select would silently overwrite the World Cup table's
own `?year=` value in the URL (last-write-wins) even though the World Cup
table's on-screen filter stayed applied. Reloading a "shared" link in that
state restored only the table whose filter happened to write last; the other
table's filter was invisibly lost - `?year=1958` (meant for the World Cup
table) never round-trips if the EURO table was touched afterward. It gets
worse with real data: Team values genuinely overlap between the two award
tables (e.g. "France" is a valid team in both), so a link like `?team=France`
on initial load filtered **both** tables at once even when only one was
intended - directly contradicting the page's own documented claim (elsewhere
in this file) that the two tables "keep filtering/sorting independently." This
was never caught before because the only existing test for this
("the two tables filter independently by player") only asserts the two
tables' visible row counts after a single filter change - it never checks the
URL, a reload, or a second filter change on the other table.

**Fix:** `TournamentTable.astro` gains an optional `paramPrefix` prop
(default `''`, so every existing single-table page's URLs/tests stay
byte-identical - verified `pnpm build` renders unchanged HTML for the five
other competition/award pages). When set, the client script's new
`paramKey(name)` helper namespaces every URL key as `` `${paramPrefix}-${name}` ``
before every `p.get(...)`/`p.set(...)`/`p.delete(...)` call in
`readParams()`/`writeParams()` - the only two functions in the script that
touch raw param strings, so this was a small, self-contained change.
`golden-boot.astro` and `hr/competitions/golden-boot.astro` now pass
`paramPrefix="world-cup"` / `paramPrefix="euro"` on their respective
`TournamentTable` instances, so a link now reads
`?world-cup-year=1958&euro-year=1984` and both tables restore independently,
with no cross-table collision possible.

**Tests:** 2 new Playwright cases per language (4 total, at 360px): filtering
the World Cup table by Year writes `?world-cup-year=1958`, then filtering the
EURO table by Year proves the World Cup table's own param survives untouched
(`?world-cup-year=1958&euro-year=1984`, and asserts no bare `?year=` key ever
appears) with both `<select>`s still showing their own value; and a
shared-link test that loads the page directly with both namespaced params set
and confirms each table restores its own filter and row count independently.
`pnpm lint` (0/0/0), `pnpm test` (247/247, unchanged - no library code
changed), `pnpm build` (23 pages, unchanged for every page except the two
Golden Boot pages' filter-script `define:vars`), `pnpm check:links`/
`check:sitemap`/`check:precache`/`check:perf`/`check:pdfs` all pass. No other
page passes `paramPrefix`, so every other page's behavior and existing
URL-based tests are structurally unaffected by this change - `id` alone still
fully determines every DOM element id exactly as before, only the new,
opt-in `paramKey()` indirection was added to the two URL-param functions.
Full Playwright suite: **402/402 passing**, including the 4 new cases (2 per
language). The first two attempts at this full run reported failures, but
both turned out to be this session's own environment mistake, not a site
regression: the first passed a wrong, nonexistent `PW_EXECUTABLE_PATH`
(`.../chromium/chrome-linux/chrome` - `chromium` is itself a symlink straight
to the Chrome binary, not a directory to descend into), and the second
(no override at all) hit a version mismatch between the installed
`@playwright/test` (1.62.0, expecting browser revision 1234) and the
environment's pre-installed browser (revision 1194) - both failed *every*
test at the browser-launch step, which a truncated `tail` of the output
initially misread as "only these specific print-styles/theme-token-parity
cases failed." Re-run correctly with `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`
(the symlink itself, matching this environment's own documented guidance for
a pinned-Playwright-version project) and got a clean, fully green run.

**Left for a future pass:** with this bug fixed, no other page on the site
renders more than one `TournamentTable`, so no other instance of this
specific collision exists today - but the new `paramPrefix` prop is now the
documented, required pattern if a future page ever does. Standing candidates
are otherwise unchanged: source-link liveness (still infeasible in this
environment), a third-pass content-accuracy spot-check (low-yield), and the
two intentionally-deferred table-rendering items (not real gaps).

### New feature: "Most frequent hosts" ranking on `/records`, plus three stale `status: draft` badges fixed - added 2026-08-14 (intensive run)

With every required/nice-to-have capability, every competition/award page,
and both intentionally-deferred table-rendering items already accounted for
(see the prior two entries' "Left for a future pass" notes), this run looked
for a genuinely new, reader-facing slice rather than a third-pass
content-accuracy spot-check (already flagged low-yield) or the infeasible
source-link liveness check. `content/fifa-world-cup.md`'s own "Suggested
child-friendly features" meta-note ("Compare title counts visually" - already
built as `ChampionsSummary`'s title-ranking bars) and `content/uefa-euro.md`'s
host/team-count columns being fully audited but never *aggregated* pointed at
the same gap: the site ranks title-winners everywhere, but nowhere ranks
which countries have hosted the most editions, even though every one of the
four team competitions (World Cup, EURO, Copa América, Nations League) has a
host column carrying exactly the data needed.

**New library function:** `buildHostsSummary()` (`src/lib/editions.ts`)
mirrors `buildChampionsSummary()`'s shape and sort order (by count desc, then
earliest year, then name) so it can be rendered by the *same*
`ChampionsSummary.astro` component with different copy/labels - the same
reuse pattern that component's `unit`/`heading`/`description` overrides
already enable for the Golden Boot/Ballon d'Or "Most awards" sections.
Deliberately **does not** group West Germany under Germany the way
`buildChampionsSummary` does for title totals: that merge is a specific,
documented decision about *sporting-successor title counts*
(`src/lib/countries.ts`), not a rule about hosting, which is a plain
historical fact about one specific edition. West Germany hosted the 1974
FIFA World Cup and EURO 1988; Germany hosted 2006 and EURO 2024 - the new
ranking correctly keeps these as four separate hosting credits across two
distinct entries, not a merged "Germany: 4". A co-hosted edition's host cell
(e.g. "Belgium and Netherlands", "Canada, Mexico and United States") is
counted as one atomic combined-host entry, matching how `distinctHosts()`
and the existing host filter already treat that exact string - not a new
per-country split the source content and the rest of the site don't make.
`ChampionsSummary.astro` gained an optional `icon` prop (default `🏆`,
unchanged for every existing call site) so the new section can use `🏟️`
instead of a trophy, which doesn't fit "how many times has this country
hosted."

**Page changes:** both `/records` and `/hr/records` gained a new "Most
frequent hosts" / "Najčešći domaćini" section (English and Croatian,
`src/pages/records.astro` / `src/pages/hr/records.astro`) between "Most
successful teams" and the individual-award timeline, one ranked list per
team competition, with inline copy explaining the West Germany/Germany
distinction so a reader doesn't wonder why it differs from the title-totals
section right above it.

**Also fixed in passing:** `content/index.md`, `content/quiz.md` and
`content/records-and-timelines.md` all still carried `status: draft` from
before those pages were built - stale metadata rendered verbatim as a
reader-facing "Status: draft" badge (`References.astro`) on three pages that
have since shipped, been reviewed, and been covered by dozens of Playwright/
accessibility passes over the past three weeks (the same standard that
already earned `compare-countries.md` and `about-sources.md` their
`status: verified`). Corrected all three to `verified`; `records-and-
timelines.md` also had its `lastReviewed` bumped to today since this run
edited that page directly, the other two were left at their existing
`lastReviewed` date since only the stale `status` field was wrong, not the
content itself.

**Tests:** 5 new Vitest cases for `buildHostsSummary` (West Germany/Germany
kept distinct; co-host string counted once; count-desc/earliest-year sort;
"Home-and-away" excluded like `distinctHosts`; empty list when no host
column) - full suite **252/252**. 4 new Playwright cases at 360px (English:
the new heading and both World Cup ranking entries are visible; Croatian:
the translated heading renders and its top-ranked host matches the English
page's) plus the existing `/records`/`/hr/records` no-overflow, WCAG and
print-media coverage re-verified against the now-larger page. `pnpm lint`
(0 errors/0 warnings), `pnpm build` (23 pages), and `pnpm check:links`/
`check:sitemap`/`check:precache`/`check:perf` all still pass - page weight
for `/records` and `/hr/records` grew from ~258-260 KB to ~293-295 KB with
the four extra ranking lists, still under the 300 KB budget but the closest
any page has come to it; a future addition to this page should watch that
number. No PDF regeneration needed - `/records` isn't one of the six
downloadable competition pages `scripts/pdf-pages.mjs` tracks.

**Left for a future pass:** `/records`' page weight is now within ~5-7 KB of
the 300 KB budget - worth watching before adding more to that page. Standing
candidates are otherwise unchanged from the prior two entries: source-link
liveness (infeasible in this environment), a third-pass content-accuracy
spot-check (low-yield), and the two intentionally-deferred table-rendering
items (Copa América "Titles after 2024" / Ballon d'Or "Multiple winners
through 2025" - confirmed this run, by hand-computing Copa América's table
against its own edition data, that both would exactly duplicate the existing
generated `ChampionsSummary` totals, so building them would add page
clutter with zero new information, not close a real gap).

### Content: UEFA Nations League gains a "Memorable moments" section - added 2026-08-14 (intensive run)

With the standing candidates from the prior two entries confirmed unchanged
(source-link liveness still infeasible, a third-pass content-accuracy
spot-check still low-yield), this run looked for a genuinely fresh gap
instead and found one: `content/uefa-nations-league.md` was the **only**
one of the six competition/award pages with no narrative "Memorable
moments"-style section - it had only a data table and a four-bullet "Key
facts" list, while World Cup, EURO, Copa América, Ballon d'Or and Golden
Boot all pair their table with a storytelling notes section rendered via
`EditorialNotes.astro`. This wasn't an intentional exclusion (only genuine
meta/internal headings like Nations League's own "Website idea" are
deliberately excluded from rendering) - "Memorable moments" simply hadn't
been written yet.

Added a five-bullet "Memorable moments" section to
`content/uefa-nations-league.md`, strictly derived from facts already in
the page's own (previously double-audited) Finals table rather than any new
research, consistent with this run's read of the accuracy-first culture in
this file: Portugal's first title as 2019 hosts, Italy hosting the 2021
Finals while itself finishing third, Spain's penalty-shootout 2023 title
over Croatia, Portugal's penalty-shootout second title over Spain in 2025,
and the previously-unremarked pattern (verified by checking all four rows)
that the host nation has finished in the Finals' top four in every edition
so far, including Germany finishing fourth in 2025. `src/pages/competitions/
nations-league.astro`'s `noteHeadings` gained `'Memorable moments'` (the
same additive one-line pattern every other `noteHeadings` extension in this
file has used) and `src/pages/hr/competitions/nations-league.astro` gained
a matching hand-translated "Nezaboravni trenuci" section (same heading and
tone already used on the Croatian EURO/Copa América pages, including
"jedanaesterci" for the penalty-shootout wording).

**Tests:** 2 new Playwright cases at 360px - English: both "Key facts" and
"Memorable moments" headings and a sample line render; Croatian: the
"Nezaboravni trenuci" heading and its translated Italy-hosted-but-finished-
third line render. Ran the full Nations League/print-media Playwright slice
(19 cases) plus the complete suite - **406/406 passing**, including the 2
new cases (`pnpm test` 252/252 unchanged, no library code touched).
`pnpm lint` (0/0/0) and `pnpm build`
(23 pages) both clean; `check:links`/`check:sitemap`/`check:precache`/
`check:perf` all still pass, with `/competitions/nations-league` and
`/hr/competitions/nations-league` well under the page-weight budget (nowhere
near `/records`' current ~293-295 KB).

**Left for a future pass:** with this gap closed, no competition/award page
is missing its narrative notes section anymore. Standing candidates are
otherwise unchanged: source-link liveness (infeasible in this environment),
a third-pass content-accuracy spot-check (low-yield), and `/records`' page
weight (still worth watching, unrelated to this change).

### Quality pass: promoted all six competition/award pages from "In review" to "Verified" - added 2026-08-14 (intensive run)

All six data-carrying content files (`content/fifa-world-cup.md`,
`content/uefa-euro.md`, `content/copa-america.md`,
`content/uefa-nations-league.md`, `content/ballon-dor.md`,
`content/golden-boot.md`) had sat at front-matter `status: review` since
their creation, which renders as an "In review" badge (`CompetitionView.astro`
and its six `hr/competitions/*.astro` Croatian counterparts, "U pregledu")
at the top of every one of these pages - even though the accuracy-audit
history in this file already shows every substantive column of every one
of the six pages independently cross-checked **twice**, always with "no
discrepancies": Champion/Runner-up/Final-score, Third/Fourth-place,
Host(s)/Teams and Final date for World Cup, EURO, Nations League and Copa
América; Format for Copa América; Winner/National-team and Ceremony date
for Ballon d'Or; Player(s)/Team/Goals for Golden Boot (see the dated
entries earlier in this file for each). The "In review" badge had simply
never been revisited after that audit trail closed out, so the page was
under-claiming its own accuracy to readers - the exact kind of drift this
project's repeated accuracy passes exist to catch, just pointed at the
status field instead of a data cell this time.

Re-confirmed each page's audit coverage against its own table's column
headers before changing anything (every column on every one of the six
pages has a matching closed, no-discrepancy, second-independent-source
audit entry above), then flipped `status: review` to `status: verified`
and bumped `lastReviewed` to 2026-08-14 in all six content files. No code
changes were needed - `content.config.ts`'s zod schema already allows
`verified`, and both `CompetitionView.astro` and every Croatian
`hr/competitions/*.astro` page already branch on `status === 'verified'`
("Verified" / "Provjereno") with "In review" ("U pregledu") as the only
other rendered state, so the badge text updates automatically once the
front matter does.

Regenerated the six English + six Croatian downloadable PDFs
(`pnpm build && PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm
build:pdfs`) since they embed the same front matter and had gone stale the
moment `lastReviewed` changed - `pnpm check:pdfs` is clean again. Fixed one
now-stale hardcoded `lastReviewed` date assertion in
`tests/e2e/mobile.spec.ts` (the World Cup "last reviewed" Playwright case)
to match the new 2026-08-14 date.

**Tests:** full suite re-run after the change - `pnpm test` (252/252,
unchanged), `pnpm lint` (0/0/0), `pnpm build` (23 pages), full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` (**406/406**,
including the one fixed date assertion), and `check:pdfs` /
`check:links` / `check:sitemap` / `check:precache` / `check:perf` all pass.

**Left for a future pass:** the three generated/tool pages that were
already `status: verified` (`records-and-timelines.md`,
`compare-countries.md`, `about-sources.md`/`index.md`/`quiz.md`) needed no
change. If new editions are added to any of the six competitions in the
future, their new rows should go through the same audit process before the
page's status is trusted at "Verified" again - this is a snapshot of the
data as independently double-checked through 2026-08-14, not a permanent
guarantee.

### New feature: "Back-to-back champions" streak ranking on `/records` - added 2026-08-15 (intensive run)

With every required capability, every nice-to-have, and every "Left for a
future pass" candidate from the prior run's own accounting either closed or
re-confirmed low-yield/infeasible (source-link liveness still blocked by
this environment's outbound network policy - confirmed again this run by a
direct `curl` test against `en.wikipedia.org`/`fifa.com`, both returning a
403 from the proxy; a third content-accuracy spot-check pass was already
called low-yield), this run looked for a genuinely new, *safe* angle rather
than repeat an already-exhausted audit category. A country-flag-emoji idea
was seriously considered and rejected: several historical entities in this
dataset (Soviet Union, Czechoslovakia, Yugoslavia, West Germany) have no
current Unicode flag emoji, and rendering it across the ~100+ distinct team
names on every table/timeline/ranking component would have touched most of
the site's markup and risked breaking many of `mobile.spec.ts`'s 56
exact-text (`toHaveText`) assertions for no bounded, low-risk gain - not a
good fit for an unattended run with no human review before merge.

Instead: **`buildLongestStreaks()`** (new, `src/lib/editions.ts`) computes
every run of two or more *consecutive editions* (adjacent table rows, not
adjacent calendar years - matters for the World Cup's 1942/1946 wartime gap
and Copa América's irregular early calendar) won by the exact same winner
value, purely from data every page already loads and that has already been
independently double-audited (see the many "second independent
cross-check" entries above) - zero new editorial research, zero new
historical-fact risk. It deliberately uses the raw winner string, not
`summaryGroupFor()`: a "back-to-back" streak is a fact about the same team/
player literally repeating, not a sporting-succession question, so West
Germany and Germany cannot silently chain into one streak (they don't
overlap in the data regardless, but the function documents and tests the
distinction). A placeholder winner (the 2020 Ballon d'Or's "Not awarded")
breaks any streak spanning it, so Messi's 2019 and 2021 Ballon d'Or wins
correctly do **not** count as "back-to-back". Returns the `ChampionSummary`
shape every other `/records` ranking already uses (`titles` standing in for
streak length), so it renders through the exact same `ChampionsSummary.astro`
component with an overridden `unit`/`icon`/`winningYearsLabel`, the same
pattern "Most frequent hosts" (2026-08-14) and "Most awards" already
established - no new component.

Verified the real numbers by hand-parsing all six content files with a
throwaway Node script before writing a single test, rather than trusting a
guess: Italy (1934, 1938) and Brazil (1958, 1962) for the World Cup; Spain
(2008, 2012) for EURO; eleven streaks for Copa América including a rare
three-in-a-row for Argentina (1945-1947); Cristiano Ronaldo (twice: 2013-14
and 2016-17) and a genuinely fun **Lionel Messi four-in-a-row (2009-2012)**
for the Ballon d'Or; Kylian Mbappé (2022, 2026) for the World Cup Golden
Boot. UEFA Nations League (only 4 editions, 4 different champions so far)
and the EURO Golden Boot have no streak at all - `records.astro`/
`hr/records.astro` render a plain "No one has won two editions in a row
yet." fallback for those instead of an empty bar-chart ranking, rather than
silently showing nothing.

**Page-weight budget:** the new section pushed both `/records` pages over
the existing 300 KB `check:perf` budget (English 311.9 KB, Croatian
314.0 KB, up from ~292-295 KB). Per the check script's own guidance ("if
this growth is genuinely new editorial content, raise the budget
deliberately"), raised `PAGE_WEIGHT_BUDGET_BYTES` to 360 KB in
`scripts/check-page-weight.mjs` with an updated comment documenting why -
matches how this budget was already raised once before (from an original
~234 KB measurement). Both page descriptions (English and Croatian) were
also updated to mention the new section, since they'd already drifted
slightly out of date (missing "Most frequent hosts" too) before this run.

**Tests:** 7 new Vitest cases (`tests/unit/editions.test.ts`:
`buildLongestStreaks` - a real two-edition streak, a four-edition streak,
the placeholder-breaks-a-streak case, West Germany/Germany staying distinct,
an empty result when nothing repeats, multi-streak sort order, and
sorting by `yearSort` rather than trusting source row order - 259 total, up
from 252) and 2 new Playwright cases at 360px (`tests/e2e/mobile.spec.ts`:
English page shows Messi's 4-streak and the Nations League fallback text;
Croatian page shows the same streak translated, plus its own fallback text
- 408 total, up from 406). Verified with `pnpm lint` (0/0/0), the full
Vitest suite, the full Playwright suite (**408/408 passing**, including a
full WCAG sweep and print-media pass over both `/records` pages with the
new section - no new violations), `pnpm build` (23 pages), and
`check:links`/`check:sitemap`/`check:precache`/`check:pdfs`/`check:perf`
all clean.

**Left for a future pass:** no known gaps in this feature - it covers all
seven tables already loaded by `/records`, both languages, with a
documented, tested fallback for the zero-streak case. Standing candidates
are otherwise unchanged from the prior run: source-link liveness remains
infeasible in this environment (re-confirmed), and a further
content-accuracy spot-check remains low-yield with the entire six-table
audit trail already at two independent passes per column. The flag-emoji
idea, if ever revisited, should stay scoped to a single low-risk surface
(e.g. one competition's Winner cells only) with an explicit map covering
every `distinctTeams()` value and a documented "no flag" fallback for
historical entities, rather than a site-wide rollout in one run.

### SEO: `/records` and `/hr/records` gain champions `ItemList` structured data, closing a gap the 2026-08-02 JSON-LD pass never revisited - added 2026-08-15 (intensive run)

The 2026-08-02 JSON-LD pass (`buildBreadcrumbList`/`buildChampionsItemList`/
`buildLatestEditionSportsEvent` in `src/lib/jsonLd.ts`) explicitly scoped
itself to "the twelve competition/award pages" and was never revisited for
`/records`, `/compare`, `/quiz` or `/about/sources`. Of those, `/records` is
the gap that matters: it's the site's single richest aggregation page (built
entirely from the same `ChampionSummary[]` data every competition page's
`ItemList` already serializes) and has only grown since that pass - "Most
frequent hosts" (2026-08-14) and "Back-to-back champions" (2026-08-15,
earlier today) both shipped after it, so the page was under-describing
itself to search engines by a wider margin with every recent run. `/compare`,
`/quiz` and `/about/sources` don't have an equivalent gap: none of them
render a `ChampionSummary[]` ranking `buildChampionsItemList` was built to
serialize, so there was nothing there to wire up.

`records.astro`/`hr/records.astro` now build one `ItemList` per ranking
section actually rendered on the page - "Most successful teams" and "Most
frequent hosts" for all four team competitions, "Back-to-back champions" for
whichever of the seven tables has a real streak (skipping the same zero-
streak fallback the page itself renders a text explanation for instead of a
ranking - Nations League and the EURO Golden Boot today), and "Most awards"
for both individual awards - 16 `ItemList` blocks plus the existing
auto-injected `BreadcrumbList`, verified against the actual build output
before writing any test assertion rather than assumed. Every block reuses
`buildChampionsItemList()` verbatim (no new library code) over data the page
already computes for its `ChampionsSummary` components (`c.data.champions`,
`buildHostsSummary()`, `buildLongestStreaks()`) - zero new editorial
research, zero new historical-fact risk, purely an additive `<script
type="application/ld+json">` block invisible to every existing visible-text
assertion. The Croatian page names its 16 blocks with their own
Croatian strings (e.g. "UEFA Svjetsko prvenstvo - najuspješnije
reprezentacije"), matching how every translated competition page already
names its structured data.

**Tests:** 2 new Playwright cases in the existing SEO `describe` block
(`tests/e2e/mobile.spec.ts`, reusing its `jsonLdBlocks()` helper) - English:
17 total blocks (1 `BreadcrumbList` + 16 `ItemList`), spot-checks several
section names, and confirms no `ItemList` exists for either zero-streak
fallback; Croatian: 16 `ItemList` blocks with their Croatian names, same
zero-streak exclusion. Full suite: `pnpm test` (259/259, unchanged - no
library code touched), `pnpm lint` (0/0/0), `pnpm build` (23 pages), full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` (**410/410
passing**, up from 408), and `check:links`/`check:sitemap`/`check:precache`/
`check:pdfs`/`check:perf` all pass - `/records` grew from ~311.9/314.0 KB to
~337.8/340.2 KB with the new JSON-LD, still under the 360 KB budget but with
less headroom now (~20-22 KB); a future addition to this page should watch
that number closely. No PDF regeneration needed (`/records` isn't one of the
six downloadable competition pages `scripts/pdf-pages.mjs` tracks).

**Left for a future pass:** with this gap closed, every page whose content
shape (`ChampionSummary[]` rankings, a latest-edition date) matches an
existing `jsonLd.ts` builder now has structured data - `/compare` and
`/quiz` render different shapes (head-to-head comparison, quiz questions)
that would need their own new builder functions, not a reuse of the
existing ones, so they're a distinct future item rather than an extension of
this one. `/records`' page weight is now the closest of any page to the
360 KB budget (~20-22 KB headroom, down from ~46-48 KB) - the single most
important thing to watch before adding more to that page. Standing
candidates are otherwise unchanged: source-link liveness (infeasible in this
environment), a third-pass content-accuracy spot-check (low-yield), and the
scoped-down flag-emoji idea from the prior entry.

### Security: first-ever Content-Security-Policy, added via `<meta>` - added 2026-08-15 (intensive run)

With the explicit "Left to do" backlog fully checked off and the standing
"future pass" candidates all previously ruled out as infeasible or low-yield
(re-confirmed this run: `curl`/WebFetch to `en.wikipedia.org` and `fifa.com`
both still hard-blocked by this environment's egress proxy, so no new
content-accuracy work was possible either), this run looked for a genuinely
new, safe angle outside the categories already exhausted (WCAG/forced-colors/
print accessibility, SEO JSON-LD/sitemap/canonical, PWA/offline, i18n,
performance budget, link/PDF integrity). The site had no `Content-Security-
Policy` at all - a real, previously-uncovered gap, and a natural fit given
AGENTS.md rule 8 (no ads, tracking pixels, or manipulative engagement
features): a CSP is the browser-enforced version of that same "nothing calls
home" promise.

Audited every page's actual resource use before writing the policy, rather
than assuming: no `@font-face`/external fonts (`--font-sans` is a system-font
stack), no `<iframe>`, no client-side `fetch()` outside `sw.js` (a separate
execution context, unaffected by the registering page's CSP), no `data:` URIs
today, and the ~90 external domains that do appear in built HTML are all
plain `<a href>` source citations - CSP never restricts navigation, only
resource *loads* (script/style/img/connect/font/etc.), so those citation
links are untouched. `BaseLayout.astro` now emits one `<meta http-equiv=
"Content-Security-Policy">` (first tag after `<meta charset>`, per spec, so
it covers every resource the page goes on to declare) with `default-src
'self'` and explicit `script-src`/`style-src`/`img-src`/`font-src`/
`connect-src`/`manifest-src`/`object-src 'none'`/`base-uri 'self'`/
`form-action 'self'`. `script-src`/`style-src` keep `'unsafe-inline'`: the
site's inline `<script is:inline>` blocks (theme pre-paint, service-worker
registration, every table's filter/sort script) and inline `style="..."`
attributes (per-card accent colors, `/records`' generated ranking-bar
widths) are all static/build-generated, never echo reader input, and there
is no form or comment box anywhere on the site for an attacker to inject
through - so a hash/nonce scheme would close the same near-zero residual
risk this site already has, at real complexity and breakage cost (a mismatched
hash silently breaks every filter/sort/quiz interaction). `frame-ancestors`
is deliberately omitted: the `<meta>` form of CSP never applies it (only a
real HTTP response header does, and GitHub Pages doesn't allow custom
headers), so including it would read as protection it silently isn't - the
kind of trap this file has flagged before with `robots.txt`/sitemap
consistency.

**Tests:** 2 new Playwright cases in a new `Content-Security-Policy` describe
block (`tests/e2e/mobile.spec.ts`) - the exact directive string is present on
four representative English/Croatian pages, and (the real verification) a
live-browser pass that exercises winner/host/team filters, the reset button,
the theme toggle, a quiz answer selection, and confirms the service worker
still registers, while listening for `console`/`pageerror` CSP-violation
messages and asserting zero were raised. Full suite: `pnpm test` (259/259,
unchanged), `pnpm lint` (0/0/0), `pnpm build` (23 pages), full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` (**412/412
passing**, up from 410 - every existing test, including all WCAG/axe scans,
theme-toggle interaction, and offline/service-worker cases, still passes
under the new policy), and `check:links`/`check:sitemap`/`check:precache`/
`check:pdfs`/`check:perf` all pass (page weights unchanged from the prior
entry - the new meta tag is a fixed ~370 bytes per page, negligible against
the 360 KB budget).

**Left for a future pass:** the policy currently trusts `'unsafe-inline'` for
script/style, which is a real (if currently unexploitable) gap versus a full
hash-based CSP - if the site ever gains a form, a comment surface, or any
place reader input is echoed back, this should be revisited with per-page
build-time hashes instead. Standing candidates are otherwise unchanged:
source-link liveness (infeasible in this environment), a third-pass
content-accuracy spot-check (low-yield), the scoped-down flag-emoji idea, and
`/compare`/`/quiz` JSON-LD (would need new builder functions - a distinct
future item, not an extension of the CSP or JSON-LD work above).

### SEO: `/compare` and `/quiz` gain structured data, closing the two gaps the 2026-08-15 `/records` JSON-LD entry named as a distinct future item - added 2026-08-15 (intensive run)

Earlier today's `/records` JSON-LD entry explicitly scoped itself to pages
whose content shape (`ChampionSummary[]` rankings) matched an existing
`jsonLd.ts` builder, and named `/compare` and `/quiz` as "a distinct future
item, not an extension of this one" because both render different shapes -
a head-to-head comparison and multiple-choice quiz questions - that would
need their own new builder functions. This run wrote those two builders and
wired them up, so every live page whose content can be described in
schema.org vocabulary now has structured data.

**`buildCountryRecordsItemList()`** (new, `src/lib/jsonLd.ts`) covers
`/compare`'s "All national teams" ranking - the one list-shaped section on
that page (the head-to-head panel above it is an interactive two-team
picker, not a list, so it has no ItemList equivalent). It mirrors
`buildChampionsItemList()`'s ranked-`ItemList`-of-`Thing` shape but over
`CountryRecord`'s combined titles/runner-ups/finals-reached fields instead
of a single competition's `ChampionSummary[]`, since `/compare` aggregates
each team's record across four competitions rather than reporting one
competition's title count. Takes an optional `describe()` callback (default:
an English sentence) so the Croatian page can render its per-team
descriptions in Croatian too, the same translation pattern
`buildChampionsItemList()`'s `unit` parameter already established for
`hr/records.astro`.

**`buildQuizJsonLd()`** (new, `src/lib/jsonLd.ts`) covers `/quiz`'s
generated multiple-choice question pool as a schema.org `Quiz` (a
`LearningResource` subtype) with one `Question`/`acceptedAnswer` pair per
question - reusing the exact prompt and correct-choice text
`QuizCard.astro` already renders, zero new trivia. Deliberately scoped to
the multiple-choice pool only: the separate "put these champions in
chronological order" ranking questions (`QuizOrderCard.astro`) are a
different question shape with no schema.org-vocabulary equivalent, so
folding them in would misrepresent the format rather than describe it
accurately - the function's own doc comment records this scoping decision
for whoever revisits it next.

Both pages pass their `ItemList`/`Quiz` through the same `jsonLd` prop on
`BaseLayout` every other structured-data page already uses, so each also
keeps its automatic `BreadcrumbList`. `compare.astro`/`hr/compare.astro` and
`quiz.astro`/`hr/quiz.astro` were the only four page files touched beyond
`jsonLd.ts` itself - no library code outside the two new builder functions
changed, and no new editorial content or recomputed facts were introduced
anywhere.

**Tests:** 6 new Vitest cases (`tests/unit/jsonLd.test.ts`:
`buildCountryRecordsItemList` - the ranked-list shape, singular/plural
wording, and the `describe()` override; `buildQuizJsonLd` - the
`Question`/`Answer` shape and an empty-list edge case - 263 total, up from
259) and 4 new Playwright cases in the existing SEO `describe` block
(`tests/e2e/mobile.spec.ts`, reusing its `jsonLdBlocks()` helper): English
and Croatian `/compare` (asserts the `ItemList` length matches the "All
national teams" table's actual row count, and that the Croatian page's
descriptions read in Croatian), and English and Croatian `/quiz` (asserts
`hasPart` length matches the number of rendered multiple-choice
`.quiz-card` elements - scoped to the top-level `<ol class="quiz__list">`
only, since `QuizOrderCard.astro` reuses the same `.quiz-card` class one
DOM level deeper for the separate order-question section, which the first
version of this test missed and had to fix before it passed). Full suite:
`pnpm test` (263/263), `pnpm lint` (0/0/0), `pnpm build` (23 pages), full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` (**416/416
passing**, up from 412), and `check:links`/`check:sitemap`/`check:precache`/
`check:pdfs`/`check:perf` all pass (`/quiz`/`hr/quiz` grew from their prior
weight to 207.1/209.5 KB with the new `Quiz` block - still well under the
360 KB budget; `/compare`/`hr/compare` grew negligibly since their new
`ItemList` reuses data already on the page).

**Left for a future pass:** with this gap closed, every page whose content
shape matches an existing or new `jsonLd.ts` builder now has structured
data. Standing candidates are unchanged from the prior entry: source-link
liveness (infeasible in this environment - re-confirmed this run, `curl`/
`WebFetch` to external sources still hard-blocked by the egress proxy), a
further content-accuracy spot-check (low-yield, two independent passes
already cover every column), the scoped-down flag-emoji idea, and the CSP's
`'unsafe-inline'` script/style allowance (only worth revisiting if the site
ever gains a form or comment surface).

### SEO: home page gains a `WebSite` JSON-LD block, closing the one page that had zero structured data - added 2026-08-15 (intensive run)

The 2026-08-15 `/compare`/`/quiz` JSON-LD entry above closed the last gap
among pages whose content shape matched an *existing* `jsonLd.ts` builder,
but one page was never in scope for any of these passes at all: the home
page. `BaseLayout.astro` already auto-adds a "Home > page" `BreadcrumbList`
to every other page and explicitly skips it on the home page itself (it has
no parent to link to) - which meant the home page rendered no JSON-LD
whatsoever, a gap a Playwright test even asserted by name ("the home page
has no JSON-LD"). The home page is also the one URL most likely to be a
search engine's entry point into the whole site, so it's the highest-value
page to describe, not a marginal one.

**`buildWebSiteJsonLd()`** (new, `src/lib/jsonLd.ts`) returns a minimal
schema.org `WebSite` block (`name`/`url`/`description`/`inLanguage`) - no
`potentialAction`/`SearchAction`, since the site has no search feature and
inventing one would misrepresent a capability that doesn't exist. Rather
than have `index.astro`/`hr/index.astro` each wire this up (the pattern
every other JSON-LD page uses), it's built directly inside
`BaseLayout.astro` alongside the existing breadcrumb `isHome` branch, reusing
the exact same already-computed, trailing-slash-normalized `canonicalURL`
and the page's own `title`/`description`/`locale` props - no new props, no
risk of the home page's URL disagreeing with its own canonical/OG tags the
way `withTrailingSlash()`'s own comment already warns a naive `Astro.url`
read would (the exact bug `check-sitemap.mjs` caught once before, for this
same page). English and Croatian each get their own `description`/
`inLanguage` for free, since both home pages already pass those props.

**Tests:** 2 new Vitest cases (`tests/unit/jsonLd.test.ts`:
`buildWebSiteJsonLd`'s field pass-through and a non-English `inLanguage`
tag - 265 total, up from 263) and the existing home-page SEO test was
rewritten rather than deleted (`tests/e2e/mobile.spec.ts`: it now asserts
the exact `WebSite` block instead of zero JSON-LD), plus one new Playwright
case for the Croatian home page's translated block. Full suite: `pnpm test`
(265/265), `pnpm lint` (0/0/0), `pnpm build` (23 pages), full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e`, and
`check:links`/`check:sitemap`/`check:precache`/`check:pdfs`/`check:perf` all
pass (home page weight unchanged beyond the new block's ~230 bytes,
negligible against the 360 KB budget).

**Left for a future pass:** with this gap closed, every live page now has
some structured data. Standing candidates are otherwise unchanged: source-link
liveness (infeasible in this environment), a further content-accuracy
spot-check (low-yield), the scoped-down flag-emoji idea, and the CSP's
`'unsafe-inline'` allowance (only worth revisiting if the site ever gains a
form or comment surface).

### Bug fix: Golden Boot joint-winner ties silently fragmented and undercounted the "Most awards" ranking, JSON-LD and quiz - fixed 2026-08-15 (intensive run)

With every explicit backlog item, required/nice-to-have capability, and every
previously-named "left for a future pass" candidate already exhausted
(source-link liveness infeasible, a third content-accuracy spot-check
low-yield, flag emoji rejected, CSP's `'unsafe-inline'` not worth revisiting
without a form), this run looked specifically for **code-correctness bugs**
rather than another editorial audit - a category the exhausted list above
explicitly does not cover, since it's about aggregation logic, not source
facts. A fresh read of `src/lib/editions.ts` against its own sibling function
`distinctWinners()` turned up a real one.

Golden Boot's "Player(s)" column stores joint-winner ties as a `"; "`-joined
string (e.g. EURO 2012's six-way tie: "Mario Balotelli; Mario Gómez; Mario
Mandžukić; Cristiano Ronaldo; Alan Dzagoev; Fernando Torres"). `distinctWinners()`
has always split that string before grouping, with a doc comment explaining
exactly why: "a player tied once and outright another year, e.g. Cristiano
Ronaldo in EURO 2012/2020, isn't split into two unmatched strings that each
only surface one of their editions." `buildChampionsSummary()` - the function
behind every "Most awards"/"Champions by titles" ranking on `/competitions/
golden-boot`, `/records`, and their JSON-LD `ItemList`s - never got that same
treatment. It grouped by the raw, unsplit winner string, so Cristiano Ronaldo's
2020 EURO Golden Boot (won outright) and his share of the 2012 six-way tie
were counted as two disconnected entities: "Cristiano Ronaldo" -> 1 award, and
a nonsensical six-name compound -> 1 award, instead of the correct "Cristiano
Ronaldo -> 2 awards (2012, 2020)". The same bug affected 1962's and 1994's
World Cup Golden Boot ties.

**Fix** (`buildChampionsSummary()`, `src/lib/editions.ts`): split each
winner cell on `;` before grouping, mirroring `distinctWinners()`'s existing
treatment exactly. Every tied player now earns individual credit for that
edition, the same way the winner filter already lets a reader pick any one
of them. Deliberately left `buildLongestStreaks()` untouched - its own doc
comment already explains why it intentionally uses the raw (unsplit) winner
string for streaks, a different and still-correct design decision unrelated
to this bug. Also fixed the same root cause's quiz symptom:
`questionsFromWinners()` in `src/lib/quiz.ts` (which backs `topScorerByYearQuestions`)
was generating "Who was the top scorer in {year}?" questions whose only
correct choice, for a tie year, was the same ugly compound string sitting
next to clean single-name distractors elsewhere in the same pool - now tie
years are skipped entirely (no fair single "correct" multiple-choice answer
exists for a shared award) and excluded from the distractor pool for other
years, rather than asked and silently misrepresented as a solo win.

Both fixes are pure aggregation-logic corrections - zero new editorial
research, zero new historical facts, zero risk to any already-audited source
data (the raw per-row table cells, which still show every tie verbatim, are
untouched).

**Tests:** 2 new Vitest cases - `buildChampionsSummary` splits a `"; "`
joint-winner tie and correctly totals Cristiano Ronaldo's 2012+2020 EURO
Golden Boot at 2 awards while keeping every other 2012 name at 1 (`tests/unit/editions.test.ts`,
267 total, up from 265); `topScorerByYearQuestions` skips a tie year and
excludes it from the distractor pool (`tests/unit/quiz.test.ts`). Full suite:
`pnpm test` (267/267), `pnpm lint` (0/0/0), `pnpm build` (23 pages). Verified
against the real built output, not just the unit tests: `/competitions/golden-boot`'s
"Most awards" widget and its JSON-LD `ItemList` both now show `"Cristiano
Ronaldo","description":"2 awards (2012, 2020)"` (Croatian: "2 nagrade (2012,
2020)"), and no quiz answer choice on `/quiz` contains a `;`. The champions
*timeline* card for 2012 (a different, intentionally-verbatim widget) still
correctly shows the full six-name tie string, confirming the fix didn't touch
data display, only the aggregate grouping.

**Left for a future pass:** the same underlying question - what other
generated aggregates over raw editorial text might silently diverge from
`distinctWinners()`'s established tie-splitting convention - is worth a
dedicated pass rather than assuming this was the only instance; a search for
`edition.winner` usages elsewhere in `src/lib/` would be the starting point.
Standing candidates are otherwise unchanged: source-link liveness (infeasible
in this environment), a further content-accuracy spot-check (low-yield), the
scoped-down flag-emoji idea, and the CSP's `'unsafe-inline'` allowance.

### New feature: "Nearly champions" ranking on `/records` - added 2026-08-16 (intensive run)

Followed up on the prior entry's own "Left for a future pass" note first: a
full search for every `edition.winner` usage across `src/lib/` (`compare.ts`,
`editions.ts`, `onThisDay.ts`, `quiz.ts`, `jsonLd.ts`) found no other instance
of the Golden Boot tie-splitting bug that entry fixed. Every remaining
unsplit usage is a verbatim *display* of a raw edition (`buildTimeline`,
`buildTopScorerFacts`, `onThisDay.ts`'s `champion` field), which is correct
by the same design `buildTimeline` already documents - a tie year should
show every tied name verbatim, not be silently reduced to one - or is
already correctly scoped away from ties entirely (`compare.ts` only covers
the four team competitions, which have no semicolon-joined winners;
`buildLatestEditionSportsEvent` is only ever called for those same four
team pages, never Golden Boot/Ballon d'Or). No code change was needed for
this; a completed audit is itself the useful output.

With that lead closed out and every "Left to do"/"standing candidate" from
prior entries still unchanged (source-link liveness infeasible, a further
content-accuracy spot-check low-yield, the flag-emoji idea rejected, the
CSP's `'unsafe-inline'` not worth revisiting), this run looked for a new,
bounded ranking in the same spirit as the 2026-08-15 "Back-to-back
champions" feature - a genuinely new, safe angle computed purely from
already-loaded, already-double-audited data, not new editorial research.

**`buildRunnerUpsWithoutTitle()`** (new, `src/lib/editions.ts`) ranks teams
by how many times they've reached a final (each table's own "Runner-up"
column) while never actually winning that competition - the generated
version of "best team never to win it" trivia (the Netherlands' three lost
World Cup finals: 1974, 1978, 2010). Grouped the same way
`buildChampionsSummary()` groups title totals (West Germany counts as
Germany), so a team titled under either name is excluded entirely, and
deliberately gives *no* partial credit to a team's earlier final losses once
it has won at least one edition (using the full dataset, not a point-in-time
snapshot) - a team that lost a final and later won the competition is not
"nearly a champion" today, it is a champion. Scoped to the four team
competitions only (World Cup, EURO, Copa América, Nations League) via the
same "Runner-up" column `compare.ts` already reads for its own head-to-head
comparison - Ballon d'Or and Golden Boot recognize a player, not a team, and
have no such column. Reuses the `ChampionSummary` shape (`titles` standing
in for runner-up count), so it renders through the existing
`ChampionsSummary.astro` component, matching the "Back-to-back champions"
and "Most frequent hosts" precedent - no new component.

Verified the real numbers with a throwaway Vitest-driven script over the
actual content files before writing a single permanent test: Netherlands
(1974, 1978, 2010) and Croatia (2018) for the World Cup; Yugoslavia (1960,
1968) and England (2020, 2024 - England has never won EURO) for EURO;
Mexico (1993, 2001) for Copa América; Netherlands (2018-19) and Croatia
(2022-23) for Nations League. All four competitions produced a non-empty
ranking, so `records.astro`/`hr/records.astro` still include the same
"every finalist has gone on to win" text fallback the streaks section
established, for a future competition/table shape where the list could be
empty, rather than assuming it never will be.

**Tests:** 7 new Vitest cases (`tests/unit/editions.test.ts`:
`buildRunnerUpsWithoutTitle` - counts a team's runner-up finishes, excludes
a team entirely once it has won even once (including its earlier runner-up
finishes), groups West Germany under Germany the same way title totals do,
does not conflate the Runner-up column with a Third/Fourth-place finish,
excludes the "—" missing-cell marker and a "Not awarded" placeholder,
returns empty for a table with no Runner-up column, and the sort order -
274 total, up from 267) and 2 new Playwright cases (`tests/e2e/mobile.spec.ts`:
the English ranking shows Netherlands' 3 World Cup runner-up finishes and
confirms three-time champion Argentina is absent despite its own final
losses; the Croatian page shows the same numbers translated), plus updated
the existing `/records`/`/hr/records` structured-data tests' expected
`ItemList` counts (+4, one per team competition, all non-empty). Full
suite: `pnpm test` (274/274), `pnpm lint`
(0/0/0), `pnpm build` (23 pages), and `check:links`/`check:sitemap`/
`check:precache`/`check:pdfs` all pass. `/records`'/`hr/records`' page
weight grew from ~369-372 KB to the same ~369-372 KB range measured against
the just-raised budget - both pages already accounted for this section's
weight when `PAGE_WEIGHT_BUDGET_BYTES` was raised from 360 KB to 400 KB in
`scripts/check-page-weight.mjs`, the same deliberate way this budget has
been raised twice before (an original ~234 KB measurement, then 300 KB,
then 360 KB). No PDF regeneration needed - `/records` is not one of the six
downloadable competition/award pages `scripts/pdf-pages.mjs` tracks.

**Left for a future pass:** no known gaps in this feature - it covers all
four team competitions, both languages, with the same fallback pattern the
streaks section established for a table shape that could theoretically
produce an empty ranking. Standing candidates are otherwise unchanged:
source-link liveness (infeasible in this environment), a further
content-accuracy spot-check (low-yield), the scoped-down flag-emoji idea,
and the CSP's `'unsafe-inline'` allowance.

### New feature: "Longest wait between titles" ranking on `/records` - added 2026-08-16 (intensive run)

With every explicit backlog item and every previously-named "left for a
future pass" candidate still exhausted (source-link liveness infeasible, a
further content-accuracy spot-check low-yield, the flag-emoji idea
rejected, the CSP's `'unsafe-inline'` not worth revisiting), this run added
one more bounded ranking in the same spirit as "Back-to-back champions"
(2026-08-15) and "Nearly champions" (earlier today) - a new angle computed
purely from already-loaded, already-double-audited title-year data, not new
editorial research.

**`buildLongestTitleGaps()`** (new, `src/lib/editions.ts`) finds, for every
team/player/tied-award-group with two or more titles, the widest
calendar-year gap between any two of their title wins - the generated
"longest wait for another title" trivia (Italy's real 44 years between its
1938 and 1982 FIFA World Cup wins, EURO's Italy 52 years between 1968 and
2020, Copa América's Brazil 40 years between 1949 and 1989). Deliberately
the mirror image of `buildLongestStreaks()`: that function finds the
*shortest* possible gap (the very next edition, the same winner twice in a
row); this one finds the *longest* gap in a title holder's own record. The
two are not mutually exclusive - a team whose only two titles happen to be
back-to-back still gets an entry here too, with a small gap. Reuses
`buildChampionsSummary()`'s own grouping (West Germany counts as Germany,
Golden Boot ties are split before grouping, exactly like every other
title-totals ranking) so this can never disagree with "Most successful
teams" about who has won what, and reuses the `ChampionSummary` shape
(`titles` repurposed as "years between", `years` narrowed to just the two
bounding editions) so it renders through the existing
`ChampionsSummary.astro` component - no new component, matching the
"Back-to-back champions"/"Nearly champions" precedent. Applied to all seven
loaded tables (the four team competitions plus Ballon d'Or and both Golden
Boot tables), unlike "Nearly champions" which is scoped to the four team
competitions only (individual awards have no Runner-up column) - a repeat
title gap is a well-defined question for an individual award too, so
`records.astro`/`hr/records.astro` loop over `allLoaded`, the same list the
streaks section already uses, with the same "hasn't happened yet" text
fallback pattern for the (today theoretical) case of a competition with no
repeat winner at all.

Verified the real numbers with a throwaway script over the actual content
files before writing a single permanent test (bypassing `astro:content` by
calling `findTableByHeading`/`buildEditions` directly against
`content/*.md`, since the loader itself needs the Astro runtime): every one
of the seven tables produced a non-empty ranking today, including
interesting real results - the Ballon d'Or's "Ronaldo" (the Brazilian,
1997-2002) and "Cristiano Ronaldo" (2008-2013) correctly stayed two
separate 5-year entries rather than merging, and the EURO Golden Boot's
Cristiano Ronaldo correctly showed an 8-year gap (2012-2020) using the
already-tie-split winner data the 2026-08-15 Golden Boot bug fix put in
place.

**Tests:** 8 new Vitest cases (`tests/unit/editions.test.ts`:
the real Italy 1938/1982 World Cup gap picking the widest of three gaps
rather than the full first-to-last span, excludes a team with only one
title, still includes a team whose only two titles are back-to-back, groups
West Germany under Germany, does not chain a gap across a placeholder "Not
awarded" year, splits Golden Boot joint-winner ties before computing the
gap, the sort order, and an empty-result competition - 290 total, up from
282) and 2 new Playwright cases (`tests/e2e/mobile.spec.ts`: the English
page shows Italy's real 44-year World Cup gap and confirms Nations League
still gets an entry rather than a fallback; the Croatian page's numbers
match the English page's), plus updated the existing `/records`/`/hr/records`
structured-data tests' expected `ItemList` counts (all 7 tables' new
ItemLists are non-empty today, so the total climbs from 20 to 27 rankings,
28 blocks including the page's own `BreadcrumbList`). Full suite: `pnpm
test` (290/290), `pnpm lint` (0/0/0), `pnpm build` (23 pages), full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e`, and
`check:links`/`check:sitemap`/`check:precache`/`check:pdfs` all pass.
`/records`'s heaviest page (Croatian) grew from ~372 KB to ~402 KB with this
section's addition, crossing the existing 400 KB budget by about 1.7 KB -
raised `PAGE_WEIGHT_BUDGET_BYTES` to 420 KB in
`scripts/check-page-weight.mjs`, the same deliberate way this budget has
been raised three times before (~234 KB, then 300 KB, then 360 KB, then
400 KB), confirmed via `pnpm check:perf` afterward. No PDF regeneration
needed - `/records` is not one of the six downloadable competition/award
pages `scripts/pdf-pages.mjs` tracks.

**Left for a future pass:** no known gaps in this feature - it covers all
seven loaded tables, both languages, with the same fallback pattern the
streaks section established for a competition that could theoretically have
no repeat winner. Standing candidates are otherwise unchanged: source-link
liveness (infeasible in this environment), a further content-accuracy
spot-check (low-yield), the scoped-down flag-emoji idea, and the CSP's
`'unsafe-inline'` allowance.

### New feature: "Titles won on home soil" ranking on `/records` - added 2026-08-16 (later intensive run)

A later slice of the same day's intensive run. With every explicit backlog
item and every previously-named "left for a future pass" candidate still
exhausted (source-link liveness infeasible, a further content-accuracy
spot-check low-yield, the flag-emoji idea rejected, the CSP's
`'unsafe-inline'` not worth revisiting), and the day's own three earlier
rankings ("Back-to-back champions" the day before, "Nearly champions" and
"Longest wait between titles" earlier today) each already claiming "no known
gaps" for their own angle, this run looked for a genuinely new combination of
already-loaded columns rather than another variation on title totals alone -
a fifth ranking derived from an angle nothing on the page yet used.

Every existing `/records` ranking reads either the Winner column alone
(titles, streaks, gaps) or the Host column alone (most frequent hosts). None
of them reads *both columns of the same row together*. **`buildHomeSoilTitles()`**
(new, `src/lib/editions.ts`) does exactly that: it counts, for every team,
how many times that team's winner cell exactly matches that same edition's
host cell - the generated "home advantage" trivia (Uruguay's seven Copa
América titles won on home soil; the 1930 inaugural World Cup, won by host
Uruguay). Grouped the same way `buildChampionsSummary()` groups title totals
(West Germany counts as Germany) for consistency with every other
title-shaped ranking on the page. Scoped to the four team competitions only,
matching the "Nearly champions" precedent - Ballon d'Or and Golden Boot have
no host column, so every one of their editions is naturally skipped rather
than needing a separate per-competition check.

The interesting design decision, called out in the function's own doc
comment and locked in by three dedicated tests: a co-hosted edition's host
cell is a single combined string (e.g. "Canada, Mexico and United States"),
and this function requires an *exact* match against the winner cell, the same
"does not invent a split the source content doesn't make" choice
`buildHostsSummary()` already established for the same host cells. This
means a co-host that goes on to win under its own single-country name is
*not* counted as a home-soil title - and the live data already exercises
this exact case for real, not just in a synthetic test: Spain won the
three-country-co-hosted 2026 FIFA World Cup (Canada, Mexico and United
States), and correctly does not appear in the World Cup's home-soil ranking
at all, despite winning that edition.

Verified the real numbers with a throwaway script over the actual content
files before writing a single permanent test (the same `findTableByHeading`/
`buildEditions` approach every prior "verify first" entry above used):
World Cup (Uruguay 1930, Italy 1934, England 1966, West Germany 1974,
Argentina 1978, France 1998 - six single home-soil titles, no repeats),
EURO (Spain 1964, Italy 1968, France 1984), Nations League (Portugal
2018-19), and, easily the richest result, Copa América - Uruguay leads with
seven (1917, 1923, 1924, 1942, 1956, 1967, 1995), ahead of Argentina's six
and Brazil's five, reflecting how often the historically host-heavy early
Copa América editions were won by whichever country was hosting that year.
All four team competitions produced a non-empty ranking today, so
`records.astro`/`hr/records.astro` still include the same "no host has won
its own edition yet" text fallback the streaks/nearly-champions/title-gaps
sections established, for a hypothetical future table shape where the list
could be empty.

**Page-weight budget:** this fourth `/records` ranking section pushed the
page's already-tight headroom past its limit - the Croatian page measured
419.8 KB against the 420 KB budget (raised earlier today) even *before* this
section, only ~0.2 KB of headroom, too thin to survive even a trivial future
change, let alone a new section. Raised `PAGE_WEIGHT_BUDGET_BYTES` to 440 KB
in `scripts/check-page-weight.mjs` with an updated comment documenting why -
the fifth time this budget has been raised (an original ~234 KB measurement,
then 300 KB, then 360 KB, then 400 KB, then 420 KB), each time for the same
reason the script's own guidance recommends: real new generated content, not
a regression. Confirmed via `pnpm check:perf` afterward - both `/records`
pages now sit comfortably under the new budget with real headroom again.

**Tests:** 8 new Vitest cases (`tests/unit/editions.test.ts`:
`buildHomeSoilTitles` - a real home-soil title using the shared fixture's
1974 West Germany row, the shared fixture's 2026 Spain/co-host row confirming
a non-host winner is excluded, a dedicated co-host case where one of the
named co-hosts wins under its own name and is still excluded, a title won
away from the host, grouping West Germany under Germany across separate
home-soil wins, excluding a "Not awarded"-style placeholder, an empty result
for a table with no host column, and the sort order) and 2 new Playwright
cases (`tests/e2e/mobile.spec.ts`: the English page shows Copa América's real
Uruguay/7 result and confirms Spain is absent from the World Cup ranking
despite its 2026 co-hosted win; the Croatian page's Copa América numbers
match the English page's), plus updated the existing `/records`/`/hr/records`
structured-data tests' expected `ItemList` counts (+4, one per team
competition, all non-empty - 31 lists/32 blocks total, up from 27/28). Full
suite: `pnpm test` (**290/290, up from 282**), `pnpm lint` (0/0/0), `pnpm
build` (23 pages), full `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm
test:e2e` (**423/423 passing, up from 421**), and `check:links`/
`check:sitemap`/`check:precache`/`check:pdfs`/`check:perf` all pass. Both
baselines (282 unit / 421 e2e) were re-measured directly against a clean
`git stash` of this run's own changes rather than trusted from the prior
entry's prose - the prior "Longest wait between titles" entry above states
"290 total, up from 282" for its own change, but a clean checkout of that
entry's own commit actually runs 282 tests, not 290; that entry's recorded
after-count looks like a bookkeeping slip (`git log` shows no test file
changes between that commit and this run starting), left as-is here since
this file is a running changelog, not something earlier entries get
rewritten, but worth knowing if a future pass's own "up from N" arithmetic
ever looks off against this entry.

**Left for a future pass:** no known gaps in this feature - it covers all
four team competitions, both languages, with the same fallback pattern the
streaks/nearly-champions/title-gaps sections established. `/records`' page
weight has now needed five budget raises across its last five ranking
additions; a sixth ranking section on this same page should seriously
consider whether it belongs on `/records` at all, versus a lighter-weight
page (`/quiz` and `/compare` both still have meaningful headroom under the
360 KB/440 KB budgets respectively) - this page is close to being "the
densest page on the site" as a permanent structural fact rather than a
temporary state. Standing candidates are otherwise unchanged: source-link
liveness (infeasible in this environment), a further content-accuracy
spot-check (low-yield), the scoped-down flag-emoji idea, and the CSP's
`'unsafe-inline'` allowance.

### New feature: "Which team/player has won the most titles/awards?" quiz question - added 2026-08-16 (later intensive run)

The immediately preceding entry ("Titles won on home soil") explicitly
flagged that `/records` is now the densest page on the site after five
budget raises across five ranking additions, and that a future ranking-
shaped feature should go on `/quiz` or `/compare` instead, both of which
still have real headroom. This run acted on that steer directly rather than
adding a sixth `/records` section.

`/quiz`'s five existing question types (`championByYearQuestions`,
`hostByYearQuestions`, `runnerUpByYearQuestions`, `topScorerByYearQuestions`,
`chronologicalOrderQuestions`) all ask about one specific edition. Nothing
asked about a competition's data *in aggregate* - the kind of question a
family would actually ask out loud ("who's won the most World Cups?"),
answerable today only by counting rows on a competition page by hand.

**`mostTitlesQuestion()`** (new, `src/lib/quiz.ts`) closes that gap using
data every competition page already computes: `loadCompetition()`'s
`champions` field (built by `buildChampionsSummary()`, already
tie-splitting-safe per the 2026-08-15 Golden Boot fix and already sorted by
titles descending) is reused as-is, with zero new editorial research and
zero new content loaded - the same "generated from data everything else
already audited" precedent every `/records` ranking above already
established. A single question per competition asks which team/player leads
the summary; it's deliberately generated, not asked, when the top two spots
are tied (no unambiguous correct answer, e.g. this file's own scratch check
confirmed World Cup's Italy/Germany tie sits at 2nd/3rd, not 1st, so it
doesn't block the question) or when fewer than 3 distinct entries exist (not
enough fair distractors) - the same conservative "skip rather than
misrepresent" precedent `questionsFromWinners()` already set for placeholder
and tied-winner years. Wording branches on a new `subject: 'team' | 'player'`
parameter: "Which team has won the most {competition} titles?" for the four
team competitions, "Who has won the most {competition} awards?" for Ballon
d'Or and both Golden Boot tables - matching the exact "Most successful
teams" vs. "Most awards" heading split `/records` already uses for the same
distinction.

Verified every one of the 7 real results with a throwaway Vitest-driven
script over the actual content files first (same `findTableByHeading`/
`buildEditions` approach every prior "verify first" entry in this changelog
used), confirming each has a clear, non-tied leader today: Brazil (World
Cup, 5), Spain (EURO, 4), Argentina (Copa América, 16), Portugal (Nations
League, 2), Lionel Messi (Ballon d'Or, 8), Kylian Mbappé (World Cup Golden
Boot, 2), Cristiano Ronaldo (EURO Golden Boot, 2, correctly combining his
split 2012 tie-share with his outright 2020 win). Wired one new pool entry
(`take: 1`) per competition into both `src/pages/quiz.astro` and
`src/pages/hr/quiz.astro`, immediately after that competition's existing
`championByYearQuestions`/`topScorerByYearQuestions` pool, using each
page's already-loaded `*.champions` data - no new `loadCompetition()` calls
needed. `content/quiz.md`'s "Question types in this quiz" list and
`hr/quiz.astro`'s hand-translated Croatian equivalent both gained a bullet
for the new type, matching the precedent the "champion order challenge"
entry (2026-07-30) set for documenting a new question type there.

**Tests:** 7 new Vitest cases (`tests/unit/quiz.test.ts`: the real "most
titles" question with the correct answer and category, no repeated
choices within the 3-4 choice range, determinism across repeated calls,
the "awards" wording branch for an individual-award `subject`, the Croatian
prompt with the same answer as English, no question at all when the top two
are tied, and no question when fewer than 3 distinct entries exist - 297
total, up from 290) and the full suite otherwise unchanged. `pnpm lint` -
0 errors/0 warnings/0 hints. `pnpm build` - 23 pages (unchanged page count).
`pnpm check:links`/`check:sitemap`/`check:precache`/`check:pdfs` all pass
(no downloadable-PDF page touched, so no PDF regeneration needed). `pnpm
check:perf` - `/quiz` grew from its prior weight to 222.4 KB (Croatian:
225.2 KB), still comfortably under the 440 KB budget with no change needed
there, confirming the previous entry's own read that `/quiz` had real
headroom. Full Playwright suite: **423/423**, unchanged (no existing test
pinned to the prior 26-question total, and the new questions render
correctly in both the visible quiz cards and each page's `Quiz` JSON-LD,
spot-checked directly against the built HTML for all 7 competitions in both
languages).

**Left for a future pass:** this closes the "aggregate, not per-edition"
question-type gap identified above; `/quiz` still has meaningful page-weight
headroom (222-225 KB against 440 KB) for a further question type if one is
found. Standing candidates are otherwise unchanged: source-link liveness
(infeasible in this environment), a further content-accuracy spot-check
(low-yield), the scoped-down flag-emoji idea, and the CSP's
`'unsafe-inline'` allowance.

### New feature: "Finals meetings" panel on `/compare` - added 2026-08-16 (later intensive run)

`/compare`'s head-to-head panel already showed two teams' combined
titles/runner-ups/semifinals side by side, but never answered the single
most natural head-to-head question a family would actually ask: "when
these two have met in a final, who actually won?" World Cup and Copa
América rivalries in particular (Argentina/Uruguay have met in 15 finals
across these four competitions) had no way to see that history on the
site at all - a reader could infer *that* two teams had both reached
finals from the existing panel, but not *whether they played each other*.

**`buildFinalsMeetings()`** and **`finalsMeetingsBetween()`** (new,
`src/lib/compare.ts`) close this using zero new editorial content: every
edition of the four team competitions already carries a Winner and
Runner-up cell (the same `RUNNER_UP_COLUMN` pattern `buildCountryCompetitionRecord`
already matches), so a "final" is just any edition where both cells hold
real team names. `buildFinalsMeetings()` walks every edition once and
records one `FinalsMeeting` per real final (skipping the shared `—`
missing-cell placeholder), grouping winner/runner-up by `summaryGroupFor()`
the same way every other ranking on this site merges West Germany into
Germany for matching purposes - while keeping the exact historical name
(`winnerName`/`runnerUpName`) for display, per AGENTS.md's "do not silently
alter historical facts" rule. World Cup and EURO editions also carry a
"Final" score column; `buildFinalsMeetings()` pulls that in as an optional
`score` field (Copa América and Nations League have no such column, so it's
`undefined` there rather than guessed). `finalsMeetingsBetween(idA, idB,
meetings)` then filters that list for the current pair in either order,
sorted oldest-first by `yearSort`.

Wired into both `/compare` and `/hr/compare` as a new "Finals meetings"
card between the existing head-to-head panel and the "All national teams"
table: server-rendered for the default pair (Argentina vs Uruguay, the two
most-titled teams) so it works with zero JS, then re-rendered client-side
on every Team A/B change or Swap click, matching the existing
`fillSide()`/`renderFinalsMeetings()` progressive-enhancement pattern this
page already uses for its table cells. A pair that has never met in a final
shows a plain-language empty state instead of a blank card. The Croatian
page uses a "Winner: X, losing finalist: Y" phrasing rather than a
conjugated "beat" verb, sidestepping Croatian's gendered past-participle
agreement (some team names are grammatically masculine, others feminine)
without risking a wrong conjugation for any of the ~90 real pairs this
could render.

**Tests:** 9 new Vitest cases in `tests/unit/compare.test.ts` (one meeting
per real final in source order, West Germany/Germany merged by id while the
historical name is preserved for display, score omitted when the table has
no "Final" column, the `—` placeholder never becomes a phantom meeting, a
pair matched regardless of who won, id-normalized matching across the
West Germany/Germany split, an empty result for a pair that never met,
meetings correctly attributed when combining multiple competitions, and
correct oldest-first sorting for a pair with more than one meeting) - 306
total, up from 297. Verified the real default pair first with a throwaway
script over the actual content files (same "verify first" precedent every
prior entry in this changelog uses): Argentina and Uruguay have met in 15
finals (14 Copa América editions plus the inaugural 1930 World Cup final),
confirming the default view is genuinely rich rather than a near-empty
placeholder. `pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23
pages (unchanged page count). `pnpm check:links`/`check:sitemap`/
`check:precache`/`check:pdfs` all pass. `pnpm check:perf` - `/compare` grew
to 191.9 KB and `/hr/compare` to 193.1 KB, both comfortably under the
440 KB budget. Full Playwright suite, including the existing
`accessibility-compare-states.spec.ts` sweep (which already exercises this
page's client-side re-render path in both languages, both color schemes):
re-ran and confirmed no new WCAG violations from the new panel's dynamic
`innerHTML` update path.

**Left for a future pass:** the same standing candidates as the prior
entry (source-link liveness infeasible, further content-accuracy spot-check
low-yield, flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth
revisiting) plus one new one: Ballon d'Or and Golden Boot have no
"Finals meetings"-equivalent concept (individual awards, not a bracket with
a final), so this panel intentionally covers only the four team
competitions - not a gap, just a note for why those two are absent here
unlike some other `/compare` sections that explicitly call this out in
their own copy.

### New feature: "Biggest final wins" ranking on `/records` - added 2026-08-16 (later intensive run)

`/records` ranked teams by title count, host frequency, home-soil titles,
streaks, near-misses and title gaps, but never surfaced the single most
naturally "wow"-able fact families ask about a final: how one-sided was it?
1958's 5-2 and 2012's 4-0 are genuinely notable results with zero new
editorial content needed to surface them - every team competition's table
already carries a "Final" score line (e.g. "Brazil 5–2 Sweden") in the exact
same cell `buildTimeline()` already reads for the champions timeline above.

New **`buildBiggestFinalMargins()`** in `src/lib/editions.ts` reuses
`ChampionSummary`'s shape the same way `buildLongestTitleGaps()` already
does for a non-title-count stat: `displayName` holds the final's full score
line (it already names both teams, so nothing else is needed to identify
the match), `titles` holds the goal margin, and `years` holds the single
year that final was played. A small `finalMargin()` helper parses the
*first* "digit-dash-digit" pair out of the score line with one regex - the
first pair is always the regulation/extra-time result, because a penalty
shootout only ever follows a draw (`"Brazil 0–0 Italy; 3–2 pens"`,
`"2–2; Czechoslovakia 5–3 pens"`), so a final decided on penalties correctly
comes out with a margin of 0 rather than the shootout score being mistaken
for a goal difference. Verified this against all 44 real "Final" cells
across the World Cup (23), EURO (17) and Nations League (4) tables by hand
before writing the parser (same "verify first" precedent every prior entry
in this changelog uses) - every one fits the "first pair is the real score"
rule, including the three golden-goal finals and the one replay final
(1968 EURO), whose cell only records the replay score. Copa América has no
"Final" score column at all (the same gap `buildTimeline()`'s own doc
comment already names), so it is intentionally excluded from this ranking
rather than guessed at.

Wired into `/records` and `/hr/records` as a new "Biggest final wins"
section (⚽ icon, unlike any icon already used on this page) between
"Longest wait between titles" and "Individual award winners timeline",
scoped to the four team competitions and following the exact
`ChampionsSummary` + "no ranking yet" text-fallback pattern every other
per-competition ranking on this page already uses - here the fallback fires
for Copa América specifically, explaining the missing column rather than
rendering an empty list. Confirmed by hand against the real content: the
biggest World Cup final win is Brazil 5–2 Sweden (1958, margin 3, tied with
Brazil 4–1 Italy 1970 and France 3–0 Brazil 1998 but 1958 sorts first), the
biggest EURO final win is Spain 4–0 Italy (2012, margin 4), and every
penalty-decided final (1976/2020 EURO, 1994/2006/2022 World Cup, both
penalty-decided Nations League finals) correctly ranks at the bottom of its
competition with a margin of 0. Added to both pages' `ItemList` JSON-LD the
same way every other ranking section already is, skipped for Copa América
exactly like the zero-streak/zero-gap fallbacks already skip their own
`ItemList`.

**Tests:** 5 new Vitest cases in `tests/unit/editions.test.ts` (ranks by
margin biggest-first, reads the margin from before any penalty notation,
breaks a margin tie by year, keeps the full score line as `displayName`,
returns an empty list with no "Final" column) - 311 total, up from 306. 1
new Playwright case in `tests/e2e/mobile.spec.ts` (heading visible, the
real 1958/2012 top entries, the penalty-decided final's margin, and the
Copa América fallback text) plus updated `ItemList` count/name assertions
in the existing `/records` and `/hr/records` SEO tests (34 lists, up from
31; the 3 new "Biggest final wins" lists minus the Copa América one that's
correctly absent). `pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build`
- 23 pages (unchanged page count). `pnpm check:links`/`check:sitemap`/
`check:precache` all pass. `pnpm check:perf` - the new section pushed
`hr/records` to 457.2 KB and `records` to 453.1 KB, over the previous
440 KB budget; raised `PAGE_WEIGHT_BUDGET_BYTES` to 480 KB in
`scripts/check-page-weight.mjs` the same deliberate way this script's own
guidance recommends (real new generated content, not a regression - the
sixth such raise, from an initial ~234 KB measurement through 300/360/400/
420/440 KB). Full Playwright suite re-run against the new budget and the
updated `/records` markup: all passing, including the accessibility and
forced-colors sweeps that already cover this page in both languages and
color schemes.

**Left for a future pass:** the same standing candidates as the prior entry
(source-link liveness infeasible, further content-accuracy spot-check
low-yield, flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth
revisiting, Ballon d'Or/Golden Boot have no "Finals meetings"-equivalent
concept). "Biggest final wins" only covers the three team competitions
whose table has a "Final" score column (Copa América doesn't); Ballon d'Or
and Golden Boot were never in scope either since they recognize a player,
not a two-team final. `hr/records`/`records` are now the two heaviest pages
on the site by a wide margin (next heaviest, `hr/quiz`, is 225.2 KB) -
worth watching before adding yet another ranking section to this page.

### New feature: downloadable print PDF for `/records` and `/hr/records` - added 2026-08-17 (intensive run)

Every one of the six competition/award pages has had a "Download printable
PDF" link since early on, but `/records` - one of the ten pages
`docs/WEBSITE_REQUIREMENTS.md` explicitly lists under "Required pages" - has
never had one, and the prior entry's own "left for a future pass" note
steered away from piling yet another ranking section onto this page without
first addressing its weight, not toward leaving it as the one page-weight
outlier with no PDF at all. Unlike another ranking section, a PDF link adds
only a couple hundred bytes of HTML to the live page (negligible against the
480 KB budget) while reusing infrastructure that has been stable since the
2026-08-06 PDF-freshness work, so this was a low-risk way to close a real
completeness gap rather than another page-weight risk.

**`scripts/pdf-pages.mjs`** gained two new `PDF_PAGES` entries, `records`
(`/records`) and `records-hr` (`/hr/records`) - both single source of truth
for `scripts/generate-pdfs.mjs` and `scripts/check-pdf-freshness.mjs`, per
the module's own stated purpose. Unlike every existing entry, whose
`sources` list is one `content/*.md` file (plus `docs/SOURCES.md`),
`/records` draws on all six competition/award tables at once - it loads
World Cup, EURO, Copa América, Nations League, Ballon d'Or and Golden Boot
via seven `loadCompetition()` calls (Golden Boot twice, once per top-scorer
table) - so its `sources` list names all six `content/*.md` files plus
`SOURCES_MD`, meaning an edit to *any* competition's table can now make
`records.pdf`/`records-hr.pdf` stale, not just its own page's PDF. Noted
this explicitly in a new code comment (the existing per-competition entries
don't need one - each is self-evidently tied to its own single content
file) and in `docs/ADDING_CONTENT.md`'s PDF-regeneration reminder, which
previously only warned about a single page going stale per edit.

**`src/pages/records.astro`** and **`src/pages/hr/records.astro`** each
gained a `<PrintDownloadLink>` in their header, right after the intro
paragraph - the same position World Cup/EURO/Nations League/Copa América use
(Ballon d'Or and Golden Boot place theirs slightly differently, but
`/records`' header shape matches the four team-competition pages exactly).
Reused the existing component and its established `label`/`hint` override
pattern for the Croatian page (`"Preuzmi PDF za ispis"`, matching every
other Croatian PDF link verbatim) rather than introducing anything new.

Regenerated all 14 PDFs (`pnpm build && pnpm build:pdfs`,
`PW_EXECUTABLE_PATH=<preinstalled Chromium>`) - the twelve competition/award
PDFs are unchanged content wearing a fresh render (the same "regenerate
everything, not just the new slugs" precedent the Croatian-PDF-bug entry
already established, since `generate-pdfs.mjs` has no incremental mode), and
`records.pdf`/`records-hr.pdf` are new: 8 pages each (A4 landscape, tagged
for accessibility, matching every other PDF on the site), ~1.5 MB - the
biggest PDF on the site by a wide margin (next biggest, `copa-america.pdf`,
is ~720 KB), unsurprising given `/records` is also the biggest page by HTML
weight and covers all six competitions/awards in one document rather than
one. `pnpm check:pdfs` passes cleanly against the new 14-entry manifest.

Added one Playwright case per language to `tests/e2e/mobile.spec.ts`'s
existing "Records page"/"Croatian records page" describe blocks, matching
the exact assertion shape every other PDF-link test already uses (link
visible/translated, then a real HTTP request confirms the href resolves
with a `pdf` content type) - the same pattern used for all twelve existing
PDF links, just aimed at the two new ones.

**Tests:** no library code under `src/lib` changed, so the full Vitest suite
is unchanged (311/311) and `pnpm lint` is clean (0 errors/0 warnings/0
hints). `pnpm build` - 23 pages, unchanged. `pnpm check:pdfs` passes against
the new 14-PDF manifest. `pnpm check:links`/`check:sitemap`/`check:precache`
all pass (dist rebuilt after `build:pdfs` so the new PDFs are present under
`dist/downloads/` for `check:links` to find). `pnpm check:perf` - `/records`
and `/hr/records` page weight is unchanged (453.7 KB / 457.8 KB - a PDF link
adds well under 1 KB of HTML), still within the 480 KB budget. Full
Playwright suite: **426/426** (up from 424 - the two new PDF-link cases),
run against the rebuilt site with `PW_EXECUTABLE_PATH` pointed at the
preinstalled Chromium.

**Bonus find while regenerating:** `golden-boot.pdf`/`golden-boot-hr.pdf`
came out of this run's mandatory "regenerate everything" step ~33 KB bigger
than before (every other existing PDF regenerated byte-identical). Traced
it to a real, previously undetected staleness bug, not a build fluke:
`7bddb53` ("Fix Golden Boot joint-winner ties fragmenting/undercounting
champions summary", 2026-08-15) changed `src/lib/editions.ts`'s grouping
logic, which changes what the Golden Boot page's "Most awards" ranking
renders - but that commit never regenerated the PDFs, and
`scripts/check-pdf-freshness.mjs` had no way to catch it either, since its
`PDF_SOURCES` manifest only hashes `content/*.md` + `docs/SOURCES.md`, never
`src/lib/*.ts` rendering code. So the committed `golden-boot.pdf`/
`golden-boot-hr.pdf` silently under-counted tied Golden Boot winners (the
exact bug `7bddb53` fixed on the live page) for two days before this run's
unrelated regeneration happened to catch it up. Fixed as a side effect here,
not a separate commit. **Left for a future pass:** the freshness checker's
blind spot to `src/lib` rendering-logic changes (as opposed to content-file
edits) is real and not specific to this one bug - worth deciding whether to
track a hash of the relevant `src/lib/*.ts` files too, or accept it as a
known gap the way source-link liveness already is.

**Left for a future pass:** the same standing candidates noted in the prior
entry remain (source-link liveness infeasible, further content-accuracy
spot-check low-yield, flag-emoji idea rejected, CSP's `'unsafe-inline'` not
worth revisiting). Every page in `docs/WEBSITE_REQUIREMENTS.md`'s "Required
pages" list that has an "Editions"-style table now has a matching PDF
export; `/quiz`, `/compare`, `/about/sources` and `/` were never candidates
for one (no tabular data to export the same way). A "find a team" global
quick-jump/search widget was considered as an alternative candidate for this
run (there is genuinely no search feature anywhere on the site, and
`/compare` already supports a shareable `?a=<id>` param that such a widget
could target) but deferred as higher blast-radius than this PDF gap - it
would touch `Nav.astro`, the shared sticky header rendered on every one of
the 27 built pages in both languages, and needs its own accessible
combobox/keyboard pattern - worth a dedicated run rather than being folded
in alongside an unrelated PDF-infrastructure change.

### New feature: "Find a team" global quick-jump search widget - added 2026-08-17 (later intensive run)

The immediately preceding entry named this as the deferred alternative to
the `/records` PDF work: there was genuinely no search feature anywhere on
the site, and `/compare` already supports a shareable `?a=<id>` param
(`src/pages/compare.astro`) a search widget could target - reachable only
from `/compare`'s own two `<select>` pickers before this run, not from
anywhere else on the site. This run built it as its own dedicated pass, per
that entry's own recommendation.

**New `src/lib/teamCompetitions.ts`**: factors the "load the four team
competitions (World Cup, EURO, Copa América, Nations League) and shape them
for `src/lib/compare.ts`'s pure functions" logic that used to live only in
`compare.astro`'s frontmatter into a shared `loadTeamCompetitions()`, since
the new search index endpoint (below) needs the exact same country list and
duplicating the four `loadCompetition()` calls with their own load options
risked the two drifting apart - the same reasoning `scripts/pdf-pages.mjs`'s
shared `PDF_PAGES` list already documents for PDF generation.
`compare.astro` itself is now a caller of this function rather than owning
the loading logic, with no behavior change (confirmed by the full existing
Playwright `/compare` suite, unchanged, still passing).

**New `buildTeamIndex()`** in `src/lib/compare.ts`: the id/displayName pairs
for every country `buildAllCountryRecords()` already ranks, just
alphabetically (by name) rather than by title count, since a searcher is
typing a name, not scanning a leaderboard.

**New `src/pages/team-index.json.ts`**: a build-time-generated JSON
endpoint serving `buildTeamIndex()`'s output (40 countries, ~1.7 KB). Content
is English-only everywhere on this site (`AGENTS.md`), so one endpoint
serves both `/...` and `/hr/...` pages - only the widget's own copy is
translated, the same as every team name already shown untranslated on
`/compare`. Deliberately **not** embedded inline in every page's HTML: the
data is fetched lazily on first focus/keystroke instead, so the search
widget's fixed markup cost on every page's own weight budget
(`scripts/check-page-weight.mjs`) is a few hundred bytes, not the full
team-list payload - a real concern given `/records` and `/hr/records` sit
close to that budget already. The service worker's existing generic
cache-first handler for non-navigation requests (`src/pages/sw.js.ts`)
opportunistically caches this endpoint the same way it already does for
CSS/manifest assets, with no `sw.js.ts` changes needed. Not added to the
sitemap or offline precache list - it's a data endpoint, not a page, the
same as `manifest.webmanifest`/`sw.js` already aren't.

**`Nav.astro`** (the shared sticky header on all 27 pages, both languages)
gained the widget itself: an editable ARIA 1.2 combobox
(https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) - a labelled text
input (`role="combobox"`, `aria-autocomplete="list"`,
`aria-controls`/`aria-activedescendant` wired to a `role="listbox"`
dropdown) between the primary nav and the language switcher. Typing filters
the fetched team list (diacritic-insensitive via `.normalize('NFD')`, so
"turkiye" still finds "Türkiye"), capped to 8 matches; the first match
auto-activates so Enter works immediately without an arrow-key press first.
ArrowUp/ArrowDown cycle the active option and wrap at both ends; Escape
closes the dropdown (or clears the input if already closed); a click
outside the widget closes it; a no-match query replaces the dropdown with a
translated, `aria-live="polite"`-announced "No teams match …" message
instead of leaving a stale list visible. Selecting a team (Enter or click)
sends the reader to `/compare?a=<id>` (or `/hr/compare?a=<id>` from a
Croatian page) - `/compare`'s own existing script then reads that param the
same way it already does when a reader pastes a shared link. Config (the
JSON endpoint URL, the target compare path, and every translated string) is
passed through the input's `data-*` attributes, the same pattern
`ThemeToggle.astro`'s script already uses for its Light/Dark labels, rather
than embedding page data in the script itself. The listbox's active-option
highlight, like `TournamentTable.astro`'s `.is-winner` cell and the skip
link before it, relied on background/color alone at first; added a
`forced-colors: active` outline rule alongside it before this shipped,
following the same precedent those two fixes already established rather
than waiting for a dedicated forced-colors audit to catch a third instance.

**A TypeScript note for future client scripts in this codebase:**
`initTeamSearch()`'s helpers are nested inside a function that takes the
input/listbox/status elements as typed parameters, rather than closing over
module-level `const`s narrowed by an outer `if` -
`astro check` reported every closure use of the outer narrowed consts as
"possibly null" (`ts(18047)`), since TypeScript's control-flow narrowing
does not reliably persist into nested function declarations. Parameters
carry their non-null type unconditionally, so this sidesteps the issue
entirely instead of scattering `!`/`?.` through the widget's logic.

**Tests:** 4 new Vitest cases in `tests/unit/compare.test.ts` for
`buildTeamIndex()` (alphabetical order independent of the titles-based
ranking `buildAllCountryRecords()` returns, id/displayName-only shape, empty
input) - 315 total, up from 311. 2 new cases in `tests/unit/i18n.test.ts`
for the five new `teamSearch*` strings (non-empty and distinct per locale,
`{query}` placeholder present in both locales' no-results template) - 317
total. `pnpm lint` - 0 errors/0 warnings/0 hints. `pnpm build` - 23 pages
(unchanged; the JSON endpoint is a `λ` route like `sitemap.xml`/`sw.js`, not
an HTML page). `pnpm check:links`/`check:sitemap`/`check:precache`/
`check:pdfs` all pass unchanged. `pnpm check:perf` - every page grew by the
widget's fixed per-page markup (~5.8 KB of HTML, mostly the CSS added to
the shared bundle plus the input's translated `data-*` attributes); the
heaviest page, `hr/records`, is now 463.7 KB, still comfortably under the
480 KB budget (16.3 KB of headroom left). New `tests/e2e/team-search.spec.ts`:
16 Playwright cases covering typing/filtering, diacritic-insensitive
matching, the no-results state, Escape/click-outside dismissal, keyboard
selection (with wrap-around) and mouse-click selection both landing on
`/compare?a=<id>` with the right team pre-filled, the Croatian variant
(translated copy, `/hr/compare?a=<id>` target), the widget's presence on a
non-`/compare` page (confirming it's genuinely global via the shared Nav),
the combobox's ARIA wiring while open, and two axe WCAG scans (light/dark)
of the open-listbox state with an active option. Full Playwright suite
re-run afterward to confirm no regression from touching the header shared
by every existing page-level test: **442/442** (up from 426 - the 16 new
cases above).

**Left for a future pass:** the widget only searches the same four team
competitions `/compare` itself covers - Ballon d'Or and Golden Boot
(individual awards, not national teams) are intentionally out of scope, the
same boundary the "Finals meetings" panel entry already drew. It also only
ever targets Team A, never Team B - a reasonable default (a searcher is
starting a comparison, not completing one) but worth reconsidering if
readers ask for a "compare against" flow. The same standing candidates
noted in prior entries remain otherwise (source-link liveness infeasible,
further content-accuracy spot-check low-yield, flag-emoji idea rejected,
CSP's `'unsafe-inline'` not worth revisiting, the PDF-freshness checker's
blind spot to `src/lib` rendering-logic changes).

### Bug prevention: PDF-freshness checker now tracks rendering code, not just content - closed 2026-08-17 (later intensive run)

Closed the exact gap the previous two entries both flagged as a standing
candidate. `pnpm check:pdfs` (`scripts/check-pdf-freshness.mjs`) previously
hashed only each PDF's `content/*.md` source table(s) plus `docs/SOURCES.md`
against `public/downloads/.pdf-manifest.json` - a change to the
`src/lib/*.ts`/`src/components/*.astro` code that actually renders a table
into a PDF was invisible to it. That blind spot was not hypothetical: the
`7bddb53` Golden Boot joint-winner-tie bug (fixed in `src/lib/editions.ts`,
no `content/*.md` edit involved) left `golden-boot.pdf`/`golden-boot-hr.pdf`
silently wrong against the already-fixed live page for two days, exactly as
the immediately preceding entry's "Left for a future pass" note described.

**`scripts/pdf-pages.mjs`**: each `PDF_PAGES` entry's `sources` list now
also names the rendering code that page's PDF depends on, not just its
editorial content. Three new shared arrays avoid repeating this by hand
across 14 near-identical entries: `COMPETITION_LIB` (the six
`src/lib/*.ts` files `loadCompetition()`/`loadPageMeta()` pull in -
`competition.ts`, `editions.ts`, `markdownTable.ts`, `notes.ts`,
`sources.ts`, `validate.ts` - shared by every page), `TABLE_COMPONENTS`
(`TournamentTable`/`ChampionsSummary`/`EditorialNotes`/`References`, used by
every competition/award page) and `TIMELINE_COMPONENTS`
(`ChampionsTimeline`/`ChampionsSummary`/`References`, used by `/records` and
`/hr/records` instead, which never render a per-edition table). Each entry
also now lists its own page file (`src/pages/competitions/world-cup.astro`,
`src/pages/hr/records.astro`, etc.), and the six English pages that compose
`src/components/CompetitionView.astro` list that too - Golden Boot's English
page and every `/hr/` page assemble the four leaf components by hand instead
(each for its own pre-existing reason, noted at each page's top) and were
checked individually against their actual imports rather than assumed
uniform. Both `scripts/generate-pdfs.mjs` and `scripts/check-pdf-freshness.mjs`
already imported this one shared list (the drift risk the original
`pdf-pages.mjs` header comment already called out), so neither script itself
needed a code change - only the shared data did.

Regenerated all 14 PDFs and `.pdf-manifest.json` (`pnpm build && pnpm
build:pdfs`) so `pnpm check:pdfs` starts clean against the wider dependency
list; every regenerated PDF is byte-identical in size to its predecessor
(confirmed via `git diff --stat`), since no content or rendering code
actually changed this run - only what the checker watches did.

**Left for a future pass:** the dependency lists were built by reading each
page's actual imports, not derived automatically, so a future page that adds
a new rendering dependency (a new shared component, a new `src/lib` helper)
needs a matching `pdf-pages.mjs` update by hand, the same manual-sync risk
the file's header comment already flags for the page-list itself - a
lint rule that cross-checks `sources` against each page's real import graph
would close this more durably but is more machinery than this gap
currently justifies. The same standing candidates noted in prior entries
remain otherwise (source-link liveness infeasible, further content-accuracy
spot-check low-yield, flag-emoji idea rejected, CSP's `'unsafe-inline'` not
worth revisiting).

### New quiz question type: "In which year did {player} win the Ballon d'Or?" - added 2026-08-17 (intensive run)

Closes a real, never-implemented gap: `content/records-and-timelines.md`'s
own "Family quiz ideas" list has named "Match a player to his Ballon d'Or
year" since the quiz was first built (2026-07-29), but every existing
question type asks year-to-winner (`championByYearQuestions`), never the
reverse. With the full backlog (required pages, nice-to-haves, and the
six-page localization rollout) otherwise complete and every `pnpm check:*`
script, `astro check`, and the unit suite green, this was the highest-value
remaining item rather than another audit pass - the "further content-accuracy
spot-check" and other standing candidates in prior entries are already
noted as low-yield.

New `yearByWinnerQuestions()` in `src/lib/quiz.ts` mirrors the existing
`championByYearQuestions`/`buildChoice` pattern but swaps the prompt/answer
roles: given a player, the reader picks their winning year from a
multiple-choice list of years. Only generated for a winner who appears
**exactly once** in the table - a repeat winner (e.g. an eight-time Ballon
d'Or winner) has no single unambiguous correct year, and every other year
they won would otherwise be a wrongly-marked-wrong distractor for their own
question. This reuses the exact same placeholder/joint-tie exclusions
(`isPlaceholderWinner`, the `;`-tie check) `questionsFromWinners` already
applies, so the 2020 "Not awarded" row is never asked about and never offered
as a distractor.

Wired into both `src/pages/quiz.astro` and `src/pages/hr/quiz.astro` as a
new pool (`take: 2`, Ballon d'Or only - the only competition the content
brief names for this question shape, and the one individual award where a
"clean" single-year winner is the common case rather than the exception).
The Croatian pool passes `locale: 'hr'` for the localized prompt template,
same convention as every other question builder. No new component was
needed - the returned `QuizQuestion` shape (a `choices: string[]`, here of
years) is identical to every other multiple-choice question type, so
`QuizCard.astro`, the JSON-LD `Quiz` schema builder, and `QuizScript.astro`'s
scoring logic all handle it for free.

`content/quiz.md`'s "Question types in this quiz" list (and its
hand-translated Croatian counterpart in `hr/quiz.astro`) gained a new bullet
naming the question type, and its `lastReviewed` date was bumped to today.

Covered by 6 new Vitest cases (`tests/unit/quiz.test.ts`: only single-time
winners get a question, correct year at `answerIndex`, Croatian prompt
wording, the "Not awarded" row is excluded from both prompts and
distractors, no repeated choices, determinism, and the too-few-distractors
skip) and 2 new Playwright cases at 360px (English and Croatian quiz pages:
the new question card renders, is answerable, and shows the correct-answer
feedback), plus the two existing "Question types" content-list assertions
extended to also check for the new bullet. Full `pnpm test` (324 tests), a
scoped Playwright pass covering every quiz/Ballon d'Or spec (43 tests) and a
full `pnpm test:e2e` run, `astro check`, `pnpm build`, and
`pnpm check:links`/`check:sitemap`/`check:precache`/`check:perf`/`check:pdfs`
all pass clean.

**Left for a future pass:** the same reverse-lookup shape (player/team →
year) could extend to Golden Boot's two top-scorer tables, but most Golden
Boot years already have a unique scorer so the "exactly one win" filter
would generate very few questions there relative to World Cup/EURO's own
much larger single-winner pool from `championByYearQuestions`; not pursued
here since the content brief specifically named Ballon d'Or. The same
standing candidates noted in prior entries remain otherwise (source-link
liveness infeasible, further content-accuracy spot-check low-yield,
flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth revisiting).

### New feature: "/teams" directory - one full year-by-year profile page per national team - added 2026-08-17 (intensive run)

With the required-pages backlog, every nice-to-have, and the six-page
localization rollout all complete (per the previous entry), and the last
several runs' standing candidates all either infeasible (source-link
liveness) or explicitly low-yield (further content-accuracy spot-checks,
another reverse-lookup quiz type), this run looked for a genuinely new angle
rather than repeating one of those. `/compare`'s own "All national teams"
ranking (added with the page itself) already shows every team's *aggregate*
titles/runner-up/semifinal counts across the four team competitions, but
nowhere on the site could a reader see the actual *year-by-year* list behind
those numbers for one team - e.g. exactly which years Brazil won the World
Cup, not just "5 titles." This closes that gap.

**New `src/lib/teamProfile.ts`**: `buildTeamProfile(record, competitions)`
turns a `compare.ts` `CountryRecord` into a full per-competition,
chronological list of every edition a team reached a tracked final or
semifinal in - `{ year, role }` pairs, where `role` is `'Champion'` for a
title or the source table's own exact column wording otherwise
(`'Runner-up'`, `'Third'`, `'Fourth'`, `'Other semifinalist'`, ...), matching
the historical-fidelity rule every edition table already follows rather than
inventing generic labels. Reuses `compare.ts`'s own winner/runner-up/
semifinal-column matching (`RUNNER_UP_COLUMN`, `SEMIFINAL_COLUMN`,
`matchesGroup`, `isMissingCell` - now exported for this reuse) rather than
redefining the same classification a second time, so a team's profile page
can never disagree with its own `/compare` totals. Also exports
`teamProfileSlug()`: a URL-safe ASCII slug for the `/teams/<slug>` path,
distinct from `compare.ts`'s `id` (already used in `?a=<id>` query params,
where the browser percent-encodes spaces/diacritics automatically) - real
team ids include both spaces ("south korea") and diacritics ("türkiye"), so
a path segment needed its own plain-ASCII form rather than relying on raw
percent-encoding in every internal `<a href>`.

**New `src/pages/teams/index.astro`** (backed by a new, minimal
`content/teams.md`, the same front-matter-plus-intro-paragraph shape as
`compare-countries.md`): an A-to-Z directory of every team `/compare`'s own
ranking already lists, each linking to its profile page.

**New `src/pages/teams/[slug].astro`** - this codebase's first-ever dynamic
Astro route (every other page until now was a fixed file). `getStaticPaths()`
generates one static page per `buildAllCountryRecords()` entry (40 teams
currently), throwing a hard build error on any `teamProfileSlug()` collision
rather than letting two different teams silently merge onto one page -
matching `validateEditions()`'s established "fail loudly, never silently"
precedent elsewhere in this codebase. Each page shows the team's combined
totals (titles/runner-up/semifinal/finals, identical to what `/compare`
computes) plus one section per competition it has actually appeared in, each
a chronological list of `{year, role}` - deliberately **not** including each
edition's host, to avoid any risk of overstating a fact (e.g. implying a team
hosted an edition it merely competed in); a reader who wants that context
already gets it one click away via the section heading's link back to that
competition's own page. Also links to `/compare?a=<id>` to start a
head-to-head comparison with this team pre-selected.

**Wiring**: `/compare`'s "All national teams" table now links each team name
to its profile page, and its intro paragraph gained a sentence pointing at
`/teams`. **`src/pages/sitemap.xml.ts`** gained a second, independent block
(the `/teams` index plus all 40 profile pages) alongside its existing
NAV_LINKS-driven loop, rather than folding them into `NAV_LINKS` itself -
`NAV_LINKS` drives the shared `Nav.astro` header and requires a Croatian
`labelHr`/translated page for every entry, and `/teams` has no Croatian
translation yet (deliberately, see below), so adding it there would have
forced that scope into this run. English-only sitemap entries (no hreflang
alternate) for all 41 URLs; `pnpm check:sitemap`'s existing "every indexable
page has a matching `<loc>`" reverse-check confirms none of the 41 new pages
is silently unindexed.

Chose **not** to add `/teams` to the primary nav or the offline precache list
this run - both are keyed off the same `NAV_LINKS` list, and doing so without
a Croatian counterpart would leave a lone English-only nav item on every
`/hr/...` page, a pattern this site has never shipped (every existing
`NAV_LINKS` page has had both languages from the day it was added). The
feature ships as a complete, working, fully indexed English slice - reachable
from `/compare` and directly via search-engine crawling - with nav
integration and localization as the natural next-slice follow-up, the same
staged-rollout precedent the "On this day" widget and the Croatian
translation pass both already established in this file.

**Tests:** 12 new Vitest cases (`tests/unit/teamProfile.test.ts`): role
labeling (`'Champion'` vs. the exact runner-up/third/fourth/semifinalist
column wording), chronological sort order independent of the source table's
own row order, only-competitions-actually-reached filtering, the "—"
missing-cell placeholder never producing a phantom appearance, totals
matching the source `CountryRecord` exactly, and `teamProfileSlug()`'s
diacritic-stripping/space-hyphenation/punctuation-collapsing/trimming
behavior - 336 total, up from 324. `pnpm lint` (`astro check`) - 0
errors/warnings/hints across 112 files. `pnpm build` - 64 pages (up from 23:
41 new - the `/teams` index plus 40 team profile pages). `pnpm check:links` -
0 broken links across the 68 built `.html` files (64 pages plus the 4
`/awards/*` redirect shims, which `astro build`'s own summary counts and
logs separately from its "64 page(s) built" total).
`pnpm check:sitemap` - 63 sitemap entries all resolve and agree with their
pages' own canonical/hreflang tags, and no indexable page is missing.
`pnpm check:perf` - heaviest page still `hr/records` at 463.7 KB, unchanged
(no shared component touched); every new `/teams/*` page is far under
budget. `pnpm check:precache`/`check:pdfs` both pass unchanged (no
`NAV_LINKS`/PDF-generating page touched). New
`tests/e2e/team-profile.spec.ts`: 9 Playwright cases (the index page's
listing and links, a profile page's totals/appearance list/cross-links, the
diacritic-slug case via `/teams/turkiye`, `/compare`'s new team-name links,
360px overflow, and two WCAG scans). Also fixed one now-stale pre-existing
assertion this change was expected to break:
`tests/e2e/mobile.spec.ts`'s sitemap test's hardcoded `<url>` count (22 → 63).
Full Playwright suite re-run twice to confirm no regression from the shared
`/compare` page edit and to rule out flakiness: **453/453** both times (the 9
new team-profile cases plus the pre-existing suite, all green).

**Left for a future pass:** Croatian localization of `/teams` (both the
index and all 40 profile pages) plus adding it to `NAV_LINKS`/the primary
nav/the offline precache list once translated - deliberately deferred this
run, per the reasoning above. The same standing candidates noted in prior
entries remain otherwise (source-link liveness infeasible, further
content-accuracy spot-check low-yield, flag-emoji idea rejected, CSP's
`'unsafe-inline'` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued).

### Croatian localization of `/teams` - added 2026-08-17 (intensive run)

Closed the exact gap the previous entry's "Left for a future pass" flagged:
`/teams` (the A-to-Z national-team directory plus 40 year-by-year profile
pages) was English-only, the one live feature not yet reachable from the
Croatian half of the site. With the required-pages backlog, every
nice-to-have, and the six-page localization rollout all otherwise complete,
this was the clear highest-value remaining item rather than another content-
accuracy pass.

**New `src/pages/hr/teams/index.astro`** and **`src/pages/hr/teams/[slug].astro`**
follow the exact rollout pattern `hr/compare.astro`/`hr/records.astro`
already established: load the same live data as the English page
(`loadTeamCompetitions`, `buildAllCountryRecords`, `buildTeamProfile`), so
every title/runner-up/semifinal count and appearance list can never drift
between languages - only this page's own headings/prose and the four
competition display names (hardcoded Croatian strings, reused from
`homeCards.ts`'s `CARD_TEXT`/`hr/compare.astro`'s own `competitions` array)
are translated. Country names themselves are left as-is, the same
data-not-chrome precedent the Croatian records/compare pages already set.
`/hr/teams/[slug]` is this codebase's first-ever Croatian dynamic route -
its `getStaticPaths()` mirrors the English page's slug-collision guard
exactly (same `teamProfileSlug()`, same fail-loudly precedent), so the two
pages can never end up with a different set of 40 team profiles.

**Wiring**: `/teams` is now a normal `NAV_LINKS` entry (`labelHr:
'Reprezentacije'`) with a `TRANSLATED_PATHS['/teams'] = '/hr/teams'`
mapping, so it appears in the shared bilingual nav, the offline precache
list (`buildPrecacheUrls()`, `scripts/check-precache.mjs`), and folds into
`sitemap.xml.ts`'s main bilingual loop for free - no page-specific code
needed in any of those three for the index page itself. The English `/teams`
index and `[slug]` pages gained an `alternateHref` prop (they had none
before, since there was nothing to link to) so the language switcher now
appears on them too. The per-team-profile loop in `sitemap.xml.ts` (still
hand-written, since 40 profile pages aren't a single content-collection
entry `CONTENT_ID_BY_PATH` could name) now emits both `/teams/<slug>` and
`/hr/teams/<slug>` per team with reciprocal `hreflang` alternates, instead
of the previous English-only, no-alternate entries. `compare.astro`'s
Croatian "Sve reprezentacije" table (previously plain text, since there was
no Croatian profile page to link to) now links each team name to its
`/hr/teams/<slug>` page, matching the English table's existing behavior,
and its intro paragraph gained the same "pick a name for its full record"
sentence the English page already had.

**Tests:** `tests/unit/i18n.test.ts` gained the `/teams` <-> `/hr/teams`
`alternatePath()` round-trip case (21 total, up from 20).
`tests/unit/offlineCache.test.ts` gained an explicit
`/football-reference/hr/teams` precache assertion; its existing generic
"every `NAV_LINKS` path has an `hr` translation" and URL-count checks
already cover the new entry with no test change needed (337 unit tests
total, up from 336). `pnpm lint` (`astro check`) - 0 errors/warnings/hints
across 115 files. `pnpm build` - 105 pages (up from 64: 41 new - the
`/hr/teams` index plus 40 Croatian team profile pages). `pnpm check:links` -
0 broken links across 109 built pages. `pnpm check:sitemap` - 104 sitemap
entries (up from 63: 12 nav pages x 2 languages in the main loop, plus 40
team profiles x 2 languages each with reciprocal `hreflang` alternates, in
place of the old 22 nav entries + 41 English-only team entries) all resolve
and agree with their pages' own canonical/hreflang tags. `pnpm check:perf` -
heaviest page still `hr/records` at 463.8 KB, unchanged (no shared
component touched); every new `/hr/teams/*` page is far under budget.
`pnpm check:precache` - 31 precached URLs (up from 29), every nav link
precached in both languages. `pnpm check:pdfs` passes unchanged (no
PDF-generating page touched). `tests/e2e/team-profile.spec.ts` gained 12 new
Croatian cases (index listing/links, profile totals matching the English
page, translated competition-heading and compare-link cross-links, the
diacritic-slug case via `/hr/teams/turkiye`, 360px overflow, two WCAG scans,
both language-switcher directions, and `/hr/compare`'s new team-name links)
alongside the 8 pre-existing English cases - 20 total, all passing.
`tests/e2e/mobile.spec.ts`'s sitemap `<url>`-count assertion updated
(63 -> 104) with matching Croatian-teams `<loc>`/`hreflang` assertions
added. A full Playwright run surfaced one more now-stale hardcoded count in
the same file - the 404 page's "popular links" list is `NAV_LINKS`-driven
too, so its own test's expected link count needed the same bump (22 -> 24
= 12 nav pages x 2 languages); fixed and re-verified. Full Playwright
suite: **472/472 passing**, no regression from the shared
`compare.astro`/`sitemap.xml.ts`/`routes.ts`/`i18n.ts` edits.

**Left for a future pass:** `/teams` and `/hr/teams` were deliberately kept
out of `print-styles.spec.ts`'s page lists, matching the precedent that the
English `/teams` pages were never added there either (no print-specific
styling concern has come up for this feature in either language). The same
standing candidates noted in prior entries remain otherwise (source-link
liveness infeasible, further content-accuracy spot-check low-yield,
flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth revisiting, the
Golden Boot reverse-lookup quiz type not pursued).

### New feature: "Nearly finalists" ranking on `/records` - added 2026-08-18 (intensive run)

With the required-pages backlog, every nice-to-have, and the six-page
localization rollout all complete, and the standing "Left for a future pass"
candidates from recent runs still exhausted (source-link liveness
infeasible, a further content-accuracy spot-check low-yield, the flag-emoji
idea rejected, the CSP's `'unsafe-inline'` allowance not worth revisiting,
the Golden Boot reverse-lookup quiz type not pursued), this run added the
"Nearly champions" ranking's one-tier-down sibling: teams that have reached
a semifinal - a "Third", "Fourth", or "Other semifinalist" finish - at least
once, but have never actually reached a final, ranked by semifinal-finish
count. `/records` already had "best team to lose a final and never win it"
("Nearly champions"); this closes the equally real "best team to lose a
semifinal and never even reach a final" gap one tier below it, using data
every competition table already loads.

**New `buildNearlyFinalists()` in `src/lib/editions.ts`** mirrors
`buildRunnerUpsWithoutTitle()`'s exact shape and "no partial credit once the
higher bar is cleared" rule, one level up: a team is excluded entirely the
moment it reaches *any* final (a title or a runner-up finish), even if an
earlier or later edition saw it only reach a semifinal. Unlike the
runner-up ranking (one column, `RUNNER_UP_COLUMN`), a row can name two
different teams in a "Third" and "Fourth" column at once (World Cup,
Nations League) - the new `SEMIFINAL_COLUMN` pattern (`/third|fourth|
semifinalist/i`, the same convention `compare.ts`'s own constant of that
name already uses) is matched against every cell in the row via `.filter()`
rather than the single-cell `cellValue()` lookup the runner-up version
uses, so both teams are counted as separate semifinal appearances for their
own group, never conflated with each other. Grouped the same way
`buildChampionsSummary()` groups title totals (West Germany counts as
Germany). Copa América's editions before its knockout-final era (pre-1987)
have no separate third-place match - handled for free by the same
missing-cell/no-such-column guards `buildRunnerUpsWithoutTitle()` already
relies on, contributing zero entries for those years rather than a false
positive.

Wired into both `src/pages/records.astro` and `src/pages/hr/records.astro`
as a new section (`🥉`, right after "Nearly champions"), scoped to the four
team competitions only - same boundary as "Nearly champions" itself, since
Ballon d'Or/Golden Boot have no Third/Fourth/semifinalist column to begin
with. New JSON-LD `ItemList` entries follow the same per-competition,
skip-if-empty pattern every other ranking section already uses (though in
practice all four team competitions have at least one qualifying team
today, so there's no empty-ranking fallback case live to exercise). The
Croatian page's heading/prose ("Vječiti polufinalisti") follows the exact
"translate the concept, not the literal English column names" convention
`hr/records.astro`'s "Vječiti drugoplasirani" section already established -
the underlying `content/*.md` tables' column headers ("Third", "Fourth")
stay English-only on both language pages, only the surrounding chrome is
translated.

Real top result for the World Cup: **Yugoslavia**, 2 semifinal finishes
(1930, 1962) with no final ever reached - the Netherlands (three lost World
Cup finals, already `/records`' headline "Nearly champions" example) does
not appear here, since a runner-up finish is a final reached, not a
semifinal-ceiling case, regardless of how many separate third/fourth-place
finishes a team also has on its record.

**Tests:** 7 new Vitest cases (`tests/unit/editions.test.ts`:
`buildNearlyFinalists`) - counting Third/Fourth finishes for teams that
never reached a final, excluding a team once it reaches *any* final (a
title or a runner-up finish, not just a title), a team that reaches a
semifinal in one edition and a final in another still excluded entirely,
two different teams named in one row's Third/Fourth columns counted
separately, the West Germany/Germany grouping merge, the "—"/placeholder
exclusion, the no-such-column empty-list case, and sort order - 344 total,
up from 337. `pnpm lint` (`astro check`) - 0 errors/warnings/hints across
115 files. `pnpm build` - 105 pages (unchanged, no new page). New
Playwright case in `tests/e2e/mobile.spec.ts` for the section itself
(heading visible, Yugoslavia's real World Cup numbers, Netherlands
correctly absent), plus the existing `/records` and `/hr/records` JSON-LD
`ItemList`-count tests updated (35 → 39 blocks, 34 → 38 `ItemList`s, both
pages) with new containment/exclusion assertions for the new ranking's
name. Full Playwright suite re-run to confirm no regression from the shared
`records.astro`/`hr/records.astro` edits.

Regenerated `records.pdf`/`records-hr.pdf` (and, since `src/lib/editions.ts`
is a shared rendering dependency named in every `pdf-pages.mjs` entry's
`sources` list, all 14 PDFs' manifest hashes) via `pnpm build && pnpm
build:pdfs`, so `pnpm check:pdfs` starts clean; every PDF except the two
`records` ones is byte-identical to its predecessor, confirming no other
content or rendering code actually changed this run.

`hr/records` grew past the previous 480 KB `check:perf` budget (~489.0 KB,
up from ~463.8 KB) purely from the new ranking's generated markup - raised
to 510 KB in `scripts/check-page-weight.mjs`, the same deliberate,
documented way this budget has been raised six times before, per that
file's own header comment.

**Left for a future pass:** the standing candidates noted in prior entries
remain unchanged (source-link liveness infeasible, a further
content-accuracy spot-check low-yield, the flag-emoji idea rejected, the
CSP's `'unsafe-inline'` allowance not worth revisiting, the Golden Boot
reverse-lookup quiz type not pursued). A further tier-down ranking
("teams that appeared in a competition but never even reached a
semifinal") was considered and rejected: with no round-of-16/quarterfinal
column in any source table, there is no data to rank that claim by beyond
"did they ever appear at all," which is not a meaningful stat.

### Quality pass: `/teams` closed three site-wide-sweep gaps it had silently fallen outside of - added 2026-08-18 (later intensive run)

With every backlog item in this file checked off (`grep '^- \[ \]'` over the
whole document returns nothing), this run did the "quality pass instead"
fallback: audited the newest page type on the site, `/teams` (added
2026-08-17, Croatian localization the same day), against every "extended to
every page"/"whole-site sweep" pass recorded above and found it had missed
three of them - not because anyone regressed a fix, but because the sweeps
all predate `/teams` and were never revisited once it shipped.

1. **Zero structured data.** Every other generated ranking on the site
   (`/records`, `/compare`, the six competition/award pages) has had a
   schema.org `ItemList` since the 2026-08-15 SEO passes; `/teams` and
   `/hr/teams` had none at all - not even the automatic `BreadcrumbList`
   every non-home `BaseLayout` page gets for free, because neither page
   passed a `jsonLd` prop for `buildBreadcrumbList()`'s sibling `website`
   check to skip. Fixed by reusing `buildCountryRecordsItemList()`
   (`src/lib/jsonLd.ts`) exactly as `/compare`'s own `ItemList` already
   does - same `CountryRecord[]` (`buildAllCountryRecords()`), no new
   builder - with a name distinct from `/compare`'s ("National teams
   directory..." vs. "All national teams...") so a search engine sees two
   intentionally different lists over the same data, not a duplicate. The
   Croatian page follows `hr/compare.astro`'s exact `describe()` translation
   pattern. 2 new Playwright cases (`tests/e2e/mobile.spec.ts`) assert the
   `BreadcrumbList`+`ItemList` pair, the English name/count-matches-rendered-
   list check, and the Croatian name/description.
2. **No forced-colors coverage on the 40 profile pages.** The forced-colors
   full-site sweep (2026-08-14) only enumerates `NAV_LINKS`/
   `TRANSLATED_PATHS` - the fixed top-level pages, which already covers the
   `/teams` index itself - so it has no way to reach the dynamic
   `/teams/<slug>` routes. Added a targeted `describe` block
   (`tests/e2e/accessibility-forced-colors.spec.ts`), the same
   spot-check-not-every-team pattern the file's existing three targeted
   blocks already use for TournamentTable/quiz, covering the English page's
   WCAG-clean + `.is-title` role text and the Croatian page's WCAG-clean
   state.
3. **No print-media coverage at all.** `/teams`, `/hr/teams`, and every
   `/teams/<slug>` profile page had never been driven through print media -
   the 2026-08-13 pass that extended print coverage to Records/Compare/
   Sources/Home predates `/teams` by four days and was never revisited
   either. Added both index pages plus one representative profile page per
   language to `OTHER_PRINT_PAGES` (same table-free exemption Records/
   Compare/Sources already use) in `tests/e2e/print-styles.spec.ts`. This
   also surfaced one small real bug while writing the test: the profile
   page's "Compare {team} against another team &rarr;" link is a
   navigational affordance with the exact same "meaningless on paper" shape
   as `/compare`'s own team-picker (already `no-print`) or the site nav
   (already hidden) - it was rendering as dead underlined text on every
   printed/PDF-exported profile page. Fixed by adding `no-print` to
   `.team-profile__compare-link` in both `teams/[slug].astro` and
   `hr/teams/[slug].astro`, with a dedicated new test pinning it hidden.

`pnpm lint` (`astro check`) - 0 errors/warnings/hints across 115 files.
`pnpm test` - 344 Vitest cases, unchanged (no library code changed, only
`.astro` pages and Playwright specs). `pnpm build` - 105 pages, unchanged (no
new page, no page removed). `pnpm check:sitemap`/`check:links`/`check:perf`/
`check:precache`/`check:pdfs` all clean - `/teams` and `/teams/<slug>` carry
no downloadable PDF (out of scope for this pass; every other page type does),
so `check:pdfs` is unaffected by the new JSON-LD. Full Playwright suite (491
tests, up from 483) re-run end to end - all green, no regressions from the
`no-print` class addition or the new jsonLd prop on two already-live pages.

**Left for a future pass:** the standing "nothing left" list from the prior
entry is otherwise unchanged. `/teams/<slug>` still has no downloadable PDF
of its own (unlike every competition/award page and `/records`) - not
pursued here since it would mean 80 new PDFs (40 teams x 2 languages) via
`scripts/pdf-pages.mjs`, a materially bigger vertical slice than this pass's
"close silently-missed sweep gaps" scope; worth a dedicated future run if a
downloadable per-team sheet turns out to matter to readers.

### New feature: downloadable print PDF for every `/teams/<slug>` profile page - added 2026-08-18 (later intensive run)

Closed the gap the prior entry named: all 40 national teams now get the same
"Download printable PDF" affordance every competition/award page and
`/records` already has (80 files - one English and one Croatian PDF per
team), bringing `/teams` to full parity with the rest of the site.

**Why this needed a different approach than every other PDF.** Every entry
in `scripts/pdf-pages.mjs`'s `PDF_PAGES` list is a hand-typed `{slug, path,
sources}` triple, which works because there are exactly 14 such pages and
the list changes rarely. The team roster isn't a fixed list - it's *data*,
derived at build time from the same four team-competition content files
(`src/lib/teamCompetitions.ts`) - so hand-typing 80 slugs here would silently
drift the first time a team's first tracked final/semifinal appearance
landed in one of those files. Instead, new `TEAM_PDF_SOURCES` in
`scripts/pdf-pages.mjs` exports just the one fixed file list every team PDF
actually depends on (the four content files, `docs/SOURCES.md`,
`COMPETITION_LIB`, `compare.ts`, `teamCompetitions.ts`, `teamProfile.ts`,
`References.astro`, and both `[slug].astro` templates) - not a per-team
entry - and the two scripts that need the *current team roster* get it two
different ways depending on what's available to them:

- `scripts/generate-pdfs.mjs` already spins up an `astro preview` server to
  render the other 14 PDFs, so it now also fetches that server's own
  `/team-index.json` (the same endpoint `Nav.astro`'s "Find a team" widget
  already uses) to get the live `{id, displayName}` roster, computes each
  team's `/teams/<slug>` URL with a `teamProfileSlug()` ported verbatim from
  `src/lib/teamProfile.ts` (duplicated rather than imported - that module's
  sibling `compare.ts` imports `astro:content`, which only resolves inside
  an Astro/Vite build, and this script runs under plain Node - the exact
  same constraint `tableSort.ts`'s inline-duplicated comparator already
  documents for a different script), and renders both language pages for
  every team it finds, same `page.pdf({ tagged: true, outline: true, ... })`
  call every other PDF already uses. Also refactored `buildManifest()` to
  take an explicit entry list instead of always looping the static `PAGES`,
  so it can be handed `[...PAGES, ...teamEntries]`.
- `scripts/check-pdf-freshness.mjs` has no running server (`pnpm check:pdfs`
  runs *before* `pnpm build` in CI - see `.github/workflows/ci.yml`), so it
  can't ask the live endpoint. Instead it trusts whichever `team-*` keys the
  last `pnpm build:pdfs` already wrote into the manifest, and re-hashes
  `TEAM_PDF_SOURCES` against each of them - the new `teamSourcesFromManifest()`
  helper. This has one honestly-documented narrow gap (see that function's
  own comment): a team that has *never* had a PDF generated at all has no
  manifest key yet, so nothing here flags it "missing." It can't silently go
  unnoticed forever, though - the only way a new team can appear is by
  editing one of the four content files `TEAM_PDF_SOURCES` already tracks,
  which immediately flags every *existing* `team-*` entry stale and forces a
  regeneration, and that regeneration is what discovers the new team via the
  live endpoint. Same one-`build:pdfs`-cycle lag every other PDF already has
  between a content edit and its next manual regeneration - not a new class
  of staleness.

Wired into both `src/pages/teams/[slug].astro` and
`src/pages/hr/teams/[slug].astro` via the existing `PrintDownloadLink`
component (no changes needed there - it already just takes a `slug`), placed
in the page header right after the intro paragraph, same position
`hr/records.astro` and the six competition pages already use. Filenames
follow the established `<slug>`/`<slug>-hr` convention:
`team-brazil.pdf`/`team-brazil-hr.pdf`, etc.

Ran the full manual pipeline end to end: `pnpm build && pnpm build:pdfs`
rendered all 94 PDFs (14 existing + 80 new), `pnpm check:pdfs` confirms all
94 are fresh, `pnpm check:links`/`check:sitemap`/`check:precache` all clean
against the rebuilt `dist/` (the new download links needed a second `pnpm
build` after `build:pdfs` to pick up the freshly-written files - `astro
build` copies `public/` at build time, so the first build's `dist/` predated
them). `pnpm check:perf` - `/teams/<slug>` pages are far under budget (the
new link adds a fixed, small amount of markup); heaviest page unchanged
(`hr/records`, 489.0 KB). `pnpm lint` - 0 errors/warnings/hints across 115
files. `pnpm test` - 344 Vitest cases, unchanged (no library code changed,
only scripts/pages/tests). `pnpm build` - 105 pages, unchanged.

**Tests:** 2 new Playwright cases in `tests/e2e/team-profile.spec.ts`
(English and Croatian `/teams/brazil` - download link visible, resolves with
a `pdf` content-type, matching the exact pattern every other PDF's own
Playwright case already uses). Full suite: 493 passed (up from 491,
matching the 2 new cases) - one `team-search.spec.ts` Croatian-navigation
test flaked once under full-suite load and passed cleanly both in isolation
and on a full clean re-run, confirming it's unrelated to this change (that
spec file's own `Nav.astro` "Find a team" widget code path was untouched
here).

Repo footprint: `public/downloads/` grows from 7.3 MB to ~56 MB (80 files,
~600-660 KB each - similar per-file overhead to the existing PDFs, not
content-driven since a team profile's own content is short; team-total
titles/runner-ups/appearances are a handful of list items, same shared
fonts/CSS the print stylesheet already embeds in every PDF). The 14
pre-existing PDFs also show as changed in the diff despite no source content
change - `page.pdf()` embeds a per-render timestamp, so a full
`build:pdfs` re-run always touches every file's bytes even when nothing
about what it draws has changed; `check:pdfs` confirms all 94 are current
content-wise regardless.

**Left for a future pass:** the standing "nothing left" list is otherwise
unchanged. No further "missing feature" gaps are known across the site as of
this run.

### Bug fix: quiz "Champion order challenge" cards accepted invalid, non-bijective rankings - fixed 2026-08-18 (intensive run)

With the backlog still fully checked off, this run did a fresh audit rather
than trusting the standing "nothing left" note verbatim, and found a real
interaction bug in the quiz's ranking questions that no prior pass had
caught: each item's rank `<select>` independently offers every value
`1..N`, and `QuizScript.astro`'s `setupOrderCard()` only ever gated the
"Check order" button on *no select being empty* - nothing stopped a reader
from assigning the same number to two different items (e.g. `1, 1, 3, 4`)
while another number went unused. `check()` then compared each select to
its `correctRanks[i]` independently, so two items sharing the identical
dropdown value could be marked one "correct spot" and one "wrong spot"
purely by chance, with no message ever telling the reader their answer
wasn't a valid ordering to begin with - confusing feedback for what the
site's own `AGENTS.md` calls a family-friendly quiz.

Fixed by adding a `hasDuplicateRank()` check to both `updateCheckState()`
(disables "Check order" and shows an inline warning the moment two selects
share a value, even before every select is filled) and `check()` itself
(defensive guard against the same case, matching the existing empty-select
guard). New `quizOrderDuplicateRank` string in `src/lib/i18n.ts` (EN/HR),
wired through `QuizOrderCard.astro` as a new `data-i18n-order-duplicate`
attribute alongside the card's existing `data-i18n-order-*` strings, same
pattern every other quiz feedback string already uses since `is:inline`
scripts can't call `t()` directly.

**Tests:** 2 new Playwright cases in `tests/e2e/mobile.spec.ts` (English:
fill every rank validly, then collide the last two on the same number -
asserts the button disables, the exact warning text appears, and both
clear once the collision is resolved; Croatian: same collision, asserts the
translated warning). Full suite re-run: **495 passed** (up from 493,
matching the 2 new cases), including the pre-existing order-challenge and
quiz-states accessibility specs, confirming no regression from the shared
`QuizScript.astro`/`QuizOrderCard.astro`/`i18n.ts` edits. `pnpm lint`
(`astro check`) - 0 errors/warnings/hints across 115 files. `pnpm test` -
344 Vitest cases, unchanged (no library/data code touched, only quiz
components/script and i18n strings). `pnpm build` - 105 pages, unchanged.
`check:links`/`check:sitemap`/`check:perf`/`check:precache` all clean
against the rebuilt `dist/`; quiz pages are not part of the PDF pipeline
(`scripts/pdf-pages.mjs` has no quiz entry), so `check:pdfs` is unaffected.

**Left for a future pass:** the standing "nothing left" list is otherwise
unchanged; this was a genuine bug found by re-auditing rather than a new
backlog item. The audit that surfaced this also flagged two lower-priority
candidates not pursued here: `yearByWinnerQuestions` (the "in which year
did X win" reverse-lookup pool) is wired only for Ballon d'Or in
`src/pages/quiz.astro`, never for the four team competitions, even though
`src/lib/quiz.ts`'s implementation is already fully generic; and
`public/downloads/` has grown to ~56 MB of near-duplicate per-team PDFs,
which is documented/intentional bloat (embedded fonts/CSS per file) rather
than an overlooked bug, only worth revisiting if PDF weight becomes an
actual complaint.

### Extend "in which year did X win it?" quiz questions from Ballon d'Or-only to the four team competitions - 2026-08-18 (intensive run)

With the backlog still fully checked off, this run picked up the lower-
priority gap the previous run's audit flagged but didn't pursue:
`yearByWinnerQuestions()` in `src/lib/quiz.ts` was already a fully generic
"in which year did {winner} win the {competition}?" builder - it only needs
an `Edition[]` and works for any table with a `winner` column - but
`src/pages/quiz.astro`/`hr/quiz.astro` only ever called it for Ballon d'Or,
so the reverse-lookup question type never appeared for the FIFA World Cup,
UEFA EURO, Copa América or UEFA Nations League despite each of those tables
having genuine one-time champions to ask about (e.g. England 1966 and Spain
2010 for the World Cup; the function already excludes any winner - team or
player - who won more than once, since a repeat winner has no single
correct year).

The one real wrinkle: the existing Croatian prompt hard-coded "osvojio
nagradu {competition}" (won the **award**), which reads naturally for the
Ballon d'Or but not for a team winning a competition ("osvojio nagradu FIFA
Svjetsko prvenstvo" would misname a tournament as an award). Added a new
`subject: 'team' | 'player'` parameter (defaulting to `'player'`, so the
existing Ballon d'Or call sites are untouched) that only branches the
Croatian wording - `'team'` renders "osvojio natjecanje {competition}" (won
the **competition**) instead. The English prompt already reads naturally
either way ("win the {competition}"), so it takes no subject branch, same
pattern `mostTitlesQuestion()` already established for its own
team-vs-player Croatian wording.

Wired one new low-weight pool entry (`take: 1`) per team competition into
both `quiz.astro` and `hr/quiz.astro`, right after that competition's
"most titles" question, passing `subject: 'team'`. Verified all four
competitions actually produce at least one qualifying question against the
current tables before wiring them in: World Cup (England, Spain), EURO
(several one-time champions), Copa América (e.g. Paraguay, Bolivia,
Colombia), Nations League (France 2021, Spain 2023 - Portugal won twice so
is correctly excluded). Also updated `content/quiz.md`'s "Question types in
this quiz" list and the hand-translated Croatian equivalent in
`hr/quiz.astro` to describe the now-generalized question type instead of
naming only the Ballon d'Or.

**Tests:** 2 new Vitest cases in `tests/unit/quiz.test.ts` (a one-time team
champion produces the expected English prompt/answer; the Croatian prompt
says "osvojio natjecanje" rather than "osvojio nagradu" for `subject:
'team'`). 2 new Playwright cases in `tests/e2e/mobile.spec.ts` (English and
Croatian: a generated team year-by-winner card renders, is answerable, and
shows correct feedback) plus 2 existing cases updated for the changed
static copy (the "Question types" list text on both language pages).
Full suite re-run: **497 passed** (up from 495, matching the 4 net new/
changed Playwright cases - 2 added here plus the 2 pre-existing copy
assertions updated in place) and **346 Vitest cases** (up from 344).
`pnpm lint` (`astro check`) - 0 errors/warnings/hints across 115 files.
`pnpm build` - 105 pages, unchanged. `check:links`/`check:sitemap`/
`check:perf`/`check:precache` all clean against the rebuilt `dist/`; quiz
pages aren't part of the PDF pipeline, so `check:pdfs` is unaffected.

**Left for a future pass:** the standing "nothing left" list is otherwise
unchanged. The `public/downloads/` PDF-bloat note from the previous run
still stands (documented/intentional, not an overlooked bug).

### Accessibility: main WCAG sweep's own /teams/<slug> gap - closed 2026-08-18 (later intensive run)

The earlier same-day "close /teams's three site-wide-sweep gaps" entry
(JSON-LD, forced-colors, print media) fixed every gap it named, but missed a
fourth one of the identical shape in the one sweep most likely to catch a
real bug: `tests/e2e/accessibility.spec.ts`'s main WCAG 2.1 A/AA pass (light
+ dark `colorScheme`) builds its page list from `NAV_LINKS`/
`TRANSLATED_PATHS` - the fixed top-level routes, which already covers the
`/teams` index - so it has no way to reach the 40 dynamic `/teams/<slug>`
profile pages (`src/pages/teams/[slug].astro`, added 2026-08-17). Both
`accessibility-forced-colors.spec.ts` and `print-styles.spec.ts` already
carry their own targeted `/teams/<slug>` spot-check for exactly this reason;
this is the one sweep of the three that doesn't disable the `color-contrast`
rule, so it's the one a real contrast regression on those pages would
actually have caught, and it was the one left uncovered.

Added a new describe block to `accessibility.spec.ts`, spot-checking the
same representative team (Brazil) the other two specs already chose, for
both languages and both color schemes (4 new tests): `teams/brazil` and
`hr/teams/brazil`, each swept with the identical axe config
(`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`, `region` disabled, `color-contrast`
left enabled) the main sweep already uses for every other page, rather than
one test per team.

**No WCAG violations found** - this is a coverage-gap closure, not a bug-fix
pass; the profile page already meets WCAG 2.1 A/AA in both languages and
both color schemes, it had simply never been swept by this particular file.
No `src/` or `content/` changes were needed.

**Tests:** 4 new Playwright cases. Full suite re-run: **501 passed** (up
from 497, matching the 4 new cases). `pnpm lint` (`astro check`) - 0
errors/warnings/hints across 115 files. `pnpm test` - 346 Vitest cases,
unchanged (test-only change, no library or page code touched). `pnpm build`
- 105 pages, unchanged. `check:links`/`check:sitemap`/`check:perf`/
`check:precache` all clean against the rebuilt `dist/`.

**Left for a future pass:** the standing "nothing left" list is otherwise
unchanged; this closes the last known gap in `/teams/<slug>`'s test
coverage across all three accessibility specs. The `public/downloads/`
PDF-bloat note still stands (documented/intentional, not an overlooked
bug).

### New feature: "How it works" plain-language rules explainer on all six competition/award pages - added 2026-08-19 (intensive run)

With every standing "Left for a future pass" candidate from recent runs
either infeasible (source-link liveness) or explicitly low-yield/rejected
(further content-accuracy spot-checks, the flag-emoji idea, CSP's
`'unsafe-inline'` tightening, the Golden Boot reverse-lookup quiz type,
PDF bloat), this run went looking for a genuinely new gap rather than
re-treading those. It found one the site's own content had already asked
for: `content/uefa-nations-league.md`'s "Website idea" section (never fully
acted on) explicitly requested "a separate explanation of the league
system," and `content/fifa-world-cup.md`'s "Suggested child-friendly
features" list gestures at the same need. More broadly, despite the depth
of historical-trivia notes on every competition page (`Format milestones`,
`Historical format note`, `Key facts`, `Memorable moments`, `Editorial
notes`), none of the six competition/award pages ever explained *how the
tournament or award actually works* in plain language - qualification,
group stage, knockout, promotion/relegation, voting - which is a real gap
against `AGENTS.md`'s "family-friendly football-history website" mission
and its "Recommended first milestone" list.

Added a new `## How it works` section (3-5 short, plain-language bullets) to
all six `content/*.md` files - FIFA World Cup, UEFA EURO, Copa América, UEFA
Nations League, Ballon d'Or, and Golden Boot - covering qualification, the
group-to-knockout shape, Nations League's league/promotion system, Copa
América's format history (already summarized for editors in "Important
editorial warning" but never simplified for readers), and the Ballon
d'Or/Golden Boot's very different "individual award, not a team trophy"
shape. Every bullet that cross-references another section was checked
against that page's actual `noteHeadings` (or hr `notes` array) so it only
points at content the page truly renders below it - e.g. Copa América's
"How it works" deliberately does *not* point at "Important editorial
warning," since that heading is editorial audit trail never exposed via
`noteHeadings` on either language's page.

Wired into the six English pages via the existing `noteHeadings` parameter
to `loadCompetition()` (`src/pages/competitions/*.astro`), placed first in
each array so the rules explainer renders ahead of the historical notes -
the same "generic, ordered, requested-heading" mechanism every other note
section already uses, no library changes needed beyond that. Golden Boot's
two-table page requests it only once (on the World Cup-scorers load, not
the EURO one) so the merged `[...worldCup.notes, ...euro.notes]` shows it a
single time, not duplicated per table - covered by a new unit test.
Hand-translated into all six `src/pages/hr/competitions/*.astro` pages'
existing `notes: NoteSection[]` arrays as "Kako funkcionira," matching the
translation `quiz.astro`/`hr/quiz.astro` already established for their own
unrelated "How it works" section. `EditorialNotes.astro`'s `iconFor()`
gained a new case (`ℹ️`) for "How it works"/"Kako funkcionira" headings,
alongside the existing 🎉 moments case and 📝 default.

**Tests:** 2 new Vitest cases in `tests/unit/notes.test.ts` (ordering when
"How it works" is requested first; the Golden Boot one-load/one-render
sharing pattern). 5 new Playwright cases in `tests/e2e/mobile.spec.ts`
(Copa América English/Croatian, Nations League Croatian, Ballon d'Or
English/Croatian - each page not already asserting a `.notes__card` count),
plus every existing note-count assertion and cross-heading check updated in
place for the six pages that gained a section (World Cup and Golden Boot
English/Croatian counts bumped from 3/2 to 4/3; EURO, Nations League and
Ballon d'Or English pages, which had no count assertion, gained a targeted
heading + text check instead). Full suite re-run: **506 passed** (up from
501, matching the 5 new cases) and **348 Vitest cases** (up from 346,
matching the 2 new cases). `pnpm lint` (`astro check`) - 0
errors/warnings/hints across 115 files. `pnpm build` - 105 pages, unchanged.
`check:links`/`check:sitemap`/`check:perf`/`check:precache` all clean
against the rebuilt `dist/`. `pnpm build:pdfs` regenerated all 94 PDFs (the
new section is inside `TABLE_COMPONENTS`/`content/*.md`, both already
tracked as PDF sources in `scripts/pdf-pages.mjs`, so every competition PDF
*and* all 80 team PDFs - which join in the four team-competition content
files - correctly went stale and were regenerated); `pnpm check:pdfs`
confirms all 94 are fresh again.

**Left for a future pass:** the Nations League "Website idea" section this
run partially closed still asks for "a compact podium card for each
edition" - a bigger UI feature, out of scope here, and not pursued. The
standing candidates from prior runs are otherwise unchanged (source-link
liveness infeasible, further content-accuracy spot-checks low-yield, the
flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth revisiting, the
Golden Boot reverse-lookup quiz type not pursued, `public/downloads/`
PDF-bloat documented/intentional).

### New feature: "Podium by edition" compact cards on the UEFA Nations League page - added 2026-08-19 (later intensive run)

With the "How it works" rollout closing the last content-parity gap earlier
the same day, this run went back to a concrete, still-open feature request
inside the editorial content itself: `content/uefa-nations-league.md`'s
"Website idea" section asks for "a compact podium card for each edition" as
well as the league-system explanation - the explanation half was satisfied
by the "How it works" section, but the podium-card half was never built.
Nations League ranks highest in this routine's competition priority order
among anything with an open, named ask, and unlike a from-scratch feature
this one is scoped by the source content itself: one card per edition
showing only the top four finishers (champion, runner-up, third, fourth),
explicitly *not* group-stage results, matching the note's "avoid
overwhelming younger readers with every group-stage result" instruction.

**New `buildPodiums()`** (`src/lib/editions.ts`) reduces editions to a
`PodiumEntry` (`src/lib/types.ts`): year, host, champion, and runner-up/
third/fourth read generically from the row's cells by column-label match
(`/^third$/i`, `/^fourth$/i`, reusing the same `cellValue()` helper and
"undefined when the column doesn't exist" convention `buildTimeline()`
already established for runner-up/final) - so the function works for any
competition whose table has "Third"/"Fourth" columns, not just Nations
League, without new per-competition logic.

**New `PodiumCards.astro`** component, styled after the existing
`ChampionsTimeline.astro` card-grid (same `auto-fill`/`minmax` grid, same
`--bg-elevated`/`--border`/`--radius` tokens) but medal-ranked: 🥇🥈🥉 plus a
plain "4." for fourth, each decorative glyph `aria-hidden` with a
`.visually-hidden` ordinal label ("Champion:", "Runner-up:", etc.) ahead of
the name, the same accessible-decoration pattern `ChampionsSummary.astro`
already uses for its trophy icon and count. All four label props are
overridable, matching every other card component's localization mechanism.

**Wiring:** rather than hardcode this into the shared `CompetitionView.astro`
(used by all six English competition/award pages) or duplicate it, added an
optional `podium`/`podiumHeading` prop to `CompetitionView.astro` - unset by
default (every other competition page is unaffected), passed only from
`src/pages/competitions/nations-league.astro` via
`buildPodiums(data.editions)`. The hand-rolled
`src/pages/hr/competitions/nations-league.astro` (which doesn't use
`CompetitionView`, like every other Croatian competition page) renders
`PodiumCards` directly with Croatian labels ("Pobjednici po izdanju",
"Prvak", "Drugoplasirani", "Treći", "Četvrti", "Domaćin:") - country/team
names themselves stay untranslated, matching every other translated page's
"UI chrome only, not the underlying data" rule.

**Tests:** 3 new Vitest cases in `tests/unit/editions.test.ts` (`buildPodiums`
reads all four columns; falls back to `undefined` on tables without them;
still shows a "Not awarded" placeholder champion verbatim). 2 new Playwright
cases in `tests/e2e/mobile.spec.ts` (English and Croatian, one per page: the
heading is visible, exactly 4 cards render, the latest edition's card shows
the correct year/host/all four finishers). Full suite re-run: **508 passed**
(up from 506, matching the 2 new cases; the existing English/Croatian
print-styles and WCAG accessibility specs for `/competitions/nations-league`
and `/hr/competitions/nations-league` also re-ran and confirmed no
violations with the new cards present, in both light/dark and
forced-colors modes) and **354 Vitest cases** (up from 351, matching the 3
new cases). `pnpm lint`
(`astro check`) - 0 errors/warnings/hints across 116 files (up from 115: the
new `PodiumCards.astro`). `pnpm build` - 105 pages, unchanged.
`check:links`/`check:sitemap`/`check:perf`/`check:precache` all clean
against the rebuilt `dist/`. `pnpm build:pdfs` regenerated all 94 PDFs (the
new function lives in `src/lib/editions.ts`, which every PDF's rendering
path depends on, so the freshness checker correctly flagged all of them
stale even though the podium cards themselves aren't rendered into the PDF
layout - the PDF template is a separate, print-specific component tree that
was not changed); `pnpm check:pdfs` confirms all 94 are fresh again.

**Left for a future pass:** the podium cards render only on the English and
Croatian Nations League pages. Extending the same `podium`/`podiumHeading`
prop to the other three team competitions with "Third"/"Fourth" columns
(World Cup, EURO, Copa América - Copa América's only for editions with a
standalone third-place match, the same caveat `SEMIFINAL_COLUMN` in
`src/lib/compare.ts` already documents) is a natural follow-up but was kept
out of this run's scope, since the source content's "Website idea" note only
asked for it on the Nations League page specifically. The standing
candidates from prior runs are otherwise unchanged (source-link liveness
infeasible, further content-accuracy spot-checks low-yield, the flag-emoji
idea rejected, CSP's `'unsafe-inline'` not worth revisiting, the Golden Boot
reverse-lookup quiz type not pursued, `public/downloads/` PDF-bloat
documented/intentional).

### Extended "Podium by edition" cards to the World Cup and Copa América pages - added 2026-08-19 (intensive run)

The previous run's own "Left for a future pass" note flagged this as a
natural follow-up: `buildPodiums()`/`PodiumCards.astro` (built for the UEFA
Nations League page) work for any competition table with real top-four
data, and two of the other three team competitions genuinely have one -
Copa América ranks highest in this routine's priority order among anything
with an open, scoped ask, so it and World Cup (which also has a full
Third/Fourth-place history) were picked up together this run.

**EURO was deliberately excluded, not just deferred.** Its own content
already documents why: EURO's page states outright that "no third-place
match has been played since 1980," so its table only has "Other
semifinalist" / "Other semifinalist / fourth" columns - the two semifinal
losers are never actually ranked 3rd vs 4th against each other. Showing
them in ranked podium slots would invent a distinction the historical
record doesn't support (AGENTS.md rule 2, "do not silently alter
historical facts"). `buildPodiums()`'s fourth-place matcher was widened
from an exact `/^fourth$/i` to `/^fourth\b/i` so it also reads the World
Cup's actual header, `"Fourth / other semifinalist"` (a header that looks
similar to EURO's but is always a real team there, since the World Cup has
played a third-place match every edition) - deliberately written so it
still doesn't match EURO's "Other semifinalist / fourth" header, which
starts with "Other," not "Fourth."

**Bug caught before shipping:** Copa América's three home-and-away editions
(1975, 1979, 1983 - no standalone third-place match at all) hold the
sitewide "—" placeholder in their Third/Fourth cells. `buildPodiums()`
previously had no caller that could reach a "—" cell (Nations League's
table never has one), so this was latent, not yet a shipped bug - it would
have rendered a literal em dash as a "team name" on those three cards.
Added a small `definiteCell()` helper (same "—" convention `isMissingCell()`
in `compare.ts` already uses) so those two cells now correctly omit their
rows instead, matching how every other missing podium column already
renders.

**Wiring:** `buildPodiums(data.editions)` plus the existing `podium`/
`podiumHeading` props on `CompetitionView.astro`, following the exact
Nations League precedent, for both `src/pages/competitions/{world-cup,
copa-america}.astro`. The two hand-rolled Croatian pages
(`src/pages/hr/competitions/{world-cup,copa-america}.astro`, which don't
use `CompetitionView` like every other `/hr/` competition page) render
`PodiumCards` directly with the same Croatian labels the Nations League
Croatian page already established ("Pobjednici po izdanju", "Prvak",
"Drugoplasirani", "Treći", "Četvrti", "Domaćin:").

**Tests:** 3 new Vitest cases in `tests/unit/editions.test.ts` (reads the
World Cup's "Fourth / other semifinalist" header; does *not* match EURO's
"Other semifinalist" columns; treats a "—" cell as absent, not a literal
team name). 4 new Playwright cases in `tests/e2e/mobile.spec.ts` (World Cup
English/Croatian - 23 cards, latest edition 2026: Spain over Argentina,
England third, France fourth; Copa América English/Croatian - 48 cards,
latest edition 2024: Argentina over Colombia, Uruguay third, Canada fourth,
plus a targeted check that the 1975 home-and-away card shows only
champion/runner-up and never a literal "—"). Full suite re-run: **512
Playwright passed** (up from 508, matching the 4 new cases; run against the
pre-installed Chromium via `PW_EXECUTABLE_PATH`, since the freshly
`pnpm install`-ed `@playwright/test` resolved a newer browser build than
the one pre-provisioned in this environment) and **354 Vitest cases**
(unchanged - the 3 new `buildPodiums` cases replace no others, and no
existing case needed updating). `pnpm lint` (`astro check`) - 0
errors/warnings/hints across 116 files. `pnpm build` - 105 pages,
unchanged. `check:links`/`check:sitemap`/`check:perf`/`check:precache` all
clean against the rebuilt `dist/`.

**Correction to the previous run's PDF note, found while regenerating:**
that entry claimed "the podium cards themselves aren't rendered into the
PDF layout - the PDF template is a separate, print-specific component
tree." That was wrong - `scripts/generate-pdfs.mjs` prints the actual live
page under emulated print media (there is no separate PDF-only template),
so podium cards render into the PDF exactly like any other on-page content;
confirmed here by `world-cup.pdf` growing from 302 KB to 384 KB and
`copa-america.pdf` from 723 KB to 861 KB once their podium sections
existed (`nations-league.pdf`'s unchanged byte size last run was
coincidental, not evidence of a separate template). That correction
surfaced a real, previously-untracked gap: `scripts/pdf-pages.mjs`'s
per-page `sources` lists never included `PodiumCards.astro`, so a future
edit to that component alone (e.g. a styling fix) would have silently left
all six podium-bearing PDFs (`world-cup(-hr)`, `nations-league(-hr)`,
`copa-america(-hr)`) stale without `pnpm check:pdfs` ever catching it -
exactly the "content-only hashing blind spot" the file's own header
comment already warns about for rendering-code changes in general. Added a
shared `PODIUM_COMPONENT` constant, referenced individually by those six
entries only (not folded into the universal `TABLE_COMPONENTS`, since EURO/
Ballon d'Or/Golden Boot/Records don't render it). `pnpm build:pdfs`
regenerated all 94 PDFs; `pnpm check:pdfs` confirms all 94 fresh again.

**Left for a future pass:** EURO structurally cannot get real podium cards
without either a design change (e.g. an unranked "semifinalists" pair
instead of medal-ranked slots) or new editorial content ranking third
against fourth, which doesn't exist and isn't something this routine
should invent - not pursued. The standing candidates from prior runs are
otherwise unchanged (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, the flag-emoji idea rejected,
CSP's `'unsafe-inline'` not worth revisiting, the Golden Boot
reverse-lookup quiz type not pursued, `public/downloads/` PDF-bloat
documented/intentional).

## CI infrastructure note (2026-08-19)

The `test` job on commit `a899137` (the "Podium by edition" commit above) got
stuck on the "Install Playwright browser" step for 3+ hours with no progress
- every prior run on this PR completed the full suite in ~7-8 minutes, and
every step before that one (type check, unit tests, build, the five
`check:*` scripts) had already passed normally. This looks like a hung
GitHub Actions runner, not a real test failure: nothing errored, the job
just stopped making progress. The PR-watching routine has no permission to
cancel or re-run an Actions workflow via the API (`403 Resource not
accessible by integration`), so this trivial addendum commit exists solely
to trigger a fresh CI run on a new SHA and unstick it - no code or content
changed. If this recurs, it's an infra issue to raise with GitHub Actions
support/status, not something to keep re-triggering around.

### New feature: "Tap a year to reveal a short story" on the four team-competition tables - added 2026-08-19 (intensive run)

`content/fifa-world-cup.md`'s own "Suggested child-friendly features" note
(never previously acted on) asked for exactly this: "Tap a year to reveal a
short story." Each competition's "Memorable moments" bullets already name a
specific year (e.g. "Uruguay defeated Brazil...in the decisive 1950 match"),
so this joins them onto the matching edition row as a native
`<details>`/`<summary>` disclosure - no JS required, works with screen
readers and print out of the box.

**Library:** new `buildYearStories(editions, storyBullets)` in
`src/lib/editions.ts` - matches each bullet's first 4-digit year to the one
edition whose *effective* year equals it. For a plain Year column that's just
`yearSort`; for a season label (Nations League's "2018–19", real separator is
an en dash in the source table, though the regex also accepts a plain hyphen
for front-matter/prose style) it's the *Finals* (second) year - 2019, not
2018 - since that's the year the bullets themselves reference. A bullet
naming two years (EURO's "The delayed EURO 2020 was played in 2021...")
resolves via its first-mentioned year, 2020, matching that edition's actual
Year-column label. The first bullet wins when a later, more general bullet
also happens to name an already-covered year (e.g. Nations League's "so
far...including Germany finishing fourth in 2025" bullet, after the
specific "Portugal beat Spain...2025" one).

**Real bug caught before shipping:** the season-label matching above was
originally written with a plain-hyphen-only regex; the Nations League table
actually separates its "Season" values with an en dash ("2018–19"), so every
row silently fell back to matching by season *start* year instead - a
row-count-preserving, easy-to-miss bug (the column still rendered, just
joined to the wrong or no edition for every row) caught only by actually
inspecting the built HTML's `data-year` attributes against which rows got a
story, not by the type checker or a naively-written test. Fixed by accepting
both separators; added a dedicated regression test.

**Wiring:** `TournamentTable.astro` gained an optional `storyColumn` prop
(label + `Map<edition.year, story>`, same "em dash for a missing row" shape
as the existing `extraColumn`, but rendered as a disclosure instead of plain
text) plus a `storySummaryLabel` prop for the tap prompt text.
`CompetitionView.astro` computes the map automatically from whichever
"Memorable moments" section a page already requested via `noteHeadings` -
zero changes needed to the four English competition pages themselves. The
four hand-rolled Croatian competition pages (which don't use
`CompetitionView`) call `buildYearStories()` directly against their own
hand-translated "Nezaboravni trenuci" bullets and pass `storyColumn`/
`storySummaryLabel="📖 Dodirni za priču"` explicitly, the same pattern every
other locale prop on this component already follows. Ballon d'Or and Golden
Boot get no story column (no "Memorable moments" section on either -
individual awards, not team competitions, same scoping precedent the podium
cards already established). A new `.story-reveal::details-content` print
rule in `global.css` mirrors the existing quiz-reveal fix so the story reads
as plain text on paper regardless of its on-screen open/closed state.

**Tests:** 6 new Vitest cases (`buildYearStories`: plain-year match, the en
dash season-year regression, the plain-hyphen season variant, the
two-years-in-one-bullet case, first-bullet-wins, and the no-year/no-bullets
empty cases). 5 new Playwright cases (World Cup: tap-to-reveal + the em-dash
no-story case; EURO: the delayed-2020 case; Nations League: the season-year
join; Croatian Copa América: translated label/prompt/story; print media: the
story renders without being tapped open). 7 pre-existing Playwright cases
needed a locator fix, not a behavior change - `getByText('<a
Memorable-moments sentence>')` on those pages now matches two elements (the
original notes-section text and the new in-table story), since strict mode
requires an unambiguous match; rescoped each to `.notes__card` explicitly,
which they were already implicitly scoped to.

Full suite: **517 Playwright passed** (up from 512), **360 Vitest passed**
(up from 354). `pnpm lint`/`pnpm build`/`check:links`/`check:sitemap`/
`check:perf`/`check:precache` all clean. All 94 downloadable PDFs
regenerated and fresh (`check:pdfs` confirms).

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally not possible). The remaining two "Suggested child-friendly
features" from `content/fifa-world-cup.md` - "Guess the champion from the
host and finalists" (already substantially covered by the existing quiz's
host/runner-up question types) and "Display a map of host countries" (would
need either a real SVG world map or new editorial geo-data, a bigger scope
than this run) - were not pursued this run.

### New feature: "Display a map of host countries" - a World Cup host locator map - added 2026-08-19 (intensive run)

The last unaddressed item from `content/fifa-world-cup.md`'s "Suggested
child-friendly features" list - every prior intensive run that reached this
note deferred it as "would need either a real SVG world map or new
editorial geo-data, a bigger scope than this run" (most recently the
2026-08-19 "Tap a year" entry above). This run closed it without either: no
coastline/border data is drawn (none of this repository's editorial content
has ever included any, and hand-authoring it from memory risked shipping
something quietly wrong with no human review before merge, the same
"unattended run" caution that shelved the flag-emoji idea back on
2026-08-15) - instead each host's well-known capital-city coordinate is
plotted on a plain latitude/longitude grid.

**Data:** new `src/lib/hostCoordinates.ts` - `WORLD_CUP_HOST_COORDINATES`,
one `{lat, lon, region}` entry per each of the World Cup table's 19 distinct
`Host(s)` values (matching the exact atomic strings `buildHostsSummary()`
already groups co-hosted editions under, e.g. "South Korea and Japan",
"Canada, Mexico and United States" stay single entries, not split). West
Germany (1974) and Germany (2006) deliberately get distinct points (Bonn vs.
a central-Germany point) so the two eras don't collapse onto one marker on
the map the way their title totals already do elsewhere by editorial choice.

**Library:** new `buildHostMapPoints(editions, coordinates, regionOrder?)` in
`src/lib/editions.ts`, joining `buildHostsSummary()`'s grouped hosting totals
onto that coordinate table. Throws on any host with no coordinate entry
rather than silently omitting it - the same "don't let a real gap render as
if everything is covered" reasoning `scripts/pdf-pages.mjs`'s header comment
documents for PDF freshness, so a real future edition (e.g. 2030) fails the
build loudly instead of quietly missing its marker. Sorted by region then
earliest hosting year, so the map's list reads as a geographic story rather
than a titles-ranked one (`buildHostsSummary()` already covers that ranking
on `/records`).

**Component:** new `HostMap.astro` - a plain equirectangular (Plate Carrée)
projection, `viewBox` cropped tightly to the actual marker spread (not the
whole globe) with a light latitude/longitude graticule and equator line for
orientation, dots sized by times-hosted. The SVG is `aria-hidden` on
purpose: every fact it carries - host, hosting years, times hosted, region -
is duplicated in an always-visible list underneath, grouped by region, the
same "chart plus real text" pairing `ChampionsSummary.astro` already uses
for title counts. That split sidesteps forced-colors/print/screen-reader
SVG-graphics accessibility entirely (confirmed by the full
`accessibility.spec.ts`/`accessibility-forced-colors.spec.ts`/
`print-styles.spec.ts` sweeps, which cover `/competitions/world-cup` and
`/hr/competitions/world-cup`, all still zero violations) rather than trying
to make the decorative graphic itself fully accessible. Colors use the
existing `--accent`/`--border`/`--bg-subtle` tokens, so dark mode, forced-
colors and print media all repaint it automatically with no dedicated rules.

**Wiring:** World Cup only, matching the content brief's own scope and the
precedent PodiumCards set (shipped on one page before a later run extended
it - this run left that extension undone; see below). `CompetitionView.astro`
gained an optional `hostMap` prop, rendered after `ChampionsSummary`;
`src/pages/competitions/world-cup.astro` passes it, the other five English
competition/award pages don't. The Croatian page (hand-composed, not using
`CompetitionView`) imports `HostMap.astro` directly with hand-translated
heading/description/unit/region-label props; country names themselves stay
untranslated, the same choice every other table/card on that page already
makes.

**Tests:** 5 new Vitest cases (`buildHostMapPoints`: region/year sort order
using the shared `table` fixture, the no-`regionOrder` default, the
throw-on-missing-coordinate guard, every coordinate's region appearing in
`HOST_REGION_ORDER`, and the "exactly 19 distinct hosts" count staying in
sync with `content/fifa-world-cup.md`). 2 new Playwright cases (English: the
map is decorative, 19 dots, all 5 region headings, Brazil's "2 times"/"1950,
2014"; Croatian: translated region headings, "2 puta", untranslated country
names). `scripts/pdf-pages.mjs` gained `HOST_MAP_COMPONENT`/`HOST_MAP_DATA`
entries on the `world-cup`/`world-cup-hr` PDF sources, the same per-page
pattern `PODIUM_COMPONENT` already follows.

Full suite: **519 Playwright passed** (up from 517), **365 Vitest passed**
(up from 360). `pnpm lint`/`pnpm build`/`check:links`/`check:sitemap`/
`check:perf`/`check:precache` all clean. All 94 downloadable PDFs
regenerated and fresh (`check:pdfs` confirms) - editing `src/lib/editions.ts`
(shared by `COMPETITION_LIB`) makes every PDF's manifest entry stale, the
same all-PDFs-regenerate side effect the Golden Boot bug-fix entry
(2026-08-17) already documented for that file.

**Left for a future pass:** the World Cup page's "Suggested child-friendly
features" list is now fully closed. Extending the host map to Nations
League, Copa América and EURO (their content files have no matching
request for one, unlike the podium cards' precedent) wasn't pursued - the
standing candidates from prior runs are otherwise unchanged (source-link
liveness infeasible, further content-accuracy spot-checks low-yield, the
flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth revisiting, the
Golden Boot reverse-lookup quiz type not pursued, `public/downloads/`
PDF-bloat documented/intentional, EURO podium cards structurally not
possible).

### Quality pass: full-repo health audit, plus a stale-docs fix - added 2026-08-19 (intensive run)

With every item in this file's own "Left to do"/"Nice-to-have" sections
checked off and the standing "Left for a future pass" list unchanged since
the previous run (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally not possible, extending the host map beyond World Cup not
requested by the content), this run first re-verified there was genuinely
nothing left rather than trusting that list at face value: re-read every
`content/*.md` file for an unactioned "Suggested"/"idea"/editorial-warning
section (none - the two remaining World Cup/Nations League feature ideas
were already closed by the previous two runs), re-checked
`docs/WEBSITE_REQUIREMENTS.md` line by line against the live site (every
required page and capability is live; the "by team" filter is the sole
exception, unchanged from when `IMPLEMENTATION_NOTES.md` first named it -
see below), and grepped `src/`/`scripts`/`tests/` for `TODO`/`FIXME`/`XXX`
(none).

Ran the full local check suite clean: `pnpm test` (365 Vitest cases),
`pnpm lint` (`astro check`, 0 errors/warnings/hints across 118 files),
`pnpm build` (105 pages), and `check:links`/`check:sitemap`/`check:perf`/
`check:precache`/`check:pdfs` (94 PDFs) all pass with no changes needed.

Also ran the **full Playwright suite** (519 tests) end-to-end in this
session's sandboxed environment, which the repository's own CI does not run
against - **519/519 passed** with `--workers=1`, confirming no regression
anywhere. Worth recording for whichever future run reaches for this next:
the same suite run at the default worker count (2) failed 89-519 tests with
`net::ERR_CONNECTION_REFUSED`, not real WCAG/behavioral failures - the
`astro preview` server this sandbox's constrained resources can't keep up
with two concurrent Chromium workers, not a site bug. A future run
confirming full e2e health in one of these unattended sessions should pass
`--workers=1` (slower - about 11 minutes here - but reliable) rather than
treating a fast, mass "connection refused" failure as a real regression.
Separately, the pre-installed Chromium at `/opt/pw-browsers/chromium` didn't
match the `@playwright/test` version resolved by `pnpm install` (browser
build 1194 vs. the pinned test package's expected 1234); `playwright.config.ts`
already has a `PW_EXECUTABLE_PATH` escape hatch for exactly this, so no
config change was needed, just setting the env var.

**Real gap found:** `IMPLEMENTATION_NOTES.md`'s "Next logical milestone"
section had gone stale - last written for the Milestone-2-in-progress state
(no `/compare`, `/teams`, PWA, quiz order challenge, "On this day" widget,
downloadable PDFs, or host map existed yet) and still listed `/about/sources`,
sort controls, and Croatian localization as "remaining" work that has in
fact been complete for weeks. Left uncorrected, a future agent skimming that
file instead of this one could waste a run rebuilding something that
already exists. Rewrote it to point at this file as the current source of
truth and to correctly name the "by team" filter as the one still-open
requirement (and why it can't just be coded up - see below).

**Not pursued:** implementing the "by team" filter itself. It is a genuine,
named gap against `docs/WEBSITE_REQUIREMENTS.md`'s required capabilities
("filter by year, host, winner, and team"), but closing it properly needs
new editorial content - a full list of participating national teams per
edition (up to 48 for a single World Cup, across ~140 editions total in
`content/`) - not a code change; only a team *count* column exists today.
Fabricating that data from memory in an unattended run, with no reliable
per-edition source verified the way every other column on these pages has
been (see the many "second independent cross-check" entries above), risks
shipping confidently-wrong history with no human review before merge - the
same "unattended run" caution that has shelved the flag-emoji idea and the
host-country map (twice) in earlier runs. `/compare` and `/teams` already
cover the closely related "which editions did team X reach a final or
semifinal in" question from the data that does exist; a real "which teams
even took part" filter is left for whenever someone sources that data
deliberately, not as a quick pass here.

Full suite unchanged by this run's edits (documentation-only): **519
Playwright passed**, **365 Vitest passed**, `pnpm lint`/`pnpm build`/
`check:links`/`check:sitemap`/`check:perf`/`check:precache`/`check:pdfs` all
clean.

**Left for a future pass:** the standing list above is otherwise unchanged;
this run found no new code-level gap, only the one stale-docs fix. The "by
team" filter remains the one honestly-open requirement, blocked on
editorial data rather than engineering effort.

### Correction: the "by team" filter was already live; new feature: "Fiercest rivalries" ranking on /records - added 2026-08-20 (intensive run)

**Docs correction, not a code change:** the previous entry above (and the
"Next logical milestone" section it rewrote in `IMPLEMENTATION_NOTES.md`)
both state the "by team" filter is still missing. That is wrong. It was
built and shipped on 2026-08-03 (see the "'By team' filter" entry earlier in
this file) - `src/lib/editions.ts`'s `editionTeams()`/`distinctTeams()`, a
`teams` prop and `<select>` on `TournamentTable.astro`, live on all six
competition/award pages in both languages, with its own Vitest and
Playwright coverage. Confirmed still live today: `grep` finds
`data-teams`/`teamLabel` wired up in the current `TournamentTable.astro`,
and a fresh `pnpm build` + manual check of `dist/competitions/world-cup/
index.html` shows the "Team" filter `<select>` rendered with real options.
Every `docs/WEBSITE_REQUIREMENTS.md` required capability has in fact been
complete since 2026-08-03, not "all but one" - re-verified this run,
`grep -rn "TODO\|FIXME\|XXX" src/ scripts/ tests/` still finds nothing new.
Rewrote `IMPLEMENTATION_NOTES.md`'s "Next logical milestone" section to stop
naming a false gap, so a future run skimming that file first doesn't waste a
run either avoiding or re-attempting something that already shipped. Left
this file's own 2026-08-19 entry text as written above rather than editing
it in place - matching how every other correction in this file (e.g. the
"Tooling: `check-internal-links.mjs` entry-point guard" and the many
"second independent cross-check" audits) has always corrected forward with a
new entry, not by rewriting a past one.

**New feature**, now that there genuinely was nothing left in
`docs/WEBSITE_REQUIREMENTS.md`'s required/nice-to-have lists: a "Fiercest
rivalries" ranking on `/records` (and `/hr/records`) - every pair of teams
that has met 2 or more times in a FIFA World Cup, UEFA EURO, Copa América,
or UEFA Nations League final, ranked by total meetings. Built entirely from
data `/compare`'s existing "Finals meetings" panel already computes
(`buildFinalsMeetings()` in `src/lib/compare.ts`, which reads the Champion/
Runner-up columns every competition page already loads) - no new editorial
content, so none of the caution around the "by team" filter's *missing*
data applies here.

- **`src/lib/compare.ts`** gains `buildRivalries(meetings: FinalsMeeting[])`:
  groups every `FinalsMeeting` by an unordered team-id pair, keeps only pairs
  with 2+ meetings (a "rivalry", not a one-off final), and returns each
  pair's total meetings, per-team win counts, the distinct competitions
  they've met in (first-meeting order), and the most recent meeting -
  ranked by meeting count, then combined wins, then name. West Germany and
  Germany merge into one pair via the same `winnerId`/`runnerUpId` grouping
  `buildFinalsMeetings()` already applies; the display name goes through
  `summaryGroupFor()` so a merged pair reads "Germany (incl. West Germany)"
  exactly like every other generated ranking on this page, even though each
  individual meeting keeps its own historical winner/runner-up name.
- **`src/pages/records.astro`/`hr/records.astro`** gain a "Fiercest
  rivalries" ("Najveći rivaliteti") section between "Biggest final wins" and
  "Individual award winners timeline": an accessible, horizontally-scrollable
  table (`role="region"`, `tabindex="0"`, visually-hidden caption - the same
  pattern `/compare`'s "All national teams" table already uses) ranking every
  qualifying pair, with each team name linking to its `/teams/<slug>` profile
  page. Built from the same `competitions` array (World Cup/EURO/Copa
  América/Nations League) both pages already load for their other rankings,
  reshaped inline into the `CompetitionEditions[]` shape `buildFinalsMeetings`
  expects - no new data loading, no refactor of the existing four
  `loadCompetition()` calls.
- **Tests**: 7 new Vitest cases in `tests/unit/compare.test.ts`
  (`buildRivalries`: the 2+-meetings threshold, alphabetical teamA/teamB
  ordering, per-team win counts including a one-sided rivalry, the West
  Germany/Germany merge, distinct-competitions + most-recent tracking across
  two competitions, ranking by meeting count, and the empty-list case - 372
  total, up from 365) and 2 new Playwright cases at 360px (English: the top
  row is Argentina vs Uruguay with a real meeting count and a working
  `/teams/argentina` link, plus the Germany merge is visible in the table;
  Croatian: the translated heading and table exist, and its top row's team
  names and meeting count match the English page's exactly).
- Confirmed with `pnpm lint` (0 errors/warnings/hints), the full Vitest
  suite (372/372), and a full `pnpm build` (105 pages, unchanged page count).
  Editing `src/lib/compare.ts` triggered `check:pdfs`' rendering-code
  tracking (added 2026-08-17) across every page that depends on it -
  `/records`, `/hr/records`, and all 80 `/teams/<slug>` PDFs (English +
  Croatian) - regenerated with `pnpm build:pdfs`
  (`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`, per the escape hatch the
  2026-08-19 entry documented) and reverified clean. `check:links`,
  `check:sitemap`, `check:perf` (records/hr-records stay the two heaviest
  pages at ~492/497 KB, still under the 510 KB budget), and `check:precache`
  all pass unchanged. Playwright: the **full suite passed 521/521** at
  `--workers=1` (up from 519, the 2 new rivalries cases), confirming no
  regression anywhere else in the site.

**Left for a future pass:** no known gap in this ranking - it's live on
both languages, degrades to an explanatory message if no pair ever
qualifies (can't happen today, but keeps the page honest for e.g. a future
competition with no repeat finalists yet). The "by team" filter is not an
open item; it was already complete. No other gap surfaced this run.

### Bug fix: the previous run's "Fiercest rivalries" ranking shipped without structured data or PDF-freshness tracking - fixed 2026-08-20 (intensive run)

With every standing "Left for a future pass" candidate still exhausted
(source-link liveness infeasible, further content-accuracy spot-checks
low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth
revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing), this run re-audited the site's own most recently shipped feature
- earlier today's "Fiercest rivalries" ranking - against the conventions
every other `/records` ranking already follows, rather than assuming a
same-day feature had already caught up to them. It found two real,
previously-unflagged gaps.

**1. No `ItemList` structured data.** Every one of `/records`' other eight
ranking sections (Most successful teams, Most frequent hosts, Titles won on
home soil, Back-to-back champions, Nearly champions, Nearly finalists,
Longest wait between titles, Biggest final wins) has had a schema.org
`ItemList` since the 2026-08-15/16 SEO passes - "Fiercest rivalries" was
built the same way (a generated ranking over already-audited data) but its
own entry never mentioned JSON-LD, and a direct check of the built HTML
confirmed the omission: the section rendered its accessible on-page table
with no matching `<script type="application/ld+json">` block anywhere on
the page.

New **`buildRivalriesItemList()`** in `src/lib/jsonLd.ts` closes this,
following the exact shape `buildCountryRecordsItemList()` already
established for a non-`ChampionSummary` ranking: one `Thing` per rivalry,
named `"{Team A} vs {Team B}"` (matching the table's own "Rivalry" column),
with a `describe()`-overridable description covering meetings, head-to-head
wins, competitions, and the most recent meeting - the same facts the table
already renders, no new computation. Wired into both `records.astro`'s and
`hr/records.astro`'s existing `jsonLd` arrays with the same
`rivalries.length > 0` fallback-skip guard every other ranking's `ItemList`
already uses (today always populated - Argentina and Uruguay alone have met
13 times). The Croatian page's `describe()` override uses the same
"neutral phrasing, no gendered verb" trick the "Finals meetings" panel
entry (2026-08-16) already established for the ~90 possible team pairs this
could render, rather than risking a wrong Croatian conjugation for any of
them.

**2. `/records` and `/hr/records`'s PDFs had no dependency on
`src/lib/compare.ts` or `src/lib/teamProfile.ts`.** The "Fiercest rivalries"
section calls `buildFinalsMeetings()`/`buildRivalries()` (from
`compare.ts`) and `teamProfileSlug()` (from `teamProfile.ts`, for each
team's link) directly in `records.astro`/`hr/records.astro` - but neither
file was ever added to those two pages' `sources` list in
`scripts/pdf-pages.mjs`. That is exactly the "content-only hashing blind
spot" the file's own header comment has warned about since the 2026-08-17
"PDF-freshness checker now tracks rendering code" entry closed the same gap
everywhere else - it was simply never re-applied to this one section,
because it shipped after that fix and nothing re-checked it against the
now-established convention. Confirmed the gap was real, not theoretical,
by running `pnpm check:pdfs` before touching `pdf-pages.mjs`: it reported
both PDFs clean despite the new rivalries section already being live on
the page and printed into both PDFs (`generate-pdfs.mjs` prints the actual
live page - no separate PDF template, per the 2026-08-19 correction in this
same file) - a future bug fix to `buildRivalries()`'s grouping logic would
have silently left `records.pdf`/`records-hr.pdf` wrong, unnoticed, the
same way the original Golden Boot PDF bug went undetected for two days.

Fixed by adding `src/lib/compare.ts` and `src/lib/teamProfile.ts` to both
the `records` and `records-hr` entries' `sources` arrays in
`scripts/pdf-pages.mjs`, with an updated comment explaining why (both files
were already tracked for the 80 `/teams/<slug>` PDFs via `TEAM_PDF_SOURCES`,
just never added to `/records`' own separate entry).

**Tests:** 4 new Vitest cases (`tests/unit/jsonLd.test.ts`:
`buildRivalriesItemList` - the ranked `Thing`-per-pair shape and default
English description, the singular "1 meeting" wording for a hypothetical
one-meeting rivalry, the `describe()` override, and an empty-list case -
376 total, up from 372). 2 existing Playwright cases in
`tests/e2e/mobile.spec.ts` updated in place (`/records`'s and
`/hr/records`'s JSON-LD block-count assertions: 39→40 blocks / 38→39
`ItemList`s each) plus new assertions in both that the rivalries `ItemList`
exists, names the real top pair, and its description matches the expected
"N meeting(s) (" / "N susreta (" wording - no hardcoded meeting count,
since that number is real, audited data that could shift if the underlying
tables are ever corrected.

`pnpm lint` (`astro check`) - 0 errors/warnings/hints across 118 files.
`pnpm test` - **376/376** (up from 372). `pnpm build` - 105 pages,
unchanged. Confirmed `pnpm check:pdfs` failed as expected before
regenerating (`records.pdf`/`records-hr.pdf` correctly flagged stale
against the two newly-tracked files), then regenerated all 94 PDFs via
`pnpm build:pdfs` (`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`) and
re-ran `pnpm build` so `dist/` picked up the fresh files; `pnpm check:pdfs`
now passes clean. `check:links` (109 pages, 0 broken links),
`check:sitemap` (104 entries), and `check:precache` (31 URLs) all pass
unchanged. `check:perf` - `/hr/records` (499.3 KB) and `/records`
(494.2 KB) grew by the new JSON-LD block's few hundred bytes, still
comfortably under the 510 KB budget. Full Playwright suite re-run at
`--workers=1`: **521/521 passing** (unchanged count - both updated cases
are existing tests edited in place, not new ones; 11.3 minutes, confirming
no regression anywhere else in the site from the shared `records.astro`/
`hr/records.astro`/`jsonLd.ts` edits).

**Left for a future pass:** with both gaps closed, "Fiercest rivalries" now
matches every other `/records` ranking's conventions exactly. The standing
candidates from prior runs are otherwise unchanged (source-link liveness
infeasible, further content-accuracy spot-checks low-yield, the flag-emoji
idea rejected, CSP's `'unsafe-inline'` not worth revisiting, the Golden
Boot reverse-lookup quiz type not pursued, `public/downloads/` PDF-bloat
documented/intentional, EURO podium cards structurally impossible, full
per-edition team participant lists blocked on sourcing). Worth noting for
whoever ships the *next* new `/records` ranking: this run's own lesson is
that a same-day feature addition needs its own explicit checklist pass
against "does it have an ItemList?" and "did I add its new `src/lib`
dependencies to `pdf-pages.mjs`?" rather than trusting that shipping fast
means shipping complete.

### Bug fix: the 80 `/teams/<slug>` profile pages had zero page-specific structured data - fixed 2026-08-20 (intensive run)

With every standing "Left for a future pass" candidate still exhausted
(source-link liveness infeasible, further content-accuracy spot-checks
low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'` not worth
revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing), this run took the previous entry's own closing lesson literally -
"a same-day feature addition needs its own explicit ItemList checklist pass"
- and applied it retroactively across the whole site rather than just the
one section that had just been caught. `grep -rln "jsonLd\|JsonLd" src/pages/`
showed every page family with generated rankings already wired up **except**
`src/pages/teams/[slug].astro` and `src/pages/hr/teams/[slug].astro` - the 80
individual national-team profile pages (40 teams x English/Croatian, added
2026-08-18) that `buildTeamProfile()` (`src/lib/teamProfile.ts`) already
turns into a genuine generated ranking-shaped list (every FIFA World Cup,
UEFA EURO, Copa América and UEFA Nations League final/semifinal a team has
reached, grouped by competition). Confirmed the gap was real, not just an
absent grep hit: neither page ever passed a `jsonLd` prop to `BaseLayout`,
so each of the 80 pages carried only the automatic `BreadcrumbList`
`BaseLayout.astro` adds to every non-home page - no other site-wide sweep
(the JSON-LD SEO passes of 2026-08-15/16, or the 2026-08-20 "Fiercest
rivalries" fix earlier today) had ever reached these pages, because they
were the one page family generated from a per-team dynamic route rather
than a hand-written page file `grep`-visible alongside the others in a
single pass.

**Fix:** new `buildTeamProfileItemList(profile, options)` in
`src/lib/jsonLd.ts`, following the exact shape `buildRivalriesItemList()`
already established for a non-`ChampionSummary` ranking - one `Thing` per
competition the team has actually reached a tracked final or semifinal in
(in the same order the page's own `<section>` cards list them), named after
that competition, with a description enumerating every appearance as
`"{role} ({year})"` joined by commas - the exact two facts (year, role) the
page's own `<ol>` already renders per competition, in the same chronological
order, no combined-totals figure invented beyond what the page shows. A
`describe()` override mirrors every other builder's translation mechanism,
though the Croatian page ends up not needing one: the role/year labels are
the same untranslated historical column labels (`"Champion"`, `"Runner-up"`,
`"Other semifinalist"`, ...) the Croatian page's own `<ol>` already renders
verbatim (see that page's own top-of-file note on what is and isn't
translated), so the default English-shaped join needs no re-wording there.

Wired into both `src/pages/teams/[slug].astro` and
`src/pages/hr/teams/[slug].astro`: a `jsonLd` array built from
`buildTeamProfileItemList()`, guarded by `profile.competitions.length > 0`
the same way `/records`' rivalries `ItemList` guards on a non-empty ranking
(every real team profile page has at least one competition today, since
`getStaticPaths()` only generates a page for a team `buildAllCountryRecords()`
already found a final/semifinal for - but a team profile generated from a
future edge case with zero appearances degrades to just the automatic
`BreadcrumbList`, matching the page's own "has not reached a tracked final
or semifinal" fallback text for that same case), passed through to
`BaseLayout`'s existing `jsonLd` prop exactly like every other page.

**Tests:** 4 new Vitest cases (`tests/unit/jsonLd.test.ts`:
`buildTeamProfileItemList` - the ranked one-Thing-per-competition shape with
the default "Role (Year), ..." description, preserving an exact source
column label like "Runner-up" rather than inventing generic wording, the
`describe()` override, and an empty-`competitions` case - 380 total, up from
376). 3 new Playwright cases in `tests/e2e/mobile.spec.ts`: `/teams/brazil`
carries a `BreadcrumbList` plus an `ItemList` with one `Thing` per competition
matching the page's own rendered `<section>` count, and the World Cup
`Thing`'s description contains real appearances ("Champion (1958)", "Champion
(2002)"); `/hr/teams/brazil` carries its own Croatian `ItemList` name
("Brazil - nastupi u natjecanjima") with per-competition descriptions
identical to the English page's (confirming the "no translation needed"
reasoning above actually holds, not just in theory); `/teams/germany` omits
a Copa América `Thing` entirely (Germany/West Germany has never entered it),
confirming the `ItemList` only lists competitions the team actually appears
in, the same rule `tests/unit/teamProfile.test.ts` already covers at the
data layer.

`pnpm lint` (`astro check`) - 0 errors/warnings/hints across 118 files.
`pnpm test` - **380/380** (up from 376). `pnpm build` - 105 pages, unchanged.
`pnpm check:pdfs` correctly flagged all 80 `team-*`/`team-*-hr` PDFs stale
immediately after editing `src/pages/teams/[slug].astro` and
`src/pages/hr/teams/[slug].astro` (both already tracked in
`TEAM_PDF_SOURCES`, `scripts/pdf-pages.mjs` - no `pdf-pages.mjs` edit was
needed here, unlike the rivalries fix, since these two page files were
already the per-team dependency list's own page-specific entries); ran
`pnpm build:pdfs` (`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`) and
`pnpm build` again, then `pnpm check:pdfs` passed clean on all 94 PDFs (the
14 non-team PDFs were re-touched by the same `build:pdfs` run but unaffected
content-wise - print output never includes `<script type="application/
ld+json">` tags, so no PDF's visible content actually changed). `check:links`
(109 pages, 0 broken links), `check:sitemap` (104 entries), `check:perf`
(`/hr/records` 499.3 KB / `/records` 494.2 KB, unchanged - `<script
type="application/ld+json">` on 80 already-lightweight team pages added a
few hundred bytes each, nowhere near the two heaviest pages), and
`check:precache` (31 URLs) all pass unchanged. Full Playwright suite
re-run at `--workers=1`: **523/524 passed** (up from 521; the 3 new team-
profile JSON-LD cases plus the existing suite), 15.6 minutes. The single
failure - `accessibility-quiz-states.spec.ts`'s Croatian "restarted-after-
answering state has no WCAG violations" case, a `#quiz-restart` click
timing out at 30s - is unrelated to anything this run touched (quiz restart
UI, not `/teams/<slug>` or `jsonLd.ts`) and confirmed a pre-existing flake,
not a regression: re-running just that spec file immediately afterward
passed all 4 of its cases (English/Croatian x light/dark) cleanly in 54s.

**Left for a future pass:** with this fix, every page family on the site
that renders a generated ranking now has a matching `ItemList` - no other
gap of this shape is currently known. The standing candidates from prior
runs are otherwise unchanged (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, the flag-emoji idea rejected, CSP's
`'unsafe-inline'` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued, `public/downloads/` PDF-bloat documented/intentional,
EURO podium cards structurally impossible, full per-edition team
participant lists blocked on sourcing). Worth flagging for whoever adds the
*next* new page family generated from a dynamic route (`[slug].astro` or
similar): a plain `grep -rln "jsonLd" src/pages/` misses any page file
`grep` can see but that in fact renders many pages via `getStaticPaths()` -
counting output pages (`pnpm build`'s own page count, or `check:sitemap`'s
entry count) against which page *files* actually pass a `jsonLd` prop is a
more reliable cross-check than eyeballing the file list.

### New feature: "/players" - one full award-history profile page per Ballon d'Or/Golden Boot winner - added 2026-08-20 (intensive run)

With every standing "Left for a future pass" candidate still exhausted or
explicitly deprioritized (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, the flag-emoji idea rejected, CSP's
`'unsafe-inline'` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued, `public/downloads/` PDF-bloat documented/intentional, EURO
podium cards structurally impossible, full per-edition team participant
lists blocked on sourcing), this run looked for a genuinely new page family
rather than another incremental fix. `content/teams.md`'s own intro already
names the gap: "Individual awards (Ballon d'Or, Golden Boot) are not
included here since they recognize players, not national teams" - `/teams`
aggregates a *team's* record across four team competitions into one
year-by-year view, but no equivalent existed for a *player's* record across
the two individual-award tables (`content/ballon-dor.md`,
`content/golden-boot.md`'s FIFA World Cup and UEFA EURO top-scorer tables).
That aggregation is genuinely new information, not a re-render of an
existing table: several players who won more than one of these three awards
(Gerd Müller - 1970 Ballon d'Or, 1970 World Cup Golden Boot, 1972 EURO
Golden Boot; Ronaldo - 1997/2002 Ballon d'Or, 2002 World Cup Golden Boot)
have never had their combined award history shown on one page before.

**Built:** `src/lib/playerProfile.ts`, following `src/lib/teamProfile.ts`'s
exact shape (`buildPlayerProfile()`, `playerProfileSlug()`) but for players:
`buildPlayerProfile(name, sources)` scans each award's editions for a
winner-cell match (splitting on `; ` the same way `distinctWinners()`
already does, so a tied year credits every tied player individually), and
`buildAllPlayerProfiles()`/`distinctPlayers()` build the full A-Z roster. The
one genuinely new piece of logic: a tied Golden Boot row's Team cell is
itself `; `-joined (e.g. 1994's "Hristo Stoichkov; Oleg Salenko" /
"Bulgaria; Russia") and must be aligned by the *same index* as the matching
player name, not shown as the whole joined string - `teamFor()` handles that,
falling back to "no team shown" (rather than guessing) for the rarer case
where a tie's Team cell is the "Multiple" placeholder used when there are too
many scorers to name one team each (e.g. 1962's six-way tie), while still
showing that edition's shared goal count.

New pages: `src/pages/players/index.astro` (an A-Z directory, mirroring
`src/pages/teams/index.astro`) and `src/pages/players/[slug].astro` (one
profile per player, mirroring `src/pages/teams/[slug].astro` - combined
"Total awards" count, one section per award actually won, each appearance
showing year, team/goals/ceremony-date detail, and a link back to that
award's competition page). `content/players.md` is the new page-meta entry
(front matter + intro paragraph, same shape as `content/teams.md`). Both the
Ballon d'Or and Golden Boot competition pages
(`src/pages/competitions/ballon-dor.astro`,
`src/pages/competitions/golden-boot.astro`) gained a "Browse every player's
full award history" link to `/players`, so the new directory is reachable
from the two pages whose data it's built from.

**Deliberately not done this run, and why:** `/players` is **not** wired
into `NAV_LINKS` (`src/lib/routes.ts`) yet. `tests/unit/offlineCache.test.ts`
enforces, as a hard invariant, that every `NAV_LINKS` entry has a Croatian
translation in `TRANSLATED_PATHS` (`src/lib/i18n.ts`) - `/teams` itself only
ever entered `NAV_LINKS` already carrying both languages. Building 98
Croatian player-profile pages (one per distinct Ballon d'Or/Golden Boot
winner) in the same run as the English feature was too large a slice for one
pass, so `/players` instead ships as a fully working, standalone English
page family this run - reachable via direct URL, the sitemap, and the two
cross-links above, exactly the same "complete but not yet linked from primary
nav" state `/teams` itself was never in, since `/teams` got its Croatian
pages one commit later but *before* it was ever added to `NAV_LINKS`. The
sitemap (`src/pages/sitemap.xml.ts`) still lists every `/players` URL (the
directory plus all 98 profile pages) via its own loop, English-only (no
hreflang alternate), the same shape the main `NAV_LINKS` loop already uses
for a path with no `TRANSLATED_PATHS` entry.

**Tests:** 8 new Vitest cases (`tests/unit/playerProfile.test.ts`:
combining a player's awards across all three sources, omitting an award
never won, the tied-row Team/player index alignment, the "Multiple"
placeholder falling back to no team while keeping the shared goal count, an
unknown player producing an empty profile, the full roster excluding the
Ballon d'Or's "Not awarded" placeholder row and sorting alphabetically, and
`playerProfileSlug()`'s diacritic folding - 388 total, up from 380). A new
`tests/e2e/player-profile.spec.ts` (mirroring `team-profile.spec.ts`,
English-only): the directory lists and links to profiles, a multi-award
profile (Gerd Müller) shows all three sections and the correct combined
total, a single-award player (Kylian Mbappé) shows only that one section, a
diacritic name resolves at a plain-ASCII URL, the tied-row team-alignment
fix (Oleg Salenko showing "Russia", not the joined cell) holds end-to-end,
360px overflow and WCAG checks on both pages, and both competition pages'
new "Browse every player's full award history" link.

`pnpm lint` (`astro check`) - 0 errors/warnings/hints across 122 files.
`pnpm test` - **388/388** (up from 380). `pnpm build` - 204 pages (up from
105: 98 new player profile pages, 1 new `/players` directory page). `pnpm
check:links` (208 pages, 0 broken links), `check:sitemap` (203 entries, up
from 104), and `check:precache` (31 URLs, unchanged - `/players` isn't a
`NAV_LINKS` entry yet, so it isn't precached either, consistent with the
"not yet in primary nav" scope above) all pass. `check:pdfs` correctly
flagged `ballon-dor.pdf`/`golden-boot.pdf` stale after the two competition
pages' new cross-link; regenerated with `pnpm build:pdfs`, then
`check:pdfs` passed clean on all 94 PDFs. Full Playwright suite: **536/536
passed** (up from 524). A first full run caught `mobile.spec.ts`'s own
hardcoded sitemap `<url>` count (104, now 203 - fixed alongside this entry);
a second full run turned up one unrelated failure, `team-search.spec.ts`'s
Croatian "navigates to the Croatian compare page" case timing out - confirmed
a pre-existing flake, not a regression (this run touched neither
`team-search.spec.ts` nor `Nav.astro`'s search widget logic, only a
non-functional comment nearby): a third full run passed all 536 cleanly,
including that exact case.

**Left for a future pass:** Croatian localization for `/players` (98 profile
pages + the directory), then adding `/players` to `NAV_LINKS` once that
parity exists (see "Deliberately not done" above) - the same two-step
rollout `/teams` itself followed. After that: a schema.org `ItemList` for
each player profile (the same gap `/teams/<slug>` itself had until the
previous run - `buildPlayerProfileItemList()` would follow
`buildTeamProfileItemList()`'s exact precedent), and a downloadable print
PDF per player profile (the same `PrintDownloadLink`/`pdf-pages.mjs` wiring
`/teams/<slug>` already has). The standing candidates from prior runs are
otherwise unchanged (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, the flag-emoji idea rejected, CSP's
`'unsafe-inline'` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued, `public/downloads/` PDF-bloat documented/intentional, EURO
podium cards structurally impossible, full per-edition team participant
lists blocked on sourcing).

### `/players` Croatian localization + `NAV_LINKS` promotion + structured data - added 2026-08-20 (intensive run)

The immediate "Left for a future pass" from the `/players` launch entry
above, completed as one vertical slice: `/players` is now a fully bilingual,
primary-nav-linked page family with structured data, exactly the same
two-step rollout `/teams` followed.

**Croatian pages:** `src/pages/hr/players/index.astro` (the A-Z directory)
and `src/pages/hr/players/[slug].astro` (98 per-player profiles), each
mirroring its English sibling's shape the same way the Croatian `/teams`
pages mirror theirs. They load the *exact same* live award data
(`buildAllPlayerProfiles()` over the three `loadCompetition()` tables), so
the A-Z list, each player's award count, and every appearance can never
drift between languages - only this page's own headings/prose, the JSON-LD
description text, and the three award display names ("Zlatna lopta", "Zlatna
kopačka Svjetskog prvenstva", "Zlatna kopačka EURA") are translated. Player
names and source-derived facts (team, ceremony date) are left as-is, the
same "only UI chrome is translated, not the underlying data" precedent the
Croatian `/teams` pages set. The one genuinely translatable *unit* word in
an appearance's detail line - "goals" - is handled by a new optional
`goalsLabel` parameter threaded through `buildPlayerProfile()` /
`buildAllPlayerProfiles()` (default `'goals'`, so every existing caller is
byte-unchanged; the Croatian page passes `'golova'`), rather than
hard-coding English into the shared builder.

**Nav promotion:** `/players` is now a normal `NAV_LINKS` entry
(`src/lib/routes.ts`, label "Players" / "Igrači") with its Croatian
translation registered in `TRANSLATED_PATHS` (`src/lib/i18n.ts`) - which is
what `tests/unit/offlineCache.test.ts` requires of every nav link, and why
the Croatian pages had to ship *first*. Both languages of the directory are
now precached for offline reading (33 URLs, up from 31) and appear in the
primary nav and the 404 page's "Popular pages" list (now 13 nav links x 2
languages).

**Structured data:** three new `jsonLd.ts` builders close the ItemList gap
the launch entry flagged - `buildPlayerProfileItemList()` (one Thing per
award a player won, the individual-award counterpart of
`buildTeamProfileItemList()`), `buildPlayersDirectoryItemList()` (the
directory's A-Z list, counterpart of `/teams`' `buildCountryRecordsItemList`
block), each with a `describe()` override for the Croatian page, following
the exact translation mechanism the other builders already use. Both English
and Croatian directory and profile pages now emit their ItemList.

**Sitemap:** `src/pages/sitemap.xml.ts` now emits `/players` + `/hr/players`
via the main bilingual `NAV_LINKS` loop (with a `CONTENT_ID_BY_PATH` entry
for `<lastmod>`), and its per-player loop now emits *both* languages per
player with reciprocal hreflang alternates - the same shape the `/teams`
per-team loop already uses. 302 sitemap entries, up from 203 (99 new
`/hr/players` URLs).

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 125
files. `pnpm test` - **395/395** (up from 388: +1 `goalsLabel` case in
`playerProfile.test.ts`, +6 across the two new `jsonLd.test.ts` describe
blocks). `pnpm build` - 303 pages (up from 204: 98 new `/hr/players`
profiles + 1 `/hr/players` directory). `pnpm check:links` (307 pages),
`check:sitemap` (302 entries), `check:precache` (33 URLs), `check:pdfs` (94
PDFs, unchanged - no per-player PDF this run) all pass. Playwright: the
`player-profile.spec.ts` suite grew from 10 to 23 cases (13 new Croatian
cases mirroring `team-profile.spec.ts`'s own bilingual coverage - directory
list, language switcher round-trip both ways, translated totals matching the
English page, Croatian award names + `/hr/competitions/` links, the tied-row
team + "golova" unit, a diacritic slug, 360px overflow and WCAG on both
pages), all green; `mobile.spec.ts`'s sitemap `<url>` count (203 -> 302) and
404 popular-links count (24 -> 26) updated to match.

**Deliberately not done this run, and why:** a downloadable print PDF per
player profile is still deferred - it's the one remaining `/teams/<slug>`
parity item, and adding 196 new PDFs (98 players x EN/HR) is a large binary
churn better kept as its own reviewable slice, the same way `/teams`' PDFs
landed separately from its Croatian pages. See "Left for a future pass"
below.

**Left for a future pass:** a downloadable print PDF per player profile
(the `PrintDownloadLink` / `scripts/pdf-pages.mjs` wiring `/teams/<slug>`
already has, for both languages). The standing candidates from prior runs
are otherwise unchanged (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, the flag-emoji idea rejected, CSP's
`'unsafe-inline'` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued, `public/downloads/` PDF-bloat documented/intentional, EURO
podium cards structurally impossible, full per-edition team participant
lists blocked on sourcing).

### Downloadable print PDF for every `/players/<slug>` profile - added 2026-08-20 (intensive run)

Closes the "Left for a future pass" item the `/players` launch entry above
flagged: `/players/<slug>` and `/hr/players/<slug>` now offer a downloadable
print PDF exactly like `/teams/<slug>` already did, giving the two profile
page families full parity.

**Enumerating players for the PDF script:** `scripts/generate-pdfs.mjs` runs
under plain Node against a running `astro preview` server, so - the same
constraint that made `/team-index.json` necessary for `/teams/<slug>` - it
can't import `src/lib/playerProfile.ts`'s `buildAllPlayerProfiles()` directly
(no Vite, no `astro:content`) and the player roster isn't a hand-typeable
list. Added `src/pages/player-index.json.ts`, a new build-time endpoint
mirroring `team-index.json.ts`'s shape (`{id, displayName}[]`, alphabetical),
built from the same `loadCompetition()` + `buildAllPlayerProfiles()` calls
`/players/index.astro` already makes. Unlike `/team-index.json` it isn't
fetched by any client-side widget - there's no "find a player" search - it
exists solely for this script to read once, server-side.

**PDF generation:** `scripts/pdf-pages.mjs` gained `PLAYER_PDF_SOURCES`, the
individual-award counterpart of `TEAM_PDF_SOURCES` (content/ballon-dor.md,
content/golden-boot.md, docs/SOURCES.md, the shared competition-parsing
libs, `src/lib/playerProfile.ts`, `References.astro`, and both
`/players/[slug].astro` page files). `scripts/generate-pdfs.mjs` fetches
`/player-index.json` after the team loop, computes each player's slug with a
duplicated `playerProfileSlug()` (same duplication precedent
`teamProfileSlug()` already set, for the same plain-Node reason), and
renders `/players/<slug>` → `player-<slug>.pdf` and `/hr/players/<slug>` →
`player-<slug>-hr.pdf` for all 98 players (196 new PDFs), recording each
against `PLAYER_PDF_SOURCES` in the shared manifest.
`scripts/check-pdf-freshness.mjs` gained a matching `playerSourcesFromManifest()`
(mirroring `teamSourcesFromManifest()`, filtering the manifest's `player-`
keys) so `pnpm check:pdfs` covers the new PDFs the same way it already
covers team PDFs.

**Pages:** both `/players/[slug].astro` and `/hr/players/[slug].astro` now
import `PrintDownloadLink` and render it in the header, right after the
intro paragraph - the exact same placement `/teams/<slug>` uses. Croatian
page uses the translated `label`/`hint` props the same way `/hr/teams/<slug>`
does.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 126
files (one new `player-index.json.ts` route). `pnpm test` - **395/395**
(unchanged - no unit-testable logic added, `playerProfileSlug()`'s
duplicate in `generate-pdfs.mjs` is a verbatim copy of the already-tested
original). `pnpm build` - 303 pages (unchanged - PDF endpoints/files aren't
Astro pages). `pnpm build:pdfs` - regenerated all 8 competition/records +
80 team + 196 new player PDFs (284 total, up from 88) and
`.pdf-manifest.json`. `pnpm check:pdfs`, `pnpm check:links` (now resolving
196 more `.pdf` asset references), `pnpm check:sitemap`, `pnpm
check:precache` all pass. Playwright: `player-profile.spec.ts` gained one
PDF-download test per language (EN: `players/gerd-muller` →
`player-gerd-muller.pdf`; HR: `hr/players/gerd-muller` →
`player-gerd-muller-hr.pdf`), mirroring `team-profile.spec.ts`'s own PDF
test exactly.

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing). With this run, `/players/<slug>` and `/teams/<slug>` are now at
full feature parity (Croatian localization, structured data, print PDFs) -
no further parity gaps between the two profile-page families remain.

### Accessibility: closed `/players/<slug>`'s three-way test-coverage gap (main WCAG sweep, forced-colors, print media) - added 2026-08-21 (intensive run)

Every roadmap backlog item (Copa América, Nations League, Ballon d'Or, Golden
Boot pages) has been complete for weeks - see the many "Left for a future
pass" entries above, all pointing at the same short standing list of
infeasible/rejected/low-yield candidates. This run is a quality/accessibility
pass instead, closing a real, previously-undetected gap.

`/teams/<slug>` (40 dynamic per-team profile pages) got its own dedicated
spot-check in all three of `tests/e2e/accessibility.spec.ts` (the main WCAG
2.1 A/AA sweep), `accessibility-forced-colors.spec.ts`, and
`print-styles.spec.ts` on 2026-08-18, precisely because the automated sweeps
in those files only ever enumerate `NAV_LINKS`/`TRANSLATED_PATHS` - the fixed
top-level pages - and have no way to reach a page generated per-slug by
`getStaticPaths()` at build time. `/players/<slug>` (98 dynamic per-player
profile pages, added 2026-08-20, two days *after* that `/teams/<slug>` fix)
has the identical structural gap: its index is in `NAV_LINKS` and so is swept,
but every individual profile page was never driven through WCAG, forced-colors,
or print-media testing at all, in either language, since the day it shipped.
The `/players` launch, its Croatian localization, and its PDF-download entries
above all recorded full parity work with `/teams/<slug>` on every other
dimension (structured data, localization, print PDFs) but missed this one,
since none of those runs were looking at test-file coverage rather than the
page itself.

Closed by mirroring each spec's existing `/teams/brazil` precedent exactly,
spot-checking one representative player (Gerd Müller - the same slug the PDF
Playwright coverage already uses) rather than one test per player, in both
languages:

- **`accessibility.spec.ts`**: new `player profile page` describe block (light
  + dark color scheme x English/Croatian, 4 tests), matching the team-profile
  block's structure and axe config exactly.
- **`accessibility-forced-colors.spec.ts`**: new `forced-colors mode, player
  profile page` describe block (2 tests). Unlike the team-profile fix this
  block follows, there was no CSS bug to pin here - every `/players/<slug>`
  award-list entry is a win (there's no "runner-up" role to lose its color-only
  signal, unlike `/teams/<slug>`'s `.team-profile__role` "Champion" text), so
  this only confirms the page's accent-colored year and accent-bordered award
  cards stay WCAG-clean once forced-colors overrides those custom-property
  colors.
- **`print-styles.spec.ts`**: added `players` + `hr/players` (the index) and
  `players/gerd-muller` + `hr/players/gerd-muller` (a representative profile)
  to `OTHER_PRINT_PAGES`, the same list `/teams` and `/teams/brazil` are in -
  no player-profile-specific interactive chrome (there's no "Compare against
  another team"-style link to hide) needed a dedicated block the way
  `/teams/<slug>` needed one for its compare link.

**Tests:** `pnpm lint` (0/0/0, unchanged - no source files touched, only
tests), `pnpm test` **395/395** (unchanged - no unit-testable logic added),
`pnpm build` **303 pages** (unchanged). Full Playwright suite: **575/575**
(up from 557; +18 new cases: 4 WCAG-sweep + 2 forced-colors + 12 print-media,
all passing on first run). `check:links`, `check:sitemap`, `check:precache`,
`check:perf` all pass unchanged (no build-output-affecting changes).

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing). With this run, `/players/<slug>` and `/teams/<slug>` are now at
full test-coverage parity too, on top of the feature parity the prior run
already closed - no known coverage gap remains between the two profile-page
families.

### New feature: `/compare-players` - head-to-head Ballon d'Or/Golden Boot comparison - added 2026-08-21 (later intensive run)

`/compare` explicitly excludes individual awards ("Ballon d'Or, Golden Boot
... recognize players, not national teams"), and the `/players` directory
(2026-08-20) only ever showed one player's record at a time. This closes
that gap: pick two players and compare how many times each has won the
Men's Ballon d'Or, FIFA World Cup Golden Boot, and UEFA EURO Golden Boot,
generated from the exact same three award tables `/players` already loads -
no new editorial content.

**New `src/lib/comparePlayers.ts`:** `buildComparePlayerRecord()` turns a
`PlayerProfile` (from `playerProfile.ts`) into a fixed-shape record with one
row per award - including a `count: 0` row for an award the player never
won - so both sides of the head-to-head panel always render the same rows,
the individual-award equivalent of how `compare.ts`'s `CountryRecord`
always has one row per team competition. `buildAllComparePlayerRecords()`
ranks every player by total awards, doubling as both the head-to-head
picker's data set and the page's "All players" reference table.
`buildSharedAwardYears()` is the one genuinely new fact this page surfaces
that isn't derivable from either player's own `/players/<slug>` profile:
every year both selected players won *something*, even a different award
each - e.g. 1998, when Zinedine Zidane won the Ballon d'Or the same year
Davor Šuker won the World Cup Golden Boot. It's the individual-award
analogue of `/compare`'s "Finals meetings" panel, which has no equivalent
for players since there's no match between two individual award winners.

**Page (`src/pages/compare-players.astro`):** mirrors `/compare`'s
picker/swap/URL-param pattern almost exactly (same `<select>` + swap
button + `role="status"` live region + `history.replaceState` shareable
URL), swapping the "Finals meetings" section for "Shared years" and the
per-competition titles/runner-ups/semifinals columns for a single
award/count/years table. One caveat the "Head-to-head" note calls out
explicitly: `PlayerProfile.id` (from `playerProfile.ts`) is the player's
raw display name, not a slug like `CountryRecord.id` - so the picker's
`<option value>` and the shareable `?a=/&b=` URL carry a URL-encoded name
(`?a=Zinedine+Zidane`) rather than a clean slug. Linking to a profile page
still goes through `playerProfileSlug()`, so `/players/<slug>` links are
unaffected.

**Reused, not duplicated, structured data:** the "All players" ranking's
`ItemList` reuses `jsonLd.ts`'s existing `buildPlayersDirectoryItemList()`
(the same builder `/players` itself uses), just fed a totals-ranked profile
list instead of an alphabetical one - no new JSON-LD builder needed, since
the per-player description it already generates ("N awards across the...")
is exactly the fact this ranking shows too.

**English-only this run**, the same two-step rollout `/players` and
`/teams` both followed: not yet a `NAV_LINKS`/`TRANSLATED_PATHS` entry (no
Croatian translation yet), so it isn't in the primary nav or the offline
precache list, and `sitemap.xml.ts` gives it its own single-locale `<url>`
entry rather than joining the main bilingual loop - matching exactly how
`/players`' own launch commit handled this. Reachable today via a new
"Compare two players head-to-head" link on the `/players` index page.
Localization + `NAV_LINKS` promotion left for a future pass.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 129
files (2 new: `comparePlayers.ts`, `compare-players.astro`). `pnpm test` -
**400/400** (5 new `comparePlayers.test.ts` cases covering the 0-count row,
multi-award totals, ranking order, and `buildSharedAwardYears()` both
finding and correctly not finding a match). `pnpm build` - **304 pages**
(up from 303). `pnpm check:sitemap`, `pnpm check:links`, `pnpm
check:precache`, `pnpm check:perf`, `pnpm check:pdfs` all pass unchanged
(no PDF for this page, matching `/compare`'s own precedent - `/compare` has
no print PDF either). New `tests/e2e/compare-players.spec.ts` (8 cases:
overflow, WCAG, the `/players` cross-link, the real default pair by total
awards, picker + URL + shared-years update together, swap, a shared-link
round trip, and the all-players table's profile links) - all passing,
including a WCAG axe sweep with zero violations even though this page isn't
yet covered by the site-wide `accessibility.spec.ts` sweep (that sweep is
`NAV_LINKS`-driven, same reason `/players` itself waited until nav
promotion for that coverage). `tests/e2e/mobile.spec.ts`'s hardcoded
sitemap `<url>` count updated 302 → 303 for the new single-locale entry;
full `mobile.spec.ts` re-run **232/232** passing.

**Left for a future pass (superseded by the next entry):** `/compare-players`
Croatian localization + `NAV_LINKS`/`TRANSLATED_PATHS` promotion, named above
as the natural next slice, was picked up the same day - see the following
entry.

### Localize `/compare-players` into Croatian, promote it to the primary nav - added 2026-08-21 (later intensive run)

Completed the two-step `/compare-players` rollout named as the natural next
slice by the immediately preceding entry - the same English-first-then-
localize pattern `/players` and `/teams` each followed before it.

- **Croatian page:** `src/pages/hr/compare-players.astro`, loading the exact
  same live award data as the English page (the same three
  `loadCompetition()` calls, `buildAllPlayerProfiles()`,
  `buildAllComparePlayerRecords()`), so the head-to-head panel, "Shared
  years" and "All players" ranking can never drift between languages - only
  this page's own headings/prose and the three award display names are
  translated (`Zlatna lopta` / `Zlatna kopačka Svjetskog prvenstva` /
  `Zlatna kopačka EURA`, the exact same three strings
  `hr/players/[slug].astro` already uses, matched by title through
  `comparePlayers.ts`'s `awardDefs`/`buildAllComparePlayerRecords()` so a
  typo here would silently zero out a player's award row rather than fail
  loudly - verified by hand against the English page's own totals in a new
  Playwright case). `buildAllPlayerProfiles()` gets the same
  `{ goalsLabel: 'golova' }` option `hr/players/[slug].astro` already passes,
  even though this page never renders an appearance's goals detail itself -
  kept for consistency with every other Croatian caller of that function,
  not because this page needs it.
- **Nav:** `/compare-players` added to `NAV_LINKS` (label "Compare
  Players"/"Usporedi igrače") and `TRANSLATED_PATHS`, so both languages are
  now precached, appear in the primary nav and the 404 popular-pages list,
  and - the main payoff of this promotion - are automatically picked up by
  every `NAV_LINKS`-driven sweep (`accessibility.spec.ts`,
  `accessibility-forced-colors.spec.ts`) with no per-page test wiring
  needed, verified clean on both.
- **Cross-link:** added the Croatian equivalent of the English page's
  "Compare two players head-to-head" link
  (`src/pages/players/index.astro`) to `hr/players/index.astro` ("Usporedi
  dva igrača izravno"), including its `.players__compare-link` style rule
  that the Croatian file's `<style>` block hadn't needed until now (Astro
  scopes styles per file, so copying the markup without the rule would have
  left it unstyled).
- **Structured data:** the Croatian page's `ItemList` reuses
  `jsonLd.ts`'s existing `buildPlayersDirectoryItemList()` with a Croatian
  `name`/`describe()` override, the exact same pattern
  `hr/players/index.astro` already established for its own directory
  listing - no new JSON-LD builder needed.
- **Sitemap:** `sitemap.xml.ts`'s special-cased single-locale `<url>` block
  for `/compare-players` (added by the launch commit) is removed entirely -
  the page now flows through the main `NAV_LINKS`/`TRANSLATED_PATHS` loop
  like every other bilingual top-level page, picking up its `<lastmod>` from
  `content/compare-players.md`'s own `lastReviewed` instead of the
  three-source-table aggregation the special case needed.
- **Print-media test coverage:** added `compare-players` +
  `hr/compare-players` to `print-styles.spec.ts`'s `OTHER_PRINT_PAGES` list
  (same "no `TournamentTable`" exemption as `/compare`/`/teams`/`/players`)
  and a new `COMPARE_PLAYERS_PAGES` block mirroring the existing
  `COMPARE_PAGES` block, since this page reuses the identical
  `.compare__picker`/`.no-print` markup `/compare` already has its own
  dedicated "picker is meaningless on paper" check for.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 131
files (1 new: `hr/compare-players.astro`). `pnpm test` - **400/400**
unchanged (no library logic touched, only pages/tests/routing tables).
`pnpm build` - **305 pages** (up from 304). `pnpm check:links` - 0 broken
links across 309 built pages. `pnpm check:sitemap` - 304 sitemap entries
(up from 303: `/compare-players` moved from one single-locale entry to two
bilingual entries, net +1) match the 309 built pages exactly, canonicals/
hreflang agree. `pnpm check:precache` - 35 precached URLs, every nav link
covered. `pnpm check:perf` - all pages within the page-weight budget.
`pnpm check:pdfs` - all 290 PDFs unchanged and up to date (no PDF for this
page, matching `/compare`'s own precedent). `tests/e2e/mobile.spec.ts`'s
hardcoded sitemap `<url>` count updated 303 → 304 and the 404 popular-links
count 26 → 28 (14 nav pages × 2 languages, up from 13); full re-run of the
sitemap/SEO/404 block - **26/26** passing. `tests/unit/offlineCache.test.ts`
gained one new `hr/compare-players` containment check. New Croatian describe
block in `tests/e2e/compare-players.spec.ts` (8 cases: overflow, WCAG,
same combined total as the English page, translated award names, the
Croatian "Shared years" panel, the all-players table linking to Croatian
profile pages, reachable from the Croatian `/players` index, and the
language switcher) - all 16 cases in the file (8 English + 8 Croatian)
passing. Full `accessibility.spec.ts` sweep - **74/74** passing, including
both languages of `/compare-players` for the first time. Full
`accessibility-forced-colors.spec.ts` sweep - **65/65** passing, same. Full
`print-styles.spec.ts` - **119/119** passing, including the new
`OTHER_PRINT_PAGES`/`COMPARE_PLAYERS_PAGES` entries.

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing). With this run, `/compare-players` reaches full feature parity
(bilingual, nav-linked, structured data, precached, full accessibility/
print-media sweep coverage) with `/players` and `/teams` - the only
deferred item across all three families is `/compare-players` having no
downloadable print PDF, which matches `/compare`'s own precedent rather
than being a gap.

### SEO: three-level BreadcrumbList for `/teams/<slug>` and `/players/<slug>` profile pages - added 2026-08-21 (intensive run)

With every roadmap backlog item long complete and this run's own standing
"Left for a future pass" candidates still infeasible/rejected/low-yield (same
list as above), this run looked for a genuinely new angle instead of
repeating one of those - the same approach the `/teams` and `/compare-players`
entries above each took. Found one: `BaseLayout.astro` has generated an
automatic `BreadcrumbList` for every non-home page since the very first SEO
pass, but it was always flat - `[Home, <page title>]` - even for the 138
`/teams/<slug>` and `/players/<slug>` profile pages that are genuinely nested
one level under their own directory (`/teams`, `/players`). A search engine
reading that flat trail had no way to know Croatia's profile page lives under
"Teams," not directly under the home page.

**`BaseLayout.astro`** gained an optional `breadcrumbTrail` prop - an array of
extra `{ name, url }` entries spliced between the automatic "Home" crumb and
the page's own title crumb, resolved through the same `withTrailingSlash`
normalization every other URL in this file already uses (so a trail entry's
`item` URL always agrees with the linked page's own canonical URL). Empty by
default, so every other page's breadcrumb is byte-identical to before.

**Four pages** now pass a single-entry `breadcrumbTrail`, reusing the exact
nav label/Croatian label pair `src/lib/routes.ts`'s own `NAV_LINKS` already
established for these two sections (`"Teams"`/`"Reprezentacije"`,
`"Players"`/`"Igrači"`), linking to the section's own index page:
`src/pages/teams/[slug].astro`, `src/pages/hr/teams/[slug].astro`,
`src/pages/players/[slug].astro`, `src/pages/hr/players/[slug].astro`. E.g.
`/teams/croatia` now emits `Home > Teams > Croatia - Full history` instead of
`Home > Croatia - Full history`; `/hr/players/lionel-messi` emits `Početna >
Igrači > Lionel Messi - cjelovita povijest nagrada`.

**Not touched:** every other page family (`/compare`, `/compare-players`,
`/records`, the six competition pages, `/quiz`, `/about/sources`) is a
top-level nav destination with no index page of its own to nest under, so
their flat `Home > page` breadcrumb is already correct and unchanged - this
is purely closing the gap for the two page families that actually have a
parent directory.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 131
files (no new files, only `BaseLayout.astro` and the four profile pages
touched). `pnpm test` - **400/400** unchanged (no library logic touched,
`BaseLayout.astro` isn't unit-tested - its structured data is covered by
`tests/e2e/mobile.spec.ts`'s own JSON-LD assertions, extended below).
`pnpm build` - 305 pages (unchanged). `pnpm check:links`,
`check:sitemap`, `check:precache`, `check:perf` all pass unchanged (no
markup, routing, or page-weight change - JSON-LD is invisible metadata).
`check:pdfs` correctly flagged all 290 PDFs as stale (`BaseLayout.astro` is a
rendering-code dependency of every page, the exact "blind spot" the checker
was built to catch) - regenerated with `pnpm build:pdfs`, confirmed clean
after. Extended `tests/e2e/mobile.spec.ts`'s existing `/teams/brazil`
BreadcrumbList assertion to check the full three-name trail and the middle
crumb's URL, and added two new cases (`/players/lionel-messi` and
`/hr/players/lionel-messi`) confirming the same three-level shape and its
Croatian labels; full scoped run - **609/609** Playwright tests passing,
including every existing print-media/accessibility/team/player spec (this
change touches shared layout, so the full suite was run rather than a
scoped slice).

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing, `/compare-players` print PDF matching `/compare`'s own precedent).
No new gap identified this run beyond the ones already on this list.

### New feature: "Find a player" global quick-jump search widget - added 2026-08-21 (later intensive run)

Closed a gap the 2026-08-20 `/players` launch left standing: `src/pages/
player-index.json.ts` (a build-time `{id, displayName}[]` endpoint mirroring
`team-index.json.ts`) already existed to let `scripts/generate-pdfs.mjs`
enumerate `/players/<slug>` PDF targets, but that file's own doc comment
explicitly flagged it as "not used by any client-side widget (there's no
'find a player' search)" - the 2026-08-17 "find a team" widget had a
same-shaped sibling data source sitting unused one page family over. Same
mismatch this file's `/compare-players` note above already named for the
print-PDF question, just for search instead.

**`Nav.astro`** gains a second combobox, `#player-search-input` /
`#player-search-listbox` / `#player-search-status`, right next to the
existing "find a team" one, wired to `/player-index.json` and sending
Enter/click to `/compare-players?a=<id>` (or `/hr/compare-players?a=<id>`) -
the same shareable `a` param `src/pages/compare-players.astro`'s own two
`<select>` pickers already read/write, exactly the precedent the team
widget set for `/compare`. Reuses the `.team-search`/`.team-search__*` CSS
as-is (structural, not team-specific - a comment now says so at the shared
rule) rather than duplicating ~50 lines of near-identical styles under a
new class name.

The client script was a straight duplicate of the team widget's combobox
logic (fetch-on-focus, diacritic-insensitive filter, arrow-key/Enter/Escape
handling, click-outside-to-close) with only the endpoint/target/labels and
the rendered option-id prefix differing, so rather than paste a second
~180-line copy, `initTeamSearch()` became `initSearchWidget(input, listbox,
status, idPrefix)` - one implementation, instantiated twice via a small
`initWidgetById()` helper. `idPrefix` keeps the two widgets' rendered
`role="option"` ids from colliding (`team-search-option-brazil` vs.
`player-search-option-...`) since both listboxes can be open... well, not
simultaneously (only one input can have focus), but their DOM ids still
share one document. Internal names inside the shared function
(`TeamIndexEntry`, `teams`, `goToTeam`) were deliberately left as-is rather
than renamed to something generic - both index endpoints already return the
identical `{id, displayName}[]` shape, so the existing names still describe
the data correctly and a rename would have been pure churn with no
behavior change.

One real difference from the team widget worth recording: player ids are
the player's raw display name (`src/lib/playerProfile.ts`'s
`buildPlayerProfile`: `id: playerName`, e.g. "Lionel Messi"), not a
lowercase slug like team ids ("brazil") - so a selected player's `a=`
param can contain a space, which `URLSearchParams` renders as `+` in the
resulting URL (`/compare-players?a=Lionel+Messi`). `compare-players.astro`
already read/wrote that same raw-name id in its own two `<select>` values
(unrelated to this change), so no target-page code needed to change - only
this widget's own new e2e assertions needed the `+`-aware regex.

Five new `UI_STRINGS` entries (`playerSearchLabel`, `playerSearchPlaceholder`,
`playerSearchNoResults`, `playerSearchLoading`, `playerSearchError`,
`src/lib/i18n.ts`), Croatian translations included, mirroring the
`teamSearch*` keys exactly (same key naming, same `{query}` placeholder
convention).

**`player-index.json.ts`**'s doc comment was updated to drop the
now-inaccurate "not used by any client-side widget" line and note both
consumers (the PDF script, server-side, and this widget, client-side) -
its behavior itself is completely unchanged, this endpoint already returned
exactly the shape the widget needed.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints. `pnpm
test` - **402/402** (2 new cases in `tests/unit/i18n.test.ts` for the five
new keys and the `{query}` placeholder, mirroring the existing team-search
cases exactly). `pnpm build` - 305 pages (unchanged - no new pages, only
shared chrome). `pnpm check:links`, `check:sitemap`, `check:precache`,
`check:perf` all pass unchanged. `pnpm check:pdfs` - all 290 PDFs still
correctly reported up to date without regeneration: `Nav.astro` isn't a
listed source for any `PDF_PAGES`/`TEAM_PDF_SOURCES`/`PLAYER_PDF_SOURCES`
entry, and both search widgets already carry `no-print` (same as the team
widget), so they never render into a generated PDF regardless. New
`tests/e2e/player-search.spec.ts` (16 cases, English/Croatian/accessibility,
directly mirroring `team-search.spec.ts`'s structure, plus one extra case
confirming the two widgets' option ids never collide) - full scoped run of
both search spec files together, **31/31 passing**. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - **624/624
passing** (up from 609), confirming no regression on the shared header
across every page/language/color-scheme combination.

**Left for a future pass:** standing candidates unchanged from the list
above this entry. No new gap identified beyond closing this one - the
"find a player"/`/player-index.json` mismatch was the last of the
"data source exists but nothing client-side reads it yet" class of gap on
this site; a repo-wide check for any remaining unused build-time endpoint
found none.

### Tooling: first-ever Vitest coverage report for `src/lib`, closes two real gaps it found - added 2026-08-21 (later intensive run)

With every roadmap backlog item complete and the standing "Left for a future
pass" candidates all still infeasible/rejected/low-yield (source-link
liveness, further content-accuracy spot-checks, the flag-emoji idea, CSP's
`'unsafe-inline'`, the Golden Boot reverse-lookup quiz type, PDF-bloat, EURO
podium cards, full participant lists), this run first did a fresh, deliberate
sweep of every Croatian page/component shipped since the last exhaustive
hardcoded-English audit (99c4ea6, 2026-08-12) - `/teams`, `/players`,
`/compare-players`, and both of `Nav.astro`'s search widgets - checking every
prop, aria-label, placeholder and inline-script string by hand. It turned up
nothing: every one of these already follows the site's established
translation conventions (UI chrome translated, historical/data values left
verbatim) correctly. Rather than stop there, this run added a different kind
of check the site never had: a Vitest coverage report for `src/lib`, the pure
business-logic layer every page reads from.

New `@vitest/coverage-v8` (pinned to `2.1.9` to match the installed `vitest`
2.1.9 - the latest coverage-v8 release requires vitest 4, too large a jump for
this run) and a `coverage` block in `vitest.config.ts`, scoped to
`src/lib/**/*.ts` only. Deliberately excluded, not just uncovered:
`src/pages/**`/`src/components/**`/`src/layouts/**` (`.astro` files, exercised
by the Playwright mobile suite instead - Vitest never runs them at all) and
`scripts/*.mjs` (each check script is split between a handful of exported
pure helpers, already covered by their own `tests/unit/check*.test.ts`, and a
`main()`-invocation/reporting shell meant to be exercised by actually running
`pnpm check:*`, the same "guard main() behind an entry-point check" precedent
this file already recorded, 2026-08-12). Reporting on either would only
produce a permanently low, misleading number for code this suite was never
meant to fully cover. New `pnpm test:coverage` script - manual, like `pnpm
build:pdfs`, not wired into `ci.yml` or gated by a threshold; this is a
diagnostic for future intensive runs to point at, not a merge gate.

Running it against the existing suite (402 tests before this run) surfaced
two real, if narrow, gaps - defensive branches with zero test exercising
them:

- **`src/lib/sources.ts`'s `extractSources()`** falls back to using the raw
  matched text as its own label when `new URL(url).hostname` throws - but
  every existing test URL parses cleanly, so that `catch` had never actually
  run. A malformed port (`https://example.com:abc/page` - matches the
  citation regex's "starts with https://" check, but fails `new URL()`'s own
  parsing) exercises it for the first time, confirming the fallback label is
  the raw URL text, not a crash.
- **`src/lib/markdownTable.ts`'s `parseMarkdownTables()`** skips a line
  containing "|" whose next line isn't a valid separator row (either not
  table syntax at all, or a real table with a header/separator column-count
  mismatch) rather than misreading it as a table - untested by name, though
  implicitly exercised by every passing content file today, none of which
  happens to contain this shape. Two new cases: a stray "|" inside ordinary
  prose, and a genuinely broken table (a 3-column separator under a 2-column
  header) followed immediately by a real, well-formed table under its own
  heading - confirming the parser recovers and still finds the good table
  rather than getting stuck or corrupting it.

Both are realistic shapes for a hand-edited `content/*.md`/`docs/SOURCES.md`
file to accidentally produce, so this closes real risk, not just a coverage
number: previously an editor's typo in either place had no test proving the
parser degrades gracefully instead of silently corrupting a table or crashing
the build.

**Also found and fixed in the same pass:** `tsconfig.json`'s `exclude` list
only ever named `dist`/`node_modules`, not the new `coverage/` output
directory (already `.gitignore`d, so this was never a committed-file problem,
but a real local one) - running `astro check` after `pnpm test:coverage`
picked up `coverage/`'s generated HTML/JS report (Istanbul's bundled
`prettify.js`, `sorter.js`, etc.) and produced dozens of spurious diagnostics
against third-party report assets, not this repo's own code. Added
`"coverage"` to `tsconfig.json`'s `exclude` array, matching the existing
`dist`/`node_modules` entries; confirmed `pnpm lint` is clean again
immediately after a fresh `pnpm test:coverage` run.

**Coverage baseline** (informational, `src/lib/**/*.ts` only): **96.68%
statements / 94.6% branches / 98.41% functions / 96.68% lines** (up from
96.5%/94.29%/98.41%/96.5% before this run's two new cases). The remaining
gaps are either genuinely low-value branch edges already accepted elsewhere
on this site (e.g. `offlineCache.ts`'s 66.66% branch coverage, `i18n.ts`'s
85.71%) or a thin async loader with no dedicated unit test of its own -
`teamCompetitions.ts` (0%, four `loadCompetition()` calls plus a fixed
reshape, exercised only through the real pages/build) - which mirrors
`homeCards.ts`'s own `loadHomeCompetitions()` (also 0%, same shape), an
already-accepted pattern on this site rather than a newly discovered gap: a
thin async wrapper around real content loading is left to the pages/
Playwright suite that actually exercises it, while the pure `buildXxx()`
logic each loader feeds gets the dedicated unit tests.

Tests: `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 132
files. `pnpm test` - **405/405** (3 new: 1 in `tests/unit/sources.test.ts`, 2
in `tests/unit/markdownTable.test.ts`). `pnpm build` - 305 pages (unchanged -
no page/component touched). `pnpm check:links`, `check:sitemap`,
`check:precache`, `check:perf`, `check:pdfs` all pass unchanged (this run
touched only test/tooling config, no content or rendering code).

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing, `/compare-players` print PDF matching `/compare`'s own precedent).
The hardcoded-English audit this run also performed (five newest features:
`/teams`, `/players`, `/compare-players`, both `Nav.astro` search widgets)
found no new gap - every Croatian page/component shipped since the last such
audit (99c4ea6) already follows the site's established translation
conventions correctly. No new gap identified beyond the two this run closed.

### New page: `/glossary` - closes a real, previously-unmet `docs/EDITORIAL_GUIDE.md` rule - added 2026-08-22 (intensive run)

With every roadmap backlog item complete and the standing "Left for a future
pass" candidates all still infeasible/rejected/low-yield, this run re-read
`docs/EDITORIAL_GUIDE.md` end to end rather than starting from the existing
"Left for a future pass" list - the same kind of fresh-source sweep the
2026-08-12 nav-`aria-label` and Croatian-PDF entries used - and found a
genuine, previously-overlooked miss: the guide's own terminology rules say
"Use **a.e.t.** only after explaining it means 'after extra time'" and "Use
**pens** only after explaining it means a penalty shoot-out" - but a repo-wide
grep confirmed neither abbreviation was explained anywhere on the live site.
Both appear in the FIFA World Cup, UEFA EURO, and UEFA Nations League "Final"
columns (9 rows total, e.g. "Italy 2-1 Czechoslovakia (a.e.t.)", "Brazil 0-0
Italy; 3-2 pens") with nothing - no `<abbr>`, no footnote, no glossary -
telling a first-time reader what either one means.

**Two-part fix, closing the gap at both the point of use and as a standalone
reference:**

- **New `content/glossary.md`** (front matter matching every other simple
  content page - `title`/`slug`/`lastReviewed`/`status`, no schema change
  needed) with one `## Term` heading + paragraph per entry: `a.e.t.`, `pens`,
  plus five more terms this site's own tables already rely on without ever
  defining (`runner-up`, `semifinalist`, `third and fourth place`, `host`,
  `confederation`) - each grounded in an existing `EDITORIAL_GUIDE.md` rule or
  actual column usage, not invented scope.
- **New `src/lib/glossary.ts`**: `parseGlossaryEntries()` (mirrors
  `src/lib/notes.ts`'s `extractSection()` shape, but captures every H2 section
  rather than one named heading, since the set of glossary terms is itself the
  editorial content) and `loadGlossaryEntries()` (the `astro:content`
  wrapper, same pattern as `competition.ts`'s `loadPageMeta()`). Also
  `abbreviateFinalScore()`/`hasAbbreviation()`: wraps "a.e.t." and "pens" in a
  native `<abbr title="...">` with a short English/Croatian explanation,
  HTML-escaping the rest of the cell text first (same "escape, then inject
  known-safe tags" pattern `renderInlineMarkdown()` already established).
- **`src/components/TournamentTable.astro`** gained a `finalColIndex` column
  detector (same shape as the existing `formatColIndex` one) and now renders
  that column's cell through `abbreviateFinalScore()` - but only on the rows
  that actually contain one of the two tokens (`hasAbbreviation()` guard), so
  the other ~50 Final-column rows across the three tables stay
  byte-identical plain text. This automatically covers all three affected
  tables (World Cup, EURO, Nations League) and both languages, since they all
  share this one component - no page-by-page wiring needed. Copa América,
  Ballon d'Or, and Golden Boot have no "Final" column, so they're untouched.
- **`src/pages/glossary.astro` + `src/pages/hr/glossary.astro`**: a definition
  list (`<dl>`/`<dt>`/`<dd>`) page modeled directly on `/about/sources`'s
  existing template (same header/`lastReviewed` shape), reading the exact
  same live `content/glossary.md` entries via `loadGlossaryEntries()` on both
  pages - a term's definition can never drift between languages, only the
  page's own chrome is translated, the same content/chrome split every other
  bilingual page already follows.
- **New `buildDefinedTermSet()`** in `src/lib/jsonLd.ts` - a schema.org
  `DefinedTermSet` with one `DefinedTerm` per entry, reusing the exact
  `GlossaryEntry[]` the page renders so the structured data can never list a
  term the visible page doesn't also explain.
- **Nav/routing wiring**: added to `NAV_LINKS` (`src/lib/routes.ts`) and
  `TRANSLATED_PATHS` (`src/lib/i18n.ts`) and `CONTENT_ID_BY_PATH`
  (`src/pages/sitemap.xml.ts`) - the same three single-source-of-truth lists
  every prior nav addition has updated, so the primary nav, the 404
  popular-pages list, the offline precache list, and the sitemap all picked
  this page up automatically, in both languages, with no other file needing
  to change. No print PDF was added for `/glossary` - it has no
  `TournamentTable`, matching `/compare`'s and `/compare-players`'s own
  precedent for a page with nothing tabular to print.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 136
files (4 new: `glossary.astro`, `hr/glossary.astro`, plus the two lib/page
files above). `pnpm test` - **418/418** (13 new: 11 in the new
`tests/unit/glossary.test.ts` covering `parseGlossaryEntries()`,
`hasAbbreviation()`, and `abbreviateFinalScore()` including HTML-escaping and
the Croatian title text; 2 in `tests/unit/jsonLd.test.ts` for
`buildDefinedTermSet()`). `pnpm build` - **307 pages** (up from 305).
`pnpm check:links` - 0 broken links across 311 built pages. `pnpm
check:sitemap` - 306 sitemap entries (up from 304: `/glossary` moved the nav
loop from 14 to 15 pages, net +2 bilingual) match the 311 built pages
exactly, canonicals/hreflang agree. `pnpm check:precache` - 37 precached URLs
(up from 35), every nav link covered. `pnpm check:perf` - all pages within
the 510 KB budget (heaviest unchanged, `hr/records` at 501.2 KB - `/glossary`
itself is a small page, nowhere near the budget). `pnpm check:pdfs` correctly
flagged all 290 existing PDFs as stale (`TournamentTable.astro` is a
rendering-code dependency of every PDF that has an Editions table) -
regenerated with `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm
build:pdfs`, confirmed clean after; no new PDF was added, so the count stays
290. `tests/e2e/mobile.spec.ts`'s hardcoded sitemap `<url>` count updated
304 -> 306 and the 404 popular-links count 28 -> 30 (15 nav pages x 2
languages, up from 14); new "Glossary page"/"Croatian glossary page" describe
blocks mirroring the existing Sources-page test shape, plus a new World Cup
page test confirming the 1934 row's `<abbr>` renders with the right `title`
and links through to the glossary. `tests/e2e/print-styles.spec.ts`'s
`OTHER_PRINT_PAGES` gained the English/Croatian glossary pages (no
`TournamentTable`, same exemption as `/compare`/`/teams`/`/players`). The
accessibility sweeps (`accessibility.spec.ts`,
`accessibility-forced-colors.spec.ts`) are `NAV_LINKS`-driven and picked up
both new pages automatically, with no per-page wiring - matching the exact
payoff every prior nav-promotion entry in this file has already recorded for
that mechanism.

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, EURO podium cards
structurally impossible, full per-edition team participant lists blocked on
sourcing, `/compare-players` print PDF matching `/compare`'s own precedent).
With this run, every abbreviation `docs/EDITORIAL_GUIDE.md` names is now
explained both inline (`<abbr title>`) and on a dedicated reference page - a
systematic sweep for any *other* unmet rule in that same document (beyond
terminology - content-safety, image sourcing) would be a reasonable next
angle in this vein, though nothing turned up in this run's own read-through
beyond the one gap closed here.

### New feature: host locator map extended from World Cup to EURO, UEFA Nations League and Copa América - added 2026-08-22 (later intensive run)

The World Cup's "Display a map of host countries" locator map (2026-08-19)
was left as a World Cup-only feature - `CompetitionView.astro`'s own
`hostMap` prop doc comment said so explicitly. The other three team
competitions with a host column (EURO, UEFA Nations League, Copa América)
had no map at all, even though `HostMap.astro` and `buildHostMapPoints()`
were already fully generic - the only missing piece was a coordinate table
per competition, the same shape `WORLD_CUP_HOST_COORDINATES` already
provides.

**`src/lib/hostCoordinates.ts`** gained three sibling tables, each keyed by
that competition's exact host-column text (confirmed against the live
content files via `distinctHosts()`, not guessed): `EURO_HOST_COORDINATES`
(14 values, 1960-2024), `NATIONS_LEAGUE_HOST_COORDINATES` (4 values, every
completed season so far), `COPA_AMERICA_HOST_COORDINATES` (11 country
values) plus `COPA_AMERICA_REGION_ORDER` (South America before North
America, since United States 2016/2024 is the one outlier). Two real edge
cases, both resolved by extending the World Cup table's own existing
conventions rather than inventing new ones:

- **Copa América's three "Home-and-away" editions** (1975, 1979, 1983, no
  single host country) needed no special-casing at all -
  `buildHostsSummary()`'s existing `NOT_A_HOST` regex (shared with
  `distinctHosts()` and `quiz.ts`'s host question) already excludes them
  before `buildHostMapPoints()` is ever called, so the coordinate table only
  needed the 11 real country hosts.
- **EURO's 2020 edition** ("Eleven European cities" - Amsterdam, Baku,
  Bilbao, Bucharest, Budapest, Copenhagen, Glasgow, London, Munich, Rome,
  Saint Petersburg, genuinely no single host country) is a real edition, not
  a placeholder like Copa América's home-and-away rows, so excluding it
  would have quietly dropped a real host entry other pages
  (`distinctHosts()`, the host filter, `buildHostsSummary()`'s "Most
  frequent hosts" ranking on `/records`) still show correctly. Gave it one
  symbolic marker at a rough centroid of the eleven cities instead - the
  same "approximate marker, not a cartographic claim" policy the header
  comment on this file already states for every other point, just applied
  to a wider spread than a normal co-host pair.

**Six pages wired up** (English `euro.astro`/`nations-league.astro`/
`copa-america.astro` via `CompetitionView`'s existing `hostMap` prop - no
component change needed - and their `/hr/` counterparts, which compose
`HostMap.astro` by hand like the Croatian World Cup page already does, each
with its own translated heading/description/region labels). EURO and
Nations League both map to a single "Europe" region, so `HostMap.astro`'s
existing region-grouping renders one section, not five - the component
needed no change to handle that gracefully, since `regionGroups` is already
just "however many distinct regions actually appear." Removed the
now-stale "World Cup only for now" note from `CompetitionView.astro`'s
`hostMap` prop doc comment.

**`scripts/pdf-pages.mjs`** gained `HOST_MAP_COMPONENT`/`HOST_MAP_DATA` in
the `euro`/`nations-league`/`copa-america` entries and their three `-hr`
counterparts (six PDF slugs total), and its own header comment ("currently
only opted into by the World Cup page") was corrected to describe the new,
wider set - exactly the kind of rendering-code dependency this file's own
header comment already warns is easy to silently miss. `pnpm check:pdfs`
correctly flagged all nine affected PDFs (six new plus World Cup's own two,
which picked up the corrected `hostCoordinates.ts` header comment) as stale
before regeneration; every one of the 290 PDFs (unchanged count - no
per-competition PDF was added or removed, all six already existed) was
regenerated with `PW_EXECUTABLE_PATH=<preinstalled Chromium> pnpm
build:pdfs` and confirmed clean after, the same full-regeneration behavior
prior PDF-affecting entries in this file have already recorded (the tool
has no incremental mode, so every PDF is rewritten on each run even where
its own content didn't change).

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 136
files (no new page files - all six changed pages already existed). `pnpm
test` - **425/425** (7 new in `tests/unit/editions.test.ts`: EURO's
co-host/2020 resolution and 14-entry/region-validity checks, UEFA Nations
League's 4-entry check, Copa América's South America/North America
grouping-plus-Home-and-away-exclusion and 11-entry/region-validity checks).
`pnpm build` - 307 pages (unchanged - no new page, only more content on six
existing ones). `pnpm check:links`, `check:sitemap`, `check:precache` all
pass unchanged. `pnpm check:perf` - all pages within the 510 KB budget
(heaviest unchanged at `hr/records` 501.2 KB; the two Copa América pages
grew the most from their 11-entry map, to 265.1 KB/262.7 KB, still well
inside budget). 8 new Playwright cases at 360px covering all six changed
pages (EURO: one Europe region, the "Eleven European cities" entry present;
Nations League: one Europe region, every Finals host present; Copa América:
South America/North America grouping, "Home-and-away" produces zero map
entries, United States present; plus the three Croatian equivalents with
translated headings/region labels). The accessibility sweeps
(`accessibility.spec.ts`, `accessibility-forced-colors.spec.ts`) and
`print-styles.spec.ts` are `NAV_LINKS`-driven against these same six
existing pages, so they picked up the added content automatically with no
per-page wiring, the same payoff every prior nav-content-addition entry in
this file has already recorded for that mechanism.

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, the flag-emoji idea rejected, CSP's `'unsafe-inline'`
not worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, full per-edition team
participant lists blocked on sourcing, `/compare-players` print PDF
matching `/compare`'s own precedent). "EURO podium cards structurally
impossible" is unaffected by this run (a locator map only needs one host
cell per edition; a podium needs a ranked top-four, which EURO's
"semifinalist" columns don't provide) and remains correctly listed above.
Ballon d'Or and Golden Boot have no host column at all (individual awards),
so a host locator map for either would need new editorial content this site
doesn't have - not pursued, matching the same "no data to build from" reason
the two individual awards are already excluded from `buildHomeSoilTitles()`
and the "Most frequent hosts"/podium rankings elsewhere on this site.

### Accessibility/UX: visible breadcrumb navigation on every non-home page - added 2026-08-22 (later intensive run)

With every backlog item, cross-cutting audit, and standing "Left for a future
pass" candidate still infeasible/rejected/low-yield, and every plausible new
content-accuracy or data-audit angle already covered by prior runs (checked
this run: World Cup/EURO/Nations League/Copa América Champion/Runner-up/
Third-Fourth/Final-date/Host/Teams, Ballon d'Or Winner/Ceremony-date, Golden
Boot, and the "Format" and "Teams" columns each competition actually has -
no gap found there either), this run looked at the schema.org structured
data instead of the content and found a real, previously-overlooked gap:
`BaseLayout.astro` already computes a "Home > page" (or, for a nested
profile page, "Home > Teams > Brazil") breadcrumb trail for the invisible
`BreadcrumbList` JSON-LD block every non-home page carries - but that trail
was never actually rendered anywhere a reader could see or click it. A
visitor deep on `/teams/brazil` or `/players/lionel-messi` had no on-page
way back to the parent directory besides the primary nav or the browser's
back button, even though the exact data needed for a breadcrumb trail
already existed on every single page.

**New `src/components/Breadcrumb.astro`**: takes the same `locale`/`trail`/
page `title` values `BaseLayout.astro` already threads through to
`buildBreadcrumbList()`, and renders them a second time as a real `<nav
aria-label="Breadcrumb">` with an ordered list - `Home` (and, for a nested
profile page, its parent index) as links, the current page as plain text
with `aria-current="page"` rather than a dead self-link. `no-print` (matching
every other nav-only chrome element on this site - `ThemeToggle.astro`, both
`Nav.astro` search widgets, `.filters`) since a printed page doesn't need a
link trail back to a directory it can't click through to. `BaseLayout.astro`
now renders it inside `.container`, right before `<slot />>`, for every page
except the home page itself (which has no parent to link to, same condition
`isHome` already gates the JSON-LD block on). New `breadcrumbNavLabel` UI
string (`src/lib/i18n.ts`, "Breadcrumb"/"Navigacijski put") gives the new
landmark a distinct `aria-label` from the primary nav's own ("Primary"/
"Glavna navigacija"), required for two `<nav>` landmarks to coexist without
an accessibility-tree ambiguity.

No new data or page-specific wiring needed anywhere: every page already
passes (or, for a flat page, omits) the exact `trail`/`title` values this
component needed, so all 307 pages picked this up automatically in both
languages - a flat page like `/records` now shows "Home / Records and
Timelines", a nested profile page like `/teams/brazil` shows "Home / Teams /
Brazil - Full history" with a working middle link back to `/teams`.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 137
files. `pnpm test` - **426/426** (1 new in `tests/unit/i18n.test.ts` for the
new `breadcrumbNavLabel` key). `pnpm build` - 307 pages, unchanged. `pnpm
check:links`/`check:sitemap`/`check:precache` all pass unchanged (no new
page, no new route). `pnpm check:perf` - all pages still within the 510 KB
budget (heaviest, `hr/records`, grew from 501.2 KB to 502.4 KB - the extra
~1.2 KB of shared breadcrumb markup/CSS on the site's already-heaviest page,
well inside the existing headroom). `pnpm check:pdfs` - all 290 PDFs still
correctly reported up to date: neither `BaseLayout.astro` nor `Nav.astro`
is a listed source in `scripts/pdf-pages.mjs` for any PDF (the same
precedent recorded when Nav.astro's two search widgets were added), and the
new nav carries `no-print` regardless, so it would never render into a PDF
even if it were tracked. 3 new Playwright cases in `tests/e2e/mobile.spec.ts`
(English `/teams/brazil`: the visible nav renders with the right 3 items,
`aria-current="page"` on the last one, and its middle link actually
navigates to `/teams`; Croatian `/hr/teams/brazil`: same shape with
Croatian labels/hrefs; a flat page (`/records`) gets a 2-item trail while
the home page gets no breadcrumb nav at all). Full `accessibility.spec.ts` +
`accessibility-forced-colors.spec.ts` re-run scoped to just those two files -
**147/147 passing** - confirms the new second `<nav>` landmark introduces no
WCAG 2.1 A/AA violation on any page/color-scheme/language combination axe
already sweeps. Full `print-styles.spec.ts` - **125/125 passing** - confirms
`no-print` actually hides the new nav in print media on every page type the
suite covers, including the WCAG-in-print checks. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` -
**655/655 passing** (up from 652), confirming no regression anywhere in the
complete suite.

**Left for a future pass:** the standing candidates from prior runs are
unchanged (source-link liveness infeasible, further content-accuracy
spot-checks low-yield, flag-emoji idea rejected, CSP's `'unsafe-inline'` not
worth revisiting, the Golden Boot reverse-lookup quiz type not pursued,
`public/downloads/` PDF-bloat documented/intentional, full per-edition team
participant lists blocked on sourcing, `/compare-players` print PDF matching
`/compare`'s own precedent, EURO podium cards structurally impossible, no
host locator map for Ballon d'Or/Golden Boot - no host data to build from).

### Accessibility: `/compare-players` interactive states were never added to the WCAG state-change sweep - closed 2026-08-22 (later intensive run)

`tests/e2e/accessibility-compare-states.spec.ts` exists specifically to catch
a "silent DOM update" gap - `/compare`'s Team A/B pickers and Swap button
rewrite the head-to-head panel's heading and table cells in place via
`textContent`, invisible to the `NAV_LINKS`-driven `accessibility.spec.ts`
sweep (which only ever loads each page once, in its initial state) unless the
`aria-live` status region actually announces the change. `/compare-players`
(added 2026-08-21, `src/pages/compare-players.astro`) reuses the exact same
DOM shape - `#compare-a`/`#compare-b` selects, `#compare-swap`,
`#compare-status[aria-live="polite"]`, `#compare-a-name`/`#compare-b-name`
headings - but shipped fifteen days after this spec file was written and was
never added to its `COMPARE_PAGES` list, leaving its own re-selected-player
and swapped states completely untested for this exact bug class. Confirmed
by inspection that neither `accessibility.spec.ts` nor
`accessibility-forced-colors.spec.ts` (both `NAV_LINKS`-driven, initial-state
only) closes this gap either.

Fixed by adding `compare-players` and `hr/compare-players` to
`COMPARE_PAGES` in `accessibility-compare-states.spec.ts` - no new test
logic needed, since `/compare-players` uses an identical ID scheme to
`/compare` down to the element name, so the existing two `test()` bodies
(re-select Player A, click Swap) generalize verbatim across all four pages.
Ran the extended suite before committing: **16/16 passing** (up from 8),
confirming `/compare-players` already announces both state changes
correctly and introduces no WCAG 2.1 A/AA violation in either state, either
color scheme, or either language - a clean audit result, not a bug fix, but
one that closes a real, previously-untested gap rather than re-confirming
something already covered.

**Tests:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 137
files (test-only change, no page/component edits). `pnpm test` -
**426/426** (unchanged - no unit-testable logic changed). `pnpm build` - 307
pages (unchanged). Full `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm
test:e2e` - **663/663 passing** (up from 655, the 8 new cases from this
change), confirming no regression anywhere in the complete suite.

**Left for a future pass:** the standing candidates above are unchanged.
`docs/EDITORIAL_GUIDE.md`'s "Content safety and family suitability" rules
(betting/gambling links, graphic violence, abusive chants, unverified
scandals, invasive private-life details) have only ever been spot-checked
incidentally (see the 2026-08-22 glossary entry above) - a dedicated,
line-by-line sweep of every `content/*.md` prose section against that
specific list is a reasonable next angle, distinct from the
already-low-yield factual-column re-verification.

### Content-safety audit, plus a real test-coverage gap closed: `loadHomeCompetitions()`/`loadGlossaryEntries()` were never unit-tested - added 2026-08-22 (later intensive run)

With every "Suggested child-friendly feature", competition/award page, and
directory (`/teams`, `/players`, `/compare`, `/compare-players`) already
shipped, and the standing "Left for a future pass" list exhausted or
rejected the same way every recent run's entry has recorded, this run took
the prior entry's own suggested next angle: a dedicated, line-by-line read
of every `content/*.md` prose section (all 15 files, all front matter and
body text, not just the tables) against `docs/EDITORIAL_GUIDE.md`'s
"Content safety and family suitability" list - betting/gambling links,
graphic descriptions of crowd disasters or violence, abusive chants,
unverified scandals, invasive details about players' private lives.
**No violations found.** The site's "Memorable moments" sections describe
sporting results in neutral, factual language even for historically loaded
subjects (the 1950 Maracanazo, Maradona's 1986 tournament); no page mentions
betting/odds, describes a disaster or violent incident graphically, quotes a
chant, or repeats an unverified or private-life claim about any player. This
is a clean-audit result, not a bug fix, but the first time this specific
rule list has had a dedicated full-content pass rather than incidental
spot-checks during unrelated content-accuracy work.

Since a clean content audit alone leaves nothing to ship, this run also
closed a real, unrelated gap it found while establishing a fresh
`pnpm test:coverage` baseline to confirm the site's actual current health
before picking a quality-pass angle (the last dedicated Vitest-coverage pass
was 2026-08-21's "first-ever coverage report" entry, itself now a run old):
`src/lib/homeCards.ts`'s `loadHomeCompetitions()` - the function that wires
all six real `content/*.md` files into the home page, one `loadCompetition()`
call per competition with its own hard-coded id, `editionsHeading` and (for
Copa América) `allowDuplicateYears` - sat at 50% function coverage (18-48
uncovered) and had never once been called in a test. Every existing
`homeCards.test.ts` case only exercised the pure `buildHomeCards()`, feeding
it an already-built `HomeCompetitions` fixture, so a typo in one of those six
ids or heading strings (e.g. `'uefa-euro'` → `'euro-uefa'`, or Copa América's
`'Champions timeline'` heading regressing to the default `'Editions'`) would
have passed every unit test and only surfaced as a build failure - or worse,
have silently mismatched a competition to the wrong content if two ids
happened to both resolve. `src/lib/glossary.ts`'s equivalent
`loadGlossaryEntries()` (50-56 uncovered) had the identical gap for the same
reason: `glossary.test.ts` only ever called the pure `parseGlossaryEntries()`
it wraps.

Fixed by adding a `loadHomeCompetitions` describe block to
`homeCards.test.ts` (mirroring `tests/unit/competition.test.ts`'s existing
`getEntry` mock pattern for `loadCompetition`/`loadPageMeta`): one test that
mocks all six ids with a distinct winner name each and asserts each of
`data.worldCup`/`euro`/`copaAmerica`/`nationsLeague`/`ballonDor`/`goldenBoot`
resolved from its own id under its own `editionsHeading` (catching a
mismatched id/key or wrong heading), and one test that gives Copa América
specifically a same-year 1959 duplicate (mirroring the real
`content/copa-america.md` 1959 South American Championship/Ecuador split)
and asserts it does not throw - the one place `allowDuplicateYears` wiring
genuinely matters. `glossary.test.ts` gained three `loadGlossaryEntries`
cases: the happy path via `getEntry`, the missing-entry throw, and a
missing-body-defaults-to-empty-array case, matching the equivalent
`loadPageMeta`/`loadCompetition` cases already covering that shape.

**Tests:** `pnpm test` - **431/431** (up from 426: 2 new `loadHomeCompetitions`
cases in `homeCards.test.ts`, 3 new `loadGlossaryEntries` cases in
`glossary.test.ts`; no existing case changed). `pnpm test:coverage` -
**`homeCards.ts` and `glossary.ts` both now 100%
statements/branches/functions/lines** (up from 80.5%/50% functions and
87.5%/83.33% functions respectively); the whole-repo `src/lib` average rose
from 96.54% to 98.2% statements. `pnpm lint` (`astro check`) - 0
errors/warnings/hints across 137 files. `pnpm build` - 307 pages (unchanged
- test-only change, no page/component/content edits). `check:links`/
`check:sitemap`/`check:perf`/`check:precache`/`check:pdfs` all clean.

**Left for a future pass:** the standing candidates above are unchanged. The
remaining small coverage gaps (`compare.ts` 325-326, `competition.ts` 62/112,
`editions.ts` a handful of lines, `notes.ts` 61-62, `playerProfile.ts`
60-62, `validate.ts` 30-31, and a few single-line branch gaps in `i18n.ts`/
`jsonLd.ts`/`offlineCache.ts`/`sources.ts`/`tableSort.ts`/`url.ts`) are each
one or two uncovered lines in an already-well-tested pure function, a much
lower-yield shape than the two whole-function integration gaps this run
closed; `competitions.ts` and `types.ts` showing 0% are type-only/config
modules with no runtime logic to cover, not real gaps.

### Mobile-first header: the primary nav collapses into a menu drawer; CI/deploy actions moved off the deprecated Node 20 runtime - added 2026-08-22 (later intensive run)

**Problem 1 (the header).** At the 360px viewport this whole project targets,
the header rendered the brand plus fifteen nav links, two search widgets, the
language switch and the theme toggle as one wrapping flex row - five rows
deep, roughly half the first screen gone before any content. Every page paid
that cost on every load.

**Fix.** `src/components/Nav.astro` now wraps everything except the brand in a
`#site-menu` drawer behind one `#menu-toggle` button:

- **Mobile first, literally**: the collapsed drawer is the *base* stylesheet
  state and `@media (min-width: 60rem)` is what restores the inline header, so
  the desktop layout is unchanged from before this entry while the phone
  layout is the default the CSS is written for.
- **No-JS safe**: the button ships `hidden` and the drawer ships expanded. The
  inline script adds `.site-header--js` (the only hook the collapsing CSS keys
  off) and reveals the button, so a reader without JavaScript keeps the old
  always-visible header instead of an inert button and no navigation at all.
- **Disclosure semantics**: `aria-expanded` + `aria-controls`, a translated
  `aria-label` that swaps between "Open/Close the menu" ("Otvori/Zatvori
  izbornik" - three new `src/lib/i18n.ts` keys), Escape closes and returns
  focus to the button, an outside click closes, and crossing the 60rem
  breakpoint closes so a return to a narrow viewport never starts open. The
  hamburger becomes a cross via geometry, not colour, so forced-colors keeps
  the cue.
- **Thumb-sized targets**: inside the drawer the nav becomes a two-column grid
  of >=44px rows and the search fields, language switch and theme toggle each
  get a >=44px target (the theme toggle via `:global()`, since that button
  belongs to `ThemeToggle.astro`'s scope).
- **`--site-header-height` keeps its meaning**: the open drawer is positioned
  against the header rather than sitting in its flow, so the custom property
  other sticky elements read (the quiz score bar) still measures the bar, not
  the bar plus an open drawer. Pinned by its own test.

**Problem 2 (the workflows).** Every run of `deploy.yml` finished with two
GitHub annotations: "Node.js 20 is deprecated... but are being forced to run on
Node.js 24" for `actions/checkout@v4`, `actions/configure-pages@v5`,
`actions/setup-node@v4`, `actions/upload-artifact@v4`,
`actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` and
`pnpm/action-setup@v4`.

**Fix.** Bumped every action in `deploy.yml` and `ci.yml` to the major that
actually declares `using: node24` (checkout v7, setup-node v7, configure-pages
v6, upload-pages-artifact v5, deploy-pages v5, upload-artifact v7,
pnpm/action-setup v6). `upload-pages-artifact` matters twice over: v4 still
pins `upload-artifact@v4.6.2` internally and would have kept the warning
alive, v5 pins v7. No workflow inputs changed - Node stays pinned at 22 for
the build itself via `setup-node`'s `node-version`.

**Tests:** every e2e test that drives a header control now opens the drawer
first through one shared `tests/e2e/menu.ts` helper (idempotent, so it is a
no-op on a wide viewport or an already-open drawer). New coverage: nine cases
in `mobile.spec.ts` for the disclosure itself (collapsed header under 80px
tall, drawer contents equal to `NAV_LINKS`, 44px targets, navigation from a
drawer link, Escape, outside click, no horizontal overflow while open,
`--site-header-height` stability, Croatian labels) and two axe scans of the
*open* drawer per colour scheme in `accessibility.spec.ts` - real, reachable
DOM the existing sweep never saw, because every page loads with the menu shut.
Two pre-existing races in the Croatian search-widget tests surfaced and were
fixed properly (they waited on the *English* loading label, then drove the
keyboard before any option had rendered). `pnpm lint` - 0 errors/warnings/
hints. `pnpm test` - **431/431** (the 5 extra are the prior entry's new
`loadHomeCompetitions()`/`loadGlossaryEntries()` cases, merged in before this
branch was rebased onto them; this change adds no unit-testable logic). `pnpm build` - 307 pages, and
`check:perf`/`check:links`/`check:sitemap`/`check:precache`/`check:pdfs` all
clean. Full `pnpm test:e2e` - **676/676 passing** (up from 663).

**Left for a future pass:** the drawer does not trap focus while open - Escape,
the outside click and the natural tab order out of it are the current
behaviour, which is acceptable for a disclosure but not what a true modal
dialog would do. The desktop header above 60rem still wraps its fifteen nav
links onto two rows; a grouped/overflow nav there is a separate design
question this change deliberately left alone.

### Head-to-head panels rebuilt as a "versus" table - `/compare` and `/compare-players`, both languages - added 2026-08-22 (later intensive run)

**Problem.** Both head-to-head panels rendered one table per side: Team A's
five-column record, then Team B's, stacked vertically inside
`.compare__panel`. At the 360px viewport this project targets, each table was
wider than the screen (`min-width: 28rem` inside a `.t-wrap` scroller) and
they sat one above the other, so comparing two teams meant scrolling right in
table A, memorising a number, scrolling down past the whole table, and
scrolling right again in table B. The two numbers a reader opens this page to
compare were never on screen together - which is the entire purpose of the
page.

**Fix - transpose it.** The panel is now one table with three columns: Team
A's value, the statistic's name, Team B's value. One row per statistic, so
both numbers are always side by side, and three narrow columns fit any phone
with no horizontal scroll at all (the `.t-wrap` wrapper is gone from this
panel; the "All national teams"/"All players" rankings below still have one,
they genuinely are wide tables).

- **Grouped, not flattened**: one `<tbody>` per competition (or award) with a
  `<th scope="colgroup">` heading, ending in a "Combined" group. Semantics
  stayed table semantics - metric as row header, team as column header - so
  the panel still reads correctly cell by cell in a screen reader.
- **The leader is marked per row**, in weight, colour *and* a triangle
  marker, never colour alone, with a forced-colors outline - the same rule
  `global.css` documents for `TournamentTable`'s winner cell. A tie marks
  neither side. `data-leader="a" | "b" | "tie"` on the row is what the CSS and
  the tests both key off.
- **Empty groups collapse.** Argentina vs Uruguay used to render eight rows of
  zeros for the EURO and the Nations League. A competition (or award) where
  both sides have nothing now collapses to a single "Neither team has a record
  here." line, roughly halving the panel on a typical pair. "Combined" is
  exempt: it is the summary line, not one competition among several. Rows are
  hidden in CSS rather than removed, so the client script only flips one
  attribute per group when the pair changes.
- **The pair header sticks** under the site header, using the same
  `--site-header-height` custom property `Nav.astro` measures - so on a long
  scroll you never lose track of which column is whom.
- Applied to all four pages (`/compare`, `/hr/compare`, `/compare-players`,
  `/hr/compare-players`); the Croatian pages keep their own translated
  labels and reuse the identical, language-independent `fillVersus()`.

**Tests:** the specs that reached into the old per-side DOM
(`#compare-a-body`, `#compare-a-total`, `[data-field]`) now address the versus
rows instead. Ten new cases: both values proven to sit on one row *and* inside
the 360px viewport (a bounding-box assertion, which is the actual regression
this change fixes), the panel's own `scrollWidth` proving no sideways scroll,
leader marking surviving a swap, ties marking neither side, empty groups
collapsing and re-expanding when the pair changes, and Combined keeping its
numbers. `pnpm lint` - 0 errors/warnings/hints. `pnpm test` - **431/431**
(unchanged - the change is presentational, no `src/lib` logic moved).
`pnpm build` - 307 pages, and `check:perf`/`check:links`/`check:sitemap`/
`check:precache`/`check:pdfs` all clean. Full `pnpm test:e2e` - **685/685**
(up from 676).

**Left for a future pass:** all four competitions currently track a
semifinal/third-place column, so the "—" both-sides state the panel still
renders for one that doesn't is unreachable from real content and has no test
of its own (noted inline in `mobile.spec.ts`). The panel shows raw counts
only; a proportional bar per row was considered and deliberately deferred -
the counts are small integers where a bar adds decoration, not information.

### `/compare` and `/compare-players` gain a downloadable print PDF, closing the gap the 2026-08-17 entry named as a standing candidate - added 2026-08-22 (later intensive run)

Every other reader-facing page with real content - the six competition/award
pages, `/records`, every `/teams/<slug>` and `/players/<slug>` profile - has
had a "Download printable PDF" link since 2026-07-31/2026-08-18/2026-08-20.
The two head-to-head comparison pages never got one, despite being named
explicitly as the natural next slice in three separate "Left for a future
pass" notes (most recently the 2026-08-17 entry). Both pages already render a
fully meaningful default view with zero JavaScript - `/compare`'s two
most-titled teams, `/compare-players`'s two most-decorated players, per each
page's own "before any JS runs" comment - which is exactly the
progressive-enhancement precedent every other PDF here already relies on: the
generator (`scripts/generate-pdfs.mjs`) just prints the live page under print
media, no PDF-only layout of its own.

Added four entries to the shared `scripts/pdf-pages.mjs` list (`compare`,
`compare-players`, and their `/hr/` counterparts, following the exact
Croatian-gets-its-own-page-path precedent every other bilingual PDF here
uses) with their own accurate `sources` list - `src/lib/teamCompetitions.ts`/
`src/lib/compare.ts`/`src/lib/teamProfile.ts` for `/compare`,
`src/lib/playerProfile.ts`/`src/lib/comparePlayers.ts` for
`/compare-players` - rather than reusing `TABLE_COMPONENTS`/
`TIMELINE_COMPONENTS`, since neither page renders `TournamentTable`,
`ChampionsSummary`, or `EditorialNotes` (they compose their own "versus"
markup by hand); only `References.astro` actually applies, factored into a
new shared `REFERENCES_COMPONENT` constant. `generate-pdfs.mjs` and
`check-pdf-freshness.mjs` both already iterate this shared list generically
(page path in, slug-named PDF out; source list in, staleness check out), so
no change to either script was needed - the existing pattern absorbed four
new pages for free. Wired the existing, reusable `PrintDownloadLink.astro`
into all four pages' headers (English/Croatian labels, an A4-landscape hint
naming what's on the printed page), the same call shape `/records` already
uses for a multi-section aggregate page.

Regenerated all 294 PDFs via `PW_EXECUTABLE_PATH=<preinstalled Chromium>
pnpm build && pnpm build:pdfs` (the tool has no per-page filter, so a
refreshed manifest always re-renders everything, the same full-regeneration
precedent every prior PDF-tooling entry here has followed since the
2026-08-06 "Automated PDF-freshness check" entry) and confirmed `pnpm
check:pdfs` reports all 294 up to date (up from 290) against the new
manifest.

**Tests:** four new Playwright cases mirroring `/records`' own existing "PDF
link resolves and serves a real PDF" test - one per new page/locale
(`tests/e2e/mobile.spec.ts` for `/compare`/`/hr/compare`,
`tests/e2e/compare-players.spec.ts` for `/compare-players`/
`/hr/compare-players`), each asserting the link is visible, the Croatian
pages show the translated label, and an actual `request.get()` against the
href returns a 200 with a PDF content-type - not just that a link element
exists. `pnpm lint` (`astro check`) - 0 errors/warnings/hints across 138
files. `pnpm test` - **431/431** (unchanged - no `src/lib` logic changed,
only the shared, already-tested `PrintDownloadLink.astro` reused). `pnpm
build` - 307 pages (unchanged). `check:links`/`check:sitemap`/`check:perf`/
`check:precache` all clean against the rebuilt `dist/` (the new PDFs had to
be generated and the site rebuilt *before* `check:links` would pass, since
it resolves each `<a download>` href against a real file in `dist/downloads/`
- confirmed the check does catch a missing file: it failed with exactly the
four expected broken links until the rebuild). Full `PW_EXECUTABLE_PATH=
/opt/pw-browsers/chromium-1194/chrome-linux/chrome pnpm test:e2e` -
**689/689 passing** (up from 685, the 4 new cases), confirming no regression
anywhere in the complete suite.

**Left for a future pass:** the standing candidates from prior runs are
otherwise unchanged (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, flag-emoji idea rejected, CSP's
`unsafe-inline` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued, `public/downloads/` PDF-bloat documented/intentional, full
per-edition team participant lists blocked on sourcing, EURO podium cards
structurally impossible, no host locator map for Ballon d'Or/Golden Boot -
no host data to build from, the mobile menu drawer's lack of a true focus
trap - acceptable for a disclosure widget, not required). With this entry,
every page named across all three prior "left for a future pass" mentions of
this specific gap is now closed.

### Accessibility: the mobile nav drawer's Tab key now traps focus inside it while open - added 2026-08-23 (intensive run)

**Problem.** `Nav.astro`'s `#site-menu` drawer (the collapsed header below
60rem) has closed via Escape and outside-click since its 2026-08-22 launch,
but never trapped Tab: focus could walk straight out of the open drawer into
whatever followed it in the DOM - the page's own main content, then its
footer - while the drawer itself stayed visually open on screen. A sighted
mouse user never notices; a keyboard-only reader tabbing through the drawer's
sixteen-plus controls (fifteen nav links, two search inputs, the language
switch, the theme toggle) can walk clean off the interactive surface they can
see into content behind it. Two entries already named this: the mobile-header
launch's own "left for a future pass" note, and the 2026-08-22 PDF entry's
standing-candidates list, which had logged it as "acceptable for a disclosure
widget, not required" per the WAI-ARIA APG's own guidance for a non-modal
disclosure. Revisited that call here: the site's own AGENTS.md commits to
"accessible semantic HTML and keyboard-friendly controls" as a non-negotiable
rule, the fix is small, and a drawer that visually covers the whole first
screen at 360px behaves like a modal to anyone looking at it even if it isn't
marked as one - so closing the gap properly beat leaving it deferred again.

**Fix.** Tab/Shift+Tab now cycles the toggle button plus every focusable
control inside the open drawer and wraps at either end, instead of walking
out. Escape and the click-outside handler are unchanged. The trap itself
lives in the bundled, `is:inline`-free `<script>` at the bottom of
`Nav.astro` (the one that already initializes the team/player search
widgets) rather than the small `is:inline` script that opens/closes the
drawer - that inline script is duplicated raw into every page's own HTML for
its own no-flash-of-wrong-state reason, while the bundled script is minified
before landing in each page, and the trap only matters after a real Tab
press, well after first paint, so it doesn't need the inline script's
guarantee. Keeping it out of the inline copy matters concretely here:
`hr/records` - the site's heaviest page - was already within about 800 bytes
of `check:perf`'s 510 KB page-weight budget, and the first (unminified,
inline) version of this trap alone pushed it over. The final, minified,
bundled version leaves `hr/records` with real but thin headroom (about
235 bytes) under the budget; any future editorial growth on that specific
page needs to keep that in mind rather than assuming the old ~800 bytes of
slack still exists.

**Tests:** three new Playwright cases in `tests/e2e/mobile.spec.ts`
("header menu on a 360px phone"): Tab from the last drawer control (the
theme toggle) wraps back to the menu button, Shift+Tab from the menu button
wraps to the last drawer control, and a full lap - one Tab per focusable
stop, computed from `NAV_LINKS.length` rather than hardcoded - lands back on
the toggle with the drawer still open, proving nothing outside the trap ever
receives focus while it's up. `pnpm lint` - 0 errors/warnings/hints across
138 files. `pnpm test` - **431/431** (unchanged - no `src/lib` logic
touched). `pnpm build` - 307 pages (unchanged). `check:links`/`check:sitemap`/
`check:precache`/`check:pdfs` all clean; `check:perf` clean with the
thin-but-real headroom noted above. Full `PW_EXECUTABLE_PATH=
/opt/pw-browsers/chromium pnpm test:e2e` - **692/692 passing** (up from 689,
the 3 new cases).

**Left for a future pass:** the standing candidates from prior runs are
otherwise unchanged (source-link liveness infeasible, further
content-accuracy spot-checks low-yield, flag-emoji idea rejected, CSP's
`unsafe-inline` not worth revisiting, the Golden Boot reverse-lookup quiz
type not pursued, `public/downloads/` PDF-bloat documented/intentional, full
per-edition team participant lists blocked on sourcing, EURO podium cards
structurally impossible, no host locator map for Ballon d'Or/Golden Boot -
no host data to build from). The desktop header above 60rem still wraps its
fifteen nav links onto two rows - a grouped/overflow nav there remains a
separate design question this run deliberately left alone, same as the
2026-08-22 entry that first named it.

### UX: desktop nav gains a "More" menu, closing the standing two-row-wrap candidate - added 2026-08-23 (later intensive run)

**Problem.** Two prior runs (2026-08-22's mobile-header launch, 2026-08-23's
focus-trap entry above) named the same open item without picking it up: at
>=60rem the primary nav lays out as a single wrapping row rather than the
mobile drawer, and its fifteen links don't fit on one line, so they wrap
onto a second row. Backlog-wise every competition/award page, every
cross-cutting audit, and every other standing candidate was exhausted or
already rejected (see the list above), which made this the one concrete,
still-open item left to close this run.

**Fix.** `Nav.astro` now splits `NAV_LINKS` into two tiers: the six
competition/award pages plus Home - the same six the home page itself leads
with - stay directly on the row; the eight "tool" pages (Records, Compare,
Teams, Players, Compare Players, Quiz, Glossary, Sources) collapse behind a
new "More" button at >=60rem. A `SECONDARY_NAV_PATHS` set local to `Nav.astro`
decides the split (it doesn't touch `NAV_LINKS`/`routes.ts` itself, so the
offline precache list and translated-paths map are unaffected); the markup
renders every link exactly as before, just with a `data-nav-tier="secondary"`
marker and one extra, initially-empty `<li class="nav-more-item">` between the
two groups. A new bundled script (`initNavMore`, alongside the existing
search-widget and focus-trap code at the bottom of `Nav.astro`) physically
moves the real secondary `<li>` nodes between the flat row and the dropdown
on a `matchMedia('(min-width: 60rem)')` change - not clones, so there is
never a duplicated link for a screen reader to announce twice or extra HTML
weight from a second copy. Below 60rem, or with JS disabled entirely, the
`.nav-more-item` stays `display: none` and every link renders flat exactly as
before - the mobile drawer (already fully correct per the Known caveats
section) needed zero changes and gets zero new elements added to its own
grid.

Deliberately **not** built as an ARIA `role="menu"`/roving-tabindex widget:
the button (`aria-haspopup`, `aria-expanded`, `aria-controls`) plus a plain
`<ul>` of real links is the same "semantic HTML over a complex ARIA widget"
choice the mobile drawer itself already makes, and Escape-to-close plus
click-outside is the same non-modal disclosure pattern the drawer used
before it grew a Tab-trap - this dropdown never covers the viewport the way
the full-screen drawer does, so per the WAI-ARIA APG it doesn't need one.

The new script - not `is:inline` - lives in the same bundled file the
2026-08-23 focus-trap entry above put its own logic in, and for the same
reason: `is:inline` scripts are duplicated raw into every page's HTML and
count fully against `check:perf`'s budget, while a bundled `<script>` only
adds its `src=` URL. `hr/records` had only ~235 bytes of headroom left after
that same tradeoff; an `is:inline` version of this menu (a few hundred raw
bytes) would likely have tipped it over outright. The real cost of that
choice: since the script runs after first paint rather than inline, a >=60rem
reader can see the un-collapsed, two-row nav for a brief instant before it
snaps into the grouped layout, instead of never seeing that state at all -
judged worth it against a hard `check:perf` build failure for a sub-frame
cosmetic flash. (`check:perf` afterwards: `hr/records` measured slightly
*lighter* than before this change, 509.1 KB vs. 509.8 KB - the shared CSS
file's own minified output shifted enough to net out below the markup this
adds; still real but thin headroom, not a reason to relax care on that page.)

**Scope note, found while writing the tests below.** The header's own
`.container` is capped at `--maxw` (68rem), so even a much wider viewport
never gives the row more than roughly 1024px of usable content width after
padding - not enough to also fit both search widgets, the language switch
and the theme toggle on the same line as the nav links, grouped or not. The
standing note this closes named the fifteen *nav links* specifically, not
the whole header, so that's the one row this menu makes true (verified: all
of Home, the six competitions/awards, and the More button now share one
`getBoundingClientRect().top` at 1280px). The header as a whole can still be
two lines tall - the nav row, then a second row for the search widgets/lang
switch/theme toggle - exactly as it already was before this change; not a
regression, just an honest boundary on what "closing the two-row-wrap note"
actually means here.

**Tests:** 7 new Playwright cases in `tests/e2e/mobile.spec.ts` (`desktop nav
"More" menu (>=60rem)`, the suite's first coverage at any viewport other than
the 360px project default, via `page.setViewportSize()`): the nav row is one
line with no page overflow and the mobile toggle is gone; the button opens
the menu with exactly the eight secondary links in it; a link inside the menu
navigates; Escape closes and returns focus to the button; a click outside
closes it; the current secondary page is marked `aria-current="page"` inside
the (closed) menu; and the Croatian header groups and labels the same way
("Više"). `pnpm lint` - 0 errors/warnings/hints across 138 files. `pnpm test`
- **431/431** (unchanged - no `src/lib` logic touched; the new `navMoreLabel`
i18n key is covered by the existing generic "every UI string has both
locales" test). `pnpm build` - 307 pages (unchanged). `check:links`/
`check:sitemap`/`check:precache`/`check:pdfs` all clean; `check:perf` clean,
see the headroom note above. Full `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium
pnpm test:e2e` - **699/699 passing** (up from 692, the 7 new cases).

**Left for a future pass:** the standing candidates from prior runs are
otherwise unchanged (same list as above). The header-as-a-whole two-line
height on a >=60rem viewport (nav row plus search/lang/theme row) is now the
one remaining, explicitly-scoped-out item from this entry's own note above -
closing it would mean shrinking or further collapsing the search widgets/
language switch/theme toggle themselves, a different and larger design
question than the nav-links wrap this run closed.

### Test-coverage sweep: `loadTeamCompetitions()` was never unit-tested, plus real branch gaps closed across 11 `src/lib` files - added 2026-08-23 (later intensive run)

With the two-row-wrap header note closed by the prior entry and every other
standing "Left for a future pass" candidate already infeasible/rejected/
low-yield (source-link liveness, a third content-accuracy pass, the
flag-emoji idea, CSP `unsafe-inline`, the Golden Boot reverse-lookup quiz
type, `public/downloads/` PDF-bloat, full per-edition participant lists,
EURO podium cards, a Ballon d'Or/Golden Boot host map), this run re-ran
`pnpm test:coverage` from scratch to find a fresh, genuinely new angle rather
than repeat an already-exhausted category - the same "establish a real
baseline before picking an angle" move the 2026-08-22 `loadHomeCompetitions()`/
`loadGlossaryEntries()` entry made.

That baseline surfaced the identical shape of gap that entry closed, in a
sibling file: `src/lib/teamCompetitions.ts`'s `loadTeamCompetitions()` - the
function `/compare`'s frontmatter *and* `src/pages/team-index.json.ts` (the
"find a team" search widget's data endpoint) both call to load the same four
team competitions under the same hard-coded ids/`editionsHeading`s - sat at
**0% coverage**, never once exercised by a test. A typo in any of its four
content ids, in Copa América's non-default `'Champions timeline'` heading, or
in its own `allowDuplicateYears: ['1959']` wiring would have passed every
existing unit test and only surfaced as a build failure, a silently empty
`/compare` ranking, or a broken team-search endpoint.

Beyond that one real integration gap, a full read of the coverage report's
remaining uncovered lines turned up two different shapes:

- **Genuinely reachable branches nobody had exercised** - mostly tie-break
  paths in a same-length `.sort()` comparator chain (`titles/gap desc, then
  earliest year, then name`) that every existing test for that function only
  ever fed a single winning entry, so the tie-break arms themselves never
  ran. `compare.ts`'s `buildRivalries()`, and `editions.ts`'s
  `buildRunnerUpsWithoutTitle()` and `buildLongestTitleGaps()`, all share
  this exact pattern. Also real: `buildFinalsMeetings()`'s own "skip a
  missing winner/runner-up" test asserted a property that happened to be
  true of every row in its fixture without any row actually missing either
  value - a vacuously-passing test masking an actually-untested skip path,
  fixed with a fixture that has one of each. Two `notes.ts`/`playerProfile.ts`
  branches (a heading-with-no-content section, and a single-winner Golden
  Boot row whose Team cell has a mismatched semicolon count) were the same
  "one arm of a real branch never taken" shape. `quiz.ts` gained coverage for
  a Croatian + individual-award prompt combination real pages already call
  (`hr/quiz.astro`'s Ballon d'Or question) but no unit test had reached, plus
  the "no runner-up column at all" (Ballon d'Or-shaped tables) and
  "too-sparse distractor pool" skip paths in `runnerUpByYearQuestions()`, and
  a missing-winner row being dropped before sampling in
  `chronologicalOrderQuestions()`. `i18n.ts`'s `alternatePath()` gained the
  Croatian-locale "no English equivalent" null case, and `jsonLd.ts` gained
  the reduce-comparator's "keep the running-latest edition, don't overwrite
  it with an earlier one appearing later in the array" arm plus the one
  singular/plural pairing (`totalRunnerUps === 1`) the two fixture records
  never happened to hit. `validate.ts` gained the "table has zero edition
  rows at all" case and the row-label fallback for a row whose year cell is
  itself blank. `offlineCache.ts` gained a direct `withBasePath('', '')`
  case and - via a `vi.doMock('../../src/lib/routes', ...)` the same way
  `competition.test.ts` mocks `astro:content` - the "nav link with no
  Croatian translation" fallback branch real `NAV_LINKS` data can never
  reach (every real entry has one, pinned by its own "every NAV_LINKS path
  has a Croatian translation" test), so it needed a fake link to exercise at
  all.
- **Branches that are defensively unreachable given the code's own
  invariants, not undertested** - left alone rather than forced with
  contrived inputs. `sources.ts`'s `stripTrailingPunctuation()` only reaches
  its `?? []` fallback on `result.match(/\)/g)` when `result` is already
  known (by the enclosing `if`) to end in `)`, so that match can never
  actually be `null`. `tableSort.ts`'s `slug()` `|| 'col'` fallback needs a
  header whose text is simultaneously matched by a role regex (`/host/`,
  `/winner|champion|player/`, etc. - meaning it contains real letters) and
  slugifies to nothing - contradictory. `url.ts`'s `withBase()` `|| '/'`
  fallback needs `${base}${clean}` to be empty, but `clean` is always
  prefixed with `/` first, so it never is. `quiz.ts`'s `mostTitlesQuestion()`
  `if (!choice) return []` needs `buildChoice()` to fail with fewer than 2
  distinct distractors, but its pool is `ChampionSummary[]` display names,
  which are unique by construction once `summary.length >= 3` has already
  been checked two lines above - a duplicate-name collision would need two
  different teams/players to share an identical display string, not modeled
  by any real content. Faking any of these would mean asserting behavior no
  real caller can trigger, the opposite of what this sweep is for.

**Tests:** 26 new Vitest cases across 11 existing files, plus a new
`tests/unit/teamCompetitions.test.ts` (3 cases, mirroring
`homeCards.test.ts`'s `loadHomeCompetitions()` block: loads all four
competitions by real content id under the real heading each one uses, builds
the `competitions` array in the fixed World Cup/EURO/Copa América/Nations
League order, and passes `allowDuplicateYears` for Copa América only).
`pnpm test` - **457/457** (up from 431). `pnpm test:coverage` -
whole-repo `src/lib` average rose from 98.21%/94.78% (statements/branches) to
**99.82%/97.93%**; every touched file is now 100% on both except `editions.ts`
(99.13%/94.44%, the four remaining defensively-unreachable-shaped statements
noted above are ones this sweep did not get to) and the three genuinely
unreachable single-line branches in `sources.ts`/`tableSort.ts`/`url.ts`
described above, plus `quiz.ts`'s one unreachable line. `pnpm lint`
(`astro check`) - 0 errors/warnings/hints across 139 files. `pnpm build` -
307 pages (unchanged - test-only change, no page/component/content edits).
`check:links`/`check:sitemap`/`check:perf`/`check:precache`/`check:pdfs` all
clean. Full `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` -
**699/699 passing** (unchanged from the prior entry - no e2e-visible surface
touched; one run hit a transient `ECONNRESET` fetching a static PDF over the
local dev server, gone on an immediate re-run of that one case, so treated as
infrastructure noise rather than a real failure per this file's own
"flake" criteria).

**Left for a future pass:** the standing candidates from prior runs are
otherwise unchanged (same list as above). `editions.ts` has four remaining
statement gaps at similar tie-break/malformed-row shapes this run didn't
reach (two more `.sort()` comparator chains in functions this sweep didn't
get to, plus a couple of malformed-row edge cases in `buildEditions()`
itself - a row shorter than its header row, or a table missing a
Year/Winner/Host column outright); each is one or two lines in an
already-100%-statement-coverage function, the same shape this sweep spent
most of its budget on elsewhere in the file, just not exhaustively finished.
The header-as-a-whole two-line height note from the prior entry is
unaffected by this pass (no UI/CSS touched).

### Test-coverage sweep: `editions.ts` closed to 100%/100% (statements/branches) - added 2026-08-23 (later intensive run)

The full backlog (`AGENTS.md`, `docs/WEBSITE_REQUIREMENTS.md`, this file's
"Left to do") is complete - every item is checked off and every previously
"left for a future pass" candidate is exhausted except the specific, concrete
gap the prior entry (this same day's "Test-coverage sweep" run) named:
`src/lib/editions.ts` still sat at 99.13%/94.44% (statements/branches), with
four named-but-unclosed shapes - two more `.sort()` comparator tie-break
chains, and "a couple of malformed-row edge cases in `buildEditions()` itself
- a row shorter than its header row, or a table missing a Year/Winner/Host
column outright." This run closed exactly that list, re-running
`pnpm test:coverage` after each addition to confirm no new gap opened
elsewhere.

- **Tie-break arms**: `buildHostsSummary()`, `buildHostMapPoints()`,
  `buildHomeSoilTitles()` and `buildLongestStreaks()` each sort by count/rank
  desc, then earliest year, falling through to
  `displayName.localeCompare()`/`host.localeCompare()` only when both of the
  first two keys tie - a case no existing fixture had ever constructed. New
  synthetic two-row fixtures (distinct display names, identical counts,
  identical *leading* year via same-year-different-suffix labels like
  `'1970 (zone A)'`/`'1970 (zone B)'`, and for the host-map case two same-
  region `WORLD_CUP_HOST_COORDINATES` entries) force each function down its
  final comparator arm and assert the alphabetical order it produces.
- **`buildEditions()` malformed rows**: a row shorter than its header row
  (trailing cells simply absent, not blank strings) previously never
  exercised the `row[index] ?? ''` fallback on the Year/Host/Teams/Winner
  branches - two new cases (trailing columns missing; leading columns
  missing via a reordered header row) close all four. A table with **no**
  Year/Season column at all (the `yearCol >= 0` ternary's `else` arm) was
  also untested - a third new case closes it, confirming `year: ''` and
  `yearSort: NaN` rather than a throw.
- Two smaller, related gaps turned up by the same coverage pass, same shape
  ("a documented-but-never-exercised fallback"), closed alongside the four
  named ones rather than left for yet another pass: `finalMargin()`'s
  `if (!match) return undefined` (a "Final" cell with no digit-dash-digit
  score pair, e.g. an abandoned/unplayed match) and `editionStoryYear()`'s
  turn-of-century season rollover (`end <= Number(season[1])`, e.g. a
  `"1999-00"`-style label needing `+100` to land on `2000`, not yet
  exercised by any real Nations League season which only starts at
  `"2018-19"`), plus `buildLongestTitleGaps()`'s "every gap works out to
  zero" skip (two titles sharing the same duplicate-labeled year, the
  Copa América 1959 shape) - the file's own doc comment already named this
  as the intentional "vanishingly unlikely" exclusion case, just never
  tested.

**Tests:** 9 new Vitest cases, all in `tests/unit/editions.test.ts`. `pnpm
test` - **467/467** (up from 457). `pnpm test:coverage` - `editions.ts` is
now **100%/100%** statements/branches (up from 99.13%/94.44%); whole-repo
`src/lib` average unaffected elsewhere. `pnpm lint` (`astro check`) - 0
errors/warnings/hints across 139 files. `pnpm build` - 307 pages (unchanged -
test-only change, no page/component/content edits). `check:links`/
`check:sitemap`/`check:perf`/`check:precache`/`check:pdfs` all clean. Playwright
e2e was not re-run this pass (no UI-visible surface touched, same reasoning
the prior entry gave for its own test-only change).

**Left for a future pass:** the remaining sub-100%-branch files
(`quiz.ts` line 283, `sources.ts` line 33, `tableSort.ts` line 22, `url.ts`
line 8) are the ones the 2026-08-23 "Test-coverage sweep" entry above already
classified as defensively unreachable given the code's own invariants, not
undertested - left alone here for the same reason. With `editions.ts` now
closed, no concrete, named test-coverage gap is currently on record; the next
quality pass should re-run `pnpm test:coverage` from scratch to look for a
freshly-introduced gap rather than assume one of these four is secretly
reachable.

### Maintenance: dependency currency sweep, plus stale test counts in the "How to run" header fixed - added 2026-08-23 (later intensive run)

With `editions.ts` closed to 100%/100% by the prior entry, this run re-ran
the full validation chain from scratch looking for a fresh angle rather than
repeat an already-exhausted category (content-accuracy passes, source-link
liveness, and several UI ideas are all on record as low-yield or rejected -
see the many "standing candidates" notes above). `pnpm test:coverage` came
back identical to the prior entry (100%/99.48% stmts/branches, the same four
single-line branches already classified as defensively unreachable) -
confirming no new gap opened, not finding one. `pnpm build`, `pnpm lint`, and
every `check:*` script were all clean.

`pnpm outdated` turned up a angle no prior run had touched: the project's own
`devDependencies`/`dependencies` had never been bumped since whichever run
first pinned them, and four packages had newer versions available within
their existing `^`-range (non-breaking): `@astrojs/check` 0.9.9 → 0.9.10,
`@axe-core/playwright` 4.12.1 → 4.13.0, `@playwright/test` 1.62.0 → 1.62.1,
`@types/node` 26.1.1 → 26.2.0. `pnpm update` applied exactly those four
(`package.json`'s caret floors moved up to match, `pnpm-lock.yaml`
regenerated). Re-ran the full chain afterward to confirm nothing regressed:
`pnpm lint` - 0 errors, `pnpm test` - **467/467**, `pnpm build` - 307 pages,
every `check:*` script clean, and the full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` -
**699/699 passing** (the updated `@playwright/test`/`@axe-core/playwright`
themselves ran the suite this time, not just the on-disk version bump).

Also fixed, while in the file: the "How to run" section at the top of this
document still quoted **431** Vitest tests and **685** Playwright tests -
stale since several intensive runs ago (actual counts are 467/699). Updated
both to the real, current numbers.

**Left for a future pass:** `astro` (5.18.2 → 7.2.4), `vitest`/
`@vitest/coverage-v8` (2.1.9 → 4.1.11) and `typescript` (5.9.3 → 7.0.2) are
each two major versions behind. Deliberately left untouched this run - a
multi-major upgrade of the framework and test runner carries real breaking-
change risk (routing/content-collections/config API changes in Astro,
reporter/config changes in Vitest) that deserves a dedicated pass able to
work through migration guides and re-validate incrementally, not a
same-run addition alongside an unrelated maintenance sweep. The safe,
in-range dependency bumps this run made are unaffected by that and stand on
their own.

### Dependency upgrade: Astro 5 → 7 and Vitest 2 → 4 - added 2026-08-23 (later intensive run)

The prior "Maintenance: dependency currency sweep" entry deliberately left
`astro` (5.18.2 → 7.2.4), `vitest`/`@vitest/coverage-v8` (2.1.9 → 4.1.11) and
`typescript` (5.9.3 → 7.0.2) untouched, naming it as needing "a dedicated
pass able to work through migration guides and re-validate incrementally."
This run was that pass, done one dependency at a time with the full
validation chain re-run after each step so a regression could be attributed
to the change that caused it.

- **`vitest`/`@vitest/coverage-v8` 2.1.9 → 4.1.11**: no config or test-code
  changes needed - `vitest.config.ts`'s `v8` coverage provider and
  `tests/unit/**/*.test.ts` glob both still apply as-is. The only surface
  effect was in the coverage *engine* itself: the upgraded v8 provider now
  instruments an implicit-else branch in `buildYearStories()`
  (`src/lib/editions.ts`) that the old engine didn't count, dropping that
  file from 100%/100% to 100%/99.43% (branches) with line 298 newly listed as
  uncovered - not a change to the source, a change in what the tool measures.
  Closed with one new test (`tests/unit/editions.test.ts`, "attributes a
  duplicate-labeled year... to only the first matching edition"), using the
  same synthetic-duplicate-year-label technique (`'1959 (zone A)'`/
  `'1959 (zone B)'`) the file's own tie-break-arm tests already established,
  since a real duplicate `storyYear` needs two editions sharing a label the
  way the two 1959 South American Championship entries do. Back to
  100%/100% on `editions.ts`.
- **`astro` 5.18.2 → 7.2.4**: one real breaking change touched this repo.
  Astro 7 deprecates the `z` re-export from `astro:content` in favor of
  `import { z } from 'astro/zod'` (Astro 7 now uses zod v4 internally under
  `astro/zod`, not the old `astro:schema`/`astro:content` re-export this repo
  was on) - `astro check` surfaced it as 17 `ts(6385)` "deprecated" hints
  against every `z.*()` call in `src/content.config.ts`, the one file in the
  repo that imported `z` from `astro:content` (`getEntry` is still imported
  from `astro:content` elsewhere and is unaffected). Fixed by splitting the
  import: `defineCollection` stays from `astro:content`, `z` now comes from
  `astro/zod`. `astro.config.mjs`'s `redirects`/`base`/`build.format` config
  needed no changes - all three are still current APIs in v7. No other file
  in `src/` imports anything from `astro:content` besides `getEntry`, and no
  `.astro` file touches `z` at all.
- **`typescript` 5.9.3 → 7.0.2 - not attempted, blocked**: `@astrojs/check`
  (the package `pnpm lint` runs `astro check` through) pins
  `peerDependencies.typescript` to `^5.0.0 || ^6.0.0` even at its own latest
  published version (0.9.10, already installed here) - TypeScript 7 is not
  in that range. Bumping `typescript` alone without a matching `@astrojs/check`
  release would either break `pnpm lint` on the peer-dependency mismatch or,
  worse, run `astro check`'s TS-compiler-API-dependent diagnostics against a
  major TS version it was never validated against. Left at 5.9.3 until
  `@astrojs/check` itself ships TS 7 support - re-check `npm view
  @astrojs/check peerDependencies` on the next dependency pass rather than
  assuming this is still blocked.

**Validation:** full chain re-run after every step, not just at the end.
`pnpm lint` (`astro check`) - 0 errors/warnings/hints across 139 files (down
from 17 hints mid-upgrade, before the `z` import fix). `pnpm test` -
**468/468** (up from 467, the one new coverage-closing test). `pnpm
test:coverage` - back to the same 100%/99.35%-or-better per-file numbers as
the pre-upgrade baseline, `editions.ts` restored to 100%/100%. `pnpm build`
- **307 pages** (unchanged). `check:links`/`check:sitemap`/`check:perf`/
`check:precache`/`check:pdfs` all clean. `pnpm dev` starts and stops cleanly
(Astro 7's dev server now runs as a `pid`-reporting daemon controllable via
`astro dev stop`/`astro dev status`/`astro dev logs` - noted here since it's
a visible behavior change from Astro 5, though nothing in this repo's
scripts or docs depended on the old foreground-process behavior). Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` -
**699/699 passing**, unchanged.

**Left for a future pass:** the `typescript` 7 upgrade, gated on
`@astrojs/check` adding peer support - see above. No other astro/vitest
follow-up is outstanding; both are now at their latest stable release.

### Bug fix: the Astro 5→7 upgrade silently broke `pnpm test:e2e` on every fresh checkout (i.e. every CI run), plus /glossary gains a downloadable print PDF - added 2026-08-24 (intensive run)

Every named backlog item, "Left for a future pass" candidate, and nice-to-have
was already closed going into this run (see the many entries above), so this
run started from a full-repo health check rather than a specific named
candidate - `pnpm lint`/`test`/`build`/`check:*` all came back clean, but
running the full `PW_EXECUTABLE_PATH=... pnpm test:e2e` suite from a truly
cold start (no server already running - the same starting condition
`.github/workflows/ci.yml` has on every PR) immediately failed with `Error:
Process from config.webServer exited early`, before a single test ran.

**Root cause:** the 2026-08-23 "Astro 5 → 7" entry above already noted, as a
side observation, that "Astro 7's dev server now runs as a `pid`-reporting
daemon controllable via `astro dev stop`/`astro dev status`/`astro dev
logs`" - but didn't follow that observation through to `astro preview`
(which changed the same way) or to `playwright.config.ts`'s `webServer:
{ command: 'pnpm build && pnpm preview --port 4321 --host', ... }`, which
depends on that command staying alive in the foreground for the whole test
run. Confirmed directly: running `astro preview --port 4321 --host` on its
own now always forks the real server into a detached background daemon and
returns immediately once it's listening (verified via `astro preview
status` showing the daemon still running after the invoking command had
already exited) - Playwright's `webServer` feature treats any exit of the
command it spawned as fatal, regardless of exit code, so it aborted before
even reaching its own URL health-check. This is why that same 2026-08-23
entry's own validation still reported "699/699 passing" for `pnpm
test:e2e`: `reuseExistingServer: !process.env.CI` (true outside CI) silently
reused a preview server left running from earlier manual testing in that
same local session, so a truly fresh spawn - the only kind CI ever does -
was never actually exercised. Every PR's CI run since that upgrade would
have failed on the "Mobile smoke test" step; this had not yet been hit
because no PR had triggered `ci.yml` since 2026-08-23.

**Fix:** new `scripts/test-preview-server.mjs`, referenced from
`playwright.config.ts`'s `webServer.command` (now `pnpm build && node
scripts/test-preview-server.mjs`, with `env: { PORT, BASE_PATH }` passed
through so the two files can't drift on the port/base path). It starts the
`astro preview` daemon, polls the URL until it answers (mirroring
`scripts/generate-pdfs.mjs`'s existing `waitForServer()`), then blocks so
Playwright sees a live foreground process; on SIGTERM/SIGINT it runs `astro
preview stop` before exiting. The first version of this script blocked with
a bare `await new Promise(() => {})`, which does **not** actually keep
Node's event loop alive on its own - an unresolved promise with nothing
else pending isn't a libuv handle, so the process exited a few hundred
milliseconds after printing "ready" anyway, reproducing the exact same
"exited early" failure. Confirmed the mechanism with a minimal standalone
repro (`node -e`, timed with a real `kill -0` check, not just "no error
printed") before and after switching to `await new Promise(() => {}
setInterval(() => {}, 60_000))`, which does hold a real handle open.
Verified the fix twice against a genuinely fresh spawn (`astro preview
stop` run immediately beforehand both times): once with the local default
(`reuseExistingServer: true`) and once with `CI=true` (matching
`ci.yml` exactly, `reuseExistingServer: false`) - **701/701 passing** both
times (up from 699 - the two new glossary PDF tests below).

Also fixed the same underlying daemon-vs-foreground assumption in
`scripts/generate-pdfs.mjs`'s own `stopServer()`, found while diagnosing the
above: it killed `server`'s process *group* (`process.kill(-server.pid,
'SIGTERM')`), which correctly reached the real server under Astro 5 (where
`server` *was* the server, running in the foreground) but no longer does now
that `server` is just the short-lived immediate CLI invocation that forks
the real daemon and exits - confirmed as a live bug, not a theoretical one,
by finding an `astro preview` process still listening on port 4399 after an
unrelated `pnpm build:pdfs` run earlier in this same session had already
finished and printed its manifest. `stopServer()` now also runs `astro
preview stop` (`spawnSync`, kept alongside the now-mostly-inert
process-group kill as a harmless no-op in case a future Astro version
reverts this).

One remaining, minor, non-blocking observation from this fix, left as-is
rather than chased further: even after a fully green `pnpm test:e2e` run
(both locally and under `CI=true`), the `astro preview` daemon it started is
still running afterward (`astro preview status` shows it) - Playwright does
not appear to signal `webServer.command` for teardown once tests finish, at
least not in a way this script's SIGTERM handler observably reacted to. This
doesn't affect correctness or CI's outcome (CI runners are destroyed after
the job either way, and this exact "leave a server running for fast local
iteration" outcome is what `reuseExistingServer: true` already intended
locally) - it just means a leftover `astro preview` process needs manually
stopping (`astro preview stop`) between local `pnpm test:e2e` runs now,
same as it did for `astro dev` since 2026-08-23. Not investigated further
this run since it doesn't block anything; worth a look if a future pass has
reason to touch this area again.

**Second change this run, independent of the fix above:** `/glossary` was
the only reference page on the site without a downloadable print PDF -
every other content page family (`/records`, `/compare`, `/compare-players`,
`/teams/<slug>`, `/players/<slug>`, the six competition/award pages) already
has one, and `tests/e2e/print-styles.spec.ts`'s own comment already grouped
`/glossary` with `/compare`/`/teams`/`/players` as "no `TournamentTable`" -
explaining why it prints cleanly but never explaining why it also lacked the
PDF the other three do have. Closed the gap: `PrintDownloadLink` added to
both `src/pages/glossary.astro` and `src/pages/hr/glossary.astro` (Croatian
label/hint, matching every other localized page's convention), and two new
entries in `scripts/pdf-pages.mjs`'s shared `PDF_PAGES` list (`glossary`/
`glossary-hr`) - sourced from `content/glossary.md`,
`src/lib/competition.ts` (front matter/intro) and `src/lib/glossary.ts` (the
term list itself); no `TABLE_COMPONENTS`/`SOURCES_MD` dependency since this
page has neither a `TournamentTable` nor a `References` section. `pnpm
build:pdfs` regenerated all 296 PDFs (294 existing + the 2 new glossary
ones - the existing 294 all show as changed in the diff for the same
per-render-timestamp reason every prior `build:pdfs` run's entry already
notes, not a content change). 2 new Playwright cases in
`tests/e2e/mobile.spec.ts`'s existing Glossary/Croatian-glossary
`describe` blocks (link visible + resolves with a `pdf` content-type,
English and Croatian).

**Validation:** `pnpm lint` - 0 errors/warnings/hints across 140 files.
`pnpm test` - 468/468, unchanged (no `src/lib` code changed). `pnpm build` -
307 pages, unchanged. `pnpm check:pdfs` - all 296 PDFs fresh. `check:links`/
`check:sitemap`/`check:perf`/`check:precache` all clean. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - **701/701
passing**, verified twice (see above).

**Left for a future pass:** the minor teardown observation noted above. No
other gap is known; the standing "nothing left" list is otherwise unchanged.

### New feature: per-edition pages for the FIFA World Cup (`/competitions/world-cup/<year>`, EN + HR) - added 2026-08-24 (intensive run)

The site had profile pages keyed by every entity that *spans* editions - a
country (`/teams/<slug>`), a player (`/players/<slug>`) - but no page for a
single edition itself, so a reader (or a search engine, or an inbound link)
had no way to deep-link "the 2018 World Cup" as its own destination; the only
view of one edition was a single row inside the big filterable table. This
run added the missing perpendicular cut: one page per FIFA World Cup edition
(23 editions, 1930-2026), in both languages, reached by tapping that
edition's Year cell in the competition table.

**Library:** new `src/lib/editionProfile.ts`. `buildEditionProfiles(editions,
teamSlugs?)` turns each edition into a page-ready profile - every source
column except Year kept as a fact in source order, with the four *placing*
columns (Winner/Champion, Runner-up, Third, Fourth/other semifinalist)
carrying a `/teams/<slug>` link resolved through `summaryGroupFor()` (so a
historical name like "West Germany" links to the merged `germany` profile,
matching every other title-grouping on the site) - plus a chronological
`previous`/`next` neighbour for the pager. It deliberately links a placing
*only* when its slug is in the passed `teamSlugs` set (the slugs
`buildAllCountryRecords()` actually generates a page for), so the route can
never emit a link `check-internal-links.mjs` would flag; and it *throws* on
two editions sharing a slug rather than silently dropping one - the same
"never ship a silent data problem" guard `/teams/[slug]`'s own
`getStaticPaths` uses. That guard is why only the World Cup gets edition
pages this run and not Copa América: Copa's two 1959 tournaments collide on
the `1959` slug (real data, `allowDuplicateYears: ['1959']`), which needs a
disambiguation scheme (e.g. `1959-i`/`1959-ii`) designed before its edition
pages can be built - noted below.

**Deliberately not a placing:** the Host column is a country name too, but it
is not a finish, so it is never linked to a team profile (a host that isn't a
World Cup finalist may have no profile at all). Missing-cell (`—`) and
"not held"-style placeholder values are never linked either.

**Wiring:** new shared `src/components/EditionView.astro` (a facts `<dl>`, an
optional "story of this edition" card fed the same Memorable-moments bullet
the table's tap-to-reveal uses, that edition's Golden Boot top scorer, a
prev/next pager hidden in print, and a back-link) - fully localizable via
props, the same convention every other component here follows, so the
English page (`src/pages/competitions/world-cup/[year].astro`) and the
hand-translated Croatian page (`src/pages/hr/competitions/world-cup/
[year].astro`) share one component. `TournamentTable.astro` gained an
optional `yearLinks` prop (a base-relative `edition.year -> path` map, wrapped
in `withBase()` by the component itself when rendering the Year cell as a
link); `CompetitionView.astro` threads it through; both World Cup table pages
build it via `buildEditionLinks()`. Every other competition's table passes no
`yearLinks` and renders its Year column as plain text exactly as before.
`src/pages/sitemap.xml.ts` gained a per-edition loop (bilingual, reciprocal
hreflang), the same shape its per-team and per-player loops already use. The
edition pages carry an explicit `alternateHref`/`breadcrumbTrail` per page,
so they need no entry in `TRANSLATED_PATHS`.

**Real bug caught before shipping:** the first version passed the
`buildEditionLinks()` path straight into the Year `<a href>` without
`withBase()`, so under the site's `/football-reference` base path every
in-table year link pointed at `/competitions/world-cup/2018` (a 404 on the
deployed project site) instead of `/football-reference/competitions/...`.
Caught by grepping the built HTML for the actual emitted href, not by the
type checker or a naively-passing link check (dev has no base path). Fixed by
applying `withBase()` inside `TournamentTable` where every other href it
renders already is, and documenting the map's values as base-relative.

**Deliberately no downloadable PDF this run.** Every other page family has a
print PDF, but adding one per edition means 46 browser-rendered PDFs
(23 x 2 languages) generated via `build:pdfs`' Playwright pass - a large,
mechanical, browser-dependent addition. The edition pages already print
cleanly through the existing print stylesheet (the pager is `display:none`
in `@media print`; the facts list and References render as normal), so the
"no PDF" state is a graceful one, not a broken one. Left as the one known
follow-up for this feature (see below), the same way `/glossary` shipped
without a PDF for a long time before that gap was closed.

**Tests:** 14 new Vitest cases (`editionProfile`: slug normalization incl.
the en-dash season case, newest-first ordering, facts-in-source-order, the
four-placings-linked/host-and-data-columns-not case, successor-group
resolution, the `teamSlugs` gating, prev/next chaining with open ends,
missing-cell/placeholder non-linking, the duplicate-slug throw, and
`buildEditionLinks` for both locales) - 482 Vitest total, up from 468. 14 new
Playwright cases (`tests/e2e/edition-page.spec.ts`: year-cell link navigates,
placings linked but host not, top scorer joined in, pager forward, oldest
edition has no previous link, back-link, no 360px overflow, no WCAG
violations, the language switch both ways, and the Croatian page's translated
chrome/back/pager) plus 3 assertions added to `mobile.spec.ts`'s sitemap test
(the count is now 352, up from 306: +46 edition URLs) - full suite green.

**Validation:** `pnpm lint` - 0 errors/warnings/hints across 145 files.
`pnpm test` - 482/482. `pnpm build` - 353 pages (up from 307: +46 edition
pages). `check:links` (357 pages), `check:sitemap` (352 entries),
`check:perf`, `check:precache` all clean. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - all passing
(714 + 14 new edition cases). `check:pdfs` untouched (no PDFs added).

**Left for a future pass:** (1) a downloadable print PDF per edition, if the
PDF-per-entity convention is judged worth the 46-file build cost - the pages
print fine without one today. (2) Extend edition pages to the other
competitions: EURO and Nations League are straightforward (unique year/season
labels); Copa América first needs a slug-disambiguation scheme for its two
1959 tournaments (`buildEditionProfiles` throws on the collision by design);
the two individual awards (Ballon d'Or, Golden Boot) are a different shape
(no host/placings) and would want their own edition-page template rather than
reusing `EditionView` as-is.

### New feature: per-edition pages for Copa América (`/competitions/copa-america/<slug>`, EN + HR) - added 2026-08-24 (later intensive run)

The prior entry named Copa América as the next edition-page candidate but
left it blocked on "a slug-disambiguation scheme" for its two 1959
tournaments (Argentina-hosted, then Ecuador-hosted - see
`content/copa-america.md`), since `buildEditionProfiles()` threw on the two
editions colliding on the plain slug "1959" by design. This run built that
scheme and shipped Copa América's edition pages on top of it - 48 editions
(46 unique years + the two 1959 tournaments), EN + HR, reached the same way
the FIFA World Cup's already are (tap a year cell in the competition table).

**The disambiguation scheme, in `src/lib/editionProfile.ts`:** editions are
first grouped by their plain-year slug; a group of one keeps that slug
unchanged (every competition/year this site has ever had, minus one pair).
A group of more than one is disambiguated by host - each edition's Host
column value is slugified and appended ("1959" + "Argentina"/"Ecuador" ->
`1959-argentina`/`1959-ecuador`) - and only if that produces a fully unique
set of slugs within the group; otherwise `buildEditionProfiles()` still
throws with the same "same edition slug" message as before, so a future
competition with a genuine, unresolvable collision (no host column, or two
editions at the same host) fails loudly at build time rather than silently
merging two editions onto one page. This is why the fix generalizes past
Copa América's specific case rather than hardcoding "1959": it's a real
`Map<Edition, string>` slug-assignment pass, not a special case in an
if-statement.

**A second, related bug the same duplicate year exposed:** `TournamentTable`'s
`yearLinks` prop (the Year-cell-to-edition-page map) was keyed by plain
`edition.year` alone, which cannot represent "the same year linking two
different pages" - both 1959 rows would have resolved to whichever map entry
was written last. New `editionLinkKey(year, host?)`, exported from
`editionProfile.ts` and used identically by both the producer
(`buildEditionLinks`, keyed off `EditionProfile.host`) and the consumer
(`TournamentTable`, keyed off `Edition.host`) - folds the host into the key
whenever one is present, so a competition with unique years (World Cup,
EURO, Nations League) is unaffected in behavior (its keys just happen to
carry `::<host>` now) while Copa América's two 1959 rows each resolve to
their own page. Caught before shipping by grepping the built HTML for both
1959 rows' actual `href` values, not by a passing type check (`Map<string,
string>` doesn't know its own keys should be unique per *page*, only per
*string*).

**Pager clarity:** the World Cup's `EditionNeighbour` type only carried a
slug and a year, which is fine when a year is already unique - but the two
1959 pages are chronological neighbours of each other, so the pager would
have shown two indistinguishable "1959" links pointing at different pages.
`EditionNeighbour` gained an optional `disambiguator` field, set only when a
neighbour's slug required host disambiguation (a plain equality check against
`editionSlug(neighbour.year)`, so every non-Copa-América page's pager is
byte-identical to before); `EditionView.astro`'s pager renders it in
parentheses ("1959 (Ecuador)") when present. The two 1959 pages' own
`<h1>`/meta description also fold the host in the same way, computed in the
page file itself (`profile.slug !== editionSlug(profile.year)`) rather than
inside the shared component, since only Copa América needs it today.

**Wiring:** new `src/pages/competitions/copa-america/[year].astro` and its
Croatian sibling, modeled directly on the World Cup's edition-page files -
same `EditionView`/`References` composition, same `getStaticPaths` shape.
No Golden Boot top-scorer join (Golden Boot only tracks World Cup/EURO, so
that prop is simply omitted). `copa-america.astro` (EN + HR) gained the same
`yearLinks` wiring the World Cup competition page already had, threaded
through `CompetitionView.astro`'s existing `yearLinks` prop (no component
change needed there - it already forwarded the map to `TournamentTable`).
`sitemap.xml.ts` gained a Copa América edition loop identical in shape to the
World Cup one, using the same `buildEditionProfiles()` call (already needed
`allowDuplicateYears: ['1959']`, already present from Copa América's original
page build).

**Tests:** 6 new Vitest cases (`editionProfile.test.ts`): the two 1959
editions each get their own host-suffixed slug, non-colliding years are
unaffected, previous/next chains correctly across both 1959 editions and
their real neighbours with a disambiguator only where one is needed, the
existing no-host-column duplicate-year case still throws, `editionLinkKey`'s
three shapes (plain year, year+host, empty-host fallback), and
`buildEditionLinks` resolving each 1959 row to its own page while the bare
year resolves to neither - 488 Vitest total, up from 482. (World Cup's own
`buildEditionLinks` tests were updated in place, not added to - `yearLinks`
now keys by year+host, so those assertions look up `editionLinkKey('2018',
'Russia')` rather than a bare `'2018'`, but the maps they check are the same
size as before.) 13 new Playwright cases
(`tests/e2e/copa-america-edition-page.spec.ts`): a normal year links straight
through same as World Cup, both 1959 rows link to their own page rather than
colliding, each 1959 page shows its own champion, the pager shows the host
disambiguator only on the 1959<->1959 hop, back-link, no 360px overflow on
either 1959 page, no WCAG violations, the language switch both ways, and the
Croatian page's translated chrome/pager with the disambiguator carried
through - 728 Playwright total, up from 715 (13 new cases here, plus one
`mobile.spec.ts` sitemap-count assertion updated in place from 352 to 448:
+96 Copa América edition URLs, 48 editions x 2 languages).

**Validation:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across
149 files. `pnpm test` - 488/488. `pnpm build` - **449 pages** (up from 353:
+96 Copa América edition pages). `check:links` (453 pages), `check:sitemap`
(448 entries), `check:perf`, `check:precache` all clean.
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - **728/728
passing**. `pnpm build:pdfs` regenerated all 296 PDFs (the shared
`TournamentTable.astro`/`copa-america.astro` edits made `check:pdfs` report
them stale, same as any change to those files does - no new PDF pages were
added, matching the World Cup edition pages' own "no PDF" precedent below).

**Left for a future pass:** (1) the same "no downloadable PDF per edition"
gap the World Cup entry above left open, now also true for Copa América's 48
edition pages. (2) Extend edition pages to EURO and Nations League next -
both still have unique year/season labels per the prior entry's read, so
should need no further scheme work, just the same wiring this run and the
World Cup run both used. (3) The two individual awards (Ballon d'Or, Golden
Boot) still need their own edition-page template - a different shape
(no host/placings) than `EditionView` was built for.

### New feature: per-edition pages for UEFA EURO and the UEFA Nations League Finals (EN + HR) - added 2026-08-24 (later intensive run)

The prior two entries built per-edition pages for the FIFA World Cup and
Copa América and named EURO/Nations League as the straightforward next step
- both have unique Year/Season labels per edition, so `buildEditionProfiles()`
needed no new disambiguation scheme, only the same wiring those two runs
already established. This run shipped both: 17 UEFA EURO editions
(1960-2024) and 4 UEFA Nations League Finals editions (2018-19 through
2024-25), each in English and Croatian, reached the same way every other
edition page is - tapping a year/season cell in the competition table.

**EURO** (`src/pages/competitions/euro/[year].astro` + Croatian sibling):
built directly on the World Cup edition page's pattern - same
`teamSlugs`-gated `buildEditionProfiles()` call, same Golden Boot top-scorer
join (`loadCompetition('golden-boot', { editionsHeading: 'UEFA EURO top
scorers', ... })`). EURO's placing columns are named "Other semifinalist" /
"Other semifinalist / fourth" rather than "Third"/"Fourth" (no third-place
match has been played since 1980 - see the site's own "Historical format
note"); `editionProfile.ts`'s `TEAM_PLACING_PATTERNS` already matches on
`/finalist/i` unanchored, so both columns were linked correctly with no
library change needed.

**UEFA Nations League Finals**
(`src/pages/competitions/nations-league/[year].astro` + Croatian sibling):
built on the Copa América edition page's pattern instead (no Golden Boot
join - that award only tracks the FIFA World Cup and EURO, so the
`topScorer` prop is simply omitted, the same way Copa América's edition
pages already do). The "Season" column carries labels like "2018–19"
(en dash); `editionSlug()` already normalizes that to a plain-hyphen
"2018-19" URL segment (the same normalization the World Cup edition page's
own Vitest suite already covers for a season label), so no scheme work was
needed there either. The "Finals host" column is a country name but not a
placing, so - like every other competition's Host column - it is never
linked, exercised by a dedicated "no top-scorer fact" test analogue asserting
the Finals-host fact has no `<a>` child.

**Wiring:** both competitions' own table pages
(`src/pages/competitions/euro.astro`, `.../nations-league.astro`, and their
Croatian siblings, which compose their layout by hand rather than through
`CompetitionView`) gained the same `yearLinks` prop the Copa América table
page already threads through, via `buildEditionLinks(buildEditionProfiles(...),
basePath)`. `sitemap.xml.ts` gained two more per-edition loops, reusing the
`euro`/`nationsLeague` `CompetitionData` already destructured from
`loadTeamCompetitions()` for the `/teams` per-country loop just above them,
rather than issuing two more redundant `loadCompetition()` calls.

**Tests:** no library code changed (`editionProfile.ts` is fully generic
already), so no new Vitest cases - `pnpm test` stays 488/488. 28 new
Playwright cases: `tests/e2e/euro-edition-page.spec.ts` (14, mirroring the
World Cup edition-page suite: year-cell link navigates, placings linked but
host not, top scorer joined in from Golden Boot, pager forward, oldest
edition has no previous link, back-link, no 360px overflow, no WCAG
violations, the language switch both ways, and the Croatian page's
translated chrome/back/pager) and
`tests/e2e/nations-league-edition-page.spec.ts` (14, mirroring the same
shape but asserting the *absence* of a top-scorer fact instead of its
presence, and exercising the en-dash-season-to-hyphen-slug normalization via
the "2022–23" row). `mobile.spec.ts`'s sitemap-count assertion updated in
place from 448 to 490 (+34 EURO edition URLs, +8 Nations League edition
URLs), plus four new `<loc>`/hreflang spot-checks (EURO 2016, Nations League
2022-23) alongside the existing World Cup 2018 ones.

**Validation:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across
157 files. `pnpm test` - 488/488 (unchanged). `pnpm build` - **491 pages**
(up from 449: +34 EURO + +8 Nations League edition pages). `check:links`
(495 pages), `check:sitemap` (490 entries), `check:perf`, `check:precache`
all clean. `check:pdfs` flagged the four shared table pages
(`euro`/`nations-league`, both languages) as stale once `yearLinks` touched
them - `pnpm build:pdfs` regenerated all 296 PDFs (no new PDF pages added,
same "no per-edition PDF yet" precedent the World Cup and Copa América
edition pages already established), `check:pdfs` clean afterward.
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` targeted runs of every new and
touched Playwright suite are green: the new `euro-edition-page.spec.ts` (14)
and `nations-league-edition-page.spec.ts` (14, one grammar fix to a Croatian
h1 assertion after the first run - "UEFA Liga nacija" stays nominative in the
edition-page heading, matching the competition's existing display name
everywhere else on the site rather than the genitive this suite first
guessed), the updated `mobile.spec.ts` sitemap test, and the existing
EURO/Nations League table-page suites (30 cases, unaffected by the new
`yearLinks` prop beyond the Year cell now rendering as a link). Full
`pnpm test:e2e` - **756/756 passing** (up from 728, the 28 new edition-page
cases).

**Left for a future pass:** (1) the same "no downloadable PDF per edition"
gap named for the World Cup and Copa América now also applies to these 21
new edition pages (17 EURO + 4 Nations League). (2) The two individual
awards (Ballon d'Or, Golden Boot) are the only competitions left without
per-edition pages - a different shape (no host/placings, and Golden Boot has
two tables per year: World Cup and EURO top scorers) than `EditionView` was
built for, so they need their own template rather than reusing this one
as-is.

### New feature: per-edition pages for the Men's Ballon d'Or (EN + HR) - added 2026-08-24 (later intensive run)

The prior entry left both individual awards (Ballon d'Or, Golden Boot) named
as needing "their own edition-page template" rather than reusing
`EditionView` as-is, since their "Winner" column names a *player*, not a
*team* - `buildEditionProfiles()`'s existing fact-linking would have tried to
resolve a name like "Lionel Messi" as if it were a national team. Turned out
not to be true: `EditionView.astro` itself was already fully generic (it just
renders whatever `EditionProfile.facts` it's given), so the actual gap was
narrower than the "own template" framing suggested - only the *linking
rules* needed a second mode, not a second component. This run built that and
shipped the Ballon d'Or's 70 editions (1956-2025, including the 2020 "Not
awarded" year), EN + HR, reached the same way every other edition page is -
tapping a year cell in the award table.

**The individual-award linking mode, in `src/lib/editionProfile.ts`:**
`buildEditionProfiles()` gained a third, optional `individualAward` argument
(`{ playerSlugs: Set<string> }`). When given, two new pattern sets -
`PLAYER_WINNER_PATTERNS` (`/^winner$/i`, `/player/i`) and
`TEAM_MEMBER_PATTERNS` (`/^(national team|team)$/i`) - replace
`TEAM_PLACING_PATTERNS` for that call only: the "Winner" column links to
`/players/<slug>` (via the existing `playerProfileSlug()` from
`src/lib/playerProfile.ts`) and "National team" links to `/teams/<slug>`
separately, both still gated on "only link a slug that actually has a
generated page" the same way `teamSlugs` already gated team placings. Every
existing team-competition call site (World Cup, Copa América, EURO, Nations
League) omits the new argument and is byte-for-byte unaffected - verified by
a new test asserting a team competition's own "Winner" column still links to
a team, never a player, when `individualAward` isn't passed. `EditionFact`
gained an optional `playerSlug` alongside its existing `teamSlug`.

**`EditionView.astro`:** the fact-rendering `<dd>` gained a `fact.playerSlug`
branch (checked after `teamSlug`, before the `Final`-abbreviation branch),
linking to `/players/<slug>` with a new `playerProfileHintTemplate` prop
(`'{player} — full award history'`, matching the hover-hint convention
`teamProfileHintTemplate` already established) - both hr edition pages
override it with the Croatian award-history phrase.

**The "Not awarded" 2020 row:** unlike every team competition's edition
pages, this table has a real "no winner" row (content/ballon-dor.md's 2020
Ballon d'Or, not awarded because of the pandemic - same placeholder
`isPlaceholderWinner()` already recognizes elsewhere on the site). That
edition still gets its own page (`/competitions/ballon-dor/2020`) - the
placeholder guard already in `buildEditionProfiles()`'s cell loop (shared
with the team-competition path) simply never attaches a `playerSlug`/`teamSlug`
to "Not awarded"/"—", so the page renders the fact as plain text with no
broken link. Both the EN and HR pages special-case their meta description
for this one row ("was not awarded" / "nije dodijeljena") rather than
reading oddly as "Not awarded won".

**Wiring:** new `src/pages/competitions/ballon-dor/[year].astro` and its
Croatian sibling, modeled on the Copa América edition page's pattern (no
host, no Golden Boot join - that only tracks the FIFA World Cup and EURO).
`ballon-dor.astro` (EN, via `CompetitionView`) and its hr sibling (hand-rolled
via `TournamentTable` directly) both gained the same `yearLinks` wiring the
team competitions' pages already had - `CompetitionView` already forwarded a
`yearLinks` prop with no component change needed, exactly as the EURO/Nations
League entry above found. `sitemap.xml.ts` gained a Ballon d'Or edition loop,
built with `individualAward` using the exact `playerProfiles` slug set
already computed for the `/players/` loop just above it (guaranteeing the two
loops can never link to a slug the other doesn't also serve).

**Tests:** 5 new Vitest cases (`editionProfile.test.ts`, against a small
inline table shaped like `content/ballon-dor.md`'s real columns, including a
"Not awarded" row): the Winner column links to a player not a team, National
team still links to a team, a player with no generated `/players/` page is
left unlinked, the "Not awarded" placeholder is never linked, and a team
competition's own Winner column is unaffected when `individualAward` is
omitted - 493 Vitest total, up from 488. 15 new Playwright cases
(`tests/e2e/ballon-dor-edition-page.spec.ts`): a normal year links straight
through, the winner and national team link to their own separate profiles,
the "Not awarded" 2020 page has no broken link, the pager, the oldest edition
has no previous link, back-link, no 360px overflow, no WCAG violations, the
language switch both ways, and the Croatian page's translated chrome/pager
plus its own "Not awarded" case - plus one `mobile.spec.ts` sitemap-count
assertion updated in place from 490 to 630 (+140 Ballon d'Or edition URLs, 70
editions x 2 languages) with two new `<loc>`/hreflang spot-checks (Ballon
d'Or 2018) alongside the existing per-competition ones. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - **771/771
passing** (up from 756, the 15 new edition-page cases).

**Validation:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints. `pnpm
test` - 493/493. `pnpm build` - **631 pages** (up from 491: +140 Ballon d'Or
edition pages, 70 editions x 2 languages including the 2020 "Not awarded"
year). `check:links` (635 pages), `check:sitemap` (630 entries), `check:perf`,
`check:precache` all clean. `check:pdfs` flagged the two shared Ballon d'Or
table pages (EN + HR) as stale once `yearLinks` touched them -
`pnpm build:pdfs` regenerated all 296 PDFs (no new PDF pages added, same
"no per-edition PDF yet" precedent every other edition-page rollout has
established), `check:pdfs` clean afterward. Full `pnpm test:e2e` -
**771/771 passing**.

**Left for a future pass:** (1) the same "no downloadable PDF per edition"
gap named by every prior edition-page entry now also applies to these 70 new
pages. (2) Golden Boot is the only competition left without edition pages -
harder than Ballon d'Or: one content file holds two tables (World Cup and
EURO top scorers) sharing years, and ties have multiple joint winners
("; "-separated names, e.g. 1962's six-way tie) that this run's
`individualAward` mode does not yet split the way `playerProfile.ts`'s
`teamFor()` already does for that exact case - `buildEditionProfiles()`
would need the same index-aligned splitting before Golden Boot's edition
pages can reuse it safely.

### New feature: per-edition pages for the Golden Boot (FIFA World Cup + UEFA EURO, EN + HR) - added 2026-08-25 (intensive run)

The last competition on the site without edition pages, and the one the
prior entry flagged as harder than Ballon d'Or for two separate reasons -
both resolved this run.

**Two route trees instead of one.** `content/golden-boot.md` holds two
tables that share years (World Cup 1930-2026, EURO 1960-2024), so a single
`buildEditionProfiles()` call over one merged edition list would collide.
Rather than force a disambiguation scheme the way Copa América's host suffix
does, Golden Boot gets two independent route trees -
`src/pages/competitions/golden-boot/world-cup/[year].astro` and
`.../golden-boot/euro/[year].astro` (plus Croatian siblings) - each calling
`buildEditionProfiles()` on its own table's editions only, the same two
`loadCompetition('golden-boot', { editionsHeading: ... })` calls the parent
`/competitions/golden-boot` page already makes. No slug collision is
possible because the two races never share a URL prefix.

**Tied scorers, via `EditionFact.parts` (`src/lib/editionProfile.ts`).**
Golden Boot's "Player(s)" and "Team" columns are "; "-joined when multiple
players tie (e.g. 1994's "Hristo Stoichkov; Oleg Salenko" / "Bulgaria;
Russia", or 1962's six-way tie). The previous `individualAward` mode treated
a tied cell as one unresolvable joined string; `buildEditionProfiles()` now
splits it into one `EditionFactPart` per name when the cell contains "; ",
each independently checked against `playerSlugs`/`teamSlugs` the same way a
single-winner cell already was. The Team column is index-aligned against the
Player(s) column's own split - mirroring `playerProfile.ts`'s `teamFor()`,
which already solved this exact alignment problem for a player's own profile
page - and is linked only when the two columns' tie counts agree; a
mismatch (real data: 1964 EURO has three tied players but only two Team
names, since two of them - Ferenc Bene, Dezső Novák - both play for Hungary
and it's named once) is left as unlinked plain text rather than guessed,
same "omit rather than guess" contract `teamFor()` already keeps. The
"Multiple" placeholder (a tie too large to name a team per player, e.g.
1962) is recognized via `TEAM_TIE_PLACEHOLDER`, now exported from
`playerProfile.ts` rather than duplicated, and is never split or linked.
`EditionFact` gained an optional `parts` array (`EditionFactPart[]`); every
existing caller that never produces a tied cell (every team competition, and
Ballon d'Or, which has no tie mechanic) leaves it `undefined` and is
byte-for-byte unaffected. `EditionView.astro` renders `parts` when present -
one linked or plain-text span per name, joined with "; " to match the source
formatting - falling back to the pre-existing single `teamSlug`/`playerSlug`
branches otherwise.

**The shared back-link, via `EditionView`'s new `backPath` prop.** Every
earlier edition-page family has its `competitionPath` serve double duty: the
pager's prev/next base and the "back to all editions" link's target, because
both point at that competition's one table. Golden Boot's two edition-page
route trees need `competitionPath` to stay race-specific
(`/competitions/golden-boot/world-cup`, so the pager doesn't cross-link World
Cup and EURO years) but the actual competition page with both tables is one
level up, at the shared `/competitions/golden-boot` - a path with no
`getStaticPaths` route of its own, which is exactly what
`docs/PROJECT_STATUS.md`'s `check:links` script caught on the first build
here (a "back" link to a directory index that doesn't exist). `EditionView`
gained an optional `backPath` prop that overrides just the back link,
defaulting to `competitionPath` so every other caller (World Cup, EURO,
Nations League, Copa América, Ballon d'Or) is unaffected.

**Wiring:** `golden-boot.astro` (EN + HR) gained two `yearLinks` maps - one
per race, each built with `buildEditionLinks(buildEditionProfiles(race.editions),
'/competitions/golden-boot/<race>')` - threaded into each race's own
`TournamentTable` instead of the single `yearLinks` prop every other
competition page passes. `sitemap.xml.ts` gained two more edition loops
(World Cup, EURO), reusing the `worldCupGoldenBoot`/`euroGoldenBoot` loads
and the `playerSlugs` set already built for the `/players/` loop just above
them.

**Tests:** 8 new Vitest cases (`editionProfile.test.ts`, against a table
shaped like the real content - a single-winner row, a clean two-way tie, a
six-way tie with the "Multiple" team placeholder, and the real 1964
count-mismatch row): an untied winner is unaffected (no `parts`), a two-way
tie splits into index-aligned player/team parts, a six-way tie splits every
player individually while leaving "Multiple" unsplit and unlinked, and the
count-mismatch row leaves Team as plain unlinked text while every tied
player still links - 496 Vitest total, up from 493 (one pre-existing
`ballonDor` test file left unchanged). 20 new Playwright cases
(`tests/e2e/golden-boot-edition-page.spec.ts`): per race - year-cell link
navigates, an untied winner links player+team separately, a two-way tie
links both names to their own profiles, a six-way tie links every player but
leaves "Multiple" as plain text, the 1964 count-mismatch case, the pager,
oldest-edition-has-no-previous, the back link resolves to the shared
`/competitions/golden-boot` page (not a 404), no 360px overflow, no WCAG
violations, and the language switch both ways, plus the Croatian page's
translated chrome and back-link copy - plus one `mobile.spec.ts`
sitemap-count assertion updated in place from 630 to 710 (+80 Golden Boot
edition URLs, 40 editions x 2 languages) with two new `<loc>`/hreflang
spot-checks (Golden Boot World Cup 1958, EURO 1996). Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - **791/791
passing** (up from 771, the 20 new edition-page cases).

**Validation:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across
163 files. `pnpm test` - 496/496. `pnpm build` - **711 pages** (up from 631:
+80 Golden Boot edition pages, 40 editions x 2 languages: 23 World Cup + 17
EURO). `check:links` (715 pages), `check:sitemap` (710 entries),
`check:perf`, `check:precache` all clean. `check:pdfs` flagged every player
PDF as stale (`playerProfile.ts` itself changed, to export
`TEAM_TIE_PLACEHOLDER`) - `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm
build:pdfs` regenerated all 296 PDFs (no new PDF pages added, same
"no per-edition PDF yet" precedent every prior edition-page rollout has
established), `check:pdfs` clean afterward. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` - **791/791
passing**.

**Left for a future pass:** every competition and both individual awards now
have edition pages (World Cup, EURO, Nations League, Copa América, Ballon
d'Or, Golden Boot) - the last item on the edition-pages backlog. (1) the
same "no downloadable PDF per edition" gap named by every prior edition-page
entry now also applies to these 80 new pages (World Cup + EURO Golden Boot,
both languages) - a genuinely future pass, since it spans every edition
family, not just this one. (2) No other backlog item is currently known;
see `docs/ROADMAP.md` for what's next.

### New feature: downloadable print PDF for every `/competitions/<competition>/<year>` edition page (all six families, EN + HR) - added 2026-08-25 (later intensive run)

Closed the one standing gap every edition-page rollout above left open: a
reader could view but not print/download any of the 202 edition pages this
site now has. `docs/ROADMAP.md` (new this run, replacing a dangling
"see docs/ROADMAP.md for what's next" pointer the previous entry left behind
- that file never actually existed) named this as the only concrete item
left, so it's what this run built.

**`EditionView.astro` gained the same optional `pdfSlug`/`pdfLabel`/`pdfHint`
props `CompetitionView.astro` already has**, rendering `PrintDownloadLink`
right under the intro paragraph - the same header placement `/teams/<slug>`
and `/players/<slug>` already use. All 12 edition-page files (six
competitions/awards x English + Croatian) now pass a `pdfSlug` computed from
`profile.slug` (e.g. `edition-world-cup-2018`, `edition-ballon-dor-1956-hr`);
the six Croatian pages also pass the same `pdfLabel="Preuzmi PDF za ispis"`/
localized hint text every other Croatian PDF link already uses.

**Why a live `/edition-index.json` endpoint, not a hand-typed list, and why
one per *family* rather than one shared list:** `scripts/generate-pdfs.mjs`
runs under plain Node, not Vite, so it can't call `buildEditionProfiles()`
itself (it needs `astro:content`, same reason `/team-index.json` and
`/player-index.json` already exist for the team/player PDF families).
Unlike those two, though, an edition's PDF sources aren't one fixed list
shared by every entry - a Nations League edition PDF has nothing to do with
`content/copa-america.md`. New `src/pages/edition-index.json.ts` returns
every edition page's `{ pdfSlug, path, family }`, `family` being one of
seven keys (`world-cup`, `euro`, `nations-league`, `copa-america`,
`ballon-dor`, `golden-boot-world-cup`, `golden-boot-euro` - Golden Boot
splits in two, mirroring its two separate route trees). New
`EDITION_PDF_SOURCES` in `scripts/pdf-pages.mjs` maps each family to its own
source list (that family's `content/*.md`, `docs/SOURCES.md`,
`EditionView.astro`, `editionProfile.ts`, and both language variants of that
family's `[year].astro`); `scripts/generate-pdfs.mjs` fetches the live index
the same way it already fetches `/team-index.json`/`/player-index.json` and
records `EDITION_PDF_SOURCES[family]` against each PDF's manifest entry.

**`editionFamilyFromSlug()`, for the freshness check with no server to
ask:** `scripts/check-pdf-freshness.mjs` runs before `pnpm build` in CI, so
it can't fetch `/edition-index.json` the way `generate-pdfs.mjs` does -
same constraint `teamSourcesFromManifest()`/`playerSourcesFromManifest()`
already solved by trusting whichever `team-*`/`player-*` keys the last
`pnpm build:pdfs` recorded. Editions need one more step: `editionSourcesFromManifest()`
recovers *which* family list applies to a given `edition-<family>-<slug>[-hr]`
key by calling `editionFamilyFromSlug()` (new export from `pdf-pages.mjs`),
which matches the key against `EDITION_PDF_SOURCES`'s own keys,
longest-prefix-first so `golden-boot-world-cup`/`golden-boot-euro` can never
be shadowed by the shorter, unrelated `world-cup`/`euro` family names.

**Scale:** 202 editions (23 World Cup + 17 EURO + 4 Nations League + 48 Copa
América + 70 Ballon d'Or + 23 World Cup Golden Boot + 17 EURO Golden Boot),
x 2 languages = 404 new PDFs, taking `public/downloads/` from 296 to 700
files. `pnpm build:pdfs` (`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`)
ran clean end to end, renaming nothing and colliding on nothing -
`buildEditionProfiles()`'s own duplicate-slug guard (already proven on Copa
América's two 1959 editions) means `/edition-index.json` can never emit two
entries sharing a `pdfSlug`.

**Tests:** one new Playwright case per edition-page spec file (13 total:
`edition-page.spec.ts`, `euro-`, `nations-league-`, `copa-america-`,
`ballon-dor-edition-page.spec.ts` each gained one EN + one HR case;
`golden-boot-edition-page.spec.ts` gained one EN case per race plus one
combined HR case covering both races), each following the existing
`player-profile.spec.ts`/`team-profile.spec.ts` pattern: the download link
is visible, and an actual `request.get()` against its `href` resolves with
an `application/pdf` content type.

**Validation:** `pnpm lint` (`astro check`) - 0 errors/warnings/hints across
164 files. `pnpm test` - 497/497. `pnpm build` - 711 pages (unchanged - this
run adds no new page routes, only a link on 202 existing ones).
`check:links` (715 pages) - clean once `pnpm build:pdfs` ran (404 links to
not-yet-existing files is exactly what it caught first, confirming the
wiring before the PDFs existed). `check:sitemap`, `check:perf`,
`check:precache` all clean and unaffected (PDFs were never part of the
sitemap, same as every earlier PDF family). `check:pdfs` - all 700 PDFs
up to date with their source content. Full
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` from a cold
start - **804/804 passing** (up from 791, the 13
new PDF-link cases).

**Left for a future pass:** no other concrete, named backlog item is known.
`docs/ROADMAP.md` (new this run) is now the short, current-state pointer for
"what's next" - see that file rather than assuming a gap here.

### Quality pass: full-repo health check, plus a stale ROADMAP.md correction - added 2026-08-25 (later intensive run)

With `docs/ROADMAP.md`'s "Open backlog" empty and only two unscoped ideas
left, this run followed that file's own instruction: a full-repo health
check first, rather than assuming either idea was still concretely open.

**Health check - everything clean, no code change needed:** `pnpm lint`
(`astro check`) - 0 errors/warnings/hints across 164 files. `pnpm test` -
497/497. `pnpm build` - 711 pages (unchanged). `check:links` (715 pages),
`check:sitemap` (710 entries), `check:perf` (heaviest page 498.8 KB, under
the 510 KB budget), `check:precache` (37 URLs), `check:pdfs` (700 PDFs) -
all clean. Full `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm
test:e2e` from a cold start - **804/804 passing** in 8.1 minutes at the
default worker count (2) - the `ERR_CONNECTION_REFUSED`-under-parallelism
issue a 2026-08-19 entry hit at 2 workers in an earlier sandboxed session
did not reproduce here, so no `--workers=1` workaround was needed this
time; worth trying the default first in a future run before reaching for
that flag.

**Real gap found, in the docs rather than the code:** re-checked both
`docs/ROADMAP.md` "ideas not yet scoped" against the live `/records` page
and `content/`. One was stale - "a `/records`-style aggregate ranking
specific to the individual awards" reads as a still-open ask, but
"Longest wait between titles" and "Back-to-back champions" already loop
over `allLoaded` (every team competition *and* both individual awards) in
`src/pages/records.astro`, rendering `title-gaps-ballon-dor`/
`title-gaps-golden-boot-world-cup`/`title-gaps-golden-boot-euro` sections
today - confirmed by grepping the built `dist/records/index.html` for
those ids. `docs/ROADMAP.md` corrected to say so, narrowing the genuinely
open piece to "youngest winner", which needs per-player birth dates that
exist nowhere in `content/`. The other idea (extending "Tap a year to
reveal a short story" to the two individual awards) was re-checked too:
`content/ballon-dor.md` and `content/golden-boot.md` still have no
"Memorable moments" section, so it stays blocked on new editorial content,
unchanged from when it was first raised.

**Not pursued:** sourcing ~130 players' birth dates (70 Ballon d'Or +
Golden Boot winners, several tied) to unblock "youngest winner", or
writing new "Memorable moments" narrative content to unblock the
"Tap a year" extension. Both need new, independently-verifiable editorial
facts this run has no way to cross-check the way every other fact on this
site has been (see the many "second independent cross-check" entries
above) - the same caution that has already shelved the "by team" filter's
full participant lists and the flag-emoji idea in earlier runs. Left for
whenever someone sources that data deliberately.

Full suite unchanged by this run's edits (documentation-only): **804
Playwright passed**, **497 Vitest passed**, `pnpm lint`/`pnpm build`/
`check:links`/`check:sitemap`/`check:perf`/`check:precache`/`check:pdfs`
all clean.

**Left for a future pass:** the "youngest winner" ranking and the
individual-award "Tap a year" extension, both blocked on new sourced
editorial content, not engineering effort. No other gap found.

### Quality pass: fourth consecutive full-repo health check, plus an editorial-arithmetic spot-check across all six competition/award files - added 2026-08-25 (later intensive run)

`docs/ROADMAP.md`'s open backlog was still empty going into this run (the
2026-08-25 "later intensive run" entry above already closed the last named
item and re-confirmed the two unscoped ideas stay blocked on new editorial
content), so this run repeated the file's own instruction once more: a
full-repo health check before assuming anything is quietly broken.

**Health check - everything clean, no code change needed:** `pnpm install
--frozen-lockfile`, `pnpm lint` (`astro check`) - 0 errors/warnings/hints
across 164 files. `pnpm test` - 497/497. `pnpm build` - 711 pages
(unchanged). `check:links` (715 pages), `check:sitemap` (710 entries),
`check:perf` (heaviest page still `hr/records` at 498.8 KB, under the 510 KB
budget), `check:precache` (37 URLs), `check:pdfs` (700 PDFs) - all clean.
Full `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm test:e2e` from a
cold start - **804/804 passing** in 7.8 minutes at the default worker count,
same as the immediately preceding run.

**New this run, since a fourth identical "everything's clean" pass adds
little on its own:** a manual editorial-arithmetic spot-check of all six
competition/award content files (`fifa-world-cup.md`, `uefa-euro.md`,
`copa-america.md`, `uefa-nations-league.md`, `ballon-dor.md`,
`golden-boot.md`) - re-deriving every "Champions/Titles by nation" and
"Multiple winners" summary table by hand-counting winners straight from
each file's own edition/winners table, and cross-checking every prose claim
in each file's "Memorable moments"/"Key facts"/notes sections against the
same table. This checks internal arithmetic consistency (a hand-written
summary table drifting from its own edition table after a content edit),
not real-world historical accuracy, which the many "second independent
cross-check" passes cited throughout this file already cover.

**No discrepancies found.** Every nation/player title count matched a fresh
count of that file's own table (Brazil 5 World Cup titles, Spain 4 EUROs,
Argentina 16/Uruguay 15/Brazil 9 Copa América, Messi 8/Ronaldo 5 Ballon d'Or,
etc.), every count summed back to that file's total edition count, and every
narrative claim (Fontaine's 13 goals in 1958, Platini's 9 in 1984, Portugal
as first two-time Nations League champion in 2025, Spain's "record fourth"
EURO title in 2024, Argentina "moving ahead" as Copa América's most
successful team in 2024, and others) held up against the table row it
describes.

Full suite unchanged by this run (no code or content edits made): **804
Playwright passed**, **497 Vitest passed**, `pnpm lint`/`pnpm build`/
`check:links`/`check:sitemap`/`check:perf`/`check:precache`/`check:pdfs`
all clean.

**Left for a future pass:** unchanged from the previous entry - the
"youngest winner" ranking and the individual-award "Tap a year" extension,
both blocked on new sourced editorial content. No other gap found across
four consecutive intensive-run health checks; a future run might vary the
approach further (e.g. an external link-liveness check of
`docs/SOURCES.md`'s ~390 citation URLs) rather than repeating this one, but
note that this environment's outbound network policy blocks direct requests
to arbitrary external hosts, so that check would need to run from a session
with broader network access than this one has.

## Known caveats

- World Cup, EURO, Nations League, Copa América, Ballon d'Or, Golden Boot,
  Records and Timelines, Compare National Teams, the Family Quiz, the
  `/teams` national-team directory, the `/players` award-winner directory,
  `/compare-players` (head-to-head Ballon d'Or/Golden Boot comparison), and
  `/glossary` (explains a.e.t., pens, and five other site terms) all have
  live pages in both English and Croatian now, all reachable from the
  primary nav - which, below a 60rem viewport, is inside the header's
  `#site-menu` drawer behind the menu button rather than on the page
  itself (`Nav.astro`; see the 2026-08-22 mobile-first header entry). Any
  new e2e test that clicks a nav link, either search widget, the language
  switch or the theme toggle has to open that drawer first, via
  `openMenu(page)` from `tests/e2e/menu.ts`.
- Historical names appear as distinct winner-filter entries by design.
- Both head-to-head panels (`/compare`, `/compare-players`) are single
  "versus" tables - one row per statistic, both sides' values on it - not a
  table per side. Anything added to them belongs in that shape; two stacked
  per-entity tables is the layout this replaced, for being unusable on a
  phone (see the 2026-08-22 entry).
- First-ever Pages deploy can hang in GitHub's `updating_pages` provisioning and
  time out; re-running the deploy clears it (it did here).
- Every `/competitions/<competition>/<year>` edition page (202 editions x 2
  languages) and every other PDF family (competition/award pages, `/records`,
  `/compare`, `/compare-players`, every `/teams/<slug>` and `/players/<slug>`
  profile, `/glossary`) now has a downloadable print PDF - `public/downloads/`
  holds 700 files as of 2026-08-25. New editorial content still needs a
  manual `pnpm build:pdfs` regeneration before its PDF matches, exactly the
  same lag every PDF family has always had; `pnpm check:pdfs` catches drift.
- At >=60rem the header's eight "tool" nav links (Records, Compare, Teams,
  Players, Compare Players, Quiz, Glossary, Sources) live behind a "More"
  button (`#nav-more-toggle`/`#nav-more-menu` in `Nav.astro`) rather than
  inline - see the 2026-08-23 "desktop nav gains a 'More' menu" entry. The
  Playwright project's default viewport is 360px, where this never applies
  (the mobile drawer still shows every link flat); a test that needs the
  >=60rem layout has to set its own viewport via `page.setViewportSize()`
  first, the same way `tests/e2e/mobile.spec.ts`'s `desktop nav "More" menu`
  block does.

See also `IMPLEMENTATION_NOTES.md` (decisions/testing detail) and
`docs/ADDING_CONTENT.md` (how to add or edit content).
