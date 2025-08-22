'use client';

import TailorResumeForm from '@/components/TailorResumeForm';
import { useState } from 'react';

export default function Home() {
  const [resume, setResume] = useState<File[] | undefined>();

  return (
    <section>
      <TailorResumeForm file={resume} setResume={setResume} />
    </section>
  );
}
