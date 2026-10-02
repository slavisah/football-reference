# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full run-by-run history of every feature, bug fix,
verification sweep and decision (213 intensive runs as of 2026-10-02) lives
in `docs/PROJECT_STATUS.md` (append-only, one entry per change); this file
only tracks the open backlog, not the log of what already shipped.

**Maintenance note (2026-09-20, hundred-and-fifty-seventh intensive run):**
this file had grown to 7,093 lines by appending a full run-by-run log under
"Open backlog"/"Ideas not yet scoped as backlog" instead of just tracking
current state - the opposite of the "kept short on purpose" goal stated
above, and increasingly expensive for every run to read before it can even
start working. Trimmed back down to the genuinely open items below; nothing
was lost - every entry this removed already has its own full, matching entry
in `docs/PROJECT_STATUS.md` (cross-referenced by nearly every removed entry
itself, which is how this was verified safe), which remains the
authoritative full history. Going forward, close a backlog item by deleting
its bullet below (after confirming its `docs/PROJECT_STATUS.md` entry
exists) instead of appending a "closed" paragraph here - the append-only log
belongs in `docs/PROJECT_STATUS.md` only.

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
cross-reference pager between adjacent editions), a PWA/offline mode, and an
"On this day" widget. See `docs/PROJECT_STATUS.md`'s "Known caveats" section
(near the end of the file) for the authoritative, always-current summary of
what exists and any standing quirks.

