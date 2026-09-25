// Cross-checks every already-verified claim in the six verification-ledger
// files (`superlative-claims-ledger.json`, `ordinal-claims-ledger.json`,
// `record-claims-ledger.json`, `consecutive-claims-ledger.json`,
// `since-claims-ledger.json`, `one-of-only-claims-ledger.json`) against its
// Croatian counterpart page's own hand-translated note prose, on the actual
// built output - a gap none of those six checkers close themselves, since
// each is deliberately scoped to `content/*.md` (English) only (see each
// script's own header comment). A claim's English wording is re-verified
// against its source table before it ever enters a ledger, but nothing
// before this script has ever checked that the *Croatian* translation of
// that same claim still asserts the same underlying fact - a mistranslation
// or a stale Croatian bullet (left unfixed after the English one was
// corrected) would ship silently, the same failure mode
// `check:i18n-notes`/`check:attendance-format` already guard against for
// section structure and grouped-number formatting respectively, but for
// claim content specifically.
//
// Doing this precisely (verifying the Croatian bullet asserts the exact same
// fact as its English counterpart) isn't tractable with plain regex - that
// requires actually understanding both languages' prose, the same
// NLP-claim-extraction problem `check-superlative-claims.mjs`'s own header
// comment already rules out for a from-scratch checker. What plain
// regex/string matching *can* verify cheaply and reliably is that the two
// languages' claims share the same numeric anchors: every four-digit year
// (1900-2099) named in a verified English claim must also appear in its
// Croatian counterpart, and - narrower still, scoped to the exact bug class
// `check-since-claims.mjs`'s own ledger-seeding pass already found twice in
// English alone (`content/fifa-world-cup.md`'s Fair Play Award bullet and
// `content/uefa-euro.md`'s Player of the Tournament bullet both originally
// miscounted "the four earlier editions" when the real count was
// eight/nine) - a spelled-out "the <N> earlier editions" cardinal count must
// have its Croatian numeral translation present too. Neither check proves
// the Croatian sentence means the same thing (a manual read is still the
// only way to be sure of that - see this script's own matching
// `docs/PROJECT_STATUS.md` entry for the full one-time manual audit this
// script's first run performed, which found zero discrepancies across all
// five ledgers that existed at the time), but a year or count silently
// missing from the Croatian side is a strong, cheap, low-noise signal that
// something drifted.
//
// Positional pairing (closing the documented same-page-coincidence blind
// spot the hundred-and-eighty-first run's own entry left open, per its
// header comment's prior wording - see `docs/PROJECT_STATUS.md`'s matching
// entry for this run): rather than checking a claim's year against the whole
// page's combined note prose (which would miss a mistranslated year that
// happens to also appear correctly in a *different*, unrelated bullet on the
// same page), this locates the exact English `.notes__card` item a claim
// renders as - `locateClaimPosition()` strips the claim's own `**bold**`/
// `*italic*`/`` `code` `` Markdown markers the same way
// `renderInlineMarkdown()` (`src/lib/notes.ts`) converts them for display,
// then finds the one built `<li>`/`<p>` item (tags stripped, entities
// unescaped) whose text matches exactly - and, since `check:i18n-notes`
// already enforces identical section-count/order and item-count between
// every English page and its Croatian counterpart as a required CI gate,
// reads the Croatian item at that *same* section/item index instead of the
// page's whole note prose. A claim that can't be matched to exactly one
// English item (zero matches, or more than one - both would indicate this
// script's own extraction needs attention, not a content bug) falls back to
// the original whole-page check rather than silently skipping it, so
// coverage never regresses below what this script already had.
//
// The cardinal-word dictionary is deliberately narrow (two through twelve
// only, the range these claims actually use) and only fires on the exact
// "the <word> earlier edition(s)" phrase `check-since-claims.mjs`'s own
// `CLAIM_PATTERN` doubles down on - not a general number-word translator,
// which would need to handle Croatian's grammatical-case agreement (a
// genuinely hard problem this script deliberately stays out of) for the much
// wider range of number words this site's prose uses in other contexts
// (goal tallies, squad counts, trophy counts). Two through twelve modifying
// a neuter plural noun like "izdanja" (editions) take an invariant cardinal
// form in Croatian regardless of case, which is what keeps this narrow slice
// safe to check by plain substring match.
//
// Plain regex extraction over already-built HTML, no browser needed - the
// same territory as `check:i18n-notes`/`check:attendance-format` (well under
// a second for all 711 pages), so this is wired into
// `.github/workflows/ci.yml` as a required PR gate immediately after
// `check:attendance-format`.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles } from './check-internal-links.mjs';
import { htmlFileToPagePath, isRedirectStubHtml } from './check-reflow.mjs';
import { hrCounterpart } from './check-i18n-notes.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

