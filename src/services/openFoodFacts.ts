import { DietaryPreferences, Product } from '../types';
import { evaluateIngredients } from './ingredientEngine';
import { OFFProductSchema, OFFSearchSchema } from '../schemas';

export const OFF_BASE_URL = 'https://world.openfoodfacts.org';
export const OFF_USER_AGENT = 'VegTrace-Mobile/1.0.0 (vegtrace-app; contact: support@vegtrace.app)';
export const OFF_TIMEOUT_MS = 10000;
const OFF_MAX_RETRIES = 1;

export interface OFFProductResponse {
  code: string;
  status: number;
  status_verbose?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    ingredients?: Array<{
      id: string;
      text: string;
      vegan?: string;
      vegetarian?: string;
    }>;
  };
}

export interface OFFSearchResponse {
  count: number;
  products?: Array<{
    code: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    ingredients_text?: string;
  }>;
}

export function isValidBarcode(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode.trim());
}

function isOFFProductResponse(data: unknown): data is OFFProductResponse {
  const result = OFFProductSchema.safeParse(data);
  if (!result.success) return false;
  return true;
}

function isOFFSearchResponse(data: unknown): data is OFFSearchResponse {
  const result = OFFSearchSchema.safeParse(data);
  if (!result.success) return false;
  return true;
}

function devLog(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

const inFlightRequests = new Map<string, Promise<{ status: number; json: unknown }>>();

interface MemoryCacheEntry {
  product: Product;
  expiresAt: number;
  dietKey: string;
}
const barcodeMemoryCache = new Map<string, MemoryCacheEntry>();
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MEMORY_CACHE_ITEMS = 100;

function pruneMemoryCache(): void {
  const now = Date.now();
  if (barcodeMemoryCache.size > MAX_MEMORY_CACHE_ITEMS) {
    for (const [key, entry] of barcodeMemoryCache.entries()) {
      if (entry.expiresAt <= now) barcodeMemoryCache.delete(key);
    }
  }
}

/**
 * fetch with timeout + one retry for GETs on network errors / 5xx.
 * Deduplicates identical concurrent in-flight requests.
 * Never throws for HTTP error statuses — returns the response instead.
 */
export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = OFF_TIMEOUT_MS,
  retries = OFF_MAX_RETRIES
): Promise<{ status: number; json: unknown }> {
  const isGet = !init.method || init.method.toUpperCase() === 'GET';
  if (isGet && inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const exec = async () => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers: {
            'User-Agent': OFF_USER_AGENT,
            ...(init.headers || {}),
          },
        });
        clearTimeout(timer);
        if (response.status >= 500 && attempt < retries) continue;
        let json: unknown = null;
        try {
          json = await response.json();
        } catch {
          json = null;
        }
        return { status: response.status, json };
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        if (attempt < retries) continue;
        throw error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Request failed');
  };

  const promise = exec();
  if (isGet) {
    inFlightRequests.set(url, promise);
    promise.finally(() => inFlightRequests.delete(url));
  }
  return promise;
}

/**
 * Fetches real product metadata from Open Food Facts API by barcode.
 * Uses 5-minute memory cache to deduplicate repeat queries.
 * Returns null for invalid barcodes, unknown products, and network/server
 * failures. Never feeds placeholder text into the evaluation engine:
 * products with zero ingredient data stay `unknown`.
 */
export async function fetchProductByBarcode(
  barcode: string,
  prefs: Partial<DietaryPreferences> = {}
): Promise<Product | null> {
  const cleanBarcode = barcode.trim();
  if (!isValidBarcode(cleanBarcode)) return null;

  const dietKey = `${prefs.dietType || 'strict_vegetarian'}|${Boolean(prefs.strictUndisclosedMode)}`;
  const now = Date.now();
  const cached = barcodeMemoryCache.get(cleanBarcode);
  if (cached && cached.expiresAt > now && cached.dietKey === dietKey) {
    return cached.product;
  }

  try {
    const url = `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const { status, json } = await fetchJsonWithTimeout(url);
    if (status === 404) return null;
    if (status < 200 || status >= 300 || !isOFFProductResponse(json)) return null;
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const name = p.product_name || p.product_name_en || 'Packaged Food Product';
    const brand = p.brands || 'Manufacturer Not Stated';
    const imageUrl = p.image_url || p.image_front_url;
    // Many OFF records carry only the structured ingredient list.
    const structuredText = Array.isArray(p.ingredients)
      ? p.ingredients
          .map((ing) => (typeof ing.text === 'string' ? ing.text.trim() : ''))
          .filter(Boolean)
          .join(', ')
      : '';
    const rawText = (
      p.ingredients_text ||
      p.ingredients_text_en ||
      structuredText ||
      ''
    ).slice(0, 8000);

    // Run deterministic evaluation (empty text -> unknown, never vegetarian)
    const evaluation = evaluateIngredients(rawText, prefs);

    const product: Product = {
      id: json.code,
      barcode: json.code,
      name,
      brand,
      imageUrl,
      verdict: evaluation.verdict,
      confidence: evaluation.confidence,
      ingredients: evaluation.ingredients,
      rawIngredientText: rawText,
      summary: evaluation.summary,
      scannedAt: new Date().toISOString(),
      isCachedOffline: false,
    };

    pruneMemoryCache();
    barcodeMemoryCache.set(cleanBarcode, {
      product,
      expiresAt: now + MEMORY_CACHE_TTL_MS,
      dietKey,
    });

    return product;
  } catch (error) {
    devLog('Failed to fetch from Open Food Facts:', error);
    return null;
  }
}

/**
 * Searches real products from Open Food Facts by keyword/name.
 * Returns [] for short queries, validation failures, and network errors.
 */
export async function searchOpenFoodFacts(
  query: string,
  prefs: Partial<DietaryPreferences> = {}
): Promise<Product[]> {
  const clean = query.trim().slice(0, 120);
  if (clean.length < 2) return [];

  try {
    const url = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(clean)}&search_simple=1&action=process&json=1&page_size=8`;
    const { status, json } = await fetchJsonWithTimeout(url);
    if (status < 200 || status >= 300 || !isOFFSearchResponse(json)) return [];
    if (!json.products || !Array.isArray(json.products)) return [];

    return json.products
      .filter((p) => p && typeof p.code === 'string' && p.code.length > 0)
      .map((p) => {
        const rawText = (p.ingredients_text || '').slice(0, 8000);
        const evaluation = evaluateIngredients(rawText, prefs);

        return {
          id: p.code,
          barcode: p.code,
          name: p.product_name || 'Food Product',
          brand: p.brands || 'Brand Unknown',
          imageUrl: p.image_url,
          verdict: evaluation.verdict,
          confidence: evaluation.confidence,
          ingredients: evaluation.ingredients,
          rawIngredientText: rawText,
          summary: evaluation.summary,
          scannedAt: new Date().toISOString(),
          isCachedOffline: false,
        };
      });
  } catch (error) {
    devLog('Search query failed:', error);
    return [];
  }
}
