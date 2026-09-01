// Generates public/og-image.png: a proper 1200x630 (1.91:1) social-card image
// for the Open Graph/Twitter Card <meta> tags BaseLayout.astro renders on
// every page. Before this script, og:image/twitter:image pointed at
// icons/icon-512.png (see docs/PROJECT_STATUS.md's 2026-08-01 SEO-essentials
// entry) - a square PWA icon, which most link-unfurl surfaces (Slack,
// Discord, iMessage, X/Twitter's "summary_large_image" card) crop or
// letterbox badly since they expect roughly this aspect ratio. This is a
// one-time/on-demand generator, not a build step (the output is committed to
// public/, the same convention icons/icon-*.png already follow) - re-run it
// by hand if the brand mark or palette ever changes.
//
// Renders one SVG (the favicon's ball mark, enlarged, plus the site name and
// a tagline listing every competition/award family) and rasterizes it with
// sharp, the same library Astro's own image pipeline already pulls in
// transitively - no new runtime dependency, just a devDependency for this
// build-time script.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

// Palette lifted from src/styles/global.css's --light-* tokens, the same
// brand colors public/favicon.svg already uses (#1f6f4f accent, #16202c
// text, #ffffff), so this image matches the site's light-mode look exactly
// rather than introducing a new one-off palette.
const ACCENT = '#1f6f4f';
const ACCENT_DARK = '#184f39';
const INK = '#16202c';
const WHITE = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.78)';

// The ball mark from public/favicon.svg, scaled up and re-centered inside a
// 260x260 box (viewBox 0 0 32 32 originally) rather than re-derived by hand,
// so the two stay visually identical.
const ballMark = (cx, cy, r) => `
  <g transform="translate(${cx - r} ${cy - r}) scale(${r / 16})">
    <circle cx="16" cy="16" r="15" fill="${WHITE}" />
    <path d="M16 9l3.2 2.3-1.2 3.7h-4L12.8 11.3z" fill="${INK}" />
    <path d="M16 23l-3-2.1 1.1-3.4h3.8l1.1 3.4z" fill="${INK}" opacity="0.85" />
    <circle cx="16" cy="16" r="15" fill="none" stroke="${INK}" stroke-width="1" />
  </g>`;

// Two tagline lines rather than one long one - the full six-family list
// joined on one line runs well past the 1040px-wide safe column (1200px
// minus the 80px left margin and a matching right margin) at any font size
// still legible at social-preview thumbnail sizes. textLength pins each
// line's rendered width exactly rather than relying on a guessed
// char-width estimate, so it can never silently overflow if the font
// metrics differ slightly from what was eyeballed here.
const taglineLine1 = 'FIFA World Cup  ·  UEFA EURO  ·  Copa América';
const taglineLine2 = "UEFA Nations League  ·  Ballon d'Or  ·  Golden Boot";
const TAGLINE_WIDTH = 900;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT}" />
      <stop offset="1" stop-color="${ACCENT_DARK}" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  ${ballMark(1040, 140, 120)}

  <text x="80" y="250" font-family="'DejaVu Sans', system-ui, sans-serif" font-weight="700"
        font-size="66" fill="${WHITE}">The Ultimate</text>
  <text x="80" y="326" font-family="'DejaVu Sans', system-ui, sans-serif" font-weight="700"
        font-size="66" fill="${WHITE}">Football Reference</text>
  <text x="80" y="384" font-family="'DejaVu Sans', system-ui, sans-serif" font-weight="400"
        font-size="26" fill="${MUTED}">A fast, accessible, family-friendly history of the game</text>

  <text x="80" y="470" font-family="'DejaVu Sans', system-ui, sans-serif" font-weight="600"
        font-size="25" fill="${WHITE}" textLength="${TAGLINE_WIDTH}" lengthAdjust="spacingAndGlyphs">${taglineLine1}</text>
  <text x="80" y="508" font-family="'DejaVu Sans', system-ui, sans-serif" font-weight="600"
        font-size="25" fill="${WHITE}" textLength="${TAGLINE_WIDTH}" lengthAdjust="spacingAndGlyphs">${taglineLine2}</text>
</svg>`;

async function main() {
  const outPath = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${png.length} bytes, ${WIDTH}x${HEIGHT})`);
}

main();
