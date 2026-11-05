export const maxAiResumeTextLength = 100_000;

type PdfTextFragment = {
  text: string;
  hasEOL: boolean;
};

export function buildPdfText(
  items: ReadonlyArray<PdfTextFragment>,
): string | null {
  const parts: string[] = [];
  let sourceTextLength = 0;

  for (const item of items) {
    const lineEnding = item.hasEOL ? '\n' : ' ';
    sourceTextLength += item.text.length;
    if (sourceTextLength > maxAiResumeTextLength) return null;
    parts.push(item.text, lineEnding);
  }

  const output: string[] = [];
  const input = parts.join('');

  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character !== '\n') {
      output.push(character);
      continue;
    }

    while (output.at(-1) === ' ' || output.at(-1) === '\t') output.pop();

    let trailingNewlines = 0;
    for (
      let outputIndex = output.length - 1;
      outputIndex >= 0 && output[outputIndex] === '\n';
      outputIndex--
    ) {
      trailingNewlines++;
    }
    if (trailingNewlines < 3) output.push(character);
  }

  const text = output.join('').trim();
  return text.length <= maxAiResumeTextLength ? text : null;
}
