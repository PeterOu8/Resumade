'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileUp, History, LockKeyhole, Redo2, Save, Sparkles, Trash2, Undo2 } from 'lucide-react';

import { AiSettingsButton } from '@/components/ai/ai-settings-button';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

import { editorOutlineButtonClass } from './editor-styles';
import type { PdfDownloadState } from './use-pdf-download';
import type { ResumeEditingStatus } from './use-resume-editing-lock';

type Props = {
  lockStatus: ResumeEditingStatus;
  onEnableEditing: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  onTailor: () => void;
  hasAiResult: boolean;
  onAiResults: () => void;
  canSaveToAccount: boolean;
  documentTitle: string;
  saveStatus: 'saved' | 'unsaved' | 'error';
  saving: boolean;
  onSave: () => void;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  downloading: boolean;
  downloadState: PdfDownloadState;
  onDownload: () => void;
};

export function EditorToolbar({
  lockStatus, onEnableEditing,
  canUndo, canRedo, onUndo, onRedo, onImport, onTailor, hasAiResult, onAiResults,
  canSaveToAccount, documentTitle, saveStatus, saving, onSave, canDelete, deleting, onDelete,
  downloading, downloadState, onDownload,
}: Props) {
  const router = useRouter();
  const readOnly = lockStatus !== 'editing';

  function goBack() {
    const navigation = (window as Window & { navigation?: { canGoBack: boolean } }).navigation;
    const canGoBack = navigation?.canGoBack ?? window.history.length > 1;

    if (canGoBack) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  const statusLabel = readOnly ? 'Viewing only' : saving
    ? 'Saving...'
    : saveStatus === 'error'
      ? 'Save failed'
      : saveStatus === 'unsaved'
        ? 'Unsaved changes'
        : canDelete
          ? 'All changes saved'
          : 'Saved on this device';

  return (
    <div className="resume-editor-toolbar flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={goBack}
          className={editorOutlineButtonClass}
        >
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
        <div className="min-w-0">
          <p className="max-w-52 truncate text-sm font-semibold text-foreground-strong">{documentTitle}</p>
          <p role="status" className={`text-xs ${!readOnly && saveStatus === 'error' ? 'text-danger-foreground' : 'text-foreground-muted'}`}>
            {statusLabel}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {readOnly && (
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="flex items-center gap-2 text-xs text-foreground-muted">
              <LockKeyhole aria-hidden="true" className="size-4 shrink-0" />
              {lockStatus === 'checking' ? 'Checking editing access…'
                : lockStatus === 'busy' ? 'Editing in another tab'
                : lockStatus === 'unsupported' ? 'Editing unavailable in this browser'
                : 'Could not check editing access'}
            </p>
            {(lockStatus === 'busy' || lockStatus === 'error') && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onEnableEditing}
                className={editorOutlineButtonClass}
              >
                Enable editing
              </Button>
            )}
          </div>
        )}
        {!readOnly && <>
        <Button
          type="button"
          size="sm"
          disabled={saving || deleting || downloading}
          onClick={onTailor}
          variant="outline"
          className={editorOutlineButtonClass}
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
          disabled={saving || deleting || downloading}
          onClick={onSave}
          className={editorOutlineButtonClass}
        >
          <Save aria-hidden="true" /> {saving ? 'Saving...' : canSaveToAccount ? 'Save changes' : 'Save to account'}
        </Button>
        </>}
        <Button
          type="button"
          size="sm"
          disabled={saving || deleting || downloading}
          onClick={onDownload}
          className="h-9 rounded-control bg-primary px-3 text-primary-foreground shadow-accent hover:bg-primary-hover"
        >
          <Download aria-hidden="true" /> {downloading ? 'Preparing PDF...' : 'Download PDF'}
        </Button>
        {!readOnly && canDelete && (
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
      {downloadState.status === 'started' && (
        <p role="status" className="basis-full text-right text-xs text-success-foreground">
          Download started: {downloadState.fileName}
        </p>
      )}
      {downloadState.status === 'error' && (
        <p role="alert" className="basis-full text-right text-xs text-danger-foreground">
          {downloadState.message}{' '}
          <button type="button" className="font-semibold underline" onClick={onDownload}>Retry</button>
        </p>
      )}
    </div>
  );
}
