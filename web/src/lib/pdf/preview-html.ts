import { marginSides, paperSizes, type PreviewSettings } from '@/components/editor/preview/constants';

function readStyles(rules: CSSRuleList, baseUrl: string): Promise<string>[] {
  return Array.from(rules).flatMap((rule) => {
    if (rule instanceof CSSFontFaceRule && rule.style.fontFamily.includes('EB Garamond')) {
      return [embedFont(rule, baseUrl)];
    }
    if (rule instanceof CSSStyleRule && rule.selectorText.includes('.resume-')) {
      return [Promise.resolve(rule.cssText)];
    }
    if (rule instanceof CSSGroupingRule && rule.cssText.includes('.resume-')) {
      const header = rule.cssText.slice(0, rule.cssText.indexOf('{'));
      return [Promise.all(readStyles(rule.cssRules, baseUrl)).then((styles) =>
        `${header}{${styles.join('\n')}}`,
      )];
    }
    return [];
  });
}

async function embedFont(rule: CSSFontFaceRule, baseUrl: string) {
  const source = rule.style.getPropertyValue('src');
  const match = source.match(/url\(["']?([^"'()]+\.woff2)["']?\)/i);
  if (!match) return '';

  const url = new URL(match[1], baseUrl);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load the preview font.');

  const bytes = new Uint8Array(await response.arrayBuffer());
  const data = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
  return rule.cssText.replace(source, `url("data:font/woff2;base64,${data}") format("woff2")`);
}

export async function createPreviewHtml(title: string, settings: PreviewSettings) {
  const preview = document.querySelector('#resume-preview .resume-document');
  if (!preview) throw new Error('The resume preview is not ready.');

  const html = document.implementation.createHTMLDocument(title);
  html.documentElement.lang = document.documentElement.lang || 'en';
  html.body.append(html.importNode(preview, true));

  const styles = await Promise.all(Array.from(document.styleSheets).flatMap((sheet) => {
    try {
      return readStyles(sheet.cssRules, sheet.href ?? document.baseURI);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') return [];
      throw error;
    }
  }));

  const margins = marginSides.map((side) => `${settings.margins[side]}mm`).join(' ');
  const css = html.createElement('style');
  css.textContent = `
    @page { size: ${paperSizes[settings.paper].cssSize}; margin: ${margins}; }
    *, ::before, ::after { box-sizing: border-box; }
    body, h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre { margin: 0; }
    h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
    ul, ol { padding: 0; list-style: none; }
    a { color: inherit; text-decoration: inherit; }
    body { print-color-adjust: exact; }
    ${styles.join('\n')}
  `;
  html.head.append(css);
  return html.documentElement.outerHTML;
}
