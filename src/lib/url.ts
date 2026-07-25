// Build hrefs that respect the configured base path (needed for GitHub Pages
// project sites served under /<repo>/). import.meta.env.BASE_URL is Astro's
// normalized base and always ends with a slash.

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}
