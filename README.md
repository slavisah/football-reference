# The Ultimate Football Reference

A family-friendly, source-conscious content repository for a publishable football-history website.

## Purpose

The project is intended to become a simple public website that children and adults can use to explore:

- FIFA World Cup
- UEFA European Championship
- Copa América
- UEFA Nations League
- Men's Ballon d'Or
- FIFA World Cup and UEFA EURO top scorers

The Markdown files are the source of truth for editorial content. A coding agent may transform them into a static website, searchable reference, quiz application, printable pages, or all of these.

## Content structure

```text
content/
  index.md
  fifa-world-cup.md
  uefa-euro.md
  copa-america.md
  uefa-nations-league.md
  ballon-dor.md
  golden-boot.md
  records-and-timelines.md

docs/
  CONTENT_MODEL.md
  EDITORIAL_GUIDE.md
  SOURCES.md
  WEBSITE_REQUIREMENTS.md

prompts/
  INITIAL_CODING_AGENT_PROMPT.md
```

## Editorial status

This is a strong **v0.1 content base**, not a claim that every historical edge case has already been independently audited. Historical competitions used different formats, especially Copa América and early EURO editions. The website should therefore display the notes supplied in the content and retain links to authoritative sources.

The 2026 FIFA World Cup information reflects the completed tournament as of July 2026.

## Suggested publishing approach

A static website is enough for the first version:

- GitHub repository
- Markdown or MDX content
- Astro or Next.js static export
- GitHub Pages, Cloudflare Pages, or Vercel
- no database for v1
- automated validation of front matter and table fields

## License note

The original summaries and organization in this repository may be reused for the family project. Tournament names, logos, photographs, match footage, and third-party text may be protected by trademark or copyright. Use flags, original icons, public-domain material, or properly licensed images instead of copying official artwork.
