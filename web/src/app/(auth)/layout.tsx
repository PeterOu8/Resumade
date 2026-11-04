import type { ReactNode } from 'react';

import { StartVisual } from '@/components/start/start-visual';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100dvh-72px)] bg-canvas px-5 py-8 text-foreground sm:px-7 sm:py-12">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-[clamp(48px,6vw,100px)]">
        <div className="hidden lg:block">
          <StartVisual />
        </div>
        <div className="flex min-w-0 justify-center lg:py-8">{children}</div>
      </div>
    </main>
  );
}
