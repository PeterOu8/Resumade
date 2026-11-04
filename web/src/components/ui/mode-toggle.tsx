'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <IconButton
      size="md"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      role="switch"
      aria-label="Dark mode"
      aria-checked={dark}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'relative size-9 rounded-control border-border-strong bg-surface text-foreground-strong hover:bg-surface-hover hover:text-foreground-strong dark:bg-surface dark:hover:bg-surface-hover sm:size-10',
        className,
      )}
    >
      <Sun
        className="size-4.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute size-4.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </IconButton>
  );
}
