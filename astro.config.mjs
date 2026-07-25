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
});
