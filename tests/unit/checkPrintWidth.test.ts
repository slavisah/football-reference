import { describe, expect, it } from 'vitest';
import { PRINT_CONTENT_WIDTH_PX } from '../../scripts/check-print-width.mjs';

describe('PRINT_CONTENT_WIDTH_PX', () => {
  it('matches the A4-landscape usable content width tests/e2e/print-styles.spec.ts already uses', () => {
    // 297mm page width minus 12mm margins each side = 273mm, at 96 CSS px/inch.
    expect(PRINT_CONTENT_WIDTH_PX).toBe(Math.round((273 * 96) / 25.4));
    expect(PRINT_CONTENT_WIDTH_PX).toBe(1032);
  });
});
