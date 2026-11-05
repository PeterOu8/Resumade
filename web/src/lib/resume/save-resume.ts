'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { ResumeApiError, writeSavedResume } from './resume-api';
import { saveResumeRequestSchema } from './resume.schema';

export async function saveResume(draft: unknown, id?: string) {
  const input = saveResumeRequestSchema.safeParse(draft);
  if (!input.success) {
    return { error: input.error.issues[0]?.message ?? 'Check the resume details and try again.' };
  }
  if (id !== undefined && !z.uuid().safeParse(id).success) {
    return { error: 'The saved resume could not be found.' };
  }

  let saved;
  try {
    saved = await writeSavedResume(input.data, id);
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
