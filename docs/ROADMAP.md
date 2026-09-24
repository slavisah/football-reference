# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full run-by-run history of every feature, bug fix,
verification sweep and decision (179 intensive runs as of 2026-09-24) lives
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
test:coverage`/`pnpm build`, all 31 `check:*` scripts (26 fast enough to run
every time and wired into `.github/workflows/ci.yml` as required PR gates,
`check:since-claims` the newest as of the hundred-and-seventy-eighth run;
`check:lighthouse`/`check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html` are full-site Playwright/browser sweeps kept
manual/intensive-run-only rather than a required PR gate, purely for their
~700-page-load runtime), `pnpm audit`, and `pnpm dlx knip --no-config-hints`.
As of the hundred-and-seventy-ninth run (2026-09-24): 823/823 unit tests,
`pnpm lint` at 0 errors/0 warnings/0 hints, 711 pages built, zero `pnpm
audit` vulnerabilities, and the same two standing `knip` false positives as
ever (`scripts/test-preview-server.mjs`, used only as a Playwright
`webServer.command`, never imported; `@cspell/dict-hr-hr`, used only via
`.cspell/hr-notes.cspell.json`'s `"import"` field, never a JS `import`) -
neither actually unused, knip's static analysis just can't see a reference
inside a config-file string. The five manual browser sweeps
(`check:lighthouse`/`check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html`) and the full `pnpm test:e2e` suite were last re-run together
cold-start as of the hundred-and-seventy-ninth run (2026-09-24): clean on
all 711 pages, 1020/1020 e2e passed - fresh as of this run.

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
  dependency - re-confirmed via `npm view @astrojs/check@latest
  peerDependencies` as recently as the hundred-and-sixty-fifth run
  (2026-09-22; `pnpm outdated` shows `typescript` at 5.9.3 vs. 7.0.2 latest,
  no new `@astrojs/check` release since). Re-check whenever `pnpm outdated`
  next shows a new `@astrojs/check` release.
- **`docs/SOURCES.md` link-liveness sweep**: blocked. This environment's
  outbound network/egress policy rejects direct requests to external
  reference domains - confirmed repeatedly, most recently 2026-09-22
  (hundred-and-sixty-fifth run: `WebFetch` to `en.wikipedia.org` still
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
  "Longest wait between titles"/"Back-to-back champions" sections): needs a
  reliable per-player birth date for ~130 Ballon d'Or/Golden Boot winners,
  which exists nowhere in `content/` today. Not pursued: fabricating that
  many biographical facts from memory in an unattended run, with no
  independent per-player source to cross-check against, risks shipping
  confidently-wrong history. Needs a session with working external network
  access to source it properly, the same blocker as the link-liveness sweep
  above.
