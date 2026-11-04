'use client';

import { useEffect, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { FileUp, LoaderCircle } from 'lucide-react';

import { readPdf } from '@/lib/pdf/read-pdf';
import { resumeContentSchema, type ResumeDraft } from '@/lib/resume/resume.schema';
import { useAiSettings } from '@/lib/ai/ai-settings';

type ImportPhase = 'reading' | 'parsing' | null;

export function PdfUpload({ onImported }: { onImported: (draft: ResumeDraft) => void }) {
  const { settings, connection, openSettings } = useAiSettings();
  const [phase, setPhase] = useState<ImportPhase>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function importFile(file: File) {
    if (controllerRef.current) return;
    if (settings.aiParsingEnabled && connection.apiKey.length < 8) {
      setError('Add an API key in AI settings before using AI parsing.');
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setFileName(file.name);
    setError('');
    setPhase('reading');

    try {
      const textItems = await readPdf(file, controller.signal);
      controller.signal.throwIfAborted();
      setPhase('parsing');

      const response = await fetch('/api/resumes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.aiParsingEnabled ? { textItems, ai: connection } : textItems),
        signal: controller.signal,
      });
      const result: unknown = await response.json().catch(() => null);
      controller.signal.throwIfAborted();
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Could not parse this resume.';
        throw new Error(message);
      }

      const parsed = resumeContentSchema.safeParse(result);
      if (!parsed.success) throw new Error('The parser returned an invalid resume. Please try again.');
      onImported({
        title: file.name.replace(/\.pdf$/i, '').trim().slice(0, 200) || 'Imported resume',
        content: parsed.data,
      });
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'Could not import this PDF.');
      }
    } finally {
      controllerRef.current = null;
      setPhase(null);
    }
  }

  function rejectFile(rejections: FileRejection[]) {
    setError(rejections[0]?.errors.some(({ code }) => code === 'file-too-large')
      ? 'Choose a PDF smaller than 10 MB.'
      : 'Choose one PDF file to continue.');
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: phase !== null,
    onDropAccepted: ([file]) => { if (file) void importFile(file); },
    onDropRejected: rejectFile,
  });

  return (
    <div>
      <div
        {...getRootProps({
          role: 'button',
          'aria-label': 'Drop your PDF here or browse your files',
          'aria-describedby': 'pdf-drop-hint',
          className: `flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus ${
            isDragReject
              ? 'border-danger bg-danger-surface'
              : isDragActive
                ? 'border-primary bg-accent'
                : 'border-border-strong bg-surface-subtle hover:border-focus hover:bg-surface-hover'
          } ${phase ? 'cursor-wait opacity-75' : ''}`,
        })}
      >
        <input {...getInputProps({ 'aria-label': 'Choose PDF file' })} />
        <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          {phase
            ? <LoaderCircle size={27} className="animate-spin" aria-hidden="true" />
            : <FileUp size={27} strokeWidth={1.7} aria-hidden="true" />}
        </span>
        <span className="mt-5 text-base font-semibold text-foreground-strong">
          {phase ? 'Importing your resume' : 'Drop your PDF here'}
        </span>
        <span className="mt-1 text-sm text-foreground-muted">
          {phase ? fileName : <>or <span className="font-semibold text-primary">browse your files</span></>}
        </span>
        <span id="pdf-drop-hint" className="mt-4 text-xs text-foreground-subtle">
          PDF files only · 10 MB maximum
        </span>
      </div>

      {phase && (
        <p role="status" aria-live="polite" className="mt-4 text-sm text-primary">
          {phase === 'reading' ? 'Reading PDF text…' : 'Parsing resume details…'}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger-foreground">
          {error}
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-foreground-muted">
        {settings.aiParsingEnabled ? (
          <>AI parsing is on with {connection.provider}. Your PDF text is sent to that provider. </>
        ) : (
          <>AI parsing is off. Resumade&apos;s rules-based parser will be used. </>
        )}
        <button type="button" onClick={openSettings} className="font-semibold text-primary underline-offset-2 hover:underline">
          Change AI settings
        </button>
        . Scanned PDFs require selectable text or OCR.
      </p>
    </div>
  );
}