Every recent run's standing health check comes back clean run after run:
`pnpm install`/`pnpm outdated`, `pnpm lint`/`pnpm test`/`pnpm
test:coverage`/`pnpm build`, all 35 `check:*` scripts (29 fast enough to run
every time and wired into `.github/workflows/ci.yml` as required PR gates;
`check:lighthouse`/`check:reflow`/`check:landscape`/`check:text-zoom`/
`check:print-width`/`check:html` are full-site Playwright/browser sweeps kept
manual/intensive-run-only rather than a required PR gate, purely for their
~700-page-load runtime), `pnpm audit`, and `pnpm dlx knip --no-config-hints`.
As of the two-hundred-and-thirteenth run (2026-10-02): 905/905 unit tests,
`pnpm lint` at 0 errors/0 warnings/0 hints, 711 pages built, 99.91%/99.32%
coverage, and the same two standing `knip` false positives as ever (`scripts/
test-preview-server.mjs`, used only as a Playwright `webServer.command`,
never imported; `@cspell/dict-hr-hr`, used only via `.cspell/
hr-notes.cspell.json`'s `"import"` field, never a JS `import`) - neither
actually unused, knip's static analysis just can't see a reference inside a
config-file string. The two-hundred-and-fourth run's own full cold-start
`pnpm test:e2e` (1042/1042) plus all five manual browser sweeps remain the
last complete, together confirmation (the combination had gone stale for
five runs, since the two-hundredth run's own 1038/1038 count) - see that
run's own entry below for the full writeup, including a container-specific
Playwright browser-cache snag hit and worked around along the way; the
two-hundred-and-fifth through two-hundred-and-eleventh runs' own changes
were all either content-prose/translation fixes or no-change verification
passes, with no markup or behavior change, so that baseline still stood
through the two-hundred-and-eleventh run. The two-hundred-and-twelfth run's
own new quiz question type is a real markup/behavior change, so its own
entry directly re-ran the two quiz-specific e2e specs
(`accessibility-quiz-states.spec.ts`, `no-js-quiz-and-search.spec.ts`, 14
tests) rather than the full suite - see that entry for why a targeted re-run
was judged sufficient; the two-hundred-and-thirteenth run's own two new
"Memorable moments" bullets (below) are content/translation prose plus one
new heading on a single edition page (PDF-only impact, caught by
`check:pdf-outline` and fixed by regenerating PDFs), so no e2e re-run was
judged necessary for it. The two-hundred-and-eighth run did re-run
`check:lighthouse` on its own (a manual/intensive-run-only tool, not part of
the cold-start `test:e2e` + browser-sweep baseline) and confirmed it is still
perfect - see that run's own entry below.

**Two-hundred-and-thirteenth run:** opened with the full standing health
check (unchanged from the two-hundred-and-twelfth run's own baseline) and a
re-confirmation that both network-dependent "Open backlog" blockers below
still hold in this session. With nothing new there and no fresh
verification-ledger claim shape turning up, picked up the one remaining
"Ideas not yet scoped" item - the "Youngest winner" ranking - and shipped a
narrow, lower-risk first slice of it rather than the full ~130-birth-date
version: two new `content/ballon-dor.md` "Memorable moments" bullets naming
Stanley Matthews (1956, oldest-ever winner at 41) and Ronaldo/Brazil (1997,
youngest-ever at 21), each a single, widely-and-consistently-reported record
(not a raw birth date this run would need to compute an age from itself),
independently confirmed via two separate WebSearch passes each - Matthews'
is carried by Guinness World Records' own page. See the matching entry
under "Ideas not yet scoped" below and `docs/PROJECT_STATUS.md`'s full
writeup for why Golden Boot was deliberately left out of this slice and
exactly how both claims were verified and wired into the Croatian page and
every relevant `check:*` ledger.

**Two-hundred-and-twelfth run:** with the two-hundred-and-eleventh run's own
closing note pointing at "a genuinely new quality angle ... rather than a
first pass over anything still unread" and every "Open backlog" item below
still either environment-blocked or awaiting human sign-off, shipped a real
feature addition instead of another verification pass: a new generated
quiz question type, "Which country has hosted the most {competition}
editions?", for the four team competitions that have a Host column (FIFA
World Cup, UEFA EURO, Copa América, UEFA Nations League).

The quiz (`content/quiz.md`/`src/pages/quiz.astro`/`src/pages/hr/quiz.astro`)
already asks "which team/player has won the most titles/awards" via
`mostTitlesQuestion()` in `src/lib/quiz.ts`, fed by `buildChampionsSummary()`.
`src/lib/editions.ts` already builds the exact same `ChampionSummary[]` shape
for hosts (`buildHostsSummary()`, which backs `/records`' own "Most frequent
hosts" ranking and had its own counts independently hand-verified against
every Host cell at the two-hundred-and-tenth run) - so the new question type
needed no new editorial research, just a new way of asking about data the
site already displays and has already verified. Extended
`mostTitlesQuestion()`'s `subject` parameter from `'team' | 'player'` to add
`'host'` (English "Which country has hosted the most {competition}
editions?"; Croatian "Koja je država bila domaćin najviše izdanja natjecanja
{competition}?"), changed its internal seed id to include `subject` (so a
"most titles" and "most hosted" question for the same competition don't
collide - this id is an internal PRNG seed only, never rendered or
persisted, so the change is invisible to any shared/printed link), and wired
a new pool into both the English and Croatian quiz pages for each of the
four team competitions. `mostTitlesQuestion()`'s existing tie-and-sparse-data
safety (no question when the top two are tied, or fewer than 3 distinct
entries) applies unchanged: FIFA World Cup (a 4-way tie at 2 hosts each -
Mexico, Italy, France, Brazil) and UEFA Nations League (all 4 hosts tied at 1
each) both correctly produce no question, while UEFA EURO (France, clear
leader) and Copa América (Argentina, clear leader) do - confirmed by
inspecting the real content tables' Host columns by hand, not assumed.
Added the matching bullet to `content/quiz.md`'s "Question types in this
quiz" list and the Croatian hardcoded notes list in `src/pages/hr/quiz.astro`
(bumped `content/quiz.md`'s `lastReviewed` to 2026-10-02), and six new unit
tests in `tests/unit/quiz.test.ts` (the English and Croatian prompts, the
correct answer coming from `buildHostsSummary()`, and an explicit id-collision
regression test against the existing `'team'` subject for the same
competition).

**Verification:** `pnpm install --frozen-lockfile` (clean; `pnpm outdated`
unchanged, only the already-documented blocked `typescript` line), `pnpm
lint` (238 files, 0 errors/0 warnings/0 hints), `pnpm test` (905/905, up from
902 - the six new tests), `pnpm test:coverage` (99.91%/99.32%, both ticking
up very slightly from the new code's own near-total coverage - no new gap),
`pnpm build` (711 pages, unchanged - no new route, just new content on the
existing `/quiz`/`/hr/quiz` pages). Manually confirmed the new question
renders in both languages' built JSON-LD (`dist/quiz/index.html`,
`dist/hr/quiz/index.html`) with the expected answers (France for EURO,
Argentina for Copa América) and confirmed by hand that World Cup/Nations
League correctly produce no such question, matching the tie analysis above.
All 29 CI-gated fast `check:*` scripts individually re-run and clean,
including `check:record-claims` (37 claims, up from 36 - the new "most
hosted" bullet in `content/quiz.md` needed its own `record-claims-ledger.json`
entry, added with the same "describes a generated quiz question type, not a
static factual claim" rationale the existing "most titles/awards" bullet
already used), `check:i18n-notes` (7 matched page pairs, parity held for the
new Croatian bullet), `check:jsonld` (1783 blocks across 711 pages, still
structurally valid with the new questions included), `check:heading-outline`,
`check:links`, `check:sitemap`, `check:meta`, `check:spelling` (15 files, 0
issues), `check:spelling-hr` (57 blocks, 0 unknown words - the new Croatian
bullet's words already exist in the dictionary/wordlist). `pnpm audit` (no
known vulnerabilities). `pnpm dlx knip --no-config-hints` (same two standing
false positives). Regenerated all 700 downloadable PDFs
(`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm build:pdfs`, this
session's own container-specific Chromium-revision escape hatch, the same
snag the two-hundred-and-fourth run documented) since `content/quiz.md`
changed; `check:pdfs`/`check:pdf-outline` both clean (700/700) after. One
session-local snag along the way, worth recording in case a future run hits
it again: the first two `build:pdfs` attempts each failed differently
(`HTTP 404` navigating one edition page; then "did not become ready in
time") - both traced to a leftover `astro preview` daemon still holding
Astro's project-level preview lock from an earlier direct `playwright test`
invocation in this same run (its own `webServer` config left a server
running on port 4321 after the test process exited), which `generate-pdfs.mjs`'s
own unconditional `astro preview --port 4399` start collided with. Running
`pnpm exec astro preview stop` once to clear the stale lock before retrying
fixed it; the third attempt completed cleanly with no code change needed -
an operational/session note, not a bug in `generate-pdfs.mjs` itself. Did not
re-run the full cold-start `pnpm test:e2e` suite or the five manual browser
sweeps - instead ran the two quiz-specific e2e specs directly
(`accessibility-quiz-states.spec.ts`, `no-js-quiz-and-search.spec.ts`, 14
tests covering WCAG violations across both languages/both color schemes and
the no-JS fallback state), which exercise every DOM state this run's change
could plausibly affect; all 14 passed. The two-hundred-and-fourth run's own
full cold-start `pnpm test:e2e` (1042/1042) plus the five manual browser
sweeps remain the standing baseline for everything else, with
`check:lighthouse` last reconfirmed by the two-hundred-and-eighth run.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see "Open backlog" below, unchanged. The quiz's
question-type surface now covers every `ChampionSummary`-shaped dataset the
site generates (titles, awards, and now hosts) for every competition that
has one; a natural next angle in the same "ship a feature, not another
verification pass" vein would be a question type drawing on `/records`'
other generated rankings (e.g. "back-to-back champions" or "biggest final
win") not yet asked about in the quiz, or returning to the
two-hundred-and-eleventh run's own suggestion of a fresh accessibility or
performance angle.

**Two-hundred-and-eleventh run:** picked up the two-hundred-and-tenth run's
own named next candidate - a first full front-to-back read of the site's
smaller, less-scrutinized `content/*.md` files (`records-and-timelines.md`,
`glossary.md`, `quiz.md`, `teams.md`, `players.md`, `compare-countries.md`,
`compare-players.md`, `about-sources.md`, `index.md`). Found and fixed a
real, previously-unnoticed bug on the home page: `content/index.md`'s
"Important historical naming note" claimed Soviet Union/Russia and
Czechoslovakia/Czechia "may" be grouped like West Germany/Germany, directly
contradicting both `src/lib/countries.ts`'s own `SUCCESSOR_GROUPS` map
(only West Germany/Germany is ever merged) and
`content/records-and-timelines.md`'s own documented policy. Fixed the
English prose, the matching hand-translated Croatian text in
`src/pages/hr/index.astro`, and the two e2e assertions pinned to the old
wording. The other eight files had no comparable claim. See
`docs/PROJECT_STATUS.md`'s matching entry for full detail.

**Two-hundred-and-tenth run:** picked up the two-hundred-and-ninth run's own
named next candidate - extending its by-hand "independently recompute the
generated ranking from the raw table rows, then diff against the real
rendered page" treatment to `/records`' five remaining generated rankings it
hadn't yet covered ("Most frequent hosts", "Titles won on home soil", "Nearly
champions", "Nearly finalists", "Biggest final wins") plus "Fiercest
rivalries" - the only generated section on the page none of the first 209
runs had ever independently spot-checked at all.

Built the site and extracted each section's real rendered output from
`dist/records/index.html` verbatim (`buildHostsSummary()`,
`buildHomeSoilTitles()`, `buildRunnerUpsWithoutTitle()`,
`buildNearlyFinalists()`, `buildBiggestFinalMargins()` in `src/lib/
editions.ts`, and `buildRivalries()`/`buildFinalsMeetings()` in `src/lib/
compare.ts`), then independently re-derived every row by hand from each
competition's own Editions/Finals/Champions-timeline table in
`content/*.md`, without consulting the generator functions' own logic while
doing the recomputation:

- **Most frequent hosts:** tallied every Host(s) cell for all four team
  competitions (FIFA World Cup, UEFA EURO, Copa América, UEFA Nations
  League), excluding the three Copa América "Home-and-away" editions
  (1975/1979/1983) that have no single host. All 19 World Cup hosts, 14 EURO
  hosts, 11 Copa América hosts and 4 Nations League hosts matched the
  rendered counts, years and sort order (titles descending, ties broken by
  earliest hosting year, then name) exactly.
- **Titles won on home soil:** for every edition, checked whether the Host
  and Winner/Champion cells are an exact string match (confirming the
  generator's own documented choice that a co-host which goes on to win,
  e.g. Spain's 2026 World Cup title under "Canada, Mexico and United
  States", correctly does *not* count). Found and matched all 6 World Cup,
  3 EURO, 7 Copa América and 1 Nations League home-soil titles exactly,
  including West Germany/Germany correctly grouping into one "Germany
  (incl. West Germany)" entry for this ranking (unlike "Back-to-back
  champions", which keeps them separate).
- **Nearly champions:** for each competition, built the full set of
  teams that have ever won (grouping West Germany under Germany), then
  walked every Runner-up cell and kept only the ones belonging to a team
  never in that winners' set. Matched all 5 World Cup, 4 EURO, 1 Copa
  América and 2 Nations League entries and counts exactly - including Spain
  correctly being excluded from the Nations League list despite two runner-up
  finishes, since it won the competition outright in 2022-23.
- **Nearly finalists:** built the set of teams that have ever reached *any*
  final (winner or runner-up) per competition, then walked every
  Third/Fourth/"Other semifinalist" cell and kept only non-finalist teams.
  Matched all 12 World Cup, 5 EURO, 5 Copa América and 5 Nations League
  entries and counts exactly, including same-year alphabetical tie-breaks
  (e.g. World Cup 2002's "South Korea" before "Türkiye", both reaching
  their first semifinal that year).
- **Biggest final wins:** parsed the first score pair out of every "Final"
  cell for World Cup, EURO and Nations League (Copa América has no such
  column, as already documented) and took the absolute goal difference,
  confirming a shootout-decided final (e.g. 1994's "Brazil 0-0 Italy; 3-2
  pens") correctly ranks at margin 0 rather than counting the penalty score.
  All 23 World Cup, 17 EURO and 4 Nations League margins, scores and years
  matched the rendered page exactly, including the three-way tie at margin 3
  on the World Cup table (1958, 1970, 1998, ordered by year) and EURO's own
  margin-3 entry (1972) sorting behind its one margin-4 final (2012).
- **Fiercest rivalries:** built every Champion-vs-Runner-up final pairing
  across all four team competitions, counted meetings per unordered team
  pair (grouping West Germany under Germany, as the rendered page does),
  and kept every pair with 2+ meetings. All 11 rendered rows matched
  exactly - rivalry pair, total meetings, head-to-head win/loss split,
  which competition(s) contributed, and the most recent meeting - including
  two rivalries only reaching the 2-meeting threshold by combining finals
  across different competitions (France-Italy: EURO 2000 + World Cup 2006;
  France-Spain: EURO 1984 + UEFA Nations League 2020-21). No pair with 2+
  meetings was missing from the list, and no listed pair's head-to-head
  record was wrong.

No discrepancy found anywhere across all six sections - a genuinely new,
specific check now done and closed for every generated ranking `/records`
renders, completing the treatment the two-hundred-and-ninth run started on
the page's other two generated rankings. Also cross-checked the Croatian
`/hr/records` page the same way the two-hundred-and-ninth run did for its
own two sections: diffed the numeric/year sequences and the full rivalries
table against the English page - byte-identical throughout (only the
heading text, unit labels and "vodi "/"-" head-to-head phrasing differ),
confirming both language pages share the same generated data.

**Verification:** `pnpm install --frozen-lockfile` (clean; `pnpm outdated`
unchanged, only the already-documented blocked `typescript` 5.9.3 -> 7.0.2
line), `pnpm lint` (238 files, 0 errors/0 warnings/0 hints), `pnpm test`
(902/902, unchanged - this run's own checking was a read-only hand
cross-check against build output, no source file changed), `pnpm
test:coverage` (99.91%/99.31%, unchanged), `pnpm build` (711 pages,
unchanged). All 29 CI-gated fast `check:*` scripts individually re-run and
clean: `check:pdfs` (700/700, nothing stale since nothing changed),
`check:pdf-outline` (700/700), `check:perf`, `check:links` (715 pages),
`check:sitemap` (710 entries), `check:precache`, `check:jsonld` (1783 blocks
across 711 pages), `check:heading-outline`, `check:theme-flash`,
`check:reachability`, `check:meta`, `check:award-tallies` (4/4), all seven
claim-ledger checkers (`check:superlative-claims` 24,
`check:ordinal-claims` 91, `check:record-claims` 36,
`check:consecutive-claims` 22, `check:since-claims` 26,
`check:one-of-only-claims` 2, `check:completeness-claims` 5 - all unchanged),
`check:edition-header-labels`, `check:i18n-notes` (7 matched page pairs),
`check:attendance-format`, `check:claims-hr` (205 claims), `check:link-names`,
`check:image-dimensions`, `check:locale-consistency`, `check:theme-color`,
`check:spelling` (15 files, 0 issues), `check:spelling-hr` (57 blocks, 0
unknown words). `pnpm audit` (no known vulnerabilities). `pnpm dlx knip
--no-config-hints` (same two standing false positives: `scripts/
test-preview-server.mjs`, `@cspell/dict-hr-hr`). No content or markup changed
this run (a pure read/verify pass - nothing to fix turned up), so no PDF
regeneration was needed. Browser sweeps and a cold-start `pnpm test:e2e` not
re-run - no markup or interactive-behavior change this run; the
two-hundred-and-fourth run's own full cold-start `pnpm test:e2e` (1042/1042)
plus the five manual browser sweeps remain the current baseline, with
`check:lighthouse` last reconfirmed by the two-hundred-and-eighth run.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see "Open backlog" below, unchanged. Every generated
ranking on `/records` (all seven `ChampionsSummary`-shaped rankings plus
"Fiercest rivalries") has now had this specific by-hand recomputation
treatment at least once, across both languages - no further untried ranking
remains on that page. The two-hundred-and-eighth run's other still-open
suggestion stands as the natural next angle: a first full front-to-back read
of the site's smaller, less-scrutinized `content/*.md` files
(`records-and-timelines.md`, `glossary.md`, `quiz.md`, `teams.md`,
`players.md`, `compare-countries.md`, `compare-players.md`,
`about-sources.md`, `index.md`), the same treatment already applied to all
six flagship competition/award pages.

**Two-hundred-and-ninth run:** picked up the first of the two-hundred-and-
eighth run's own two named next candidates - a by-hand spot-check of
`/records`' "Longest wait between titles" and "Back-to-back champions"
sections against each competition's own source table. Worth correcting the
framing going in: these two sections are not hand-authored prose (unlike
every other content/table cross-check prior runs have done) - they are
generated at build time by `buildLongestStreaks()`/`buildLongestTitleGaps()`
in `src/lib/editions.ts`, fed by the same `Edition[]` arrays every other
`/records` ranking already uses. Both functions already have dedicated unit
tests, but no prior run had ever independently recomputed their *real*
output against the *real* content data by hand - unit tests only prove the
function is internally consistent with its own fixtures, not that today's
actual `content/*.md` tables produce today's actual displayed numbers. That
gap is what this run closed.

Built the site, extracted the rendered "Back-to-back champions" and
"Longest wait between titles" sections from `dist/records/index.html`
verbatim, then independently hand-recomputed every single row shown there
by walking each competition's own Editions/Champions-timeline/Winners table
in `content/*.md` from scratch - not by re-reading the generator's source,
by literally re-deriving the answer from the table rows. Covered all seven
datasets the page renders (FIFA World Cup, UEFA EURO, Copa América, UEFA
Nations League, Ballon d'Or, Golden Boot World Cup, Golden Boot EURO):

- **Back-to-back champions:** walked every table's Winner column in
  chronological row order by hand, flagging every pair of adjacent rows with
  an identical winner. Found 2 World Cup streaks (Italy 1934/1938, Brazil
  1958/1962), 1 EURO streak (Spain 2008/2012), 11 Copa América streaks
  (Argentina's 1945-1947 three-in-a-row plus ten two-in-a-rows), 0 Nations
  League streaks, 8 Ballon d'Or streaks (Messi's 2009-2012 four-in-a-row down
  to three separate one-year-apart pairs), 1 Golden Boot (World Cup) streak
  (Mbappé 2022/2026), and 0 Golden Boot (EURO) streaks - every single one
  matched the rendered page exactly, including sort order (titles descending,
  ties broken by earliest start year). Specifically checked the two
  documented edge cases the generator's own comments call out: the 2020
  Ballon d'Or's "Not awarded" placeholder correctly breaks what would
  otherwise have been a Messi 2019-2021 streak (it does), and West
  Germany/Germany are correctly kept as separate entries for this ranking,
  unlike the title-count groupings elsewhere on the page (confirmed no West
  Germany-to-Germany streak appears anywhere, since none of 1954/1974/1990's
  West Germany wins nor 2014's Germany win are adjacent table rows to each
  other).
- **Longest wait between titles:** for every team/player with 2+ titles in
  each dataset, sorted their title years and independently computed the
  widest gap between chronologically consecutive wins (not first-to-last).
  Recomputed 7 World Cup entries, 4 EURO, 6 Copa América, 1 Nations League,
  10 Ballon d'Or, 1 Golden Boot (World Cup), 1 Golden Boot (EURO) - 30 rows
  total - including every tie-break (e.g. Brazil/Germany both at 24 years on
  the World Cup table, resolved correctly by earliest gap-start year; Ronaldo
  and Cristiano Ronaldo both at 5 years on the Ballon d'Or table, same
  resolution). Every single row matched the rendered page's team name, gap
  length and bounding years exactly - zero discrepancies anywhere.

Also confirmed the Golden Boot (EURO) entry specifically exercises the
tie-splitting behavior `buildLongestTitleGaps()` inherits from
`buildChampionsSummary()` (which splits a "; "-joined tied-winner cell into
individual credits): Cristiano Ronaldo's 2012 EURO Golden Boot was a six-way
tie, but still correctly combines with his outright 2020 win for an 8-year
gap (2012-2020) - confirming ties are split for this ranking, not just for
the main title-count ranking.

**One real asymmetry found, investigated, and confirmed currently inert (not
a bug, not fixed):** `buildLongestStreaks()` compares each edition's *raw,
unsplit* winner-cell string for an exact match, unlike
`buildChampionsSummary()`/`buildLongestTitleGaps()`, which both split a
tied-winner cell on `"; "` first. So a player who shares a tie in one
edition and wins outright in the next would currently be invisible to the
streaks ranking (the literal strings "Cristiano Ronaldo" and "Mario
Balotelli; Mario Gómez; Mario Mandžukić; Cristiano Ronaldo; Alan Dzagoev;
Fernando Torres" never match). Checked every tie year across all seven
datasets (World Cup Golden Boot 1962/1994; EURO Golden Boot 1960/1964/1992/
2012/2024) against its immediately adjacent editions for this exact shape -
none exists in the current data, so this asymmetry produces no wrong number
on the live site today. Left unfixed deliberately: there is no live claim to
regression-test against building a fix blind would just be guessing at an
edge case without a before/after to actually verify, the same
reasoning several prior runs have given for leaving a documented,
currently-harmless gap alone (e.g. the "Open backlog"'s own
defensively-unreachable-coverage items). Worth a comment addition or a
proper split-aware rewrite the day content ever creates that adjacency.

Finally, cross-checked the Croatian `/hr/records` page: diffed its built
`dist/hr/records/index.html` against the English numbers for both sections -
byte-identical team names, gap/streak counts and years throughout (only the
prose, unit labels and heading translations differ), confirming both
language pages share the exact same `loadCompetition()`-derived `Edition[]`
data and the generator functions are not duplicated or forked between them.

**Verification:** `pnpm install --frozen-lockfile` (clean; `pnpm outdated`
unchanged, only the already-documented blocked `typescript` 5.9.3 -> 7.0.2
line), `pnpm lint` (238 files, 0 errors/0 warnings/0 hints), `pnpm test`
(902/902, unchanged - this run's own checking was a read-only hand
cross-check against build output, no source file changed), `pnpm
test:coverage` (99.91%/99.31%, unchanged), `pnpm build` (711 pages,
unchanged). All 29 CI-gated fast `check:*` scripts individually re-run and
clean: `check:pdfs` (700/700, nothing stale since nothing changed),
`check:pdf-outline` (700/700), `check:perf`, `check:links` (715 pages),
`check:sitemap` (710 entries), `check:precache`, `check:jsonld` (1783 blocks
across 711 pages), `check:heading-outline`, `check:theme-flash`,
`check:reachability`, `check:meta`, `check:award-tallies` (4/4), all seven
claim-ledger checkers (`check:superlative-claims` 24,
`check:ordinal-claims` 91, `check:record-claims` 36,
`check:consecutive-claims` 22, `check:since-claims` 26,
`check:one-of-only-claims` 2, `check:completeness-claims` 5 - all unchanged),
`check:edition-header-labels`, `check:i18n-notes` (7 matched page pairs),
`check:attendance-format`, `check:claims-hr` (205 claims), `check:link-names`,
`check:image-dimensions`, `check:locale-consistency`, `check:theme-color`,
`check:spelling` (15 files, 0 issues), `check:spelling-hr` (57 blocks, 0
unknown words). `pnpm audit` (no known vulnerabilities). `pnpm dlx knip
--no-config-hints` (same two standing false positives as ever:
`scripts/test-preview-server.mjs`, `@cspell/dict-hr-hr`). No content or
markup changed this run (a pure read/verify pass - nothing to fix turned
up), so no PDF regeneration was needed; the clean `check:pdfs`/
`check:pdf-outline` results above simply confirm the existing 700 PDFs are
still fresh. Browser sweeps and a cold-start `pnpm test:e2e` not re-run - no
markup or interactive-behavior change this run; the two-hundred-and-fourth
run's own full cold-start `pnpm test:e2e` (1042/1042) plus the five manual
browser sweeps remain the current baseline, with `check:lighthouse` freshly
reconfirmed by the two-hundred-and-eighth run.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see "Open backlog" below, unchanged. This run's own
angle (a by-hand spot-check of `/records`' generated rankings against their
source tables, as opposed to unit-testing the generator in isolation) is now
closed for the two sections it targeted, across all seven datasets and both
languages - no discrepancy found, and the one latent asymmetry found
(`buildLongestStreaks()`'s non-split tied-winner comparison) is currently
inert, documented above rather than guessed at blind. The same treatment has
not yet been applied to `/records`' other five generated rankings ("Most
frequent hosts", "Titles won on home soil", "Nearly champions", "Nearly
finalists", "Biggest final wins") or to "Fiercest rivalries" - a natural
next candidate for run #210, alongside the two-hundred-and-eighth run's
other still-untried suggestion: a first full front-to-back read of the
site's smaller, less-scrutinized `content/*.md` files
(`records-and-timelines.md`, `glossary.md`, `quiz.md`, `teams.md`,
`players.md`, `compare-countries.md`, `compare-players.md`,
`about-sources.md`, `index.md`).

**Two-hundred-and-eighth run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, tried two fresh
angles. First, continued the two-hundred-and-seventh run's own suggested
companion angle: whether any `noteHeadings`-requested section's *bullets*
(as opposed to the top-of-page intro that run checked) are silently dropped
by `extractSection()` (`src/lib/notes.ts`) for a reason beyond its documented
"no bullets yet, more than one paragraph" intro case - specifically, a
non-bullet, non-blank line appearing *after* bullets have already started
(which the function's `bullets.length === 0` guard would silently discard,
never add to either `bullets` or `paragraph`). Wrote a standalone script
mirroring that exact line-classification logic and ran it against every
`noteHeadings` section in all six `content/*.md` files that use
`extractSection()` (`fifa-world-cup.md`, `uefa-euro.md`,
`uefa-nations-league.md`, `copa-america.md`, `ballon-dor.md`,
`golden-boot.md`) - zero lines dropped anywhere; every section is either
pure bullets or pure intro-paragraph-then-bullets, matching the function's
two documented shapes exactly. Negative result; this angle is now exhausted
too.

Second, picked up the two-hundred-and-fifth run's own suggested next
candidate - a full front-to-back prose-vs-table read, the kind that caught
the Ballon d'Or ceremony-date and Copa América "only Ecuadorian" bugs -
against the two files that hadn't had it as recently as Ballon d'Or/Copa
América/Golden Boot/Nations League: `content/fifa-world-cup.md` and
`content/uefa-euro.md`. Read both end to end and cross-checked every bullet
claim against the Editions/Champions/tally tables on the same page: title
counts (Brazil 5, Germany-incl-West-Germany 4, Italy 4, etc. on
`fifa-world-cup.md`; Spain 4 and the rest on `uefa-euro.md`) against their
own Editions tables; every "since <year>; no equivalent award existed at the
N earlier editions" award-introduction claim against the actual edition
count on both sides of that year; every "X supplied the most of any team"
Team of the Tournament claim on `uefa-euro.md` against a manual per-player
nationality tally of that year's own eleven names; every format-milestone
bullet against the Editions table's own `Teams` column; the Fair-Play-
Award-plus-World-Cup "fifth team" claim's full chain of four named teams
against both tables; and every player/manager/captain cross-reference
between the two files' own "Winning managers"/"Winning captains" sections
(e.g. Casillas as 2012 EURO captain claiming he also captained the 2010
World Cup - confirmed against `fifa-world-cup.md`'s own 2010 captain entry;
Deschamps/Deschamps and Beckenbauer/Beckenbauer similarly cross-checked both
ways). No mismatch found on either file - every claim held up exactly
against its own page's tables and against the other competition's page
where cross-referenced. Negative result, but a genuine, specific check now
done and closed off for these two files, matching the treatment Ballon d'Or/
Copa América/Golden Boot/Nations League already had.

With both angles exhausted without a new lead, re-ran `pnpm
install`/`pnpm outdated` (clean; only the already-documented blocked
`typescript` 5.9.3 -> 7.0.2 line), `pnpm lint` (238 files, 0/0/0), `pnpm
test` (902/902, unchanged), `pnpm test:coverage` (99.91%/99.31%, unchanged -
the same four defensively-unreachable branches as ever), `pnpm build` (711
pages, unchanged), all 29 CI-gated fast `check:*` scripts individually
re-run and clean, `pnpm audit` (no known vulnerabilities), and `pnpm dlx
knip --no-config-hints` (same two standing false positives). Also re-ran
`check:lighthouse` by hand (not part of that fast set) for the first time
since the dependency versions it depends on (`lighthouse`, `@playwright/
test`, `astro`) were last bumped - all 29 sampled pages still score a
perfect 1.00/1.00/1.00/1.00 (performance/accessibility/best-practices/SEO),
with the one already-documented, expected `/404` noindex SEO exception
(0.63, correctly excluded by `EXPECTED_SEO_EXCEPTIONS`) and no actionable
back/forward-cache blockers - confirming no regression since the fourteenth
run's original audit. No content changed this run, so no PDF regeneration
was needed; `check:pdfs`/`check:pdf-outline` not re-run since nothing could
have gone stale. Browser sweeps other than `check:lighthouse` and a
cold-start `pnpm test:e2e` not re-run - no markup or behavior change this
run, matching established practice.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see "Open backlog" below, unchanged. Both of this
run's own angles (the `extractSection()` bullet-drop audit, and the
front-to-back prose-vs-table read) have now been applied to every
`noteHeadings`-using content file and all six team-competition/award pages
respectively - there is no obvious next file to point either angle at
without repeating one already done. A genuinely different angle is probably
needed next: e.g. the same front-to-back table-cross-check treatment hasn't
yet been applied to the non-competition pages' own hand-authored tables
(`/records`' "Longest wait between titles"/"Back-to-back champions"
sections, which are generated from competition data but still worth a
by-hand spot-check against the source tables one more time) or to the
`content/*.md` files smaller than the six main ones, which have had far less
individual scrutiny than the flagship competition pages.

**Two-hundred-and-seventh run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, tried a fresh angle
none of the prior 206 runs had used: every claim-verification script in
`scripts/check-*-claims.mjs` only ever scans Markdown **bullet** lines
(`/^-\s(.*)$/`) - reader-facing **prose paragraphs** have never been checked
by any of that tooling, not for claim vocabulary and not for whether they
even reach a live page at all. Swept all nine `content/*.md` files for
non-bullet, non-table, non-heading prose and checked each against its built
HTML output.

Found one real bug: `src/lib/competition.ts`'s `firstParagraph()` - which
supplies every competition/award page's intro paragraph - deliberately
stops at the first blank line (confirmed intentional via an explicit
`tests/unit/competition.test.ts` case, not changed). Of all nine content
files, only `content/copa-america.md` has a second paragraph before its
first heading, and it was never reaching either language's page - confirmed
present in the Markdown source, absent from `dist/competitions/copa-america/
index.html`. Rather than loosen the tested single-paragraph extraction
contract (which would change all nine pages' intros), merged the dropped
sentence into the first paragraph in `content/copa-america.md` and added the
equivalent sentence to the Croatian hardcoded intro in `src/pages/hr/
competitions/copa-america.astro`. No historical fact changed - only the
paragraph break hiding already-written text from both languages' readers.

**Verification:** `pnpm lint` (238 files, 0/0/0), `pnpm test` (902/902,
unchanged), `pnpm build` (711 pages, unchanged), confirmed both languages'
full intro text in the built HTML, all 26 fast content/quality `check:*`
scripts clean. Regenerated all 700 PDFs (`pnpm build && pnpm build:pdfs`,
via `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` -
this container's exact versioned path differed from prior runs' documented
one); waited for the single invocation to fully exit before checking
anything, per the two-hundred-and-sixth run's own warning against
overlapping `build:pdfs` runs. `check:pdfs`/`check:pdf-outline` both clean
(700/700). Browser sweeps and e2e not re-run (prose-only change, no
markup/behavior change) - the two-hundred-and-fourth run's baseline stands.

**Left for a future pass:** this run's new angle (prose reaching the page at
all) is now exhausted across all nine current content files - re-check
after any future edit adds a new multi-paragraph intro. Untried: whether any
`noteHeadings` section's *bullets* are similarly written but silently
dropped by `extractSection()` for some reason beyond its documented cases.

**Two-hundred-and-sixth run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, continued the
two-hundred-and-fifth run's own suggested next angle - a fresh front-to-back
read of a content file, cross-checking its prose directly against its own
tables rather than only the seven verification-ledger checkers' trigger-word
matches - against `content/copa-america.md`, the first of that run's three
suggested candidates.

Read the whole page section by section. Re-counted the "Titles after 2024"
tally table directly against the Champions timeline table (all eight
nations' counts confirmed: Argentina 16, Uruguay 15, Brazil 9, Paraguay/
Chile/Peru 2 each, Colombia/Bolivia 1 each, summing to all 48 editions).
Checked the Best Player/Golden Glove "every edition since X; no award at Y
earlier editions" counts, the Golden Boot repeat-winner bullet, and every
"Memorable moments" bullet against the tables - all held up.

Found one real, previously-unnoticed mismatch: the Golden Boot section's
1963 bullet called Carlos Alberto Raffo (Ecuador) "the only Ecuadorian to
ever win an individual Copa América award." Its own
`superlative-claims-ledger.json` entry (verified 2026-09-23) explicitly
scoped the check to "all three individual-award tables on this page (Best
Player, Golden Glove, Golden Boot)" - but the page has a fourth
individual-recognition section, Team of the Tournament, added at the
fifty-second intensive run (2026-09-02) and already carrying an Ecuadorian
name (Pervis Estupiñán, 2021) three weeks before the 2026-09-23 verification
that declared Raffo "the only" one; Piero Hincapié (2024) added a second.
Neither was ever caught because that verification's own methodology never
looked at the Team of the Tournament section. Reworded the claim to the
scope it was actually verified against ("the only Ecuadorian to win the Best
Player, Golden Glove, or Golden Boot award") and named both Team of the
Tournament picks explicitly, in English (`content/copa-america.md`) and
Croatian (`src/pages/hr/competitions/copa-america.astro`), plus the matching
`superlative-claims-ledger.json` entry. Bumped `content/copa-america.md`'s
`lastReviewed` to 2026-10-01.

**Verification:** `pnpm install --frozen-lockfile` (clean), `pnpm lint` (238
files, 0/0/0), `pnpm test` (902/902, unchanged - a pure prose/translation
fix), `pnpm build` (711 pages, unchanged), all 29 CI-gated fast `check:*`
scripts individually re-run and clean, including `check:superlative-claims`
(24 claims, 0 unverified), `check:i18n-notes` (7 matched page pairs, parity
held) and `check:claims-hr` (205 claims, unchanged). Regenerated all 700
downloadable PDFs (`pnpm build && pnpm build:pdfs`, via the
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` container escape hatch) since
both pages changed; `check:pdfs`/`check:pdf-outline` both clean (700/700)
after a clean serial rebuild. One session-local snag along the way: a first
`build:pdfs` invocation was accidentally left running in the background and
a second one was started before it finished, and the two overlapping runs
corrupted every "edition" PDF's outline (each ended up with the same wrong
12-bookmark count regardless of its own page) - caught immediately by
`check:pdf-outline`, not shipped; fixed by confirming no leftover preview-
server/Playwright processes and re-running `build:pdfs` once, serially.
Browser sweeps and a cold-start `pnpm test:e2e` not re-run, matching this
project's own established practice for a pure prose/translation change - the
two-hundred-and-fourth run's own full cold-start `pnpm test:e2e` (1042/1042)
plus all five manual browser sweeps remain the current baseline.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see "Open backlog" below, unchanged. The
two-hundred-and-fifth run's own angle (full front-to-back prose-vs-table
read) has now been applied to Ballon d'Or and Copa América; worth trying it
against `content/uefa-euro.md` or `content/fifa-world-cup.md` next, since
neither has had this specific treatment as recently as the other two.

**Two-hundred-and-third run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, `pnpm outdated`
surfaced one new in-range patch release beyond the already-documented blocked
`typescript` line: `vitest`/`@vitest/coverage-v8` 5.0.2 -> 5.0.3 (the latter
pinned to an exact version in `package.json`, so bumped by hand after `pnpm
update` alone left it untouched, the same pattern the hundred-and-eighty-ninth
run's own `sharp` bump needed). Continued the two-hundred-and-second run's own
suggested next angle - auditing each `check:*` script's documented scope
against what it actually implements, rather than assuming a script does
everything its own header comment claims - against `check-image-dimensions.mjs`
(confirmed its documented manifest-icon/og-image/alt-text coverage is fully
implemented, including the `og:image:alt`/`twitter:image:alt` presence check
its header describes) and a further read of `check-link-names.mjs`/
`check-locale-consistency.mjs`/`check-record-claims.mjs`'s full bodies against
their own header comments (all three match what they document; no gap found).
Also swept every `scripts/*.mjs` and `src/**/*.{astro,ts}` file for a
`TODO`/`FIXME`/`XXX` marker that might flag a self-documented gap none of the
prior 202 runs' header-comment audits had specifically grepped for - zero
hits, consistent with this project's own established discipline of closing a
gap the run it's found rather than leaving a marker behind. Both angles
genuine, if negative, results; no new checker gap found this run, unlike the
two-hundred-and-second run's own JSON-LD-reachability find.

With no new actionable lead, ran the full fast standing health check after the
dependency bump: `pnpm install` (clean, `vitest`/`@vitest/coverage-v8` now
5.0.3), `pnpm outdated` (only the blocked `typescript` line remains), `pnpm
lint` (238 files, 0/0/0), `pnpm test` (902/902 against the bumped `vitest`,
unchanged pass count), `pnpm test:coverage` (99.91%/99.31%, unchanged), `pnpm
build` (711 pages), all 29 CI-gated fast `check:*` scripts individually
re-run and clean, `pnpm audit` (no known vulnerabilities), `pnpm dlx knip
--no-config-hints` (same two standing false positives). Browser sweeps and a
full cold-start `pnpm test:e2e` not re-run - `vitest` only runs unit tests and
this run's change touches no `src/`/`tests/` file, matching this project's own
established practice for that class of change.

**Left for a future pass (closed by the two-hundred-and-fourth run below):**
the documentation-vs-implementation audit angle continued against the ten
scripts still unaudited at the time - see that run's own entry for the
result.

**Two-hundred-and-fifth run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, and the two-hundred-
and-fourth run's own documentation-vs-implementation `check:*` audit now
complete, tried a genuinely different angle from the last several dozen
runs' claim-vocabulary greps: rather than searching `content/*.md` for a new
trigger phrase, picked the content file with the least recent full
front-to-back read and re-read it bullet by bullet, cross-checking its own
prose against its own tables directly - not just the specific claim shapes
the seven verification-ledger checkers already pattern-match on.
`content/ballon-dor.md` and `content/golden-boot.md` share the site's
stalest `lastReviewed` date (2026-09-03), but Golden Boot (and Nations
League) already got a dedicated full manual read at the hundred-and-
eighty-eighth run - Ballon d'Or's own last full content-accuracy pass predates
that (the Winner/National-team and Ceremony-date independent cross-checks,
2026-08-07/2026-08-13); everything since has only touched it via trigger-word
greps that skip any bullet not matching their specific vocabulary.

Found a real, previously-unnoticed claim-vs-table mismatch: the "How it
works" section's closing bullet stated "The winner is announced at an
end-of-year ceremony organized by France Football magazine" - true through
2021, but directly contradicted by the page's own Winners table for every
edition since (2022: 17 October; 2023: 30 October; 2024: 28 October; 2025:
22 September - all autumn, not year's end). None of the seven verification-
ledger checkers would ever catch this: the bullet contains no ordinal, no
"since <year>", no "the only", and no record/consecutive/completeness
trigger word. The Croatian translation
(`src/pages/hr/competitions/ballon-dor.astro`) carried the identical
outdated claim, so this wasn't a translation-only slip either. Fixed both
without fabricating a reason for the schedule shift (no network access to
source one) - reworded to state only what the page's own, already
independently-verified Ceremony date column already shows: "The winner is
announced at a ceremony organized by France Football magazine - held at
year's end through 2021, then moved to September/October from 2022 onward
(see the Ceremony date column above)" (and the matching Croatian sentence).
Deliberately avoided the word "since" in the new English wording, despite
it reading naturally, to avoid adding an unnecessary eighth
`since-claims-ledger.json` entry for what is just a cross-reference to a
column already on the same page, not a new fact needing its own
verification record. Bumped `content/ballon-dor.md`'s `lastReviewed` to
2026-09-30.

**Verification:** `pnpm install --frozen-lockfile` (clean; `pnpm outdated`
unchanged, only the blocked `typescript` line), `pnpm lint` (238 files,
0/0/0), `pnpm test` (902/902, unchanged - a pure prose/translation fix),
`pnpm build` (711 pages), all 27 relevant fast `check:*` scripts individually
re-run and clean, including `check:i18n-notes` (7 matched page pairs, still
identical note-section structure and dash-clause parity - the rewritten
bullet gained a dash-clause in both languages together, so parity held
rather than newly appearing one-sided), `check:since-claims` (still 26
claims, confirming the reword's "from 2022" phrasing didn't accidentally
match the "since <year>" pattern), and `check:claims-hr` (205 claims,
unchanged). Regenerated all 700 downloadable PDFs (`pnpm build && pnpm
build:pdfs`, via the two-hundred-and-fourth run's own documented
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` container escape hatch) since
both `content/ballon-dor.md` and its Croatian page changed;
`check:pdfs`/`check:pdf-outline` both clean (700/700) after. Browser sweeps
and a cold-start `pnpm test:e2e` not re-run - this change is pure
prose/translation text with no markup, styling or interactive-behavior
change, matching this project's own established practice for that class of
change; the two-hundred-and-fourth run's own full sweep stays the current
baseline.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. This
run's own angle (a fresh front-to-back read of the content file with the
least recent full read, cross-checking prose against the page's own tables
rather than only trigger-word-matched claims) found one real, previously-
shipped mismatch; worth trying the same angle against
`content/copa-america.md`, `content/uefa-euro.md` or
`content/fifa-world-cup.md` next, since none has had this specific
table-cross-check treatment as recently as Golden Boot/Nations League did at
the hundred-and-eighty-eighth run - rather than another vocabulary sweep.

**Two-hundred-and-fourth run:** closed out the documentation-vs-implementation
audit the two-hundred-and-second run started and the two-hundred-and-third
run continued - read the remaining ten `check:*` scripts' own header comments
against what they actually implement: `check-meta.mjs`, `check-pdf-outline.mjs`,
`check-sitemap.mjs`, `check-since-claims.mjs`, `check-spelling-hr.mjs`,
`check-superlative-claims.mjs`, `check-text-zoom.mjs`, `check-theme-flash.mjs`,
`check-claims-hr.mjs` and `check-award-tallies.mjs`. All ten confirmed
accurate - every documented behavior (including easy-to-miss specifics, like
`check-sitemap.mjs`'s reverse pass correctly relying on the `/awards/*`
redirect stubs' own `noindex` tag rather than needing its own explicit
exclusion, and `check-award-tallies.mjs`'s four-file `CHECKS` list being a
deliberately complete set - `golden-boot.md`/`uefa-nations-league.md` have no
matching hand-authored tally table to audit, confirmed by reading both
files' own headings) is genuinely implemented, not just described. Combined
with the two-hundred-and-third run's own four-script pass, every `check:*`
script in the repository has now had this specific audit applied at least
once; only the two-hundred-and-second run's JSON-LD-reachability gap ever
turned up a real mismatch. `pnpm outdated` re-checked (only the blocked
`typescript` line); `WebFetch` to `en.wikipedia.org` re-confirmed still
`EGRESS_BLOCKED` (2026-09-30) - the link-liveness/Nations League
attendance/Best-XI items below remain genuinely blocked, not just stale.

With the audit closed and no new lead, used the rest of the run on the
full cold-start confirmation sweep four runs overdue (last run together at
the two-hundredth): `pnpm install --frozen-lockfile`, `pnpm lint` (238
files, 0/0/0), `pnpm test` (902/902), `pnpm test:coverage` (99.91%/99.31%,
unchanged), `pnpm build` (711 pages), all 29 CI-gated fast `check:*` scripts
individually clean, `pnpm audit` (no known vulnerabilities), `pnpm dlx knip
--no-config-hints` (same two standing false positives), `pnpm test:e2e`, and
all five manual browser sweeps (`check:reflow`/`check:landscape`/
`check:text-zoom`/`check:print-width`/`check:lighthouse`).

The first attempt at the browser-driven half failed immediately and
uniformly: every one of `test:e2e` and the five sweeps errored within
seconds with `browserType.launch: Executable doesn't exist at
/opt/pw-browsers/chromium_headless_shell-1243/...` - this session's own
container only has Chromium/headless-shell revision 1194 cached, but the
currently-pinned `@playwright/test` (1.63.0) defaults to launching
headless-shell revision 1243, which isn't present. Not a site bug or a
regression - purely this particular container's browser cache not matching
the pinned Playwright version, the identical scenario
`scripts/preview-daemon.mjs`'s own `launchChromium()` already documents and
already has an escape hatch for (`PW_EXECUTABLE_PATH`/`PW_CHROME_CHANNEL`),
and `playwright.config.ts`'s own `mobile-chromium` project honors the same
two variables. Setting `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium` (the
pre-installed full-Chromium build at a different, present revision) and
re-running confirmed the suite itself is completely clean: `pnpm test:e2e`
1042/1042 passed (27.2m; matches the two-hundred-and-first run's own count,
confirming no regression across the four stale runs), `check:reflow` (711
pages, no overflow at 320px), `check:landscape` (711 pages, no overflow at
667x375), `check:text-zoom` (711 pages, no overflow at 200%),
`check:print-width` (711 pages, no overflow in print media at 1032px), and
`check:lighthouse` (39 pages, all >= 0.90 in every category, the one known
bounded noindex/SEO exception excluded as documented). No code change was
needed or made for the browser-cache mismatch itself - `PW_EXECUTABLE_PATH`
is deliberately an opt-in environment variable rather than a hardcoded
sandbox path baked into the scripts, the same design the hundred-and-
forty-eighth run's own preview-daemon extraction already established, so
this is left as a one-off environment note rather than a repo change.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. The
documentation-vs-implementation audit is now complete across every `check:*`
script; worth trying a fresh angle (another content-vocabulary sweep, or
re-reading a script added since this pass began) rather than repeating it.

**Two-hundred-and-second run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, took a structural
angle rather than another `content/*.md` vocabulary grep: audited what each
existing `check:*` script's own documented scope actually covers versus what
it claims to. `check-internal-links.mjs`'s own header comment claimed
"canonical/hreflang tags, JSON-LD urls" were all covered by its
href/src-attribute crawl - true for canonical/hreflang (both are `<link
href="...">` HTML attributes, so already matched), but false for JSON-LD:
a JSON-LD `url`/`item` value is a JSON string inside a `<script
type="application/ld+json">` tag's *text content*, never an HTML attribute,
so the `href`/`src` regex never saw it. `check-jsonld.mjs` (the other script
touching JSON-LD) only validates structure - a real `@context`/`@type`,
sequential `position`s, every url absolute and under this site's own origin
- never that the url actually resolves to a real page. So a stale or
mistyped breadcrumb `item` URL (e.g. a copy-pasted edition year) would 404
for a search engine or structured-data consumer, silently, forever - nothing
on this site would have caught it. Confirmed live before treating it as
real: wrote a throwaway probe extracting every `url`/`item` string from
every page's JSON-LD blocks and checking each against the real build output
- 3,176 values across all 715 built HTML files (711 pages plus 4 redirect
stubs), all resolving today, a clean pass. Rather than leave the gap
open since nothing's broken *yet*, closed it permanently: extended
`check-internal-links.mjs` itself (the natural home - it already owns "does
this internal reference resolve to a real file", just needed a second
source of references) with `extractJsonLdLinks()`, which walks every parsed
JSON-LD block for a `url`/`item` key at any depth (an `item` is sometimes a
nested `Thing` object with no url of its own - e.g. an ItemList champion
entry - walking into it correctly finds nothing to add, not a bug) and
routes the results through the exact same `classifyLink`/`candidateDistPaths`
resolution every plain `href`/`src` link already goes through, deduplicated
against the page's own attribute-based links. Verified the new coverage
actually catches a regression, per this project's own standing discipline:
hand-edited a built page's breadcrumb JSON-LD to point at a nonexistent
slug and confirmed `pnpm check:links` failed with exactly that broken URL
named; reverted and rebuilt clean, confirmed passing again. Added 5 new
unit tests to `tests/unit/checkInternalLinks.test.ts` (a breadcrumb-plus-
self-referential-url extraction, the nested-Thing-with-no-url case, cross-
block deduplication, malformed-JSON resilience, and the no-JSON-LD-at-all
empty case).

**Verification:** `pnpm install --frozen-lockfile` (clean), `pnpm outdated`
(only the blocked `typescript` line), `pnpm lint` (238 files, 0/0/0), `pnpm
test` (902/902, up from 897), `pnpm test:coverage` (99.91%/99.31%,
unchanged - the new function is fully exercised by its own unit tests),
`pnpm build` (711 pages), `pnpm check:links` (715 pages checked, clean - and
confirmed catching a deliberately-reintroduced broken JSON-LD url before
being reverted), `pnpm check:jsonld` (unchanged, 1783 blocks across 711
pages, all structurally valid - confirming this run's change is additive,
not a duplicate of what that script already does), all other 27 fast
`check:*` scripts individually clean, `pnpm audit` (clean), `pnpm dlx knip
--no-config-hints` (same two standing false positives). Browser sweeps and a
full cold-start `pnpm test:e2e` not re-run - this change touches only a
build-time verification script and its own unit tests, no page markup,
styling or rendered content, matching this project's own established
practice for that class of change (e.g. the hundred-and-seventy-second run's
`check:superlative-claims`, the two-hundred-and-first run's own
`check:landscape`).

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. This
run's own angle (auditing each existing `check:*` script's documented scope
against what it actually implements, rather than assuming a script does
everything its own header comment claims) found one real, previously-open
gap and closed it; worth trying the same angle against the other `check:*`
scripts' own header comments before returning to another content-vocabulary
sweep - `check-jsonld.mjs`'s own comment was accurate on inspection this run
(it never claims to check reachability), but the remaining ~30 scripts
haven't all been re-read this way yet.

**Two-hundred-and-first run:** the two-hundredth run's own closing note
suggested "returning to a 'measure the real rendered page' idea not yet
tried" as the next fork, rather than another `content/*.md` vocabulary grep.
Surveyed every viewport size this project tests anywhere - every `check:*`
browser sweep, every hand-written `page.setViewportSize()` in `tests/e2e/`,
and `playwright.config.ts`'s own default - and found a genuine, previously
untested band: every viewport is either <=410px wide (portrait phones) or
>=1000px wide (tablet/desktop), and every one is >=740px tall. Nothing
anywhere exercises the 34rem-60rem (544px-960px) width band this site's own
media queries switch layouts across, and nothing shorter than 740px tall - a
real, common way phones are actually held (landscape) has zero coverage.

Investigated live with a throwaway probe (not assumed from reading the CSS):
at a real landscape-phone size (667x375, an iPhone SE/8 rotated), the mobile
nav drawer (`#site-menu`) genuinely overflows its own `max-height`
(scrollHeight ~649px vs. clientHeight ~313px) - unlike every existing test's
viewport, none of which come close to needing the drawer's `overflow-y: auto`
fix (Nav.astro's own comment documents the bug that fix closed: the theme
toggle, last in DOM order, silently stranded off-screen) to actually engage.
That scroll path has been sitting completely untested since it was written.

Built two permanent guards closing this gap:

1. `scripts/check-landscape-viewport.mjs` (`pnpm check:landscape`) - the same
   full-site horizontal-overflow sweep `check-reflow.mjs` already runs at
   320px, but at 667x375. Reuses `check-reflow.mjs`'s own page-listing/
   redirect-stub/budget helpers rather than duplicating them. Swept all 711
   pages: zero overflow regressions found - a clean pass, the same "build the
   permanent check even on a clean pass" reasoning `check-record-claims.mjs`'s
   own doc comment already gives, since the untested viewport band itself was
   the real gap, not a suspected specific bug.
2. Four new `tests/e2e/mobile.spec.ts` tests (English + Croatian home page x
   2 assertions each) at that same 667x375 viewport: one confirms the drawer
   actually needs to scroll here (so the suite can't silently go vacuous if
   the drawer's content ever shrinks), the other drives a real keyboard Tab
   walk through every control and asserts each stays visible inside the
   drawer as focus moves, including the theme toggle.

**Verified the new tests actually catch a regression, per this project's own
standing discipline - and learned this needed several attempts.** Swapping
`overflow-y: auto` for `overflow-y: hidden`, and separately reverting
`flex-wrap: nowrap` to `wrap`, both left all four new tests passing:
Chromium's native focus-scroll algorithm silently scrolls an `overflow:
hidden` container anyway (it only blocks user-initiated wheel/drag/scrollbar
scrolling, not programmatic or focus-driven scrolling), and reverting
`flex-wrap` alone happened to repack the drawer's content into a shorter,
still-fully-visible two-column layout rather than reproducing a stranded
control. Only `overflow-y: clip` (which genuinely blocks all scrolling,
including programmatic) made the keyboard-reachability test fail as expected,
in both languages - confirming that test, not the "needs to scroll" one,
is what actually guards this behavior. Restored the correct code and
reconfirmed all four tests pass again before committing. The meta-lesson:
`overflow: hidden` is not "unscrollable" in Chromium the way it looks from
reading the CSS - verify a regression test against a real failure before
trusting it, exactly as this project's own established discipline already
insists on for every fix, not just this one.

**Verification:** `pnpm install --frozen-lockfile` (clean), `pnpm outdated`
(only the already-documented blocked `typescript` line), `pnpm lint` (238
files, 0/0/0), `pnpm test` (897/897, unchanged), `pnpm test:coverage`
(99.91%/99.31%, unchanged), `pnpm build` (711 pages), `pnpm check:landscape`
(new, 711/711 pages clean), `pnpm audit` (clean), `pnpm dlx knip
--no-config-hints` (same two standing false positives - the new script is
referenced from `package.json` so knip doesn't flag it). The final diff
touches no `src/` file (the Nav.astro edits from the regression-proving
exercise below were reverted before committing), so this run ran its own 4
new `tests/e2e/mobile.spec.ts` tests directly (twice: once against the
correct code, and - per the regression-proving section above - once each
against three different deliberately-broken states) rather than a full
cold-start `pnpm test:e2e`, matching this project's own established practice
for a change that adds tooling/tests without touching page output (e.g. the
hundred-and-seventy-second run's `check:superlative-claims`). A full
cold-start run is still due whenever a future run next touches `src/` itself
- see the standing-health-check paragraph above.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. This run's
own angle (viewport-size coverage gaps across every test/check in the repo)
is closed for the one genuine gap found (mid-width x short-height,
"landscape phone"); no other untested viewport combination stood out during
the survey. The next run needs its own fresh angle.

**Two-hundredth run:** the hundred-and-ninety-ninth run's own fix (three
`innerHTML`-replaced dynamic lists silently losing their scoped CSS because
Astro's compiler-added `data-astro-cid-*` attribute never reaches
client-created markup) turned out not to be fully closed - that run searched
`.innerHTML =` call sites only, and one more instance of the identical bug
class used `document.createElement()`/`appendChild()` instead, so it never
matched that grep. `OnThisDay.astro` (the home page's "On this day in
football history" widget, shared by both languages) always rebuilds
`#on-this-day-list`'s `<li>` cards client-side via `createElement`/
`appendChild` on *every* page load with JavaScript enabled - not only on the
rare day the visitor's real date differs from the last deploy's build date,
the framing the component's own doc comment implied - so this one is more
severely and more frequently triggered than the three the hundred-and-
ninety-ninth run fixed. Confirmed live with a `getComputedStyle()` read
before the fix (`padding: 0px`, `background-color: rgba(0, 0, 0, 0)`, no
border, `data-astro-cid-*` absent from the freshly-created `<li>`) and again
after (`padding: 12px 14.4px`, `background-color: rgb(238, 241, 245)`,
`border: 1px solid rgb(215, 221, 229)`), not assumed from reading the CSS.
Fixed with the same established `:global(.on-this-day__list li)` pattern
`compare.astro`/`compare-players.astro` already use. Searched the rest of
`src/` for every other `createElement`/`insertAdjacentHTML`/`cloneNode`/
`appendChild` call site (`TournamentTable.astro`'s row-sort `appendChild` and
`Nav.astro`'s "More" menu `appendChild` both only *move* already-rendered,
already-scoped elements, never create new ones, so neither shares this bug)
to confirm this was the last uncaught instance of the pattern site-wide.
Added 2 new permanent e2e regression tests (`tests/e2e/mobile.spec.ts`, one
per language) asserting the rendered card keeps a non-zero padding and a
non-transparent background after the client script runs; both confirmed to
fail against the pre-fix code (reverted and re-tested before restoring the
fix) and pass after. `pnpm test` 897/897 (unchanged - pure CSS/e2e), `pnpm
lint` 237 files 0/0/0, `pnpm build` 711 pages, all 29 fast `check:*` scripts
clean, `pnpm outdated` (only the blocked `typescript` line), `pnpm audit`
clean, knip same two standing false positives, `pnpm test:coverage`
(99.91%/99.31%, unchanged). No PDF regeneration needed - the home page (the
only page `OnThisDay.astro` renders on) has no downloadable PDF, unlike the
hundred-and-ninety-ninth run's own compare-page fix. Both new tests, plus the
full `mobile.spec.ts` "On this day" test group (8 tests total), were run
directly and passed; a full cold-start `pnpm test:e2e` was run before
committing per this project's own standing discipline for a page-output
change and confirmed clean: **1038/1038 passed, 24.7 minutes** (up from 1036
with this run's own 2 new tests, zero failures). CI also confirmed green on
the pushed commit.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. This run's
own angle (auditing every *other* client-side DOM-creation API for the same
`data-astro-cid-*` scoping gap, not just `.innerHTML =`) is now exhausted
site-wide - no further instance found. The next run needs its own fresh
angle; the hundred-and-ninety-eighth run's suggested direction
(`forced-colors`/interactive-state coverage beyond `check:lighthouse`'s
39-page sample) is itself now closed by the hundred-and-ninety-ninth run, so
returning to a "measure the real rendered page" idea not yet tried - rather
than another `content/*.md` vocabulary grep - is likely the better next
fork.

**Hundred-and-ninety-ninth run:** followed the hundred-and-ninety-eighth
run's own suggested next angle - forced-colors/interactive-*state* coverage
beyond `check:lighthouse`'s 39-page sample - and it found something more
significant than a missing test: writing a `forced-colors: active` test for
the "find a team"/"find a player" search widgets' auto-highlighted option
(Nav.astro, every page, both languages) found that the highlight had never
actually rendered, in *any* color scheme or mode, since the widget shipped.
Root cause: every `<li>` in the listbox is injected at runtime via
`listbox.innerHTML = matches.map(...)`, so it never carries the
`data-astro-cid-*` attribute Astro's compiler adds to statically-authored
markup and requires of a plain scoped CSS selector - the entire
`.team-search__listbox li` rule block (padding, cursor, the `.is-active`
highlight, and its forced-colors outline) silently never matched a single
rendered option, confirmed with a live `getComputedStyle()` read
(`background-color: rgba(0, 0, 0, 0)`, plain body text) before the fix, not
assumed from the CSS. Fixed with `:global()` on the `li` half of each
selector - the same cross-scope pattern this file already uses for
`.site-menu.is-open :global(#theme-toggle)`.

That fix pattern (dynamically-`innerHTML`-injected markup silently missing
its component's scoped styles) turned out to be systemic, not a one-off:
the same root cause independently breaks `/compare`'s `.finals-meetings__list`
and `/compare-players`' `.shared-years__list` (both languages, four files
total) - `renderFinalsMeetings()`/`renderSharedYears()` replace their
container's entire `innerHTML`, `<ol>` included, whenever the reader picks a
new pair, so the re-rendered list reverts to a bare bulleted `<ol>` (no flex
card layout) the moment a reader uses either page's own shareable `?a=/&b=`
URL parameters (AGENTS.md's own rule 9) or either picker - confirmed live via
a direct `/compare?a=brazil&b=argentina` load. Fixed the same way in all four
files. Neither bug was a WCAG violation axe-core's automated rules would
flag (an unstyled-but-still-semantically-correct list/option isn't a
contrast or structure violation), which is exactly why 198 prior runs' axe
sweeps - including ones that already open this exact listbox or re-select a
team pair - never caught either one: this class of bug needs a real
`getComputedStyle()` read, not an accessibility-tree audit.

Added 6 new permanent e2e regression tests: 2 in
`tests/e2e/accessibility-forced-colors.spec.ts` (team-search/player-search
active-option highlight, baseline plus forced-colors outline, plus a WCAG
sweep) and 4 in a new `tests/e2e/dynamic-list-styling.spec.ts` (finals-
meetings/shared-years card layout survives a shared-URL-driven re-render,
both languages). `pnpm test` 897/897 (unchanged - pure CSS/e2e), `pnpm lint`
237 files 0/0/0, `pnpm build` 711 pages, all 29 fast `check:*` scripts clean,
`pnpm audit` clean, knip same two standing false positives. Assumed at
first that no PDF regeneration was needed, reasoning that Nav.astro's
`.site-header` and every changed compare-page selector are print-hidden -
wrong: `check:pdf-freshness` hashes each PDF's *source file*, not its
rendered print output, so any source change to `compare.astro`/
`compare-players.astro`/their Croatian equivalents marks their PDFs stale
regardless of whether the change is print-visible. CI's `check:pdfs` gate
caught the mistake on this PR; a follow-up commit regenerated all 700 PDFs
and confirmed `check:pdfs`/`check:pdf-outline` clean. See
`docs/PROJECT_STATUS.md`'s matching entry for the full investigation,
including the live before/after `getComputedStyle()` readings for all five
fixed rules.

**Hundred-and-ninety-eighth run:** with every "Open backlog" item below still
either environment-blocked or awaiting human sign-off, this run took a
different angle from the last ~25 runs' vocabulary greps: a real
Playwright `boundingBox()` accessibility audit of every custom interactive
control's actual rendered size at the 360px phone viewport, rather than
another `content/*.md` text sweep. AGENTS.md's own mobile-first convention
states "Interactive targets are at least 44px in any touch-facing control",
but the only automated guard for it was `tests/e2e/mobile.spec.ts`'s "every
drawer control is at least a 44px tap target" test, scoped to the nav
drawer alone - every other custom control on the site (the five tournament
filter `<select>`s used on every competition page, the quiz's "Check
answer"/"Check order"/restart buttons and order-challenge rank `<select>`s,
and `/compare`'s and `/compare-players`' own two team/player-picker
`<select>`s, both languages) had never actually been measured.

Found real, previously-unnoticed violations: the tournament filter
`<select>`s measured ~39px tall (`TournamentTable.astro`'s `.filters
select`), the quiz's check/restart buttons ~43px and its order-challenge
rank `<select>`s ~30px (`QuizCard.astro`/`QuizOrderCard.astro`/
`quiz.astro`/`hr/quiz.astro`), and the compare pages' two picker
`<select>`s ~39px (`compare.astro`/`compare-players.astro` and their
Croatian equivalents) - all short of the 44px floor, all measured with a
real headless-Chromium `boundingBox()` at 360px before and after, not
assumed from reading the CSS. Fixed each with an explicit `min-height:
2.75rem` (44px, this site's global `box-sizing: border-box`), re-measured
every instance back at exactly 44.0px, and screenshotted the two busiest
cases (the World Cup filter row, a quiz "Check answer" button) to confirm
neither text centering nor layout broke.

Adding `display: inline-flex` to the quiz buttons for centering caused a
real regression the first pass missed: `.quiz-card__check` ships `hidden`
in its markup until `QuizScript.astro` runs, and an author `display` rule
at equal-or-higher specificity than the UA stylesheet's `[hidden] {
display: none }` un-hides it - the exact CSS pitfall `quiz.astro`'s own
`.quiz__score[hidden]` rule already documents and guards against. The
first cold-start `pnpm test:e2e` run caught it directly (3 genuine
failures in `tests/e2e/no-js-quiz-and-search.spec.ts`, expecting the
check buttons to stay invisible with JavaScript off) rather than it
shipping silently - fixed with the same established
`.quiz-card__check[hidden] { display: none; }` override pattern, and a
second full cold-start run confirmed 1030/1030 clean.

Added seven new permanent regression tests (one per affected page/
component, both languages where the markup is a separately-duplicated
file rather than a shared component) to `tests/e2e/mobile.spec.ts` and
`tests/e2e/compare-players.spec.ts`, each measuring the real rendered
height of the relevant controls and asserting `>= 44`. Regenerated all 700
downloadable PDFs (`pnpm build:pdfs`) since `TournamentTable.astro`/
`compare.astro`/`compare-players.astro` and their Croatian equivalents all
changed - `check:pdfs`/`check:pdf-outline` both clean (700/700).

**Verification:** `pnpm install --frozen-lockfile` (clean; also bumped
`cspell` 10.3.5 -> 10.3.6, an in-range patch release `pnpm outdated`
surfaced - `typescript` remains the sole blocked line), `pnpm lint` (236
files, 0/0/0), `pnpm test` (897/897, unchanged - this is a pure CSS/e2e-test
change, no unit-testable logic touched), `pnpm build` (711 pages), all 29
fast `check:*` scripts individually clean, `pnpm audit` (no known
vulnerabilities), `pnpm dlx knip --no-config-hints` (same two standing
false positives), all five browser-based sweeps clean
(`check:reflow`/`check:print-width`/`check:html`/`check:text-zoom`: 711/711
pages each; `check:lighthouse`: 39/39 pages >= 0.9 in every category, the
one documented noindex/SEO exception aside), and two full cold-start `pnpm
test:e2e` runs - the first caught the `[hidden]` regression (1027 passed, 3
failed, 17.9 minutes), the second confirmed the fix (1030/1030 passed, 17.8
minutes, up from 1023 with the seven new tests).

**Left for a future pass:** the same environment-blocked/human-sign-off
open-backlog items as ever - see this file's "Open backlog", unchanged. This
run's own angle (measuring every custom control's real rendered size rather
than grepping `content/*.md` vocabulary) found four real, previously-shipped
touch-target violations across three features after ~25 runs of vocabulary
sweeps had returned nothing actionable - worth trying other "measure the
real rendered page" angles (e.g. `forced-colors`/color-contrast on
site-wide interactive states beyond what `check:lighthouse`'s 39-page
sample already covers) before returning to text-based content sweeps.

**Hundred-and-ninety-seventh run:** re-confirmed every item in "Open backlog"
below is still blocked on the same three things - this environment's outbound
network egress (rejects direct `WebFetch` to reference domains, confirmed
again), the `@astrojs/check@0.9.10` -> `typescript` 7 peer-dependency ceiling
(`npm view @astrojs/check@latest peerDependencies` unchanged: `^5.0.0 ||
^6.0.0`), and the `long-title` brand-suffix call, which still needs a human,
not a script. `pnpm outdated` showed nothing new beyond the same blocked
`typescript` line.

Rather than run another narrow `content/*.md` vocabulary grep - the last
dozen-plus runs (roughly the hundred-and-eighty-fifth through
hundred-and-ninety-sixth) have each tried a fresh word list and come back
with zero-to-one non-actionable hits, a clearly flattening curve - this run
instead spot-checked whether the two most recent real-world content updates
(the 2026 FIFA World Cup final/awards, added earlier this year, and the 2025
Ballon d'Or/Kopa/Yashin/Sócrates winners) are fully wired through the parts
of the site that don't show up in a `content/*.md` grep: the hand-translated
Croatian pages (`src/pages/hr/competitions/world-cup.astro` carries the same
2026 figures - MetLife Stadium attendance, Rodri's Golden Ball, Cubarsí's
Bronze Ball note - in Croatian) and the Golden Boot page (correctly scoped to
only World Cup/EURO top scorers, so the 2025 European Golden Shoe is out of
its scope by design, not a gap). Both checked out already current - no drift
found.

Ran the full fast standing health check: `pnpm install --frozen-lockfile`
(clean), `pnpm outdated` (only the blocked `typescript` line), `pnpm lint`
(236 files, 0 errors/0 warnings/0 hints), `pnpm test` (897/897, unchanged),
`pnpm build` (711 pages, unchanged). Did not re-run the five browser-based
sweeps or a cold-start `pnpm test:e2e` - unchanged since the
hundred-and-ninety-fifth run's same-day refresh, no page markup, styling, or
rendered content has changed since.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever, unchanged. Flagging for the human operator rather than
burying it in yet another "nothing new" paragraph: this routine has now run
197 times against a site whose original milestone and every website
requirement have been complete since roughly the fortieth run, and the last
~25 runs straight have found zero new bugs and shipped no user-facing
change - every open item left is explicitly blocked on inputs only a human
(or a differently-configured session) can supply: real outbound network
access for the source-liveness sweep and Nations League Best XI/attendance
lookups, a `typescript` 7-compatible `@astrojs/check` release, or a sign-off
on the branded `<title>` length. Continuing to run this exact routine every 4
hours is very unlikely to surface further value until one of those three
inputs changes; worth the human's judgment on whether to merge the standing
PR, pause or slow this schedule, or supply one of the blocking inputs
directly.

**Hundred-and-ninety-sixth run:** with every open backlog item below still
either environment-blocked or awaiting human sign-off, and `pnpm outdated`
unchanged (still only the blocked `typescript` line), tried two fresh
vocabulary angles across `content/*.md`: `check:ordinal-claims`'s own
`ORDINALS` word list caps at "tenth", so checked every content file for
"eleventh" through "twenty-third" in case a later-edition claim had outgrown
it - zero hits, no claim on the site currently needs an ordinal past
"tenth"; and a wider descriptive-claim sweep ("biggest", "widest margin",
"record margin", "highest-scoring", "treble", "grand slam", "clean sweep",
"most decorated", "most successful", "unbeaten", "undefeated", "winning
streak", "longest streak", "hat-trick") found three hits, none actionable:
`content/copa-america.md`'s "most successful team" bullet was already
ledgered (the same claim two prior runs' own comparative sweeps also
surfaced); `content/uefa-euro.md`'s "one of international football's
biggest surprises" (2004, Rehhagel bullet) is the same subjective,
non-quantifiable color-commentary class the hundred-and-ninety-fourth run's
own superlative-word sweep already found and excluded for a near-identical
phrase on the same edition; and `content/copa-america.md`'s "Colombia's only
Copa América title, won undefeated" (2001, Maturana bullet) is a genuinely
new claim shape none of the prior 195 runs' vocabulary greps had
specifically tried, but - like the Yashin/Cafu/Guevara/Cubarsí/Donnarumma
cases already on record - isn't derivable from any table this site carries:
there is no match-by-match results data anywhere in the content model, only
summary champion/host/runner-up/top-scorer tables, so "undefeated" can't be
checked against anything and isn't recorded as a false claim, just a
documented non-verifiable one. A single occurrence doesn't justify an eighth
verification-ledger checker the way each of the existing seven's systemic,
multi-claim patterns did. Both angles genuine, if negative/non-actionable,
results.

With no new actionable lead, ran the full fast standing health check:
`pnpm install --frozen-lockfile` (clean), `pnpm outdated` (only the blocked
`typescript` line), `pnpm lint` (236 files, 0 errors/0 warnings/0 hints),
`pnpm test` (897/897, unchanged), `pnpm build` (711 pages, unchanged), all
28 fast `check:*` scripts individually clean (same ledger counts as the
hundred-and-ninety-fifth run, all unchanged), `pnpm audit` (no known
vulnerabilities), and `pnpm dlx knip --no-config-hints` (same two standing
false positives). Did not re-run the five browser-based sweeps or a
cold-start `pnpm test:e2e` - the hundred-and-ninety-fifth run refreshed both
earlier the same day (2026-09-29) and no page markup, styling, or rendered
content changed since, so that baseline stays current per the standing
convention.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. This
run's own two fresh angles (ordinal words past "tenth", a wider descriptive-
claim vocabulary sweep) came back negative/non-actionable - the next run
needs its own new angle rather than repeating these or any prior run's own
vocabulary greps.

**Hundred-and-ninety-fifth run:** with every open backlog item below still
either environment-blocked or awaiting human sign-off, and `pnpm outdated`
showing nothing new beyond the already-documented blocked `typescript` line,
tried two more fresh vocabulary angles across `content/*.md` beyond the
hundred-and-ninety-fourth run's own four: a comparative-numeric sweep
("twice as many", "half as many", "three times as many", "most capped",
"most appearances", "joint-most", "shares the record", "tied for the
record") found only two hits, both already ledgered
(`record-claims-ledger.json`'s Copa América "most successful team" entry and
`quiz.ts`'s own generic "most titles" quiz-question text, which describes a
question shape rather than asserting a specific fact and so isn't a claim
any ledger covers); and a percentage/ratio sweep (`\d+%`, "half of its",
"more than half", "one in two/three/four/five", "every other edition") found
zero hits site-wide - this site has no claim shape phrased as a fraction or
percentage. Both genuine, if negative, results; no new checker gap found.
With the hundred-and-ninety-first run's own full-site browser sweeps and
cold-start `pnpm test:e2e` now four runs stale (last refreshed 2026-09-28,
none of runs 192-194 touched page markup so none re-ran them), and no new
vocabulary lead to chase instead, used this run to refresh that full
confirmation rather than defer it again: `pnpm install --frozen-lockfile`
(clean), `pnpm outdated` (only the blocked `typescript` line), `pnpm lint`
(236 files, 0/0/0), `pnpm test` (897/897, unchanged), `pnpm build` (711
pages), all 29 fast `check:*` scripts individually re-run and clean
(including all seven verification-ledger checkers and `check:claims-hr`),
`pnpm test:coverage` (99.91%/99.31%, unchanged), `pnpm audit` (no known
vulnerabilities), `pnpm dlx knip --no-config-hints` (same two standing false
positives), all five browser-based sweeps
(`check:lighthouse`/`check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html`, via this environment's documented
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
escape hatch - all clean, `check:lighthouse`'s 39-page sample scoring >=0.9
in every category with the one documented noindex/SEO exception), and a
cold-start `pnpm exec playwright test` (1023/1023 passed, 16.8 minutes).
Everything matched the documented baseline exactly - a genuine, if negative,
end-to-end confirmation that the whole accumulated branch still holds up.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. This
run's own two fresh-vocabulary angles (comparative-numeric phrasing,
percentage/ratio claims) came back negative/already-covered - the next run
needs its own new angle rather than repeating these or the
hundred-and-ninety-fourth run's own four. No page markup, styling or content
changed this run (only this file and `docs/PROJECT_STATUS.md`), so the
freshly-confirmed browser sweeps and `pnpm test:e2e` baseline stays valid
until a future run next touches actual page output.

**Hundred-and-ninety-fourth run:** with every open backlog item below still
either environment-blocked or awaiting human sign-off, and `pnpm outdated`
showing nothing new beyond the already-documented blocked `typescript` line,
tried four fresh vocabulary angles across `content/*.md` none of the prior
193 runs' own greps had specifically tried: "record-superseded" phrasing
("held the record until", "surpassed", "broke the record", "broken by",
"overtook", "eclipsed", "matched/equaled/equalled/tied the record") found
zero hits site-wide - this site has no claim shape describing an
old record being later broken; a wider superlative-word sweep
("greatest", "fastest", "widest", "narrowest", "smallest", "tallest",
"shortest", "quickest", "earliest", "latest", "longest") found exactly one
hit beyond already-ledgered claims - `content/uefa-euro.md`'s "Greece
produced one of international football's greatest surprises in 2004" - and
confirmed it's subjective color commentary, not a countable claim against
any table (no "greatest surprise" column exists to check it against, unlike
"the only"/ordinal/record-holder claims which name a specific fact a table
can confirm or refute); a "no other team/player has..." comparative-negation
sweep found only two hits, both already covered by existing ledgers (`record-
claims-ledger.json`'s Copa América "most successful team" entry, and the
already-ledgered Brazil-1970 ordinal claim); and a `docs/SOURCES.md`
duplicate-URL check found several URLs cited more than once, all confirmed
by inspection to be the same primary source legitimately backing multiple
separate research entries (e.g. a Wikipedia edition page cited once per
research note that drew on it) rather than a malformed/copy-pasted entry -
consistent with the hundred-and-seventy-fifth run's own "no duplicate or
malformed entries" finding, re-confirmed rather than assumed stale. All four
genuine, if negative, results. With no new angle to build on, used the rest
of the run for a full standing health check: `pnpm install --frozen-lockfile`
(clean), `pnpm outdated` (only the blocked `typescript` line), `pnpm lint`
(236 files, 0/0/0), `pnpm test` (897/897, unchanged), `pnpm build` (711
pages), all 29 fast `check:*` scripts individually re-run and clean
(including all seven verification-ledger checkers and `check:claims-hr`),
`pnpm check:spelling`/`check:spelling-hr` (both clean), `pnpm audit` (no
known vulnerabilities), and `pnpm dlx knip --no-config-hints` (same two
standing false positives as ever). Everything matched the documented
baseline exactly - a genuine, if negative, confirmation that the whole
accumulated branch still holds up. Browser sweeps and `pnpm test:e2e` not
re-run this run - no page markup, styling or content changed, only this
file; per the standing convention, those stay due whenever a run next
touches actual page output.

**Hundred-and-ninety-third run:** the hundred-and-ninety-second run's own
"Left for a future pass" note asked whether the other six verification-
ledger checkers (`check:record-claims`/`check:consecutive-claims`/
`check:since-claims`/`check:one-of-only-claims`/`check:completeness-claims`/
`check:superlative-claims`) have the same "anchor word separated from the
rest of the claim by intervening text" gap the ordinal-claims checker had
just been widened a third time to close. Re-tested each one's own pattern
against every real occurrence of its trigger vocabulary across all six
`content/*.md` files (grepping broadly first, then checking each hit against
the live regex with `node`, the same diligence the prior three widenings
used) rather than assuming a clean pass. `record-claims`/`consecutive-
claims` are bare trigger-word matches with no anchor to have a gap in - nothing
to widen. `one-of-only-claims` and `superlative-claims` were re-checked
against every "one of"/"only" occurrence site-wide and found already
complete - no new "one of only N"/"the only" phrasing slipped past either
pattern's own two prior widenings.
`check:since-claims` did have the gap: its bare `since \d{4}` pattern missed
"since <intervening possessive/determiner clause> <year>" phrasings -
`content/uefa-nations-league.md`'s Player of the Finals bullet ("since the
competition's 2019 launch") and `content/copa-america.md`'s Golden Boot
completeness bullet ("since the first in 1916") were both silently
unverified; a third, `content/ballon-dor.md`'s "since the award's creation
in 1956" bullet, was already covered by `superlative-claims-ledger.json`
(it also matches "the only") but had no `since-claims-ledger.json` entry of
its own. Widened `CLAIM_PATTERN` with a second alternative - "since"
followed by a determiner/possessive pronoun, 1-4 more words, then a year -
re-checked against every `since (the|its|his|her|their)` occurrence
site-wide before widening: 3 of 7 carried a year the bare pattern missed,
the other 4 either have no year or aren't inside a `- ` bullet, so zero new
noise. All three newly-caught claims verified true against their own
tables (Copa América Golden Boot winners' 48 years match the Champions
timeline's 48 editions exactly; Nations League Player of the Finals covers
all four Finals editions with no gap; the Ballon d'Or Winners table has
exactly one "Not awarded" row, 2020, across 1956-2025) and recorded in
`since-claims-ledger.json` - since-claims coverage goes from 23 to 26. Added
3 new unit tests to `tests/unit/checkSinceClaims.test.ts` covering the
possessive/determiner alternative and confirming an unrelated year 5+ words
after "since" still doesn't match.

**Verification:** `pnpm install --frozen-lockfile` (clean), `pnpm outdated`
(only the blocked `typescript` line), `pnpm lint` (236 files, 0 errors/0
warnings/0 hints), `pnpm test` (897/897, up from 894), `pnpm build` (711
pages), `pnpm test:coverage` (99.91%/99.31%, unchanged), all 29 fast
`check:*` scripts individually clean (`check:since-claims` itself: 26
claims checked, all ledgered; `check:claims-hr`: 205 claims, all paired,
confirming the existing Croatian translations already state the same years
correctly), `pnpm audit` (no known vulnerabilities), knip same two standing
false positives. Browser sweeps and `pnpm test:e2e` not re-run - this
change touches only a build-time verification script, its JSON ledger and a
unit test file, no page markup, styling or rendered content.

**Left for a future pass:** the same environment-blocked/human-sign-off open
backlog items as ever - see this file's "Open backlog", unchanged. The next
run again needs its own first-principles search for a fresh angle -
`check:one-of-only-claims`/`check:completeness-claims`/`check:superlative-
claims` came back clean this run but were only checked against today's
content; re-verify any of the seven checkers' patterns again whenever new
bullets are added in a shape not seen before, rather than assuming a past
clean pass stays clean forever. The hundred-and-ninety-fourth run's own four
fresh-vocabulary angles (record-superseded phrasing, a wider superlative-word
sweep, comparative-negation claims, `docs/SOURCES.md` duplicate URLs) all
came back negative/already-covered - the next run needs its own new angle
rather than repeating these same four greps.

**Hundred-and-ninety-second run:** with every open backlog item below still
either environment-blocked or awaiting human sign-off and `pnpm outdated`
showing nothing new, took a structural angle on the seven existing
verification-ledger checkers instead of a new vocabulary grep: re-tested
`check-ordinal-claims.mjs`'s own possessive-ordinal pattern against every
real "-ever" occurrence in `content/*.md`, rather than assuming the
hundred-and-eighty-third/-fourth runs' two prior widenings had closed every
gap in that pattern shape. Found one real, previously-unguarded claim:
`content/ballon-dor.md`'s 2025 Johan Cruyff Trophy entry phrases "PSG's ...
first-ever UEFA Champions League title" with the possessive several words
before the ordinal (separated by an intervening list), which neither
existing possessive alternative reaches. Widened the pattern a third time
with a bare `(first|...)-ever` alternative (no anchor needed - this site has
no non-claim use of an "Nth-ever" compound), verified the newly-caught claim
against the real-world record (PSG's only prior Champions League final was
2020, lost; they won it 5-0 over Inter Milan in 2025 - their first title),
and recorded it in `ordinal-claims-ledger.json`. `pnpm test` 894/894 (up
from 892), all 29 fast `check:*` scripts clean (`check:ordinal-claims` now
91 claims, `check:claims-hr` now 202), `pnpm build` 711 pages, `pnpm lint`
0/0/0, coverage unchanged at 99.91%/99.31%, `pnpm audit` clean, knip same
two standing false positives. Browser sweeps/`pnpm test:e2e` not re-run -
only a build-time script, its ledger and a unit test changed, no page
markup or content. See `docs/PROJECT_STATUS.md`'s matching entry for the
full writeup.

**Hundred-and-ninety-first run:** with every open backlog item below still
either environment-blocked or awaiting human sign-off, and `pnpm outdated`
showing no new in-range release beyond the already-documented blocked
`typescript` 7 line, used the run for a full standing health check -
including the five full-site browser sweeps and a cold-start `pnpm
test:e2e`, both several runs overdue for a re-confirmation (last done by the
hundred-and-eighty-eighth/-ninth runs respectively). `pnpm install
--frozen-lockfile`, `pnpm lint` (0/0/0), `pnpm test` (892/892), `pnpm build`
(711 pages), `pnpm test:coverage` (99.91%/99.31%, unchanged), all 29 fast
`check:*` scripts, `pnpm audit` (clean) and `pnpm dlx knip
--no-config-hints` (same two standing false positives) all came back clean
first. The five browser sweeps needed the environment's
`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
escape hatch (this sandbox's bundled `@playwright/test` looks for a
`chrome-headless-shell` build newer than the one preinstalled here - an
already-known, already-documented environment quirk, not a new bug) and all
came back clean: `check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html` each report zero violations across all 711 pages, and
`check:lighthouse`'s 39-page representative sample scored >=0.9 in every
category (the one documented noindex/SEO exception aside). The cold-start
`pnpm exec playwright test` run matched the standing baseline exactly:
1023/1023 passed in 16.6 minutes. No regressions, no new leads found - a
genuine, if negative, confirmation that the whole accumulated branch still
holds up end to end. See `docs/PROJECT_STATUS.md`'s matching entry.

**Hundred-and-ninetieth run:** built `check:completeness-claims`
(`scripts/check-completeness-claims.mjs`), a seventh verification-ledger
gate alongside `check:superlative-claims`/`check:ordinal-claims`/
`check:record-claims`/`check:consecutive-claims`/`check:since-claims`/
`check:one-of-only-claims`, this one for undated 100%-table-coverage claims
("a pattern unbroken across all N editions", "has had one across all N
editions", "in every edition so far") - a bug class none of the other six
patterns catches, since it uses no ordinal, no "since <year>", and none of
the other checkers' trigger words. A dedicated research pass grepping
`content/*.md` for the two literal phrasings actually in use found five
such claims, none previously ledgered: `content/fifa-world-cup.md`'s
Winning managers/Winning captains intros, `content/uefa-euro.md`'s and
`content/uefa-nations-league.md`'s Winning captains intros, and
`content/uefa-nations-league.md`'s Memorable moments host-top-four closer.
All five verified true by hand this run (World Cup managers' nationality
against the Editions table's Winner column; the three captains claims by
confirming no blank Winning-captains entry across 23/17/4 editions; the
Nations League host claim against the Finals table's own placement
columns) - no bug found, but a real, previously-unguarded gap closed.
Seeded `completeness-claims-ledger.json` with all five. Added 9 new unit
tests, wired into `package.json`/`.github/workflows/ci.yml`, and added
`completeness-claims-ledger.json` to `check-claims-hr.mjs`'s own
`LEDGER_FILES` array in the same commit (pre-emptively avoiding the exact
"new ledger, zero Croatian coverage" gap the hundred-and-eighty-sixth run
found and fixed for `one-of-only-claims-ledger.json`). `pnpm test` 892/892
(up from 880), `pnpm check:claims-hr` 201/201 claims clean (up from 196),
all 29 fast `check:*` scripts clean, `pnpm build` 711 pages, `pnpm lint`
0/0/0, coverage unchanged at 99.91%/99.31%. See `docs/PROJECT_STATUS.md`'s
matching entry for the full per-claim verification writeup.

**Hundred-and-eighty-ninth run:** with the hundred-and-eighty-eighth run's
five fresh quality angles all closed and no new concrete lead named, this
run's `pnpm outdated` surfaced four new in-range patch releases none of the
last several runs had seen yet: `@types/node` 26.6.2 -> 26.6.3, `cspell`
10.3.4 -> 10.3.5, `html-validate` 11.16.0 -> 11.16.1, and `sharp` 0.35.4 ->
0.35.5 (pinned to an exact version in `package.json`, so bumped by hand
after `pnpm update` alone left it untouched). `typescript` remains the sole
blocked line (`@astrojs/check@0.9.10`'s peer dependency still only allows
`^5.0.0 || ^6.0.0`, re-confirmed via `npm view`). Because two of the four
bumped packages - and `@playwright/test` itself, which had separately
drifted since the last lockfile refresh - are exactly what the site's e2e
suite and its WCAG assertions depend on, this run didn't default to the
"no content changed, skip e2e" shortcut several recent doc-only runs used;
instead it ran a full cold-start `pnpm test:e2e` specifically to verify the
bump didn't silently change behavior. Result: 1023/1023 passed (17.2
minutes), matching the hundred-and-eighty-sixth run's own last cold-start
count exactly - a genuine, positive confirmation, not an assumption carried
over. `pnpm lint` (234 files, 0/0/0), `pnpm test` (880/880), `pnpm build`
(711 pages), all 28 fast `check:*` scripts, `pnpm test:coverage`
(99.91%/99.31%, unchanged), `pnpm audit` (clean), and `pnpm dlx knip
--no-config-hints` (same two standing false positives) all re-confirmed
clean after the bump. See `docs/PROJECT_STATUS.md`'s matching entry for the
full writeup.

**Hundred-and-eighty-eighth run:** with the hundred-and-eighty-seventh run's
own thread fully closed and no new concrete next step named, tried five
different fresh quality angles (a new-claim-vocabulary grep across
`content/*.md`, a full manual read of the two least-audited content files -
Golden Boot and Nations League, a tally-table coverage audit, a
`forced-colors`/high-contrast-mode accessibility re-check, and a page-weight
budget headroom review) - all five genuine, if negative, results, each
reasoned through against the actual code/content rather than assumed. Used
the rest of the run for a full standing health check including the five
browser-based sweeps (`check:lighthouse`/`check:reflow`/`check:text-zoom`/
`check:print-width`/`check:html`), several runs stale: all clean, matching
the standing baseline exactly. See `docs/PROJECT_STATUS.md`'s matching entry
for the full per-angle writeup.

**Hundred-and-eighty-seventh run:** with every open backlog item below still
environment-blocked or awaiting human sign-off, followed the
hundred-and-eighty-sixth run's own named next step: manually read the other
five Croatian competition/award pages' note sections against
`content/*.md` the same way that run's own read of EURO's "Team of the
Tournament" section found a real bug - independent of whether any bullet
happened to match a ledger-checker's trigger word. Read all five pairs (FIFA
World Cup, Copa América, UEFA Nations League, Ballon d'Or, Golden Boot) in
full, bullet by bullet; found **zero** missing-commentary instances - a
genuine, thorough negative result confirming the EURO bug was an isolated
translation-pass gap, not systemic. Rather than stop there, turned the
audit into a permanent, automated regression guard: extended
`check:i18n-notes` with a dash-clause-parity check (flags an English note
item's trailing " - commentary" clause silently missing from its Croatian
counterpart at the same position) - after first calibrating and rejecting a
length-ratio heuristic whose own numbers, checked against the real EURO bug,
overlapped too heavily with ordinary legitimate variation to set a
zero-false-positive threshold. The dash-clause signal was calibrated clean
against all 507 current EN/HR item pairs site-wide and confirmed, via a live
reintroduce-the-bug-and-rebuild test, to catch 5 of the 6 real EURO bugs (the
sixth is a documented, honest gap - see `docs/PROJECT_STATUS.md`'s matching
entry). 10 new unit tests, `pnpm test` 880/880 (up from 870), all 28 fast
`check:*` scripts clean, `pnpm build` 711 pages, `pnpm lint` 0/0/0, coverage
unchanged at 99.91%/99.31%, `pnpm audit` clean, knip same two standing false
positives, `pnpm outdated` re-checked (no new releases). Full browser
sweeps/`pnpm test:e2e` not re-run - only a build-time script and its own
unit tests changed, no page markup or content. See
`docs/PROJECT_STATUS.md`'s matching entry for the full per-page audit
writeup and the length-ratio-vs-dash-clause calibration detail.

**Hundred-and-eighty-sixth run:** closed `check-claims-hr.mjs`'s documented
"same-page-coincidence" blind spot with real per-claim positional pairing
(the hundred-and-eighty-first/-fifth runs' own named next step), relying on
`check:i18n-notes` already guaranteeing identical section/item structure
between every EN/HR page pair to index straight into the right Croatian
bullet instead of checking a claim's year against the whole page's note
prose. The very first run against real content caught a genuine,
previously-shipped bug this exact blind spot had been hiding: five of
`content/uefa-euro.md`'s six Croatian "Team of the Tournament" entries were
missing their entire trailing commentary sentence (a sixth was missing half
of it) - fixed all six. Also found and fixed a second real gap while wiring
the ledger list: `one-of-only-claims-ledger.json` (added two runs ago) had
never been added to `check-claims-hr.mjs`'s own `LEDGER_FILES` array, so its
two claims had zero Croatian-translation coverage since the day they were
ledgered. `pnpm outdated` also found `vitest`/`@vitest/coverage-v8` 5.0.1 ->
5.0.2, installed. See `docs/PROJECT_STATUS.md`'s matching entry for the full
writeup, including the exact Croatian translations added and the full
verification run (870/870 unit, 711 pages, `check:claims-hr` 196/196 claims
clean, `check:pdfs`/`check:pdf-outline` 700/700 clean after a PDF
regeneration, and a full cold-start `pnpm test:e2e` re-run since this run -
unlike most recent ones - changed real page content).

**Hundred-and-eighty-fifth run:** built `check:one-of-only-claims`
(`scripts/check-one-of-only-claims.mjs`), a sixth verification-ledger gate
alongside `check:superlative-claims`/`check:ordinal-claims`/
`check:record-claims`/`check:consecutive-claims`/`check:since-claims`,
closing the "one of only N X to Y" bounded-set-claim idea the
hundred-and-eighty-fourth run's own investigation flagged but deliberately
left unbuilt (see the "Ideas not yet scoped" entry this run removed). Same
ledger-diff mechanism as the other five checkers, scoped to
`/\bone of only (\d+|one|two|...|ten)\b/i` - a *numbered* bounded-set claim
only, not the vaguer "one of only a handful of X" phrasing that also appears
in `content/uefa-euro.md` twice (deliberately excluded: "a handful of" names
no count to verify against, so matching it would just fail the build on an
unresolvable claim). Only two claims on the whole site currently match, both
in `content/fifa-world-cup.md`: the 1990 Winning managers bullet and the 1974
Winning captains bullet each say Beckenbauer is "one of only three men to win
it as both player and manager". Verified by cross-referencing the Winning
managers and Winning captains/Winning managers tables for every name that
appears as both a title-winning player in one year and a title-winning
manager in another: exactly three - Mário Zagallo (player 1958/1962, manager
1970), Franz Beckenbauer (player 1974, manager 1990) and Didier Deschamps
(player 1998, manager 2018) - the last of whom the 2018 bullet itself already
names as "joining Zagallo and Beckenbauer as a player-and-manager winner",
independently confirming the count of three from within the same table. Both
claims recorded in `one-of-only-claims-ledger.json`. Added 12 new unit tests
(`tests/unit/checkOneOfOnlyClaims.test.ts`, mirroring
`checkSuperlativeClaims.test.ts`'s structure) covering the digit/spelled-out
forms, the "a handful of" exclusion, and the same ledger-diff behavior as the
other five checkers. Wired into `package.json` and `.github/workflows/
ci.yml` as a required PR gate alongside the other five. `pnpm test` 857/857
(up from 845), all 28 fast `check:*` scripts clean, `pnpm build` 711 pages,
`pnpm lint` 0/0/0, coverage unchanged at 99.91%/99.31%, `pnpm audit` clean,
`pnpm dlx knip --no-config-hints` same two standing false positives. Browser
sweeps and `pnpm test:e2e` not re-run - this change touches only a
build-time content-verification script, its JSON ledger, a unit test and CI
config, no page markup/styling/behavior. See `docs/PROJECT_STATUS.md`'s
matching entry for the full writeup.

**Hundred-and-eighty-fourth run:** with the named backlog item from the
hundred-and-eighty-third run's own note ("check whether
`check:superlative-claims`/`check:record-claims`/`check:consecutive-claims`/
`check:since-claims` have the same possessive-phrasing gap `check:ordinal-
claims` had") the only concrete, not-yet-blocked item on the board, worked
through all four. `check:record-claims` (bare trigger words: "most",
"record", "youngest", etc.), `check:consecutive-claims`
("consecutive"/"back-to-back") and `check:since-claims` ("since <year>") each
already match anywhere in a bullet with no "the"-style anchor, so a
possessive phrasing of the same trigger word was already caught - no gap,
confirmed by reasoning about each pattern rather than assumed. `check:
superlative-claims` was different: its `/\bthe only\b/i` pattern has exactly
the same "the" requirement `check:ordinal-claims`'s did, and did have the gap
- three real claims (`content/copa-america.md`'s "Colombia's only Copa
América title" and "Bolivia won its only title", `content/uefa-euro.md`'s
"their only European Championship title") were silently unverified, the same
bug class the hundred-and-eighty-third run's ordinal fix closed. Widened the
pattern with the same two alternatives (`\w+'s\s+only`, `(his|her|its|their)
\s+only`), verified all three against their Champions tables (Colombia and
Bolivia each appear in `content/copa-america.md`'s champions table exactly
once; Netherlands in `content/uefa-euro.md`'s exactly once, 1988) and
recorded them in `superlative-claims-ledger.json` - superlative-claims
coverage goes from 21 to 24. Deliberately did not widen for "one of only N
X" (a bounded-set membership claim, not a strict-uniqueness claim - a
different shape, logged as its own "Ideas not yet scoped" entry rather than
folded in and risking noise). Added three new unit tests to
`tests/unit/checkSuperlativeClaims.test.ts` covering both possessive
alternatives; the existing "ignores bullets that use 'only' without 'the
only'" test (which includes "one of only three men to win it") still passes
unchanged, confirming the widened pattern stays precise. `pnpm test` 845/845
(up from 842), all 26 fast `check:*` scripts clean, `pnpm build` 711 pages,
`pnpm lint` 0/0/0, coverage unchanged at 99.91%/99.31%. See
`docs/PROJECT_STATUS.md`'s matching entry for the full per-claim writeup.

**Hundred-and-eighty-third run:** widened `check:ordinal-claims` a second
time (`\w+'s (first|...)` / `(his|her|its|their) (first|...)`, alongside the
existing bare `the (first|...)`) after noticing its own pattern still missed
every possessive phrasing of the identical claim shape - "the trophy's first
winner", "his second win", "Colombia won its first title" - 47 real claims
across all six content files that were silently unverified. Verified all 47
by hand against their own source lists/tables (Kopa/Yashin/Gerd Müller/Johan
Cruyff/Sócrates Trophy lists, Copa América's Best Player/Golden Glove/Golden
Boot/managers/captains lists and Champions timeline, FIFA's Golden Ball/
Golden Glove/Young Player/Fair Play Award lists and Editions table, the
World Cup Silver/Bronze Boot list, EURO's Team of the Tournament section,
Nations League's Finals table and Winning managers list); no false claim
found this run - a real, if negative, content-accuracy result - but ordinal-
claims coverage now stands at 90 claims, up from 43. See
`docs/PROJECT_STATUS.md`'s matching entry for the full per-claim writeup.

**Hundred-and-eighty-second run:** `pnpm outdated` surfaced two new in-range
patch releases (`astro` 7.3.4 -> 7.3.5, `cspell` 10.3.3 -> 10.3.4); installed
both. The hundred-and-eightieth run's own "left for a future pass" note
suggested spot-checking every other scrollable-table pattern on the site for
the same dead-sticky-header bug that run had found and fixed in
`TournamentTable.astro` - read `/compare`'s and `/compare-players`' own
`.vs__table thead th` sticky rule end to end and confirmed it does *not*
share the bug: unlike `TournamentTable.astro`, neither page wraps its table
in a `.t-wrap` scroll container at all (both files' own CSS comments say so
explicitly - three columns fit any phone width with no horizontal scroll
needed), so the sticky header correctly tracks the *page's* own scroll via
the existing `--site-header-height` offset, a different and already-working
pattern, not an unnoticed instance of the same bug. Also checked
`/records`' one `.t-wrap`-wrapped table (the rivalries ranking): it has no
sticky header at all, so the bug class doesn't apply there either - a real,
if negative, result closing out that follow-up thread. With no other
concrete lead, ran the full standing health check (`pnpm lint`/`pnpm test`/
`pnpm build`, all 29 fast `check:*` scripts, `pnpm dlx knip
--no-config-hints`, and a full cold-start `pnpm exec playwright test`):
everything came back clean, matching the hundred-and-eighty-first run's own
baseline (838/838 unit, 711 pages, 1023/1023 e2e in 16.5 minutes - the astro/
cspell patch bump caused no regression). `pnpm outdated` and `npm view
@astrojs/check@latest peerDependencies` both re-confirmed the `typescript` 7
upgrade is still blocked on the same `^5.0.0 || ^6.0.0` peer ceiling. See
`docs/PROJECT_STATUS.md`'s matching entry for full detail.

**Hundred-and-eighty-first run:** found a new angle none of the prior 180
runs had tried - all five verification-ledger claim checkers
(`check:superlative-claims`/`check:ordinal-claims`/`check:record-claims`/
`check:consecutive-claims`/`check:since-claims`) are deliberately scoped to
English `content/*.md` only, so nothing had ever verified a claim's Croatian
translation still asserts the same fact. A full manual audit of all 144
verified claims against their Croatian counterpart found zero discrepancies
(a genuine, if negative, result), then built `check:claims-hr`
(`scripts/check-claims-hr.mjs`) as a permanent, narrowly-scoped guard: every
year a verified claim names must also appear in its page family's Croatian
note prose, and the specific "the `<word>` earlier editions" completeness-
claim phrasing (the exact shape the project's two prior real cross-language
bugs took) must have its Croatian cardinal numeral present too. Self-tested
against two deliberately introduced bugs (both immediately reverted) before
committing - one caught, one missed due to a documented same-page-coincidence
limitation (see the script's own header comment and its
`docs/PROJECT_STATUS.md` entry for the honest scope). 15 new unit tests
(`tests/unit/checkClaimsHr.test.ts`); wired into CI as a required gate. See
`docs/PROJECT_STATUS.md`'s matching entry for the full writeup.

**Hundred-and-eightieth run:** found and fixed a real, long-standing bug
while reviewing `TournamentTable.astro` for other quality angles:
`.t-table thead th`'s `position: sticky; top: 0` had been present since the
component was first written but never actually stuck to anything, on any of
the ~700 pages that render a tournament table, at any desktop/tablet
viewport - reproduced with a real Playwright scroll-and-measure before
fixing it, not assumed from reading the CSS. Two things defeated it at once:
`.t-wrap` had `overflow-x: auto` with no explicit `overflow-y` (which CSS
force-promotes to `auto` too), making it its own scroll container, but with
no bounded height nothing ever actually scrolled it; and `.t-table` itself
(a closer ancestor of `thead th`) carried its own `overflow: hidden` -
originally added only to clip its content to its `border-radius` - making
*it* the nearer, and also never-scrolled, scroll-container ancestor instead.
Fixed both: `.t-wrap` now gets a real `max-height` (`min(70vh, 42rem)`) with
`overflow-y: auto`, becoming a genuinely scrollable box, and `.t-table`'s
`overflow: hidden` is gone (the border-radius clip moves up to `.t-wrap`,
confirmed with a screenshot that the corners are still intact). Reset to
`overflow-y: visible`/`max-height: none` in the `<=40rem` mobile card layout
(no sticky header there, thead is visually hidden) and, separately, in print
media (a tall table's later printed pages need real header labels, not the
wrapper's scrollport clipping them away) - the print-media reset required
regenerating all 700 downloadable PDFs (`check:pdf-freshness` confirmed both
that it was genuinely needed, by reverting the PDFs and re-running the
check, and that the regenerated set is clean). Added
`tests/e2e/sticky-table-header.spec.ts` (3 tests): a long table's header
stays pinned while its own wrapper scrolls, a short table gets no needless
scrollbar, and the pinned header never overlaps the site's own sticky nav
header when the whole page scrolls instead. **Verification:** `pnpm lint`
(0/0/0), `pnpm test` (823/823), `pnpm build` (711 pages), 12 relevant
`check:*` scripts (links, jsonld, meta, heading-outline, theme-flash,
reachability, precache, sitemap, image-dimensions, locale-consistency,
theme-color, pdf-outline) all clean, `check:print-width`/`check:reflow`
across all 711 pages (no horizontal overflow), and the full `pnpm test:e2e`
cold-start run: 1023/1023 passed (16.5 minutes). See
`docs/PROJECT_STATUS.md`'s matching entry for the full writeup.

**Hundred-and-seventy-ninth run:** searched for a new verification-ledger
claim shape (unbeaten/undefeated/highest-scoring/biggest-margin/fastest/
"last team to"/sole/unique/unprecedented/"last time"/reclaimed/regained
phrasing, and spelled-out numeric-count claims) and found none systemic
enough to justify a sixth gate - a real negative result. Re-confirmed all
six competition/award content files are current through their latest 2024/
2025 editions. With no new angle, ran the full cold-start `pnpm test:e2e` +
all-five-manual-browser-sweep confirmation (four runs stale since the
hundred-and-seventy-fifth run): everything came back byte-identical to the
documented baseline, no regression from the two verification-ledger gates
landed since. Also re-confirmed the `PW_EXECUTABLE_PATH=/opt/pw-browsers/
chromium` escape hatch is still needed in a fresh container (Playwright
browser revision mismatch, documented since the hundred-and-seventy-fifth
run) - same known cause, not a new issue. See `docs/PROJECT_STATUS.md`'s
matching entry for the full writeup.

**Hundred-and-seventy-eighth run:** built `check:since-claims`
(`scripts/check-since-claims.mjs`), a fifth verification-ledger gate
alongside `check:superlative-claims`/`check:ordinal-claims`/
`check:record-claims`/`check:consecutive-claims`, this one for "at every X
since Y; no equivalent existed at earlier editions" completeness claims - a
bug class none of the other four patterns catches, and the one claim shape
on this site that is arithmetic (several bullets also name the exact count
of earlier editions) rather than purely cross-referential. Seeding the
ledger (23 claims across five content files) found and fixed two genuine
errors, the identical "four earlier editions" mistake in two different
files: `content/fifa-world-cup.md`'s Fair Play Award bullet should say
eight (there are eight World Cups before 1970), and
`content/uefa-euro.md`'s Player of the Tournament bullet should say nine
(there are nine EUROs before 1996) - both fixed in English and Croatian.
See `docs/PROJECT_STATUS.md`'s matching entry for the full writeup.

**Hundred-and-seventy-seventh run:** widened `check:ordinal-claims`'s
extraction pattern - it required a "to" within 50 characters of "the
first/.../tenth", which missed the site's other common ordinal-claim
phrasing ("the first of his two wins", "won the first-ever X"). Dropping
that requirement (after confirming zero new noise on the full corpus) took
its coverage from 17 to 43 claims and found one genuine error while seeding
the 26 newly-caught ones: Copa América's Cafu captain note said his 1999
armband led to a World Cup title "two years later" when the actual gap
(1999 to 2002) is three years - fixed in English and Croatian. See
`docs/PROJECT_STATUS.md`'s matching entry for the full writeup.

**Hundred-and-seventy-sixth run:** built `check:consecutive-claims`
(`scripts/check-consecutive-claims.mjs`), a fourth verification-ledger gate
alongside `check:superlative-claims`/`check:ordinal-claims`/
`check:record-claims`, this one for "consecutive"/"back-to-back" claims - a
bug class none of the other three patterns reliably catches (e.g. "his
second, back-to-back" matches neither "the only" nor "the first...to").
Seeded the ledger by checking all 22 current claims this pattern matches; no
new false claim turned up this run. See `docs/PROJECT_STATUS.md`'s matching
entry for full detail.

**Hundred-and-seventy-fifth run:** with the open backlog below still fully
blocked (re-confirmed: `WebFetch` to `en.wikipedia.org` still returns
`EGRESS_BLOCKED`, no new `@astrojs/check` release) and no new narrow
prose-claim pattern found worth a fourth verification-ledger gate (checked
"longest/shortest/earliest/latest/greatest/smallest" and the `'s only`
possessive-uniqueness phrasing the superlative checker's own comments
already considered and deliberately excluded - both come back near-empty
and non-actionable, not a new gap), this run's contribution was a full
cold-start confirmation sweep of the entire accumulated branch: `pnpm
install`, `pnpm lint`/`pnpm test`/`pnpm build`, all 25 `check:*` scripts,
plus the full `pnpm test:e2e` suite and all five manual browser sweeps
together - the complete combination last run together as of the
hundred-and-seventieth run, now 5 runs and several new verification-ledger
gates stale. Also confirmed `docs/SOURCES.md` (845 URLs, 2,835 lines) has
no duplicate or malformed entries. See `docs/PROJECT_STATUS.md`'s matching
entry for full detail, including a build-container note on this session's
Playwright browser cache.

**Hundred-and-seventy-fourth run:** built `check:record-claims`
(`scripts/check-record-claims.mjs`), a third verification-ledger gate
alongside `check:superlative-claims` and `check:ordinal-claims`, this one
for "most/record/youngest/oldest/highest/biggest/largest/lowest/fewest"
record-holder claims - a bug class neither existing checker's pattern
covers. Seeded the ledger by checking all 36 current claims this pattern
matches; no new false claim turned up this run (unlike the 171st and 173rd
runs' own ledger-seeding passes for the other two claim shapes), but the
checker is now a standing guard against one slipping in unverified in the
future. See `docs/PROJECT_STATUS.md`'s matching entry for full detail.

**Hundred-and-seventy-third run:** built `check:ordinal-claims`
(`scripts/check-ordinal-claims.mjs`), the other half of the idea the
hundred-and-seventy-first run's "Left for a future pass" note sketched but
didn't build - a verification-ledger gate for "the first/second/.../tenth X
to Y" ordinal-rank claims, sibling to `check:superlative-claims`. The
roadmap's own proposed regex proved too noisy against the real content (it
matched unrelated bullets on nothing more than an ordinal-suffixed word and
an unconnected "to" appearing anywhere in a long sentence); a
50-character, period-bounded window fixed that with zero false matches.
Verifying all 17 current claims to seed the ledger found and fixed a
genuine false claim: `content/uefa-euro.md` said Wembley's 2020 final was
"the second" stadium to host two EURO finals, but Paris's Parc des Princes
reached that milestone first, in 1984 (after Rome in 1980) - Wembley is
actually the third, not the second. Fixed in both the English content and
its Croatian counterpart (`src/pages/hr/competitions/euro.astro`). Two of
the 17 claims (Cubarsí "first defender", Donnarumma "first goalkeeper") rely
on player position, a fact no table on this site carries, and are recorded
in the ledger as not-independently-verifiable rather than guessed at, the
same treatment `superlative-claims-ledger.json` already gives the Yashin/
Cafu cases. See `docs/PROJECT_STATUS.md`'s matching entry for full detail.

**Hundred-and-seventy-second run:** built the "narrow automated checker for
'the only X to Y' prose claims" idea the hundred-and-seventy-first run had
flagged but not built (see `docs/ROADMAP.md`'s prior "Ideas not yet scoped"
entry, now closed - superseded by this section). `check:superlative-claims`
(`scripts/check-superlative-claims.mjs`) extracts every `content/*.md`
bullet matching `/\bthe only\b/i` and diffs it against a hand-maintained
verification ledger (`scripts/superlative-claims-ledger.json`); a bullet
whose exact text isn't in the ledger - because it's brand new or its wording
changed even slightly - fails the build until it's checked against the
source table it summarizes and recorded with a note on how. Wired into
`.github/workflows/ci.yml` as a required PR gate alongside
`check:award-tallies`. Seeding the ledger meant actually re-verifying all 21
current "the only" claims across all six content files against their real
source tables (not just re-asserting the hundred-and-seventy-first run's own
spot-check) - 18 were independently confirmed by cross-referencing counts/
repeats/name-overlaps directly in the tables; three (Ballon d'Or's "Yashin
is the only goalkeeper winner", Copa América's "Guevara is the only guest-
nation winner", World Cup's "Cafu is the only player in three straight
finals") aren't derivable from any column this site's tables carry (no
position/confederation/full-squad-appearance data) and are recorded as such
rather than given a fabricated verification method - the first two matching
the hundred-and-seventy-first run's own documented caveat about Guevara, the
Cafu case newly identified by this run. See `tests/unit/
checkSuperlativeClaims.test.ts` for unit coverage of the extraction/diff
logic. **Verification:** `pnpm lint` (221 files, 0/0/0), `pnpm test`
(783/783, up from 772), `pnpm build` (711 pages), `pnpm check:superlative-
claims` (21 claims, 0 unverified), `pnpm check:award-tallies` (4/4),
`pnpm check:spelling` (15 files, 0 issues) - all clean.

**Hundred-and-seventy-first run:** with the open backlog below still fully
blocked, this run tried a quality angle not used in the prior 170 runs:
cross-checking hand-written prose "the only X to Y" superlative claims in
the editorial note bullets against the actual data in the tables they
summarize (rather than re-running the standing health-check suite, or
searching for missing data). Found and fixed two genuine, previously-
unnoticed factual errors - a false "only" claim in the FIFA World Cup Fair
Play Award notes (2010's Spain was actually the *fifth* team to also win
the World Cup that year, not the only one) and a false "only" claim in the
Copa América Golden Boot notes (Eduardo Vargas wasn't the only player to win
in consecutive editions - Pedro Petrone did too, in 1923-1924) - in both the
English content and the matching hand-translated Croatian pages, plus the
two e2e assertions pinned to the old wording. `pnpm lint`/`pnpm test`/`pnpm
build` and every relevant `check:*` script re-ran clean after the fix. See
`docs/PROJECT_STATUS.md`'s matching entry for full detail, including the
~2 dozen other superlative claims spot-checked and confirmed still correct.

**Hundred-and-seventieth run:** with the open backlog below still fully
blocked (re-confirmed: no new `@astrojs/check` release; no new angle on the
network-access or human-sign-off items), this run found one genuinely
actionable item - `pnpm outdated` showed an in-range `astro` patch release
(7.3.3 -> 7.3.4) - installed it, then used the rest of the run for the full
standing confirmation sweep the last several runs' own "left for a future
pass" notes kept deferring: the complete cold-start `pnpm test:e2e` suite and
all five manual browser sweeps, none of which had been re-run together since
before the hundred-and-sixty-seventh run. Everything came back byte-identical
to the documented baseline (no regression from the astro bump or from the
several small fixes landed since): 772/772 unit, 1020/1020 e2e, 711 pages,
all `check:*` scripts clean. No new bug found. See `docs/PROJECT_STATUS.md`'s
matching entry for full detail.

## Open backlog

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
  by different outlets); 2021 and 2025 have no attendance figure confirmed by
  two independent sources. Left unreported in `content/uefa-nations-league.md`
  rather than guessed. Re-tried with `WebSearch` the hundred-and-sixty-second
  run (2026-09-21): every result for all three editions traces back to the
  same Wikipedia-derived figure (41,110 for 2023, 31,511 for 2021) with no
  second, independently-*sourced* figure turning up in the search snippets
  themselves (only mirrors/derivatives of the one figure) - so this still
  doesn't clear the site's own two-independent-sources bar. `WebFetch` to
  `uefa.com` (which might carry the tournament's own official figure) is
  blocked (see the link-liveness item above), so there's no way to read a
  second primary source directly, only search-engine summaries of one.
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
  2026-09-20)**: `quiz.ts`, `sources.ts` (two lines -
  `disambiguateLabels()`'s `counts.get(base) ?? 1` fallback joins the
  previously-documented `baseLabel`-lookup line), `tableSort.ts` and `url.ts`
  each have one or two branches that an argument's own invariants make
  unreachable in practice (e.g. `sources.ts`'s fallback can never actually
  miss, since `counts` is built by iterating the exact same array being
  mapped afterward). Left as-is per the eighth intensive run's original
  classification; re-verify line numbers next time any of these four files
  changes materially.

## Ideas not yet scoped

- **"Youngest winner" ranking** (`/records`-style, alongside the existing
  "Longest wait between titles"/"Back-to-back champions" sections): still
  not built as a full ranking - would need a reliable per-player birth date
  for all ~130 Ballon d'Or/Golden Boot winners, which exists nowhere in
  `content/` today, and fabricating that many biographical facts in one
  unattended pass (with no independent per-player source to cross-check each
  one against) still risks shipping confidently-wrong history. The
  two-hundred-and-thirteenth run shipped a much narrower, lower-risk slice
  instead: the two *endpoints* of that ranking for Ballon d'Or specifically -
  Stanley Matthews (oldest-ever winner, 1956, age 41) and Ronaldo/Brazil
  (youngest-ever, 1997, age 21) - as two new `content/ballon-dor.md`
  "Memorable moments" bullets, each independently confirmed via two separate
  WebSearch passes (Guinness World Records' own page for Matthews; see
  `docs/SOURCES.md`'s matching entry). These are single, already-synthesized,
  widely-and-consistently-reported records, a fundamentally safer research
  task than computing an age from a raw birth date for all ~130 winners with
  no cross-check. The full generated ranking (every winner, not just the two
  extremes) remains unbuilt and still needs either a trustworthy bulk birth-
  date source or a session with direct page-fetch access to verify one
  player at a time at that scale.
