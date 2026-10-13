import { describe, expect, it } from 'vitest';
import { controlsBelowMinimum, MIN_TARGET_PX } from '../../scripts/check-target-size.mjs';

describe('controlsBelowMinimum', () => {
  const measurements = [
    { label: 'button "OK"', width: 48, height: 48 },
    { label: 'select "Year"', width: 120, height: 39 },
    { label: 'button "X"', width: 44, height: 44 },
    { label: 'input "Agree"', width: 20, height: 20 },
  ];

  it('flags a control that is short even if wide enough', () => {
    expect(controlsBelowMinimum(measurements)).toEqual([
      { label: 'select "Year"', width: 120, height: 39 },
      { label: 'input "Agree"', width: 20, height: 20 },
    ]);
  });

  it('treats a control exactly at the threshold as passing', () => {
    expect(controlsBelowMinimum([{ label: 'button "X"', width: 44, height: 44 }])).toEqual([]);
  });

  it('defaults to this project\'s 44px floor', () => {
    expect(MIN_TARGET_PX).toBe(44);
  });

  it('accepts a custom threshold', () => {
    expect(controlsBelowMinimum(measurements, 24)).toEqual([{ label: 'input "Agree"', width: 20, height: 20 }]);
    expect(controlsBelowMinimum(measurements, 50)).toEqual(measurements);
  });

  it('returns an empty list when nothing is undersized', () => {
    expect(controlsBelowMinimum([{ label: 'button "OK"', width: 48, height: 48 }])).toEqual([]);
  });
});
