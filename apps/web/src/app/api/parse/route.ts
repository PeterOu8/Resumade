export const dynamic = 'force-dynamic'; // avoid caching uploads

import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { cleanResumeText, estimateTokens } from '@/lib/textHelpers';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as unknown as File | null;
  if (!file) {
    return Response.json({ error: 'No uploaded file' }, { status: 400 });
  }

  const type = file.type || '';
  if (
    !/^application\/(pdf|vnd.openxmlformats-officedocument.wordprocessingml.document)$/.test(
      type
    )
  )
    return Response.json({ error: 'Only PDF or DOCX' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());

  let text = '';
  try {
    if (type.includes('pdf')) {
      const data = await pdf(buf);
      text = data.text as string;
    } else {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      text = value;
    }
  } catch (e) {
    return Response.json({ error: 'Parse failed' }, { status: 500 });
  }

  text = cleanResumeText(text);

  return Response.json({
    text,
    length: text.length,
    estimateTokens: estimateTokens(text),
  });
}
