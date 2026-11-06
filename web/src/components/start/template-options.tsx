import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { layoutLabels, type PreviewSettings } from '@/components/editor/preview/constants';

type TemplateOption = {
  id: PreviewSettings['style'];
  description: string;
};

const templates: TemplateOption[] = [
  { id: 'classic', description: 'A timeless, readable layout with traditional type.' },
  { id: 'modern', description: 'A clean layout with a confident accent.' },
  { id: 'custom', description: 'A flexible starting point you can make your own.' },
];

function TemplateThumbnail({ style }: { style: TemplateOption['id'] }) {
  const isClassic = style === 'classic';
  const isModern = style === 'modern';

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[210px] w-[160px] overflow-hidden bg-white px-4 py-5 text-[#273348] shadow-[0_7px_25px_#27356018]"
    >
      {isModern && <span className="absolute inset-y-0 left-0 w-1 bg-[#3558c8]" />}
      <div className={`${isClassic ? "font-['EB_Garamond',Georgia,serif]" : 'font-sans'} ${style === 'custom' ? 'text-center' : ''} text-[12px] font-bold`}>
        Alex Morgan
      </div>
      <div className={`mt-1 h-[3px] w-2/3 rounded-full bg-[#cbd5e8] ${style === 'custom' ? 'mx-auto' : ''}`} />
      {['Profile', 'Experience', 'Skills'].map((section) => (
        <div key={section} className="mt-4">
          <div className={`${style === 'custom' ? 'bg-[#eaf0ff] px-1 py-0.5' : 'border-b border-[#738099] pb-0.5'} text-[7px] font-bold tracking-[0.09em] ${isModern ? 'text-[#3558c8]' : ''}`}>
            {section.toUpperCase()}
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full bg-[#e3e8f1]" />
          <div className="mt-1.5 h-[3px] w-5/6 rounded-full bg-[#e3e8f1]" />
        </div>
      ))}
    </div>
  );
}

function TemplateCard({ template }: { template: TemplateOption }) {
  return (
    <Link
      href={`/editor?style=${template.id}&new=1`}
      className="group rounded-2xl border border-border bg-surface p-5 shadow-card transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-focus hover:shadow-card-hover focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus motion-reduce:transition-none"
    >
      <div className="grid h-[245px] place-items-center overflow-hidden rounded-xl bg-surface-muted">
        <TemplateThumbnail style={template.id} />
      </div>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground-strong">
            {layoutLabels[template.id]}
          </h2>
          <p className="mt-1 text-sm leading-5 text-foreground-muted">{template.description}</p>
        </div>
        <ArrowRight size={19} className="mt-1 shrink-0 text-foreground-subtle group-hover:text-primary" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function TemplateOptions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
