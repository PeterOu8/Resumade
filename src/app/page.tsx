'use client';

import TailorResumeForm from '@/components/TailorResumeForm';
import { useState } from 'react';

export default function Home() {
  const [resume, setResume] = useState<File[] | undefined>();

  return (
    <main>
      <h1>Resumade</h1>
      <TailorResumeForm file={resume} setResume={setResume}></TailorResumeForm>
    </main>
  );
}
