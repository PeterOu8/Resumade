import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { auth, signOut } from '@/auth';
import { ResumadeLogo } from '@/components/resumade-logo';
import { ModeToggle } from './ui/mode-toggle';

const accountButtonClass =
  'inline-flex h-9 items-center justify-center whitespace-nowrap rounded-control border border-border-strong bg-surface px-3 text-xs font-semibold text-foreground-strong transition-colors hover:bg-surface-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus sm:h-10 sm:px-4 sm:text-sm';

async function AccountNavigation() {
  await connection();
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <ModeToggle />
      {signedIn ? (
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button type="submit" className={accountButtonClass}>
            Sign out
          </button>
        </form>
      ) : (
        <Link href="/signin" className={accountButtonClass}>
          Sign in
        </Link>
      )}
      <Link
        href={signedIn ? '/dashboard' : '/start'}
        className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-control bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-accent transition-colors hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus sm:h-10 sm:px-4 sm:text-sm"
      >
        {signedIn ? 'Dashboard' : 'Start building'}
      </Link>
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-header-border bg-header shadow-header backdrop-blur-md print:hidden">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-header max-w-[1500px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-7"
      >
        <ResumadeLogo />
        <Suspense>
          <AccountNavigation />
        </Suspense>
      </nav>
    </header>
  );
}
