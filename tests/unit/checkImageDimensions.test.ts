import { describe, expect, it } from 'vitest';
import {
  parsePngDimensions,
  parseSizesAttribute,
  extractOgImageMeta,
} from '../../scripts/check-image-dimensions.mjs';

/** Builds a minimal valid PNG buffer with the given IHDR width/height (no real pixel data - IHDR is all parsePngDimensions reads). */
function fakePng(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buf, 0);
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

describe('parsePngDimensions', () => {
  it('reads width/height from a valid PNG signature + IHDR', () => {
    expect(parsePngDimensions(fakePng(1200, 630))).toEqual({ width: 1200, height: 630 });
  });

  it('reads square dimensions correctly', () => {
    expect(parsePngDimensions(fakePng(512, 512))).toEqual({ width: 512, height: 512 });
  });

  it('returns null for a buffer with the wrong signature', () => {
    expect(parsePngDimensions(Buffer.alloc(24))).toBeNull();
  });

  it('returns null for a buffer too short to contain a signature + IHDR', () => {
    expect(parsePngDimensions(Buffer.from([137, 80, 78, 71]))).toBeNull();
  });

  it('returns null for an empty buffer', () => {
    expect(parsePngDimensions(Buffer.alloc(0))).toBeNull();
  });
});

describe('parseSizesAttribute', () => {
  it('parses a well-formed sizes string', () => {
    expect(parseSizesAttribute('192x192')).toEqual({ width: 192, height: 192 });
  });

  it('parses non-square dimensions', () => {
    expect(parseSizesAttribute('1200x630')).toEqual({ width: 1200, height: 630 });
  });

  it('returns null for a malformed sizes string', () => {
    expect(parseSizesAttribute('any')).toBeNull();
    expect(parseSizesAttribute('192')).toBeNull();
    expect(parseSizesAttribute('192x192x192')).toBeNull();
  });

  it('returns null for undefined/empty input', () => {
    expect(parseSizesAttribute(undefined)).toBeNull();
    expect(parseSizesAttribute('')).toBeNull();
  });
});

describe('extractOgImageMeta', () => {
  it('extracts all six fields from a real-shaped head', () => {
    const html = `<head>
      <meta property="og:image" content="https://example.com/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="A football icon and wordmark." />
      <meta name="twitter:image" content="https://example.com/og-image.png" />
      <meta name="twitter:image:alt" content="A football icon and wordmark." />
    </head>`;
    expect(extractOgImageMeta(html)).toEqual({
      ogImage: 'https://example.com/og-image.png',
      ogWidth: '1200',
      ogHeight: '630',
      ogImageAlt: 'A football icon and wordmark.',
      twitterImage: 'https://example.com/og-image.png',
      twitterImageAlt: 'A football icon and wordmark.',
    });
  });

  it('returns null for every field absent from the page', () => {
    expect(extractOgImageMeta('<head></head>')).toEqual({
      ogImage: null,
      ogWidth: null,
      ogHeight: null,
      ogImageAlt: null,
      twitterImage: null,
      twitterImageAlt: null,
    });
  });

  it('does not confuse og:image with og:image:width/height/alt (prefix collision)', () => {
    const html = `<meta property="og:image:width" content="1200" /><meta property="og:image:alt" content="Alt text" /><meta property="og:image" content="https://example.com/x.png" />`;
    const result = extractOgImageMeta(html);
    expect(result.ogImage).toBe('https://example.com/x.png');
    expect(result.ogWidth).toBe('1200');
    expect(result.ogImageAlt).toBe('Alt text');
  });
});
