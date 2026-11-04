'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import { X } from 'lucide-react';

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
    <dialog
      ref={dialogRef}
      aria-labelledby="import-pdf-heading"
      onClose={() => {
        if (!dialogRef.current?.open) onClose();
      }}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[620px] overflow-y-auto rounded-[24px] border border-[#dce2ec] bg-white p-0 text-[#1e2636] shadow-[0_28px_90px_#0d142755] backdrop:bg-[#10182acc] backdrop:backdrop-blur-[3px]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#e5eaf2] px-6 py-5 sm:px-8">
        <div>
          <span className="text-[10px] font-bold tracking-[0.15em] text-[#3558c8] uppercase">
            IMPORT RESUME
          </span>
          <h2 id="import-pdf-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Import a PDF
          </h2>
          <p className="mt-1 text-sm text-[#687282]">
            Choose a file to start from an existing resume.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close import dialog"
          onClick={() => dialogRef.current?.close()}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#d7deea] text-[#687282] hover:bg-[#eef2fa] hover:text-[#273348] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#95a9f0]"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 py-6 sm:px-8">{open && <PdfUpload onImported={onImported} />}</div>
    </dialog>
  );
}
