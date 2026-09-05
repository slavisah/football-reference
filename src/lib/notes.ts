// Small editorial "notes" sections - bullet lists or short paragraphs under
// headings like "Memorable moments" or "Editorial notes" - already exist in
// content/*.md but were being parsed only for the Editions table and then
// dropped. This extracts a named section verbatim so a page can render it,
// the same way src/lib/sources.ts extracts links by heading.

export type NoteSection = {
  heading: string;
  /** A lead-in paragraph that appears before the bullet list, if any (e.g. content/index.md's "How to use the reference"). */
  intro?: string;
  items: string[];
};

/**
 * Returns the content under a Markdown heading (matched by exact,
 * case-insensitive heading text) as a NoteSection: one item per bullet line,
 * plus an optional `intro` paragraph when the section leads with prose before
 * the list (dropped entirely until 2026-08-10 - see notes.test.ts); or, when
 * the section has no bullets at all, the lines joined into a single
 * paragraph item. Stops at the next heading of the same or shallower level.
 * Returns null when the heading isn't found or its section has no content,
 * so callers can build an optional-sections list without an extra existence
 * check.
 */
export function extractSection(markdown: string, heading: string): NoteSection | null {
  const lines = markdown.split(/\r?\n/);
  const target = heading.trim().toLowerCase();
  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.*)$/.exec(lines[i].trim());
    if (match && match[2].trim().toLowerCase() === target) {
      start = i + 1;
      level = match[1].length;
      break;
    }
  }
  if (start === -1) return null;

  const bullets: string[] = [];
  const paragraph: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = /^(#{1,6})\s+/.exec(line.trim());
    if (headingMatch && headingMatch[1].length <= level) break;

    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
    } else if (line.trim() !== '' && bullets.length === 0) {
      paragraph.push(line.trim());
    }
  }

  if (bullets.length > 0) {
    const intro = paragraph.length > 0 ? paragraph.join(' ') : undefined;
    return { heading, intro, items: bullets };
  }
  if (paragraph.length > 0) return { heading, items: [paragraph.join(' ')] };
  return null;
}

/** extractSection() for each heading in `headings`, in the order given, skipping any that are missing or empty. */
export function extractSections(markdown: string, headings: string[]): NoteSection[] {
  return headings
    .map((heading) => extractSection(markdown, heading))
    .filter((section): section is NoteSection => section !== null);
}

/**
 * A URL-fragment-safe id for a note heading, so EditorialNotes.astro's "Jump
 * to a section" nav can link straight to a card instead of a reader having to
 * scroll past a dozen unrelated ones. Handles the Croatian letters this
 * site's hand-translated headings use: NFD normalization strips the
 * combining diacritic off č/ć/š/ž (and their uppercase forms) since those
 * decompose to a plain Latin letter plus a mark, but đ/Đ don't decompose at
 * all (it's a distinct letter, not a base letter with a mark), so it needs
 * its own replacement.
 */
export function slugifyHeading(heading: string): string {
  return heading
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * slugifyHeading() for every section, guaranteeing a unique id per call even
 * if two headings would otherwise collide (e.g. golden-boot.astro merging
 * two content files' note arrays) by suffixing repeats with -2, -3, etc.
 */
export function slugifyHeadings(headings: string[]): string[] {
  const seen = new Map<string, number>();
  return headings.map((heading) => {
    const base = slugifyHeading(heading);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

/**
 * Minimal inline Markdown -> safe HTML for **bold**, *italic* and `code`
 * only - not a general Markdown parser. content/*.md notes only use these
 * three inline forms, and the source is trusted editorial content, but the
 * text is still HTML-escaped first so any literal `<`/`&` renders as text.
 */
export function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>');
}
