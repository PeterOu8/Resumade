import { z } from 'zod';

import { resumeContentSchema } from '@/lib/resume/resume.schema';

const requestSchema = z.object({
  ai: z.object({
    provider: z.enum(['openai', 'claude', 'grok', 'gemini', 'deepseek']),
    apiKey: z.string().min(8).max(512),
    model: z.string().max(120),
  }),
  resume: resumeContentSchema,
  jobDescription: z.string().trim().min(20).max(20_000),
  instructions: z.string().trim().max(2_000).optional(),
});

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return Response.json({ error: 'AI tailoring is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid tailoring request.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Add a job description and valid AI settings.' }, { status: 400 });
  }

  try {
    const response = await fetch(new URL('/api/ai/resumes/tailor', apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(95_000),
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = result && typeof result === 'object' && 'detail' in result && typeof result.detail === 'string'
        ? result.detail
        : 'AI tailoring is unavailable.';
      return Response.json(
        { error: message },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }

    const content = z.object({ content: resumeContentSchema }).safeParse(result);
    if (!content.success) {
      return Response.json({ error: 'The AI response did not match the Resumade schema.' }, { status: 502 });
    }
    return Response.json(content.data);
  } catch {
    return Response.json({ error: 'Could not reach the AI tailoring service.' }, { status: 502 });
  }
}
