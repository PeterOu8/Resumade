import { Check, ChevronDown, GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

import { previewSections } from './content';

function PaperSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="mt-[13px] mb-1 border-b border-[#454b57] text-[9px] font-bold">
      {children}
    </h4>
  );
}

export function EditorIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-[14px] border border-[#dce0e8] bg-white shadow-[0_38px_80px_#27356020,0_8px_24px_#2735600e] min-[521px]:-rotate-[1.1deg] max-[1050px]:max-w-[750px]"
    >
      <div className="flex h-9 items-center gap-[5px] border-b border-[#eaecf0] bg-[#fcfcfd] px-3.5">
        <span className="size-1.5 rounded-full bg-[#e5a6a6]" />
        <span className="size-1.5 rounded-full bg-[#e6cf91]" />
        <span className="size-1.5 rounded-full bg-[#a9cdb1]" />
        <span className="ml-3 font-mono text-[10px] text-[#949ba8] max-[520px]:hidden">
          resumade / editor
        </span>
        <span className="ml-auto flex items-center gap-[3px] text-[9px] text-[#6b8191]">
          <Check size={11} /> Saved locally
        </span>
      </div>

      <div className="grid min-h-[420px] grid-cols-[minmax(0,45%)_1px_minmax(0,55%)]">
        <div className="min-w-0 px-[17px] py-[19px] max-[520px]:px-2.5 max-[520px]:py-[13px]">
          <div className="text-xs font-bold text-[#1e2636]">
            Build your story
          </div>
          <div className="mt-[13px] mb-4 rounded-md border border-[#dce1e8] px-2.5 py-2 text-[10px] text-[#6e7989]">
            Software Engineer resume
          </div>

          <div className="border-t border-[#e3e7ed]">
            {previewSections.map(({ title, note, expanded }) => (
              <div
                key={title}
                className="flex min-h-[33px] items-center gap-[5px] border-b border-[#e3e7ed] text-[10px] font-semibold text-[#273348]"
              >
                <GripVertical size={13} className="shrink-0 text-[#9aa4b1]" />
                <span>{title}</span>
                <span className="ml-auto whitespace-nowrap text-[8px] font-normal text-[#9aa4b1] max-[520px]:hidden">
                  {note}
                </span>
                <ChevronDown
                  size={13}
                  className={`ml-auto shrink-0 text-[#9aa4b1] min-[521px]:ml-0 ${expanded ? 'rotate-180' : ''}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 mb-[7px] text-[8px] font-bold tracking-[0.1em] text-[#717d8d]">
            SUMMARY
          </div>
          <div className="min-h-[72px] border-b-2 border-[#536bba] bg-[#f1f3f8] p-[9px] text-[10px] leading-[1.5] text-[#4d5b6d]">
            Software Engineer experienced in building scalable web applications
            <span className="inline-block h-[11px] border-l border-[#4768cd] align-[-2px]" />
          </div>
          <div className="flex gap-3.5 px-[9px] py-[7px] text-[10px] font-bold text-[#5a6474]">
            <span>B</span>
            <em>I</em>
            <span>≡</span>
          </div>
        </div>

        <div className="bg-[#e2e6ed]" />

        <div className="min-w-0 bg-[#f2f3f5] px-[15px] pt-[13px] pb-[19px] max-[520px]:px-2 max-[520px]:py-2.5">
          <div className="mb-3 flex justify-between gap-2 text-[9px] font-semibold text-[#6d7786]">
            <span>Live preview</span>
            <span>Classic &nbsp;·&nbsp; A4</span>
          </div>
          <div className="min-h-[375px] bg-white px-6 pt-6 pb-[18px] font-['EB_Garamond',Georgia,serif] text-[8px] leading-[1.28] text-[#252b36] shadow-[0_2px_8px_#27356018] max-[520px]:px-3 max-[520px]:pt-3.75 max-[520px]:text-[7px]">
            <h3 className="text-[17px] leading-[1.1] font-bold max-[520px]:text-[13px]">
              Alex Morgan
            </h3>
            <p className="text-[#415cae]">
              alex.morgan@email.com &nbsp; | &nbsp; Sydney, AU
            </p>

            <PaperSectionTitle>SUMMARY</PaperSectionTitle>
            <p>
              Software Engineer experienced in building scalable web
              applications.
            </p>

            <PaperSectionTitle>EXPERIENCE</PaperSectionTitle>
            <div className="flex justify-between gap-1.75 text-[9px] max-[520px]:block">
              <strong>Senior Software Engineer</strong>
              <span className="whitespace-nowrap">2024 — Present</span>
            </div>
            <p>JobsAT Studio · Sydney</p>
            <ul className="mt-1 list-[square] space-y-0.75 pl-3">
              <li>
                Built full-stack features using React, TypeScript, and .NET,
                supporting 10,000+ active users.
              </li>
              <li>
                Optimised API endpoints and database queries, reducing average
                response times by 40%.
              </li>
              <li>
                Implemented CI/CD pipelines with GitHub Actions, reducing
                deployment time by 60%.
              </li>
            </ul>

            <br />
            <div className="flex justify-between gap-[7px] text-[9px] max-[520px]:block">
              <strong>Graduate Software Engineer</strong>
              <span className="whitespace-nowrap">2022 — 2024</span>
            </div>
            <p>John Smith Ad Agency · Sydney</p>
            <ul className="mt-1 list-[square] space-y-0.75 pl-3">
              <li>
                Developed RESTful APIs and reusable React components for
                customer-facing applications.
              </li>
              <li>
                Collaborated with engineers to improve test coverage and resolve
                production issues.
              </li>
            </ul>
            <PaperSectionTitle>PROJECTS</PaperSectionTitle>
            <div className="flex justify-between gap-1.75 text-[9px] max-[520px]:block">
              <strong>DevFlow — Developer Productivity Platform</strong>
              <span className="whitespace-nowrap">2024</span>
            </div>
            <ul className="mt-1 list-[square] space-y-0.75 pl-3">
              <li>
                Built a dashboard for tracking projects, tasks, and development
                workflows.
              </li>
              <li>
                Implemented secure authentication and real-time project updates.
              </li>
            </ul>
            <PaperSectionTitle>SKILLS</PaperSectionTitle>
            <p>
              <strong>Frontend:</strong> React, Next.js, TypeScript, Tailwind
              CSS
            </p>
            <p>
              <strong>Backend:</strong> .NET, ASP.NET Core, C#, Node.js, REST
              APIs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
