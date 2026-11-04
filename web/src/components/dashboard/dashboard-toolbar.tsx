'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Plus } from 'lucide-react';

import { ImportPdfDialog } from '@/components/start/import-pdf-dialog';
import { Button } from '@/components/ui/button';
import { importedResumePath } from '@/lib/resume/import-handoff';

export function DashboardToolbar() {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 border-[#d7deea] bg-white px-4 font-semibold text-[#273348] hover:bg-[#eef2fa]"
        onClick={() => setImportOpen(true)}
      >
        <FileUp aria-hidden="true" /> Import PDF
      </Button>
      <Button
        type="button"
        className="h-11 bg-[#3558c8] px-4 font-semibold text-white shadow-[0_8px_22px_#3558c82d] hover:bg-[#2847a9]"
        onClick={() => router.push(`/editor?new=${crypto.randomUUID()}`)}
      >
        <Plus aria-hidden="true" /> New Resume
      </Button>
      <ImportPdfDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(draft) => {
          router.push(importedResumePath(draft));
          setImportOpen(false);
        }}
      />
    </div>
  );
}
