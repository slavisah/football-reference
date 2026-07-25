# Initial Coding Agent Prompt

You are working in the `football-reference` repository.

Read, in order:

1. `README.md`
2. `AGENTS.md`
3. `docs/WEBSITE_REQUIREMENTS.md`
4. `docs/CONTENT_MODEL.md`
5. `docs/EDITORIAL_GUIDE.md`
6. `docs/SOURCES.md`
7. every Markdown file under `content/`

Build the smallest polished, deployable version of **The Ultimate Football Reference**.

## Technical direction

Use:

- Astro
- TypeScript
- MDX or a Markdown content collection
- pnpm
- Vitest
- Playwright for one critical mobile smoke test

The output must support static deployment to GitHub Pages.

## Milestone 1

Implement:

- shared page shell;
- navigation;
- home page;
- FIFA World Cup page;
- UEFA EURO page;
- reusable responsive tournament table;
- filter by winner and year;
- generated champions summary;
- references section;
- accessible print styles;
- mobile layout at 360px;
- dark and light themes.

## Content rules

- Markdown remains the editorial source of truth.
- Preserve historical country names.
- Do not silently “correct” content.
- Add validation errors for malformed front matter or tables.
- Do not use copyrighted tournament logos or unlicensed photos.
- Do not add ads, analytics, gambling content, betting links, or user tracking.

## Architecture

Create a modest architecture. Avoid a database, authentication, CMS, monorepo, or backend API for Milestone 1.

Suggested layout:

```text
src/
  components/
  content.config.ts
  layouts/
  lib/
  pages/
  styles/
content/
public/
tests/
```

## Acceptance scenarios

1. A child can open the World Cup page on a phone and find the 2018 champion without horizontal page overflow.
2. Selecting Spain shows Spain's World Cup title years.
3. A reader can print the World Cup table on A4 landscape.
4. Every competition page displays its `lastReviewed` date and source links.
5. Keyboard users can operate filters.
6. `pnpm build`, `pnpm test`, and the mobile Playwright smoke test pass.
7. The generated site can deploy to GitHub Pages using GitHub Actions.

Implement Milestone 1 completely. Add a short `IMPLEMENTATION_NOTES.md` describing decisions, known content caveats, and the next logical milestone.
