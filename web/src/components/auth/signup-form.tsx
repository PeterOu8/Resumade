'use client';

import { useActionState } from 'react';
import { submitAccountAction } from '@/lib/auth/account-actions';
import { cn } from 'cn';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const inputClassName =
  'h-11 rounded-lg border-border-strong bg-surface px-3 text-foreground-strong placeholder:text-foreground-faint focus-visible:border-primary focus-visible:ring-primary/15';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [state, action, pending] = useActionState(submitAccountAction.bind(null, 'register'), {});

  if (state.success) {
    return (
      <div className={cn('min-w-0', className)} {...props}>
        <Card className="rounded-2xl border border-border bg-card text-foreground shadow-panel ring-0">
          <CardHeader>
            <h1 className="text-3xl font-semibold">Check your email</h1>
            <CardDescription role="status">
              Open the verification email and click the link to verify your account.
              Check your spam folder if it doesn’t appear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/signin" className="text-sm font-semibold text-primary hover:text-primary-hover">
              Continue to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('min-w-0', className)} {...props}>
      <Card className="gap-0 rounded-2xl border border-border bg-card py-0 text-foreground shadow-panel ring-0">
        <CardHeader className="gap-0 px-6 pt-7 pb-0 sm:px-8 sm:pt-9">
          <span className="text-[11px] font-bold tracking-[0.15em] text-primary uppercase">
            START WITH RESUMADE
          </span>
          <h1 className="mt-3 text-[clamp(34px,4vw,44px)] leading-[1.05] font-[650] tracking-[-0.05em]">
            Create your{' '}
            <em className="font-['EB_Garamond',Georgia,serif] font-normal text-primary">
              account.
            </em>
          </h1>
          <CardDescription className="mt-3 text-sm leading-6 text-foreground-muted">
            Set up an account to keep your resumes together.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-7 pb-7 sm:px-8 sm:pb-9">
          <form action={action}>
            <FieldGroup className="gap-5">
              {state.error && <p role="alert" className="text-sm text-danger-foreground">{state.error}</p>}
              <Field>
                <FieldLabel htmlFor="name" className="text-xs font-semibold text-foreground-label">
                  Full name
                </FieldLabel>
                <Input
                  id="name" name="displayName" autoComplete="name" maxLength={100}
                  type="text"
                  placeholder="Your name"
                  required
                  className={inputClassName}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="text-xs font-semibold text-foreground-label">
                  Email
                </FieldLabel>
                <Input
                  id="email" name="email" autoComplete="email" maxLength={254}
                  type="email"
                  placeholder="m@example.com"
                  required
                  className={inputClassName}
                />
              </Field>
              <Field>
                <Field className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="password" className="text-xs font-semibold text-foreground-label">
                      Password
                    </FieldLabel>
                    <Input id="password" name="password" autoComplete="new-password" minLength={8} maxLength={128} type="password" required className={inputClassName} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password" className="text-xs font-semibold text-foreground-label">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password" name="confirmPassword" autoComplete="new-password" minLength={8} maxLength={128}
                      type="password"
                      required
                      className={inputClassName}
                    />
                  </Field>
                </Field>
                <FieldDescription className="text-xs text-foreground-subtle">
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={pending}
                  className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-accent hover:bg-primary-hover focus-visible:border-primary focus-visible:ring-primary/20"
                >
                  {pending ? 'Creating account…' : 'Create account'}
                </Button>
                <FieldDescription className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-center text-sm text-foreground-muted [&>a]:font-semibold [&>a]:text-primary [&>a]:no-underline">
                  Already have an account?
                  <Link href="/signin">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
