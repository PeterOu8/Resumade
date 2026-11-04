import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

const dialogShellVariants = cva(
  'fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded-panel border border-border bg-surface p-0 text-foreground shadow-modal backdrop:bg-backdrop backdrop:backdrop-blur-[3px]',
  {
    variants: {
      size: {
        md: 'max-w-[620px]',
        lg: 'max-w-[820px]',
      },
      overflow: {
        hidden: 'overflow-hidden',
        auto: 'scroll-area overflow-y-auto',
      },
    },
    defaultVariants: {
      size: 'md',
      overflow: 'hidden',
    },
  },
);

type DialogShellProps = ComponentPropsWithoutRef<'dialog'> &
  VariantProps<typeof dialogShellVariants>;

export const DialogShell = forwardRef<HTMLDialogElement, DialogShellProps>(
  function DialogShell({ className, size, overflow, ...props }, ref) {
    return (
      <dialog
        ref={ref}
        className={cn(dialogShellVariants({ size, overflow }), className)}
        {...props}
      />
    );
  },
);

export function DialogCloseButton(props: Omit<ComponentPropsWithoutRef<typeof IconButton>, 'size'>) {
  return (
    <IconButton
      size="md"
      className="shrink-0 text-foreground-muted hover:bg-surface-hover hover:text-foreground-strong"
      {...props}
    />
  );
}