const LEDGER_FILES = [
  'superlative-claims-ledger.json',
  'ordinal-claims-ledger.json',
  'record-claims-ledger.json',
  'consecutive-claims-ledger.json',
  'since-claims-ledger.json',
  'one-of-only-claims-ledger.json',
];

// Every `content/*.md` file any ledger keys claims under, mapped to the
// English page path whose Croatian counterpart (via `hrCounterpart()`)
// carries that file's hand-translated note prose. `quiz.md` is deliberately
// omitted: `record-claims-ledger.json`'s one `content/quiz.md` entry
// describes a dynamically generated question type, not a per-edition
// completeness claim tied to a specific page's prose (see that ledger's own
// entry note), so there is no Croatian note section to check it against.
const CONTENT_FILE_TO_PAGE_PATH = {
  'content/ballon-dor.md': '/competitions/ballon-dor/',
  'content/copa-america.md': '/competitions/copa-america/',
  'content/fifa-world-cup.md': '/competitions/world-cup/',
  'content/golden-boot.md': '/competitions/golden-boot/',
  'content/uefa-euro.md': '/competitions/euro/',
  'content/uefa-nations-league.md': '/competitions/nations-league/',
};

const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;

// Deliberately narrow - see the header comment above for why this stops at
// twelve rather than becoming a general number-word translator.
const EARLIER_EDITIONS_PATTERN = /\bthe (\w+) earlier editions?\b/i;
const CARDINAL_EN_TO_HR = {
  two: 'dva',
  three: 'tri',
  four: 'četiri',
  five: 'pet',
  six: 'šest',
  seven: 'sedam',
  eight: 'osam',
  nine: 'devet',
  ten: 'deset',
  eleven: 'jedanaest',
  twelve: 'dvanaest',
};

/** Pure: every distinct four-digit (1900-2099) year mentioned in `text`. */
export function extractYears(text) {
  return [...new Set(text.match(YEAR_PATTERN) ?? [])];
}

/**
 * Pure: the Croatian cardinal numeral a claim's "the <word> earlier
 * edition(s)" phrase should translate to, or `null` if the claim doesn't
 * match that phrase or uses a count word outside `CARDINAL_EN_TO_HR`'s
 * deliberately narrow two-through-twelve range.
 */
export function extractEarlierEditionsCardinal(text) {
  const match = EARLIER_EDITIONS_PATTERN.exec(text);
  if (!match) return null;
  return CARDINAL_EN_TO_HR[match[1].toLowerCase()] ?? null;
}

/**
 * Pure: the concatenated plain text of every `.notes__card` section on a
 * built page - the same section this site's six claim ledgers' underlying
 * prose renders into on the English side, and where its Croatian
 * translation lives too. Mirrors `check-i18n-notes.mjs`'s own `.notes__card`
 * extraction and `check-attendance-format.mjs`'s tag-stripping. Used only as
 * `diffClaimsAgainstHrNotes()`'s whole-page fallback now - the primary path
 * is the positional one below.
 */
export function extractNotesPlainText(html) {
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let text = '';
  let match;
  while ((match = cardRe.exec(html))) {
    text += `${match[1].replace(/<[^>]+>/g, ' ')} `;
  }
  return text;
}

/**
 * Pure: strips `**bold**`/`*italic*`/`` `code` `` Markdown markers down to
 * their inner text, the same substitutions `renderInlineMarkdown()`
 * (`src/lib/notes.ts`) applies before wrapping them in `<strong>`/`<em>`/
 * `<code>` tags - so a raw ledger claim string normalizes to the same plain
 * text its rendered `<li>`/`<p>` item does once `stripNoteItemTags()` below
 * removes those same three tags again. Whitespace is also collapsed, since a
 * multi-line ledger claim and a built HTML item can differ only in how
 * their internal whitespace was collapsed, never in content.
 */
