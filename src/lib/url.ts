// Build hrefs that respect the configured base path (needed for GitHub Pages
// project sites served under /<repo>/). import.meta.env.BASE_URL is Astro's
// normalized base and always ends with a slash.

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}

/**
 * Absolute URL of the current page (e.g. for a JSON-LD `url` field, which
 * needs a full URL rather than a path). Mirrors the `site ?? url` fallback
 * `BaseLayout.astro` and `sitemap.xml.ts` already use for the same reason:
 * `Astro.site` is unset in local dev, so falling back to `Astro.url` keeps
 * this working there too.
 */
export function absolutePageUrl(url: URL, site?: URL): string {
  return new URL(url.pathname, site ?? url).toString();
}
