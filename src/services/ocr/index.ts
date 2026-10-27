import { OCR_MIN_TEXT_LENGTH } from './types';
import { extractRawText } from './provider';
import { preprocessLabelImage } from './preprocess';

export { cleanOcrText } from './clean';
export { isOcrAvailable } from './provider';
export type { OcrBlock, OcrResult } from './types';

export interface RecognizedLabel {
  text: string;
}

/**
 * Full on-device label pipeline: preprocess → OCR → validate.
 * Returns null when OCR is unavailable (Expo Go) or the frame holds
 * no readable text — the scan screen then opens manual entry.
 */
export async function recognizeLabelText(photoUri: string): Promise<RecognizedLabel | null> {
  if (!photoUri) return null;
  const prepared = await preprocessLabelImage(photoUri);
  const result = await extractRawText(prepared);
  if (!result || result.text.length < OCR_MIN_TEXT_LENGTH) return null;
  return { text: result.text };
}
