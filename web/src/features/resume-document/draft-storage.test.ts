import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createEmptyResumeDraft } from '@/lib/resume/resume.schema';
import { createDefaultPresentation } from './document.schema';
import { readDraft, writeDraft } from './draft-storage';

let records: Map<string, string>;

beforeEach(() => {
  records = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
  });
});

afterEach(() => { vi.unstubAllGlobals(); });

function snapshot() {
  const presentation = createDefaultPresentation('modern');
  return {
    draft: createEmptyResumeDraft(),
    sectionOrder: presentation.sectionOrder,
    settings: presentation.settings,
  };
}

it('reads legacy snapshots without timestamps and excludes metadata from document comparisons', () => {
  const draft = snapshot();
  records.set('legacy', JSON.stringify(draft));
  records.set('recent', JSON.stringify({ ...draft, updatedAt: '2026-11-06T01:00:00Z' }));
  expect(readDraft('legacy')).toEqual(draft);
  expect(readDraft('recent')).toEqual(readDraft('legacy'));
});

it('stores timestamps and keeps workspace drafts separate', () => {
  const draft = snapshot();
  draft.draft.title = 'Engineering resume';
  writeDraft('guest.one', draft);
  expect(readDraft('guest.one')).toEqual(draft);
  expect(readDraft('account.two')).toBeNull();
  expect(Number.isFinite(Date.parse(JSON.parse(records.get('guest.one')!).updatedAt))).toBe(true);
});

it('ignores malformed snapshots and unavailable browser storage', () => {
  records.set('broken', '{');
  records.set('invalid', JSON.stringify({ draft: {} }));
  expect(readDraft('broken')).toBeNull();
  expect(readDraft('invalid')).toBeNull();
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Unavailable'); } });
  expect(readDraft('unavailable')).toBeNull();
});
