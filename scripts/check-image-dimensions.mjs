// Verifies every PNG image this site declares a pixel size for actually has
// that size - two spots nothing previously checked:
//
// - `manifest.webmanifest`'s `icons[].sizes` (e.g. "192x192") against the
//   real dimensions of the file at `icons[].src`. `check:precache` already
//   confirms that `src` resolves to a real file in dist/, but never opens it
//   to confirm the declared size is true - a regenerated icon that comes out
//   a different size (a change to the source SVG's viewBox, a rasterizer
//   version bump) would silently ship a manifest that lies about its own
//   icon dimensions, which browsers use to pick an install icon without
//   re-measuring the file themselves.
// - Every page's `<meta property="og:image">`/`<meta name="twitter:image">`
//   `content` URL: `check:links`/`check:precache` only ever match `href`/
//   `src` attributes (see check-internal-links.mjs's own `extractLinks`), so
//   a meta tag's `content` URL - the only place these two tags put their
//   value - has never been checked to resolve to a real file at all, let
//   alone confirmed against the `og:image:width`/`og:image:height` meta tags
//   that sit right next to it. A future edit to
//   scripts/generate-og-image.mjs (or a by-hand replacement of
//   public/og-image.png) that changes its pixel size would silently break
//   every chat app/social media link-preview card site-wide - the exact
//   image Slack/Discord/iMessage/X actually crop against - with no test
//   catching it.
//
// Plain regex/PNG-header parsing over already-built HTML and manifest JSON,
// no browser needed - the same territory as check:jsonld/check:meta/
// check:precache (well under a second for all 711 pages), so this is wired
// into .github/workflows/ci.yml as a required PR gate.
//
// Run manually (`pnpm check:image-dimensions`) after `pnpm build`, or from
// CI - see .github/workflows/ci.yml. Exits non-zero, listing every
// dimension mismatch or unresolved image, if any are found.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyLink, candidateDistPaths, listHtmlFiles } from './check-internal-links.mjs';
import { isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * Pure: reads a PNG buffer's `IHDR` chunk (always the first chunk, always 13
 * bytes, immediately after the fixed 8-byte signature - guaranteed by the
 * PNG spec, not merely this site's own files) and returns its declared
 * `{ width, height }` in pixels. Returns null for a buffer that isn't a
 * PNG (wrong signature, or too short to contain one) rather than throwing,
 * so a caller can report a clean problem instead of an uncaught exception.
 */
export function parsePngDimensions(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** Pure: parses a manifest `icons[].sizes` string (e.g. "192x192") into `{ width, height }`, or null if malformed. */
export function parseSizesAttribute(sizes) {
  const match = /^(\d+)x(\d+)$/.exec(sizes ?? '');
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

/**
 * Pure: extracts the four Open Graph/Twitter Card image fields from a built
 * page's `<head>` - `content="..."` values, the one attribute
 * check-internal-links.mjs's href/src-only `extractLinks()` never looks at.
 */
export function extractOgImageMeta(html) {
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? null;
  const ogWidth = html.match(/<meta property="og:image:width" content="([^"]*)"/)?.[1] ?? null;
  const ogHeight = html.match(/<meta property="og:image:height" content="([^"]*)"/)?.[1] ?? null;
  const twitterImage = html.match(/<meta name="twitter:image" content="([^"]*)"/)?.[1] ?? null;
  return { ogImage, ogWidth, ogHeight, twitterImage };
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Resolves an absolute/relative internal URL to a dist/ file path (relative to DIST_DIR), or null if it doesn't resolve. */
async function resolveDistFile(href) {
  const classified = classifyLink(href);
  if (classified.kind !== 'internal') return null;
  for (const candidate of candidateDistPaths(classified.path)) {
    if (await fileExists(path.join(DIST_DIR, candidate))) return candidate;
  }
  return null;
}

async function readManifest(distPath) {
  const raw = await readFile(path.join(DIST_DIR, distPath), 'utf8');
  return JSON.parse(raw);
}

async function checkManifestIcons(problems) {
  const manifests = [
    { locale: 'en', distPath: 'manifest.webmanifest' },
    { locale: 'hr', distPath: path.join('hr', 'manifest.webmanifest') },
  ];
  for (const { locale, distPath } of manifests) {
    const manifest = await readManifest(distPath);
    for (const icon of manifest.icons ?? []) {
      const declared = parseSizesAttribute(icon.sizes);
      if (!declared) {
        problems.push(`${locale} manifest.webmanifest's icon "${icon.src}" has an unparseable sizes value ${JSON.stringify(icon.sizes)}`);
        continue;
      }
      const distFile = await resolveDistFile(icon.src);
      if (!distFile) {
        // check:precache already reports this case; skip rather than double-report.
        continue;
      }
      const actual = parsePngDimensions(await readFile(path.join(DIST_DIR, distFile)));
      if (!actual) {
        problems.push(`${locale} manifest.webmanifest's icon "${icon.src}" is not a valid PNG file`);
      } else if (actual.width !== declared.width || actual.height !== declared.height) {
        problems.push(
          `${locale} manifest.webmanifest's icon "${icon.src}" declares sizes="${icon.sizes}" but is actually ${actual.width}x${actual.height}`,
        );
      }
    }
  }
}

async function checkOgImages(problems) {
  const files = await listHtmlFiles(DIST_DIR);
  // Keyed by resolved dist file path, since every current page points at the
  // same single og-image.png - checking each unique image's real dimensions
  // once, rather than re-reading it from disk on every one of 711 pages.
  const dimensionsCache = new Map();
  const resolveDimensions = async (distFile) => {
    if (!dimensionsCache.has(distFile)) {
      dimensionsCache.set(distFile, parsePngDimensions(await readFile(path.join(DIST_DIR, distFile))));
    }
    return dimensionsCache.get(distFile);
  };

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (isRedirectStubHtml(html)) continue;
    const pageName = path.relative(DIST_DIR, file);
    const { ogImage, ogWidth, ogHeight, twitterImage } = extractOgImageMeta(html);

    for (const [label, url] of [
      ['og:image', ogImage],
      ['twitter:image', twitterImage],
    ]) {
      if (!url) {
        problems.push(`${pageName}: missing <meta ... ${label}> content`);
        continue;
      }
      const distFile = await resolveDistFile(url);
      if (!distFile) {
        problems.push(`${pageName}: ${label} content "${url}" does not resolve to any built file`);
      }
    }

    if (!ogImage) continue;
    const ogImageDistFile = await resolveDistFile(ogImage);
    if (!ogImageDistFile) continue; // already reported above
    const actual = await resolveDimensions(ogImageDistFile);
    if (!actual) {
      problems.push(`${pageName}: og:image "${ogImage}" is not a valid PNG file`);
      continue;
    }
    const declaredWidth = Number(ogWidth);
    const declaredHeight = Number(ogHeight);
    if (!ogWidth || !ogHeight || Number.isNaN(declaredWidth) || Number.isNaN(declaredHeight)) {
      problems.push(`${pageName}: missing or non-numeric og:image:width/og:image:height`);
    } else if (actual.width !== declaredWidth || actual.height !== declaredHeight) {
      problems.push(
        `${pageName}: og:image:width/height declares ${declaredWidth}x${declaredHeight} but "${ogImage}" is actually ${actual.width}x${actual.height}`,
      );
    }
  }
}

async function main() {
  const problems = [];
  try {
    await checkManifestIcons(problems);
    await checkOgImages(problems);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Missing build output under ${path.relative(ROOT, DIST_DIR)}. Run \`pnpm build\` first.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  console.log('Checked manifest icon sizes and every page\'s og:image/twitter:image against their real PNG dimensions.');
  if (problems.length === 0) {
    console.log('Every declared image size matches the real file: no manifest icon or og:image/twitter:image drift found.');
    return;
  }

  console.error(`\n${problems.length} image-dimension problem(s) found:\n`);
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
