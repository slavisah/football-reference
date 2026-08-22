import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Scoped to src/lib/**/*.ts - the pure, unit-testable logic layer,
      // where every file already has a matching tests/unit/*.test.ts.
      // Excluded on purpose, not just uncovered: src/pages/**,
      // src/components/**, src/layouts/** (.astro files, exercised by the
      // Playwright mobile suite instead, never by Vitest) and
      // scripts/*.mjs (CLI tools split between a handful of exported pure
      // helpers, covered by their own tests/unit/check*.test.ts, and a
      // main()-invocation/reporting shell that's meant to be exercised by
      // actually running `pnpm check:*`, not unit-tested - see that
      // pattern's own "guard main() behind an entry-point check" precedent
      // in docs/PROJECT_STATUS.md). Reporting on either would only produce
      // a permanently low, misleading number for code this suite was never
      // meant to fully cover.
      include: ['src/lib/**/*.ts'],
    },
  },
});
