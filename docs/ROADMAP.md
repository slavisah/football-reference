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
- No other concrete, named backlog item is currently known. The next
  intensive-run pass should start from a full-repo health check (`pnpm
  lint`/`test`/`build`/`check:*`, then the full `pnpm test:e2e` suite from a
  cold start) rather than assume one of the items above is secretly
  incomplete - the same approach the 2026-08-19 and 2026-08-24 "quality pass"
  entries in `docs/PROJECT_STATUS.md` already used successfully when the
  named backlog ran dry.

## Ideas not yet scoped as backlog

Raised in passing across `docs/PROJECT_STATUS.md` entries but never turned
into a concrete plan - worth a look next time the health check above comes
back clean:

- Extend "Tap a year to reveal a short story" (currently the four
  team-competition tables) to the two individual awards, if enough
  editorial "Memorable moments" content exists for Ballon d'Or/Golden Boot
  to support it.
- A `/records`-style aggregate ranking specific to the individual awards
  (e.g. "youngest winner", "most award years apart"), mirroring the
  team-competition rankings already on `/records`.
