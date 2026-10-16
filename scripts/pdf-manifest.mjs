// Pure manifest-hashing helpers for scripts/generate-pdfs.mjs's content-hash
// PDF-regeneration cache (docs/ROADMAP.md's "`.git` history bloat" item,
// Run 293: skip re-rendering a PDF whose sources haven't changed since the
// last `pnpm build:pdfs`, instead of unconditionally rewriting all 700).
//
// Split out into their own module, with no top-level side effects and no
// `@playwright/test`/`astro preview` dependency, specifically so they can be
// imported - and unit tested - without triggering generate-pdfs.mjs's own
// unconditional `main()` call at the bottom of that file, the same way
// pdf-metadata.mjs's addAuthorMetadata() is already a separate, side-effect-
// free module generate-pdfs.mjs imports rather than inlines.

import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

// `{}` (not a thrown error) when the manifest has never been written yet -
// generate-pdfs.mjs's own `skipUnchanged()` treats a slug missing from an
// empty object exactly like a slug with no entry in a real manifest: never
// a match, so the PDF is always rendered the first time.
export async function loadExistingManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// True only when both hash maps have exactly the same set of source-file
// keys and every key's hash matches. Comparing key *counts* first, not just
// iterating one side's keys, matters: a `sources` list edit that adds or
// removes a file (as opposed to editing the contents of an already-listed
// file) must also count as "changed" even though every key the two maps
// still share continues to match - silently ignoring an added/removed key
// would let a PDF's cache entry from before that list changed keep matching
// forever.
export function hashesMatch(a, b) {
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

// `root` is passed in explicitly (rather than this module reading its own
// import.meta.url) so tests can hash fixture files from a temp directory
// without needing to be laid out relative to the real repo root.
/**
 * @param {string} root
 * @param {string[]} sources
 * @returns {Promise<Record<string, string>>}
 */
export async function hashSources(root, sources) {
  /** @type {Record<string, string>} */
  const hashes = {};
  for (const file of sources) {
    const contents = await readFile(path.join(root, file), 'utf8');
    hashes[file] = createHash('sha256').update(contents).digest('hex');
  }
  return hashes;
}

/**
 * @param {string} root
 * @param {{ slug: string, sources: string[] }[]} entries
 * @returns {Promise<Record<string, Record<string, string>>>}
 */
export async function buildManifest(root, entries) {
  /** @type {Record<string, Record<string, string>>} */
  const manifest = {};
  for (const { slug, sources } of entries) {
    manifest[slug] = await hashSources(root, sources);
  }
  return manifest;
}
