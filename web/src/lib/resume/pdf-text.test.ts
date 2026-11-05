import { describe, expect, it } from 'vitest';

import { buildPdfText, maxAiResumeTextLength } from './pdf-text';

describe('buildPdfText', () => {
  it('normalises PDF line endings without changing content', () => {
    expect(
      buildPdfText([
        { text: ' First   ', hasEOL: true },
        { text: '\n\n\nSecond\t', hasEOL: true },
      ]),
    ).toBe('First\n\n\nSecond');
  });

  it('handles a long horizontal whitespace run in linear space', () => {
    expect(
      buildPdfText([
        {
          text: `x${' '.repeat(maxAiResumeTextLength - 2)}`,
          hasEOL: false,
        },
      ]),
    ).toBe('x');
  });

  it('accepts source text at the AI parsing limit', () => {
    const text = 'x'.repeat(maxAiResumeTextLength);

    expect(buildPdfText([{ text, hasEOL: true }])).toBe(text);
  });

  it('rejects aggregate input above the AI parsing limit', () => {
    expect(
      buildPdfText([
        { text: 'x'.repeat(maxAiResumeTextLength / 2), hasEOL: false },
        { text: 'x'.repeat(maxAiResumeTextLength / 2), hasEOL: false },
      ]),
    ).toBeNull();
  });
});
