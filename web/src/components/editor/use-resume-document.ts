'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { createEmptyResumeDraft, resumeDraftSchema, type ResumeDraft } from '@/lib/resume/resume.schema';

import { defaultPreviewSettings, defaultSectionOrder, sectionTitles, type PreviewSettings, type SectionKey } from './preview/constants';

const storageKey = 'resumade.editor.draft.v1';
const delayMs = 750;
const coalesceMs = 1200;
const maxHistory = 50;
const sectionOrderSchema = z.array(z.enum(Object.keys(sectionTitles) as [SectionKey, ...SectionKey[]]));
const settingsSchema = z.object({
  style: z.enum(['classic', 'modern', 'custom']),
  paper: z.enum(['a4', 'letter']),
  theme: z.object({ accent: z.string(), text: z.string() }),
  margins: z.object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() }),
  custom: z.object({
    font: z.enum(['sans', 'serif', 'mono']),
    alignment: z.enum(['left', 'center']),
    headings: z.enum(['plain', 'rule', 'band']),
    density: z.enum(['compact', 'comfortable']),
  }),
});
const snapshotSchema = z.object({ draft: resumeDraftSchema, sectionOrder: sectionOrderSchema, settings: settingsSchema.optional().default(defaultPreviewSettings) });

type Snapshot = z.infer<typeof snapshotSchema>;
type History = { undo: Snapshot[]; redo: Snapshot[] };
type SaveStatus = 'saved' | 'unsaved' | 'error';

const initialSnapshot: Snapshot = { draft: createEmptyResumeDraft(), sectionOrder: defaultSectionOrder, settings: defaultPreviewSettings };

function readDraft(): Snapshot | null {
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) ?? 'null'));
    if (!parsed.success) return null;
    const unique = new Set(parsed.data.sectionOrder);
    if (unique.size !== defaultSectionOrder.length || defaultSectionOrder.some((key) => !unique.has(key))) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function useResumeDocument() {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [history, setHistory] = useState<History>({ undo: [], redo: [] });
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [generation, setGeneration] = useState(0);
  const currentRef = useRef(snapshot);
  const historyRef = useRef(history);
  const lastEditRef = useRef({ label: '', at: 0 });

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = readDraft();
      if (restored && currentRef.current === initialSnapshot) {
        currentRef.current = restored;
        setSnapshot(restored);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (status !== 'unsaved') return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(snapshot));
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [snapshot, status]);

  useEffect(() => {
    const flush = () => {
      if (status === 'saved') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentRef.current));
      } catch {
        // The visible error state is set by the debounced write.
      }
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [status]);

  const apply = useCallback((next: Snapshot, label: string, force = false) => {
    const previous = currentRef.current;
    if (JSON.stringify(previous) === JSON.stringify(next)) return;
    const now = Date.now();
    const last = lastEditRef.current;
    const coalesce = !force && historyRef.current.redo.length === 0 && last.label === label && now - last.at < coalesceMs;
    const updated: History = {
      undo: coalesce ? historyRef.current.undo : [...historyRef.current.undo, previous].slice(-maxHistory),
      redo: [],
    };
    historyRef.current = updated;
    setHistory(updated);
    currentRef.current = next;
    setSnapshot(next);
    setStatus('unsaved');
    lastEditRef.current = { label, at: now };
  }, []);

  const updateDraft = useCallback((draft: ResumeDraft, label: string) => {
    apply({ ...currentRef.current, draft }, label);
  }, [apply]);

  const updateSectionOrder = useCallback((sectionOrder: SectionKey[]) => {
    apply({ ...currentRef.current, sectionOrder }, 'Reorder sections', true);
  }, [apply]);

  const updateSettings = useCallback((settings: PreviewSettings) => {
    apply({ ...currentRef.current, settings }, 'Edit preview settings');
  }, [apply]);

  const restore = useCallback((direction: 'undo' | 'redo') => {
    const stack = historyRef.current[direction];
    if (!stack.length) return;
    const next = stack[stack.length - 1];
    const opposite = direction === 'undo' ? 'redo' : 'undo';
    const updated = {
      ...historyRef.current,
      [direction]: stack.slice(0, -1),
      [opposite]: [...historyRef.current[opposite], currentRef.current].slice(-maxHistory),
    };
    historyRef.current = updated;
    setHistory(updated);
    currentRef.current = next;
    setSnapshot(next);
    setStatus('unsaved');
    setGeneration((value) => value + 1);
    lastEditRef.current = { label: '', at: 0 };
  }, []);

  const importDraft = useCallback((draft: ResumeDraft, source = 'Import resume') => {
    apply({ ...currentRef.current, draft }, source, true);
    setGeneration((value) => value + 1);
  }, [apply]);

  return {
    ...snapshot,
    status,
    canUndo: history.undo.length > 0,
    canRedo: history.redo.length > 0,
    generation,
    updateDraft,
    updateSectionOrder,
    updateSettings,
    undo: () => restore('undo'),
    redo: () => restore('redo'),
    importDraft,
  };
}
