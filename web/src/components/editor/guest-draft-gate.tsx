'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { reserveGuestDraft } from '@/features/resume-document/guest-drafts';
import { GuestDraftLimitDialog } from '@/components/start/guest-draft-limit-dialog';

export function GuestDraftGate({ workspace, children }: { workspace: string; children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'limit' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    reserveGuestDraft(workspace).then((allowed) => {
      if (active) setState(allowed ? 'ready' : 'limit');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [workspace]);
  if (state === 'ready') return children;
  return (
    <div className="px-6 py-10 text-sm text-foreground-muted">
      {state === 'loading' && <p role="status">Opening your draft…</p>}
      {state === 'error' && <p role="alert">Your draft could not be opened. Check that browser storage is available, or <Link href="/signin" className="text-primary underline">sign in</Link>.</p>}
      {state === 'limit' && <>
        <p>Your two guest drafts are available on the <Link href="/start" className="text-primary underline">start page</Link>.</p>
        <GuestDraftLimitDialog open onClose={() => router.replace('/start')} />
      </>}
    </div>
  );
}
