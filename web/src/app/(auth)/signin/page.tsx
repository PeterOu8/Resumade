import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';

async function SignInNotice({ searchParams }: Pick<PageProps<'/signin'>, 'searchParams'>) {
  const { error, status } = await searchParams;
  if (status === 'password_reset') {
    return <p role="status" className="text-sm text-foreground-muted">Password updated. Sign in with your new password.</p>;
  }

  const message = error === 'invalid_credentials'
    ? 'Sign-in failed. Check your credentials and verify your email if you haven’t already.'
    : error === 'login_unavailable'
      ? 'Sign-in is temporarily unavailable. Try again shortly.'
      : null;

  return message && <p role="alert" className="text-sm text-danger-foreground">{message}</p>;
}

export default function LoginPage({ searchParams }: PageProps<'/signin'>) {
  const returnTo = searchParams.then(({ returnTo }) =>
    typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : '/dashboard',
  );
  return (
    <Suspense>
      <LoginFormWithReturn searchParams={searchParams} returnTo={returnTo} />
    </Suspense>
  );
}

async function LoginFormWithReturn({
  searchParams,
  returnTo,
}: {
  searchParams: PageProps<'/signin'>['searchParams'];
  returnTo: Promise<string>;
}) {
  return (
    <LoginForm
      className="w-full max-w-[480px]"
      returnTo={await returnTo}
      notice={<Suspense><SignInNotice searchParams={searchParams} /></Suspense>}
    />
  );
}
