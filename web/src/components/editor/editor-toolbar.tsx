'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileUp, Redo2, Save, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { editorOutlineButtonClass } from './editor-styles';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  canSaveToAccount: boolean;
  saving: boolean;
  onSave: () => void;
};

export function EditorToolbar({
  canUndo, canRedo, onUndo, onRedo, onImport, canSaveToAccount, saving, onSave,
}: Props) {
  const router = useRouter();

  function goBack() {
    const navigation = (window as Window & { navigation?: { canGoBack: boolean } }).navigation;
    const canGoBack = navigation?.canGoBack ?? window.history.length > 1;

    if (canGoBack) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <div className="resume-editor-toolbar flex flex-wrap items-center justify-between gap-3">
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={goBack}
          className={editorOutlineButtonClass}
        >
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={onImport}
          className={editorOutlineButtonClass}
        >
          <FileUp aria-hidden="true" /> Import
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Undo"
          disabled={!canUndo || saving}
          onClick={onUndo}
          className={cn(editorOutlineButtonClass, 'w-9 px-0')}
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Redo"
          disabled={!canRedo || saving}
          onClick={onRedo}
          className={cn(editorOutlineButtonClass, 'w-9 px-0')}
        >
          <Redo2 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canSaveToAccount || saving}
          title={canSaveToAccount ? undefined : 'Sign in to save to your account'}
          onClick={onSave}
          className={editorOutlineButtonClass}
        >
          <Save aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
