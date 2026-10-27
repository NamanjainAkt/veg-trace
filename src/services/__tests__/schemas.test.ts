import { describe, expect, it } from 'vitest';
import {
  DietaryPreferencesSchema,
  HistorySchema,
  OFFProductSchema,
  OFFSearchSchema,
} from '../../schemas';

const validProduct = {
  id: 'prod-1',
  barcode: '8901234567890',
  name: 'Cookies',
  brand: 'Bakery',
  verdict: 'sourceUndisclosed',
  confidence: 82,
  ingredients: [],
  rawIngredientText: 'Emulsifier (INS 471).',
  summary: 'Ambiguous.',
  scannedAt: new Date().toISOString(),
};

describe('schemas', () => {
  it('accepts a valid product and rejects shape drift', () => {
    expect(HistorySchema.safeParse([validProduct]).success).toBe(true);
    expect(HistorySchema.safeParse([{ foo: 1 }]).success).toBe(false);
    expect(HistorySchema.safeParse('[{"broken"').success).toBe(false);
  });

  it('rejects invalid diet types instead of persisting them', () => {
    const prefs = {
      dietType: 'pizza',
      flagE471: true,
      flagGelatin: true,
      flagCarmine: true,
      flagBonePhosphate: true,
      flagShellac: true,
      strictUndisclosedMode: false,
    };
    expect(DietaryPreferencesSchema.safeParse(prefs).success).toBe(false);
  });

  it('accepts OFF success, empty, and error shapes but rejects garbage', () => {
    expect(OFFProductSchema.safeParse({ code: '123', status: 0 }).success).toBe(true);
    expect(
      OFFProductSchema.safeParse({ code: '123', status: 1, product: { product_name: 'X' } }).success
    ).toBe(true);
    expect(OFFProductSchema.safeParse({ nope: true }).success).toBe(false);
    expect(OFFSearchSchema.safeParse({ count: 0 }).success).toBe(true);
    expect(OFFSearchSchema.safeParse({ count: 2, products: 'error' }).success).toBe(false);
  });
});
