'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { AlertTriangle, ArrowLeft, Check, LoaderCircle, Settings2, Sparkles, WandSparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogCloseButton, DialogShell } from '@/components/ui/dialog-shell';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAiSettings } from '@/lib/ai/ai-settings';
import {
  applyResumeChangesSafely,
  buildResumeChanges,
  formatChangeValue,
  getResumeChangeValue,
  isResumeChangeApplicable,
} from '@/lib/ai/resume-diff';
import type { AiTailorResult } from '@/lib/ai/tailor-result';
import { resumeContentSchema, type ResumeContent } from '@/lib/resume/resume.schema';

type Props = {
  open: boolean;
  resume: ResumeContent;
  initialView: 'tailor' | 'results';
  result: AiTailorResult | null;
  onClose: () => void;
  onResult: (result: AiTailorResult) => void;
  onSelectionChange: (selectedChangeIds: string[]) => void;
  onApply: (
    content: ResumeContent,
    outcome: { applied: number; conflicts: number },
  ) => void;
};

function resizeTextarea(event: ChangeEvent<HTMLTextAreaElement>) {
  const textarea = event.currentTarget;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function AiTailorDialog({
  open,
  resume,
  initialView,
  result,
  onClose,
  onResult,
  onSelectionChange,
  onApply,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { connection, openSettings } = useAiSettings();
  const [jobDescription, setJobDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'tailor' | 'results'>('tailor');
  const changes = useMemo(
    () => result ? buildResumeChanges(result.source, result.generated) : [],
    [result],
  );
  const selected = useMemo(
    () => new Set(result?.selectedChangeIds ?? []),
    [result],
  );
  const conflicts = useMemo(
    () => new Set(changes
      .filter((change) => !isResumeChangeApplicable(resume, change))
      .map(({ id }) => id)),
    [changes, resume],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    setError('');
    setView(initialView);
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [initialView, open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) event.currentTarget.close();
  }

  async function tailor() {
    if (loading) return;
    if (connection.apiKey.length < 8) {
      setError('Add an API key in AI settings before tailoring your resume.');
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError('Paste at least 20 characters from the job description.');
      return;
    }

    setLoading(true);
    setError('');
    const source = structuredClone(resume);
    try {
      const response = await fetch('/api/resumes/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai: connection,
          resume: source,
          jobDescription,
          instructions: instructions || undefined,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Could not tailor this resume.';
        throw new Error(message);
      }

      const parsed = resumeContentSchema.safeParse(
        result && typeof result === 'object' && 'content' in result ? result.content : null,
      );
      if (!parsed.success) throw new Error('The AI response did not match the Resumade schema.');
      const suggestions = buildResumeChanges(source, parsed.data);
      onResult({
        version: 1,
        source,
        generated: parsed.data,
        selectedChangeIds: suggestions.map(({ id }) => id),
        createdAt: new Date().toISOString(),
      });
      setView('results');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not tailor this resume.');
    } finally {
      setLoading(false);
    }
  }

  function applySelected() {
    const accepted = changes.filter(({ id }) => selected.has(id));
    const outcome = applyResumeChangesSafely(resume, accepted);
    onApply(outcome.content, {
      applied: outcome.applied.length,
      conflicts: outcome.conflicts.length,
    });
    dialogRef.current?.close();
  }

  const reviewing = view === 'results' && Boolean(result);
  const applicableSelectedCount = changes.filter(
    ({ id }) => selected.has(id) && !conflicts.has(id),
  ).length;

  function updateSelection(next: Set<string>) {
    onSelectionChange([...next]);
  }

  return (
    <DialogShell
      ref={dialogRef}
      size="lg"
      aria-labelledby="ai-tailor-heading"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <ScrollArea className="max-h-[calc(100dvh-2rem)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-subtle bg-surface/95 px-6 py-5 backdrop-blur sm:px-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
            <Sparkles size={13} aria-hidden="true" /> AI tailoring
          </span>
          <h2 id="ai-tailor-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            {reviewing ? 'Review suggested changes' : 'Tailor for this job'}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {reviewing
              ? 'AI suggestions are preserved separately from your current editable draft.'
              : 'Paste the role details. Your current resume stays unchanged until you approve edits.'}
          </p>
        </div>
        <DialogCloseButton
          aria-label="Close AI tailoring"
          disabled={loading}
          onClick={() => dialogRef.current?.close()}
        >
          <X size={18} aria-hidden="true" />
        </DialogCloseButton>
      </div>

        {!reviewing ? (
        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-muted bg-surface-subtle px-4 py-3 text-xs text-foreground-muted">
            <span>
              Using <strong className="text-foreground-strong">{connection.provider}</strong>
              {' · '}{connection.model || 'provider default'}
            </span>
            <button type="button" onClick={openSettings} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
              <Settings2 size={14} aria-hidden="true" /> Change provider
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-foreground-strong">Job description</span>
            <span className="ml-2 text-xs text-foreground-subtle">Required</span>
            <Textarea
              value={jobDescription}
              maxLength={20_000}
              rows={5}
              disabled={loading}
              placeholder="Paste the full job description here…"
              onChange={(event) => {
                setJobDescription(event.target.value);
                resizeTextarea(event);
              }}
              className="mt-2 resize-none overflow-hidden rounded-xl"
            />
            <span className="mt-1 block text-right text-[11px] text-foreground-faint">
              {jobDescription.length.toLocaleString('en-AU')} / 20,000
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-foreground-strong">Extra direction</span>
            <span className="ml-2 text-xs text-foreground-subtle">Optional</span>
            <Textarea
              value={instructions}
              maxLength={2_000}
              rows={2}
              disabled={loading}
              placeholder="e.g. Keep the tone concise and prioritise leadership experience"
              onChange={(event) => {
                setInstructions(event.target.value);
                resizeTextarea(event);
              }}
              className="mt-2 resize-none overflow-hidden rounded-xl"
            />
          </label>

          <div className="rounded-xl border border-success-border bg-success-surface px-4 py-3 text-xs leading-5 text-success-foreground">
            Resumade asks the model to use only facts already in your resume, then validates the complete response against the Resumade schema.
          </div>

          {error && <p role="alert" className="text-sm text-danger-foreground">{error}</p>}
          <div className="flex justify-end border-t border-border-faint pt-5">
            <Button
              type="button"
              size="lg"
              disabled={loading}
              onClick={() => void tailor()}
              className="bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
            >
              {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <WandSparkles aria-hidden="true" />}
              {loading ? 'Analysing role…' : 'Generate suggestions'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-6 sm:px-8">
          <div className="mb-4 rounded-xl border border-border-muted bg-surface-subtle px-4 py-3 text-xs leading-5 text-foreground-muted">
            Reviewing the saved AI result against the source snapshot. Applying uses your current draft and skips anything you have since changed.
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              <strong className="text-foreground-strong">{applicableSelectedCount}</strong> of {changes.length} changes selected
              {conflicts.size > 0 && (
                <span className="ml-2 text-warning-foreground">· {conflicts.size} conflict{conflicts.size === 1 ? '' : 's'}</span>
              )}
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold text-primary">
              <button type="button" onClick={() => updateSelection(new Set(changes.filter(({ id }) => !conflicts.has(id)).map(({ id }) => id)))} className="hover:underline">Select available</button>
              <button type="button" onClick={() => updateSelection(new Set())} className="hover:underline">Clear</button>
            </div>
          </div>

          {changes.length === 0 ? (
            <p role="status" className="rounded-xl border border-success-border bg-success-surface px-4 py-3 text-sm text-success-foreground">
              The saved AI result contains no wording changes.
            </p>
          ) : <div className="space-y-3">
            {changes.map((change) => {
              const conflicted = conflicts.has(change.id);
              const checked = selected.has(change.id) && !conflicted;
              return (
                <label
                  key={change.id}
                  className={`block rounded-2xl border p-4 transition-colors ${conflicted ? 'cursor-not-allowed border-warning-border bg-warning-surface' : checked ? 'cursor-pointer border-focus bg-surface-subtle' : 'cursor-pointer border-border-muted bg-surface'}`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={conflicted}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(change.id)) next.delete(change.id); else next.add(change.id);
                        updateSelection(next);
                      }}
                      className="mt-0.5 size-4.5 accent-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold tracking-[0.04em] text-foreground-label uppercase">{change.label}</span>
                      {conflicted && (
                        <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
                          <AlertTriangle size={13} aria-hidden="true" /> Not available — this part of the draft changed after generation
                        </span>
                      )}
                      <span className="mt-3 grid gap-3 sm:grid-cols-2">
                        <span className="rounded-lg bg-muted p-3">
                          <span className="block text-[10px] font-bold tracking-[0.1em] text-foreground-subtle uppercase">Source sent to AI</span>
                          <span className="mt-1.5 block whitespace-pre-wrap text-xs leading-5 text-foreground-muted">{formatChangeValue(change.before)}</span>
                        </span>
                        <span className="rounded-lg border border-success-border bg-success-surface p-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold tracking-[0.1em] text-success-foreground uppercase"><Check size={11} /> Suggested</span>
                          <span className="mt-1.5 block whitespace-pre-wrap text-xs leading-5 text-success-foreground">{formatChangeValue(change.after)}</span>
                        </span>
                      </span>
                      {conflicted && (
                        <span className="mt-3 block rounded-lg border border-warning-border bg-surface p-3">
                          <span className="block text-[10px] font-bold tracking-[0.1em] text-warning-foreground uppercase">Current editable draft</span>
                          <span className="mt-1.5 block whitespace-pre-wrap text-xs leading-5 text-warning-foreground">{formatChangeValue(getResumeChangeValue(resume, change.path))}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>}

          <div className="sticky bottom-0 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-faint bg-surface/95 pt-5 backdrop-blur">
            <Button type="button" variant="outline" size="lg" onClick={() => setView('tailor')}>
              <ArrowLeft aria-hidden="true" /> Edit job details
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={applicableSelectedCount === 0}
              onClick={applySelected}
              className="bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
            >
              <Check aria-hidden="true" /> Apply {applicableSelectedCount} selected
            </Button>
          </div>
        </div>
        )}
      </ScrollArea>
    </DialogShell>
  );
}
