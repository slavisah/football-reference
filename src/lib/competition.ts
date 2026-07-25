import { getEntry } from 'astro:content';
import sourcesRaw from '../../docs/SOURCES.md?raw';
import { findTableByHeading } from './markdownTable';
import {
  buildChampionsSummary,
  buildEditions,
  distinctWinners,
} from './editions';
import { extractSources, type SourceLink } from './sources';
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
  sources: SourceLink[];
};

export type LoadOptions = {
  editionsHeading?: string;
  sourcesHeading: string;
  allowDuplicateYears?: string[];
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

export async function loadCompetition(
  id: string,
  options: LoadOptions,
): Promise<CompetitionData> {
  const { editionsHeading = 'Editions', sourcesHeading, allowDuplicateYears } =
    options;

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
    sources: extractSources(sourcesRaw, sourcesHeading),
  };
}
