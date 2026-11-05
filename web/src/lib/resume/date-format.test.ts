import { describe, expect, it } from 'vitest';

import { formatResumeDate } from './date-format';

describe('formatResumeDate', () => {
  it.each([
    ['2025-01', 'Jan 2025'],
    ['2026/3', 'Mar 2026'],
    ['03-2026', 'Mar 2026'],
  ])('displays numeric date %s as month and year', (value, expected) => {
    expect(formatResumeDate(value)).toBe(expected);
  });

  it.each(['Jan 2025', 'January 2025', '2025'])('preserves imported date formatting for %s', (value) => {
    expect(formatResumeDate(value)).toBe(value);
  });
});
