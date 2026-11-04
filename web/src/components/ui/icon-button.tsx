import type { ComponentProps, ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> &
  Pick<VariantProps<typeof buttonVariants>, 'variant'> & {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
};

const sizes = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-10',
} as const;

export function IconButton({ className, size = 'md', variant = 'outline', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      data-slot="icon-button"
      className={cn(buttonVariants({ variant, size: 'icon' }), sizes[size], className)}
      {...props}
    />
  );
}

