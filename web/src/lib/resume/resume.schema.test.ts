import { expect, it } from 'vitest';

import { createEmptyResumeDraft, savedResumeListSchema, savedResumeSchema } from './resume.schema';

it('keeps dashboard cards for resumes with malformed historical content', () => {
  const valid = {
    ...createEmptyResumeDraft(),
    id: '123e4567-e89b-42d3-a456-426614174000',
    title: 'Valid resume',
    createdAt: '2026-11-05T00:00:00Z',
    updatedAt: '2026-11-05T00:00:00Z',
  };
  const historical = {
    ...valid,
    id: '123e4567-e89b-42d3-a456-426614174001',
    title: 'Historical resume',
    content: { ...valid.content, experience: [null] },
  };

  expect(savedResumeSchema.safeParse(historical).success).toBe(false);
  expect(savedResumeListSchema.parse([valid, null, historical])).toEqual([
    { id: valid.id, title: valid.title, updatedAt: valid.updatedAt },
    { id: historical.id, title: historical.title, updatedAt: historical.updatedAt },
  ]);
});
