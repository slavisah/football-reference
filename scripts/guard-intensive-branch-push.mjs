// Pre-push guard for `intensive/football-reference`, invoked by
// .githooks/pre-push on every `git push`. See that file's header and
// docs/ROADMAP.md's "Safety flag" backlog entry for the full incident
// history (Runs 321, 326, 327, 342, 349, 350 - six separate times the
// scheduled `intensive/football-reference` routine force-pushed a branch
// recreated from `main` over real, unmerged work, because a hand-run check
// trusted a stale or misread local view of the remote instead of asking it
// directly). `scripts/check-intensive-branch-state.mjs` (Run 339) already
// gives a run a single safe command to ask that question up front - but it
// only helps a run whose own stored prompt actually tells it to call that
// command, and three of the six incidents (342, 349, 350) happened precisely
// because the prompt that drives this routine is stored outside this repo
// and was never updated to mention it. This script is the same safety net
// enforced one layer lower, at the git level, so it still applies
// regardless of what any run's prompt does or doesn't say.
//
// Decision rule for a non-fast-forward update of the guarded branch: look at
// what the remote *actually* currently has (a fresh `ls-remote`, never a
// possibly-stale local tracking ref) and refuse the push unless every commit
// reachable from that remote tip but not yet in `main` has its content
// (patch-id, not SHA - a rebase changes SHAs but not content) present
// somewhere in the new history being pushed. That allows the routine's own
// legitimate operations (a plain fast-forward with new commits, or a clean
// rebase onto a newer `main`) while refusing exactly the failure mode seen
// six times: a branch recreated from `main` with none of the prior work
// carried over.
//
// A deliberate, informed override is still possible
// (ALLOW_FORCE_PUSH_INTENSIVE_BRANCH=1 git push ...) - this is a safety net
// against an unattended run's own misjudgment, not a lock nobody can open.
//
// One legitimate case that *will* need the override: recovering from an
// incident like the six above, where a run already pushed a bad tip and a
// later run (or the same one, same-run) is restoring the last known-good
// tip over it. From this hook's point of view that is a non-fast-forward
// push whose "old remote" (the bad tip) has content - the mistaken commit(s)
// - that genuinely is not present in what's being pushed, so it looks
// exactly like the failure mode this hook exists to catch and gets refused.
// That is intentional, not a bug: a human or an agent doing a deliberate
// recovery already knows the remote's current tip is the thing to discard,
// and should confirm that consciously via the override rather than have it
// pass silently.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const GUARDED_BRANCH = 'intensive/football-reference';
export const BASE_BRANCH = 'main';
export const OVERRIDE_ENV = 'ALLOW_FORCE_PUSH_INTENSIVE_BRANCH';
const ZERO_SHA = '0'.repeat(40);

/** Parses git's pre-push stdin format: one "<local ref> <local oid> <remote ref> <remote oid>" line per updated ref. */
export function parsePrePushInput(input) {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
      return { localRef, localSha, remoteRef, remoteSha };
    });
}

export function isDeleteSha(sha) {
  return sha === ZERO_SHA;
}

export function isGuardedRef(remoteRef, guardedBranch = GUARDED_BRANCH) {
  return remoteRef === `refs/heads/${guardedBranch}`;
}

/**
 * Pure decision logic, given the facts a caller has already gathered from
 * git. Never calls git itself, so it is testable with plain fixtures.
 */
export function evaluatePush({ trueRemoteSha, localSha, remoteIsAncestorOfLocal, missingPatchIds }) {
  if (!trueRemoteSha) {
    return { allowed: true, reason: 'remote branch does not exist yet - first push is always safe.' };
  }
  if (trueRemoteSha === localSha) {
    return { allowed: true, reason: 'remote already at this commit - no-op push.' };
  }
  if (remoteIsAncestorOfLocal) {
    return { allowed: true, reason: 'plain fast-forward - the new history contains everything the remote already had.' };
  }
  if (missingPatchIds.length === 0) {
    return {
      allowed: true,
      reason: 'non-fast-forward, but every remote commit’s content is present in the new history (a clean rebase).',
    };
  }
  return {
    allowed: false,
    reason:
      `this push would discard ${missingPatchIds.length} commit(s)' worth of work currently on ` +
      `origin/${GUARDED_BRANCH} that are not present in what you are about to push, and are not yet ` +
      `merged into origin/${BASE_BRANCH} either.`,
  };
}

// Network/history calls get an explicit timeout so a stalled connection or a
// slow blob fetch (this environment can be a partial clone, where reading a
// binary file's full content - e.g. one of the committed print PDFs - means
// fetching it on demand) fails the call rather than hanging the push
// forever. A failure here is always treated as "could not verify", which
// `checkOneRef` below turns into a refusal, not a silent allow - the whole
// point of this hook is to fail closed on a push it cannot vouch for.
const NETWORK_TIMEOUT_MS = 30_000;
const HISTORY_TIMEOUT_MS = 180_000;

function git(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', timeout: NETWORK_TIMEOUT_MS, ...opts }).trim();
}

function gitOk(args, opts = {}) {
  try {
    execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe', timeout: NETWORK_TIMEOUT_MS, ...opts });
    return true;
  } catch {
    return false;
  }
}

