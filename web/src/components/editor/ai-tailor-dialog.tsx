'use client';

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { ArrowLeft, Check, LoaderCircle, Settings2, Sparkles, WandSparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAiSettings } from '@/lib/ai/ai-settings';
import {
  applyResumeChanges,
  buildResumeChanges,
  formatChangeValue,
  type ResumeChange,
} from '@/lib/ai/resume-diff';
import { resumeContentSchema, type ResumeContent } from '@/lib/resume/resume.schema';

type Props = {
  open: boolean;
  resume: ResumeContent;
  onClose: () => void;
  onApply: (content: ResumeContent) => void;
};

function resizeTextarea(event: ChangeEvent<HTMLTextAreaElement>) {
  const textarea = event.currentTarget;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function AiTailorDialog({ open, resume, onClose, onApply }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { connection, openSettings } = useAiSettings();
  const [jobDescription, setJobDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysed, setAnalysed] = useState(false);
  const [changes, setChanges] = useState<ResumeChange[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    setError('');
    setAnalysed(false);
    setChanges([]);
    setSelected(new Set());
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
    setAnalysed(false);
    try {
      const response = await fetch('/api/resumes/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai: connection,
          resume,
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
      const suggestions = buildResumeChanges(resume, parsed.data);
      setChanges(suggestions);
      setSelected(new Set(suggestions.map(({ id }) => id)));
      setAnalysed(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not tailor this resume.');
    } finally {
      setLoading(false);
    }
  }

  function applySelected() {
    const accepted = changes.filter(({ id }) => selected.has(id));
    onApply(applyResumeChanges(resume, accepted));
    dialogRef.current?.close();
  }

  const reviewing = changes.length > 0;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ai-tailor-heading"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[820px] overflow-hidden rounded-[24px] border border-[#dce2ec] bg-white p-0 text-[#1e2636] shadow-[0_28px_90px_#0d142755] backdrop:bg-[#10182acc] backdrop:backdrop-blur-[3px]"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5eaf2] bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-[#3558c8] uppercase">
            <Sparkles size={13} aria-hidden="true" /> AI tailoring
          </span>
          <h2 id="ai-tailor-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            {reviewing ? 'Review suggested changes' : 'Tailor for this job'}
          </h2>
          <p className="mt-1 text-sm text-[#687282]">
            {reviewing
              ? 'Choose exactly which edits Resumade should apply.'
              : 'Paste the role details. Your current resume stays unchanged until you approve edits.'}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close AI tailoring"
          disabled={loading}
          onClick={() => dialogRef.current?.close()}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#d7deea] text-[#687282] hover:bg-[#eef2fa] hover:text-[#273348] disabled:opacity-50"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

        {!reviewing ? (
        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dfe5f0] bg-[#f8faff] px-4 py-3 text-xs text-[#687282]">
            <span>
              Using <strong className="text-[#273348]">{connection.provider}</strong>
              {' · '}{connection.model || 'provider default'}
            </span>
            <button type="button" onClick={openSettings} className="inline-flex items-center gap-1.5 font-semibold text-[#3558c8] hover:underline">
              <Settings2 size={14} aria-hidden="true" /> Change provider
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#273348]">Job description</span>
            <span className="ml-2 text-xs text-[#8a94a5]">Required</span>
            <textarea
              value={jobDescription}
              maxLength={20_000}
              rows={5}
              disabled={loading}
              placeholder="Paste the full job description here…"
              onChange={(event) => {
                setJobDescription(event.target.value);
                resizeTextarea(event);
              }}
              className="mt-2 w-full resize-none overflow-hidden rounded-xl border border-[#d7deea] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#9aa4b1] focus:border-[#3558c8] focus:ring-3 focus:ring-[#3558c8]/15"
            />
            <span className="mt-1 block text-right text-[11px] text-[#9aa4b1]">
              {jobDescription.length.toLocaleString()} / 20,000
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#273348]">Extra direction</span>
            <span className="ml-2 text-xs text-[#8a94a5]">Optional</span>
            <textarea
              value={instructions}
              maxLength={2_000}
              rows={2}
              disabled={loading}
              placeholder="e.g. Keep the tone concise and prioritise leadership experience"
              onChange={(event) => {
                setInstructions(event.target.value);
                resizeTextarea(event);
              }}
              className="mt-2 w-full resize-none overflow-hidden rounded-xl border border-[#d7deea] bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#9aa4b1] focus:border-[#3558c8] focus:ring-3 focus:ring-[#3558c8]/15"
            />
          </label>

          <div className="rounded-xl border border-[#dce9df] bg-[#f5fbf6] px-4 py-3 text-xs leading-5 text-[#4b6854]">
            Resumade asks the model to use only facts already in your resume, then validates the complete response against the Resumade schema.
          </div>

          {error && <p role="alert" className="text-sm text-[#a8454d]">{error}</p>}
          {analysed && changes.length === 0 && (
            <p role="status" className="rounded-xl border border-[#dce9df] bg-[#f5fbf6] px-4 py-3 text-sm text-[#3d6f4e]">
              This resume is already aligned with the role. No grounded wording changes were suggested.
            </p>
          )}

          <div className="flex justify-end border-t border-[#e9edf3] pt-5">
            <Button
              type="button"
              size="lg"
              disabled={loading}
              onClick={() => void tailor()}
              className="bg-[#3558c8] px-5 text-white hover:bg-[#2847a9]"
            >
              {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <WandSparkles aria-hidden="true" />}
              {loading ? 'Analysing role…' : 'Generate suggestions'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-6 sm:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#687282]">
              <strong className="text-[#273348]">{selected.size}</strong> of {changes.length} changes selected
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold text-[#3558c8]">
              <button type="button" onClick={() => setSelected(new Set(changes.map(({ id }) => id)))} className="hover:underline">Select all</button>
              <button type="button" onClick={() => setSelected(new Set())} className="hover:underline">Clear</button>
            </div>
          </div>

          <div className="space-y-3">
            {changes.map((change) => {
              const checked = selected.has(change.id);
              return (
                <label
                  key={change.id}
                  className={`block cursor-pointer rounded-2xl border p-4 transition-colors ${checked ? 'border-[#aebff0] bg-[#f7f9ff]' : 'border-[#dfe4ec] bg-white'}`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelected((current) => {
                        const next = new Set(current);
                        if (next.has(change.id)) next.delete(change.id); else next.add(change.id);
                        return next;
                      })}
                      className="mt-0.5 size-4.5 accent-[#3558c8]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold tracking-[0.04em] text-[#556176] uppercase">{change.label}</span>
                      <span className="mt-3 grid gap-3 sm:grid-cols-2">
                        <span className="rounded-lg bg-[#f3f5f8] p-3">
                          <span className="block text-[10px] font-bold tracking-[0.1em] text-[#8993a3] uppercase">Current</span>
                          <span className="mt-1.5 block whitespace-pre-wrap text-xs leading-5 text-[#667184]">{formatChangeValue(change.before)}</span>
                        </span>
                        <span className="rounded-lg border border-[#dce7df] bg-[#f4faf5] p-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold tracking-[0.1em] text-[#43805c] uppercase"><Check size={11} /> Suggested</span>
                          <span className="mt-1.5 block whitespace-pre-wrap text-xs leading-5 text-[#315640]">{formatChangeValue(change.after)}</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="sticky bottom-0 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e9edf3] bg-white/95 pt-5 backdrop-blur">
            <Button type="button" variant="outline" size="lg" onClick={() => { setChanges([]); setSelected(new Set()); setAnalysed(false); }}>
              <ArrowLeft aria-hidden="true" /> Edit job details
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={selected.size === 0}
              onClick={applySelected}
              className="bg-[#3558c8] px-5 text-white hover:bg-[#2847a9]"
            >
              <Check aria-hidden="true" /> Apply {selected.size} selected
            </Button>
          </div>
        </div>
        )}
      </div>
    </dialog>
  );
}
