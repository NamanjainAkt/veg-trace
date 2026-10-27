import {
  IngredientItem,
  Product,
  VerdictStatus,
  DietaryPreferences,
  VerificationEvidence,
} from '../types';
import {
  extractAdditiveMatches,
  lookupAdditive,
  AdditiveDefinition,
  KNOWLEDGE_BASE_BUILD_DATE,
} from './knowledgeBase';
import { DEFAULT_PREFERENCES } from '../constants/preferences';

export interface EvaluationResult {
  verdict: VerdictStatus;
  confidence: number;
  ingredients: IngredientItem[];
  summary: string;
  flaggedReasons: string[];
}

export interface EvaluationOptions {
  sourcePenalty?: number;
}

export const MAX_INGREDIENT_TEXT_LENGTH = 8000;

const ANIMAL_KEYWORDS = [
  'beef', 'pork', 'chicken', 'lamb', 'mutton', 'fish', 'tuna', 'salmon',
  'gelatin', 'gelatine', 'lard', 'tallow', 'carmine',
  'cochineal', 'rennet', 'pepsin', 'animal fat', 'animal shortening',
  'crushed insects', 'isinglass', 'anchovy', 'duck feather',
];

const DAIRY_KEYWORDS = [
  'milk', 'cheese', 'butter', 'ghee', 'whey', 'casein', 'curd', 'cream', 'yogurt',
];

/** Longest first so the most specific egg term wins a single row. */
const EGG_KEYWORDS = [
  'egg albumen', 'ovalbumin', 'egg white', 'egg yolk', 'egg powder',
  'dried egg', 'liquid egg', 'whole egg', 'mayonnaise', 'albumen',
  'ovomucin', 'ovotransferrin', 'egg',
];

/**
 * Animal byproducts that mainstream lacto/strict vegetarian standards accept
 * but 100% plant-based diets reject. Kept separate from meat keywords so the
 * vegan toggle matches the profile copy ("honey, beeswax, shellac").
 */
const ANIMAL_BYPRODUCT_KEYWORDS = [
  'honey', 'royal jelly', 'propolis', 'beeswax', 'bees wax',
];

const KEYWORD_ALLOWLIST: Record<string, string[]> = {
  beef: ['beefsteak tomato'],
  chicken: ['chicken of the woods'],
  fish: ['fish mint'],
  milk: [
    'milk thistle', 'coconut milk', 'coconut-milk', 'soy milk', 'soy-milk',
    'soya milk', 'soya-milk', 'almond milk', 'almond-milk', 'oat milk', 'oat-milk',
    'rice milk', 'rice-milk', 'cashew milk', 'cashew-milk', 'hemp milk', 'hemp-milk',
    'pea milk', 'pea-milk', 'flax milk', 'flax-milk', 'hazelnut milk', 'hazelnut-milk',
    'macadamia milk', 'macadamia-milk', 'pistachio milk', 'pistachio-milk',
    'plant milk', 'plant-milk', 'plant-based milk', 'plant based milk',
    'dairy-free milk', 'dairy free milk', 'vegan milk', 'non-dairy milk', 'nondairy milk',
  ],
  curd: [
    'curdlan', 'bean curd', 'tofu curd', 'soy curd', 'plant curd', 'vegan curd',
  ],
  cream: [
    'cream of tartar', 'tartaric acid cream', 'coconut cream', 'oat cream', 'soy cream',
    'almond cream', 'cashew cream', 'rice cream', 'vegan cream', 'plant cream',
    'plant-based cream', 'dairy-free cream', 'dairy free cream',
  ],
  butter: [
    'cocoa butter', 'cacao butter', 'shea butter', 'peanut butter',
    'almond butter', 'cashew butter', 'sunflower butter', 'apple butter',
    'cookie butter', 'coconut butter', 'soy butter', 'walnut butter',
    'hazelnut butter', 'pistachio butter', 'seed butter', 'nut butter',
    'plant butter', 'plant-based butter', 'plant based butter',
    'vegan butter', 'dairy-free butter', 'dairy free butter', 'non-dairy butter',
  ],
  cheese: [
    'vegan cheese', 'plant cheese', 'plant-based cheese', 'plant based cheese',
    'dairy-free cheese', 'dairy free cheese', 'non-dairy cheese',
    'cashew cheese', 'soy cheese', 'almond cheese', 'coconut cheese',
  ],
  yogurt: [
    'vegan yogurt', 'plant yogurt', 'plant-based yogurt', 'plant based yogurt',
    'dairy-free yogurt', 'dairy free yogurt', 'non-dairy yogurt',
    'coconut yogurt', 'soy yogurt', 'almond yogurt', 'oat yogurt', 'cashew yogurt',
  ],
  egg: [
    'eggplant', 'egg plant', 'egg fruit', 'eggfruit',
    'eggless', 'egg-free', 'egg free', 'vegan egg', 'vegan mayonnaise',
    'egg substitute', 'egg replacer',
  ],
  mayonnaise: [
    'eggless mayonnaise', 'vegan mayonnaise', 'plant-based mayonnaise',
  ],
};

