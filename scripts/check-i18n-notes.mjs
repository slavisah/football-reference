// Cross-checks every English page's `EditorialNotes.astro` note-card sections
// ("Final venues", "Editorial notes", "Winning captains", etc.) against its
// Croatian counterpart's own hand-translated `notes` array, on the actual
// built output - a real content-integrity gap nothing before this run
// checked. Every Croatian competition/award page keeps its own hand-written
// `NoteSection[]` array (see e.g. `src/pages/hr/competitions/world-cup.astro`)
// rather than importing the English page's data, by design (the pages are
// intentionally decoupled so a hand-translated string can never accidentally
// leak English markup) - but that same decoupling means nothing before this
// check ever verified the two arrays stay in sync structurally: a future
// content edit that adds a bullet, a whole section, or an `intro` paragraph
// to one language's `content/*.md`/array and not the other's would ship
// silently, since `pnpm build`/`pnpm test`/every other `check:*` script has
// no opinion on note-section *structure* at all, only on the union of things
// each already checks (links, JSON-LD shape, meta tags, HTML5 validity).
//
// This run's own first pass with this script (still uncommitted at the time)
// caught two real, live bugs this way, both fixed in the same commit as this
// script: (1) `content/fifa-world-cup.md`'s "Editorial notes" has a fourth
// bullet ("Display a map of host countries without using protected
// tournament logos.") that the Croatian page's own array was simply missing
// - a genuine untranslated/dropped fact, not a markup issue; (2) the "Final
// venues" section on the World Cup, EURO and Copa América Croatian pages each
// had their English counterpart's lead-in explanatory sentence (a proper
// `NoteSection.intro`, rendered as its own `<p class="notes__intro">` on the
// English page - see `src/lib/notes.ts`'s `extractSection()`) folded into the
// bulleted list as an extra, spurious first `<li>` instead, misrepresenting a
// methodology caveat as if it were one more final venue. Nations League's own
// "Final venues" section was correctly unaffected: its English source
// deliberately opens with a bullet, not a lead-in paragraph, so there is no
// `intro` to lose there in the first place.
//
// What's checked, per matched EN/HR page pair: the same number of note-card
// sections, in the same order; for each section, the same "has an `intro`
// lead-in paragraph" flag; and the same item count (bullet count for a
// multi-item section, or 1 for a single-paragraph section, matching
// `EditorialNotes.astro`'s own `items.length > 1` branch). Deliberately does
// NOT compare heading or item *text* - the headings and every bullet are
// meant to differ, since one side is a Croatian hand-translation of the
// other; enforcing text equality would be enforcing a rule this site
// intentionally breaks on every page, not catching a bug. Structure (how
// many sections, how many bullets each, whether a lead-in paragraph exists)
// has no reason to differ, since both languages describe the exact same
// underlying facts.
//
// Plain regex extraction over already-built HTML, no browser launch - the
// same territory as `check:links`/`check:sitemap`/`check:jsonld`/`check:meta`
// (well under a second for all 711 pages), so this is wired into
// `.github/workflows/ci.yml` as a required PR gate rather than joining the
// four slower Playwright sweeps as a manual/intensive-run-only tool.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

/**
 * Pure: extracts every `.notes__card` section from a built page's HTML, in
 * document order, as `{ heading, hasIntro, itemCount }`. `hasIntro` mirrors
 * `EditorialNotes.astro`'s own `section.intro &&` branch (a
 * `<p class="notes__intro">`); `itemCount` counts `<li>` elements when the
 * section rendered as a list, or counts the section's own non-intro `<p>`
 * (always exactly one, per `EditorialNotes.astro`'s `items.length > 1 ? ul :
 * p` branch) when it rendered as a single paragraph instead.
 */
