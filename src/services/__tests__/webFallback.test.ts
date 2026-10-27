import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkManufacturerDisclosure, resolveProductWithFallback } from '../webFallback';
import { fetchJsonWithTimeout } from '../openFoodFacts';
import { sqliteGetVerification, sqliteSaveVerification } from '../../database/sqlite';

vi.mock('../openFoodFacts', () => ({
  isValidBarcode: (value: string) => /^\d{8,14}$/.test(value),
  fetchProductByBarcode: vi.fn(async () => null),
  searchOpenFoodFacts: vi.fn(async () => []),
  fetchJsonWithTimeout: vi.fn(async () => ({ status: 404, json: null })),
}));

vi.mock('../verification', () => ({
  verifyViaWorker: vi.fn(async () => null),
  workerVerdictToProduct: vi.fn(),
}));

vi.mock('../../database/sqlite', () => ({
  PRODUCT_CACHE_TTL_MS: 30 * 24 * 60 * 60 * 1000,
  sqliteGetVerification: vi.fn(async () => null),
  sqliteSaveVerification: vi.fn(async () => undefined),
}));

const mockFetchJson = vi.mocked(fetchJsonWithTimeout);
const mockGetVerification = vi.mocked(sqliteGetVerification);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('checkManufacturerDisclosure', () => {
  it('detects plant-origin claims with snippets', () => {
    const result = checkManufacturerDisclosure(
      'Made with 100% plant based oils, green dot certified vegetarian product.'
    );
    expect(result.disclosed).toBe(true);
    expect(result.originClaim).toBe('plant');
    expect(result.snippets.length).toBeGreaterThan(0);
  });

  it('detects animal-origin signals', () => {
    const result = checkManufacturerDisclosure('Contains beef tallow and gelatin.');
    expect(result.disclosed).toBe(true);
    expect(result.originClaim).toBe('animal');
  });

  it('reports mixed claims without picking a side', () => {
    const result = checkManufacturerDisclosure('Plant based recipe, may contain tallow traces.');
    expect(result.originClaim).toBe('mixed');
  });

  it('reports undisclosed when nothing matches', () => {
    const result = checkManufacturerDisclosure('Wheat flour, sugar, salt, emulsifier.');
    expect(result.disclosed).toBe(false);
    expect(result.originClaim).toBeNull();
  });

  it('does not treat a bare ingredient name as a manufacturer disclosure', () => {
    const result = checkManufacturerDisclosure(
      'Ingredients: sugar, wheat flour, shellac (glazing agent), salt.'
    );
    expect(result.disclosed).toBe(false);
    expect(result.originClaim).toBe('animal');
  });
});

describe('resolveProductWithFallback — PRD Sec 28 (web prose is never the label)', () => {
  it('never scores generic web prose as the product ingredient label', async () => {
    mockFetchJson
      .mockResolvedValueOnce({ status: 404, json: null })
      .mockResolvedValueOnce({
        status: 200,
        json: { AbstractText: 'Bread is a staple food.', AbstractURL: 'https://example.com/bread' },
      });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          '<html><body>Duck feathers are traditionally used as a source for L-cysteine in baking. Reference article about bread production.</body></html>',
      }))
    );

    const result = await resolveProductWithFallback({ barcode: '8901234567890', name: 'Bread' });
    expect(result?.product.verdict).toBe('unknown');
    expect(result?.product.rawIngredientText).toBe('');
  });

  it('caches verified barcode research and reuses it within 30 days', async () => {
    const cachedPayload = {
      product: {
        id: '8901234567890',
        barcode: '8901234567890',
        name: 'Cached Biscuit',
        brand: 'Brand',
        verdict: 'sourceUndisclosed',
        confidence: 60,
        ingredients: [],
        rawIngredientText: 'Emulsifier (E471)',
        summary: 'cached',
        scannedAt: '2026-10-01T00:00:00.000Z',
      },
      source: 'open_food_facts_search',
      disclosure: { disclosed: false, signals: [], originClaim: null, snippets: [] },
    };
    mockGetVerification.mockResolvedValueOnce({
      id: 'verify:8901234567890:strict_vegetarian',
      productId: '8901234567890',
      payload: JSON.stringify(cachedPayload),
      verifiedAt: '2026-10-01T00:00:00.000Z',
      expiresAt: '2026-10-31T00:00:00.000Z',
    });

    const result = await resolveProductWithFallback({ barcode: '8901234567890' });
    expect(result?.product.name).toBe('Cached Biscuit');
    expect(result?.source).toBe('open_food_facts_search');
    expect(mockFetchJson).not.toHaveBeenCalled();
    expect(sqliteSaveVerification).not.toHaveBeenCalled();
  });
});
