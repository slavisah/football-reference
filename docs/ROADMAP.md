# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full run-by-run history of every feature, bug fix,
verification sweep and decision (264 intensive runs as of 2026-10-10) lives
in `docs/PROJECT_STATUS.md` (append-only, one entry per change); this file
only tracks the open backlog and current-state summary, not the log of what
already shipped.

**Maintenance note (2026-09-20, hundred-and-fifty-seventh intensive run):**
this file had grown to 7,093 lines by appending a full run-by-run log under
"Open backlog"/"Ideas not yet scoped as backlog" instead of just tracking
current state - the opposite of the "kept short on purpose" goal stated
above, and increasingly expensive for every run to read before it can even
start working. Trimmed back down to the genuinely open items at the time;
nothing was lost - every entry removed already had its own full, matching
entry in `docs/PROJECT_STATUS.md`, which remains the authoritative full
history.

**Second maintenance note (2026-10-03, two-hundred-and-twenty-first intensive
run):** the same drift happened again - runs 170 through 220 had each kept
appending their own narrative paragraph to this file's "Status" section
(bold-lettered "**Nth run:**" blocks) instead of writing only to
`docs/PROJECT_STATUS.md`, regrowing this file to 2,793 lines despite the note
above. Trimmed back down again to a single current-state summary; nothing
lost - every one of the 51 removed run-paragraphs was individually confirmed
to already have its own full, matching `docs/PROJECT_STATUS.md` entry
(spot-checked across the full range: the hundred-and-seventieth, -eightieth,
-ninetieth, two-hundredth and two-hundred-and-tenth runs all have exactly the
entries their own cross-references in this file claimed) before removal. The
instruction from the first maintenance note was correct but evidently not
followed by habit alone - restated more concretely below.

**Third maintenance note (2026-10-10, two-hundred-and-sixty-third intensive
run):** the same drift happened a third time, this time unprefixed by a bold
"**Nth run:**" marker, which is presumably why it survived two intervening
cleanups - runs 222 through 262 kept extending the "Status" section's prose
with "the two-hundred-and-Nth run..." sentences instead of writing only to
`docs/PROJECT_STATUS.md`, regrowing it to 224 lines. Trimmed back down again
to a current-state-only summary; nothing lost - every run number named in the
removed prose (spot-checked: 223 through 262 inclusive, plus 241-251) has its
own matching `### ` entry in `docs/PROJECT_STATUS.md`. Two prior notes
weren't enough because both restated the rule only in prose; this run also
found no code or doc mechanism that would actually prevent a future run from
repeating this a fourth time, so flagged it in this run's own notification as
something worth the user's attention rather than assuming a third restatement
sticks where two didn't.

