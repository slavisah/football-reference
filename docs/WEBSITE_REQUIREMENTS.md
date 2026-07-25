# Website Requirements

## Product goal

Publish a free, fast, family-friendly football reference that works well on mobile devices and can be hosted from GitHub.

## Recommended stack

Either:

- Astro + TypeScript + MDX, or
- Next.js + TypeScript with static export.

Astro is the simplest default because this is primarily a content site.

## Required pages

- `/`
- `/competitions/world-cup`
- `/competitions/euro`
- `/competitions/copa-america`
- `/competitions/nations-league`
- `/awards/ballon-dor`
- `/awards/golden-boot`
- `/records`
- `/quiz`
- `/about/sources`

## Required capabilities

- responsive tables;
- filter by year, host, winner, and team;
- sort without losing historical notes;
- static champion timelines;
- print stylesheet;
- accessible table captions;
- shareable filtered URLs;
- source links;
- last-reviewed indicator;
- optional Croatian/English localization later.

## Nice-to-have capabilities

- family quiz mode;
- compare two national teams;
- “on this day” cards;
- installable PWA;
- offline reading;
- downloadable print sheet per competition.

## Deployment

Prefer one of:

1. GitHub Pages with a static build;
2. Cloudflare Pages connected to GitHub;
3. Vercel.

Do not add a database until a real editing or user-account requirement appears.
