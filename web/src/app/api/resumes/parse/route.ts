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

const aiConnectionSchema = z.object({
  provider: z.enum(['openai', 'claude', 'grok', 'gemini', 'deepseek']),
  apiKey: z.string().min(8).max(512),
  model: z.string().max(120),
});

const textItemsSchema = z.array(textItemSchema).min(1).max(50_000);
const aiParseSchema = z.object({
  textItems: textItemsSchema,
  ai: aiConnectionSchema,
});

function pdfText(items: z.infer<typeof textItemsSchema>) {
  return items
    .map((item) => `${item.text}${item.hasEOL ? '\n' : ' '}`)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

async function errorMessage(response: Response, fallback: string) {
  const result: unknown = await response.json().catch(() => null);
  if (result && typeof result === 'object') {
    if ('detail' in result && typeof result.detail === 'string') return result.detail;
    if ('error' in result && typeof result.error === 'string') return result.error;
  }
  return fallback;
}

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

  const aiParsed = aiParseSchema.safeParse(body);
  const localParsed = textItemsSchema.safeParse(body);
  if (!aiParsed.success && !localParsed.success) {
    return Response.json({ error: 'Invalid PDF text items.' }, { status: 400 });
  }

  try {
    const usingAi = aiParsed.success;
    const response = await fetch(new URL(usingAi ? '/api/ai/resumes/parse' : '/api/resumes/parse', apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usingAi
        ? { ai: aiParsed.data.ai, text: pdfText(aiParsed.data.textItems) }
        : localParsed.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(usingAi ? 95_000 : 30_000),
    });
    if (!response.ok) {
      return Response.json(
        { error: await errorMessage(response, usingAi ? 'AI parsing is unavailable.' : 'Resume parsing is unavailable.') },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }

    const result: unknown = await response.json();
    const content = resumeContentSchema.safeParse(
      usingAi && result && typeof result === 'object' && 'content' in result ? result.content : result,
    );
    if (!content.success) {
      return Response.json({ error: 'The parser returned an invalid resume.' }, { status: 502 });
    }
    return Response.json(content.data);
  } catch {
    return Response.json({ error: 'Could not reach the resume parser.' }, { status: 502 });
  }
}
