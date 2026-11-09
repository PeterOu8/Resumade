'use client';

import { useEffect, useRef, useState } from 'react';
import { savedResumeSchema } from '@/lib/resume/resume.schema';
import { toast } from '@/components/ui/toast';
import { createEditingLease, type EditingLease } from '@/features/resume-document/editing-lease';

type LockState =
  | { status: 'checking' | 'busy' | 'unsupported' | 'error' }
  | { status: 'editing'; lease: EditingLease; latest?: Awaited<ReturnType<typeof loadEditorResume>> };

export type ResumeEditingStatus = LockState['status'];

async function loadEditorResume(id: string) {
  // Keep the editor mounted while fetching the latest version under the lock.
  const response = await fetch(`/api/resumes/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load the latest resume');
  return savedResumeSchema.parse(await response.json());
}

export function useResumeEditingLock(scope: string, resumeId?: string) {
  const checkLock = useRef<(notifyIfBusy?: boolean) => void>(() => {});
  const [state, setState] = useState<LockState>({ status: 'checking' });

  useEffect(() => {
    let current: ReturnType<typeof createEditingLease> | undefined;
    const stop = () => current?.stop();
    const restorePage = (event: PageTransitionEvent) => {
      if (event.persisted) checkLock.current();
    };
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', restorePage);

    checkLock.current = (notifyIfBusy = false) => {
      if (current?.lease.isActive()) return;
      current = createEditingLease();
      const { lease, stop, waitForRelease } = current;
      queueMicrotask(() => {
        if (!lease.isActive()) return;
        if (!navigator.locks) {
          setState({ status: 'unsupported' });
          stop();
          return;
        }
        // Keep the toolbar steady during a manual retry. The active lease
        // already prevents duplicate requests while the check is pending.
        if (!notifyIfBusy) setState({ status: 'checking' });
        void navigator.locks.request(`resumade.resume-edit.${scope}`, { ifAvailable: true }, async (lock) => {
          if (!lease.isActive()) return;
          if (!lock) {
            setState((previous) => previous.status === 'busy' ? previous : { status: 'busy' });
            if (notifyIfBusy) {
              toast.add({ title: 'Another tab is still editing this resume.', type: 'info' });
            }
            return;
          }
          const latest = resumeId ? await loadEditorResume(resumeId) : undefined;
          if (!lease.isActive()) return;
          setState({ status: 'editing', lease, latest });
          await waitForRelease();
        }).catch(() => {
          if (lease.isActive()) setState({ status: 'error' });
        }).finally(stop);
      });
    };
    checkLock.current();

    return () => {
      stop();
      checkLock.current = () => {};
      window.removeEventListener('pagehide', stop);
      window.removeEventListener('pageshow', restorePage);
    };
  }, [scope, resumeId]);

  return {
    state,
    retry: () => checkLock.current(true),
  };
}
