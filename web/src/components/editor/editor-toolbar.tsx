'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileUp, History, Redo2, Save, Sparkles, Trash2, Undo2 } from 'lucide-react';

import { AiSettingsButton } from '@/components/ai/ai-settings-button';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

import { editorOutlineButtonClass } from './editor-styles';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  onTailor: () => void;
  hasAiResult: boolean;
  onAiResults: () => void;
  canSaveToAccount: boolean;
  saving: boolean;
  onSave: () => void;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
};

export function EditorToolbar({
  canUndo, canRedo, onUndo, onRedo, onImport, onTailor, hasAiResult, onAiResults,
  canSaveToAccount, saving, onSave, canDelete, deleting, onDelete,
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
          disabled={saving || deleting}
          onClick={onTailor}
          className="h-9 rounded-control bg-primary px-3 text-primary-foreground shadow-[0_5px_14px_#3558c82d] hover:bg-primary-hover"
        >
          <Sparkles aria-hidden="true" /> Tailor with AI
        </Button>
        {hasAiResult && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || deleting}
            onClick={onAiResults}
            className={editorOutlineButtonClass}
          >
            <History aria-hidden="true" /> AI Results
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving || deleting}
          onClick={onImport}
          className={editorOutlineButtonClass}
        >
          <FileUp aria-hidden="true" /> Import
        </Button>
        <AiSettingsButton disabled={saving || deleting} className={editorOutlineButtonClass} />
        <IconButton
          size="md"
          aria-label="Undo"
          disabled={!canUndo || saving || deleting}
          onClick={onUndo}
          className={cn(editorOutlineButtonClass, 'w-9 px-0')}
        >
          <Undo2 aria-hidden="true" />
        </IconButton>
        <IconButton
          size="md"
          aria-label="Redo"
          disabled={!canRedo || saving || deleting}
          onClick={onRedo}
          className={cn(editorOutlineButtonClass, 'w-9 px-0')}
        >
          <Redo2 aria-hidden="true" />
        </IconButton>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canSaveToAccount || saving || deleting}
          title={canSaveToAccount ? undefined : 'Sign in to save to your account'}
          onClick={onSave}
          className={editorOutlineButtonClass}
        >
          <Save aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
        </Button>
        {canDelete && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={saving || deleting}
            onClick={onDelete}
            className="h-9 rounded-control px-3"
          >
            <Trash2 aria-hidden="true" /> {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        )}
      </div>
    </div>
  );
}
