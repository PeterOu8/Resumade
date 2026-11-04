import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';

import { auth } from '@/auth';
import { ResumeEditor } from '@/components/editor/resume-editor';
import {
  layoutLabels,
  type PreviewSettings,
} from '@/components/editor/preview/constants';
import { getSavedResume, ResumeApiError } from '@/lib/resume/resume-api';
import type { ResumeDraft } from '@/lib/resume/resume.schema';

async function EditorWithTemplate({
  searchParams,
}: {
  searchParams: PageProps<'/editor'>['searchParams'];
}) {
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
  let initialDraft: ResumeDraft | undefined;

  if (resumeId !== undefined) {
    if (!session?.user) redirect('/signin');
    if (!z.uuid().safeParse(resumeId).success) notFound();
    try {
      const { title, content } = await getSavedResume(resumeId);
      initialDraft = { title, content };
    } catch (error) {
      if (error instanceof ResumeApiError && error.status === 404) notFound();
      const expired = error instanceof ResumeApiError && error.status === 401;
      return (
        <div
          role="alert"
          className="mx-auto max-w-2xl px-5 py-12 text-sm text-danger-foreground"
        >
          {expired ? (
            <>
              Your account session has expired.{' '}
              <Link className="underline" href="/signin">
                Sign in again
              </Link>
              .
            </>
          ) : (
            <>
              Could not open this resume.{' '}
              <Link className="underline" href="/dashboard">
                Back to dashboard
              </Link>
              .
            </>
          )}
        </div>
      );
    }
  }

  const workspace = resumeId ?? importId ?? newId.data ?? 'default';

  return (
    <ResumeEditor
      key={`${session?.user?.id ?? 'guest'}:${workspace}`}
      initialStyle={initialStyle}
      initialImportId={resumeId ? undefined : importId}
      initialDraft={initialDraft}
      resumeId={resumeId}
      aiResultScope={resumeId ?? `${session?.user?.id ?? 'guest'}.${workspace}`}
      canSaveToAccount={Boolean(session?.user)}
      draftScope={
        workspace !== 'default'
          ? `${session?.user?.id ?? 'guest'}.${workspace}`
          : undefined
      }
    />
  );
}

export default function EditorPage({ searchParams }: PageProps<'/editor'>) {
  return (
    <div className="min-h-[calc(100dvh-72px)] bg-canvas text-foreground print:min-h-0 print:bg-white">
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
