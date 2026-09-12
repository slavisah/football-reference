// Search engines and link-preview surfaces (Google, Slack, Discord, X/Twitter)
// truncate a meta description around 155-160 characters; anything longer gets
// cut off mid-word/mid-sentence by the *consumer* instead of at a clean word
// boundary. The twenty-fourth intensive run (docs/PROJECT_STATUS.md) audited
// every literal `<BaseLayout description="...">` string for length and
// trimmed the 13 that were too long, but that was a source-code scan and
// couldn't see descriptions built at build time from editorial data (e.g. a
// per-edition page's champion/runner-up names, or a Golden Boot tie listing
// every co-winner) - those can exceed the guideline whenever the underlying
// names are long, without any single literal string in the source ever being
// wrong. Centralizing the clamp in BaseLayout.astro (rather than each of the
// ~14 per-family edition templates that build a description) covers every
// current and future page in one place.
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Clamps `text` to at most `maxLength` characters, cutting at the last word
 * boundary before the limit (never mid-word) and appending an ellipsis.
 * Returns `text` unchanged if it already fits.
 */
export function truncateDescription(text: string, maxLength = MAX_DESCRIPTION_LENGTH): string {
  if (text.length <= maxLength) return text;
  const ellipsis = '…';
  const truncated = text.slice(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');
  const safe = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${safe.replace(/[\s.,;:]+$/, '')}${ellipsis}`;
}
