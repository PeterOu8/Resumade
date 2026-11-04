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
  'h-11 rounded-lg border-[#d7deea] bg-[#fbfcfe] px-3 text-[#273348] placeholder:text-[#9aa4b1] focus-visible:border-[#3558c8] focus-visible:ring-[#3558c8]/15';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('min-w-0', className)} {...props}>
      <Card className="gap-0 rounded-2xl border border-[#dce2ec] bg-white py-0 text-[#1e2636] shadow-[0_20px_55px_#27356012] ring-0">
        <CardHeader className="gap-0 px-6 pt-7 pb-0 sm:px-8 sm:pt-9">
          <span className="text-[11px] font-bold tracking-[0.15em] text-[#3558c8] uppercase">
            START WITH RESUMADE
          </span>
          <h1 className="mt-3 text-[clamp(34px,4vw,44px)] leading-[1.05] font-[650] tracking-[-0.05em]">
            Create your{' '}
            <em className="font-['EB_Garamond',Georgia,serif] font-normal text-[#3558c8]">
              account.
            </em>
          </h1>
          <CardDescription className="mt-3 text-sm leading-6 text-[#687282]">
            Set up an account to keep your resumes together.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-7 pb-7 sm:px-8 sm:pb-9">
          <form>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="name" className="text-xs font-semibold text-[#566173]">
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
                <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#566173]">
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
                    <FieldLabel htmlFor="password" className="text-xs font-semibold text-[#566173]">
                      Password
                    </FieldLabel>
                    <Input id="password" type="password" required className={inputClassName} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password" className="text-xs font-semibold text-[#566173]">
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
                <FieldDescription className="text-xs text-[#8b96a9]">
                  Must be at least 6 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-lg bg-[#3558c8] text-sm font-semibold text-white shadow-[0_8px_22px_#3558c82d] hover:bg-[#2847a9] focus-visible:border-[#3558c8] focus-visible:ring-[#3558c8]/20"
                >
                  Create account
                </Button>
                <FieldDescription className="mt-1 text-center text-sm text-[#687282] [&>a]:font-semibold [&>a]:text-[#3558c8]">
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
