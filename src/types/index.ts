import { VerdictStatus } from '../design-system/colors';
export { VerdictStatus } from '../design-system/colors';

export type OriginType = 'plant' | 'animal' | 'synthetic' | 'mineral' | 'multiple';

export interface IngredientSource {
  id: string;
  sourceType: OriginType;
  description: string;
  likelihood?: 'common' | 'occasional' | 'rare';
}

export interface VerificationEvidence {
  id: string;
  sourceUrl?: string;
  sourceTitle: string;
  date: string;
  snippet: string;
  manufacturerStatement?: string;
  confidenceScore: number; // 0 to 100
  verdict: VerdictStatus;
}

export interface IngredientItem {
  id: string;
  name: string;
  code?: string; // e.g., 'E471', 'INS 471'
  scientificName?: string;
  verdict: VerdictStatus;
  origins: OriginType[];
  manufacturerDisclosed: boolean;
  disclosureText?: string;
  description: string;
  evidenceTrail?: VerificationEvidence[];
  suspiciousReason?: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  verdict: VerdictStatus;
  confidence: number; // 0 to 100
  ingredients: IngredientItem[];
  rawIngredientText: string;
  summary: string;
  scannedAt: string;
  isCachedOffline?: boolean;
}

export interface ScanHistoryItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  verdict: VerdictStatus;
  scannedAt: string;
  isCachedOffline: boolean;
}

export interface DietaryPreferences {
  dietType: 'strict_vegetarian' | 'lacto_vegetarian' | 'vegan' | 'flexible';
  flagE471: boolean;
  flagGelatin: boolean;
  flagCarmine: boolean;
  flagBonePhosphate: boolean;
  flagShellac: boolean;
  strictUndisclosedMode: boolean; // Flag all undisclosed sources as non-vegetarian
}
