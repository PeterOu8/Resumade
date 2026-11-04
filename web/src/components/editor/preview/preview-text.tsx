import { createElement, Fragment, useSyncExternalStore, type ReactNode } from 'react';

const tags = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre',
  'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'a',
]);
const ignoredTags = new Set(['script', 'style', 'template', 'svg', 'math']);
const subscribe = () => () => {};
const richTextStart = /^<(p|ul|ol|h[1-6]|blockquote|pre|hr)(?=[\s/>])/i;

export function safeLink(value: string) {
  try {
    const url = new URL(value.trim());
    if (['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) return url.href;
  } catch {
    return undefined;
  }
}

function renderNode(node: Node, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return null;
  const tag = node.localName;
  if (ignoredTags.has(tag)) return null;

  const children = Array.from(node.childNodes, renderNode);
  if (!tags.has(tag)) return <Fragment key={key}>{children}</Fragment>;
  if (tag === 'br' || tag === 'hr') return createElement(tag, { key });
  const href = tag === 'a' ? safeLink(node.getAttribute('href') ?? '') : undefined;
  const start = tag === 'ol' ? node.getAttribute('start') : null;
  return createElement(tag, { key, href, ...(start && /^-?\d+$/.test(start) && { start }) }, children);
}

export function PreviewText({ value }: { value: string }) {
  const browser = useSyncExternalStore(subscribe, () => true, () => false);
  if (!richTextStart.test(value.trim())) return <div className="resume-plain-text">{value}</div>;
  if (!browser) return null;

  // Template contents stay inert. Only known elements and safe links reach the preview.
  const template = document.createElement('template');
  template.innerHTML = value;
  return <div className="resume-rich-text">{Array.from(template.content.childNodes, renderNode)}</div>;
}
