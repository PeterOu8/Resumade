import { z } from 'zod';

import { resumeDraftSchema, type ResumeDraft } from './resume.schema';

const storageKey = 'resumade.pending-pdf-import.v1';
const pendingImportSchema = z.object({
  id: z.uuid(),
  expiresAt: z.number(),
  draft: resumeDraftSchema,
});

export function importedResumePath(draft: ResumeDraft): string {
  const id = crypto.randomUUID();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      id,
      expiresAt: Date.now() + 15 * 60_000,
      draft,
    }));
  } catch {
    throw new Error('Could not open the editor. Check that browser storage is available.');
  }
  return `/editor?import=${id}`;
}

export function takePdfImport(id: string): ResumeDraft | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const result = pendingImportSchema.safeParse(JSON.parse(raw));
    if (!result.success || result.data.id !== id || result.data.expiresAt <= Date.now()) {
      return null;
    }
    sessionStorage.removeItem(storageKey);
    return result.data.draft;
  } catch {
    return null;
  }
}
