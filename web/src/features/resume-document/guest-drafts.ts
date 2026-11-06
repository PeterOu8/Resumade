import { z } from 'zod';

const indexKey = 'resumade.editor.drafts.v1';
const draftIndexSchema = z.array(z.object({
  id: z.uuid(),
  title: z.string(),
  updatedAt: z.number().int().positive(),
}));

export type GuestDraftSummary = z.infer<typeof draftIndexSchema>[number];

export function readGuestDrafts(): GuestDraftSummary[] {
  try {
    const parsed = draftIndexSchema.safeParse(JSON.parse(localStorage.getItem(indexKey) ?? '[]'));
    return parsed.success ? parsed.data.sort((left, right) => right.updatedAt - left.updatedAt) : [];
  } catch {
    return [];
  }
}

export function rememberGuestDraft(scope: string | undefined, title: string) {
  const id = scope?.startsWith('guest.') ? scope.slice('guest.'.length) : '';
  if (!z.uuid().safeParse(id).success) return;
  const next = [
    { id, title: title.trim() || 'Untitled resume', updatedAt: Date.now() },
    ...readGuestDrafts().filter((draft) => draft.id !== id),
  ].slice(0, 16);
  localStorage.setItem(indexKey, JSON.stringify(next));
}
