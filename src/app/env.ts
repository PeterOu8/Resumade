import { z } from 'zod';
export const env = z
  .object({
    OPENAI_API_KEY: z.string().min(10),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
