import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const primaryActionClasses = cn(
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-[9px] px-5 text-sm font-semibold text-white',
  'bg-[#3558c8] shadow-[0_8px_22px_#3558c82d] hover:bg-[#2847a9]',
  'transition-[background,transform] duration-200 hover:-translate-y-px motion-reduce:transition-none',
  'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#95a9f0]',
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
        'inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] text-[#3558c8] uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
