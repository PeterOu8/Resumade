import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createEmptyResumeDraft } from '@/lib/resume/resume.schema';
import { createDefaultPresentation } from './document.schema';
import { writeDraft } from './draft-storage';
import { forgetGuestDraft, guestDraftLimitReached, readGuestDrafts, reserveGuestDraft } from './guest-drafts';

const ids = [
  '123e4567-e89b-42d3-a456-426614174001',
  '123e4567-e89b-42d3-a456-426614174002',
  '123e4567-e89b-42d3-a456-426614174003',
];
const prefix = 'resumade.editor.draft.v1.guest.';
let records: Map<string, string>;

beforeEach(() => {
  records = new Map();
  vi.stubGlobal('localStorage', {
    get length() { return records.size; },
    key: (index: number) => [...records.keys()][index] ?? null,
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
    removeItem: (key: string) => { records.delete(key); },
  });
  let queue = Promise.resolve();
  vi.stubGlobal('navigator', {
    locks: {
      request: (_name: string, callback: () => boolean) => {
        const result = queue.then(callback);
        queue = result.then(() => {}, () => {});
        return result;
      },
    },
  });
});

afterEach(() => { vi.unstubAllGlobals(); });

it('reserves two real snapshots and refuses a third without deleting existing work', async () => {
  expect(await reserveGuestDraft(ids[0])).toBe(true);
  expect(await reserveGuestDraft(ids[1])).toBe(true);
  expect(guestDraftLimitReached()).toBe(true);
  expect(await reserveGuestDraft(ids[2])).toBe(false);
  expect(records.has(prefix + ids[2])).toBe(false);
  expect(readGuestDrafts()).toHaveLength(2);
  expect(await reserveGuestDraft(ids[0])).toBe(true);
});

it('serialises simultaneous creation attempts across tabs', async () => {
  expect(await Promise.all(ids.map((id) => reserveGuestDraft(id)))).toEqual([true, true, false]);
  expect(readGuestDrafts()).toHaveLength(2);
});

it('counts unindexed snapshots from older versions without removing them', async () => {
  const presentation = createDefaultPresentation();
  for (const id of ids) writeDraft(prefix + id, {
    draft: createEmptyResumeDraft(),
    sectionOrder: presentation.sectionOrder,
    settings: presentation.settings,
  });
  expect(guestDraftLimitReached()).toBe(true);
  expect(await reserveGuestDraft(crypto.randomUUID())).toBe(false);
  expect(await reserveGuestDraft(ids[2])).toBe(true);
  expect(ids.every((id) => records.has(prefix + id))).toBe(true);
});

it('releases capacity and removes stale index entries when a draft moves into an account', async () => {
  await reserveGuestDraft(ids[0]);
  await reserveGuestDraft(ids[1]);
  records.delete(prefix + ids[0]);
  forgetGuestDraft('guest.' + ids[0]);
  expect(readGuestDrafts().map((draft) => draft.id)).toEqual([ids[1]]);
  expect(await reserveGuestDraft(ids[2])).toBe(true);
});

it('counts the default workspace towards the same limit', async () => {
  expect(await reserveGuestDraft('default')).toBe(true);
  expect(await reserveGuestDraft(ids[0])).toBe(true);
  expect(await reserveGuestDraft(ids[1])).toBe(false);
});

it('rejects creation when browser storage is unavailable', async () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    get length() { throw new Error('Storage unavailable'); },
  });
  await expect(reserveGuestDraft(ids[0])).rejects.toThrow('Storage unavailable');
});