export function extractNoteCards(html) {
  const cards = [];
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = cardRe.exec(html))) {
    const body = match[1];
    const headingMatch = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(body);
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : '(no heading)';

    const hasIntro = /<p class="notes__intro"/.test(body);
    const withoutIntro = body.replace(/<p class="notes__intro"[\s\S]*?<\/p>/, '');

    const liCount = (withoutIntro.match(/<li[^>]*>/g) ?? []).length;
    const itemCount = liCount > 0 ? liCount : (withoutIntro.match(/<p(?![^>]*notes__intro)[^>]*>/g) ?? []).length;

    cards.push({ heading, hasIntro, itemCount });
  }
  return cards;
}

/**
 * Pure: diffs two pages' note-card lists (English first, its Croatian
 * counterpart second), returning human-readable problem strings - empty when
 * structurally consistent. `enPath`/`hrPath` are only used to label problems.
 */
export function diffNoteCards(enCards, hrCards, enPath, hrPath) {
  const problems = [];

  if (enCards.length !== hrCards.length) {
    problems.push(
      `${enPath} has ${enCards.length} note section(s) but ${hrPath} has ${hrCards.length} - ` +
        `headings: EN [${enCards.map((c) => c.heading).join(' | ')}] vs HR [${hrCards.map((c) => c.heading).join(' | ')}]`,
    );
    return problems;
  }

  for (let i = 0; i < enCards.length; i++) {
    const en = enCards[i];
    const hr = hrCards[i];
    if (en.hasIntro !== hr.hasIntro) {
      problems.push(
        `${enPath} section ${i} ("${en.heading}") ${en.hasIntro ? 'has' : 'has no'} intro paragraph but ` +
          `${hrPath} section ${i} ("${hr.heading}") ${hr.hasIntro ? 'has one' : 'has none'}`,
      );
    }
    if (en.itemCount !== hr.itemCount) {
      problems.push(
        `${enPath} section ${i} ("${en.heading}") has ${en.itemCount} item(s) but ` +
          `${hrPath} section ${i} ("${hr.heading}") has ${hr.itemCount}`,
      );
    }
  }

  return problems;
}

/** Pure: the `/hr/...` counterpart of an English page path, or `/hr` for the home page. */
export function hrCounterpart(pagePath) {
  return pagePath === '/' ? '/hr' : `/hr${pagePath}`;
}

/**
 * Pure: extracts every `.notes__card` section's item TEXT (not just a count)
 * from a built page's HTML, in document order, as `{ heading, items }` -
 * the same `.notes__card`/intro/`<li>`-or-`<p>` structure `extractNoteCards()`
 * above already parses, kept as a separate function (rather than added onto
 * `extractNoteCards()`'s own return shape) so that function's exact object
 * shape, and every existing test pinned to it via `toEqual`, stay unchanged.
 * Used only by `diffDashClauses()` below.
 */
