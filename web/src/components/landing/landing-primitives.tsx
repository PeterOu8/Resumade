import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const primaryActionClasses = cn(
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-[9px] px-5 text-sm font-semibold text-primary-foreground',
  'bg-primary shadow-accent hover:bg-primary-hover',
  'transition-[background,transform] duration-200 hover:-translate-y-px motion-reduce:transition-none',
  'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus',
);

export function PrimaryAction({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Link href="/start" className={cn(primaryActionClasses, className)}>
      {children}
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
}

export function SectionKicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] text-primary uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
