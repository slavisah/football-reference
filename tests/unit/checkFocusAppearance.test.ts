import { describe, expect, it } from 'vitest';
import { controlsMissingFocusRing, MIN_OUTLINE_WIDTH_PX } from '../../scripts/check-focus-appearance.mjs';

describe('controlsMissingFocusRing', () => {
  const measurements = [
    { label: 'a "Home"', outlineWidth: 3, hasBoxShadow: false },
    { label: 'summary "Story"', outlineWidth: 0, hasBoxShadow: false },
    { label: 'button "OK"', outlineWidth: 2, hasBoxShadow: false },
    { label: 'input "Year"', outlineWidth: 0, hasBoxShadow: true },
  ];

  it('flags a control with no outline at all', () => {
    expect(controlsMissingFocusRing(measurements)).toEqual([
      { label: 'summary "Story"', outlineWidth: 0, hasBoxShadow: false },
    ]);
  });

  it('does not flag a control whose ring uses box-shadow instead of outline', () => {
    expect(controlsMissingFocusRing([{ label: 'input "Year"', outlineWidth: 0, hasBoxShadow: true }])).toEqual(
      [],
    );
  });

  it('treats a control exactly at the threshold as passing', () => {
    expect(
      controlsMissingFocusRing([{ label: 'button "X"', outlineWidth: 2, hasBoxShadow: false }]),
    ).toEqual([]);
  });

  it("defaults to WCAG 2.4.13's 2px floor", () => {
    expect(MIN_OUTLINE_WIDTH_PX).toBe(2);
  });

  it('accepts a custom threshold', () => {
    expect(controlsMissingFocusRing(measurements, 1)).toEqual([
      { label: 'summary "Story"', outlineWidth: 0, hasBoxShadow: false },
    ]);
    expect(controlsMissingFocusRing(measurements, 4)).toEqual([
      { label: 'a "Home"', outlineWidth: 3, hasBoxShadow: false },
      { label: 'summary "Story"', outlineWidth: 0, hasBoxShadow: false },
      { label: 'button "OK"', outlineWidth: 2, hasBoxShadow: false },
    ]);
  });

  it('returns an empty list when every control has a visible ring', () => {
    expect(controlsMissingFocusRing([{ label: 'a "Home"', outlineWidth: 3, hasBoxShadow: false }])).toEqual(
      [],
    );
  });
});
