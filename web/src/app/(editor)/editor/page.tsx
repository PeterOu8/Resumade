import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { ResumeEditor } from '@/components/editor/resume-editor';
import { GuestDraftGate } from '@/components/editor/guest-draft-gate';
import {
  layoutLabels,
  type PreviewSettings,
} from '@/components/editor/preview/constants';
import { getSavedResume, ResumeApiError } from '@/lib/resume/resume-api';
import type { ResumeDraft } from '@/lib/resume/resume.schema';
import { createDefaultPresentation, presentationSchema, type ResumePresentation } from '@/features/resume-document/document.schema';

async function EditorWithTemplate({
  searchParams,
}: {
  searchParams: PageProps<'/editor'>['searchParams'];
}) {
  await connection();
  const params = await searchParams;
  const session = await auth();
  const resumeId =
    typeof params.resume === 'string' ? params.resume : undefined;
  const importId =
    typeof params.import === 'string' ? params.import : undefined;
  const newId = z.uuid().safeParse(params.new);
  const requestedStyle = params.style;
  const initialStyle =
    typeof requestedStyle === 'string' && requestedStyle in layoutLabels
      ? (requestedStyle as PreviewSettings['style'])
      : undefined;
  if (params.new === '1') {
    const query = new URLSearchParams({
      new: crypto.randomUUID(),
      ...(initialStyle ? { style: initialStyle } : {}),
    });
    redirect(`/editor?${query}`);
  }
  let initialDraft: ResumeDraft | undefined;
  let initialPresentation: ResumePresentation | undefined;
  let savedUpdatedAt: string | undefined;

  if (resumeId !== undefined) {
    if (!session?.user) redirect('/signin');
    if (!z.uuid().safeParse(resumeId).success) notFound();
    try {
      const { title, content, presentation, updatedAt } = await getSavedResume(resumeId);
      savedUpdatedAt = updatedAt;
      initialDraft = { title, content };
      initialPresentation = presentationSchema.catch(createDefaultPresentation()).parse(presentation);
    } catch (error) {
      if (error instanceof ResumeApiError && error.status === 404) notFound();
      if (error instanceof ResumeApiError && error.status === 401) redirect('/signin');
      return (
        <div
          role="alert"
          className="mx-auto max-w-2xl px-5 py-12 text-sm text-danger-foreground"
        >
          Could not open this resume.{' '}
          <Link className="underline" href="/dashboard">
            Back to dashboard
          </Link>
          .
        </div>
      );
    }
  }

  const workspace = resumeId ?? importId ?? newId.data ?? 'default';

  const editor = (
    <ResumeEditor
      key={`${session?.user?.id ?? 'guest'}:${workspace}`}
      initialStyle={initialStyle}
      initialImportId={resumeId ? undefined : importId}
      initialDraft={initialDraft}
      initialPresentation={initialPresentation}
      savedUpdatedAt={savedUpdatedAt}
      resumeId={resumeId}
      aiResultScope={resumeId ?? `${session?.user?.id ?? 'guest'}.${workspace}`}
      canSaveToAccount={Boolean(session?.user)}
      draftScope={`${session?.user?.id ?? 'guest'}.${workspace}`}
      fallbackDraftScope={
        session?.user && !resumeId
          ? `guest.${workspace}`
          : undefined
      }
    />
  );
  return session?.user ? editor : (
    <GuestDraftGate key={workspace} workspace={workspace} initialStyle={initialStyle}>{editor}</GuestDraftGate>
  );
}

export default function EditorPage({ searchParams }: PageProps<'/editor'>) {
  return (
    <div className="h-[calc(100dvh-var(--header-height))] min-h-0 overflow-hidden bg-canvas text-foreground print:h-auto print:overflow-visible print:bg-white">
      <Suspense
        fallback={
          <div className="p-8 text-sm text-foreground-muted">Opening editor…</div>
        }
      >
        <EditorWithTemplate searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
