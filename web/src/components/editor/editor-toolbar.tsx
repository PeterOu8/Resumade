'use client';

import Link from 'next/link';
import { ArrowLeft, FileUp, Redo2, Save, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function EditorToolbar({ canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="resume-editor-toolbar flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div>
        <Button
          nativeButton={false}
          size="sm"
          variant="ghost"
          render={<Link href="/" />}
        >
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled
          title="Import is coming soon"
        >
          <FileUp aria-hidden="true" /> Import
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled
          title="Account save is coming soon"
        >
          <Save aria-hidden="true" /> Save
        </Button>
      </div>
    </div>
  );
}
