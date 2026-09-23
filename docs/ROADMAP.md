# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full run-by-run history of every feature, bug fix,
verification sweep and decision (171 intensive runs as of 2026-09-23) lives
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
test:coverage`/`pnpm build`, all 26 `check:*` scripts (21 fast enough to run
every time and wired into `.github/workflows/ci.yml` as required PR gates,
`check:theme-color` among them as of the hundred-and-sixty-eighth run;
`check:lighthouse`/`check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html` are full-site Playwright/browser sweeps kept
manual/intensive-run-only rather than a required PR gate, purely for their
~700-page-load runtime), `pnpm audit`, and `pnpm dlx knip --no-config-hints`.
As of the hundred-and-seventieth run (2026-09-22): 772/772 unit tests, `pnpm
lint` at 0 errors/0 warnings/0 hints, 711 pages built, zero `pnpm audit`
vulnerabilities, and the same two standing `knip` false positives as ever
(`scripts/test-preview-server.mjs`, used only as a Playwright
`webServer.command`, never imported; `@cspell/dict-hr-hr`, used only via
`.cspell/hr-notes.cspell.json`'s `"import"` field, never a JS `import`) -
neither actually unused, knip's static analysis just can't see a reference
inside a config-file string. All five manual browser sweeps
(`check:lighthouse`/`check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html`) were re-run fresh this run against the current build: clean on
all 711 pages, `check:lighthouse`'s 39 audited pages every category a perfect
1.00 except the 404-page entry's `seo`, a known/bounded/documented exception,
not a regression. The full `pnpm test:e2e` suite was also re-run cold-start:
1020/1020 passed (16.5 minutes).

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
- **Narrow automated checker for "the only X to Y" prose claims** (flagged
  by the hundred-and-seventy-first run after it found and fixed two false
  ones by hand): a generic checker for arbitrary superlative claims in
  editorial note bullets isn't tractable without NLP-level claim extraction,
  but a narrower pattern-match (e.g. flag any note bullet matching `/\bthe
  only\b/i` or an ordinal-plus-"to" pattern for manual re-verification
  whenever its source table changes) could catch a recurrence of this bug
  class cheaply. Not built yet - only worth it if this class of error
  recurs.
