import { describe, expect, it } from 'vitest';
import { summarizeContrastViolations, COLOR_SCHEMES } from '../../scripts/check-color-contrast.mjs';

describe('summarizeContrastViolations', () => {
  it('returns an empty list when there are no violations', () => {
    expect(summarizeContrastViolations([])).toEqual([]);
  });

  it('flattens one violation with one affected node', () => {
    const violations = [
      {
        id: 'color-contrast',
        help: 'Elements must have sufficient color contrast',
        nodes: [
          {
            target: ['.card .year'],
            failureSummary:
              'Fix any of the following:\n  Element has insufficient color contrast of 3.59 (foreground color: #767676, background color: #ffffff, font size: 9.0pt, font weight: normal): expected contrast ratio of 4.5:1',
          },
        ],
      },
    ];

    expect(summarizeContrastViolations(violations)).toEqual([
      {
        target: '.card .year',
        summary:
          'Fix any of the following: Element has insufficient color contrast of 3.59 (foreground color: #767676, background color: #ffffff, font size: 9.0pt, font weight: normal): expected contrast ratio of 4.5:1',
      },
    ]);
  });

  it('flattens multiple violations with multiple nodes each into one entry per node', () => {
    const violations = [
      {
        id: 'color-contrast',
        help: 'Elements must have sufficient color contrast',
        nodes: [
          { target: ['.leader'], failureSummary: 'insufficient contrast A' },
          { target: ['.winner'], failureSummary: 'insufficient contrast B' },
        ],
      },
      {
        id: 'color-contrast',
        help: 'Elements must have sufficient color contrast',
        nodes: [{ target: ['footer a'], failureSummary: 'insufficient contrast C' }],
      },
    ];

    expect(summarizeContrastViolations(violations)).toEqual([
      { target: '.leader', summary: 'insufficient contrast A' },
      { target: '.winner', summary: 'insufficient contrast B' },
      { target: 'footer a', summary: 'insufficient contrast C' },
    ]);
  });

  it('falls back to the violation-level help text when a node has no failureSummary', () => {
    const violations = [
      {
        id: 'color-contrast',
        help: 'Elements must have sufficient color contrast',
        nodes: [{ target: ['.badge'] }],
      },
    ];

    expect(summarizeContrastViolations(violations)).toEqual([
      { target: '.badge', summary: 'Elements must have sufficient color contrast' },
    ]);
  });

  it('joins a multi-element target selector with a space', () => {
    const violations = [
      {
        id: 'color-contrast',
        help: 'Elements must have sufficient color contrast',
        nodes: [{ target: ['table', 'tr:nth-child(2)', 'td'], failureSummary: 'insufficient contrast' }],
      },
    ];

    expect(summarizeContrastViolations(violations)).toEqual([
      { target: 'table tr:nth-child(2) td', summary: 'insufficient contrast' },
    ]);
  });

  it('sweeps both color schemes, since this site tunes accent colors per-theme', () => {
    expect(COLOR_SCHEMES).toEqual(['light', 'dark']);
  });
});
