import { z } from 'zod';

import { resumeContentSchema } from '@/lib/resume/resume.schema';

const textItemSchema = z.object({
  text: z.string().max(10_000),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative(),
  fontName: z.string().max(256),
  hasEOL: z.boolean(),
});

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return Response.json({ error: 'Resume parsing is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid import data.' }, { status: 400 });
  }

  const parsed = z.array(textItemSchema).min(1).max(50_000).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid PDF text items.' }, { status: 400 });
  }

  try {
    const response = await fetch(new URL('/api/resumes/parse', apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      return Response.json(
        { error: response.status === 400 ? 'The PDF text could not be parsed.' : 'Resume parsing is unavailable.' },
        { status: response.status === 400 ? 400 : 502 },
      );
    }

    const content = resumeContentSchema.safeParse(await response.json());
    if (!content.success) {
      return Response.json({ error: 'The parser returned an invalid resume.' }, { status: 502 });
    }
    return Response.json(content.data);
  } catch {
    return Response.json({ error: 'Could not reach the resume parser.' }, { status: 502 });
  }
}
