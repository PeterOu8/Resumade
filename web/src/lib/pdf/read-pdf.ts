import type { TextItem as PdfTextItem } from 'pdfjs-dist/types/src/display/api';

// Keep this contract aligned with the API's TextItemDto.
type TextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
};

type TextItems = TextItem[];

const maxItems = 50_000;

export async function readPdf(file: File, signal?: AbortSignal): Promise<TextItems> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const abort = () => { void loadingTask.destroy(); };
  signal?.addEventListener('abort', abort, { once: true });

  try {
    signal?.throwIfAborted();
    const document = await loadingTask.promise;
    const items: TextItems = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      signal?.throwIfAborted();
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      await page.getOperatorList(); // Ensure the original font names are available.

      const pageItems = content.items
        .filter((item): item is PdfTextItem => 'str' in item)
        .map((item): TextItem => ({
          text: item.str.replace(/-\u00ad\u2010/g, '-'),
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
          fontName: (page.commonObjs.get(item.fontName) as { name?: string } | null)?.name
            ?? item.fontName,
          hasEOL: item.hasEOL,
        }))
        .filter((item) => item.hasEOL || item.text.trim().length > 0);

      if (pageItems.length > 0) {
        // Lines and pages must not be joined by the backend line grouper.
        pageItems[pageItems.length - 1].hasEOL = true;
      }
      items.push(...pageItems);
      if (items.length > maxItems) throw new Error('This PDF contains too much text to import.');
    }

    if (items.every((item) => !item.text.trim())) {
      throw new Error('No selectable text was found. Scanned PDFs need OCR before import.');
    }
    return items;
  } finally {
    signal?.removeEventListener('abort', abort);
    await loadingTask.destroy();
  }
}
