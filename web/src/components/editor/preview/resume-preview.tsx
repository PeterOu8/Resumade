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

function TemplatePreview({ styleId, ...layout }: LayoutProps & { styleId: PreviewSettings['style'] }) {
  const Layout = layouts[styleId];
  return <Layout {...layout} />;
}

export function ResumePreview({ resume, sectionOrder, settings, onSettingsChange, visibleOnMobile = true }: Pick<LayoutProps, 'resume' | 'sectionOrder'> & {
  settings: PreviewSettings;
  onSettingsChange?: (settings: PreviewSettings) => void;
  visibleOnMobile?: boolean;
}) {
  const { containerRef, paperRef, scale, scaledHeight } = usePaperScale(settings.paper);
  const page = paperSizes[settings.paper];
  const printMargins = marginSides.map((side) => `${settings.margins[side]}mm`).join(' ');

  return (
    <section
      id="resume-preview"
      aria-labelledby="resume-preview-heading"
      className={`resume-print-root scroll-area h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-2xl border border-border-muted bg-surface-muted shadow-[0_18px_50px_#27356010,0_2px_10px_#27356008] ${visibleOnMobile ? '' : 'max-lg:hidden'}`}
    >
      {onSettingsChange ? (
        <PreviewToolbar settings={settings} onChange={onSettingsChange} />
      ) : (
        <h2 id="resume-preview-heading" className="sr-only">Resume preview</h2>
      )}
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
