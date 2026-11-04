'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FileUp, LayoutTemplate, PanelsTopLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ImportPdfDialog } from './import-pdf-dialog';
import { importedResumePath } from '@/lib/resume/import-handoff';

type StartChoice = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
};

const cardClassName =
  'group flex min-h-[116px] w-full items-center gap-4 rounded-2xl border border-[#dce2ec] bg-white px-5 py-4 text-left shadow-[0_5px_20px_#27356008] transition-[border-color,background,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#aebef0] hover:bg-[#f8faff] hover:shadow-[0_12px_30px_#27356012] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#95a9f0] motion-reduce:transition-none sm:gap-5 sm:px-6';

function ChoiceContent({ choice }: { choice: StartChoice }) {
  const Icon = choice.icon;

  return (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eaf0ff] text-[#3558c8] sm:size-14">
        <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mt-1 block text-lg font-semibold tracking-[-0.03em] text-[#273348]">
          {choice.title}
        </span>
        <span className="mt-1 block text-sm leading-5 text-[#687282]">
          {choice.description}
        </span>
      </span>
      <ArrowUpRight
        size={19}
        className="shrink-0 self-start text-[#8d9bb3] transition-colors group-hover:text-[#3558c8]"
        aria-hidden="true"
      />
    </>
  );
}

export function StartChoices() {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);

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
              onClick={() => setImportOpen(true)}
              className={cardClassName}
            >
              <ChoiceContent choice={choice} />
            </button>
          ),
        )}
      </div>
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
