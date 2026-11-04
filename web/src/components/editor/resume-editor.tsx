'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createPreviewHtml } from '@/lib/pdf/preview-html';
import { saveResume } from '@/lib/resume/save-resume';
import type { ResumeContent, ResumeDraft } from '@/lib/resume/resume.schema';
import { ImportPdfDialog } from '@/components/start/import-pdf-dialog';
import { AiTailorDialog } from './ai-tailor-dialog';
import { toast } from '@/components/ui/toast';

import { TextField } from './editor-fields';
import { EditorSection } from './editor-section';
import { EditorToolbar } from './editor-toolbar';
import {
  AdditionalSectionEditor,
  EducationEditor,
  ExperienceEditor,
  ProjectEditor,
  SkillEditor,
} from './item-editors';
import { ItemList } from './item-list';
import { sectionTitles, type PreviewSettings } from './preview/constants';
import { ResumePreview } from './preview/resume-preview';
import { RichTextEditor } from './rich-text-editor';
import { SortableList } from './sortable-list';
import { usePreviewDivider } from './use-preview-divider';
import { useResumeDocument } from './use-resume-document';

const profileFields = [
  { key: 'fullName', label: 'Full name' },
  { key: 'title', label: 'Professional title' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'location', label: 'Location' },
  { key: 'linkedIn', label: 'LinkedIn URL', type: 'url' },
  { key: 'gitHub', label: 'GitHub URL', type: 'url' },
  { key: 'website', label: 'Website', type: 'url' },
] as const satisfies ReadonlyArray<{
  key: keyof ResumeContent['profile'];
  label: string;
  type?: string;
}>;