export function extractNoteCardItemTexts(html) {
  const cards = [];
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = cardRe.exec(html))) {
    const body = match[1];
    const headingMatch = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(body);
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : '(no heading)';

    const withoutIntro = body.replace(/<p class="notes__intro"[\s\S]*?<\/p>/, '');
    const liMatches = [...withoutIntro.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
    const items =
      liMatches.length > 0
        ? liMatches.map((m) => m[1].replace(/<[^>]+>/g, '').trim())
        : [...withoutIntro.matchAll(/<p(?![^>]*notes__intro)[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
            m[1].replace(/<[^>]+>/g, '').trim(),
          );

    cards.push({ heading, items });
  }
  return cards;
}

/** Pure: true if `text` contains a " - "/" – " dash-clause separator. */
function hasDashClause(text) {
  return / [-–] /.test(text);
}

/**
 * Pure: a narrow, low-noise regression guard for one specific bug class the
 * hundred-and-eighty-sixth intensive run found by hand (see
 * `docs/PROJECT_STATUS.md`) - a Croatian note item that keeps its English
 * counterpart's core fact (names, a year, a number) but silently drops the
 * item's entire trailing " - commentary" clause. `diffNoteCards()` above
 * cannot see this: it only counts items and sections, and a dropped clause
 * changes neither count. Checked here instead: for every positionally-
 * matched item (same section index, same item index - meaningful only where
 * section/item counts already match, so this silently no-ops on a page pair
 * `diffNoteCards()` has already flagged for a structural mismatch), if the
 * English item contains a " - "/" – " dash-clause separator, the Croatian
 * item at the same position must contain one too.
 *
 * Deliberately narrow and one-directional, the same honesty every other
 * checker on this site documents about its own scope: it flags a *dropped*
 * clause, not a *shortened* one. A length-ratio heuristic was tried first and
 * rejected - calibrated against the site's own real historical bug, its
 * ratios (0.63-0.95 across the six buggy bullets) overlapped too heavily
 * with ordinary legitimate variation across the corpus (site-wide 5th
 * percentile 0.938, but the real bug's own least-truncated instance was
 * 0.945) to set a threshold with zero false positives - it would have either
 * missed real bugs or flagged good translations. This dash-clause signal was
 * calibrated the same way: checked against all 507 current EN/HR item pairs
 * site-wide with zero false positives, and confirmed to retroactively catch
 * 5 of the 6 real bugs the hundred-and-eighty-sixth run found by hand (the
 * sixth had already kept a different, shorter dash-clause in place of the
 * dropped one, so no dash was missing for this check to see - a known,
 * documented gap, not a defect pretending otherwise).
 */
export function diffDashClauses(enCards, hrCards, enPath, hrPath) {
  const problems = [];
  if (enCards.length !== hrCards.length) return problems;

  for (let i = 0; i < enCards.length; i++) {
    const en = enCards[i];
    const hr = hrCards[i];
    if (en.items.length !== hr.items.length) continue;

    for (let j = 0; j < en.items.length; j++) {
      if (hasDashClause(en.items[j]) && !hasDashClause(hr.items[j])) {
        problems.push(
          `${enPath} section ${i} ("${en.heading}") item ${j} has a trailing " - "/" – " clause but ` +
            `${hrPath} section ${i} ("${hr.heading}") item ${j} does not - possible dropped Croatian ` +
            `commentary. EN: "${en.items[j]}" | HR: "${hr.items[j]}"`,
        );
      }
    }
  }

  return problems;
}

async function main() {
  const files = await listHtmlFiles(DIST_DIR);
  const htmlByPagePath = new Map();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (isRedirectStubHtml(html)) continue;
    htmlByPagePath.set(htmlFileToPagePath(DIST_DIR, file), html);
  }

  const enPagePaths = [...htmlByPagePath.keys()]
    .filter((pagePath) => pagePath !== '/hr' && !pagePath.startsWith('/hr/'))
    .sort();

  console.log(`Checking English/Croatian note-section parity across ${enPagePaths.length} English pages...`);

  let checked = 0;
  const problems = [];
  for (const enPath of enPagePaths) {
    const hrPath = hrCounterpart(enPath);
    const hrHtml = htmlByPagePath.get(hrPath);
    if (!hrHtml) continue; // no Croatian counterpart to compare against - check:sitemap's own territory.

    const enCards = extractNoteCards(htmlByPagePath.get(enPath));
    const hrCards = extractNoteCards(hrHtml);
    if (enCards.length === 0 && hrCards.length === 0) continue;

    checked++;
    problems.push(...diffNoteCards(enCards, hrCards, enPath, hrPath));

    const enItemCards = extractNoteCardItemTexts(htmlByPagePath.get(enPath));
    const hrItemCards = extractNoteCardItemTexts(hrHtml);
    problems.push(...diffDashClauses(enItemCards, hrItemCards, enPath, hrPath));
  }

  if (problems.length === 0) {
    console.log(
      `\nEvery matched page pair (${checked} checked) has identical note-section structure, and no ` +
        `English item's trailing commentary clause is missing from its Croatian counterpart.`,
    );
    return;
  }

  console.error(`\n${problems.length} note-section parity problem(s) found:\n`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
