import { z } from 'zod';
import { createEmptyResumeDraft } from '@/lib/resume/resume.schema';
import { createDefaultPresentation } from './document.schema';
import { readDraft, writeDraft } from './draft-storage';

const indexKey = 'resumade.editor.drafts.v1';
const storagePrefix = 'resumade.editor.draft.v1.guest.';
const guestIdSchema = z.union([z.uuid(), z.literal('default')]);
export const maxGuestDrafts = 2;
const draftIndexSchema = z.array(z.object({
  id: guestIdSchema,
  title: z.string(),
  updatedAt: z.number().int().positive(),
}));

export type GuestDraftSummary = z.infer<typeof draftIndexSchema>[number];

function storageKey(id: string) {
  return storagePrefix + id;
}

export function readGuestDrafts(): GuestDraftSummary[] {
  try {
    const parsed = draftIndexSchema.safeParse(JSON.parse(localStorage.getItem(indexKey) ?? '[]'));
    return parsed.success ? parsed.data
      .filter((draft) => localStorage.getItem(storageKey(draft.id)) !== null)
      .sort((left, right) => right.updatedAt - left.updatedAt) : [];
  } catch {
    return [];
  }
}

export function rememberGuestDraft(scope: string | undefined, title: string) {
  const id = scope?.startsWith('guest.') ? scope.slice('guest.'.length) : '';
  if (!guestIdSchema.safeParse(id).success) return;
  const next = [
    { id, title: title.trim() || 'Untitled resume', updatedAt: Date.now() },
    ...readGuestDrafts().filter((draft) => draft.id !== id),
  ];
  localStorage.setItem(indexKey, JSON.stringify(next));
}

// Include snapshots left outside the old 16-entry index when checking capacity.
export function guestDraftLimitReached() {
  const ids = new Set<string>();
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(storagePrefix)) {
      const id = key.slice(storagePrefix.length);
      if (guestIdSchema.safeParse(id).success && readDraft(key)) ids.add(id);
    }
  }
  if (!ids.has('default') && readDraft('resumade.editor.draft.v1')) ids.add('default');
  return ids.size >= maxGuestDrafts;
}

export async function reserveGuestDraft(id: string): Promise<boolean> {
  if (!guestIdSchema.safeParse(id).success) throw new Error('Invalid draft workspace.');
  const reserve = () => {
    const key = storageKey(id);
    if (readDraft(key)) return true;
    const legacy = id === 'default' ? readDraft('resumade.editor.draft.v1') : null;
    if (legacy) {
      localStorage.setItem(key, localStorage.getItem('resumade.editor.draft.v1') ?? JSON.stringify(legacy));
      localStorage.removeItem('resumade.editor.draft.v1');
      rememberGuestDraft('guest.default', legacy.draft.title);
      return true;
    }
    if (guestDraftLimitReached()) return false;
    const presentation = createDefaultPresentation();
    writeDraft(key, {
      draft: createEmptyResumeDraft(),
      sectionOrder: presentation.sectionOrder,
      settings: presentation.settings,
    });
    rememberGuestDraft(`guest.${id}`, '');
    return true;
  };
  // Serialise capacity checks across tabs without locking normal editing.
  if (navigator.locks) return navigator.locks.request('resumade.guest-draft-capacity', reserve);
  return reserve();
}

export function forgetGuestDraft(scope: string) {
  if (!scope.startsWith('guest.')) return;
  const id = scope.slice('guest.'.length);
  localStorage.setItem(indexKey, JSON.stringify(readGuestDrafts().filter((draft) => draft.id !== id)));
}
