'use client';

import { useEffect, useId, useRef } from 'react';
import { DialogShell } from '@/components/ui/dialog-shell';
import { Button } from '@/components/ui/button';

export function DraftRecoveryDialog({ localUpdatedAt, savedUpdatedAt, onRestore, onOpenSaved }: {
  localUpdatedAt?: string;
  savedUpdatedAt?: string;
  onRestore: () => void;
  onOpenSaved: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  function format(value?: string) {
    return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-AU') : 'Time unavailable';
  }
  return (
    <DialogShell ref={ref} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => event.preventDefault()}>
      <div className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-widest text-primary">RESUMADE</p>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">Restore your recent edits?</h2>
          <p id={descriptionId} className="text-sm leading-6 text-foreground-muted">
            This device has edits that differ from your saved resume. Choose which version to open.
            Your local copy stays recoverable for 24 hours if you open the saved version.
          </p>
        </div>
        <dl className="space-y-3 text-sm">
          <div><dt className="font-semibold">Edits on this device</dt><dd className="text-foreground-muted">{format(localUpdatedAt)}</dd></div>
          <div><dt className="font-semibold">Saved to your account</dt><dd className="text-foreground-muted">{format(savedUpdatedAt)}</dd></div>
        </dl>
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button variant="outline" onClick={onOpenSaved}>Open saved version</Button>
          <Button onClick={onRestore}>Restore edits</Button>
        </div>
      </div>
    </DialogShell>
  );
}
