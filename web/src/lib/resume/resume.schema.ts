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

export const saveResumeRequestSchema = resumeDraftSchema.transform((draft) => ({
  ...draft,
  title: draft.title.trim() || (draft.content.profile.fullName.trim()
    ? `${draft.content.profile.fullName.trim().slice(0, 190)}'s resume`
    : 'Untitled resume'),
})).pipe(resumeDraftSchema.extend({
  title: z.string().max(200, 'Document title must be 200 characters or fewer.'),
}));

const presentationResponseSchema = z.object({
  version: z.literal(2),
  sectionOrder: z.array(z.enum(['summary', 'keySkills', 'experience', 'projects', 'education', 'additionalSections'])),
  settings: z.object({
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
  }),
});

export const savedResumeSchema = resumeDraftSchema.extend({
  id: z.uuid(),
  presentation: presentationResponseSchema.nullish(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

const savedResumeCardSchema = savedResumeSchema.pick({ id: true, title: true, updatedAt: true });

export const savedResumeListSchema = z.array(z.unknown()).transform((records) =>
  records.flatMap((record) => {
    const card = savedResumeCardSchema.safeParse(record);
    return card.success ? [card.data] : [];
  }),
);

export const savedResumePageSchema = z.object({
  items: savedResumeListSchema,
  nextCursor: z.string().nullable(),
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
