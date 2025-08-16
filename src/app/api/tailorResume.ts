import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '../env';
import { redactText } from '@/lib/textHelpers';
import { ResumeFormSchema } from '@/lib/schemas';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { resumePlainText, jobDescription, prompt } = ResumeFormSchema.parse(
    await req.json()
  );

  const system = `You are the head of human resource management with over 10 years of experience in hiring technical professionals. Rewrite resumes for ATS using AU spelling. Keep claims truthful and highlight skills listed in the job description with experience.
Output JSON ONLY with keys:
summary:string; keySkills:string[]; experience:[{company,title,dates?,bullets:string[]}]; education?:string[]; atsHints:string[]; coverLetter?:string`;

  const user = [
    `JOB DESCRIPTION:\n${jobDescription}`,
    `RESUME TEXT:\n${redactText(resumePlainText)}`,
    `ADDITIONAL PROMPT:\n${prompt}`,
    `CONSTRAINTS:
- Bullets ≤ 25 words, strong verbs, metrics where possible.
- Prioritise JD keywords; DO NOT invent experience.
- If a Job description must-have is missing, add to atsHints only.
- Preserve dates; do not change years.
- Reply with valid JSON only.`,
  ].join('\n\n');

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = resp.choices[0].message.content || '{}';
  try {
    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON from model' },
      { status: 500 }
    );
  }
}
