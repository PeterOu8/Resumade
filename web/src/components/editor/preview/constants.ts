import type { ResumeContent } from '@/lib/resume/resume.schema';

export const mmToPx = (mm: number) => (mm * 96) / 25.4;

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

export type SectionKey = keyof typeof sectionTitles;
export const defaultSectionOrder = Object.keys(sectionTitles) as SectionKey[];

export const layoutLabels = { classic: 'Classic', modern: 'Modern', custom: 'Custom' } as const;
export const marginSides = ['top', 'right', 'bottom', 'left'] as const;
export type PageMargins = Record<(typeof marginSides)[number], number>;
export type ResumeTheme = { accent: string; text: string };

export type CustomOptions = {
  font: 'sans' | 'serif' | 'mono';
  alignment: 'left' | 'center';
  headings: 'plain' | 'rule' | 'band';
  density: 'compact' | 'comfortable';
};

export type PreviewSettings = {
  style: keyof typeof layoutLabels;
  paper: keyof typeof paperSizes;
  theme: ResumeTheme;
  margins: PageMargins;
  custom: CustomOptions;
};

export const defaultPreviewSettings: PreviewSettings = {
  style: 'classic',
  paper: 'letter',
  theme: { accent: '#111111', text: '#111111' },
  margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  custom: { font: 'sans', alignment: 'left', headings: 'rule', density: 'comfortable' },
};
