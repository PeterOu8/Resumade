import { z } from 'zod';

const previewSchema = z.object({
  title: z.string().trim().min(1).max(200),
  html: z.string().max(1_000_000).refine((html) => html.trim().length > 0),
});

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return Response.json({ error: 'PDF generation is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid resume data.' }, { status: 400 });
  }

  const preview = previewSchema.safeParse(body);
  if (!preview.success) {
    return Response.json({ error: 'Check the resume details and try again.' }, { status: 400 });
  }

  try {
    const response = await fetch(new URL('/api/resumes/pdf', apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preview.data),
      cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    });

    if (!response.ok) {
      return Response.json(
        { error: response.status === 400 ? 'Check the resume details and try again.' : 'PDF generation is unavailable.' },
        { status: response.status === 400 ? 400 : 502 },
      );
    }

    if (response.headers.get('content-type')?.split(';', 1)[0] !== 'application/pdf') {
      return Response.json({ error: 'The PDF service returned an invalid document.' }, { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment; filename="resume.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json({ error: 'Could not reach the PDF service.' }, { status: 502 });
  }
}
