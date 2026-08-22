import { getEntry } from 'astro:content';
import type { Locale } from './i18n';

export type GlossaryEntry = {
  term: string;
  definition: string;
};

/**
 * Parses content/glossary.md's body into one entry per "## Term" heading,
 * joining the paragraph(s) beneath it (up to the next heading of any level)
 * into a single definition string. Mirrors src/lib/notes.ts's
 * extractSection() shape but captures every H2 section rather than one named
 * heading - the set of glossary terms is itself the editorial content, not a
 * config-time list a caller already knows.
 */
export function parseGlossaryEntries(markdown: string): GlossaryEntry[] {
  const lines = markdown.split(/\r?\n/);
  const entries: GlossaryEntry[] = [];
  let current: { term: string; lines: string[] } | null = null;

  const flush = () => {
    if (current && current.lines.length > 0) {
      entries.push({ term: current.term, definition: current.lines.join(' ') });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const h2 = /^##\s+(.*)$/.exec(trimmed);
    if (h2) {
      flush();
      current = { term: h2[1].trim(), lines: [] };
      continue;
    }
    if (/^#{1,6}\s+/.test(trimmed)) {
      flush();
      continue;
    }
    if (current && trimmed !== '') {
      current.lines.push(trimmed);
    }
  }
  flush();
  return entries;
}

/** Loads content/glossary.md's own entries, the same way loadPageMeta() loads its front matter/intro. */
export async function loadGlossaryEntries(): Promise<GlossaryEntry[]> {
  const entry = await getEntry('pages', 'glossary');
  if (!entry) {
    throw new Error('Content entry "glossary" was not found in the pages collection.');
  }
  return parseGlossaryEntries(entry.body ?? '');
}

// The two abbreviations docs/EDITORIAL_GUIDE.md requires be explained before
// use - "Use a.e.t. only after explaining it means 'after extra time'" and
// the equivalent rule for "pens" - mapped to the short, tooltip-length
// explanation shown via a native <abbr title> in TournamentTable's Final
// column (see abbreviateFinalScore below). The fuller, prose explanation for
// these and every other site term lives in content/glossary.md itself.
const ABBR_TITLES: Record<'a.e.t.' | 'pens', Record<Locale, string>> = {
  'a.e.t.': { en: 'after extra time', hr: 'nakon produžetaka' },
  pens: { en: 'a penalty shoot-out', hr: 'raspucavanje jedanaesteraca' },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** True when a Final-column cell contains either abbreviation this module explains. */
export function hasAbbreviation(value: string): boolean {
  return /a\.e\.t\.|\bpens\b/.test(value);
}

/**
 * Wraps "a.e.t." and "pens" tokens in a Final-score cell's text with
 * `<abbr title="...">`, so hovering, focusing, or (on assistive technology
 * that supports it) inspecting the term surfaces its meaning right where a
 * reader hits it, rather than only on a separate glossary page. Escapes the
 * rest of the text first - the tokens themselves contain no characters that
 * need escaping, so replacing them afterward on the already-escaped string
 * is safe and can't reopen an HTML tag.
 */
export function abbreviateFinalScore(value: string, locale: Locale = 'en'): string {
  return escapeHtml(value)
    .replace(/a\.e\.t\./g, (match) => `<abbr title="${ABBR_TITLES['a.e.t.'][locale]}">${match}</abbr>`)
    .replace(/\bpens\b/g, (match) => `<abbr title="${ABBR_TITLES.pens[locale]}">${match}</abbr>`);
}
