import { defineConfig } from 'astro/config';

// GitHub Pages project sites are served from https://<user>.github.io/<repo>/
// so the site needs a base path. Both values are overridable through env vars
// which the deploy workflow sets from the repository metadata, so this config
// works no matter what the repository ends up being called.
const site = process.env.SITE_URL ?? 'https://slavisah.github.io';
const base = process.env.BASE_PATH ?? '/football-reference';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  // docs/WEBSITE_REQUIREMENTS.md's "Required pages" list specifies
  // /awards/ballon-dor and /awards/golden-boot, but both pages were built at
  // /competitions/ballon-dor and /competitions/golden-boot (grouped with the
  // other competition pages, matching the site nav). Rather than moving the
  // canonical pages now - which would touch every existing internal link,
  // both languages' TRANSLATED_PATHS, the generated PDFs, and every test
  // that already asserts the /competitions/ URL - keep the established
  // structure and satisfy the documented required path with a redirect.
  // Astro does not prepend `base` to redirect destinations automatically
  // (only to the source path), so it has to be done by hand here or the
  // generated redirect 404s once deployed under the GitHub Pages base path.
  redirects: {
    '/awards/ballon-dor': `${base}/competitions/ballon-dor`,
    '/awards/golden-boot': `${base}/competitions/golden-boot`,
  },
});
