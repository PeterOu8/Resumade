import type { CSSProperties, ReactNode } from 'react';

import type { ResumeContent } from '@/lib/resume/resume.schema';

import { sectionTitles, type CustomOptions, type PageMargins, type ResumeTheme, type SectionKey } from './constants';
import { PreviewText, safeLink } from './preview-text';

export type LayoutProps = {
  resume: ResumeContent;
  sectionOrder: readonly SectionKey[];
  theme: ResumeTheme;
  margins: PageMargins;
  custom: CustomOptions;
};

const fontStacks: Record<CustomOptions['font'], string> = {
  sans: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, Times New Roman, serif',
  mono: 'Courier New, monospace',
};

function joinDetails(...parts: (string | null | undefined)[]) {
  return parts.filter((part) => part?.trim()).join(' · ');
}

function dateRange({ startDate, endDate, current }: ResumeContent['experience'][number] | ResumeContent['education'][number]) {
  return [startDate, current ? 'Present' : endDate].filter((date) => date?.trim()).join(' – ');
}

function ContactLink({ value, protocol = '' }: { value: string; protocol?: string }) {
  const href = safeLink(protocol + value);
  return href ? <a href={href}>{value.replace(/^https?:\/\//i, '')}</a> : <span>{value}</span>;
}

function Profile({ profile }: { profile: ResumeContent['profile'] }) {
  const contacts = [
    { value: profile.email, protocol: 'mailto:' },
    { value: profile.phone, protocol: 'tel:' },
    { value: profile.location, plain: true },
    { value: profile.linkedIn },
    { value: profile.gitHub },
    { value: profile.website },
  ].filter(({ value }) => value?.trim());

  return (
    <header className="resume-profile">
      <h1>{profile.fullName.trim() || 'Your name'}</h1>
      {profile.title.trim() && <p className="resume-role">{profile.title}</p>}
      {contacts.length > 0 && (
        <ul className="resume-contacts" aria-label="Contact details">
          {contacts.map(({ value, plain, protocol }, index) => (
            <li key={index}>{value && (plain ? value : <ContactLink value={value} protocol={protocol} />)}</li>
          ))}
        </ul>
      )}
    </header>
  );
}

function BulletList({ items, rich = false }: { items: string[]; rich?: boolean }) {
  const visible = items.filter((item) => item.trim());
  if (!visible.length) return null;
  return (
    <ul className="resume-bullets">
      {visible.map((item, index) => (
        <li key={index}>{rich ? <PreviewText value={item} /> : item}</li>
      ))}
    </ul>
  );
}

type EntryProps = {
  title?: string;
  titleHref?: string | null;
  detail?: string;
  dates?: string;
  description?: string;
  bullets?: string[];
  richBullets?: boolean;
  children?: ReactNode;
};

function Entry({ title, titleHref, detail, dates, description, bullets, richBullets, children }: EntryProps) {
  return (
    <div className="resume-entry">
      {(title?.trim() || dates) && (
        <div className="resume-entry-heading">
          {title?.trim() && <h3>{titleHref && safeLink(titleHref) ? <a href={safeLink(titleHref)}>{title}</a> : title}</h3>}
          {dates && <span className="resume-dates">{dates}</span>}
        </div>
      )}
      {detail?.trim() && <p className="resume-detail">{detail}</p>}
      {description?.trim() && <PreviewText value={description} />}
      {bullets && <BulletList items={bullets} rich={richBullets} />}
      {children}
    </div>
  );
}

function ResumeSections({ resume, sectionOrder }: Pick<LayoutProps, 'resume' | 'sectionOrder'>) {
  const { summary, keySkills, experience, projects, education, additionalSections } = resume;
  const entries = {
    summary: summary.trim() ? [<PreviewText key="summary" value={summary} />] : [],
    keySkills: keySkills.filter(({ category, items }) => category.trim() || items.some((item) => item.trim()))
      .map(({ category, items }, index) => (
        <p key={index} className="resume-skill">
          {category.trim() && <strong>{category}{items.some((item) => item.trim()) ? ': ' : ''}</strong>}
          {items.filter((item) => item.trim()).join(', ')}
        </p>
      )),
    experience: experience.map((item, index) => {
      const title = item.title.trim() || item.company;
      const detail = joinDetails(item.title.trim() && item.company, item.location);
      const dates = dateRange(item);
      if (!title.trim() && !detail && !dates && !item.bullets.some((bullet) => bullet.trim())) return null;
      return <Entry key={index} title={title} detail={detail} dates={dates} bullets={item.bullets} richBullets />;
    }).filter(Boolean),
    projects: projects.map((item, index) => {
      const links = [item.url, item.gitHub].filter((value): value is string => Boolean(value?.trim()));
      const technologies = item.techStack.filter((item) => item.trim()).join(', ');
      if (!item.name.trim() && !item.description.trim() && !links.length && !technologies) return null;
      return (
        <Entry key={index} title={item.name} titleHref={item.url} description={item.description}>
          {technologies && <p className="resume-detail">{technologies}</p>}
          {links.length > 0 && (
            <ul className="resume-contacts">
              {links.map((value, index) => <li key={index}><ContactLink value={value} /></li>)}
            </ul>
          )}
        </Entry>
      );
    }).filter(Boolean),
    education: education.map((item, index) => {
      const detail = joinDetails(item.degree, item.major, item.location);
      const dates = dateRange(item);
      if (!item.school.trim() && !detail && !dates && !item.awards.some((award) => award.trim())) return null;
      return <Entry key={index} title={item.school} detail={detail} dates={dates} bullets={item.awards} />;
    }).filter(Boolean),
    additionalSections: [],
  } satisfies Record<SectionKey, ReactNode[]>;

  return sectionOrder.map((key) => {
    if (key === 'additionalSections') {
      return additionalSections
        .filter(({ title, content, bullets }) => title.trim() || content.trim() || bullets.some((bullet) => bullet.trim()))
        .map(({ title, content, bullets }, index) => (
          <section key={index} className="resume-section">
            <h2>{title.trim() || 'Additional section'}</h2>
            <Entry description={content} bullets={bullets} richBullets />
          </section>
        ));
    }
    return entries[key].length > 0 && (
      <section key={key} className="resume-section">
        <h2>{sectionTitles[key]}</h2>
        {entries[key]}
      </section>
    );
  });
}

function ResumeLayout({
  resume, sectionOrder, theme, margins, options, variant,
}: Omit<LayoutProps, 'custom'> & { options: CustomOptions; variant: string }) {
  const style = {
    '--resume-accent': theme.accent,
    '--resume-text': theme.text,
    '--resume-font': fontStacks[options.font],
    '--resume-padding': `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
  } as CSSProperties;

  return (
    <article
      aria-label="Resume"
      className="resume-document"
      data-layout={variant}
      data-alignment={options.alignment}
      data-headings={options.headings}
      data-density={options.density}
      style={style}
    >
      <Profile profile={resume.profile} />
      <ResumeSections resume={resume} sectionOrder={sectionOrder} />
    </article>
  );
}

const classic: CustomOptions = { font: 'serif', alignment: 'left', headings: 'rule', density: 'compact' };
const modern: CustomOptions = { font: 'sans', alignment: 'left', headings: 'band', density: 'comfortable' };

export function ClassicLayout(props: LayoutProps) {
  return <ResumeLayout {...props} options={classic} variant="classic" />;
}

export function ModernLayout(props: LayoutProps) {
  return <ResumeLayout {...props} options={modern} variant="modern" />;
}

export function CustomLayout(props: LayoutProps) {
  return <ResumeLayout {...props} options={props.custom} variant="custom" />;
}
