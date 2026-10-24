// Safe branch-state check for the `intensive/football-reference` scheduled
// routine's own branch-recreate-vs-rebase decision, factored out of that
// routine's stored prompt so a future run can call one command instead of
// hand-deriving the check under time pressure - which is exactly how three
// real incidents happened (see docs/ROADMAP.md's "Safety flag" backlog
// entry for the full history):
//
// - Runs 321 and 326 each sat in a container with a *shallow* clone, where
//   a plain `git fetch -q origin` followed by `git branch -a` showed no
//   local ref for `origin/intensive/football-reference` at all, even
//   though the branch existed on GitHub with real history. Run 321 trusted
//   that and force-pushed a fresh branch over 54 runs of real work (caught
//   and recovered the same run); Run 326 got lucky and cross-checked a PR
//   lookup first instead.
// - Run 327's clone was *not* shallow, but its merge-tree staleness check
//   ran slowly in the background, and the run substituted a faster, weaker
//   signal (the *original* PR being merged) instead of waiting for it -
//   recreating the branch and overwriting 46 further runs that had
//   accumulated under a second, newer PR the run hadn't looked for yet.
//
// Both failure modes share one root cause: the real answer ("does the
// remote branch exist, and if so is it already fully contained in main or
// does it carry genuine unmerged work") requires asking the remote
// directly and waiting for the answer, and a run in a hurry tends to
// reach for whatever local signal is fastest instead. This script *is*
// that direct remote check, run once, to completion, with no faster
// shortcut available to substitute - it is read-only (fetch + ls-remote +
// merge-base, no push, no branch creation) so adding it carries none of
// the risk it's meant to prevent.
//
// Usage: `node scripts/check-intensive-branch-state.mjs [branch] [base]`
// (defaults: branch=intensive/football-reference, base=main). Prints a
// verdict - RECREATE_FROM_BASE, REBASE_ONTO_BASE, or UP_TO_DATE - plus the
// evidence behind it, and exits non-zero only on an actual error (network
// failure, not-a-git-repo), never to express a verdict a caller might be
// tempted to parse past instead of reading.

import { execFileSync } from 'node:child_process';

const branch = process.argv[2] || 'intensive/football-reference';
const base = process.argv[3] || 'main';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gitOk(args) {
  try {
    execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  console.log(`Checking remote state of '${branch}' against '${base}'...`);

  // Ask the remote directly - this is the one step that must never be
  // replaced by a local `git branch -a`/`git branch -r` listing, which a
  // shallow clone can leave empty even when the remote ref is real.
  const remoteRef = git(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`]);
  if (!remoteRef) {
    console.log(`\nVERDICT: RECREATE_FROM_BASE`);
    console.log(
      `'origin/${branch}' genuinely does not exist (ls-remote returned ` +
        `nothing) - safe to create it fresh from 'origin/${base}'.`,
    );
    return;
  }
  console.log(`origin/${branch} exists on the remote: ${remoteRef}`);

  // Fetch both refs explicitly by name rather than trusting whatever a
  // prior plain `git fetch origin` happened to populate locally.
  git(['fetch', '-q', 'origin', base]);
  git(['fetch', '-q', 'origin', branch]);

  const baseRef = `origin/${base}`;
  const branchRef = `origin/${branch}`;
  const baseSha = git(['rev-parse', baseRef]);
  const branchSha = git(['rev-parse', branchRef]);
  console.log(`${baseRef} = ${baseSha}`);
  console.log(`${branchRef} = ${branchSha}`);

  if (baseSha === branchSha) {
    console.log(`\nVERDICT: UP_TO_DATE`);
    console.log('Branch and base point at the same commit - nothing to do.');
    return;
  }

  // Is the branch's own content already fully contained in base (the
  // squash/merge-and-continue case - e.g. its PR was merged and nothing
  // new has been pushed to the branch since)? Checked in *both*
  // directions on purpose: `is-ancestor base branch` alone cannot tell
  // "branch is ahead of base" apart from "branch and base diverged",
  // which is exactly the distinction Run 327's incident got wrong by
  // substituting a weaker signal instead of waiting for this check.
  const branchIsAncestorOfBase = gitOk(['merge-base', '--is-ancestor', branchRef, baseRef]);
  if (branchIsAncestorOfBase) {
    console.log(`\nVERDICT: RECREATE_FROM_BASE`);
    console.log(
      `'${branchRef}' is already an ancestor of '${baseRef}' - its content ` +
        `is fully merged (directly or via a prior PR). Safe to recreate ` +
        `'${branch}' fresh from '${baseRef}'.`,
    );
    return;
  }

  const baseIsAncestorOfBranch = gitOk(['merge-base', '--is-ancestor', baseRef, branchRef]);
  if (baseIsAncestorOfBranch) {
    const aheadCount = git(['rev-list', '--count', `${baseRef}..${branchRef}`]);
    console.log(`\nVERDICT: UP_TO_DATE`);
    console.log(
      `'${branchRef}' is strictly ahead of '${baseRef}' by ${aheadCount} ` +
        `commit(s) with no divergence - check it out as-is, no rebase needed.`,
    );
    return;
  }

  console.log(`\nVERDICT: REBASE_ONTO_BASE`);
  console.log(
    `'${branchRef}' and '${baseRef}' have diverged (neither is an ancestor ` +
      `of the other) - check out '${branch}' and rebase it onto '${baseRef}' ` +
      `before pushing any new work.`,
  );
}

main();
