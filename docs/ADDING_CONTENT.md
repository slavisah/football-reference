# Adding and editing content

This is the step-by-step guide for editors. The Markdown files in `content/`
are the **source of truth**. The website reads them at build time, so you never
edit HTML - you edit Markdown, preview, and push.

## 1. Where things live

```text
content/            <- the editorial Markdown (edit these)
  fifa-world-cup.md
  uefa-euro.md
  ...
docs/SOURCES.md     <- source links, grouped per competition
src/pages/          <- one .astro page per rendered URL
src/components/      <- the shared table, champions summary, references, nav
src/lib/            <- the Markdown table parser + validation (rarely touched)
```

## 2. Front matter (top of every content file)

Every file starts with a YAML block between `---` fences.

```yaml
---
title: FIFA World Cup          # required
slug: fifa-world-cup           # optional but recommended
lastReviewed: 2026-07-23       # required, must be YYYY-MM-DD
status: review                 # required: draft | review | verified | needs-detailed-audit
competitionType: international  # optional
confederation: FIFA            # optional
---
```

If a required field is missing or malformed (for example a bad date), the build
**fails with a clear error** - it will not silently publish.

## 3. The editions table (what the site turns into a filterable table)

Put the tournament data under a heading exactly named `## Editions`, as a normal
Markdown pipe table:

```markdown
## Editions

| Year | Host(s) | Teams | Winner | Runner-up | ... | Final |
|---:|---|---:|---|---|---|---|
| 2018 | Russia | 32 | France | Croatia | ... | France 4-2 Croatia |
| 2022 | Qatar  | 32 | Argentina | France | ... | Argentina 3-3 France; 4-2 pens |
```

How the parser reads it:

- It finds the table under the `## Editions` heading.
- It detects columns by their header text (case-insensitive):
  - a header containing **year** or **season** -> the year/filter value
  - a header containing **winner** or **champion** -> the champion (also drives
    the generated summary and the winner filter)
  - a header containing **host** -> host
  - a header containing **team** -> team count
- **Every other column is kept and displayed as-is.** You can add columns freely.

### Rules the build enforces (validation)

- every row needs a **winner**;
- every row needs a **parseable year/season** (a 4-digit year somewhere, e.g.
  `2018` or `2018-19`);
- **team count must be positive** if a Teams column exists;
- **no duplicate year/season** rows (a rare allowed exception, like the two 1959
  South American Championships, must be whitelisted in the page's
  `allowDuplicateYears` option);
- **no duplicate column headers**;
- each row must have one cell per column.

If any of these fail, `pnpm build` stops and tells you the exact row.

## 4. Champions summary is generated - do not hand-maintain it

The "Champions by titles" box on each page is **calculated from the Editions
table**. If a file also contains a hand-written totals table, it is intentionally
**not** rendered, so it cannot drift. Just keep the Editions table correct.

Grouping of sporting successors is deliberately tiny: only **West Germany is
counted with Germany** (shown as "Germany (incl. West Germany)"), because that is
the only grouping the content itself makes. Every other name counts as written.
See `docs/PROJECT_STATUS.md` -> "Decisions on record". The edition table always
shows the real historical name.

## 5. Source links

Add sources to `docs/SOURCES.md` under a `## <Competition name>` heading. The
page pulls them automatically into its References section:

```markdown
## FIFA World Cup

- FIFA tournament history:
  - https://www.fifa.com/en/...
```

The competition page must reference the same heading (see step 7,
`sourcesHeading`).

## 6. Emojis (allowed - see conventions)

Emojis are welcome, with a few rules to keep the reference tidy and neutral:

- **Allowed in prose**: intros, "Memorable moments", editorial notes, and in the
  site UI (headings/section accents). Keep it family-friendly and sparing.
- **Not in the data tables**: never put emoji inside the Editions table cells -
  that data must stay clean and machine-readable.
