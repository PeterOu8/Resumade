'use client';

import { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { DialogCloseButton, DialogShell } from '@/components/ui/dialog-shell';

export function GuestDraftLimitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return (
    <DialogShell ref={ref} overflow="auto" aria-labelledby={titleId} aria-describedby={descriptionId}
      onClose={() => { if (!ref.current?.open) onClose(); }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }}>
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5 sm:px-8">
        <div>
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">YOUR RESUMES</span>
          <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Keep building with an account</h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-foreground-muted">
            You have reached the limit of two guest drafts on this device. Create a free account to save up to 16 resumes.
          </p>
        </div>
        <DialogCloseButton aria-label="Close draft limit dialog" onClick={() => ref.current?.close()}>
          <X size={18} aria-hidden="true" />
        </DialogCloseButton>
      </div>
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <p className="text-sm leading-6 text-foreground-muted">Your existing drafts are still available. Sign up to save your work to your account and create more resumes.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-accent hover:bg-primary-hover">Create an account</Link>
          <Link href="/signin" className="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-5 text-sm font-semibold text-foreground-strong hover:bg-surface-hover">Sign in</Link>
        </div>
      </div>
    </DialogShell>
  );
}
