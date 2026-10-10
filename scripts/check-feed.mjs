// Verifies dist/feed.xml and dist/hr/feed.xml against the actual build
// output - nothing previously checked these files at all, the same gap
// scripts/check-sitemap.mjs closed for sitemap.xml. Checks, per feed:
//
// - well-formed enough to parse (every <entry> has id/title/link/updated);
// - entries are sorted most-recently-reviewed first (src/lib/feed.ts's own
//   contract, src/pages/feed.xml.ts/hr/feed.xml.ts both rely on it holding);
// - every <entry>'s <id>/<link href> resolves to a real built page, and that
//   page's own `og:updated_time` (BaseLayout.astro's `dateModified` prop)
//   agrees with the entry's <updated> date - the same "does the feed's claim
//   match the real page" cross-check check-sitemap.mjs does for canonical
//   URLs, applied to the one date a feed reader actually sees;
// - the feed's own <link rel="self">/<link rel="alternate"> resolve to real
//   built files too.
//
// Run manually (`pnpm check:feed`) after `pnpm build`, or from CI - see
// .github/workflows/ci.yml. Exits non-zero, listing every mismatch found.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyLink, candidateDistPaths } from './check-internal-links.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, 'dist');

function xmlUnescape(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/** Parses an Atom feed document into its feed-level links and its `<entry>` list. */
export function parseAtomFeed(xml) {
  const selfMatch = xml.match(/<link rel="self" href="([^"]*)" \/>/);
  const alternateMatch = xml.match(/<link rel="alternate" href="([^"]*)" \/>/);
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const entries = blocks.map((block) => {
    const id = block.match(/<id>([^<]*)<\/id>/)?.[1];
    const title = block.match(/<title>([^<]*)<\/title>/)?.[1];
    const link = block.match(/<link rel="alternate" href="([^"]*)" \/>/)?.[1];
    const updated = block.match(/<updated>([^<]*)<\/updated>/)?.[1];
    return {
      id: id ? xmlUnescape(id) : undefined,
      title: title ? xmlUnescape(title) : undefined,
      link: link ? xmlUnescape(link) : undefined,
      updated,
    };
  });
  return {
    self: selfMatch ? xmlUnescape(selfMatch[1]) : undefined,
    alternate: alternateMatch ? xmlUnescape(alternateMatch[1]) : undefined,
    entries,
  };
}

/** True if `entries` is sorted by `updated` descending (ties allowed). */
export function entriesSortedDescending(entries) {
  for (let i = 1; i < entries.length; i += 1) {
    if (entries[i].updated > entries[i - 1].updated) return false;
  }
  return true;
}

async function resolveDistFile(href) {
  const classified = classifyLink(href);
  if (classified.kind !== 'internal') return null;
  for (const candidate of candidateDistPaths(classified.path)) {
    try {
      await readFile(path.join(DIST_DIR, candidate));
      return candidate;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return null;
}

async function checkFeed(feedPath, locale) {
  const problems = [];
  let xml;
  try {
    xml = await readFile(path.join(DIST_DIR, feedPath), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      problems.push(`No feed found at ${feedPath}. Run \`pnpm build\` first.`);
      return problems;
    }
    throw error;
  }

  const feed = parseAtomFeed(xml);

  if (feed.entries.length === 0) {
    problems.push(`${feedPath}: no <entry> elements found`);
  }
  for (const entry of feed.entries) {
    if (!entry.id || !entry.title || !entry.link || !entry.updated) {
      problems.push(`${feedPath}: entry missing id/title/link/updated: ${JSON.stringify(entry)}`);
    }
  }
  if (!entriesSortedDescending(feed.entries)) {
    problems.push(`${feedPath}: entries are not sorted most-recently-updated first`);
  }

  for (const link of [feed.self, feed.alternate]) {
    if (!link) continue;
    if (!(await resolveDistFile(link))) {
      problems.push(`${feedPath}: feed-level link ${link} does not resolve to any built file`);
    }
  }

  for (const entry of feed.entries) {
    if (!entry.link) continue;
    const distFile = await resolveDistFile(entry.link);
    if (!distFile) {
      problems.push(`${feedPath}: entry "${entry.title}" link ${entry.link} does not resolve to any built page`);
      continue;
    }
    const html = await readFile(path.join(DIST_DIR, distFile), 'utf8');
    const ogUpdated = html.match(/<meta property="og:updated_time" content="([^"]*)"/)?.[1];
    const expectedDate = entry.updated?.slice(0, 10);
    if (ogUpdated && ogUpdated !== expectedDate) {
      problems.push(
        `${feedPath}: entry "${entry.title}" claims updated=${expectedDate}, but ${distFile}'s own og:updated_time says ${ogUpdated}`,
      );
    }
  }

  if (locale) {
    // Sanity check that this is really the Croatian feed and not an
    // accidental copy of the English one: every entry link should live
    // under /hr/.
    for (const entry of feed.entries) {
      if (entry.link && !entry.link.includes('/hr/')) {
        problems.push(`${feedPath}: entry "${entry.title}" link ${entry.link} is not under /hr/`);
      }
    }
  }

  return problems;
}

async function main() {
  const problems = [
    ...(await checkFeed('feed.xml')),
    ...(await checkFeed('hr/feed.xml', 'hr')),
  ];

  if (problems.length > 0) {
    console.error(`check:feed found ${problems.length} problem(s):\n`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log('check:feed: feed.xml and hr/feed.xml both clean.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
