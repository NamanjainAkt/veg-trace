import { DietaryPreferences, Product } from '../types';
import { AppLanguage } from '../i18n/strings';
import { AppLanguageSchema, DietaryPreferencesSchema } from '../schemas';

/**
 * Pure mappers between app models and Appwrite documents.
 * Kept dependency-free so the sync contract is unit-tested.
 */

export function productToCloudDoc(product: Product): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    barcode: product.barcode,
    name: product.name.slice(0, 256),
    brand: product.brand.slice(0, 256),
    verdict: product.verdict,
    confidence: product.confidence,
    ingredientsJson: JSON.stringify(product.ingredients).slice(0, 16384),
    summary: product.summary.slice(0, 2048),
    scannedAt: product.scannedAt,
  };
  if (product.imageUrl) doc.imageUrl = product.imageUrl.slice(0, 2048);
  // Privacy (PRD Sec 32): the user's raw scanned ingredient text is never
  // uploaded to the shared cache — only the derived, non-identifying summary.
  return doc;
}

export function prefsToCloudDoc(
  prefs: DietaryPreferences,
  language: AppLanguage,
  userId: string
): Record<string, unknown> {
  return {
    userId,
    dietType: prefs.dietType,
    prefsJson: JSON.stringify(prefs),
    language,
    updatedAt: new Date().toISOString(),
  };
}

export interface CloudProfile {
  prefs: DietaryPreferences;
  language: AppLanguage;
}

export function cloudProfileToLocal(data: unknown): CloudProfile | null {
  if (typeof data !== 'object' || data === null) return null;
  const doc = data as Record<string, unknown>;
  if (typeof doc.prefsJson !== 'string') return null;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(doc.prefsJson);
  } catch {
    return null;
  }
  const prefs = DietaryPreferencesSchema.safeParse(parsed);
  if (!prefs.success) return null;
  const language = AppLanguageSchema.safeParse(doc.language);
  return { prefs: prefs.data, language: language.success ? language.data : 'en' };
}
