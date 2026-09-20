import { describe, expect, it } from 'vitest';
import { actionableBfCacheReasons, scoresBelowMin } from '../../scripts/check-lighthouse.mjs';

describe('scoresBelowMin', () => {
  it('returns nothing when every category clears the budget', () => {
    const scores = { performance: 1, accessibility: 0.95, 'best-practices': 1, seo: 1 };
    expect(scoresBelowMin(scores, 0.9)).toEqual([]);
  });

  it('flags every category strictly below the budget', () => {
    const scores = { performance: 0.8, accessibility: 1, 'best-practices': 0.5, seo: 0.9 };
    expect(scoresBelowMin(scores, 0.9)).toEqual([
      ['performance', 0.8],
      ['best-practices', 0.5],
    ]);
  });

  it('treats a score exactly at the budget as passing', () => {
    expect(scoresBelowMin({ performance: 0.9 }, 0.9)).toEqual([]);
  });
});

describe('actionableBfCacheReasons', () => {
  it('returns nothing when the audit has no failure items (a real bfcache pass)', () => {
    expect(actionableBfCacheReasons({ score: 1, details: { items: [] } })).toEqual([]);
  });

  it('returns nothing when the audit result carries no details at all', () => {
    expect(actionableBfCacheReasons({ score: 1 })).toEqual([]);
  });

  it('filters out every "Not actionable" reason - this harness disables bfcache itself', () => {
    const audit = {
      score: 0,
      details: {
        items: [
          {
            reason: 'Back/forward cache is disabled by flags.',
            failureType: 'Not actionable',
          },
          {
            reason: 'Back/forward cache is disabled by the command line.',
            failureType: 'Not actionable',
          },
        ],
      },
    };
    expect(actionableBfCacheReasons(audit)).toEqual([]);
  });

  it('keeps a genuinely actionable reason (a real site-caused bfcache blocker)', () => {
    const audit = {
      score: 0,
      details: {
        items: [
          {
            reason: 'Back/forward cache is disabled by flags.',
            failureType: 'Not actionable',
          },
          {
            reason: 'Pages that use WebSocket cannot enter back/forward cache.',
            failureType: 'Actionable',
          },
        ],
      },
    };
    expect(actionableBfCacheReasons(audit)).toEqual([
      {
        reason: 'Pages that use WebSocket cannot enter back/forward cache.',
        failureType: 'Actionable',
      },
    ]);
  });
});
