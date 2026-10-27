import { Platform } from 'react-native';
import * as TextExtractor from 'expo-text-extractor';
import { cleanOcrText } from './clean';
import { normalizeResult } from './normalize';
import { OcrResult } from './types';

type ExtractorFn = (uri: string) => Promise<unknown>;

function getModule(): Record<string, unknown> | null {
  try {
    const mod = TextExtractor as unknown as Record<string, unknown>;
    return mod && typeof mod === 'object' ? mod : null;
  } catch {
    return null;
  }
}

function findExtractor(
  mod: Record<string, unknown>,
  visited: Set<object> = new Set()
): ExtractorFn | null {
  if (visited.has(mod)) return null;
  visited.add(mod);
  const candidates = ['extractTextFromImage', 'extractText', 'recognizeText', 'getTextFromImage'];
  const scopes: Array<Record<string, unknown>> = [mod];
  if (mod.default && typeof mod.default === 'object') {
    scopes.push(mod.default as Record<string, unknown>);
  }
  for (const scope of scopes) {
    for (const name of candidates) {
      if (typeof scope[name] === 'function') return scope[name] as ExtractorFn;
    }
  }
  // Some builds nest the API one level deeper (e.g. { ExpoTextExtractor: {...} }).
  for (const value of Object.values(mod)) {
    if (value && typeof value === 'object') {
      const nested = findExtractor(value as Record<string, unknown>, visited);
      if (nested) return nested;
    }
  }
  return null;
}

/** True only where a native OCR engine exists (dev builds / EAS, never Expo Go web). */
export function isOcrAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  const mod = getModule();
  return mod !== null && findExtractor(mod) !== null;
}

/**
 * Runs on-device text recognition (ML Kit on Android, Vision on iOS).
 * Returns null when the engine is missing or nothing readable is found —
 * callers fall back to manual label entry.
 */
export async function extractRawText(uri: string): Promise<OcrResult | null> {
  if (!uri || Platform.OS === 'web') return null;
  const mod = getModule();
  const extractor = mod ? findExtractor(mod) : null;
  if (!extractor) return null;
  try {
    const normalized = normalizeResult(await extractor(uri));
    const text = cleanOcrText(normalized.text);
    if (!text) return null;
    return {
      text,
      blocks: normalized.blocks.map((b) => ({ text: b })),
      engine: Platform.OS === 'ios' ? 'vision' : 'mlkit',
    };
  } catch {
    return null;
  }
}
