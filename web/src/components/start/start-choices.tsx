'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FileUp, LayoutTemplate, PanelsTopLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ImportPdfDialog } from './import-pdf-dialog';
import { importedResumePath } from '@/lib/resume/import-handoff';
import { guestDraftLimitReached, readGuestDrafts, type GuestDraftSummary } from '@/features/resume-document/guest-drafts';
import { GuestDraftLimitDialog } from './guest-draft-limit-dialog';
import { toast } from '@/components/ui/toast';

type StartChoice = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
};

const cardClassName =
  'group flex min-h-[116px] w-full items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-left shadow-card transition-[border-color,background,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-focus hover:bg-surface-subtle hover:shadow-card-hover focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus motion-reduce:transition-none sm:gap-5 sm:px-6';

function ChoiceContent({ choice }: { choice: StartChoice }) {
  const Icon = choice.icon;

  return (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary sm:size-14">
        <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mt-1 block text-lg font-semibold tracking-[-0.03em] text-foreground-strong">
          {choice.title}
        </span>
        <span className="mt-1 block text-sm leading-5 text-foreground-muted">
          {choice.description}
        </span>
      </span>
      <ArrowUpRight
        size={19}
        className="shrink-0 self-start text-foreground-subtle transition-colors group-hover:text-primary"
        aria-hidden="true"
      />
    </>
  );
}

export function StartChoices() {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [drafts, setDrafts] = useState<GuestDraftSummary[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDrafts(readGuestDrafts()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const choices: StartChoice[] = [
    {
      title: 'Import PDF',
      description: 'Drop in an existing PDF resume to begin.',
      icon: FileUp,
    },
    {
      href: '/start/templates',
      title: 'Create from scratch',
      description: 'Pick a layout, then build your resume section by section.',
      icon: LayoutTemplate,
    },
    {
      href: '/signin',
      title: 'Resume dashboard',
      description: 'Sign in to access your resumes.',
      icon: PanelsTopLeft,
    },
  ];

  return (
    <>
      <div className="space-y-3">
        {choices.map((choice) =>
          choice.href ? (
            <Link key={choice.title} href={choice.href} className={cardClassName}>
              <ChoiceContent choice={choice} />
            </Link>
          ) : (
            <button
              key={choice.title}
              type="button"
              onClick={() => {
                try {
                  if (guestDraftLimitReached()) setLimitOpen(true);
                  else setImportOpen(true);
                } catch {
                  toast.add({ title: 'Browser storage is unavailable. Please sign in to continue.', type: 'error' });
                }
              }}
              className={cardClassName}
            >
              <ChoiceContent choice={choice} />
            </button>
          ),
        )}
      </div>
      {drafts.length > 0 && (
        <section className="mt-8" aria-labelledby="continue-draft-heading">
          <h2 id="continue-draft-heading" className="text-sm font-semibold text-foreground-strong">
            Continue a draft
          </h2>
          <p className="mt-1 text-xs text-foreground-muted">Saved on this device</p>
          <div className="mt-3 space-y-2">
            {drafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/editor?new=${draft.id}`}
                className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-hover focus-visible:outline-3 focus-visible:outline-focus"
              >
                <span className="truncate font-semibold text-foreground-strong">{draft.title}</span>
                <span className="ml-4 shrink-0 text-xs text-foreground-muted">
                  {new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(draft.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <GuestDraftLimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
      <ImportPdfDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(draft) => {
          router.push(importedResumePath(draft));
          setImportOpen(false);
        }}
      />
    </>
  );
}