- **No flag emojis for historical/defunct nations** (West Germany, Soviet Union,
  Yugoslavia, Czechoslovakia). Flags exist only for current countries, so mixing
  them would be inconsistent and could misrepresent history. Prefer neutral
  emoji (🏆 ⚽ 🎉 😮) over flags.
- In components, decorative emoji should be marked `aria-hidden="true"` so screen
  readers are not cluttered.

## 7. Adding a whole new competition page

Example: add Copa América.

1. **Content**: create `content/copa-america.md` with the front matter (step 2)
   and an `## Editions` table (step 3).
2. **Sources**: add a `## Copa América` section to `docs/SOURCES.md`.
3. **Page**: create `src/pages/competitions/copa-america.astro`:

   ```astro
   ---
   import BaseLayout from '../../layouts/BaseLayout.astro';
   import CompetitionView from '../../components/CompetitionView.astro';
   import { loadCompetition } from '../../lib/competition';

   const data = await loadCompetition('copa-america', {
     editionsHeading: 'Editions',
     sourcesHeading: 'Copa América',
     // allowDuplicateYears: ['1959'], // only if the data genuinely repeats a year
   });
   ---

   <BaseLayout title={data.title} description="...">
     <CompetitionView data={data} tableId="copa-america" tableCaption="Copa América editions" />
   </BaseLayout>
   ```

4. **Navigation**: add a link to the `links` array in
   `src/components/Nav.astro`.

That's it - the table, filters, champions summary, and references all come from
the shared components.

### A file with more than one table (e.g. Golden Boot)

Some award pages hold two tables in one content file (`content/golden-boot.md`
has a "FIFA World Cup top scorers" table and a "UEFA EURO top scorers" table).
There's no need for a second content file: call `loadCompetition` once per
table, giving each call the table's own heading as `editionsHeading` and the
matching `docs/SOURCES.md` section as `sourcesHeading`, then render one
`TournamentTable` + `ChampionsSummary` pair per result under a shared page
header (see `src/pages/competitions/golden-boot.astro`). If the table's
champion-like column isn't named "Winner" or "Champion" (e.g. "Player(s)" for
a top-scorer table), pass `winnerLabel="Player"` to `TournamentTable` so the
filter and empty-state copy read correctly - the underlying column detection
in `src/lib/editions.ts` already recognizes `/player/` alongside
`/winner|champion/`.

## 8. Preview, check, and publish

```bash
pnpm install       # first time only
pnpm dev           # live preview at the printed localhost URL
pnpm lint          # type check
pnpm test          # unit tests
pnpm build         # runs all validation; must pass before publishing
```

To publish: commit and **push to `main`**. GitHub Actions builds and deploys to
GitHub Pages automatically. The live site is
<https://slavisah.github.io/football-reference/>.

If you changed an **Editions table** on a competition page that has a
"Download printable PDF" link (all six competition/award pages), regenerate
the matching file under `public/downloads/` and commit it too, otherwise the
downloadable PDF will silently go stale relative to the live table:

```bash
pnpm build && pnpm build:pdfs
```

This is a separate, manual step - not part of `pnpm build` or the deploy
workflow - since it drives a real browser (Playwright's pre-installed
Chromium) to render and print each page, which would slow down every deploy
for a file that only changes when editorial content does. See
`scripts/generate-pdfs.mjs`.

If you forget, CI now catches it: `pnpm check:pdfs`
(`scripts/check-pdf-freshness.mjs`) compares a hash of each PDF's source
content against a manifest recorded the last time `pnpm build:pdfs` ran, and
fails the build if any content file has changed since - no browser required,
so it runs on every pull request alongside the type check and unit tests
(`.github/workflows/ci.yml`), not just when someone remembers to check by
hand.

## 9. Editorial reminders

- Preserve historical team names in edition tables; do not "modernise" them.
- Keep the tone clear, curious, and neutral (see `docs/EDITORIAL_GUIDE.md`).
- No betting/gambling content, ads, trackers, or copyrighted tournament logos.
- Update `lastReviewed` whenever you revise a page.
