# Roadmap

This file is the short, current-state entry point for "what's next" - kept
short on purpose. The full history of every feature, bug fix and decision
lives in `docs/PROJECT_STATUS.md` (append-only, one entry per change); this
file only tracks the open backlog, not the log of what already shipped.

## Status: original backlog complete

Every milestone named in `AGENTS.md`'s "Recommended first milestone" and
every requirement in `docs/WEBSITE_REQUIREMENTS.md` is live, in English and
Croatian: all six competition/award pages (FIFA World Cup, UEFA EURO, UEFA
Nations League, Copa América, Men's Ballon d'Or, Golden Boot), `/records`,
`/compare`, `/compare-players`, `/teams/<slug>` and `/players/<slug>`
profile directories, `/glossary`, the Family Quiz, per-edition pages for
every competition and both individual awards
(`/competitions/<competition>/<year>`), light/dark mode, a print stylesheet,
downloadable print PDFs, a PWA/offline mode, and an "On this day" widget.
See `docs/PROJECT_STATUS.md`'s "Known caveats" section (near the end of the
file) for the authoritative, always-current summary of what exists and any
standing quirks.

## Open backlog

- **Per-edition print PDFs**: closed 2026-08-25 - every
  `/competitions/<competition>/<year>` page (and its Croatian sibling) now
  has a downloadable PDF, the same "Download printable PDF" convention every
  other page family already had. See `docs/PROJECT_STATUS.md`'s matching
  entry for the implementation.
- **Per-edition SportsEvent JSON-LD**: closed 2026-08-25 (fifth intensive
  run) - every `/competitions/<competition>/<year>` page (all 14 route
  files, EN + HR) now carries its own `SportsEvent` structured-data block
  via the new `buildEditionSportsEvent()` (`src/lib/jsonLd.ts`), closing a
  gap `EditionProfile.champion`'s own doc comment had predicted since the
  edition-page rollout but that was never actually wired up. See
  `docs/PROJECT_STATUS.md`'s matching entry for the implementation.
- **Ballon d'Or/Golden Boot index-page SportsEvent**: closed 2026-08-25
  (sixth intensive run) - `ballon-dor.astro` and `golden-boot.astro` (both
  EN + HR) now call `buildLatestEditionSportsEvent()` the same way the four
  team-competition index pages already did. Resolved the "generic title"
  blocker by passing an explicit per-award name at each call site instead of
  reusing `loadCompetition()`'s content-frontmatter `title`: Ballon d'Or
  keeps `data.title`/the page's own Croatian `title` constant (already
  unambiguous, one table per page), while Golden Boot's two same-titled
  loads each get their own name ("FIFA World Cup Golden Boot"/"UEFA EURO
  Golden Boot", "Zlatna kopačka Svjetskog prvenstva"/"Zlatna kopačka EURA"),
  matching the convention the per-edition Golden Boot pages already
  established. See `docs/PROJECT_STATUS.md`'s matching entry for detail.
- No other concrete, named backlog item is currently known. The next
  intensive-run pass should start from a full-repo health check (`pnpm
  lint`/`test`/`build`/`check:*`, then the full `pnpm test:e2e` suite from a
  cold start) rather than assume one of the items above is secretly
  incomplete - the same approach the 2026-08-19 and 2026-08-24 "quality pass"
  entries in `docs/PROJECT_STATUS.md` already used successfully when the
  named backlog ran dry. An external link-liveness sweep of
  `docs/SOURCES.md` stays blocked by this environment's outbound network
  policy - confirmed again 2026-08-25 (a direct `WebFetch` against
  `en.wikipedia.org` returned `EGRESS_BLOCKED`), not just assumed from an
  earlier note - so it still needs a session with broader network access
  than this one has.

## Ideas not yet scoped as backlog

Raised in passing across `docs/PROJECT_STATUS.md` entries but never turned
into a concrete plan - worth a look next time the health check above comes
back clean:

- Extend "Tap a year to reveal a short story" (currently the four
  team-competition tables) to the two individual awards. Checked
  2026-08-25: `content/ballon-dor.md` and `content/golden-boot.md` have no
  "Memorable moments" section (the four team-competition files each do),
  so this is blocked on new editorial narrative content, not a code change
  - see the "not pursued" note below for why that is not something to
  fabricate in an unattended run.
- **Correction (2026-08-25):** the `/records`-style individual-award
  aggregate ranking this line used to ask for is **already live** - "most
  award years apart" is the existing "Longest wait between titles" section,
  which loops over `allLoaded` (every team competition *and* both
  individual awards, see `src/pages/records.astro`) and already renders
  `title-gaps-ballon-dor`/`title-gaps-golden-boot-world-cup`/
  `title-gaps-golden-boot-euro` sections; "Back-to-back champions" is the
  same story. The one genuinely open piece is **"youngest winner"**, which
  needs a per-player birth date - data that exists nowhere in `content/`
  today. **Not pursued this run:** fabricating ~130 players' birth dates
  (70 Ballon d'Or + Golden Boot winners, several tied) from memory in an
  unattended run, with no reliable per-player source cross-checked the way
  every other fact on this site has been (see the many "second independent
  cross-check" entries in `docs/PROJECT_STATUS.md`), risks shipping
  confidently-wrong biographical history with no human review before
  merge - the same caution that has already shelved the "by team" filter's
  full participant lists and the flag-emoji idea in earlier runs. Left for
  whenever someone sources that data deliberately.
