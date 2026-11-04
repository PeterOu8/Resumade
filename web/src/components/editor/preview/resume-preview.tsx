import { type ComponentType } from 'react';

import { marginSides, paperSizes, type PreviewSettings } from './constants';
import { ClassicLayout, CustomLayout, ModernLayout, type LayoutProps } from './layouts';
import { PreviewToolbar } from './preview-toolbar';
import { usePaperScale } from './use-paper-scale';
import './resume-preview.css';

const layouts = {
  classic: ClassicLayout,
  modern: ModernLayout,
  custom: CustomLayout,
} satisfies Record<PreviewSettings['style'], ComponentType<LayoutProps>>;

export function TemplatePreview({ styleId, ...layout }: LayoutProps & { styleId: PreviewSettings['style'] }) {
  const Layout = layouts[styleId];
  return <Layout {...layout} />;
}

export function ResumePreview({ resume, sectionOrder, settings, onSettingsChange, saveStatus, downloading, onDownload }: Pick<LayoutProps, 'resume' | 'sectionOrder'> & {
  settings: PreviewSettings;
  onSettingsChange: (settings: PreviewSettings) => void;
  saveStatus?: 'saved' | 'unsaved' | 'error';
  downloading: boolean;
  onDownload: () => void;
}) {
  const { containerRef, paperRef, scale, scaledHeight } = usePaperScale(settings.paper);
  const page = paperSizes[settings.paper];
  const printMargins = marginSides.map((side) => `${settings.margins[side]}mm`).join(' ');

  return (
    <section
      id="resume-preview"
      aria-labelledby="resume-preview-heading"
      className="resume-print-root min-w-0 scroll-mt-24 self-start overflow-hidden rounded-2xl border border-border-muted bg-surface-muted shadow-[0_18px_50px_#27356010,0_2px_10px_#27356008] lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-auto"
    >
      <PreviewToolbar
        settings={settings}
        onChange={onSettingsChange}
        saveStatus={saveStatus}
        downloading={downloading}
        onDownload={onDownload}
      />
      <style media="print">{`@page { size: ${page.cssSize}; margin: ${printMargins}; }`}</style>
      <div className="resume-preview-padding p-3 sm:p-5">
        <div ref={containerRef} className="resume-paper-container mx-auto" style={{ maxWidth: page.width }}>
          <div className="resume-paper-stage" style={{ height: scaledHeight }}>
            <div
              ref={paperRef}
              className="resume-paper"
              style={{ width: page.width, minHeight: page.height, transform: `scale(${scale})` }}
            >
              <TemplatePreview
                resume={resume}
                sectionOrder={sectionOrder}
                styleId={settings.style}
                theme={settings.theme}
                margins={settings.margins}
                custom={settings.custom}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
