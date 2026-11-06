'use client';

import { useCallback, useRef, useState } from 'react';

import type { ResumeDraft } from '@/lib/resume/resume.schema';
import type { PreviewSettings, SectionKey } from './preview/constants';

export type PdfDownloadState =
  | { status: 'idle' }
  | { status: 'preparing' }
  | { status: 'started'; fileName: string }
  | { status: 'error'; message: string };

export function usePdfDownload({ draft, sectionOrder, settings, disabled = false }: {
  draft: ResumeDraft;
  sectionOrder: readonly SectionKey[];
  settings: PreviewSettings;
  disabled?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [state, setState] = useState<PdfDownloadState>({ status: 'idle' });
  const inFlight = useRef(false);

  const downloadPdf = useCallback(async () => {
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setDownloading(true);
    setState({ status: 'preparing' });
    try {
      const { createResumePdfBlob, pdfFileName } = await import('@/lib/pdf/resume-pdf');
      const title = draft.title.trim() || draft.content.profile.fullName.trim() || 'Resume';
      const blob = await createResumePdfBlob({ title, resume: draft.content, sectionOrder, settings });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      const fileName = pdfFileName(title);
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setState({ status: 'started', fileName });
    } catch {
      setState({
        status: 'error',
        message: 'The PDF could not be prepared. Check the document and try again.',
      });
      throw new Error('The PDF could not be prepared. Check the document and try again.');
    } finally {
      inFlight.current = false;
      setDownloading(false);
    }
  }, [disabled, draft, sectionOrder, settings]);

  return { downloading, state, downloadPdf, reset: () => setState({ status: 'idle' }) };
}
