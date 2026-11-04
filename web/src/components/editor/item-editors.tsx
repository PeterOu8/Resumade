import { useState } from 'react';

import type { ResumeContent } from '@/lib/resume/resume.schema';

import { DateRangeFields, TextField, TextListField } from './editor-fields';
import { RichTextEditor } from './rich-text-editor';

type EditorProps<T> = { value: T; onChange: (value: T) => void };

export function ExperienceEditor({ value, onChange }: EditorProps<ResumeContent['experience'][number]>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Job title" value={value.title} onChange={(title) => onChange({ ...value, title })} />
        <TextField label="Company" value={value.company} onChange={(company) => onChange({ ...value, company })} />
        <TextField className="sm:col-span-2" label="Location" value={value.location} onChange={(location) => onChange({ ...value, location })} />
        <DateRangeFields value={value} currentLabel="I currently work here" onChange={(dates) => onChange({ ...value, ...dates })} />
      </div>
      <TextListField label="Achievements" itemName="Bullet" items={value.bullets} onChange={(bullets) => onChange({ ...value, bullets })} richText />
    </div>
  );
}

export function EducationEditor({ value, onChange }: EditorProps<ResumeContent['education'][number]>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="School" value={value.school} onChange={(school) => onChange({ ...value, school })} />
        <TextField label="Location" value={value.location} onChange={(location) => onChange({ ...value, location })} />
        <TextField label="Degree" value={value.degree} onChange={(degree) => onChange({ ...value, degree })} />
        <TextField label="Major" value={value.major} onChange={(major) => onChange({ ...value, major })} />
        <DateRangeFields value={value} currentLabel="I currently study here" onChange={(dates) => onChange({ ...value, ...dates })} />
      </div>
      <TextListField label="Awards" itemName="Award" items={value.awards} onChange={(awards) => onChange({ ...value, awards })} />
    </div>
  );
}

export function SkillEditor({ value, onChange }: EditorProps<ResumeContent['keySkills'][number]>) {
  const [skillsText, setSkillsText] = useState(() => value.items.join(', '));

  return (
    <div className="space-y-4">
      <TextField label="Category" value={value.category} onChange={(category) => onChange({ ...value, category })} />
      <TextField
        label="Skills (comma-separated)"
        placeholder="e.g. React, TypeScript, CSS"
        value={skillsText}
        onChange={(text) => {
          setSkillsText(text);
          const items = text.split(',').map((skill) => skill.trim()).filter(Boolean);
          onChange({ ...value, items });
        }}
      />
    </div>
  );
}

export function ProjectEditor({ value, onChange }: EditorProps<ResumeContent['projects'][number]>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField className="sm:col-span-2" label="Project name" value={value.name} onChange={(name) => onChange({ ...value, name })} />
        <TextField label="Project URL" type="url" value={value.url} onChange={(url) => onChange({ ...value, url })} />
        <TextField label="GitHub URL" type="url" value={value.gitHub} onChange={(gitHub) => onChange({ ...value, gitHub })} />
      </div>
      <RichTextEditor label="Description" value={value.description} onChange={(description) => onChange({ ...value, description })} />
      <TextListField label="Tech stack" itemName="Technology" items={value.techStack} onChange={(techStack) => onChange({ ...value, techStack })} />
    </div>
  );
}

export function AdditionalSectionEditor({ value, onChange }: EditorProps<ResumeContent['additionalSections'][number]>) {
  return (
    <div className="space-y-4">
      <TextField label="Section title" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      <RichTextEditor label="Content" value={value.content} onChange={(content) => onChange({ ...value, content })} />
      <TextListField label="Bullets" itemName="Bullet" items={value.bullets} onChange={(bullets) => onChange({ ...value, bullets })} richText />
    </div>
  );
}
