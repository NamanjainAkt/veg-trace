/** Pure cleanup for raw OCR output: collapse whitespace, drop noise. */
export function cleanOcrText(raw: string): string {
  const clean = raw.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[^\S\n]+/g, ' ').trim();
  return clean;
}