export function stripMarkdownEmphasis(text) {
  return text
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    .replace(/`([^`]+?)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pure: the plain text of one `.notes__card` item's inner HTML -
 * `renderInlineMarkdown()`'s only three possible tags (`strong`/`em`/`code`)
 * removed without inserting whitespace (unlike the coarse `<[^>]+>` -> ' '
 * stripping `extractNotesPlainText()`/`check-i18n-notes.mjs` use for
 * whole-section text, which would wrongly split "**Jair**." into "Jair ."),
 * plus the same `&amp;`/`&lt;`/`&gt;` unescaping `renderInlineMarkdown()`'s
 * own escaping step applied on the way in.
 */
function stripNoteItemTags(html) {
  return html
    .replace(/<\/?(?:strong|em|code)>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pure: every `.notes__card` section on a built page as `{ heading, items }`,
 * `items` being each bullet's (or, for a single-paragraph section, its one
 * paragraph's) plain text - the positional counterpart to
 * `check-i18n-notes.mjs`'s `extractNoteCards()`, which only counts items
 * rather than keeping their text. Mirrors that function's own intro-paragraph
 * and list-vs-paragraph handling exactly, since a mismatch here would throw
 * off every index this module's positional pairing depends on.
 */
export function extractNoteCardsWithItems(html) {
  const cards = [];
  const cardRe = /<section class="notes__card card"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = cardRe.exec(html))) {
    const body = match[1];
    const headingMatch = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(body);
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : '(no heading)';
    const withoutIntro = body.replace(/<p class="notes__intro"[\s\S]*?<\/p>/, '');

    const liItems = [...withoutIntro.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => stripNoteItemTags(m[1]));
    const items =
      liItems.length > 0
        ? liItems
        : [...withoutIntro.matchAll(/<p(?![^>]*notes__intro)[^>]*>([\s\S]*?)<\/p>/g)].map((m) => stripNoteItemTags(m[1]));

    cards.push({ heading, items });
  }
  return cards;
}

/**
 * Pure: the `{ sectionIndex, itemIndex }` position of `claim` (a raw ledger
 * claim string) within `enCards` (this page's `extractNoteCardsWithItems()`
 * result) - or `null` when the claim's normalized text doesn't match exactly
 * one item, which this treats as "can't positionally pair" rather than
 * guessing, so the caller falls back to the whole-page check instead of
 * pairing against the wrong bullet.
 */
export function locateClaimPosition(claim, enCards) {
  const normalized = stripMarkdownEmphasis(claim);
  let found = null;
  for (let sectionIndex = 0; sectionIndex < enCards.length; sectionIndex++) {
    const { items } = enCards[sectionIndex];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      if (items[itemIndex] === normalized) {
        if (found) return null; // ambiguous - more than one exact match
        found = { sectionIndex, itemIndex };
      }
    }
  }
  return found;
}

/**
 * Pure: diffs one page family's verified claims against its Croatian notes
 * text, returning human-readable problem strings - empty when every claim's
 * years (and, where applicable, earlier-editions cardinal) are present. This
 * is the whole-page fallback `diffClaimsPositionally()` below uses for a
 * claim it can't positionally pair; kept as its own function (and its own
 * exact behavior) since `tests/unit/checkClaimsHr.test.ts` already covers it
 * directly and every claim on the site today *does* pair positionally, so
 * this path only ever runs for a future claim this module's extraction
 * doesn't yet handle.
 */
export function diffClaimsAgainstHrNotes(claims, hrNotesText, contentFile, hrPath, ledgerName) {
  const problems = [];
  for (const claim of claims) {
    const years = extractYears(claim);
    const missingYears = years.filter((year) => !hrNotesText.includes(year));
    if (missingYears.length > 0) {
      problems.push(
        `${ledgerName}: ${contentFile}'s claim "${claim}" names ${missingYears.join(', ')} but ` +
          `${hrPath}'s note prose doesn't mention ${missingYears.length === 1 ? 'it' : 'them'}`,
      );
    }

    const cardinal = extractEarlierEditionsCardinal(claim);
    if (cardinal && !hrNotesText.includes(cardinal)) {
      problems.push(
        `${ledgerName}: ${contentFile}'s claim "${claim}" names a count that should translate to ` +
          `"${cardinal}" but ${hrPath}'s note prose doesn't contain it`,
      );
    }
  }
  return problems;
}

