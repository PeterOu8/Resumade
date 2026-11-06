import { describe, expect, it } from 'vitest';

import { createEmptyResumeDraft } from '@/lib/resume/resume.schema';
import {
  createDefaultPresentation,
  resumeDocumentSchema,
} from './document.schema';

describe('versioned resume documents', () => {
  it('keeps nested settings independent between new documents', () => {
    const first = createDefaultPresentation();
    first.settings.theme.accent = '#abcdef';
    first.settings.margins.left = 99;
    expect(createDefaultPresentation().settings.theme.accent).toBe('#111111');
    expect(createDefaultPresentation().settings.margins.left).toBe(12.7);
  });
  it('round-trips custom layout and section order', () => {
    const presentation = createDefaultPresentation('custom');
    presentation.settings.paper = 'a4';
    presentation.settings.theme.accent = '#3558c8';
    presentation.settings.margins.left = 24;
    presentation.sectionOrder = [...presentation.sectionOrder].reverse();

    const parsed = resumeDocumentSchema.parse({
      draft: createEmptyResumeDraft(),
      presentation,
    });

    expect(parsed.presentation).toEqual(presentation);
  });

  it('rejects duplicated or missing sections', () => {
    const presentation = createDefaultPresentation();
    presentation.sectionOrder = ['summary', 'summary'];

    expect(resumeDocumentSchema.safeParse({
      draft: createEmptyResumeDraft(),
      presentation,
    }).success).toBe(false);
  });
});
