// Extract source links from docs/SOURCES.md so the references section on each
// competition page stays in sync with the editorial source list rather than
// duplicating URLs. Links are grouped under "## <Competition>" headings.

export type SourceLink = {
  label: string;
  url: string;
};

export function extractSources(markdown: string, heading: string): SourceLink[] {
  const lines = markdown.split(/\r?\n/);
  const target = heading.trim().toLowerCase();
  let inSection = false;
  let lastLabel = '';
  const links: SourceLink[] = [];

  for (const line of lines) {
    const headingMatch = /^##\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      inSection = headingMatch[1].trim().toLowerCase() === target;
      lastLabel = '';
      continue;
    }
    if (!inSection) continue;

    const urlMatch = /(https?:\/\/\S+)/.exec(line);
    if (urlMatch) {
      const url = urlMatch[1].replace(/[).,]+$/, '');
      let label = lastLabel;
      if (!label) {
        try {
          label = new URL(url).hostname.replace(/^www\./, '');
        } catch {
          label = url;
        }
      }
      links.push({ label, url });
      continue;
    }

    const bulletMatch = /^\s*-\s+(.*)$/.exec(line);
    if (bulletMatch) {
      lastLabel = bulletMatch[1].replace(/:\s*$/, '').trim();
    }
  }

  return links;
}

export type SourceSection = {
  heading: string;
  links: SourceLink[];
};

/**
 * Every "## <heading>" section in docs/SOURCES.md that has at least one link,
 * in file order. Reuses extractSources() per heading (rather than a second
 * parser) so the /about/sources index can never drift from what each
 * competition's own References section shows. Headings with no links (e.g.
 * "Review policy", which is prose, not a source list) are skipped.
 */
export function extractSourceSections(markdown: string): SourceSection[] {
  const headings: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const headingMatch = /^##\s+(.*)$/.exec(line.trim());
    if (headingMatch) headings.push(headingMatch[1].trim());
  }

  return headings
    .map((heading) => ({ heading, links: extractSources(markdown, heading) }))
    .filter((section) => section.links.length > 0);
}
