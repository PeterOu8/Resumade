'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { submitAccountAction, type AccountAction } from '@/lib/auth/account-actions';

const copy = {
  'verify-email': {
    title: 'Verify your email',
    description: 'Confirm your email address to finish setting up your account.',
    button: 'Verify email',
    success: 'Your email is verified. You can now sign in.',
  },
  'forgot-password': {
    title: 'Forgot your password?',
    description: 'Enter your email address to request a password reset link.',
    button: 'Send reset link',
    success: 'If the address is eligible, a password reset link will be sent.',
  },
  'reset-password': {
    title: 'Reset your password',
    description: 'Choose a new password with at least 8 characters.',
    button: 'Reset password',
    success: '',
  },
};

const inputClassName = 'h-11 rounded-lg border-border-strong bg-surface px-3 text-foreground-strong';

export function AccountRecoveryForm({ mode }: { mode: Exclude<AccountAction, 'register'> }) {
  const [state, submit, pending] = useActionState(submitAccountAction.bind(null, mode), {});
  const { title, description, button, success } = copy[mode];
  const verify = mode === 'verify-email';
  const reset = mode === 'reset-password';

  return (
    <Card className="w-full max-w-[480px] gap-0 rounded-2xl border border-border bg-card py-0 text-foreground shadow-panel ring-0">
      <CardHeader className="gap-0 px-6 pt-7 sm:px-8 sm:pt-9">
        <span className="text-[11px] font-bold tracking-[0.15em] text-primary uppercase">RESUMADE</span>
        <h1 className="mt-3 text-[clamp(34px,4vw,44px)] leading-[1.05] font-[650] tracking-[-0.05em]">{title}</h1>
        <CardDescription className="mt-3 text-sm leading-6 text-foreground-muted">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-7 sm:px-8 sm:pb-9">
        {state.success ? (
          <p role="status" className="text-sm text-foreground-muted">{success}</p>
        ) : (
          <form action={(form) => {
            if (verify || reset) {
              const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
              form.set('token', token ?? '');
            }
            submit(form);
          }}>
            <FieldGroup className="gap-5">
              {!verify && !reset && (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required className={inputClassName} />
                </Field>
              )}
              {reset && (
                <>
                  <Field>
                    <FieldLabel htmlFor="password">New password</FieldLabel>
                    <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClassName} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                    <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClassName} />
                  </Field>
                </>
              )}
              {state.error && <p role="alert" className="text-sm text-danger-foreground">{state.error}</p>}
              <Button type="submit" disabled={pending} className="h-11 w-full rounded-lg shadow-accent">
                {pending ? 'Please wait…' : button}
              </Button>
            </FieldGroup>
          </form>
        )}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-primary">
          <Link href="/signin">Sign in</Link>
          {reset && <Link href="/forgot-password">Request a new link</Link>}
        </div>
      </CardContent>
    </Card>
  );
}