const PLANT_DISCLOSURE_SIGNALS = [
  'plant origin',
  'from vegetable fat',
  'vegetable origin',
  '100% vegetarian',
  '100% veg',
  'certified vegetarian',
  'veg logo',
  'green dot',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskPhrases(text: string, phrases: string[]): string {
  let masked = text;
  for (const phrase of phrases) {
    masked = masked.replace(new RegExp(escapeRegExp(phrase), 'gi'), ' ');
  }
  return masked;
}

function containsKeyword(textLower: string, keyword: string): boolean {
  // First mask generic plant-based modifier phrases
  let searchable = textLower
    .replace(/\b(?:plant[\s-]?based|dairy[\s-]?free|vegan|non[\s-]?dairy)\s+(?:milk|butter|cheese|cream|yogurt|curd)s?\b/gi, ' ')
    .replace(/\b(?:eggless|egg[\s-]?free|vegan)\s+(?:mayonnaise|egg)s?\b/gi, ' ');

  const allowlist = KEYWORD_ALLOWLIST[keyword] || [];
  if (allowlist.length > 0) {
    searchable = maskPhrases(searchable, allowlist);
  }
  // Optional trailing s/es keeps plural label forms ("duck feathers", "eggs") detectable.
  return new RegExp(`\\b${escapeRegExp(keyword)}(?:s|es)?\\b`, 'i').test(searchable);
}

function detectLabelPlantDisclosure(textLower: string): boolean {
  return PLANT_DISCLOSURE_SIGNALS.some((signal) => textLower.includes(signal));
}

/**
 * Deterministic Ingredient Evaluation Engine complying with PRD Section 27.
 * Applies the core principle: "Known ≠ Assumed".
 * Unknown stays unknown: absence of recognized ingredients is never
 * treated as proof of vegetarian origin.
 */
export function evaluateIngredients(
  rawText: string,
  userPreferences: Partial<DietaryPreferences> = {},
  options: EvaluationOptions = {}
): EvaluationResult {
  const prefs = { ...DEFAULT_PREFERENCES, ...userPreferences };
  const textClean = rawText.slice(0, MAX_INGREDIENT_TEXT_LENGTH).trim();

  if (!textClean) {
    return {
      verdict: 'unknown',
      confidence: 30,
      ingredients: [],
      summary: 'No ingredients could be detected or parsed.',
      flaggedReasons: ['Missing ingredient panel data'],
    };
  }

  const ingredientsList: IngredientItem[] = [];
  const flaggedReasons: string[] = [];
  if (rawText.trim().length > MAX_INGREDIENT_TEXT_LENGTH) {
    flaggedReasons.push(
      `Ingredient text truncated at ${MAX_INGREDIENT_TEXT_LENGTH} characters; later ingredients were not analyzed.`
    );
  }
  const textLower = textClean.toLowerCase();
  const labelDisclosesPlant = detectLabelPlantDisclosure(textLower);

  // 1. Extract coded additives (E-numbers / INS)
  const additiveMatches = extractAdditiveMatches(textClean);

  for (const { def: additive, via } of additiveMatches) {
    let verdict: VerdictStatus = additive.defaultVerdict;
    let manufacturerDisclosed = !additive.requiresDisclosure;

    if (additive.requiresDisclosure) {
      if (labelDisclosesPlant) {
        // Symmetric disclosure rule: label proof resolves both E471-family
        // (default undisclosed) and E422-family (default dependent) entries.
        verdict = 'sourceDependent';
        manufacturerDisclosed = true;
      } else if (additive.defaultVerdict === 'sourceDependent') {
        verdict = 'sourceUndisclosed';
      }
    }

    // Apply User Preference: vegan diets reject animal-only additives
    // (shellac, beeswax). Dual-origin additives stay sourceUndisclosed.
    if (
      prefs.dietType === 'vegan' &&
      verdict !== 'nonVegetarian' &&
      additive.possibleOrigins.includes('animal') &&
      !additive.possibleOrigins.includes('plant')
    ) {
      verdict = 'nonVegetarian';
      flaggedReasons.push(`${additive.code}: Animal-only origin rejected in vegan mode.`);
    }

    // Flexible diet accepts egg-derived additives (e.g. E1105 Lysozyme)
    if (prefs.dietType === 'flexible' && additive.code === 'E1105') {
      verdict = 'vegetarian';
    }

    // Apply User Preference: Strict Undisclosed Mode
    if (prefs.strictUndisclosedMode && verdict === 'sourceUndisclosed') {
      verdict = 'nonVegetarian';
      flaggedReasons.push(`${additive.code}: Escalated to Non-Veg due to Strict Undisclosed Preference.`);
    }

    // Check specific watchlists
    if (additive.code === 'E471' && prefs.flagE471) {
      flaggedReasons.push('E471 / INS 471 flagged: Dual-origin emulsifier (plant oil or animal tallow).');
    }
    if (additive.code === 'E441' && prefs.flagGelatin) {
      flaggedReasons.push('E441 Gelatin flagged: Animal slaughter byproduct.');
    }
    if (additive.code === 'E120' && prefs.flagCarmine) {
      flaggedReasons.push('E120 Carmine flagged: Pigment from crushed scale insects.');
    }
    if (additive.code === 'E904' && prefs.flagShellac) {
      flaggedReasons.push('E904 Shellac flagged: Insect resinous secretion.');
    }
    if (additive.code === 'E542' && prefs.flagBonePhosphate) {
      flaggedReasons.push('E542 Bone Phosphate flagged: Direct animal origin (steamed bones).');
    }

    const item: IngredientItem = {
      id: `ing-${additive.code.toLowerCase()}`,
      name: additive.name,
      code: `${additive.code} / INS ${additive.insNumber}`,
      verdict,
      origins: additive.possibleOrigins,
      manufacturerDisclosed,
      disclosureText: additive.disclosureAdvice,
      description: additive.description,
      suspiciousReason: verdict === 'sourceUndisclosed'
        ? 'Dual plant or animal origin without manufacturer source certification.'
        : undefined,
      evidenceTrail: [
        {
          id: `ev-${additive.code.toLowerCase()}-1`,
          sourceTitle: 'VegTrace Biochemical Taxonomy Database',
          date: KNOWLEDGE_BASE_BUILD_DATE,
          snippet: additive.description,
          confidenceScore: via === 'code' ? 90 : 78,
          verdict,
        },
      ],
    };

    ingredientsList.push(item);
  }

  // 2. Scan for raw direct animal keywords (word boundaries + allowlist)
  for (const animalKw of ANIMAL_KEYWORDS) {
    if (containsKeyword(textLower, animalKw)) {
      const alreadyIncluded = ingredientsList.some((ing) => ing.name.toLowerCase().includes(animalKw));
      if (!alreadyIncluded) {
        ingredientsList.push({
          id: `ing-animal-${animalKw.replace(/\s+/g, '-')}`,
          name: animalKw.charAt(0).toUpperCase() + animalKw.slice(1),
          verdict: 'nonVegetarian',
          origins: ['animal'],
          manufacturerDisclosed: true,
          description: `Direct animal-derived ingredient: ${animalKw}.`,
          suspiciousReason: 'Slaughterhouse or animal origin.',
        });
        flaggedReasons.push(`Confirmed animal ingredient: ${animalKw}`);
      }
    }
  }

  // 3. Scan for dairy on every diet; verdict depends on the diet type
  const isVegan = prefs.dietType === 'vegan';
  for (const dairyKw of DAIRY_KEYWORDS) {
    if (containsKeyword(textLower, dairyKw)) {
      const alreadyIncluded = ingredientsList.some((ing) =>
        new RegExp(`\\b${escapeRegExp(dairyKw)}\\b`, 'i').test(ing.name)
      );
      if (!alreadyIncluded) {
        ingredientsList.push({
          id: `ing-dairy-${dairyKw}`,
          name: dairyKw.charAt(0).toUpperCase() + dairyKw.slice(1),
          verdict: isVegan ? 'nonVegetarian' : 'vegetarian',
          origins: ['animal'],
          manufacturerDisclosed: true,
          description: isVegan
            ? `Dairy product: ${dairyKw}. Prohibited in 100% vegan diets.`
            : `Dairy product: ${dairyKw}. Suitable for lacto-vegetarians, prohibited for vegans.`,
        });
        if (isVegan) {
          flaggedReasons.push(`Dairy ingredient detected under Vegan mode: ${dairyKw}`);
        }
      }
    }
  }

  // 4. Bee byproducts (honey, beeswax, propolis): vegetarian-acceptable,
  // strictly prohibited for vegan users.
  for (const byproduct of ANIMAL_BYPRODUCT_KEYWORDS) {
    if (!containsKeyword(textLower, byproduct)) continue;
    const alreadyIncluded = ingredientsList.some((ing) => {
      if (new RegExp(`\\b${escapeRegExp(byproduct)}\\b`, 'i').test(ing.name)) return true;
      // Multi-word forms ("bees wax") also dedupe against spaced variants
      // of additive names ("Beeswax (White & Yellow)").
      if (byproduct.includes(' ')) {
        return new RegExp(`\\b${escapeRegExp(byproduct.replace(/\s+/g, ''))}\\b`, 'i').test(ing.name);
      }
      return false;
    });
    if (alreadyIncluded) continue;
    ingredientsList.push({
      id: `ing-byproduct-${byproduct.replace(/\s+/g, '-')}`,
      name: byproduct.charAt(0).toUpperCase() + byproduct.slice(1),
      verdict: isVegan ? 'nonVegetarian' : 'vegetarian',
      origins: ['animal'],
      manufacturerDisclosed: true,
      description: isVegan
        ? `Bee byproduct: ${byproduct}. Prohibited in 100% vegan diets.`
        : `Bee byproduct: ${byproduct}. Accepted by most lacto-vegetarians, not by vegans.`,
    });
    if (isVegan) {
      flaggedReasons.push(`Bee byproduct detected under Vegan mode: ${byproduct}`);
    }
  }

  // 5. Egg: not accepted by strict/lacto-vegetarian or vegan standards; only
  // flexible diets that include egg accept it. One row per label (longest
  // keyword wins), deduped against additive rows.
  const eggAllowed = prefs.dietType === 'flexible';
  for (const eggKw of EGG_KEYWORDS) {
    if (!containsKeyword(textLower, eggKw)) continue;
    const alreadyIncluded = ingredientsList.some(
      (ing) => /egg/i.test(ing.name) || new RegExp(`\\b${escapeRegExp(eggKw)}\\b`, 'i').test(ing.name)
    );
    if (alreadyIncluded) continue;
    ingredientsList.push({
      id: `ing-egg-${eggKw.replace(/\s+/g, '-')}`,
      name: eggKw.charAt(0).toUpperCase() + eggKw.slice(1),
      verdict: eggAllowed ? 'vegetarian' : 'nonVegetarian',
      origins: ['animal'],
      manufacturerDisclosed: true,
      description: eggAllowed
        ? `Egg ingredient: ${eggKw}. Accepted by flexible diets that include egg.`
        : `Egg ingredient: ${eggKw}. Egg is rejected by strict/lacto-vegetarian and vegan standards.`,
    });
    if (!eggAllowed) {
      flaggedReasons.push(`Egg ingredient detected: ${eggKw}`);
    }
    break;
  }

  // 6. Compute overall verdict using PRD Hierarchy:
  // Non-Vegetarian > Source Undisclosed > Source Dependent > Vegetarian > Unknown
  // Vegetarian requires positive evidence — never the absence of matches.
  let overallVerdict: VerdictStatus = 'unknown';

  const hasNonVeg = ingredientsList.some((i) => i.verdict === 'nonVegetarian');
  const hasUndisclosed = ingredientsList.some((i) => i.verdict === 'sourceUndisclosed');
  const hasSourceDependent = ingredientsList.some((i) => i.verdict === 'sourceDependent');

  if (hasNonVeg) {
    overallVerdict = 'nonVegetarian';
  } else if (hasUndisclosed) {
    overallVerdict = 'sourceUndisclosed';
  } else if (hasSourceDependent) {
    overallVerdict = 'sourceDependent';
  } else if (ingredientsList.length > 0) {
    overallVerdict = 'vegetarian';
  }

  // Evidence-derived confidence: coded additive hits weigh more than
  // bare keyword hits; ambiguity and weak web sources reduce it.
  let confidence = 55;
  confidence += Math.min(24, additiveMatches.length * 8);
  if (hasUndisclosed) confidence -= 12;
  if (hasSourceDependent) confidence -= 6;
  if (hasNonVeg) {
    const codedNonVeg = ingredientsList.some(
      (i) => i.verdict === 'nonVegetarian' && Boolean(i.code)
    );
    confidence = Math.max(confidence, codedNonVeg ? 95 : 88);
  }
  if (overallVerdict === 'unknown') confidence = 30;
  if (options.sourcePenalty) confidence -= options.sourcePenalty;
  confidence = Math.max(5, Math.min(98, Math.round(confidence)));

  // Generate human-readable summary
  let summary = '';
  if (overallVerdict === 'nonVegetarian') {
    summary = `Direct animal derivatives identified: ${ingredientsList.filter((i) => i.verdict === 'nonVegetarian').map((i) => i.name).join(', ')}.`;
  } else if (overallVerdict === 'sourceUndisclosed') {
    const ambig = ingredientsList.filter((i) => i.verdict === 'sourceUndisclosed').map((i) => i.code || i.name).join(', ');
    summary = `Contains ${ambig}. Origin is ambiguous: plant or animal fats possible without manufacturer certification. Known ≠ Assumed.`;
  } else if (overallVerdict === 'sourceDependent') {
    const dependent = ingredientsList
      .filter((i) => i.verdict === 'sourceDependent')
      .map((i) => i.code || i.name)
      .join(', ');
    summary = `Contains source-dependent ingredients (${dependent}). Origin may be plant or animal — sourcing verification advised.`;
  } else if (overallVerdict === 'vegetarian') {
    summary = 'All identified ingredients and additives are derived from plant, microbial, dairy, or mineral origins. Vegetarian verified.';
  } else {
    summary = 'Insufficient structured packaging data to verify origin with confidence.';
  }

  return {
    verdict: overallVerdict,
    confidence,
    ingredients: ingredientsList,
    summary,
    flaggedReasons,
  };
}

export { lookupAdditive };
export type { AdditiveDefinition };
