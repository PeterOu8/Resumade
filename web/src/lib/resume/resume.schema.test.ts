import { expect, it } from 'vitest';

import { createEmptyResumeDraft, savedResumeListSchema, savedResumeSchema, saveResumeRequestSchema } from './resume.schema';

it('gives an unnamed guest draft a valid title before saving after sign-in', () => {
  const draft = createEmptyResumeDraft();
  draft.title = '   ';
  expect(saveResumeRequestSchema.parse(draft).title).toBe('Untitled resume');
  draft.content.profile.fullName = 'Alex Lee';
  expect(saveResumeRequestSchema.parse(draft).title).toBe("Alex Lee's resume");
  draft.content.profile.fullName = 'A'.repeat(250);
  expect(saveResumeRequestSchema.parse(draft).title.length).toBeLessThanOrEqual(200);
});

it('preserves a valid document title and rejects an overlong historical draft title', () => {
  const draft = createEmptyResumeDraft();
  draft.title = '  Engineering resume  ';
  expect(saveResumeRequestSchema.parse(draft).title).toBe('Engineering resume');
  draft.title = 'A'.repeat(201);
  const result = saveResumeRequestSchema.safeParse(draft);
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues[0].message).toContain('200 characters');
});

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
