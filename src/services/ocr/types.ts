export interface OcrBlock {
  text: string;
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
  engine: 'mlkit' | 'vision';
}

export const OCR_MIN_TEXT_LENGTH = 8;
