import { z } from 'zod';

export const VerdictSchema = z.enum([
  'vegetarian',
  'nonVegetarian',
  'sourceDependent',
  'sourceUndisclosed',
  'unknown',
]);

export const OriginSchema = z.enum(['plant', 'animal', 'synthetic', 'mineral', 'multiple']);

export const DietTypeSchema = z.enum([
  'strict_vegetarian',
  'lacto_vegetarian',
  'vegan',
  'flexible',
]);

export const AppLanguageSchema = z.enum(['en', 'hi']);

export const VerificationEvidenceSchema = z.object({
  id: z.string(),
  sourceUrl: z.string().optional(),
  sourceTitle: z.string(),
  date: z.string(),
  snippet: z.string(),
  manufacturerStatement: z.string().optional(),
  confidenceScore: z.number(),
  verdict: VerdictSchema,
});

export const IngredientItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().optional(),
  scientificName: z.string().optional(),
  verdict: VerdictSchema,
  origins: z.array(OriginSchema),
  manufacturerDisclosed: z.boolean(),
  disclosureText: z.string().optional(),
  description: z.string(),
  evidenceTrail: z.array(VerificationEvidenceSchema).optional(),
  suspiciousReason: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  barcode: z.string(),
  name: z.string(),
  brand: z.string(),
  imageUrl: z.string().optional(),
  verdict: VerdictSchema,
  confidence: z.number(),
  ingredients: z.array(IngredientItemSchema),
  rawIngredientText: z.string(),
  summary: z.string(),
  scannedAt: z.string(),
  isCachedOffline: z.boolean().optional(),
});

export const DietaryPreferencesSchema = z.object({
  dietType: DietTypeSchema,
  flagE471: z.boolean(),
  flagGelatin: z.boolean(),
  flagCarmine: z.boolean(),
  flagBonePhosphate: z.boolean(),
  flagShellac: z.boolean(),
  strictUndisclosedMode: z.boolean(),
});

export const CacheRecordSchema = z.object({
  product: ProductSchema,
  cachedAt: z.string(),
});

export const HistorySchema = z.array(ProductSchema);

const OFFIngredientSchema = z.object({
  id: z.string(),
  text: z.string(),
  vegan: z.string().optional(),
  vegetarian: z.string().optional(),
});

export const OFFProductSchema = z.object({
  code: z.string(),
  status: z.number(),
  status_verbose: z.string().optional(),
  product: z
    .object({
      product_name: z.string().optional(),
      product_name_en: z.string().optional(),
      brands: z.string().optional(),
      image_url: z.string().optional(),
      image_front_url: z.string().optional(),
      ingredients_text: z.string().optional(),
      ingredients_text_en: z.string().optional(),
      ingredients: z.array(OFFIngredientSchema).optional(),
    })
    .nullish(),
});

export const OFFSearchSchema = z.object({
  count: z.number(),
  products: z
    .array(
      z.object({
        code: z.string(),
        product_name: z.string().optional(),
        brands: z.string().optional(),
        image_url: z.string().optional(),
        ingredients_text: z.string().optional(),
      })
    )
    .nullish(),
});

export type ParsedProduct = z.infer<typeof ProductSchema>;

/** PRD Sec 28/36: canonical snake_case cloud verification contract. */
export const CanonicalStatusSchema = z.enum([
  'vegetarian',
  'non_vegetarian',
  'source_dependent',
  'source_undisclosed',
  'unknown',
]);

export const WorkerVerdictSchema = z.object({
  overall_status: CanonicalStatusSchema,
  ingredients: z.array(
    z.object({
      code: z.string().optional(),
      name: z.string(),
      status: CanonicalStatusSchema,
    })
  ),
  manufacturer_disclosure: z.object({
    disclosed: z.boolean(),
    origin_claim: z.enum(['plant', 'animal', 'mixed']).nullable(),
    snippets: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
  evidence: z.array(
    z.object({
      source_title: z.string(),
      source_url: z.string().optional(),
      snippet: z.string(),
    })
  ),
  explanation: z.string(),
});
