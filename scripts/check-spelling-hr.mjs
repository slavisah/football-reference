// Spell-checks the site's hand-translated Croatian prose - the `NoteSection`
// item/intro text inside `src/pages/hr/competitions/*.astro` (`world-cup`,
// `euro`, `nations-league`, `copa-america`, `ballon-dor`, `golden-boot`) -
// against a real Croatian dictionary (`@cspell/dict-hr-hr`), on the actual
// built `/hr/*` output. A genuine, previously-uncovered gap: `check:spelling`
// only ever pointed cspell at `content/**/*.md` (English), so this site's
// Croatian prose - hand-typed directly into these `.astro` files rather than
// sourced from a `content/*.md` file, by the same intentional EN/HR
// decoupling `check:i18n-notes`'s own header comment explains - has never
// had any automated spelling/wording coverage, unlike every other
// content-integrity angle (20+ dedicated `check:*` scripts). First run of
// this exact method (hundred-and-sixty-first intensive run) found one real,
// live mistranslation this way: `copa-america.astro`'s "Kapetani prvaka"
// section had "presporno nepouzdanim" where the English source says "too
// unreliable" - "prenepouzdanim"/"previše nepouzdanim" was clearly meant,
// not a real Croatian phrase and never caught structurally (`check:i18n-notes`
// only compares section/item *counts*, never word choice).
//
// What's checked: every `.notes__card` section's text content (heading
// excluded - many headings are proper nouns, e.g. "Dobitnici nagrade Kopa
// Trophy") on every built `/hr/*` page, deduplicated (identical prose reused
// verbatim across pages, e.g. a shared "Kako funkcionira" explainer, is only
// checked once), run through `@cspell/dict-hr-hr` plus this file's own
// `.cspell/football-names-hr.txt` (the Croatian-declined-form counterpart of
// `.cspell/football-names.txt` - a general dictionary has no notion of the
// hundreds of player/manager/place proper nouns this prose cites, nor of
// Croatian's case-declined forms of them, e.g. "Jašin"/"Jašina"/"Jašinu").
// An unknown word not already in that ignore-list dictionary is reported
// with its page and surrounding sentence for triage - it is NOT
// automatically a typo (a real proper noun or football loanword this list
// hasn't seen yet is equally likely, exactly why `football-names-hr.txt`
// exists and keeps growing) but is always worth a human read.
//
// Deliberately scoped to `.notes__card` text only, not every string on the
// Croatian side of the site: the note-card prose is this site's only
// freeform, paragraph-length hand-written Croatian (tables/labels/UI chrome
// are short, templated, and already covered structurally by
// `check:locale-consistency`/`check:i18n-notes`/`check:edition-header-labels`)
// - the highest-value, most typo-prone surface for a wording bug to hide in,
// and a corpus small enough (order of 50-60 unique blocks) that its ignore
// list can be curated by hand rather than guessed at scale.
//
// Shells out to the locally-installed `cspell` CLI (`cspell stdin`) rather
// than a Node API, matching how `check:spelling` itself already invokes
// cspell - `cspell`'s own package doesn't export a stable public
// text-checking function, only the CLI. Manual/intensive-run-only for now
// (joins `check:lighthouse`/`check:reflow`/`check:text-zoom`/
// `check:print-width`/`check:html` rather than `.github/workflows/ci.yml`),
// since its curated ignore-list dictionary is new and hasn't yet proven
// itself false-positive-free across many runs the way `football-names.txt`
// has - promote it to a required PR gate once it has.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');
const CSPELL_BIN = path.join(ROOT, 'node_modules', '.bin', 'cspell');
const CSPELL_CONFIG = path.join(ROOT, '.cspell', 'hr-notes.cspell.json');

/**
 * Pure: extracts every `.notes__card` section's text content (tags
 * stripped, whitespace collapsed) from a built page's HTML, in document
 * order. Mirrors `check-i18n-notes.mjs`'s `extractNoteCards()` card
 * boundary, but returns the rendered text instead of structural counts.
 */
export function extractNoteCardText(html) {
  const blocks = [];
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = cardRe.exec(html))) {
    const text = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) blocks.push(text);
  }
  return blocks;
}

async function collectHrNoteBlocks() {
  const files = await listHtmlFiles(DIST_DIR);
  const seen = new Map(); // text -> first page path it appeared on
  const blocks = []; // { pagePath, text }, in file order, deduplicated by text

  for (const file of files) {
    const pagePath = htmlFileToPagePath(DIST_DIR, file);
    if (pagePath !== '/hr' && !pagePath.startsWith('/hr/')) continue;
    const html = await readFile(file, 'utf8');
    if (isRedirectStubHtml(html)) continue;
    for (const text of extractNoteCardText(html)) {
      if (seen.has(text)) continue;
      seen.set(text, pagePath);
      blocks.push({ pagePath, text });
    }
  }
  return blocks;
}

/**
 * Runs cspell (Croatian dictionary) over the given blocks' text, one block
 * per input line, and returns `{ pagePath, word, context }` for every
 * unknown word - `context` is the ~12-word window around it for triage.
 */
function findUnknownWords(blocks) {
  const input = blocks.map((b) => b.text).join('\n');
  const result = spawnSync(CSPELL_BIN, ['stdin', '--no-progress', '--config', CSPELL_CONFIG], {
    input,
    encoding: 'utf8',
  });

  const problems = [];
  const issueRe = /^:(\d+):(\d+) - Unknown word \((.+)\)$/;
  for (const line of `${result.stdout}\n${result.stderr}`.split('\n')) {
    const m = issueRe.exec(line);
    if (!m) continue;
    const [, lineNum, , word] = m;
    const block = blocks[Number(lineNum) - 1];
    if (!block) continue; // defensive: a cspell output line we didn't anticipate the shape of.
    const words = block.text.split(/\s+/);
    const idx = words.findIndex((w) => w.replace(/[^\p{L}]/gu, '') === word);
    const start = Math.max(0, idx - 6);
    const context = words.slice(start, idx + 7).join(' ');
    problems.push({ pagePath: block.pagePath, word, context });
  }
  return problems;
}

async function main() {
  const blocks = await collectHrNoteBlocks();
  console.log(`Spell-checking ${blocks.length} unique Croatian note-card block(s) across /hr/* pages...`);

  const problems = findUnknownWords(blocks);

  if (problems.length === 0) {
    console.log(`\nNo unknown words found - every block matches @cspell/dict-hr-hr or .cspell/football-names-hr.txt.`);
    return;
  }

  console.error(`\n${problems.length} unknown word(s) found (verify each - a real typo or a new proper noun to add to .cspell/football-names-hr.txt):\n`);
  for (const { pagePath, word, context } of problems) {
    console.error(`  ${pagePath}: "${word}" - ...${context}...`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
