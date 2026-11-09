'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { takePdfImport } from '@/lib/resume/import-handoff';
import { createEmptyResumeDraft, type ResumeDraft } from '@/lib/resume/resume.schema';
import {
  defaultPreviewSettings,
  defaultSectionOrder,
  type PreviewSettings,
  type SectionKey,
  type ResumePresentation,
} from '@/features/resume-document/document.schema';
import { forgetGuestDraft, rememberGuestDraft } from '@/features/resume-document/guest-drafts';
import { readDraft, writeDraft, type ResumeSnapshot as Snapshot } from '@/features/resume-document/draft-storage';

const defaultStorageKey = 'resumade.editor.draft.v1';
const delayMs = 750;
const coalesceMs = 1200;
const maxHistory = 50;
type Recovery = { snapshot: Snapshot; updatedAt?: string };
type History = { undo: Snapshot[]; redo: Snapshot[] };
type SaveStatus = 'saved' | 'unsaved' | 'error';

const initialSnapshot: Snapshot = { draft: createEmptyResumeDraft(), sectionOrder: defaultSectionOrder, settings: defaultPreviewSettings };

export function useResumeDocument({
  initialStyle,
  initialImportId,
  initialDraft,
  initialPresentation,
  draftScope,
  fallbackDraftScope,
  cloudDocument = false,
  signedIn = false,
}: {
  initialStyle?: PreviewSettings['style'];
  initialImportId?: string;
  initialDraft?: ResumeDraft;
  initialPresentation?: ResumePresentation;
  draftScope?: string;
  fallbackDraftScope?: string;
  cloudDocument?: boolean;
  signedIn?: boolean;
}) {
  const storageKey = draftScope ? `${defaultStorageKey}.${draftScope}` : defaultStorageKey;
  const fallbackStorageKey = fallbackDraftScope
    ? `${defaultStorageKey}.${fallbackDraftScope}`
    : draftScope === 'guest.default' ? defaultStorageKey : null;
  const serverSnapshot = useMemo<Snapshot>(() => initialDraft
    ? {
        draft: initialDraft,
        sectionOrder: initialPresentation?.sectionOrder ?? defaultSectionOrder,
        settings: initialPresentation?.settings ?? defaultPreviewSettings,
      }
    : initialSnapshot, [initialDraft, initialPresentation]);
  const [snapshot, setSnapshot] = useState(serverSnapshot);
  const [history, setHistory] = useState<History>({ undo: [], redo: [] });
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [backupAvailable, setBackupAvailable] = useState(false);
  const backupKey = `${storageKey}.recovery`;
  const currentRef = useRef(snapshot);
  const needsLocalWriteRef = useRef(false);
  const historyRef = useRef(history);
  const lastEditRef = useRef({ label: '', at: 0 });

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (currentRef.current !== serverSnapshot) return;

      setReady(true);
      try {
        const backup = JSON.parse(localStorage.getItem(backupKey) ?? 'null');
        if (backup?.expiresAt > Date.now()) setBackupAvailable(true);
        else localStorage.removeItem(backupKey);
      } catch { /* Invalid backups are ignored. */ }
      let restored = readDraft(storageKey);
      let guestRecovered = false;
      if (!restored && fallbackStorageKey) {
        restored = readDraft(fallbackStorageKey);
        if (restored) {
          guestRecovered = true;
          try {
            localStorage.setItem(storageKey, localStorage.getItem(fallbackStorageKey) ?? JSON.stringify(restored));
            localStorage.removeItem(fallbackStorageKey);
            if (fallbackDraftScope) forgetGuestDraft(fallbackDraftScope);
          } catch {
            // The recovered draft remains at its original key if migration fails.
          }
        }
      }
      if (cloudDocument && restored && JSON.stringify(restored) !== JSON.stringify(serverSnapshot)) {
        let updatedAt: string | undefined;
        try { updatedAt = JSON.parse(localStorage.getItem(storageKey) ?? 'null')?.updatedAt; } catch { /* Legacy drafts have no timestamp. */ }
        setRecovery({ snapshot: restored, updatedAt });
        return;
      }
      if (cloudDocument && restored) {
        localStorage.removeItem(storageKey);
        restored = null;
      }
      if (signedIn && !cloudDocument && (guestRecovered || restored)) {
        toast.add({ title: 'Your draft is ready to save to your account.', type: 'success' });
      }
      const imported = initialImportId ? takePdfImport(initialImportId) : null;
      if (initialImportId && !imported && !restored) {
        toast.add({
          title: 'Resume import failed',
          description: 'The import could not be opened. Please import the PDF again.',
          type: 'error',
        });
      }
      if (!restored && !initialStyle && !imported) return;

      const base = restored ?? serverSnapshot;
      const next = initialStyle
        ? { ...base, settings: { ...base.settings, style: initialStyle } }
        : base;
      const hydrated = imported ? { ...next, draft: imported } : next;

      currentRef.current = hydrated;
      setSnapshot(hydrated);
      // Rebuild the editor's local row IDs from the restored or imported draft.
      if (restored || imported) setGeneration((value) => value + 1);
      if (imported) {
        const updated: History = { undo: [base], redo: [] };
        historyRef.current = updated;
        setHistory(updated);
        toast.add({ title: 'Resume imported', type: 'success' });
      }
      if ((restored && cloudDocument) || imported || next.settings.style !== base.settings.style) {
        needsLocalWriteRef.current = true;
        setStatus('unsaved');
      }
    });
    return () => { active = false; };
  }, [initialStyle, initialImportId, storageKey, fallbackStorageKey, fallbackDraftScope, cloudDocument, serverSnapshot, signedIn, backupKey]);

  useEffect(() => {
    if (!storageKey || status !== 'unsaved') return;
    const timer = window.setTimeout(() => {
      try {
        writeDraft(storageKey, snapshot);
        if (!cloudDocument) rememberGuestDraft(draftScope, snapshot.draft.title);
        if (!cloudDocument) {
          needsLocalWriteRef.current = false;
          setStatus('saved');
        }
      } catch {
        setStatus('error');
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [snapshot, status, storageKey, cloudDocument, draftScope]);

  useEffect(() => {
    if (!storageKey) return;
    const flush = () => {
      if (!needsLocalWriteRef.current) return;
      try {
        writeDraft(storageKey, currentRef.current);
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
  }, [storageKey]);

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
    needsLocalWriteRef.current = true;
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
    needsLocalWriteRef.current = true;
    setSnapshot(next);
    setStatus('unsaved');
    setGeneration((value) => value + 1);
    lastEditRef.current = { label: '', at: 0 };
  }, []);

  const importDraft = useCallback((draft: ResumeDraft, source = 'Import resume') => {
    apply({ ...currentRef.current, draft }, source, true);
    setGeneration((value) => value + 1);
  }, [apply]);

  const markCloudSaved = useCallback((savedSnapshot: Snapshot) => {
    if (JSON.stringify(currentRef.current) !== JSON.stringify(savedSnapshot)) return;
    try {
      needsLocalWriteRef.current = false;
      localStorage.removeItem(storageKey);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [storageKey]);

  const markCloudSaveFailed = useCallback(() => {
    setStatus('error');
  }, []);

  function persistDraft() {
    try {
      writeDraft(storageKey, currentRef.current);
      return true;
    } catch {
      setStatus('error');
      toast.add({ title: 'Could not preserve your draft on this device. Please try again.', type: 'error' });
      return false;
    }
  }

  function resolveRecovery(restoreLocal: boolean) {
    if (!recovery) return;
    if (restoreLocal) {
      apply(recovery.snapshot, 'Restore local edits', true);
      setGeneration((value) => value + 1);
    } else {
      try {
        localStorage.setItem(backupKey, JSON.stringify({
          ...recovery.snapshot, updatedAt: recovery.updatedAt, expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }));
        localStorage.removeItem(storageKey);
        setBackupAvailable(true);
      } catch {
        toast.add({ title: 'Could not keep a recovery copy. Please try again.', type: 'error' });
        return;
      }
    }
    setRecovery(null);
  }

  function recoverBackup() {
    try {
      const record = JSON.parse(localStorage.getItem(backupKey) ?? 'null');
      const saved = readDraft(backupKey);
      if (saved && record?.expiresAt > Date.now()) {
        apply(saved, 'Recover previous local draft', true);
        setGeneration((value) => value + 1);
      }
      setBackupAvailable(false);
    } catch {
      toast.add({ title: 'The recovery copy could not be opened.', type: 'error' });
    }
  }

  return {
    ...snapshot,
    status,
    canUndo: history.undo.length > 0,
    canRedo: history.redo.length > 0,
    generation,
    ready,
    recovery,
    backupAvailable,
    resolveRecovery,
    recoverBackup,
    persistDraft,
    updateDraft,
    updateSectionOrder,
    updateSettings,
    undo: () => restore('undo'),
    redo: () => restore('redo'),
    importDraft,
    markCloudSaved,
    markCloudSaveFailed,
  };
}
