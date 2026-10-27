import { z } from 'zod';
import { OriginType, Product, VerificationEvidence, VerdictStatus } from '../types';
import { WorkerVerdictSchema } from '../schemas';

export type WorkerVerdict = z.infer<typeof WorkerVerdictSchema>;

const VERIFY_URL = process.env.EXPO_PUBLIC_VERIFY_URL;
const WORKER_TIMEOUT_MS = 12000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toAppVerdict(status: WorkerVerdict['overall_status']): VerdictStatus {
  switch (status) {
    case 'non_vegetarian':
      return 'nonVegetarian';
    case 'source_dependent':
      return 'sourceDependent';
    case 'source_undisclosed':
      return 'sourceUndisclosed';
    case 'vegetarian':
      return 'vegetarian';
    default:
      return 'unknown';
  }
}

function originsFor(status: WorkerVerdict['overall_status']): OriginType[] {
  switch (status) {
    case 'non_vegetarian':
      return ['animal'];
    case 'vegetarian':
      return ['plant'];
    case 'unknown':
      return ['multiple'];
    default:
      return ['plant', 'animal'];
  }
}

/**
 * Calls the Cloudflare verification worker when EXPO_PUBLIC_VERIFY_URL
 * is configured. Returns null when unconfigured or on any failure —
 * callers always fall through to the local pipeline (PRD cost strategy:
 * cloud is the exception path, never the default).
 */
export async function verifyViaWorker(input: {
  barcode?: string;
  name?: string;
  brand?: string;
  ingredientText?: string;
  dietType?: string;
}): Promise<WorkerVerdict | null> {
  if (!VERIFY_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS);
  try {
    const response = await fetch(`${VERIFY_URL}/verify`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) return null;
    const json: unknown = await response.json().catch(() => null);
    const parsed = WorkerVerdictSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Maps a validated worker verdict onto the app's Product shape. */
export function workerVerdictToProduct(
  verdict: WorkerVerdict,
  input: { barcode?: string; name?: string; brand?: string; ingredientText?: string }
): Product {
  const appVerdict = toAppVerdict(verdict.overall_status);
  const evidence: VerificationEvidence[] = verdict.evidence.map((item, index) => ({
    id: `ev-worker-${Date.now()}-${index}`,
    sourceTitle: item.source_title,
    sourceUrl: item.source_url,
    date: today(),
    snippet: item.snippet,
    confidenceScore: Math.round(verdict.confidence * 100),
    verdict: appVerdict,
  }));

  return {
    id: (input.barcode && /^\d+$/.test(input.barcode) ? input.barcode : `cloud-${Date.now()}`),
    barcode: input.barcode || `cloud-${Date.now()}`,
    name: input.name || 'Verified Food Product',
    brand: input.brand || 'Manufacturer Not Stated',
    imageUrl: undefined,
    verdict: appVerdict,
    confidence: Math.max(5, Math.min(98, Math.round(verdict.confidence * 100))),
    ingredients: verdict.ingredients.map((ing, index) => ({
      id: `ing-cloud-${index}`,
      name: ing.name,
      code: ing.code,
      verdict: toAppVerdict(ing.status),
      origins: originsFor(ing.status),
      manufacturerDisclosed: verdict.manufacturer_disclosure.disclosed,
      description: verdict.explanation,
      evidenceTrail: evidence.slice(0, 2),
    })),
    rawIngredientText: input.ingredientText || '',
    summary: verdict.explanation,
    scannedAt: new Date().toISOString(),
    isCachedOffline: false,
  };
}
