'use client';

import { useCallback, useRef, useState } from 'react';

import type { ResumeDraft } from '@/lib/resume/resume.schema';
import type { PreviewSettings, SectionKey } from './preview/constants';

export function usePdfDownload({ draft, sectionOrder, settings, disabled = false }: {
  draft: ResumeDraft;
  sectionOrder: readonly SectionKey[];
  settings: PreviewSettings;
  disabled?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const inFlight = useRef(false);

  const downloadPdf = useCallback(async () => {
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setDownloading(true);
    try {
      const { createResumePdfBlob, pdfFileName } = await import('@/lib/pdf/resume-pdf');
      const title = draft.title.trim() || draft.content.profile.fullName.trim() || 'Resume';
      const blob = await createResumePdfBlob({ title, resume: draft.content, sectionOrder, settings });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = pdfFileName(title);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } finally {
      inFlight.current = false;
      setDownloading(false);
    }
  }, [disabled, draft, sectionOrder, settings]);

  return { downloading, downloadPdf };
}
