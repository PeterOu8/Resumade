import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'size'> & {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-10',
} as const;

export function IconButton({ className, size = 'md', ...props }: IconButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(sizes[size], className)}
      {...props}
    />
  );
}

