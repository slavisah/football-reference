import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildManifest,
  fileExists,
  hashesMatch,
  hashSources,
  loadExistingManifest,
} from '../../scripts/pdf-manifest.mjs';

describe('hashesMatch', () => {
  it('matches two hash maps with the same keys and values', () => {
    expect(hashesMatch({ a: 'x', b: 'y' }, { a: 'x', b: 'y' })).toBe(true);
  });

  it('does not match when a shared key has a different value (the file content changed)', () => {
    expect(hashesMatch({ a: 'x' }, { a: 'z' })).toBe(false);
  });

  it('does not match when the source list grew a key, even though every shared key still matches', () => {
    // A `sources` list edit (not a content edit to an already-listed file)
    // must still count as "changed" - see this function's own doc comment.
    expect(hashesMatch({ a: 'x' }, { a: 'x', b: 'y' })).toBe(false);
  });

  it('does not match when the source list lost a key, even though every shared key still matches', () => {
    expect(hashesMatch({ a: 'x', b: 'y' }, { a: 'x' })).toBe(false);
  });

  it('does not match when the key sets are the same size but actually different keys', () => {
    expect(hashesMatch({ a: 'x' }, { b: 'x' })).toBe(false);
  });

  it('never matches a missing/undefined/null manifest entry (a slug never built before)', () => {
    expect(hashesMatch(undefined, { a: 'x' })).toBe(false);
    expect(hashesMatch(null, { a: 'x' })).toBe(false);
    expect(hashesMatch({ a: 'x' }, undefined)).toBe(false);
  });

  it('matches two empty hash maps', () => {
    expect(hashesMatch({}, {})).toBe(true);
  });
});

describe('fileExists', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'pdf-manifest-test-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('is true for a file that exists', async () => {
    const filePath = path.join(dir, 'present.txt');
    await writeFile(filePath, 'hello');
    expect(await fileExists(filePath)).toBe(true);
  });

  it('is false for a file that does not exist', async () => {
    expect(await fileExists(path.join(dir, 'absent.txt'))).toBe(false);
  });
});

describe('loadExistingManifest', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'pdf-manifest-test-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns the parsed JSON when the manifest file exists', async () => {
    const manifestPath = path.join(dir, '.pdf-manifest.json');
    await writeFile(manifestPath, JSON.stringify({ 'world-cup': { 'content/fifa-world-cup.md': 'abc' } }));
    expect(await loadExistingManifest(manifestPath)).toEqual({
      'world-cup': { 'content/fifa-world-cup.md': 'abc' },
    });
  });

  it('returns {} rather than throwing when the manifest has never been written yet', async () => {
    expect(await loadExistingManifest(path.join(dir, 'does-not-exist.json'))).toEqual({});
  });

  it('rethrows a non-ENOENT error (e.g. malformed JSON) rather than swallowing it', async () => {
    const manifestPath = path.join(dir, '.pdf-manifest.json');
    await writeFile(manifestPath, 'not valid json');
    await expect(loadExistingManifest(manifestPath)).rejects.toThrow();
  });
});

describe('hashSources / buildManifest', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'pdf-manifest-test-'));
    await writeFile(path.join(dir, 'a.md'), 'content A');
    await writeFile(path.join(dir, 'b.md'), 'content B');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('hashes each source file to a stable, content-dependent SHA-256 hex digest', async () => {
    const hashes = await hashSources(dir, ['a.md', 'b.md']);
    expect(Object.keys(hashes)).toEqual(['a.md', 'b.md']);
    expect(hashes['a.md']).toMatch(/^[0-9a-f]{64}$/);
    expect(hashes['a.md']).not.toBe(hashes['b.md']);
    // Deterministic: hashing the same unchanged content again gives the
    // exact same digest, the property skipUnchanged()'s cache depends on.
    expect(await hashSources(dir, ['a.md'])).toEqual({ 'a.md': hashes['a.md'] });
  });

  it('changes the hash when a source file\'s content changes', async () => {
    const before = await hashSources(dir, ['a.md']);
    await writeFile(path.join(dir, 'a.md'), 'content A, edited');
    const after = await hashSources(dir, ['a.md']);
    expect(after['a.md']).not.toBe(before['a.md']);
  });

  it('builds one manifest entry per slug, each keyed by that slug\'s own sources', async () => {
    const manifest = await buildManifest(dir, [
      { slug: 'world-cup', sources: ['a.md'] },
      { slug: 'euro', sources: ['a.md', 'b.md'] },
    ]);
    expect(Object.keys(manifest)).toEqual(['world-cup', 'euro']);
    expect(Object.keys(manifest['world-cup'])).toEqual(['a.md']);
    expect(Object.keys(manifest['euro'])).toEqual(['a.md', 'b.md']);
    // The same file hashes identically whichever slug's entry it appears in.
    expect(manifest['world-cup']['a.md']).toBe(manifest['euro']['a.md']);
  });
});
