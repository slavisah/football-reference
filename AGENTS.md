# AGENTS.md

## Mission

Build a fast, accessible, family-friendly football-history website from the Markdown in this repository.

## Non-negotiable rules

1. Treat `content/` as editorial source material.
2. Do not silently alter historical facts.
3. Preserve source links and historical-format notes.
4. Never scrape or copy copyrighted photographs into the repository.
5. Prefer static generation and progressive enhancement.
6. The site must work well on phones, tablets, and desktop screens.
7. Use accessible semantic HTML and keyboard-friendly controls.
8. Do not add advertising, gambling, betting odds, tracking pixels, or manipulative engagement features.
9. Make all filters shareable through URL query parameters.
10. Add automated schema and link validation.

## Recommended first milestone

Create a static site with:

- home page
- competition landing pages
- responsive tournament tables
- filters by country, year, host, and champion
- champions timelines
- print stylesheet
- light/dark mode
- source drawer or references section
- basic quizzes generated from structured content

## Data extraction

For v1, Markdown tables may be parsed at build time. If this becomes awkward, introduce generated JSON under `generated/`; never make generated files the editorial source of truth.

## Definition of done

- `pnpm test`, `pnpm lint`, and `pnpm build` pass
- all pages are statically generated
- no horizontal overflow on a 360px viewport
- tables have accessible captions and column headers
- historical names are preserved where editorially relevant
- a visible “Last reviewed” date appears on each page
