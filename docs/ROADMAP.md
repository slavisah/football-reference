# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full run-by-run history of every feature, bug fix,
verification sweep and decision (168 intensive runs as of 2026-09-22) lives
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
As of the hundred-and-sixty-eighth run (2026-09-22): 772/772 unit tests (5
new, for `check-theme-color.mjs`'s `parseCssCustomProperty`/
`parseThemeColorMeta` helpers - see below), `pnpm lint` at 0 errors/0
warnings/0 hints, 711 pages built, zero `pnpm audit` vulnerabilities, and two
standing `knip` false positives: `scripts/test-preview-server.mjs`
(used only as a Playwright `webServer.command`, never imported) and
`@cspell/dict-hr-hr` (used only via `.cspell/hr-notes.cspell.json`'s
`"import"` field, never a JS `import` - added the hundred-and-sixty-first
run for `check:spelling-hr`) - neither actually unused, knip's static
analysis just can't see a reference inside a config-file string. The four
manual browser sweeps (`check:lighthouse`/`check:reflow`/`check:text-zoom`/
`check:print-width`) were last executed the hundred-and-sixty-seventh run
(2026-09-22): `check:reflow`/`check:text-zoom`/`check:print-width`/
`check:html` clean on all 711 pages, `check:lighthouse` clean on all 38
audited pages (every category a perfect 1.00 except the 404-page entry's
`seo`, a known/bounded/documented exception, not a regression) - not
re-run the hundred-and-sixty-eighth run since nothing that run touched (a
source-only, no-build/no-browser regex check) is in their scope; a future
run should still re-confirm them fresh.

**Hundred-and-sixty-eighth run:** with the open backlog below still fully
blocked (re-confirmed: `WebFetch` to `en.wikipedia.org` still returns
`EGRESS_BLOCKED`; `pnpm outdated` shows no new `@astrojs/check` release),
this run closed a real, previously-documented-but-unguarded drift risk
instead: `docs/PROJECT_STATUS.md`'s "Known caveats" list already named
`BaseLayout.astro`'s theme-color meta (`content`/`data-light`/`data-dark`)
as needing to stay byte-for-byte in sync with `global.css`'s
`--light-accent`/`--dark-accent` custom properties, with no automated check
enforcing it - the one hand-maintained cross-file pair in this repo without
a permanent regression guard, unlike `check:award-tallies`/
`check:edition-header-labels`/`check:image-dimensions`. Added
`check:theme-color` (`scripts/check-theme-color.mjs` + `tests/unit/
checkThemeColor.test.ts`), wired into `.github/workflows/ci.yml` as a
required gate, and sanity-checked it actually fails on a deliberately
introduced mismatch before reverting. See `docs/PROJECT_STATUS.md`'s
matching entry for full detail.

**Hundred-and-sixty-seventh run:** closed the one remaining page shape with
zero `check:lighthouse` coverage: `/404.html`, the site's shared bilingual
error page. Added it to `scripts/check-lighthouse.mjs`'s `PAGES_TO_AUDIT`,
which surfaced a real (if fully expected) below-budget score - `seo: 0.63`,
entirely from Lighthouse's `is-crawlable` audit correctly flagging the
page's own deliberate `noindex` tag, confirmed by a direct per-audit probe
to be the *only* failing SEO audit on that page. Rather than silently raise
the file's global `MIN_SCORE` or drop the page from coverage, added a
named, bounded, unit-tested exception (`EXPECTED_SEO_EXCEPTIONS`/
`isExpectedSeoException`) that only suppresses a `seo` score at or above the
known noindex-penalty floor for that one page - a further regression on that
page still fails loudly. Also re-tried the small, four-data-point "excluded
historical attendance figures" item below via `WebSearch` (1930 World Cup
final) - still a genuine, unresolved source conflict (68,346 official vs.
90,000+ widely reported), same as already documented, so left as-is rather
than guessed.

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
