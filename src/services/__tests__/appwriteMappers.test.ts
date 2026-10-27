import { describe, expect, it } from 'vitest';
import {
  cloudProfileToLocal,
  prefsToCloudDoc,
  productToCloudDoc,
} from '../appwriteMappers';
import { DEFAULT_PREFERENCES } from '../../constants/preferences';
import { Product } from '../../types';

const product: Product = {
  id: 'prod-1',
  barcode: '8901234567890',
  name: 'Cookies',
  brand: 'Bakery',
  imageUrl: undefined,
  verdict: 'sourceUndisclosed',
  confidence: 82,
  ingredients: [
    {
      id: 'ing-e471',
      name: 'Mono- and diglycerides of fatty acids',
      code: 'E471 / INS 471',
      verdict: 'sourceUndisclosed',
      origins: ['plant', 'animal'],
      manufacturerDisclosed: false,
      description: 'Emulsifier.',
    },
  ],
  rawIngredientText: 'Emulsifier (INS 471).',
  summary: 'Ambiguous.',
  scannedAt: '2026-10-04T20:00:00.000+00:00',
  isCachedOffline: true,
};

describe('appwriteMappers', () => {
  it('maps a product to a cloud document within field budgets', () => {
    const doc = productToCloudDoc(product) as Record<string, string | number>;
    expect(doc.barcode).toBe('8901234567890');
    expect(doc.verdict).toBe('sourceUndisclosed');
    expect(doc.confidence).toBe(82);
    expect(doc.scannedAt).toBe(product.scannedAt);
    expect('imageUrl' in doc).toBe(false);
    expect('rawText' in doc).toBe(false);
    expect((doc.ingredientsJson as string).length).toBeLessThanOrEqual(16384);
  });

  it('round-trips prefs through a cloud profile doc', () => {
    const doc = prefsToCloudDoc(DEFAULT_PREFERENCES, 'hi', 'user-1');
    const local = cloudProfileToLocal(doc);
    expect(local?.prefs.dietType).toBe('strict_vegetarian');
    expect(local?.language).toBe('hi');
  });

  it('rejects corrupt cloud profiles instead of applying them', () => {
    expect(cloudProfileToLocal(null)).toBeNull();
    expect(cloudProfileToLocal({ prefsJson: '{"dietType":"pizza"}', language: 'hi' })).toBeNull();
    expect(cloudProfileToLocal({ prefsJson: 'not-json', language: 'en' })).toBeNull();
  });
});
