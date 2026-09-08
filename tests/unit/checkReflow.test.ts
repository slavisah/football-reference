import { describe, expect, it } from 'vitest';
import { dirToPagePath, isEditionDirName, pagesOverflowing } from '../../scripts/check-reflow.mjs';

describe('isEditionDirName', () => {
  it('accepts plain years', () => {
    expect(isEditionDirName('2024')).toBe(true);
  });

  it('accepts a season-style edition slug', () => {
    expect(isEditionDirName('2018-19')).toBe(true);
  });

  it('accepts a disambiguated year like Copa América 1959', () => {
    expect(isEditionDirName('1959-argentina')).toBe(true);
  });

  it('rejects a landing-page directory name', () => {
    expect(isEditionDirName('world-cup')).toBe(false);
  });
});

describe('dirToPagePath', () => {
  it('converts an on-disk dist path into a site-relative URL path', () => {
    expect(dirToPagePath('/repo/dist', '/repo/dist/competitions/world-cup/2026')).toBe(
      '/competitions/world-cup/2026/',
    );
  });

  it('joins nested Golden Boot paths with forward slashes regardless of platform separator', () => {
    expect(
      dirToPagePath('/repo/dist', '/repo/dist/hr/competitions/golden-boot/euro/2024'),
    ).toBe('/hr/competitions/golden-boot/euro/2024/');
  });
});

describe('pagesOverflowing', () => {
  const measurements = [
    { pagePath: '/a/', overflow: 0 },
    { pagePath: '/b/', overflow: 40 },
    { pagePath: '/c/', overflow: 1 },
  ];

  it('returns only pages whose overflow exceeds the tolerance', () => {
    expect(pagesOverflowing(measurements)).toEqual([{ pagePath: '/b/', overflow: 40 }]);
  });

  it('treats a page exactly at the tolerance as passing, not overflowing', () => {
    expect(pagesOverflowing([{ pagePath: '/c/', overflow: 1 }])).toEqual([]);
  });

  it('returns an empty list when every page is within tolerance', () => {
    expect(pagesOverflowing([{ pagePath: '/a/', overflow: 0 }])).toEqual([]);
  });
});
