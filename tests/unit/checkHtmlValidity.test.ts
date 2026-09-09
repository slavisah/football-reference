import { describe, expect, it } from 'vitest';
import { reportToFailures } from '../../scripts/check-html-validity.mjs';

describe('reportToFailures', () => {
  it('returns an empty list for a report with no messages', () => {
    const report = { results: [{ messages: [] }] };
    expect(reportToFailures('index.html', report)).toEqual([]);
  });

  it('flattens every message across every result into one list, tagged with the page path', () => {
    const report = {
      results: [
        {
          messages: [
            { ruleId: 'no-dup-id', line: 4, column: 10, message: 'ID "foo" already defined' },
          ],
        },
        {
          messages: [{ ruleId: 'no-missing-references', line: 9, column: 3, message: 'No ID found for "bar"' }],
        },
      ],
    };
    expect(reportToFailures('teams/brazil/index.html', report)).toEqual([
      {
        pagePath: 'teams/brazil/index.html',
        ruleId: 'no-dup-id',
        line: 4,
        column: 10,
        message: 'ID "foo" already defined',
      },
      {
        pagePath: 'teams/brazil/index.html',
        ruleId: 'no-missing-references',
        line: 9,
        column: 3,
        message: 'No ID found for "bar"',
      },
    ]);
  });

  it('preserves multiple messages within a single result', () => {
    const report = {
      results: [
        {
          messages: [
            { ruleId: 'aria-label-misuse', line: 1, column: 1, message: 'first' },
            { ruleId: 'aria-label-misuse', line: 2, column: 1, message: 'second' },
          ],
        },
      ],
    };
    expect(reportToFailures('quiz/index.html', report)).toHaveLength(2);
  });
});
