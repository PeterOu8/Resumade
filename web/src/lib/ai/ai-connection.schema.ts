import { z } from 'zod';

export const aiConnectionSchema = z.object({
  provider: z.enum(['openai', 'claude', 'grok', 'gemini', 'deepseek']),
  apiKey: z.string().min(8).max(512),
  model: z.string().max(120),
});
