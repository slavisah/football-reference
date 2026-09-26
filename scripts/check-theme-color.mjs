// Guards a standing drift risk documented in docs/PROJECT_STATUS.md's "Known
// caveats" list: `BaseLayout.astro`'s `<meta name="theme-color">` carries
// `content`/`data-light`/`data-dark` attributes that must be kept literally
// equal to `global.css`'s `--light-accent`/`--dark-accent` custom properties
// - there is no shared source of truth between a CSS custom property and an
// HTML attribute, so a future palette change to either accent color needs a
// matching manual edit to the other file or the mobile browser-chrome tint
// (and `ThemeToggle.astro`'s runtime toggle, which reads the same two
// attributes) silently drifts from the page's own accent color.
//
// Plain regex/string parsing of `global.css` and `BaseLayout.astro`, no build
// or browser needed - the same territory as `check:award-tallies`/
// `check:edition-header-labels` (well under a second) - so this is wired into
// `.github/workflows/ci.yml` as a required PR gate.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CSS_FILE = path.join(ROOT, 'src', 'styles', 'global.css');
const LAYOUT_FILE = path.join(ROOT, 'src', 'layouts', 'BaseLayout.astro');

/** Extracts a `--name: #hex;` custom property's value from CSS source. */
export function parseCssCustomProperty(source, name) {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(source);
  return match ? match[1] : null;
}

/** Extracts the `theme-color-meta` tag's `content`/`data-light`/`data-dark` attributes. */
export function parseThemeColorMeta(source) {
  const match = /<meta\s+name="theme-color"[\s\S]*?\/>/.exec(source);
  if (!match) return null;
  const tag = match[0];
  const attr = (name) => new RegExp(`${name}="(#[0-9a-fA-F]{3,8})"`).exec(tag)?.[1] ?? null;
  return { content: attr('content'), dataLight: attr('data-light'), dataDark: attr('data-dark') };
}

async function main() {
  const problems = [];

  const css = await readFile(CSS_FILE, 'utf8');
  const lightAccent = parseCssCustomProperty(css, 'light-accent');
  const darkAccent = parseCssCustomProperty(css, 'dark-accent');
  if (!lightAccent) problems.push(`global.css: no --light-accent custom property found`);
  if (!darkAccent) problems.push(`global.css: no --dark-accent custom property found`);

  const layout = await readFile(LAYOUT_FILE, 'utf8');
  const meta = parseThemeColorMeta(layout);
  if (!meta) {
    problems.push(`BaseLayout.astro: no <meta name="theme-color"> tag found`);
  } else {
    if (!meta.content) problems.push(`BaseLayout.astro: theme-color meta has no content attribute`);
    if (!meta.dataLight) problems.push(`BaseLayout.astro: theme-color meta has no data-light attribute`);
    if (!meta.dataDark) problems.push(`BaseLayout.astro: theme-color meta has no data-dark attribute`);

    if (lightAccent && meta.dataLight && lightAccent !== meta.dataLight) {
      problems.push(
        `theme-color meta's data-light="${meta.dataLight}" no longer matches global.css's --light-accent: ${lightAccent}`,
      );
    }
    if (lightAccent && meta.content && lightAccent !== meta.content) {
      problems.push(
        `theme-color meta's content="${meta.content}" no longer matches global.css's --light-accent: ${lightAccent}`,
      );
    }
    if (darkAccent && meta.dataDark && darkAccent !== meta.dataDark) {
      problems.push(
        `theme-color meta's data-dark="${meta.dataDark}" no longer matches global.css's --dark-accent: ${darkAccent}`,
      );
    }
  }

  if (problems.length === 0) {
    console.log(
      `\nBaseLayout.astro's theme-color meta (content/data-light/data-dark) matches global.css's --light-accent/--dark-accent tokens.`,
    );
    return;
  }

  console.error(`\n${problems.length} theme-color problem(s) found:\n`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