/** Set of patch-ids (content fingerprints, stable across rebase) for every commit in `range`. Throws on any failure - callers must not treat that the same as "legitimately no commits". */
function patchIdSet(range) {
  const diffOutput = execFileSync('git', ['log', '-p', '--no-color', range], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
    timeout: HISTORY_TIMEOUT_MS,
  });
  if (!diffOutput.trim()) return new Set();
  const patchIdOutput = execFileSync('git', ['patch-id', '--stable'], {
    input: diffOutput,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    timeout: HISTORY_TIMEOUT_MS,
  });
  const ids = new Set();
  for (const line of patchIdOutput.trim().split('\n')) {
    const patchId = line.trim().split(/\s+/)[0];
    if (patchId) ids.add(patchId);
  }
  return ids;
}

function checkOneRef({ localSha, remoteRef }) {
  // Ask the remote directly - never trust a possibly-stale local tracking
  // ref. This is the exact gap behind every one of the six incidents.
  let trueRemoteSha = '';
  try {
    const lsRemote = git(['ls-remote', 'origin', remoteRef]);
    trueRemoteSha = lsRemote ? lsRemote.split(/\s+/)[0] : '';
  } catch (err) {
    return { allowed: false, reason: `could not reach origin to verify the remote state (${err.message}) - refusing out of caution.` };
  }

  if (!trueRemoteSha || trueRemoteSha === localSha) {
    return evaluatePush({ trueRemoteSha, localSha, remoteIsAncestorOfLocal: false, missingPatchIds: [] });
  }

  // `ls-remote` only reports the SHA - it never transfers the commit
  // object. If this clone's last fetch predates the remote's current tip
  // (e.g. a push landed on the branch after that fetch), every merge-base/
  // patch-id call below would otherwise fail with "unknown revision" on
  // `trueRemoteSha`, and that failure gets misread as "not an ancestor" /
  // "could not verify" rather than "needs a fetch first" - refusing an
  // actually-safe push for the wrong reason (`check-intensive-branch-
  // state.mjs` already fetches both refs explicitly before comparing them
  // for exactly this reason; this hook skipped that step for the branch
  // side). Fetching by the exact ref name, not the SHA, works against
  // GitHub even when fetching an arbitrary commit by SHA would not.
  try {
    git(['fetch', '-q', 'origin', remoteRef]);
  } catch (err) {
    return { allowed: false, reason: `could not fetch ${remoteRef} to verify this push is safe (${err.message}) - refusing out of caution.` };
  }

  const remoteIsAncestorOfLocal = gitOk(['merge-base', '--is-ancestor', trueRemoteSha, localSha]);
  if (remoteIsAncestorOfLocal) {
    return evaluatePush({ trueRemoteSha, localSha, remoteIsAncestorOfLocal, missingPatchIds: [] });
  }

  const baseRef = `origin/${BASE_BRANCH}`;
  try {
    git(['fetch', '-q', 'origin', BASE_BRANCH], { timeout: NETWORK_TIMEOUT_MS });
  } catch (err) {
    return { allowed: false, reason: `could not fetch ${baseRef} to verify this push is safe (${err.message}) - refusing out of caution.` };
  }

  let missingPatchIds;
  try {
    const oldIds = patchIdSet(`${baseRef}..${trueRemoteSha}`);
    const newIds = patchIdSet(`${baseRef}..${localSha}`);
    missingPatchIds = [...oldIds].filter((id) => !newIds.has(id));
  } catch (err) {
    return { allowed: false, reason: `could not compute patch-ids to verify this push is safe (${err.message}) - refusing out of caution.` };
  }

  return evaluatePush({ trueRemoteSha, localSha, remoteIsAncestorOfLocal, missingPatchIds });
}

function main() {
  if (process.env[OVERRIDE_ENV] === '1') {
    console.error(`[guard-intensive-branch-push] ${OVERRIDE_ENV}=1 set - skipping the safety check for this push.`);
    process.exit(0);
  }

  let input = '';
  try {
    input = readFileSync(0, 'utf8');
  } catch {
    process.exit(0); // no stdin to read - nothing to guard
  }

  const updates = parsePrePushInput(input);
  let blocked = false;

  for (const update of updates) {
    if (!isGuardedRef(update.remoteRef)) continue;
    if (isDeleteSha(update.localSha)) continue; // deleting the branch is not this hook's concern

    console.error(`[guard-intensive-branch-push] checking push to ${GUARDED_BRANCH}...`);
    const { allowed, reason } = checkOneRef(update);
    if (allowed) {
      console.error(`[guard-intensive-branch-push] OK: ${reason}`);
      continue;
    }

    blocked = true;
    console.error('');
    console.error('========================================================');
    console.error(`REFUSED: ${reason}`);
    console.error('');
    console.error("This is exactly the branch-overwrite failure mode documented in");
    console.error('docs/ROADMAP.md’s "Safety flag" entry (six incidents so far).');
    console.error('Before pushing:');
    console.error('  1. Run: pnpm routine:branch-state');
    console.error('  2. Follow its verdict (UP_TO_DATE / REBASE_ONTO_BASE / RECREATE_FROM_BASE)');
    console.error('     rather than recreating the branch from a stale local view.');
    console.error('');
    console.error('If this push is genuinely intended (the remote content really should');
    console.error(`be dropped), re-run with: ${OVERRIDE_ENV}=1 git push ...`);
    console.error('========================================================');
  }

  process.exit(blocked ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
