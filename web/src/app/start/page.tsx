import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { StartChoices } from '@/components/start/start-choices';
import { StartVisual } from '@/components/start/start-visual';

async function StartContent() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-canvas px-5 py-8 text-foreground sm:px-7 sm:py-12">
      <div className="mx-auto grid max-w-[1280px] items-stretch gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-[clamp(48px,6vw,100px)]">
        <StartVisual />
        <section className="order-1 flex flex-col justify-center lg:order-2" aria-labelledby="start-heading">
          <span className="text-[11px] font-bold tracking-[0.15em] text-primary uppercase">
            START BUILDING
          </span>
          <h1
            id="start-heading"
            className="mt-5 text-[clamp(42px,4.8vw,68px)] leading-[1.05] font-[650] tracking-[-0.055em]"
          >
            How would you
            <br />
            like to <em className="font-['EB_Garamond',Georgia,serif] font-normal text-primary">begin?</em>
          </h1>
          <p className="mt-5 max-w-[470px] text-base leading-[1.7] text-foreground-muted">
            Choose the path that fits where you are. You can shape the details in the editor.
          </p>
          <div className="mt-9">
            <StartChoices />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StartPage() {
  return <Suspense><StartContent /></Suspense>;
}
