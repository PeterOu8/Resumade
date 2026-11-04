import { z } from 'zod';

import { resumeContentSchema } from '@/lib/resume/resume.schema';

export const aiTailorResultSchema = z.object({
  version: z.literal(1),
  source: resumeContentSchema,
  generated: resumeContentSchema,
  selectedChangeIds: z.array(z.string()),
  createdAt: z.iso.datetime({ offset: true }),
});

export type AiTailorResult = z.infer<typeof aiTailorResultSchema>;

