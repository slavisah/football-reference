import { describe, expect, it } from 'vitest';
import { buildManifest } from '../../src/lib/manifest';

describe('buildManifest', () => {
  it('builds an English manifest that launches to the English home page', () => {
    const manifest = buildManifest('en');
    expect(manifest.lang).toBe('en');
    expect(manifest.start_url).toBe('/');
    expect(manifest.id).toBe('/');
    expect(manifest.description).toContain('FIFA World Cup');
  });

  it('builds a Croatian manifest that launches to the Croatian home page, not the English one', () => {
    const manifest = buildManifest('hr');
    expect(manifest.lang).toBe('hr');
    expect(manifest.start_url).toBe('/hr/');
    expect(manifest.id).toBe('/hr/');
    expect(manifest.description).not.toBe(buildManifest('en').description);
  });

  it('keeps the brand name, icons, scope, and theme identical across locales', () => {
    const en = buildManifest('en');
    const hr = buildManifest('hr');
    expect(hr.name).toBe(en.name);
    expect(hr.short_name).toBe(en.short_name);
    expect(hr.scope).toBe(en.scope);
    expect(hr.theme_color).toBe(en.theme_color);
    expect(hr.background_color).toBe(en.background_color);
    expect(hr.icons).toEqual(en.icons);
  });

  it('every icon path is prefixed with the base path', () => {
    const manifest = buildManifest('hr');
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/icons/')).toBe(true);
    }
  });
});