export function ResumeEditor({
  initialStyle,
  initialImportId,
  initialDraft,
  draftScope,
  resumeId,
  canSaveToAccount = false,
}: {
  initialStyle?: PreviewSettings['style'];
  initialImportId?: string;
  initialDraft?: ResumeDraft;
  draftScope?: string;
  resumeId?: string;
  canSaveToAccount?: boolean;
}) {
  const router = useRouter();
  const document = useResumeDocument({
    initialStyle,
    initialImportId,
    initialDraft,
    draftScope,
  });
  const [importOpen, setImportOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const saveInFlight = useRef(false);
  const { draft, sectionOrder } = document;
  const { workspaceRef, editorShare, divider } = usePreviewDivider();
  const { content } = draft;

  async function downloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      const title = draft.title.trim() || content.profile.fullName.trim() || 'Resume';
      const html = await createPreviewHtml(title, document.settings);
      const response = await fetch('/api/resumes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.slice(0, 200), html }),
      });
      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const message =
          result &&
          typeof result === 'object' &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'Could not generate the PDF.';
        throw new Error(message);
      }

      const pdf = await response.blob();
      const url = URL.createObjectURL(pdf);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 120)}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      toast.add({
        title: 'PDF could not be downloaded',
        description:
          error instanceof Error ? error.message : 'Try again in a moment.',
        type: 'error',
      });
    } finally {
      setDownloading(false);
    }
  }

  async function saveToAccount() {
    if (!canSaveToAccount || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    let openingSavedResume = false;
    try {
      const result = await saveResume(draft, resumeId);
      if (result.error) {
        toast.add({
          title: 'Resume could not be saved',
          description: result.error,
          type: 'error',
        });
      } else {
        toast.add({ title: 'Resume saved', type: 'success' });
        if (!resumeId) {
          router.replace(`/editor?resume=${result.id}`);
          openingSavedResume = true;
        }
      }
    } catch {
      toast.add({
        title: 'Resume could not be saved',
        description: 'Try again in a moment.',
        type: 'error',
      });
    } finally {
      if (!openingSavedResume) {
        saveInFlight.current = false;
        setSaving(false);
      }
    }
  }

  function updateContent<K extends keyof ResumeContent>(
    key: K,
    value: ResumeContent[K],
  ) {
    document.updateDraft(
      { ...draft, content: { ...content, [key]: value } },
      `Edit ${key}`,
    );
  }

  const sectionContent = {
    summary: (
      <RichTextEditor
        label="Summary"
        value={content.summary}
        onChange={(summary) => updateContent('summary', summary)}
      />
    ),
    keySkills: (
      <ItemList
        items={content.keySkills}
        onChange={(items) => updateContent('keySkills', items)}
        itemName="Skill Category"
        getTitle={(item) => item.category}
        createItem={() => ({ category: '', items: [] })}
        renderItem={(item, update) => (
          <SkillEditor value={item} onChange={update} />
        )}
      />
    ),
    experience: (
      <ItemList
        items={content.experience}
        onChange={(items) => updateContent('experience', items)}
        itemName="Experience"
        getTitle={(item) => item.title || item.company}
        createItem={() => ({
          company: '',
          title: '',
          location: '',
          startDate: '',
          current: false,
          bullets: [],
        })}
        renderItem={(item, update) => (
          <ExperienceEditor value={item} onChange={update} />
        )}
      />
    ),
    projects: (
      <ItemList
        items={content.projects}
        onChange={(items) => updateContent('projects', items)}
        itemName="Project"
        getTitle={(item) => item.name}
        createItem={() => ({ name: '', description: '', techStack: [] })}
        renderItem={(item, update) => (
          <ProjectEditor value={item} onChange={update} />
        )}
      />
    ),
    education: (
      <ItemList
        items={content.education}
        onChange={(items) => updateContent('education', items)}
        itemName="Education"
        getTitle={(item) => item.school || item.degree}
        createItem={() => ({
          school: '',
          degree: '',
          major: '',
          location: '',
          startDate: '',
          current: false,
          awards: [],
        })}
        renderItem={(item, update) => (
          <EducationEditor value={item} onChange={update} />
        )}
      />
    ),
    additionalSections: (
      <ItemList
        items={content.additionalSections}
        onChange={(items) => updateContent('additionalSections', items)}
        itemName="Additional section"
        getTitle={(item) => item.title}
        createItem={() => ({ title: '', content: '', bullets: [] })}
        renderItem={(item, update) => (
          <AdditionalSectionEditor value={item} onChange={update} />
        )}
      />
    ),
  } satisfies Record<keyof typeof sectionTitles, React.ReactNode>;

  return (
    <main
      ref={workspaceRef}
      className="resume-editor-workspace mx-auto grid w-full max-w-[1500px] items-start gap-6 px-4 py-8 text-[#1e2636] sm:px-7 sm:py-10 lg:gap-4"
      style={{
        gridTemplateColumns: `minmax(0, ${editorShare}fr) 10px minmax(0, ${100 - editorShare}fr)`,
      }}
    >
      <div className="resume-editor-heading col-span-full space-y-7 pb-2">
        <EditorToolbar
          canUndo={document.canUndo}
          canRedo={document.canRedo}
          onUndo={document.undo}
          onRedo={document.redo}
          onImport={() => setImportOpen(true)}
          onTailor={() => setTailorOpen(true)}
          canSaveToAccount={canSaveToAccount}
          saving={saving}
          onSave={() => void saveToAccount()}
        />
        <div className="space-y-2"></div>
      </div>
      <div
        inert={saving}
        className="resume-editor-form min-w-0 rounded-2xl bg-white p-4 shadow-[0_18px_50px_#2735600c,0_2px_10px_#27356008] sm:p-6"
      >
        <div key={document.generation} className="space-y-6">
          <TextField
            label="Document title"
            value={draft.title}
            placeholder="e.g. Software Engineer Resume"
            onChange={(title) =>
              document.updateDraft({ ...draft, title }, 'Edit document title')
            }
          />
          <div>
            <EditorSection title="Profile" initiallyOpen>
              <div className="grid gap-3 sm:grid-cols-2">
                {profileFields.map(({ key, label, ...inputProps }) => (
                  <TextField
                    key={key}
                    label={label}
                    value={content.profile[key]}
                    onChange={(value) =>
                      updateContent('profile', {
                        ...content.profile,
                        [key]: value,
                      })
                    }
                    {...inputProps}
                  />
                ))}
              </div>
            </EditorSection>
            <SortableList
              items={sectionOrder}
              getId={(key) => key}
              getLabel={(key) => sectionTitles[key]}
              onReorder={document.updateSectionOrder}
              renderItem={(key, handle) => (
                <EditorSection
                  title={sectionTitles[key]}
                  count={key === 'summary' ? undefined : content[key].length}
                  initiallyOpen={key === 'summary'}
                  handle={handle}
                >
                  {sectionContent[key]}
                </EditorSection>
              )}
            />
          </div>
        </div>
      </div>
      {divider}
      <ResumePreview
        resume={content}
        sectionOrder={sectionOrder}
        settings={document.settings}
        onSettingsChange={document.updateSettings}
        saveStatus={resumeId ? undefined : document.status}
        downloading={downloading}
        onDownload={() => void downloadPdf()}
      />
      <ImportPdfDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(imported) => {
          document.importDraft(imported, 'Import PDF');
          setImportOpen(false);
          toast.add({ title: 'Resume imported', type: 'success' });
        }}
      />
      <AiTailorDialog
        open={tailorOpen}
        resume={content}
        onClose={() => setTailorOpen(false)}
        onApply={(tailoredContent) => {
          document.importDraft({ ...draft, content: tailoredContent }, 'Apply AI tailoring');
          setTailorOpen(false);
          toast.add({ title: 'Selected AI changes applied', type: 'success' });
        }}
      />
    </main>
  );
}
