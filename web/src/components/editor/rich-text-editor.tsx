'use client';

import { Suspense, useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

import { Button } from '@/components/ui/button';

type RichTextFieldProps = {
  label?: string;
  value: string;
};

type RichTextEditorProps = RichTextFieldProps & {
  onChange: (value: string) => void;
  editable?: boolean;
};

const extensions = [StarterKit];
const editorSurface = 'w-full min-w-0 rounded-t-lg border-b border-foreground/25 bg-foreground/[0.07] focus-within:border-foreground dark:bg-foreground/10';
const editorPlaceholder = <div className={`${editorSurface} min-h-24`} />;

function toEditorHtml(value: string): string {
  if (!value.trim()) return '<p></p>';

  // Existing rich-text content is stored as HTML.
  if (/^<(p|ul|ol|h[1-6]|blockquote|pre|hr)(?=[\s/>])/i.test(value.trim())) {
    return value;
  }

  // Support plain-text strings from the existing resume schema.
  const escaped = value
    .replace(/\r\n?/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function RichTextEditor({
  label = 'Rich text',
  value,
  onChange,
  editable = true,
}: RichTextEditorProps) {
  return (
    <Suspense fallback={editable ? editorPlaceholder : null}>
      <RichTextField
        label={label}
        value={value}
        onChange={editable ? onChange : undefined}
      />
    </Suspense>
  );
}

export function RichTextPreview({ label = 'Rich text preview', value }: RichTextFieldProps) {
  return (
    <Suspense fallback={null}>
      <RichTextField label={label} value={value} />
    </Suspense>
  );
}

function RichTextField({
  label,
  value,
  onChange,
}: Required<RichTextFieldProps> & { onChange?: (value: string) => void }) {
  const editable = onChange !== undefined;
  const editor = useEditor({
    extensions,
    content: toEditorHtml(value),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: editable ? 'textbox' : 'region',
        'aria-label': label,
        ...(editable && { 'aria-multiline': 'true' }),
      },
    },

    onUpdate({ editor }) {
      onChange?.(editor.isEmpty ? '' : editor.getHTML());
    },
  });
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
    }),
  });

  // Preserve the selection when the parent echoes the editor's latest change.
  useEffect(() => {
    if (!editor) return;

    const html = toEditorHtml(value);

    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable, false);
  }, [editor, editable]);

  if (!editor) {
    return editable ? editorPlaceholder : null;
  }

  return (
    <div className={editable ? editorSurface : undefined}>
      {editable && (
        <div role="group" aria-label={`${label} formatting`} className="flex items-center gap-1 rounded-t-lg bg-foreground/[0.05] p-1">
          <Button
            type="button"
            size="icon"
            variant={active?.bold ? 'secondary' : 'ghost'}
            aria-label="Bold"
            aria-pressed={active?.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant={active?.italic ? 'secondary' : 'ghost'}
            aria-label="Italic"
            aria-pressed={active?.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant={active?.bulletList ? 'secondary' : 'ghost'}
            aria-label="Bullet list"
            aria-pressed={active?.bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant={active?.orderedList ? 'secondary' : 'ghost'}
            aria-label="Numbered list"
            aria-pressed={active?.orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </Button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={[
          editable && '[&_.ProseMirror]:min-h-24 [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:outline-none',
          '[&_.ProseMirror]:wrap-break-word',
          '[&_.ProseMirror_p]:my-1',
          '[&_.ProseMirror_ul]:list-disc',
          '[&_.ProseMirror_ol]:list-decimal',
          '[&_.ProseMirror_ul]:pl-6',
          '[&_.ProseMirror_ol]:pl-6',
        ].filter(Boolean).join(' ')}
      />
    </div>
  );
}
