import { describe, expect, it } from 'vitest';
import { parseCssCustomProperty, parseThemeColorMeta } from '../../scripts/check-theme-color.mjs';

describe('parseCssCustomProperty', () => {
  it('extracts a hex custom property value', () => {
    const css = `
:root {
  --light-bg: #f7f8fa;
  --light-accent: #1f6f4f;
}
`;
    expect(parseCssCustomProperty(css, 'light-accent')).toBe('#1f6f4f');
  });

  it('returns null when the property is missing', () => {
    const css = `:root { --light-bg: #f7f8fa; }`;
    expect(parseCssCustomProperty(css, 'light-accent')).toBeNull();
  });
});

describe('parseThemeColorMeta', () => {
  it('extracts content/data-light/data-dark from the theme-color meta tag', () => {
    const source = `
    <meta
      name="theme-color"
      id="theme-color-meta"
      content="#1f6f4f"
      data-light="#1f6f4f"
      data-dark="#46c08a"
    />
`;
    expect(parseThemeColorMeta(source)).toEqual({
      content: '#1f6f4f',
      dataLight: '#1f6f4f',
      dataDark: '#46c08a',
    });
  });

  it('returns null when no theme-color meta tag exists', () => {
    const source = `<meta name="color-scheme" content="light dark" />`;
    expect(parseThemeColorMeta(source)).toBeNull();
  });

  it('ignores unrelated meta tags around it', () => {
    const source = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta
      name="theme-color"
      id="theme-color-meta"
      content="#1f6f4f"
      data-light="#1f6f4f"
      data-dark="#46c08a"
    />
    <meta name="color-scheme" content="light dark" />
`;
    expect(parseThemeColorMeta(source)).toEqual({
      content: '#1f6f4f',
      dataLight: '#1f6f4f',
      dataDark: '#46c08a',
    });
  });
});
