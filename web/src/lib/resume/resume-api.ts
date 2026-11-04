import 'server-only';

import { headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

import { savedResumeSchema, type ResumeDraft } from './resume.schema';

export class ResumeApiError extends Error {
  constructor(public status: number) {
    super(`Resume API returned HTTP ${status}`);
  }
}

async function requestResumes(path = '', options?: RequestInit) {
  const apiUrl = process.env.API_URL;
  const secret = process.env.AUTH_SECRET;
  if (!apiUrl || !secret) throw new Error('Resume API is not configured');

  const cookie = (await headers()).get('cookie') ?? '';
  const token = await getToken({
    req: { headers: new Headers({ cookie }) },
    secret,
    secureCookie: /(?:^|;\s*)__Secure-authjs\.session-token(?:\.\d+)?=/.test(cookie),
  });
  if (!token?.apiToken || !token.apiUserId) throw new ResumeApiError(401);

  const response = await fetch(new URL(`/api/resumes${path}`, apiUrl), {
    ...options,
    headers: {
      Authorization: `Bearer ${token.apiToken}`,
      ...(options?.body && { 'Content-Type': 'application/json' }),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new ResumeApiError(response.status);

  return response.json() as Promise<unknown>;
}

export async function listSavedResumes() {
  return z.array(savedResumeSchema).parse(await requestResumes());
}

export async function getSavedResume(id: string) {
  return savedResumeSchema.parse(await requestResumes(`/${id}`));
}

export async function writeSavedResume(draft: ResumeDraft, id?: string) {
  const result = await requestResumes(id ? `/${id}` : '', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(draft),
  });
  return savedResumeSchema.parse(result);
}
