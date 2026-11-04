import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function Panel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel"
      className={cn('rounded-card bg-surface shadow-panel', className)}
      {...props}
    />
  );
}

