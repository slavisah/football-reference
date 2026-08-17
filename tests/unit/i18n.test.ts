import { describe, expect, it } from 'vitest';
import { alternatePath, LOCALES, t, TRANSLATED_PATHS } from '../../src/lib/i18n';

describe('t', () => {
  it('returns a different string per locale for a translated key', () => {
    expect(t('en', 'skipToContent')).toBe('Skip to main content');
    expect(t('hr', 'skipToContent')).toBe('Preskoči na sadržaj');
    expect(t('en', 'skipToContent')).not.toBe(t('hr', 'skipToContent'));
  });

  it('has both locales non-empty for every UI string', () => {
    for (const { code } of LOCALES) {
      expect(t(code, 'brand').length).toBeGreaterThan(0);
      expect(t(code, 'footerTagline').length).toBeGreaterThan(0);
      expect(t(code, 'footerCopyright').length).toBeGreaterThan(0);
      expect(t(code, 'footerSourcesLink').length).toBeGreaterThan(0);
      expect(t(code, 'switchLanguageTo').length).toBeGreaterThan(0);
      expect(t(code, 'themeToggleAriaLabel').length).toBeGreaterThan(0);
      expect(t(code, 'themeLabel').length).toBeGreaterThan(0);
      expect(t(code, 'themeLight').length).toBeGreaterThan(0);
      expect(t(code, 'themeDark').length).toBeGreaterThan(0);
      expect(t(code, 'quizEyebrow').length).toBeGreaterThan(0);
      expect(t(code, 'quizScoreLabel').length).toBeGreaterThan(0);
      expect(t(code, 'quizRestart').length).toBeGreaterThan(0);
      expect(t(code, 'quizCheckAnswer').length).toBeGreaterThan(0);
      expect(t(code, 'quizJustShowAnswer').length).toBeGreaterThan(0);
      expect(t(code, 'quizCorrect').length).toBeGreaterThan(0);
      expect(t(code, 'quizOrderHeading').length).toBeGreaterThan(0);
      expect(t(code, 'quizOrderIntro').length).toBeGreaterThan(0);
      expect(t(code, 'quizCheckOrder').length).toBeGreaterThan(0);
      expect(t(code, 'quizOrderCorrect').length).toBeGreaterThan(0);
      expect(t(code, 'quizOrderIncorrect').length).toBeGreaterThan(0);
      expect(t(code, 'quizRankPlaceholder').length).toBeGreaterThan(0);
    }
  });

  it('gives Light/Dark/Theme distinct strings per locale', () => {
    expect(t('en', 'themeLight')).not.toBe(t('hr', 'themeLight'));
    expect(t('en', 'themeDark')).not.toBe(t('hr', 'themeDark'));
    expect(t('en', 'themeLabel')).not.toBe(t('hr', 'themeLabel'));
  });

  it('gives the champions-bar "of" word a distinct, non-empty string per locale', () => {
    expect(t('en', 'championsBarOfLabel')).toBe('of');
    expect(t('hr', 'championsBarOfLabel')).toBe('od');
    expect(t('en', 'championsBarOfLabel')).not.toBe(t('hr', 'championsBarOfLabel'));
  });

  it('gives the primary nav landmark a distinct, non-empty aria-label per locale', () => {
    expect(t('en', 'primaryNav')).toBe('Primary');
    expect(t('hr', 'primaryNav')).toBe('Glavna navigacija');
    expect(t('en', 'primaryNav')).not.toBe(t('hr', 'primaryNav'));
  });

  it('gives the "find a team" search widget distinct, non-empty strings per locale', () => {
    for (const key of [
      'teamSearchLabel',
      'teamSearchPlaceholder',
      'teamSearchNoResults',
      'teamSearchLoading',
      'teamSearchError',
    ] as const) {
      expect(t('en', key).length).toBeGreaterThan(0);
      expect(t('hr', key).length).toBeGreaterThan(0);
      expect(t('en', key)).not.toBe(t('hr', key));
    }
  });

  it('keeps the {query} placeholder in the no-results template for both locales', () => {
    expect(t('en', 'teamSearchNoResults')).toContain('{query}');
    expect(t('hr', 'teamSearchNoResults')).toContain('{query}');
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
    expect(alternatePath('/nonexistent-page', 'en')).toBeNull();
  });

  it('maps the English sources page to its Croatian translation and back', () => {
    expect(alternatePath('/about/sources', 'en')).toBe('/hr/about/sources');
    expect(alternatePath('/hr/about/sources', 'hr')).toBe('/about/sources');
  });

  it('maps the English records page to its Croatian translation and back', () => {
    expect(alternatePath('/records', 'en')).toBe('/hr/records');
    expect(alternatePath('/hr/records', 'hr')).toBe('/records');
  });

  it('maps the English compare page to its Croatian translation and back', () => {
    expect(alternatePath('/compare', 'en')).toBe('/hr/compare');
    expect(alternatePath('/hr/compare', 'hr')).toBe('/compare');
  });

  it('maps the English teams page to its Croatian translation and back', () => {
    expect(alternatePath('/teams', 'en')).toBe('/hr/teams');
    expect(alternatePath('/hr/teams', 'hr')).toBe('/teams');
  });

  it('maps the English quiz page to its Croatian translation and back', () => {
    expect(alternatePath('/quiz', 'en')).toBe('/hr/quiz');
    expect(alternatePath('/hr/quiz', 'hr')).toBe('/quiz');
  });

  it('maps the English Copa América page to its Croatian translation and back', () => {
    expect(alternatePath('/competitions/copa-america', 'en')).toBe(
      '/hr/competitions/copa-america',
    );
    expect(alternatePath('/hr/competitions/copa-america', 'hr')).toBe('/competitions/copa-america');
  });

  it('maps the English Nations League page to its Croatian translation and back', () => {
    expect(alternatePath('/competitions/nations-league', 'en')).toBe(
      '/hr/competitions/nations-league',
    );
    expect(alternatePath('/hr/competitions/nations-league', 'hr')).toBe(
      '/competitions/nations-league',
    );
  });

  it("maps the English Ballon d'Or page to its Croatian translation and back", () => {
    expect(alternatePath('/competitions/ballon-dor', 'en')).toBe(
      '/hr/competitions/ballon-dor',
    );
    expect(alternatePath('/hr/competitions/ballon-dor', 'hr')).toBe(
      '/competitions/ballon-dor',
    );
  });

  it('maps the English FIFA World Cup page to its Croatian translation and back', () => {
    expect(alternatePath('/competitions/world-cup', 'en')).toBe(
      '/hr/competitions/world-cup',
    );
    expect(alternatePath('/hr/competitions/world-cup', 'hr')).toBe(
      '/competitions/world-cup',
    );
  });

  it('maps the English UEFA EURO page to its Croatian translation and back', () => {
    expect(alternatePath('/competitions/euro', 'en')).toBe('/hr/competitions/euro');
    expect(alternatePath('/hr/competitions/euro', 'hr')).toBe('/competitions/euro');
  });

  it('maps the English Golden Boot page to its Croatian translation and back', () => {
    expect(alternatePath('/competitions/golden-boot', 'en')).toBe(
      '/hr/competitions/golden-boot',
    );
    expect(alternatePath('/hr/competitions/golden-boot', 'hr')).toBe(
      '/competitions/golden-boot',
    );
  });
});
