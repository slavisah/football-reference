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
