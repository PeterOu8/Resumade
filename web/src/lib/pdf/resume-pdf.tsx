import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
  type DocumentProps,
  type Styles,
} from '@react-pdf/renderer';
import { parseDocument } from 'htmlparser2';
import type { ChildNode, Element, Text as DomText } from 'domhandler';
import type { ReactElement, ReactNode } from 'react';

import type { ResumeContent } from '@/lib/resume/resume.schema';
import { formatResumeDate } from '@/lib/resume/date-format';
import {
  sectionTitles,
  type CustomOptions,
  type PreviewSettings,
  type SectionKey,
} from '@/components/editor/preview/constants';

const mm = (value: number) => (value * 72) / 25.4;
export const classicEmphasisWeight = 600;

const baseStyles = StyleSheet.create({
  page: { backgroundColor: '#ffffff' },
  profile: { paddingBottom: 8, borderBottomWidth: 2 },
  modernProfile: { paddingTop: 2, paddingBottom: 2, paddingLeft: 10, borderBottomWidth: 0, borderLeftWidth: 3 },
  centered: { textAlign: 'center' },
  name: { fontSize: 26, lineHeight: 1.12, fontWeight: 700 },
  role: { marginTop: 3, fontSize: 12 },
  contacts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, columnGap: 10, rowGap: 2, fontSize: 9 },
  centeredContacts: { justifyContent: 'center' },
  sectionTitle: { marginBottom: 5, fontSize: 12, fontWeight: 700 },
  headingBand: { paddingVertical: 2, paddingHorizontal: 5 },
  entryHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 8 },
  entryTitle: { fontSize: 11, fontWeight: 700 },
  detail: { fontSize: 9.5 },
  dates: { marginLeft: 'auto', fontSize: 9.5 },
  bullets: { paddingLeft: 14 },
  bullet: { flexDirection: 'row', breakInside: 'avoid' },
  bulletMarker: { width: 9 },
  bulletBody: { flexGrow: 1, flexBasis: 0 },
  blockquote: { paddingLeft: 8, borderLeftWidth: 1 },
  link: { textDecoration: 'underline' },
  classicName: { fontSize: 18, fontWeight: classicEmphasisWeight },
  classicProfile: { paddingBottom: 0, borderBottomWidth: 0 },
  classicRole: { marginTop: 0, fontSize: 10 },
  classicContacts: { marginTop: 0, columnGap: 0, rowGap: 0, fontSize: 10 },
  classicSectionTitle: { marginBottom: 3, borderBottomWidth: 0.7, fontSize: 11, fontWeight: classicEmphasisWeight, textTransform: 'uppercase' },
  classicEntryTitle: { fontWeight: classicEmphasisWeight },
  classicDetail: { fontSize: 10 },
  classicDates: { fontSize: 10, fontWeight: classicEmphasisWeight },
  classicLink: { color: '#0000ee', textDecoration: 'none' },
});

type PdfOptions = CustomOptions & {
  family: string;
  fontSize: number;
  lineHeight: number;
  sectionGap: number;
  entryGap: number;
};

const fontFamilies: Record<CustomOptions['font'], string> = {
  sans: 'Helvetica',
  serif: 'Times-Roman',
  mono: 'Courier',
};

function optionsFor(settings: PreviewSettings): PdfOptions {
  if (settings.style === 'classic') {
    return {
      font: 'serif', alignment: 'left', headings: 'rule', density: 'compact',
      family: 'EB Garamond', fontSize: 10, lineHeight: 1.18, sectionGap: 12, entryGap: 5,
    };
  }
  const options = settings.style === 'modern'
    ? { font: 'sans', alignment: 'left', headings: 'band', density: 'comfortable' } as const
    : settings.custom;
  return {
    ...options,
    family: fontFamilies[options.font],
    fontSize: 10.5,
    lineHeight: options.density === 'compact' ? 1.3 : 1.42,
    sectionGap: options.density === 'compact' ? 8 : 13,
    entryGap: options.density === 'compact' ? 4 : 7,
  };
}

