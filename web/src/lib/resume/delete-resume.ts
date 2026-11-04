'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { deleteSavedResume, ResumeApiError } from './resume-api';

export async function deleteResume(id: string) {
  if (!z.uuid().safeParse(id).success) {
    return { error: 'The saved resume could not be found.' };
  }

  try {
    await deleteSavedResume(id);
  } catch (error) {
    if (error instanceof ResumeApiError && error.status === 401) {
      return { error: 'Sign in again to delete this resume.' };
    }
    if (error instanceof ResumeApiError && error.status === 404) {
      return { error: 'The saved resume could not be found.' };
    }
    return { error: 'Could not delete this resume. Try again in a moment.' };
  }

  revalidatePath('/dashboard');
  return { success: true } as const;
}

