import { z } from 'zod';

const optionalText = z.string().nullish();
const textList = z.array(z.string());

const dateRange = {
  startDate: z.string(),
  endDate: optionalText,
  current: z.boolean(),
};

export const resumeContentSchema = z.object({
  profile: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    title: z.string(),
    linkedIn: optionalText,
    gitHub: optionalText,
    website: optionalText,
  }),
  summary: z.string(),
  keySkills: z.array(
    z.object({
      category: z.string(),
      items: textList,
    }),
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      location: z.string(),
      ...dateRange,
      bullets: textList,
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      url: optionalText,
      gitHub: optionalText,
      techStack: textList,
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      major: z.string(),
      location: z.string(),
      ...dateRange,
      awards: textList,
    }),
  ),
  additionalSections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      bullets: textList,
    }),
  ),
});

export const resumeDraftSchema = z.object({
  title: z.string(),
  content: resumeContentSchema,
});

export const saveResumeRequestSchema = resumeDraftSchema.extend({
  title: z
    .string()
    .refine(
      (title) => title.trim().length > 0 && title.length <= 200,
      'Enter a document title of up to 200 characters',
    ),
});

export const savedResumeSchema = resumeDraftSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type ResumeDraft = z.infer<typeof resumeDraftSchema>;

export function createEmptyResumeDraft(): ResumeDraft {
  return {
    title: '',
    content: {
      profile: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        title: '',
      },
      summary: '',
      keySkills: [],
      experience: [],
      projects: [],
      education: [],
      additionalSections: [],
    },
  };
}
