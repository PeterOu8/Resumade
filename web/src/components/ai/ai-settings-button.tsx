'use client';

import { Settings2 } from 'lucide-react';

import { useAiSettings } from '@/lib/ai/ai-settings';

export function AiSettingsButton({ className }: { className: string }) {
  const { openSettings } = useAiSettings();
  return (
    <button type="button" onClick={openSettings} className={`${className} gap-2`}>
      <Settings2 size={16} aria-hidden="true" />
      <span className="hidden sm:inline">AI settings</span>
      <span className="sm:hidden">AI</span>
    </button>
  );
}
