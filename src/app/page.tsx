'use client';
import ResumeDropZone from '@/components/ResumeDropZone';
import { useState } from 'react';

export default function Home() {
  const [resume, setResume] = useState<File[] | undefined>();

  return (
    <main>
      <h1>Resumade</h1>
      <ResumeDropZone file={resume} setResumeText={setResume} />
    </main>
  );
}
