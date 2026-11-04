'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import { X } from 'lucide-react';

import { DialogCloseButton, DialogShell } from '@/components/ui/dialog-shell';
import type { ResumeDraft } from '@/lib/resume/resume.schema';

import { PdfUpload } from './pdf-upload';

type ImportPdfDialogProps = {
  open: boolean;
  onClose: () => void;
  onImported: (draft: ResumeDraft) => void;
};

export function ImportPdfDialog({ open, onClose, onImported }: ImportPdfDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) event.currentTarget.close();
  }

  return (
    <DialogShell
      ref={dialogRef}
      overflow="auto"
      aria-labelledby="import-pdf-heading"
      onClose={() => {
        if (!dialogRef.current?.open) onClose();
      }}
      onClick={handleBackdropClick}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5 sm:px-8">
        <div>
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
            IMPORT RESUME
          </span>
          <h2 id="import-pdf-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Import a PDF
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Choose a file to start from an existing resume.
          </p>
        </div>
        <DialogCloseButton
          aria-label="Close import dialog"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={18} aria-hidden="true" />
        </DialogCloseButton>
      </div>
      <div className="px-6 py-6 sm:px-8">{open && <PdfUpload onImported={onImported} />}</div>
    </DialogShell>
  );
}
