'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { ResumeApiError, writeSavedResume } from './resume-api';
import { resumeDocumentSchema } from '@/features/resume-document/document.schema';
import { saveResumeRequestSchema } from './resume.schema';

export async function saveResume(document: unknown, id?: string) {
  const documentInput = resumeDocumentSchema.safeParse(document);
  if (!documentInput.success) {
    return { error: documentInput.error.issues[0]?.message ?? 'Check the resume details and try again.' };
  }
  const draftInput = saveResumeRequestSchema.safeParse(documentInput.data.draft);
  if (!draftInput.success) {
    return { error: draftInput.error.issues[0]?.message ?? 'Check the resume details and try again.' };
  }
  if (id !== undefined && !z.uuid().safeParse(id).success) {
    return { error: 'The saved resume could not be found.' };
  }

  let saved;
  try {
    saved = await writeSavedResume({
      ...draftInput.data,
      presentation: documentInput.data.presentation,
    }, id);
  } catch (error) {
    if (error instanceof ResumeApiError && error.status === 401) {
      redirect('/signin');
    }
    if (error instanceof ResumeApiError && error.status === 404) {
      return { error: 'The saved resume could not be found.' };
    }
    if (id === undefined && error instanceof ResumeApiError && error.status === 409) {
      return { error: 'You can save up to 16 resumes. Delete a saved resume to make room, or download this draft.' };
    }
    return { error: 'Could not save your resume. Try again in a moment.' };
  }

  revalidatePath('/dashboard');
  return { id: saved.id };
}
