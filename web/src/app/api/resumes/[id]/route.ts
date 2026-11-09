import { z } from 'zod';
import { getSavedResume, ResumeApiError } from '@/lib/resume/resume-api';

export async function GET(_request: Request, { params }: RouteContext<'/api/resumes/[id]'>) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 400 });

  try {
    return Response.json(await getSavedResume(id.data), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return new Response(null, { status: error instanceof ResumeApiError ? error.status : 500 });
  }
}
