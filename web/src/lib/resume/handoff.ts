import { z } from 'zod';

import { resumeDraftSchema, type ResumeDraft } from './resume.schema';

const handoffSchema = z.object({
  version: z.literal(1),
  expiresAt: z.number().int().positive(),
  pendingAction: z.enum(['save', 'download']),
  draft: resumeDraftSchema,
});

export type ResumeHandoff = z.infer<typeof handoffSchema>;

export function createResumeHandoff(
  draft: ResumeDraft,
  pendingAction: ResumeHandoff['pendingAction'],
): ResumeHandoff {
  return {
    version: 1,
    expiresAt: Date.now() + 15 * 60 * 1000,
    pendingAction,
    draft,
  };
}

export function readResumeHandoff(raw: string | null): ResumeHandoff | null {
  if (raw === null) return null;

  try {
    const result = handoffSchema.safeParse(JSON.parse(raw));
    return result.success && result.data.expiresAt > Date.now()
      ? result.data
      : null;
  } catch {
    return null;
  }
}
