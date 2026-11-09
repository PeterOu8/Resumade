import { StartPageShell } from '@/components/start/start-page-shell';
import { TemplateOptions } from '@/components/start/template-options';
import { Suspense } from 'react';
import { auth } from '@/auth';

async function AvailableTemplates() {
  const session = await auth();
  return <TemplateOptions signedIn={Boolean(session?.user)} />;
}

export default function TemplateSelectionPage() {
  return (
    <StartPageShell
      eyebrow="CREATE FROM SCRATCH"
      title={<>Choose a{' '}<em className="font-['EB_Garamond',Georgia,serif] font-normal text-primary">starting point.</em></>}
      description="Every layout works with the same editor. Pick the one that feels right and refine it as you write."
    >
      <Suspense fallback={<p role="status">Loading templates…</p>}>
        <AvailableTemplates />
      </Suspense>
    </StartPageShell>
  );
}
