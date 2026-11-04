import type { LucideIcon } from 'lucide-react';
import {
  Cloud,
  Container,
  FileText,
  Laptop,
  LayoutTemplate,
  PenLine,
} from 'lucide-react';

export const previewSections = [
  { title: 'Profile', note: 'The essentials', expanded: false },
  { title: 'Summary', note: 'A stronger introduction', expanded: true },
  { title: 'Experience', note: '2 entries', expanded: false },
  { title: 'Projects', note: '3 entries', expanded: false },
  { title: 'Education', note: '1 entry', expanded: false },
] as const;

export type LandingFeature = {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
};

export const landingFeatures: LandingFeature[] = [
  {
    icon: PenLine,
    number: '01',
    title: 'Write with room to think',
    description:
      'Structured sections keep the details organised while rich text gives your summary and bullet points room to breathe.',
  },
  {
    icon: LayoutTemplate,
    number: '02',
    title: 'See every edit take shape',
    description:
      'A live paper preview stays beside your work. Switch layouts, adjust colour and margins, and see the result as you write.',
  },
  {
    icon: FileText,
    number: '03',
    title: 'Make the page yours',
    description:
      'Choose A4 or Letter, arrange sections in your order, and prepare a clean resume for printing or saving as a PDF.',
  },
];

export type DeploymentOption = {
  icon: LucideIcon;
  number: string;
  label: string;
  detail: string;
};

export const deploymentOptions: DeploymentOption[] = [
  { icon: Laptop, number: '01', label: 'On your machine', detail: 'Local' },
  { icon: Container, number: '02', label: 'In a container', detail: 'Docker' },
  { icon: Cloud, number: '03', label: 'In the cloud', detail: 'Azure' },
];
