'use client';

import type { ComponentProps } from 'react';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAiSettings } from '@/lib/ai/ai-settings';

export function AiSettingsButton({ className, ...props }: Omit<ComponentProps<typeof Button>, 'children' | 'onClick'>) {
  const { openSettings } = useAiSettings();
  return (
    <Button type="button" variant="outline" size="sm" onClick={openSettings} className={className} {...props}>
      <Settings2 size={16} aria-hidden="true" />
      AI settings
    </Button>
  );
}
