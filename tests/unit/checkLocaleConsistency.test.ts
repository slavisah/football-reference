import { describe, expect, it } from 'vitest';
import {
  checkPageLocale,
  expectedLocale,
  extractHtmlLang,
} from '../../scripts/check-locale-consistency.mjs';

describe('expectedLocale', () => {
  it('expects "hr" for the Croatian home page', () => {
    expect(expectedLocale('/hr/')).toBe('hr');
  });

  it('expects "hr" for any page nested under /hr/', () => {
    expect(expectedLocale('/hr/records/')).toBe('hr');
    expect(expectedLocale('/hr/competitions/copa-america/2024/')).toBe('hr');
  });

  it('expects "en" for the English home page and every non-/hr/ page', () => {
    expect(expectedLocale('/')).toBe('en');
    expect(expectedLocale('/records/')).toBe('en');
    expect(expectedLocale('/404.html')).toBe('en');
  });

  it('does not treat a path merely containing "hr" as Croatian', () => {
    expect(expectedLocale('/teams/croatia/')).toBe('en');
  });
});

describe('extractHtmlLang', () => {
  it('reads the lang attribute off the <html> tag', () => {
    expect(extractHtmlLang('<html lang="hr"><head></head></html>')).toBe('hr');
  });

  it('returns null when the <html> tag has no lang attribute', () => {
    expect(extractHtmlLang('<html><head></head></html>')).toBeNull();
  });

  it('returns null for a redirect-stub page with no <html> tag at all', () => {
    expect(extractHtmlLang('<!doctype html><title>Redirecting</title><body></body>')).toBeNull();
  });
});

describe('checkPageLocale', () => {
  it('accepts an English page correctly declaring lang="en"', () => {
    expect(checkPageLocale('/records/', 'en')).toBeNull();
  });

  it('accepts a Croatian page correctly declaring lang="hr"', () => {
    expect(checkPageLocale('/hr/records/', 'hr')).toBeNull();
  });

  it('flags a Croatian-URL page that declares lang="en"', () => {
    expect(checkPageLocale('/hr/records/', 'en')).toBe(
      '<html lang="en"> does not match its own URL (expected lang="hr")',
    );
  });

  it('flags an English-URL page that declares lang="hr"', () => {
    expect(checkPageLocale('/records/', 'hr')).toBe(
      '<html lang="hr"> does not match its own URL (expected lang="en")',
    );
  });

  it('flags a page with no lang attribute at all, naming the expected value', () => {
    expect(checkPageLocale('/hr/records/', null)).toBe(
      'has no <html lang="..."> attribute at all (expected lang="hr")',
    );
  });
});
