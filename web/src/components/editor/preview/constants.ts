import type { ResumeContent } from '@/lib/resume/resume.schema';
import {
  defaultPreviewSettings,
  defaultSectionOrder,
  type PreviewSettings,
  type SectionKey,
} from '@/features/resume-document/document.schema';

export { defaultPreviewSettings, defaultSectionOrder };
export type { PreviewSettings, SectionKey };

const mmToPx = (mm: number) => (mm * 96) / 25.4;

export const paperSizes = {
  a4: { label: 'A4', cssSize: 'A4', width: '210mm', height: '297mm', widthPx: mmToPx(210), heightPx: mmToPx(297) },
  letter: { label: 'US Letter', cssSize: 'letter', width: '8.5in', height: '11in', widthPx: 8.5 * 96, heightPx: 11 * 96 },
} as const;

export const sectionTitles = {
  summary: 'Summary',
  keySkills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  additionalSections: 'Additional sections',
} satisfies Record<Exclude<keyof ResumeContent, 'profile'>, string>;

export const layoutLabels = { classic: 'Classic', modern: 'Modern', custom: 'Custom' } as const;
export const marginSides = ['top', 'right', 'bottom', 'left'] as const;
export type PageMargins = PreviewSettings['margins'];
export type ResumeTheme = PreviewSettings['theme'];
export type CustomOptions = PreviewSettings['custom'];
