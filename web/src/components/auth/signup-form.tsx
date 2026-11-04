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
          <form>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="name" className="text-xs font-semibold text-foreground-label">
                  Full name
                </FieldLabel>
                <Input
                  id="name"
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
                  id="email"
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
                    <Input id="password" type="password" required className={inputClassName} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password" className="text-xs font-semibold text-foreground-label">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      className={inputClassName}
                    />
                  </Field>
                </Field>
                <FieldDescription className="text-xs text-foreground-subtle">
                  Must be at least 6 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-accent hover:bg-primary-hover focus-visible:border-primary focus-visible:ring-primary/20"
                >
                  Create account
                </Button>
                <FieldDescription className="mt-1 text-center text-sm text-foreground-muted [&>a]:font-semibold [&>a]:text-primary">
                  Already have an account? <Link href="/signin">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
