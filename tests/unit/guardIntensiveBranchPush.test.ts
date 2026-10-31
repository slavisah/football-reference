import { describe, expect, it } from 'vitest';
import {
  parsePrePushInput,
  isDeleteSha,
  isGuardedRef,
  evaluatePush,
  GUARDED_BRANCH,
} from '../../scripts/guard-intensive-branch-push.mjs';

const ZERO_SHA = '0'.repeat(40);
const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

describe('parsePrePushInput', () => {
  it('parses a single update line', () => {
    const line = `refs/heads/intensive/football-reference ${SHA_A} refs/heads/intensive/football-reference ${SHA_B}\n`;
    expect(parsePrePushInput(line)).toEqual([
      {
        localRef: 'refs/heads/intensive/football-reference',
        localSha: SHA_A,
        remoteRef: 'refs/heads/intensive/football-reference',
        remoteSha: SHA_B,
      },
    ]);
  });

  it('parses multiple update lines (pushing more than one ref at once)', () => {
    const input = `refs/heads/main ${SHA_A} refs/heads/main ${SHA_B}\nrefs/heads/foo ${SHA_B} refs/heads/foo ${SHA_A}\n`;
    expect(parsePrePushInput(input)).toHaveLength(2);
  });

  it('ignores blank lines', () => {
    const input = `\nrefs/heads/main ${SHA_A} refs/heads/main ${SHA_B}\n\n`;
    expect(parsePrePushInput(input)).toHaveLength(1);
  });

  it('returns an empty array for empty stdin', () => {
    expect(parsePrePushInput('')).toEqual([]);
  });

  it('still parses the last line when stdin has no trailing newline', () => {
    const input = `refs/heads/main ${SHA_A} refs/heads/main ${SHA_B}`;
    expect(parsePrePushInput(input)).toHaveLength(1);
  });
});

describe('isDeleteSha', () => {
  it('is true for the all-zero SHA git uses to signal a branch delete', () => {
    expect(isDeleteSha(ZERO_SHA)).toBe(true);
  });

  it('is false for a real commit SHA', () => {
    expect(isDeleteSha(SHA_A)).toBe(false);
  });
});

describe('isGuardedRef', () => {
  it('matches the exact guarded branch ref', () => {
    expect(isGuardedRef(`refs/heads/${GUARDED_BRANCH}`)).toBe(true);
  });

  it('does not match a different branch', () => {
    expect(isGuardedRef('refs/heads/main')).toBe(false);
  });

  it('does not match a ref that merely shares a suffix with the guarded branch', () => {
    expect(isGuardedRef('refs/heads/not-intensive/football-reference')).toBe(false);
  });

  it('does not match a ref that merely shares a prefix with the guarded branch', () => {
    expect(isGuardedRef(`refs/heads/${GUARDED_BRANCH}-old`)).toBe(false);
  });

  it('respects an explicit branch override', () => {
    expect(isGuardedRef('refs/heads/some-other-branch', 'some-other-branch')).toBe(true);
  });
});

describe('evaluatePush', () => {
  it('allows the push when the remote branch does not exist yet', () => {
    const result = evaluatePush({ trueRemoteSha: '', localSha: SHA_A, remoteIsAncestorOfLocal: false, missingPatchIds: [] });
    expect(result.allowed).toBe(true);
  });

  it('allows a no-op push (remote already at this commit)', () => {
    const result = evaluatePush({ trueRemoteSha: SHA_A, localSha: SHA_A, remoteIsAncestorOfLocal: false, missingPatchIds: [] });
    expect(result.allowed).toBe(true);
  });

  it('allows a plain fast-forward', () => {
    const result = evaluatePush({ trueRemoteSha: SHA_A, localSha: SHA_B, remoteIsAncestorOfLocal: true, missingPatchIds: [] });
    expect(result.allowed).toBe(true);
  });

  it('allows a non-fast-forward push when every remote commit survived as a patch (a clean rebase)', () => {
    const result = evaluatePush({ trueRemoteSha: SHA_A, localSha: SHA_B, remoteIsAncestorOfLocal: false, missingPatchIds: [] });
    expect(result.allowed).toBe(true);
  });

  it('refuses a non-fast-forward push that would drop commits not present in the new history', () => {
    const result = evaluatePush({
      trueRemoteSha: SHA_A,
      localSha: SHA_B,
      remoteIsAncestorOfLocal: false,
      missingPatchIds: ['deadbeef', 'cafef00d'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('2 commit');
  });

  it('names the exact count of commits that would be lost', () => {
    const result = evaluatePush({
      trueRemoteSha: SHA_A,
      localSha: SHA_B,
      remoteIsAncestorOfLocal: false,
      missingPatchIds: ['deadbeef'],
    });
    expect(result.reason).toContain('1 commit');
  });
});
