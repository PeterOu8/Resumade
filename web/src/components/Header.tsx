import Link from 'next/link';
import { Suspense } from 'react';

import { auth, signOut } from '@/auth';
import { ResumadeLogo } from '@/components/resumade-logo';

const accountButtonClass =
  'inline-flex h-9 items-center justify-center rounded-lg border border-[#d7deea] bg-white px-3 text-xs font-semibold text-[#273348] transition-colors hover:bg-[#eef2fa] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#95a9f0] sm:h-10 sm:px-4 sm:text-sm';

async function AccountNavigation() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
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
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#3558c8] px-3 text-xs font-semibold text-white shadow-[0_6px_18px_#3558c82a] transition-colors hover:bg-[#2847a9] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#95a9f0] sm:h-10 sm:px-4 sm:text-sm"
      >
        {signedIn ? 'Dashboard' : 'Start building'}
      </Link>
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e8ef] bg-[#faf9f6]/95 backdrop-blur-md print:hidden">
      <nav className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7">
        <ResumadeLogo />
        <Suspense>
          <AccountNavigation />
        </Suspense>
      </nav>
    </header>
  );
}
