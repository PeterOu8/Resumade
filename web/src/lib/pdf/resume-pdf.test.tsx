import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { defaultPreviewSettings, defaultSectionOrder, type PreviewSettings } from '@/components/editor/preview/constants';
import { createEmptyResumeDraft } from '@/lib/resume/resume.schema';
import { classicEmphasisWeight, pdfFileName, registerResumePdfFonts, ResumePdfDocument } from './resume-pdf';

registerResumePdfFonts(path.resolve(process.cwd(), 'public'));

const draft = createEmptyResumeDraft();
draft.title = 'Frontend PDF';
draft.content = {
  ...draft.content,
  profile: {
    ...draft.content.profile,
    fullName: 'Alex Morgan',
    title: 'Software Engineer',
    email: 'alex@example.test',
    location: 'Sydney',
    linkedIn: 'https://linkedin.com/in/alex',
  },
  summary: '<p>Builds <em>thoughtful</em> and <strong><em>accessible</em></strong> products.</p>',
  keySkills: [{ category: 'Engineering', items: ['TypeScript', 'C#'] }],
  experience: [{
    company: 'Example Company', title: 'Engineer', location: 'Sydney',
    startDate: '2024-01', endDate: null, current: true,
    bullets: ['<p>Shipped a <strong>client-side PDF</strong> workflow.</p>'],
  }],
};

async function readPdf(settings: PreviewSettings) {
  const buffer = await renderToBuffer(
    <ResumePdfDocument
      title={draft.title}
      resume={draft.content}
      sectionOrder={defaultSectionOrder}
      settings={settings}
    />,
  );
  const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const page = await document.getPage(1);
  const text = await page.getTextContent();
  return {
    buffer,
    text: text.items.flatMap((item) => 'str' in item ? [item.str] : []).join(' '),
    viewport: page.getViewport({ scale: 1 }),
  };
}

describe('frontend resume PDF', () => {
  it('uses semibold emphasis for the Classic template', () => {
    expect(classicEmphasisWeight).toBe(600);
  });

  it.each(['classic', 'modern', 'custom'] as const)('renders the %s style as a selectable PDF', async (style) => {
    const result = await readPdf({ ...defaultPreviewSettings, style });

    expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(result.text).toContain('Alex Morgan');
    expect(result.text).toContain('client-side PDF');
    expect(result.text).toContain('thoughtful');
    expect(result.text).toContain('Engineering');
    expect(result.text).toContain('Jan 2024 – Present');
    expect(result.text).not.toContain('2024-01');
    expect(result.viewport.width).toBeCloseTo(612, 0);
    expect(result.viewport.height).toBeCloseTo(792, 0);
  }, 15_000);

  it('uses the selected A4 paper size and sanitises the download name', async () => {
    const result = await readPdf({ ...defaultPreviewSettings, paper: 'a4' });

    expect(result.viewport.width).toBeCloseTo(595.28, 0);
    expect(result.viewport.height).toBeCloseTo(841.89, 0);
    expect(pdfFileName('Alex: Resume/2026')).toBe('Alex- Resume-2026.pdf');
  }, 15_000);

  it('paginates long resumes without dropping the final content', async () => {
    const longResume = {
      ...draft.content,
      experience: Array.from({ length: 28 }, (_, index) => ({
        company: `Company ${index + 1}`,
        title: 'Engineer',
        location: 'Sydney',
        startDate: '2024-01',
        endDate: null,
        current: true,
        bullets: [`Delivered accessible product improvement ${index + 1}.`],
      })),
    };
    const buffer = await renderToBuffer(
      <ResumePdfDocument
        title="Long resume"
        resume={longResume}
        sectionOrder={defaultSectionOrder}
        settings={defaultPreviewSettings}
      />,
    );
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    const lastPage = await document.getPage(document.numPages);
    const text = await lastPage.getTextContent();
    const lastPageText = text.items.flatMap((item) => 'str' in item ? [item.str] : []).join(' ');

    expect(document.numPages).toBeGreaterThan(1);
    expect(lastPageText).toContain('Delivered accessible product improvement 28.');
  }, 15_000);
});
