'use client';

import ResumePDF from '@/components/Resume';
import TailorResumeForm from '@/components/TailorResumeForm';
import { TailorResult } from '@/lib/types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useState } from 'react';

export default function Home() {
  const [resume, setResume] = useState<File[] | undefined>();
  const [tailoredData, setTailoredData] = useState<TailorResult | undefined>();
  return (
    <section>
      <TailorResumeForm
        file={resume}
        setResume={setResume}
        setTailoredData={setTailoredData}
      />

      {tailoredData && (
        <PDFDownloadLink
          document={<ResumePDF data={tailoredData} />}
          fileName="tailored_resume.pdf"
        />
      )}
    </section>
  );
}
