import { StartPageShell } from '@/components/start/start-page-shell';
import { TemplateOptions } from '@/components/start/template-options';

export default function TemplateSelectionPage() {
  return (
    <StartPageShell
      eyebrow="CREATE FROM SCRATCH"
      title={<>Choose a{' '}<em className="font-['EB_Garamond',Georgia,serif] font-normal text-primary">starting point.</em></>}
      description="Every layout works with the same editor. Pick the one that feels right and refine it as you write."
    >
      <TemplateOptions />
    </StartPageShell>
  );
}
