'use client';

import {
  type ResumeContent,
} from '@/lib/resume/resume.schema';

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
import { sectionTitles } from './preview/constants';
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

export function ResumeEditor() {
  const document = useResumeDocument();
  const { draft, sectionOrder } = document;
  const { workspaceRef, editorShare, divider } = usePreviewDivider();
  const { content } = draft;

  function updateContent<K extends keyof ResumeContent>(
    key: K,
    value: ResumeContent[K],
  ) {
    document.updateDraft({ ...draft, content: { ...content, [key]: value } }, `Edit ${key}`);
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
      className="resume-editor-workspace mx-auto grid w-full max-w-screen-2xl items-start gap-6 px-4 py-8 sm:px-6 lg:gap-2"
      style={{ gridTemplateColumns: `minmax(0, ${editorShare}fr) 10px minmax(0, ${100 - editorShare}fr)` }}
    >
      <div className="resume-editor-heading col-span-full space-y-4">
        <EditorToolbar canUndo={document.canUndo} canRedo={document.canRedo} onUndo={document.undo} onRedo={document.redo} />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Resume editor</h1>
          <p className="text-sm text-muted-foreground">
            Edit your resume and drag sections into the order you want.
          </p>
          <a href="#resume-preview" className="text-sm underline underline-offset-4 lg:hidden">Jump to preview</a>
        </div>
      </div>
      <div className="resume-editor-form min-w-0 space-y-5">
        <div key={document.generation} className="space-y-5">
        <TextField
          label="Document title"
          value={draft.title}
          placeholder="e.g. Software Engineer Resume"
          onChange={(title) => document.updateDraft({ ...draft, title }, 'Edit document title')}
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
                    updateContent('profile', { ...content.profile, [key]: value })
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
      <ResumePreview resume={content} sectionOrder={sectionOrder} settings={document.settings} onSettingsChange={document.updateSettings} saveStatus={document.status} />
    </main>
  );
}
