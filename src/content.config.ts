import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The Markdown in /content is the editorial source of truth. We load every file
// with the content-layer glob loader and validate its front matter with zod.
// Malformed front matter fails the build (a hard validation error), which is one
// of the content rules in the brief.
const status = z.enum(['draft', 'review', 'verified', 'needs-detailed-audit']);
// YAML parses an unquoted `2026-07-23` into a JS Date, so normalize back to an
// ISO date string before validating the shape.
const isoDate = z.preprocess(
  (value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'lastReviewed must be an ISO date (YYYY-MM-DD)'),
);

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './content' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    lastReviewed: isoDate,
    status,
    description: z.string().optional(),
    // Competition pages
    competitionType: z.enum(['international', 'continental']).optional(),
    confederation: z.string().optional(),
    firstEdition: z.union([z.number(), z.string()]).optional(),
    lastCompletedEdition: z.union([z.number(), z.string()]).optional(),
    // Award pages
    awardType: z.enum(['individual', 'scoring']).optional(),
  }),
});

export const collections = { pages };
