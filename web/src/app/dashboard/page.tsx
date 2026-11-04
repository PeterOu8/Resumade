import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';

import { auth } from '@/auth';
import { DashboardToolbar } from '@/components/dashboard/dashboard-toolbar';
import { ResumeCard } from '@/components/dashboard/resume-card';
import { listSavedResumes, ResumeApiError } from '@/lib/resume/resume-api';

const dateFormat = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

async function SavedResumes() {
  let resumes;
  try {
    resumes = await listSavedResumes();
  } catch (error) {
    if (error instanceof ResumeApiError && error.status === 401) redirect('/signin');
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[#ead8dc] bg-white p-6 text-sm text-[#9a3d48]"
      >
        Could not load your saved resumes. Refresh the page to try again.
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#c9d4eb] bg-white px-6 py-14 text-center">
        <FileText
          className="mx-auto size-8 text-[#3558c8]"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold">No saved resumes yet</h2>
        <p className="mt-1 text-sm text-[#687282]">
          Import a PDF or start a new resume, then save it from the editor.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resumes.map((resume) => (
        <li key={resume.id} className="min-w-0">
          <ResumeCard
            id={resume.id}
            title={resume.title}
            updatedAt={resume.updatedAt}
            updatedLabel={dateFormat.format(new Date(resume.updatedAt))}
          />
        </li>
      ))}
    </ul>
  );
}

async function DashboardContent() {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="mt-3 text-[clamp(36px,5vw,56px)] leading-none font-[650] tracking-[-0.055em]">
            Your resumes
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#687282]">
            Open a saved resume or start a new one.
          </p>
        </div>
        <DashboardToolbar />
      </div>
      <section
        className="mt-8 border-t border-[#dfe4ed] pt-7"
        aria-label="Saved resumes"
      >
        <Suspense
          fallback={
            <p role="status" className="text-sm text-[#687282]">
              Loading saved resumes…
            </p>
          }
        >
          <SavedResumes />
        </Suspense>
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[#faf9f6] px-5 py-10 text-[#1e2636] sm:px-7 sm:py-14">
      <div className="mx-auto max-w-[1280px]">
        <Suspense
          fallback={
            <p role="status" className="text-sm text-[#687282]">
              Opening dashboard…
            </p>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </main>
  );
}