**Going forward: a run closes a backlog item by deleting its bullet below**
(after confirming its `docs/PROJECT_STATUS.md` entry exists), and records
what it did *only* in `docs/PROJECT_STATUS.md` (a new `### ` entry there,
following that file's own existing format) - never by appending a "this
run did X" paragraph to this file, under "Status", "Open backlog", or
anywhere else. If the "Status" summary below goes stale (a new page type
ships, a count changes), edit the summary's own prose in place rather than
appending a dated addendum under it. This file should only ever grow when a
genuinely new, still-open backlog item or idea is added.

## Status: original backlog complete, in ongoing maintenance

Every milestone named in `AGENTS.md`'s "Recommended first milestone" and
every requirement in `docs/WEBSITE_REQUIREMENTS.md` is live, in English and
Croatian: all six competition/award pages (FIFA World Cup, UEFA EURO, UEFA
Nations League, Copa América, Men's Ballon d'Or, Golden Boot), `/records`,
`/compare`, `/compare-players`, `/teams/<slug>` and `/players/<slug>` profile
directories, `/glossary`, the Family Quiz, per-edition pages for every
competition and both individual awards (`/competitions/<competition>/<year>`),
light/dark mode, a print stylesheet, downloadable print PDFs (700, one per
page - tagged/PDF-UA structured, with page numbers, an `/Author`, and a
cross-reference pager between adjacent editions), a PWA/offline mode, an
Atom feed (`/feed.xml`, `/hr/feed.xml`) of recently-reviewed pages, and an
"On this day" widget. See `docs/PROJECT_STATUS.md`'s "Known caveats" section
for a summary of what exists and any standing quirks; a run that ships a
genuine standing quirk or a new permanent check should add its own bullet
there in the same pass.

The standing health check (`pnpm install`/`pnpm outdated`, `pnpm lint`/`pnpm
test`/`pnpm test:coverage`/`pnpm build`, all 44 `check:*` scripts, `pnpm
audit`, `pnpm dlx knip --no-config-hints`) comes back clean run after run.
34 of the `check:*` scripts are fast enough to run every time and are wired
into `.github/workflows/ci.yml` as required PR gates; the other ten
(`check:html`/`check:lighthouse`/`check:reflow`/`check:landscape`/
`check:text-zoom`/`check:print-width`/`check:target-size`/
`check:text-spacing`/`check:focus-appearance`/`check:color-contrast`) are
full-site Playwright/browser sweeps kept manual/intensive-run-only rather
than a required PR gate, purely for their ~700-to-1,400-page-load runtime -
re-run periodically (most recently Run 264: 9 of 10 clean; `check:color-
contrast` alone - the heaviest, 1,422 page loads - ran over 30 minutes
without finishing in this session's container and was killed rather than
re-run with a longer allowance, so it's unconfirmed this round rather than
failing; a future run should give it up to the 2-hour background budget
before concluding anything's actually wrong) rather than on every change.
`knip` shows exactly one standing false positive (`@cspell/dict-hr-hr`,
used only via `.cspell/hr-notes.cspell.json`'s `"import"` field, never a JS
`import` knip's static analysis can see). Current counts (confirmed fresh
this run): 1071 unit tests, `pnpm lint` at 0 errors/0 warnings/0 hints, 711
pages built; 1055 Playwright e2e tests as of the last full cold-start run
(Run 254).

The content-verification rotation (re-check whichever content file has
gone longest since its last `lastReviewed` bump, cross-checking claims
against the file's own tables and, for recent events, live `WebSearch`
results) is an ongoing loop, not a one-off pass - every content file has
now been through it at least once, most within the last two days (see
`content/*.md`'s own `lastReviewed` frontmatter for the current state). It
has found two real bugs so far (a `glossary.md` "third and fourth place"
overgeneralization, and a `glossary.md` "host" entry that had the FIFA
World Cup/UEFA EURO automatic-host-place rule backwards) - a future run
should keep picking the next-longest-stale file.

Every generated/derived page has its own independent-recomputation guard,
wired into CI, that cross-checks its output against `content/*.md` rather
than trusting the page's own rendering: `/records` (`check-records-against-
source.mjs`), `/teams/<slug>` (`check-team-profiles-against-source.mjs`),
`/players/<slug>` (`check-player-profiles-against-source.mjs`), and
`/compare`/`/compare-players` (`check-compare-against-source.mjs`) - zero
discrepancies found by any of them since they shipped. The quiz's generated
question-type surface covers every `/records` ranking; no further untried
ranking remains as a quiz-question candidate. A performance pass
(`check:lighthouse` already 1.00/1.00/1.00/1.00, bundle sizes already tiny
with no web fonts/images) has found no further low-hanging fruit. See "Open
backlog" and "Ideas not yet scoped" below for everything still open. For
the full run-by-run history behind all of this, see
`docs/PROJECT_STATUS.md`.

## Open backlog

- **`check:color-contrast` re-confirmation**: unconfirmed, not failing. Run
  264 tried to re-run all ten manual browser sweeps and got clean results on
  nine; `check:color-contrast` (1,422 page loads, the heaviest sweep) was
  still running past the 30-minute background allowance that run gave it and
  was killed rather than left to finish, so this round has no result for it
  either way. The other nine sweeps' own axe-core/Playwright machinery ran
  fine at normal speed in the same container, so this looks like this one
  script being slow in this session rather than a hang - but that's not
  confirmed. Next run: give it the full 2-hour background budget before
  concluding anything (good or bad).
- **2026 Ballon d'Or edition**: not due yet, not blocked. The two-hundred-
  and-forty-first run confirmed via `WebSearch` that the ceremony is
  scheduled for 26 October 2026 in London (its first time outside Paris) -
  `content/ballon-dor.md`'s `lastCompletedEdition: 2025` is correct as of
  this run's date (2026-10-06). Re-check once that date has passed.
- **`typescript` 7 upgrade**: blocked. `@astrojs/check@0.9.10` (latest
  published) only declares `typescript: '^5.0.0 || ^6.0.0'` as a peer
  dependency - re-confirmed via `pnpm outdated` as recently as the
  two-hundred-and-thirteenth run (2026-10-02; `typescript` still at 5.9.3 vs.
  7.0.2 latest, no new `@astrojs/check` release). Re-check whenever `pnpm
  outdated` next shows a new `@astrojs/check` release.
- **`docs/SOURCES.md` link-liveness sweep**: blocked. This environment's
  outbound network/egress policy rejects direct requests to external
  reference domains - confirmed repeatedly, most recently 2026-10-02
  (two-hundred-and-thirteenth run: `WebFetch` to `en.wikipedia.org` still
  returns `EGRESS_BLOCKED` from the proxy), and precisely scoped: `WebFetch`
  to `en.wikipedia.org` *and* `www.uefa.com` both return `EGRESS_BLOCKED`
  from the proxy (not a Wikipedia-specific block), so this is a general
  block on direct fetches to reference domains, not one site's policy.
  `WebSearch` itself *does* work in this environment (confirmed 2026-09-21)
  and returns synthesized, sourced snippets - but that is no substitute for
  a live status-code check of each `docs/SOURCES.md` link, which is what
  this item needs. Still needs a session with `WebFetch`/direct-fetch
  access.
- **`long-title` brand-suffix decision**: needs human sign-off, not an
  automated fix. `check:html`'s `long-title` rule is disabled
  (`scripts/check-html-validity.mjs`'s `DISABLED_RULES`) because 133 pages
  exceed ~70 characters from the site's own deliberate branded `<title>`
  suffix - a conscious content decision, not a bug, but whether to shorten it
  is a brand-identity call this routine won't make unattended.
- **UEFA Nations League Team of the Tournament, 2021/2023/2025**: no
  reliable single source names an official XI for these three editions
  (unlike 1996-2024's EURO equivalent, or Copa América's own section) -
  checked across 6+ separate intensive runs, confirmed exhausted without new
  network access. Re-tried with `WebSearch` the hundred-and-sixty-second run
  (2026-09-21): it surfaces a Player of the Tournament (Rodri, 2023) but no
  complete eleven-name Best XI for any of the three editions - same negative
  result as every prior run's attempt, now via a tool that does have live
  web access, not just a knowledge-cutoff limitation. Genuinely exhausted
  short of a UEFA technical-report PDF this environment cannot fetch.
- **UEFA Nations League attendance figures**: the 2023 Finals attendance has
  a genuine source conflict (41,110 vs. 41,500, both independently reported
  by different outlets); 2021 has no attendance figure confirmed by two
  independent sources; 2025 *now has* a second source (the German FA's own
  `datencenter.dfb.de` match database, found the two-hundred-and-fifty-first
  run) but it disagrees with Wikipedia's 65,852 by roughly 9,000 (a rounded
  "sold out" 75,000) - too wide a gap to treat as the usual rounding/
  reporting variance, so still a conflict rather than a confirmation; see
  `content/uefa-nations-league.md`'s own 2025 bullet and `docs/SOURCES.md`'s
  matching entry for the specifics. Left unreported in
  `content/uefa-nations-league.md` rather than guessed. Re-tried with
  `WebSearch` the hundred-and-sixty-second run (2026-09-21): every result for
  all three editions traces back to the same Wikipedia-derived figure
  (41,110 for 2023, 31,511 for 2021) with no second, independently-*sourced*
  figure turning up in the search snippets themselves (only mirrors/
  derivatives of the one figure) - so this still doesn't clear the site's own
  two-independent-sources bar. `WebFetch` to `uefa.com` (which might carry
  the tournament's own official figure) is blocked (see the link-liveness
  item above), so there's no way to read a second primary source directly,
  only search-engine summaries of one.
- **Excluded historical attendance figures**: World Cup 1930 and 1950, and
  EURO 1996 and 2020, each have no single attendance figure with a source
  reliable enough to report - left out of their "Final venues" sections on
  purpose.
- **Hyphenation-rendering visual re-check** (flagged hundred-and-twenty-sixth
  run, 2026-09-15): this environment's Chromium (both the Playwright-bundled
  build and `/opt/pw-browsers/chromium`) lacks ICU hyphenation-pattern data,
  so `hyphens: auto` never actually hyphenates here, confirmed directly
  rather than assumed. Needs a real browser with full ICU data to visually
  verify hyphenation renders as intended wherever the site's CSS requests it.
- **Coverage gaps, defensively unreachable (not a bug, re-confirmed
  2026-10-02)**: `quiz.ts` (five lines as of the two-hundred-and-sixteenth
  run - `mostTitlesQuestion()`'s, `biggestFinalMarginQuestion()`'s,
  `longestStreakQuestion()`'s and `longestTitleGapQuestion()`'s own
  `if (!choice) return []` guards, joined this run by the identically-shaped
  guard in the new `mostFrequentRivalryQuestion()`), `sources.ts` (two lines -
  `disambiguateLabels()`'s `counts.get(base) ?? 1`
  fallback joins the previously-documented `baseLabel`-lookup line),
  `tableSort.ts` and `url.ts` each have one or two branches that an
  argument's own invariants make unreachable in practice (e.g. `sources.ts`'s
  fallback can never actually miss, since `counts` is built by iterating the
  exact same array being mapped afterward). Left as-is per the eighth
  intensive run's original classification; re-verify line numbers next time
  any of these four files changes materially. `contentPages.ts`'s own low
  raw number (29% statements) looks like a fifth case but isn't the same
  kind of gap - investigated and explained by the two-hundred-and-
  forty-second run: its `loadFeedEntries()`/`loadDerivedPageSources()` are a
  deliberate build-only integration-test choice (same as `sitemap.xml.ts`,
  documented in `tests/unit/contentPages.test.ts`'s own header comment), not
  an untested pure-function branch - no action needed, don't re-investigate.

## Ideas not yet scoped

- **"Youngest winner" ranking** (`/records`-style, alongside the existing
  "Longest wait between titles"/"Back-to-back champions" sections): still
  not built as a full ranking - would need a reliable per-player birth date
  for all ~130 Ballon d'Or/Golden Boot winners, which exists nowhere in
  `content/` today, and fabricating that many biographical facts in one
  unattended pass (with no independent per-player source to cross-check each
  one against) still risks shipping confidently-wrong history. Two narrower,
  lower-risk slices have shipped instead so far: the two-hundred-and-
  thirteenth run added Ballon d'Or's own two extremes (Stanley Matthews,
  oldest-ever, 1956, age 41; Ronaldo/Brazil, youngest-ever, 1997, age 21),
  and the two-hundred-and-fortieth run added Golden Boot's (Flórián Albert,
  World Cup youngest-ever, 1962, age 20; Davor Šuker, World Cup oldest-ever,
  1998, age 30; Cristiano Ronaldo, EURO oldest-ever, 2020, age 36 - EURO's
  own youngest-ever fact came back from two WebSearch passes without a
  single converging figure, so was left out rather than guessed). Each fact
  is a single, already-synthesized, widely-and-consistently-reported record
  independently confirmed via two separate WebSearch passes (see
  `docs/SOURCES.md`'s matching entries), a fundamentally safer research task
  than computing an age from a raw birth date for all ~130 winners with no
  cross-check. Still open: the EURO Golden Boot youngest-ever fact (needs a
  source that actually converges - re-try with a fresh query next time), and
  the full generated ranking (every winner, not just the extremes), which
  still needs either a trustworthy bulk birth-date source or a session with
  direct page-fetch access to verify one player at a time at that scale.
  The two-hundred-and-forty-third run tried a narrower angle on the EURO
  fact specifically - computing candidate ages from each single, outright
  winner's own birth date and that edition's final date, rather than
  searching the aggregate "youngest-ever" claim directly - and got far
  enough to name three closest candidates (Dragan Džajić, 1968; Dieter
  Müller, 1976; Milan Baroš, 2004) before a `WebSearch` pass for Müller's
  birth date contradicted this session's own assumed one, which is exactly
  why it stopped there rather than ship a figure from a single unverified
  pass - the three names are a starting point for a future run with
  independent-source-verification access, not a result. See
  `docs/PROJECT_STATUS.md`'s run-243 entry for the full reasoning. The
  two-hundred-and-fiftieth run widened the candidate search to *joint*
  winners too (run 243 only checked outright single winners) and found a
  stronger candidate than any of the three: Jamal Musiala, one of 2024's
  six joint winners, was 21 at that EURO's final (14 July 2024; born 26
  February 2003, confirmed via `WebSearch` against Wikipedia with no
  conflicting figure found, unlike Müller's) - younger than Baroš/Brolin/
  Džajić's ~22, and confirmed younger than every other 2024 co-winner and
  2012's six joint winners (the only other all-joint EURO Golden Boot
  years with plausibly-young players) by checking each one's own birth
  year. Still not shipped as a "youngest-ever" fact: no independent source
  found actually calls Musiala's 2024 share the record (this run's own
  `WebSearch` passes turned up plenty of EURO 2024 Golden Boot coverage but
  nothing framing his age as a record), so adding it would mean this run
  originating the superlative claim from a self-computed comparison, the
  exact risk this idea's own two already-shipped slices (Ballon d'Or,
  World Cup/EURO Golden Boot oldest) deliberately avoided by only ever
  sourcing an already-published "youngest-ever"/"oldest-ever" claim rather
  than computing one. Musiala, age 21, is nonetheless the strongest
  candidate found across six runs' worth of attempts (the two-hundred-and-
  fifty-sixth run tried again with a fresh `WebSearch` pass and again found
  no source framing his share as a record) - a future run with
  a fresh `WebSearch` pass (or any source that frames a EURO Golden Boot
  age record in writing) should check whether it names him before trying
  another vocabulary angle from scratch.