/**
 * Pure: diffs one page family's verified claims against its Croatian
 * counterpart, positionally where possible - for each claim, locates its
 * exact English note item via `locateClaimPosition()` and checks the
 * Croatian item at that *same* section/item index (relying on
 * `check:i18n-notes` already guaranteeing that index exists and means the
 * same thing on both languages' pages); falls back to
 * `diffClaimsAgainstHrNotes()`'s whole-page check, one claim at a time, for
 * any claim that can't be positionally paired.
 */
export function diffClaimsPositionally(claims, enCards, hrCards, hrNotesText, contentFile, hrPath, ledgerName) {
  const problems = [];
  for (const claim of claims) {
    const position = locateClaimPosition(claim, enCards);
    const hrItem = position ? hrCards[position.sectionIndex]?.items[position.itemIndex] : undefined;

    if (hrItem === undefined) {
      problems.push(...diffClaimsAgainstHrNotes([claim], hrNotesText, contentFile, hrPath, ledgerName));
      continue;
    }

    const years = extractYears(claim);
    const missingYears = years.filter((year) => !hrItem.includes(year));
    if (missingYears.length > 0) {
      problems.push(
        `${ledgerName}: ${contentFile}'s claim "${claim}" names ${missingYears.join(', ')} but its Croatian ` +
          `counterpart bullet on ${hrPath} (section ${position.sectionIndex}, item ${position.itemIndex}) doesn't ` +
          `mention ${missingYears.length === 1 ? 'it' : 'them'}`,
      );
    }

    const cardinal = extractEarlierEditionsCardinal(claim);
    if (cardinal && !hrItem.includes(cardinal)) {
      problems.push(
        `${ledgerName}: ${contentFile}'s claim "${claim}" names a count that should translate to ` +
          `"${cardinal}" but its Croatian counterpart bullet on ${hrPath} (section ${position.sectionIndex}, item ` +
          `${position.itemIndex}) doesn't contain it`,
      );
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

  const hrNotesTextByPagePath = new Map();
  const enCardsByPagePath = new Map();
  const hrCardsByPagePath = new Map();
  const problems = [];
  let totalClaims = 0;

  for (const ledgerFile of LEDGER_FILES) {
    const ledgerPath = path.join(ROOT, 'scripts', ledgerFile);
    const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));

    for (const [contentFile, claims] of Object.entries(ledger)) {
      const pagePath = CONTENT_FILE_TO_PAGE_PATH[contentFile];
      if (!pagePath) continue; // e.g. content/quiz.md - see the mapping's own comment.

      const hrPath = hrCounterpart(pagePath);
      if (!hrNotesTextByPagePath.has(hrPath)) {
        const hrHtml = htmlByPagePath.get(hrPath);
        hrNotesTextByPagePath.set(hrPath, hrHtml ? extractNotesPlainText(hrHtml) : null);
      }
      const hrNotesText = hrNotesTextByPagePath.get(hrPath);
      if (hrNotesText === null) {
        problems.push(`${ledgerFile}: no built Croatian page found at ${hrPath} for ${contentFile}`);
        continue;
      }

      if (!enCardsByPagePath.has(pagePath)) {
        const enHtml = htmlByPagePath.get(pagePath);
        enCardsByPagePath.set(pagePath, enHtml ? extractNoteCardsWithItems(enHtml) : []);
      }
      if (!hrCardsByPagePath.has(hrPath)) {
        hrCardsByPagePath.set(hrPath, extractNoteCardsWithItems(htmlByPagePath.get(hrPath)));
      }
      const enCards = enCardsByPagePath.get(pagePath);
      const hrCards = hrCardsByPagePath.get(hrPath);

      const claimTexts = Object.keys(claims);
      totalClaims += claimTexts.length;
      problems.push(...diffClaimsPositionally(claimTexts, enCards, hrCards, hrNotesText, contentFile, hrPath, ledgerFile));
    }
  }

  console.log(
    `Checked ${totalClaims} verified claim(s) across ${LEDGER_FILES.length} verification ledgers against their Croatian note prose...`,
  );

  if (problems.length === 0) {
    console.log('\nEvery verified claim\'s years (and applicable earlier-editions counts) are present on its Croatian counterpart page.');
    return;
  }

  console.error(`\n${problems.length} claim/Croatian-translation anchor mismatch(es) found:\n`);
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
