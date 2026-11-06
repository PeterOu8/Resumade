import { z } from 'zod';

import { resumeDraftSchema } from '@/lib/resume/resume.schema';
import { previewSettingsSchema, sectionOrderSchema } from './document.schema';

const snapshotSchema = z.object({
  draft: resumeDraftSchema,
  sectionOrder: sectionOrderSchema,
  settings: previewSettingsSchema,
});

export type ResumeSnapshot = z.infer<typeof snapshotSchema>;

export function readDraft(storageKey: string): ResumeSnapshot | null {
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeDraft(storageKey: string, snapshot: ResumeSnapshot) {
  localStorage.setItem(storageKey, JSON.stringify({
    ...snapshot,
    updatedAt: new Date().toISOString(),
  }));
}
