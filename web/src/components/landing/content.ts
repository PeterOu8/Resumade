import type { LucideIcon } from 'lucide-react';
import {
  Cloud,
  Container,
  Download,
  FileUp,
  Laptop,
  SlidersHorizontal,
  Sparkles,
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
    icon: FileUp,
    number: '01',
    title: 'Create or import',
    description:
      'Start with a blank resume or import an existing PDF. No account is required to begin.',
  },
  {
    icon: SlidersHorizontal,
    number: '02',
    title: 'Edit and customise',
    description:
      'Add your experience, choose a template, and adjust the layout while the live preview updates.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Tailor with AI (optional)',
    description:
      'Connect a supported provider and add a job description, then review every suggestion before applying it.',
  },
  {
    icon: Download,
    number: '04',
    title: 'Save and export',
    description:
      'Keep the draft on this device, save it to an account, and download a professionally formatted PDF.',
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
