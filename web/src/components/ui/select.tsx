import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(
        'h-10 min-w-0 rounded-control border border-border-strong bg-surface px-3 text-sm font-normal text-foreground-strong shadow-control outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

