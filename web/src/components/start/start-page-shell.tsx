import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type StartPageShellProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
};

export function StartPageShell({
  eyebrow,
  title,
  description,
  children,
}: StartPageShellProps) {
  return (
    <main className="min-h-[calc(100dvh-72px)] bg-canvas px-5 py-10 text-foreground sm:px-7 sm:py-16">
      <div className="mx-auto max-w-[1120px]">
        <Link
          href="/start"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-foreground-muted hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back
        </Link>
        <div className="mt-12 max-w-[680px] sm:mt-16">
          <span className="text-[11px] font-bold tracking-[0.15em] text-primary uppercase">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-[clamp(40px,5vw,64px)] leading-[1.05] font-[650] tracking-[-0.055em]">
            {title}
          </h1>
          <p className="mt-5 max-w-[580px] text-base leading-[1.7] text-foreground-muted">
            {description}
          </p>
        </div>
        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </main>
  );
}
