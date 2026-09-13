// Extract source links from docs/SOURCES.md so the references section on each
// competition page stays in sync with the editorial source list rather than
// duplicating URLs. Links are grouped under "## <Competition>" headings.

import { ContentValidationError } from './validate';

export type SourceLink = {
  label: string;
  url: string;
};

/**
 * Strips trailing sentence/markdown punctuation a bare URL regex match can
 * pick up (a period ending a sentence, the closing paren of a markdown link).
 * Trailing '.'/',' are stripped unconditionally - real URLs in this corpus
 * never end in one. A trailing ')' is only stripped while it is unbalanced
 * (more ')' than '(' in the URL so far) - some source URLs legitimately end
 * in ')', e.g. Wikipedia disambiguation pages like
 * ".../1959_South_American_Championship_(Argentina)". Stripping every
 * trailing ')' unconditionally corrupted exactly those URLs into a
 * dead/truncated link.
 */
function stripTrailingPunctuation(url: string): string {
  let result = url;
  for (;;) {
    const last = result.at(-1);
    if (last === '.' || last === ',') {
      result = result.slice(0, -1);
      continue;
    }
    if (last === ')') {
      const opens = (result.match(/\(/g) ?? []).length;
      const closes = (result.match(/\)/g) ?? []).length;
      if (closes > opens) {
        result = result.slice(0, -1);
        continue;
      }
    }
    break;
  }
  return result;
}

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

    // A line can carry more than one citation (e.g. "rsssf table ; wikipedia
    // article") - match every URL on the line, not just the first, or the
    // second source silently never reaches the page.
    const urlMatches = line.match(/https?:\/\/\S+/g);
    if (urlMatches) {
      for (const rawUrl of urlMatches) {
        const url = stripTrailingPunctuation(rawUrl);
        let label = lastLabel;
        if (!label) {
          try {
            label = new URL(url).hostname.replace(/^www\./, '');
          } catch {
            label = url;
          }
        }
        links.push({ label, url });
      }
      continue;
    }

    const bulletMatch = /^\s*-\s+(.*)$/.exec(line);
    if (bulletMatch) {
      lastLabel = bulletMatch[1].replace(/:\s*$/, '').trim();
    }
  }

  return disambiguateLabels(links);
}

const SOURCE_SUFFIX_PATTERN = / \(source \d+ of \d+\)$/;

/**
 * One editorial audit bullet routinely cites several corroborating URLs
 * (nested bullets under one description, or several bare URLs on
 * continuation lines) - extractSources() correctly turns each into its own
 * link, but they all inherit the same `lastLabel`, so the References
 * section rendered several links in a row with byte-identical visible/
 * accessible text pointing at different destinations (a reader, especially
 * one using a screen reader's "links list", has no way to tell them apart).
 * Appends a "(source i of n)" suffix to every label used by more than one
 * link in the given list, in the order they appear; a label used once is
 * left untouched (or, if it already carried a suffix that no longer applies,
 * has it stripped).
 *
 * Idempotent, and safe to call again after merging several already-
 * disambiguated lists (e.g. /compare's four-competition References list):
 * strips any existing "(source i of n)" suffix before regrouping, so a
 * label that collided only within its own competition's list and a label
 * that collides again after merging both end up with one clean, correctly-
 * counted suffix rather than two stacked ones.
 */
export function disambiguateLabels(links: SourceLink[]): SourceLink[] {
  const baseLabel = (label: string) => label.replace(SOURCE_SUFFIX_PATTERN, '');

  const counts = new Map<string, number>();
  for (const { label } of links) {
    const base = baseLabel(label);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  return links.map((link) => {
    const base = baseLabel(link.label);
    const total = counts.get(base) ?? 1;
    if (total <= 1) return { ...link, label: base };
    const index = (seen.get(base) ?? 0) + 1;
    seen.set(base, index);
    return { ...link, label: `${base} (source ${index} of ${total})` };
  });
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
 *
 * extractSources() already disambiguates labels within one heading, but this
 * is the only reader that puts every heading's list on the same page (each
 * competition's own References section only ever shows its own heading) - so
 * a label that collided only within its own heading (e.g. "Final match dates
 * second independent cross-check ... (source 1 of 3)") can collide *again*
 * with an unrelated link of the same name from a different competition's
 * heading, exactly as confirmed against a live build: three headings (World
 * Cup, EURO, Nations League) each cite a bullet reading the identical "Final
 * match dates second independent cross-check (2026-08-09, intensive ..."
 * text, so all three sections' "(source 1 of 3)" links read the same to a
 * screen reader's links list while pointing at three unrelated URLs. Fixed
 * by re-running disambiguateLabels() across the flattened, already-
 * disambiguated set - safe because it strips any existing "(source i of n)"
 * suffix before recomputing (see its own doc comment), the same "disambiguate
 * again after merging" convention every combined-References page (compare/
 * records/players/teams/quiz/golden-boot) already follows for the same
 * reason.
 */
export function extractSourceSections(markdown: string): SourceSection[] {
  const headings: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const headingMatch = /^##\s+(.*)$/.exec(line.trim());
    if (headingMatch) headings.push(headingMatch[1].trim());
  }

  const sections = headings
    .map((heading) => ({ heading, links: extractSources(markdown, heading) }))
    .filter((section) => section.links.length > 0);

  const flattened = disambiguateLabels(sections.flatMap((section) => section.links));
  let cursor = 0;
  return sections.map((section) => {
    const links = flattened.slice(cursor, cursor + section.links.length);
    cursor += section.links.length;
    return { heading: section.heading, links };
  });
}

/**
 * The "source URLs are valid" check docs/CONTENT_MODEL.md's build-time
 * validation list has always named, never previously enforced anywhere -
 * validateEditions() (src/lib/validate.ts) never looked at source links, and
 * extractSources() itself never rejected a malformed URL, it just extracted
 * whatever the regex matched. Called against every section /about/sources
 * reads (the full file, every heading with at least one link), so this runs
 * at build time regardless of which competition page's own References
 * section a given URL feeds.
 *
 * Checks only what's decidable without a network call (a live-link check is
 * infeasible in this environment - outbound requests to source domains are
 * blocked by the egress policy, see docs/PROJECT_STATUS.md): the URL parses,
 * uses http/https, and has balanced parentheses. The last check exists
 * specifically to catch the truncation bug stripTrailingPunctuation() fixes -
 * a URL with an unmatched ')' either survived mid-corruption or was hand-typed
 * wrong, either way it is not the URL the citation intended.
 */
export function validateSourceSections(sections: SourceSection[]): void {
  const problems: string[] = [];

  for (const { heading, links } of sections) {
    for (const { url } of links) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        problems.push(`[${heading}] not a parseable URL: "${url}"`);
        continue;
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        problems.push(`[${heading}] unsupported protocol "${parsed.protocol}": "${url}"`);
      }
      const opens = (url.match(/\(/g) ?? []).length;
      const closes = (url.match(/\)/g) ?? []).length;
      if (opens !== closes) {
        problems.push(`[${heading}] unbalanced parentheses, likely truncated: "${url}"`);
      }
    }
  }

  if (problems.length > 0) {
    throw new ContentValidationError('docs/SOURCES.md', problems);
  }
}
