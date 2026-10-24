// Guards against docs/ROADMAP.md silently regrowing into a run-by-run log,
// the exact drift this file's own header has already had to describe and
// trim away four separate times (Runs 157, 221, 263, 341 - see the
// "Maintenance note"s at the top of docs/ROADMAP.md itself). Each prior
// fix was a prose restatement of "don't do this" with no code behind it;
// the third note's own closing sentence predicted that alone wouldn't hold,
// and it didn't - two "Open backlog" bullets regrew the file to 949 lines
// by Run 341 anyway. This script is the structural fix: a fixed line
// budget, checked in CI, the same pattern check-page-weight.mjs already
// uses for page weight. There's nothing clever to measure here (unlike
// page weight, this file has no natural "content vs. regression" split a
// script could compute), so this just counts lines and compares against a
// budget - the point is to force a human-visible trim in the same PR that
// would otherwise let the file balloon for weeks before anyone notices.
//
// Run manually (`pnpm check:roadmap-size`), or from CI - see
// .github/workflows/ci.yml. Exits non-zero if docs/ROADMAP.md exceeds
// ROADMAP_LINE_BUDGET lines.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROADMAP_PATH = path.join(ROOT, 'docs', 'ROADMAP.md');

// 691 lines as of Run 341's own trim (see the fourth maintenance note at the
// top of docs/ROADMAP.md). This leaves a little over 100 lines of headroom
// for genuinely new, still-open backlog items or ideas before a future run
// needs to raise it deliberately - the same "raise it on purpose, with a
// reason" pattern PAGE_WEIGHT_BUDGET_BYTES already uses, rather than a cap
// so tight it fails on the very next legitimate addition.
export const ROADMAP_LINE_BUDGET = 800;

/** Pure budget check: does this line count exceed the budget? */
export function exceedsBudget(lineCount, budgetLines) {
  return lineCount > budgetLines;
}

/** Counts lines the same way `wc -l`/every editor does: newline-terminated lines. */
export function countLines(text) {
  if (text.length === 0) return 0;
  const trimmed = text.endsWith('\n') ? text.slice(0, -1) : text;
  return trimmed.split('\n').length;
}

async function main() {
  let text;
  try {
    text = await readFile(ROADMAP_PATH, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`No file found at ${path.relative(ROOT, ROADMAP_PATH)}.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const lineCount = countLines(text);
  console.log(`docs/ROADMAP.md is ${lineCount} lines (budget: ${ROADMAP_LINE_BUDGET}).`);

  if (!exceedsBudget(lineCount, ROADMAP_LINE_BUDGET)) {
    console.log('Within budget.');
    return;
  }

  console.error(
    `\ndocs/ROADMAP.md is ${lineCount} lines, over the ${ROADMAP_LINE_BUDGET}-line budget.\n\n` +
      "This file is meant to stay a short, current-state entry point - not a run-by-run log. " +
      'Per its own "Going forward" rule: close a backlog item by deleting its bullet (after ' +
      'confirming its docs/PROJECT_STATUS.md entry exists), and record what you did only in ' +
      'docs/PROJECT_STATUS.md - never by appending a dated "Update (Run N)" paragraph to a bullet ' +
      'here. If growth is genuinely new, still-open backlog items or ideas (not narrative), raise ' +
      'ROADMAP_LINE_BUDGET in scripts/check-roadmap-size.mjs deliberately, the same way ' +
      'check-page-weight.mjs\'s own budget gets raised for genuinely new content.',
  );
  process.exitCode = 1;
}

// Guarded the same way check-page-weight.mjs is, so importing this file's
// pure functions from tests/unit/checkRoadmapSize.test.ts doesn't also
// re-run the file-read/budget check as an import side effect.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
