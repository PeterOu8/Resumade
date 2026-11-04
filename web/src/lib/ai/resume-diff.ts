import { resumeContentSchema, type ResumeContent } from '@/lib/resume/resume.schema';

export type ResumeChange = {
  id: string;
  path: Array<string | number>;
  label: string;
  before: unknown;
  after: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPrimitiveArray(value: unknown[]): boolean {
  return value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item));
}

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());
}

function changeLabel(path: Array<string | number>) {
  const [section, index, field, childIndex] = path;
  const sectionLabels: Record<string, string> = {
    profile: 'Profile',
    summary: 'Professional summary',
    keySkills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    additionalSections: 'Additional sections',
  };
  if (path.length === 1) return sectionLabels[String(section)] ?? titleCase(String(section));

  const parts = [sectionLabels[String(section)] ?? titleCase(String(section))];
  if (typeof index === 'number') parts.push(`#${index + 1}`);
  if (typeof field === 'string') parts.push(titleCase(field));
  if (typeof childIndex === 'number') parts.push(`#${childIndex + 1}`);
  return parts.join(' · ');
}

export function buildResumeChanges(before: ResumeContent, after: ResumeContent) {
  const changes: ResumeChange[] = [];

  function walk(left: unknown, right: unknown, path: Array<string | number>) {
    if (JSON.stringify(left) === JSON.stringify(right)) return;

    if (Array.isArray(left) && Array.isArray(right)) {
      if (
        left.length === right.length &&
        !isPrimitiveArray(left) &&
        !isPrimitiveArray(right)
      ) {
        left.forEach((value, index) => walk(value, right[index], [...path, index]));
        return;
      }
    } else if (isRecord(left) && isRecord(right)) {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
      keys.forEach((key) => walk(left[key], right[key], [...path, key]));
      return;
    }

    changes.push({
      id: path.map(String).join('.'),
      path,
      label: changeLabel(path),
      before: left,
      after: right,
    });
  }

  walk(before, after, []);
  return changes;
}

export function applyResumeChanges(resume: ResumeContent, changes: ResumeChange[]) {
  const next: unknown = structuredClone(resume);
  for (const change of changes) {
    if (!change.path.length) continue;
    let target = next as Record<string | number, unknown>;
    for (const segment of change.path.slice(0, -1)) {
      target = target[segment] as Record<string | number, unknown>;
    }
    target[change.path.at(-1)!] = structuredClone(change.after);
  }
  return resumeContentSchema.parse(next);
}

export function formatChangeValue(value: unknown) {
  if (Array.isArray(value)) {
    if (!value.length) return 'None';
    return value.every((item) => typeof item === 'string')
      ? value.join(' · ')
      : JSON.stringify(value, null, 2);
  }
  if (value === null || value === undefined || value === '') return 'Not set';
  if (typeof value === 'string') {
    return value
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  return String(value);
}
