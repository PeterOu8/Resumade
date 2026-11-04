'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteResume } from '@/lib/resume/delete-resume';
import { saveResume } from '@/lib/resume/save-resume';
import type { ResumeContent, ResumeDraft } from '@/lib/resume/resume.schema';
import { ImportPdfDialog } from '@/components/start/import-pdf-dialog';
import { AiTailorDialog } from './ai-tailor-dialog';
import { toast } from '@/components/ui/toast';
import { Panel } from '@/components/ui/panel';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
import { useAiTailorResult } from './use-ai-tailor-result';
import { usePdfDownload } from './use-pdf-download';

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
  aiResultScope,
  canSaveToAccount = false,
}: {
  initialStyle?: PreviewSettings['style'];
  initialImportId?: string;
  initialDraft?: ResumeDraft;
  draftScope?: string;
  resumeId?: string;
  aiResultScope: string;
  canSaveToAccount?: boolean;
}) {
  const router = useRouter();
  const document = useResumeDocument({
    initialStyle,
    initialImportId,
    initialDraft,
    draftScope,
  });
  const aiTailor = useAiTailorResult(aiResultScope);
  const [importOpen, setImportOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailorView, setTailorView] = useState<'tailor' | 'results'>('tailor');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedResumeId, setSavedResumeId] = useState(resumeId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const saveInFlight = useRef(false);
  const busy = saving || deleting;
  const { draft, sectionOrder } = document;
  const { workspaceRef, editorShare, divider } = usePreviewDivider();
  const { content } = draft;
  const { downloading, downloadPdf } = usePdfDownload({
    draft,
    sectionOrder,
    settings: document.settings,
    disabled: busy,
  });

  async function handleDownload() {
    try {
      await downloadPdf();
    } catch (error) {
      toast.add({
        title: 'PDF could not be downloaded',
        description:
          error instanceof Error ? error.message : 'Try again in a moment.',
        type: 'error',
      });
    }
  }

  async function saveToAccount() {
    if (!canSaveToAccount || saveInFlight.current || deleting) return;
    saveInFlight.current = true;
    setSaving(true);
    let openingSavedResume = false;
    try {
      const result = await saveResume(draft, savedResumeId);
      if (result.error) {
        toast.add({
          title: 'Resume could not be saved',
          description: result.error,
          type: 'error',
        });
      } else {
        toast.add({ title: 'Resume saved', type: 'success' });
        if (result.id && result.id !== savedResumeId) {
          aiTailor.moveToScope(result.id);
          setSavedResumeId(result.id);
          if (!savedResumeId) {
            router.replace(`/editor?resume=${result.id}`);
            openingSavedResume = true;
          }
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

  function requestDelete() {
    if (!savedResumeId || busy) return;
    setDeleteError('');
    setDeleteOpen(true);
  }

  async function deleteFromAccount() {
    if (!savedResumeId || busy) return;

    setDeleting(true);
    setDeleteError('');
    try {
      const result = await deleteResume(savedResumeId);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }

      aiTailor.clearResult();
      setDeleteOpen(false);
      toast.add({ title: 'Resume deleted', type: 'success' });
      router.replace('/dashboard');
    } catch {
      setDeleteError('Could not delete this resume. Try again in a moment.');
    } finally {
      setDeleting(false);
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
      className="resume-editor-workspace mx-auto grid h-full min-h-0 w-full max-w-[1500px] grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-4 overflow-hidden px-4 py-4 text-foreground sm:px-7 lg:grid-rows-[auto_minmax(0,1fr)]"
      style={{
        gridTemplateColumns: `minmax(0, ${editorShare}fr) 10px minmax(0, ${100 - editorShare}fr)`,
      }}
    >
      <div className="resume-editor-heading col-span-full min-h-0">
        <EditorToolbar
          canUndo={document.canUndo}
          canRedo={document.canRedo}
          onUndo={document.undo}
          onRedo={document.redo}
          onImport={() => setImportOpen(true)}
          onTailor={() => {
            setTailorView('tailor');
            setTailorOpen(true);
          }}
          hasAiResult={Boolean(aiTailor.result)}
          onAiResults={() => {
            setTailorView('results');
            setTailorOpen(true);
          }}
          canSaveToAccount={canSaveToAccount}
          saving={saving}
          onSave={() => void saveToAccount()}
          canDelete={Boolean(savedResumeId && canSaveToAccount)}
          deleting={deleting}
          onDelete={requestDelete}
        />
      </div>
      <Panel
        inert={busy}
        className="resume-editor-form scroll-area min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6"
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
      </Panel>
      {divider}
      <ResumePreview
        resume={content}
        sectionOrder={sectionOrder}
        settings={document.settings}
        onSettingsChange={document.updateSettings}
        saveStatus={savedResumeId ? undefined : document.status}
        downloading={downloading}
        onDownload={() => void handleDownload()}
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
        initialView={tailorView}
        result={aiTailor.result}
        onClose={() => setTailorOpen(false)}
        onResult={aiTailor.setResult}
        onSelectionChange={aiTailor.setSelectedChangeIds}
        onApply={(tailoredContent, outcome) => {
          if (outcome.applied > 0) {
            document.importDraft({ ...draft, content: tailoredContent }, 'Apply AI tailoring');
          }
          setTailorOpen(false);
          toast.add(outcome.conflicts > 0
            ? {
                title: outcome.applied > 0 ? 'Available AI changes applied' : 'No AI changes applied',
                description: `${outcome.conflicts} suggestion${outcome.conflicts === 1 ? ' was' : 's were'} skipped because the draft changed.`,
                type: outcome.applied > 0 ? 'success' : 'error',
              }
            : { title: 'Selected AI changes applied', type: 'success' });
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this resume?"
        description="This removes the saved resume from your account permanently. Downloaded copies and your current unsaved draft are not affected."
        confirmLabel="Delete resume"
        pendingLabel="Deleting…"
        pending={deleting}
        error={deleteError}
        onConfirm={() => void deleteFromAccount()}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
    </main>
  );
}
