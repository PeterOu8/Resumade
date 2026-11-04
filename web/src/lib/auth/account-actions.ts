'use server';

import { redirect } from 'next/navigation';

import { accountEmailSchema, resetPasswordSchema, signupSchema, tokenSchema } from './auth.schema';

export type AccountAction = 'register' | 'verify-email' | 'forgot-password' | 'reset-password';
export type AccountFormState = { error?: string; success?: boolean };

export async function submitAccountAction(
  action: AccountAction,
  _previous: AccountFormState,
  form: FormData,
): Promise<AccountFormState> {
  const input = Object.fromEntries(form);
  const schema = {
    register: signupSchema,
    'verify-email': tokenSchema,
    'forgot-password': accountEmailSchema,
    'reset-password': resetPasswordSchema,
  }[action];
  if (!schema) return { error: 'This request is invalid.' };

  const result = schema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  const apiUrl = process.env.API_URL;
  const unavailable = { error: 'This request could not be completed. Please try again.' };
  if (!apiUrl) return unavailable;

  let response: Response;
  try {
    response = await fetch(new URL(`/api/auth/${action}`, apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return unavailable;
  }

  if (response.status === 429) {
    const seconds = Number(response.headers.get('Retry-After'));
    return { error: seconds > 0
      ? `Too many requests. Try again in ${seconds} seconds.`
      : 'Too many requests. Please try again shortly.' };
  }
  if (action === 'register' && response.status === 409)
    return { error: 'This email is already registered. Check your inbox for a verification email or sign in.' };
  if (response.status === 400 && (action === 'verify-email' || action === 'reset-password'))
    return { error: 'This link is invalid or has expired.' };
  if (!response.ok) return unavailable;

  if (action === 'reset-password') redirect('/signin?status=password_reset');
  return { success: true };
}