function mixWithWhite(colour: string, amount: number) {
  const match = /^#([0-9a-f]{6})$/i.exec(colour);
  if (!match) return '#f5f5f5';
  const value = Number.parseInt(match[1], 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 0xff) * amount + 255 * (1 - amount));
  return `#${[channel(16), channel(8), channel(0)].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}

function safeLink(value: string) {
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function inlineNodes(nodes: ChildNode[], keyPrefix: string, boldWeight: number): ReactNode[] {
  return nodes.flatMap((node, index): ReactNode[] => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === 'text') return [(node as DomText).data];
    if (node.type !== 'tag') return [];
    const element = node as Element;
    if (['script', 'style', 'template', 'svg', 'math'].includes(element.name)) return [];
    if (element.name === 'br') return ['\n'];
    const children = inlineNodes(element.children, key, boldWeight);
    const inlineStyle: Styles[string] = {};
    if (element.name === 'strong' || element.name === 'b') inlineStyle.fontWeight = boldWeight;
    if (element.name === 'em' || element.name === 'i') inlineStyle.fontStyle = 'italic';
    if (element.name === 'u') inlineStyle.textDecoration = 'underline';
    if (element.name === 's') inlineStyle.textDecoration = 'line-through';
    const href = element.name === 'a' ? safeLink(element.attribs.href ?? '') : undefined;
    if (href) return [<Link key={key} src={href} style={baseStyles.link}>{children}</Link>];
    return Object.keys(inlineStyle).length
      ? [<Text key={key} style={inlineStyle}>{children}</Text>]
      : children;
  });
}

function richBlocks(value: string, accent: string, boldWeight: number) {
  const document = parseDocument(value, { decodeEntities: true });
  const blocks: ReactElement[] = [];
  document.children.forEach((node, index) => {
    if (node.type === 'text' && (node as DomText).data.trim()) {
      blocks.push(<Text key={index}>{(node as DomText).data}</Text>);
      return;
    }
    if (node.type !== 'tag') return;
    const element = node as Element;
    if (['script', 'style', 'template', 'svg', 'math'].includes(element.name)) return;
    if (element.name === 'ul' || element.name === 'ol') {
      const start = Number.parseInt(element.attribs.start ?? '1', 10) || 1;
      element.children.filter((child): child is Element => child.type === 'tag' && child.name === 'li').forEach((item, itemIndex) => {
        blocks.push(
          <View key={`${index}-${itemIndex}`} style={[baseStyles.bullet, itemIndex > 0 ? { marginTop: 2 } : undefined]} wrap={false}>
            <Text style={baseStyles.bulletMarker}>{element.name === 'ol' ? `${start + itemIndex}.` : '•'}</Text>
            <Text style={baseStyles.bulletBody}>{inlineNodes(item.children, `${index}-${itemIndex}`, boldWeight)}</Text>
          </View>,
        );
      });
      return;
    }
    if (element.name === 'hr') {
      blocks.push(<View key={index} style={{ borderBottomWidth: 1, borderBottomColor: accent }} />);
      return;
    }
    blocks.push(
      <Text
        key={index}
        style={[
          index > 0 ? { marginTop: 2 } : undefined,
          element.name === 'blockquote' ? [baseStyles.blockquote, { borderLeftColor: accent }] : undefined,
          element.name === 'pre' ? { fontFamily: 'Courier' } : undefined,
        ]}
      >
        {inlineNodes(element.children, String(index), boldWeight)}
      </Text>,
    );
  });
  return blocks;
}

function PdfText({ value, accent, boldWeight = 700 }: { value: string; accent: string; boldWeight?: number }) {
  if (!/^<(p|ul|ol|h[1-6]|blockquote|pre|hr)(?=[\s/>])/i.test(value.trim())) {
    return <Text>{value}</Text>;
  }
  return <View>{richBlocks(value, accent, boldWeight)}</View>;
}

function Contact({ value, protocol = '', classic = false }: { value: string; protocol?: string; classic?: boolean }) {
  const href = safeLink(protocol + value);
  const label = value.replace(/^https?:\/\//i, '');
  return href ? <Link src={href} style={classic ? undefined : baseStyles.link}>{label}</Link> : <Text>{label}</Text>;
}

function joinDetails(...parts: (string | null | undefined)[]) {
  return parts.filter((part) => part?.trim()).join(' · ');
}

function dateRange(item: ResumeContent['experience'][number] | ResumeContent['education'][number]) {
  return [formatResumeDate(item.startDate), item.current ? 'Present' : formatResumeDate(item.endDate)].filter(Boolean).join(' – ');
}

type Context = { settings: PreviewSettings; options: PdfOptions };

function Profile({ profile, settings, options }: { profile: ResumeContent['profile'] } & Context) {
  const classic = settings.style === 'classic';
  const contacts = [
    { value: profile.email, protocol: 'mailto:' },
    { value: profile.phone, protocol: 'tel:' },
    { value: profile.location, plain: true },
    { value: profile.linkedIn }, { value: profile.gitHub }, { value: profile.website },
  ].filter(({ value }) => value?.trim());
  return (
    <View
      style={[
        baseStyles.profile,
        { borderBottomColor: settings.theme.accent },
        settings.style === 'modern' ? [baseStyles.modernProfile, { borderLeftColor: settings.theme.accent }] : undefined,
        classic ? baseStyles.classicProfile : undefined,
        options.alignment === 'center' ? baseStyles.centered : undefined,
      ]}
      wrap={false}
    >
      <Text style={[baseStyles.name, classic ? baseStyles.classicName : undefined]}>{profile.fullName.trim() || 'Your name'}</Text>
      {profile.title.trim() && <Text style={[baseStyles.role, { color: settings.theme.accent }, classic ? [baseStyles.classicRole, { color: settings.theme.text }] : undefined]}>{profile.title}</Text>}
      {contacts.length > 0 && (
        <View style={[baseStyles.contacts, classic ? baseStyles.classicContacts : undefined, options.alignment === 'center' ? baseStyles.centeredContacts : undefined]}>
          {contacts.map(({ value, plain, protocol }, index) => value && (
            <View key={index} style={{ flexDirection: 'row' }}>
              {classic && index > 0 && <Text style={{ marginHorizontal: 6 }}>|</Text>}
              {plain ? <Text>{value}</Text> : <Contact value={value} protocol={protocol} classic={classic} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function BulletList({ items, rich, context }: { items: string[]; rich?: boolean; context: Context }) {
  const visible = items.filter((item) => item.trim());
  const boldWeight = context.settings.style === 'classic' ? classicEmphasisWeight : 700;
  return visible.length ? (
    <View style={baseStyles.bullets}>
      {visible.map((item, index) => (
        <View key={index} style={[baseStyles.bullet, index > 0 ? { marginTop: 2 } : undefined]} wrap={false}>
          <Text style={baseStyles.bulletMarker}>•</Text>
          <View style={baseStyles.bulletBody}>{rich ? <PdfText value={item} accent={context.settings.theme.accent} boldWeight={boldWeight} /> : <Text>{item}</Text>}</View>
        </View>
      ))}
    </View>
  ) : null;
}

function Entry({ title, titleHref, detail, dates, description, bullets, richBullets, children, context, first = false }: {
  title?: string; titleHref?: string | null; detail?: string; dates?: string; description?: string;
  bullets?: string[]; richBullets?: boolean; children?: ReactNode; context: Context; first?: boolean;
}) {
  const classic = context.settings.style === 'classic';
  const href = titleHref ? safeLink(titleHref) : undefined;
  return (
    <View style={!first ? { marginTop: context.options.entryGap } : undefined}>
      {(title?.trim() || dates) && (
        <View style={baseStyles.entryHeading} wrap={false}>
          {title?.trim() && (href
            ? <Link src={href} style={[baseStyles.entryTitle, classic ? [baseStyles.classicEntryTitle, baseStyles.classicLink] : undefined]}>{title}</Link>
            : <Text style={[baseStyles.entryTitle, classic ? baseStyles.classicEntryTitle : undefined]}>{title}</Text>)}
          {dates && <Text style={[baseStyles.dates, classic ? baseStyles.classicDates : undefined]}>{dates}</Text>}
        </View>
      )}
      {detail?.trim() && <Text style={[baseStyles.detail, classic ? baseStyles.classicDetail : undefined]}>{detail}</Text>}
      {description?.trim() && <PdfText value={description} accent={context.settings.theme.accent} boldWeight={classic ? classicEmphasisWeight : 700} />}
      {bullets && <BulletList items={bullets} rich={richBullets} context={context} />}
      {children}
    </View>
  );
}

function Section({ title, children, context }: { title: string; children: ReactNode; context: Context }) {
  const { settings, options } = context;
  const classic = settings.style === 'classic';
  return (
    <View style={{ marginTop: options.sectionGap }}>
      <Text
        style={[
          baseStyles.sectionTitle,
          { color: settings.theme.accent },
          options.headings === 'rule' ? { borderBottomWidth: 1, borderBottomColor: settings.theme.accent } : undefined,
          options.headings === 'band' ? [baseStyles.headingBand, { backgroundColor: mixWithWhite(settings.theme.accent, 0.09) }] : undefined,
          classic ? [baseStyles.classicSectionTitle, { color: settings.theme.text, borderBottomColor: settings.theme.accent }] : undefined,
        ]}
        wrap={false}
      >{title}</Text>
      {children}
    </View>
  );
}

function ResumeSections({ resume, sectionOrder, context }: { resume: ResumeContent; sectionOrder: readonly SectionKey[]; context: Context }) {
  const renderers: Record<Exclude<SectionKey, 'additionalSections'>, () => ReactNode[]> = {
    summary: () => resume.summary.trim() ? [<PdfText key="summary" value={resume.summary} accent={context.settings.theme.accent} boldWeight={context.settings.style === 'classic' ? classicEmphasisWeight : 700} />] : [],
    keySkills: () => resume.keySkills.filter(({ category, items }) => category.trim() || items.some((item) => item.trim())).map(({ category, items }, index) => (
      <Text key={index} style={index > 0 ? { marginTop: 2 } : undefined}>
        {category.trim() && <Text style={{ fontWeight: context.settings.style === 'classic' ? classicEmphasisWeight : 700 }}>{category}{items.some((item) => item.trim()) ? ': ' : ''}</Text>}
        {items.filter((item) => item.trim()).join(', ')}
      </Text>
    )),
    experience: () => resume.experience.map((item, index) => {
      const title = item.title.trim() || item.company;
      const detail = joinDetails(item.title.trim() && item.company, item.location);
      const dates = dateRange(item);
      if (!title.trim() && !detail && !dates && !item.bullets.some((bullet) => bullet.trim())) return null;
      return <Entry key={index} first={index === 0} title={title} detail={detail} dates={dates} bullets={item.bullets} richBullets context={context} />;
    }).filter(Boolean),
    projects: () => resume.projects.map((item, index) => {
      const links = [item.url, item.gitHub].filter((value): value is string => Boolean(value?.trim()));
      const technologies = item.techStack.filter((technology) => technology.trim()).join(', ');
      if (!item.name.trim() && !item.description.trim() && !links.length && !technologies) return null;
      return (
        <Entry key={index} first={index === 0} title={item.name} titleHref={item.url} description={item.description} context={context}>
          {technologies && <Text style={[baseStyles.detail, context.settings.style === 'classic' ? baseStyles.classicDetail : undefined]}>{technologies}</Text>}
          {links.length > 0 && <View style={baseStyles.contacts}>{links.map((value, linkIndex) => <Contact key={linkIndex} value={value} />)}</View>}
        </Entry>
      );
    }).filter(Boolean),
    education: () => resume.education.map((item, index) => {
      const detail = joinDetails(item.degree, item.major, item.location);
      const dates = dateRange(item);
      if (!item.school.trim() && !detail && !dates && !item.awards.some((award) => award.trim())) return null;
      return <Entry key={index} first={index === 0} title={item.school} detail={detail} dates={dates} bullets={item.awards} context={context} />;
    }).filter(Boolean),
  };
  return sectionOrder.flatMap((key) => {
    if (key === 'additionalSections') {
      return resume.additionalSections.filter(({ title, content, bullets }) => title.trim() || content.trim() || bullets.some((bullet) => bullet.trim())).map((item, index) => (
        <Section key={`additional-${index}`} title={item.title.trim() || 'Additional section'} context={context}>
          <Entry first description={item.content} bullets={item.bullets} richBullets context={context} />
        </Section>
      ));
    }
    const entries = renderers[key]();
    return entries.length ? [<Section key={key} title={sectionTitles[key]} context={context}>{entries}</Section>] : [];
  });
}

let fontsRegistered = false;

export function registerResumePdfFonts(baseUrl = '') {
  if (fontsRegistered) return;
  Font.register({
    family: 'EB Garamond',
    fonts: [
      { src: `${baseUrl}/fonts/eb-garamond-400.woff`, fontWeight: 400 },
      { src: `${baseUrl}/fonts/eb-garamond-600.woff`, fontWeight: classicEmphasisWeight },
      { src: `${baseUrl}/fonts/eb-garamond-700.woff`, fontWeight: 700 },
    ],
  });
  fontsRegistered = true;
}

export function ResumePdfDocument({ title, resume, sectionOrder, settings }: {
  title: string; resume: ResumeContent; sectionOrder: readonly SectionKey[]; settings: PreviewSettings;
}) {
  const options = optionsFor(settings);
  const context = { settings, options };
  return (
    <Document title={title} creator="Resumade" producer="Resumade">
      <Page
        size={settings.paper === 'a4' ? 'A4' : 'LETTER'}
        style={[
          baseStyles.page,
          {
            paddingTop: mm(settings.margins.top), paddingRight: mm(settings.margins.right),
            paddingBottom: mm(settings.margins.bottom), paddingLeft: mm(settings.margins.left),
            color: settings.theme.text, fontFamily: options.family,
            fontSize: options.fontSize, lineHeight: options.lineHeight,
          },
        ]}
      >
        <Profile profile={resume.profile} settings={settings} options={options} />
        <ResumeSections resume={resume} sectionOrder={sectionOrder} context={context} />
      </Page>
    </Document>
  );
}

export async function createResumePdfBlob(props: Parameters<typeof ResumePdfDocument>[0]) {
  registerResumePdfFonts();
  return pdf(<ResumePdfDocument {...props} /> as ReactElement<DocumentProps>).toBlob();
}

export function pdfFileName(title: string) {
  const safeTitle = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 120);
  return `${safeTitle}.pdf`;
}
