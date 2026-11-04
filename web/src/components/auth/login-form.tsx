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
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

const inputClassName =
  'h-11 rounded-lg border-[#d7deea] bg-[#fbfcfe] px-3 text-[#273348] placeholder:text-[#9aa4b1] focus-visible:border-[#3558c8] focus-visible:ring-[#3558c8]/15';

async function signInWithGoogle() {
  'use server';

  await signIn('google', { redirectTo: '/dashboard' });
}

async function signInWithPassword(formData: FormData) {
  'use server';

  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;

    if (error.type === 'CredentialsSignin') {
      redirect('/signin?error=invalid_credentials');
    }

    redirect('/signin?error=login_unavailable');
  }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('min-w-0', className)} {...props}>
      <Card className="gap-0 rounded-2xl border border-[#dce2ec] bg-white py-0 text-[#1e2636] shadow-[0_20px_55px_#27356012] ring-0">
        <CardHeader className="gap-0 px-6 pt-7 pb-0 sm:px-8 sm:pt-9">
          <span className="text-[11px] font-bold tracking-[0.15em] text-[#3558c8] uppercase">
            WELCOME TO RESUMADE
          </span>
          <h1 className="mt-3 text-[clamp(34px,4vw,44px)] leading-[1.05] font-[650] tracking-[-0.05em]">
            Welcome{' '}
            <em className="font-['EB_Garamond',Georgia,serif] font-normal text-[#3558c8]">
              back.
            </em>
          </h1>
          <CardDescription className="mt-3 text-sm leading-6 text-[#687282]">
            Sign in to pick up where you left off.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-7 pb-7 sm:px-8 sm:pb-9">
          <FieldGroup className="gap-5">
            <form action={signInWithGoogle}>
              <Field>
                <Button
                  variant="outline"
                  type="submit"
                  className="h-11 w-full rounded-lg border-[#d7deea] bg-white text-sm font-semibold text-[#273348] hover:bg-[#eef2fa] focus-visible:border-[#3558c8] focus-visible:ring-[#3558c8]/15"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </Field>
            </form>
            <FieldSeparator className="my-1 [&_[data-slot=field-separator-content]]:bg-white [&_[data-slot=field-separator-content]]:text-[#8b96a9]">
              Or continue with
            </FieldSeparator>
            <form action={signInWithPassword}>
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel
                    htmlFor="email"
                    className="text-xs font-semibold text-[#566173]"
                  >
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className={inputClassName}
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel
                      htmlFor="password"
                      className="text-xs font-semibold text-[#566173]"
                    >
                      Password
                    </FieldLabel>
                    <a
                      href="#"
                      className="ml-auto text-xs font-medium text-[#687282] underline-offset-4 hover:text-[#3558c8] hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className={inputClassName}
                  />
                </Field>
                <Field>
                  <Button
                    type="submit"
                    className="mt-2 h-11 w-full rounded-lg bg-[#3558c8] text-sm font-semibold text-white shadow-[0_8px_22px_#3558c82d] hover:bg-[#2847a9] focus-visible:border-[#3558c8] focus-visible:ring-[#3558c8]/20"
                  >
                    Sign in
                  </Button>
                  <FieldDescription className="mt-1 text-center text-sm text-[#687282] [&>a]:font-semibold [&>a]:text-[#3558c8]">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup">Sign up</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
