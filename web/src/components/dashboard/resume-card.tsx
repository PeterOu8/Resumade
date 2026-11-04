'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FileText, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { IconButton } from '@/components/ui/icon-button';
import { deleteResume } from '@/lib/resume/delete-resume';

type Props = {
  id: string;
  title: string;
  updatedAt: string;
  updatedLabel: string;
};

export function ResumeCard({ id, title, updatedAt, updatedLabel }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, startDelete] = useTransition();

  function confirmDelete() {
    setDeleteError('');
    startDelete(async () => {
      const result = await deleteResume(id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <div className="group relative h-full rounded-2xl border border-[#dce2ec] bg-white shadow-[0_5px_20px_#27356008] transition-colors hover:border-[#aebef0] hover:bg-[#f8faff] focus-within:border-[#aebef0] focus-within:bg-[#f8faff]">
        <Link
          href={`/editor?resume=${id}`}
          className="flex h-full items-start gap-4 rounded-2xl p-5 pr-16 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#95a9f0]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf0ff] text-[#3558c8]">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-[#273348]">{title}</span>
            <span className="mt-1 block text-sm text-[#687282]">
              Updated <time dateTime={updatedAt}>{updatedLabel}</time>
            </span>
          </span>
        </Link>
        <IconButton
          size="md"
          variant="ghost"
          aria-label={`Delete ${title}`}
          title={`Delete ${title}`}
          disabled={deleting}
          onClick={() => {
            setDeleteError('');
            setDeleteOpen(true);
          }}
          className="absolute top-4 right-4 text-[#8d9bb3] hover:bg-[#f8e9eb] hover:text-[#9a3d48] focus-visible:text-[#9a3d48]"
        >
          <Trash2 aria-hidden="true" />
        </IconButton>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this resume?"
        description={`This permanently removes “${title}” from your account.`}
        confirmLabel="Delete resume"
        pendingLabel="Deleting…"
        pending={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
    </>
  );
}
