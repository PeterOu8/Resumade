import { z } from 'zod';

import { resumeDraftSchema } from '@/lib/resume/resume.schema';

const sectionKeys = [
  'summary',
  'keySkills',
  'experience',
  'projects',
  'education',
  'additionalSections',
] as const;

export const sectionOrderSchema = z.array(z.enum(sectionKeys)).superRefine((order, context) => {
  if (order.length !== sectionKeys.length || new Set(order).size !== sectionKeys.length) {
    context.addIssue({ code: 'custom', message: 'Every resume section must appear exactly once.' });
  }
});

export const previewSettingsSchema = z.object({
  style: z.enum(['classic', 'modern', 'custom']),
  paper: z.enum(['a4', 'letter']),
  theme: z.object({ accent: z.string(), text: z.string() }),
  margins: z.object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() }),
  custom: z.object({
    font: z.enum(['sans', 'serif', 'mono']),
    alignment: z.enum(['left', 'center']),
    headings: z.enum(['plain', 'rule', 'band']),
    density: z.enum(['compact', 'comfortable']),
  }),
});

export type SectionKey = (typeof sectionKeys)[number];
export type PreviewSettings = z.infer<typeof previewSettingsSchema>;

export const defaultSectionOrder: SectionKey[] = [...sectionKeys];
export const defaultPreviewSettings: PreviewSettings = {
  style: 'classic',
  paper: 'letter',
  theme: { accent: '#111111', text: '#111111' },
  margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  custom: { font: 'sans', alignment: 'left', headings: 'rule', density: 'comfortable' },
};

export const presentationSchema = z.object({
  version: z.literal(2),
  sectionOrder: sectionOrderSchema,
  settings: previewSettingsSchema,
});

export const resumeDocumentSchema = z.object({
  draft: resumeDraftSchema,
  presentation: presentationSchema,
});

export type ResumePresentation = z.infer<typeof presentationSchema>;

export function createDefaultPresentation(style: PreviewSettings['style'] = 'classic'): ResumePresentation {
  return {
    version: 2,
    sectionOrder: [...defaultSectionOrder],
    settings: structuredClone({ ...defaultPreviewSettings, style }),
  };
}
