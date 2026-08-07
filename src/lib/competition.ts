import { getEntry } from 'astro:content';
import sourcesRaw from '../../docs/SOURCES.md?raw';
import { findTableByHeading } from './markdownTable';
import {
  buildChampionsSummary,
  buildEditions,
  distinctHosts,
  distinctTeams,
  distinctWinners,
} from './editions';
import { extractSources, type SourceLink } from './sources';
import { extractSections, type NoteSection } from './notes';
import { validateEditions } from './validate';
import type { ChampionSummary, Edition, MarkdownTable } from './types';

// Loads one competition's Markdown entry and turns it into everything a page
// needs: the validated editions, a generated champions summary, the winner list
// for the filter, and the source links pulled from docs/SOURCES.md.

export type CompetitionData = {
  title: string;
  intro: string;
  lastReviewed: string;
  status: string;
  table: MarkdownTable;
  editions: Edition[];
  champions: ChampionSummary[];
  winners: string[];
  /** Distinct host values for the host filter; empty when the table has no host column. */
  hosts: string[];
  /** Distinct team values (winner/runner-up/third/fourth/national team/etc.) for the team filter. */
  teams: string[];
  sources: SourceLink[];
  /** Editorial "notes" sections (e.g. "Memorable moments") requested via noteHeadings, in that order. */
  notes: NoteSection[];
};

export type LoadOptions = {
  editionsHeading?: string;
  sourcesHeading: string;
  allowDuplicateYears?: string[];
  /** Content headings (e.g. "Memorable moments") to pull as reader-facing notes; see src/lib/notes.ts. */
  noteHeadings?: string[];
};

export type PageMeta = {
  title: string;
  intro: string;
  lastReviewed: string;
  status: string;
  /** Editorial notes sections requested via the optional noteHeadings argument; empty when none were requested. */
  notes: NoteSection[];
};

/** Read the first paragraph after the top-level heading as the page intro. */
function firstParagraph(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const buffer: string[] = [];
  let started = false;
  for (const line of lines) {
    if (/^#/.test(line.trim())) {
      if (started) break;
      continue;
    }
    if (line.trim() === '') {
      if (started) break;
      continue;
    }
    started = true;
    buffer.push(line.trim());
  }
  return buffer.join(' ');
}

/**
 * Load a content page's front matter + intro paragraph, no editions table
 * required. `noteHeadings` optionally pulls further sections (e.g. "How it
 * works") the same way loadCompetition()'s noteHeadings does, for pages that
 * have reader-facing prose beyond the intro paragraph.
 */
export async function loadPageMeta(id: string, noteHeadings: string[] = []): Promise<PageMeta> {
  const entry = await getEntry('pages', id);
  if (!entry) {
    throw new Error(`Content entry "${id}" was not found in the pages collection.`);
  }
  const body = entry.body ?? '';
  return {
    title: entry.data.title,
    intro: firstParagraph(body),
    lastReviewed: entry.data.lastReviewed,
    status: entry.data.status,
    notes: extractSections(body, noteHeadings),
  };
}

export async function loadCompetition(
  id: string,
  options: LoadOptions,
): Promise<CompetitionData> {
  const {
    editionsHeading = 'Editions',
    sourcesHeading,
    allowDuplicateYears,
    noteHeadings = [],
  } = options;

  const entry = await getEntry('pages', id);
  if (!entry) {
    throw new Error(`Content entry "${id}" was not found in the pages collection.`);
  }

  const body = entry.body ?? '';
  const table = findTableByHeading(body, editionsHeading);
  if (!table) {
    throw new Error(
      `Could not find a "${editionsHeading}" table in content/${id}.md.`,
    );
  }

  const editions = buildEditions(table);
  validateEditions({
    competition: entry.data.title,
    table,
    editions,
    allowDuplicateYears,
  });

  return {
    title: entry.data.title,
    intro: firstParagraph(body),
    lastReviewed: entry.data.lastReviewed,
    status: entry.data.status,
    table,
    editions,
    champions: buildChampionsSummary(editions),
    winners: distinctWinners(editions),
    hosts: distinctHosts(editions),
    teams: distinctTeams(editions),
    sources: extractSources(sourcesRaw, sourcesHeading),
    notes: extractSections(body, noteHeadings),
  };
}
