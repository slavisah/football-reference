import { describe, expect, it } from 'vitest';
import { alternatePath, LOCALES, t, TRANSLATED_PATHS } from '../../src/lib/i18n';

describe('t', () => {
  it('returns a different string per locale for a translated key', () => {
    expect(t('en', 'skipToContent')).toBe('Skip to main content');
    expect(t('hr', 'skipToContent')).toBe('Preskoči na sadržaj');
    expect(t('en', 'skipToContent')).not.toBe(t('hr', 'skipToContent'));
  });

  it('has both locales non-empty for every UI string', () => {
    const keys: (keyof typeof import('../../src/lib/i18n'))[] = [];
    for (const { code } of LOCALES) {
      expect(t(code, 'brand').length).toBeGreaterThan(0);
      expect(t(code, 'footerTagline').length).toBeGreaterThan(0);
      expect(t(code, 'footerCopyright').length).toBeGreaterThan(0);
      expect(t(code, 'footerSourcesLink').length).toBeGreaterThan(0);
      expect(t(code, 'switchLanguageTo').length).toBeGreaterThan(0);
    }
  });
});

describe('alternatePath', () => {
  it('maps the English home page to its Croatian translation', () => {
    expect(alternatePath('/', 'en')).toBe(TRANSLATED_PATHS['/']);
    expect(alternatePath('/', 'en')).toBe('/hr/');
  });

  it('maps the Croatian home page back to English', () => {
    expect(alternatePath('/hr/', 'hr')).toBe('/');
  });

  it('returns null for a page that has no translation yet', () => {
    expect(alternatePath('/competitions/world-cup', 'en')).toBeNull();
    expect(alternatePath('/quiz', 'en')).toBeNull();
  });
});
