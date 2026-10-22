export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { renderToBuffer } from '@react-pdf/renderer';
import Resume from '@/components/Resume';
import CoverLetter from '@/components/CoverLetter';
import type { TailorResult } from '@/lib/types';

type ExportRequest = {
  kind: 'cover' | 'resume';
  data: TailorResult;
  filename?: string;
  inline?: boolean;
};

export async function POST(request: Request) {
  const { kind, data, filename, inline } =
    (await request.json()) as ExportRequest;

  function generateDocument(kind: ExportRequest['kind'], data: TailorResult) {
    if (kind === 'cover') {
      return <CoverLetter data={data} />;
    }
    return <Resume data={data} />;
  }

  const buffer = await renderToBuffer(generateDocument(kind, data));
  const name =
    filename || (kind === 'cover' ? 'CoverLetter.pdf' : 'Resume.pdf');

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${
        inline ? 'inline' : 'attachment'
      }; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
