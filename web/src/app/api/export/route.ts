export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import Resume from '@/components/Resume';
import CoverLetter from '@/components/CoverLetter';
import { ConversationCreatedEvent } from 'openai/resources/beta/realtime/realtime.mjs';

export async function POST(request: Request) {
  const { kind, data, filename, inline } = await request.json();
  function generateDocument(kind: string, data: any) {
    if (kind === 'cover') {
      return <CoverLetter data={data} />;
    }
    return <Resume data={data} />;
  }
  const buffer = await pdf(generateDocument(kind, data)).toBuffer();
  const name =
    filename || (kind === 'cover' ? 'CoverLetter.pdf' : 'Resume.pdf');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${
        inline ? 'inline' : 'attachment'
      }; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
