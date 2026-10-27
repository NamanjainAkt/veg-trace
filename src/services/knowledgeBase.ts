import { OriginType, VerdictStatus } from '../types';

/** Real build date of the bundled taxonomy — surfaced as evidence provenance. */
export const KNOWLEDGE_BASE_BUILD_DATE = '2026-10-27';

export interface AdditiveDefinition {
  code: string; // e.g. "E471"
  insNumber: string; // e.g. "471"
  name: string;
  aliases: string[];
  possibleOrigins: OriginType[];
  defaultVerdict: VerdictStatus;
  requiresDisclosure: boolean;
  function: string;
  description: string;
  disclosureAdvice: string;
}

export const ADDITIVE_DATABASE: Record<string, AdditiveDefinition> = {
  E471: {
    code: 'E471',
    insNumber: '471',
    name: 'Mono- and diglycerides of fatty acids',
    aliases: [
      'mono and diglycerides',
      'mono- and diglycerides',
      'mono and di-glycerides',
      'mono- and di-glycerides',
      'mono-diglycerides',
      'monoglycerides',
      'diglycerides',
      'monoglyceride',
      'diglyceride',
      'mono and diglyceride',
      'mono- and diglyceride',
      'glyceryl monostearate',
      'glycerol monostearate',
      'ins 471',
      'ins471',
    ],
    possibleOrigins: ['plant', 'animal'],
    defaultVerdict: 'sourceUndisclosed',
    requiresDisclosure: true,
    function: 'Emulsifier and stabilizer',
    description: 'Produced by saponification of fatty acids. Can be derived from vegetable oils (palm, soybean, sunflower) or animal tallow/lard (bovine, porcine).',
    disclosureAdvice: 'Unless packaging explicitly states "100% Plant Origin" or carries a certified Vegetarian/Halal/Kosher emblem, origin cannot be guaranteed.',
  },
  E472: {
    code: 'E472',
    insNumber: '472',
    name: 'Esters of mono- and diglycerides (E472a-f)',
    aliases: [
      'esters of mono- and diglycerides',
      'esters of mono and diglycerides',
      'acetic acid esters of monoglycerides',
      'lactic acid esters of mono- and diglycerides',
      'citric acid esters of mono- and diglycerides',
      'diacetyl tartaric acid esters of mono- and diglycerides',
      'datem',
      'ins 472',
      'ins472',
      'e472a',
      'e472b',
      'e472c',
      'e472d',
      'e472e',
      'e472f',
    ],
    possibleOrigins: ['plant', 'animal'],
    defaultVerdict: 'sourceUndisclosed',
    requiresDisclosure: true,
    function: 'Dough conditioner and emulsifier',
    description: 'Esters formed from mono- and diglycerides. Inherits the dual plant/animal origin of E471.',
    disclosureAdvice: 'Requires manufacturer declaration of plant-based fatty acid precursors.',
  },
  E120: {
    code: 'E120',
    insNumber: '120',
    name: 'Carmine / Cochineal Extract',
    aliases: [
      'carmine',
      'carmines',
      'cochineal',
      'cochineals',
      'carminic acid',
      'natural red 4',
      'crimson lake',
      'ins 120',
      'ins120',
    ],
    possibleOrigins: ['animal'],
    defaultVerdict: 'nonVegetarian',
    requiresDisclosure: false,
    function: 'Natural red food coloring',
    description: 'Crimson pigment obtained by drying and crushing female scale insects (Dactylopius coccus).',
    disclosureAdvice: 'Direct animal origin (insect). Incompatible with vegetarian and vegan diets.',
  },
  E441: {
    code: 'E441',
    insNumber: '441',
    name: 'Gelatin',
    aliases: ['gelatin', 'gelatine', 'gelatins', 'gelatines', 'edible gelatin', 'ins 441', 'ins441'],
    possibleOrigins: ['animal'],
    defaultVerdict: 'nonVegetarian',
    requiresDisclosure: false,
    function: 'Gelling agent and thickener',
    description: 'Derived by boiling animal skins, cartilage, and bones from pigs and cattle.',
    disclosureAdvice: 'Direct slaughterhouse animal byproduct. Non-vegetarian.',
  },
  E542: {
    code: 'E542',
    insNumber: '542',
    name: 'Bone Phosphate',
    aliases: ['edible bone phosphate', 'bone phosphate', 'bone phosphates', 'ins 542', 'ins542'],
    possibleOrigins: ['animal'],
    defaultVerdict: 'nonVegetarian',
    requiresDisclosure: false,
    function: 'Anti-caking agent and mineral supplement',
    description: 'Manufactured directly from defatted, steamed animal bones.',
    disclosureAdvice: 'Direct animal origin. Non-vegetarian.',
  },
  E904: {
    code: 'E904',
    insNumber: '904',
    name: 'Shellac',
    aliases: [
      'confectioner glaze',
      'confectioners glaze',
      "confectioner's glaze",
      'resinous glaze',
      'lac resin',
      'shellac',
      'ins 904',
      'ins904',
    ],
    possibleOrigins: ['animal'],
    defaultVerdict: 'sourceDependent',
    requiresDisclosure: true,
    function: 'Glazing and coating agent',
    description: 'Purified resinous secretion from the female lac insect (Kerria lacca). Acceptable to some lacto-vegetarians, rejected by vegans.',
    disclosureAdvice: 'Insect secretion. Permissible depending on strictness of vegetarian standard.',
  },
  E901: {
    code: 'E901',
    insNumber: '901',
    name: 'Beeswax (White & Yellow)',
    aliases: ['beeswax', 'bees wax', 'beeswaxes', 'cera alba', 'cera flava', 'white beeswax', 'yellow beeswax', 'ins 901', 'ins901'],
    possibleOrigins: ['animal'],
    defaultVerdict: 'sourceDependent',
    requiresDisclosure: true,
    function: 'Glazing agent',
    description: 'Natural wax produced by honey bees. Vegetarian-acceptable for many, non-vegan.',
    disclosureAdvice: 'Bee byproduct.',
  },
  E920: {
    code: 'E920',
    insNumber: '920',
    name: 'L-Cysteine',
    aliases: ['l-cysteine', 'cysteine', 'cysteine hydrochloride', 'l-cysteine hydrochloride', 'ins 920', 'ins920'],
    possibleOrigins: ['animal', 'synthetic'],
    defaultVerdict: 'sourceUndisclosed',
    requiresDisclosure: true,
    function: 'Flour treatment agent and bread improver',
    description: 'Traditionally extracted from duck feathers or pig bristles, though microbial fermentation exists.',
    disclosureAdvice: 'Most industrial bakery L-cysteine comes from poultry feathers unless certified microbial/synthetic.',
  },
  E422: {
    code: 'E422',
    insNumber: '422',
    name: 'Glycerol / Glycerin',
    aliases: ['glycerol', 'glycerols', 'glycerine', 'glycerines', 'glycerin', 'vegetable glycerin', 'vegetable glycerol', 'ins 422', 'ins422'],
    possibleOrigins: ['plant', 'animal', 'synthetic'],
    defaultVerdict: 'sourceDependent',
    requiresDisclosure: true,
    function: 'Humectant and sweetener',
    description: 'Trihydroxy alcohol derived from vegetable fats, animal tallow, or petroleum cracking.',
    disclosureAdvice: 'Look for "Vegetable Glycerin" on label.',
  },
  E631: {
    code: 'E631',
    insNumber: '631',
    name: 'Disodium Inosinate',
    aliases: ['disodium inosinate', 'sodium inosinate', "disodium 5'-inosinate", 'ins 631', 'ins631'],
    possibleOrigins: ['animal', 'plant', 'synthetic'],
    defaultVerdict: 'sourceDependent',
    requiresDisclosure: true,
    function: 'Flavor enhancer (Umami)',
    description: 'Often prepared from meat extract or sardines, but can be synthesized via tapioca starch fermentation.',
    disclosureAdvice: 'Often packaged with MSG (E621). Sourcing depends on manufacturer batch.',
  },
  E1105: {
    code: 'E1105',
    insNumber: '1105',
    name: 'Lysozyme',
    aliases: ['lysozyme', 'lysozymes', 'lysozyme hydrochloride', 'egg lysozyme', 'ins 1105', 'ins1105'],
    possibleOrigins: ['animal'],
    defaultVerdict: 'nonVegetarian',
    requiresDisclosure: false,
    function: 'Preservative and antimicrobial enzyme',
    description: 'Enzyme industrially extracted from chicken egg whites (albumen). Rejected by strict vegetarian, lacto-vegetarian, and vegan standards; accepted in flexible egg-inclusive diets.',
    disclosureAdvice: 'Extracted from chicken eggs. Major allergen in wine and cheese preservation.',
  },
  E322: {
    code: 'E322',
    insNumber: '322',
    name: 'Lecithin (Soy / Sunflower)',
    aliases: ['soy lecithin', 'soy lecithins', 'sunflower lecithin', 'sunflower lecithins', 'soya lecithin', 'lecithin', 'lecithins', 'ins 322', 'ins322'],
    possibleOrigins: ['plant'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Natural emulsifier',
    description: 'Phospholipids extracted almost exclusively from soybeans or sunflower seeds.',
    disclosureAdvice: 'Egg yolk lecithin is rare in commercial packaged foods and legally requires egg allergen warning.',
  },
  E300: {
    code: 'E300',
    insNumber: '300',
    name: 'Ascorbic Acid (Vitamin C)',
    aliases: ['ascorbic acid', 'vitamin c', 'l-ascorbic acid', 'ins 300', 'ins300'],
    possibleOrigins: ['plant', 'synthetic'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Antioxidant and nutrient',
    description: 'Synthesized industrially from glucose via bacterial fermentation.',
    disclosureAdvice: '100% vegetarian compliant.',
  },
  E330: {
    code: 'E330',
    insNumber: '330',
    name: 'Citric Acid',
    aliases: ['citric acid', 'ins 330', 'ins330'],
    possibleOrigins: ['plant', 'synthetic'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Acidity regulator and preservative',
    description: 'Produced by fermentation of sucrose or glucose by Aspergillus niger.',
    disclosureAdvice: '100% vegetarian compliant.',
  },
  E407: {
    code: 'E407',
    insNumber: '407',
    name: 'Carrageenan',
    aliases: ['carrageenan', 'carrageenans', 'irish moss extract', 'irish moss', 'ins 407', 'ins407'],
    possibleOrigins: ['plant'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Vegetable gelling agent',
    description: 'Extracted from edible red seaweeds. Popular gelatin substitute.',
    disclosureAdvice: '100% plant-based.',
  },
  E412: {
    code: 'E412',
    insNumber: '412',
    name: 'Guar Gum',
    aliases: ['guar gum', 'guar gums', 'guar flour', 'ins 412', 'ins412'],
    possibleOrigins: ['plant'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Thickener and stabilizer',
    description: 'Extracted from guar beans (Cyamopsis tetragonoloba).',
    disclosureAdvice: '100% plant-based.',
  },
  E415: {
    code: 'E415',
    insNumber: '415',
    name: 'Xanthan Gum',
    aliases: ['xanthan gum', 'xanthan gums', 'xanthan', 'ins 415', 'ins415'],
    possibleOrigins: ['plant', 'synthetic'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Polysaccharide stabilizer',
    description: 'Fermented by the bacterium Xanthomonas campestris on glucose.',
    disclosureAdvice: '100% vegetarian.',
  },
  E500: {
    code: 'E500',
    insNumber: '500',
    name: 'Sodium Carbonates (Baking Soda)',
    aliases: ['sodium bicarbonate', 'sodium carbonate', 'sodium carbonates', 'baking soda', 'soda ash', 'ins 500', 'ins500', 'ins 500ii', '500ii'],
    possibleOrigins: ['mineral', 'synthetic'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Leavening and raising agent',
    description: 'Mined natural mineral trona or Solvay synthetic process.',
    disclosureAdvice: 'Inorganic mineral salt.',
  },
  E160A: {
    code: 'E160A',
    insNumber: '160a',
    name: 'Carotenes / Beta-Carotene',
    aliases: ['beta-carotene', 'beta carotene', 'carotene', 'carotenes', 'provitamin a', 'ins 160a', 'ins160a'],
    possibleOrigins: ['plant', 'synthetic'],
    defaultVerdict: 'vegetarian',
    requiresDisclosure: false,
    function: 'Natural orange pigment',
    description: 'Extracted from carrots, red palm oil, or synthesized.',
    disclosureAdvice: 'Plant/synthetic carotenoid.',
  },
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  // Hyphen-aware and space-flexible boundaries.
  // Uses a consuming prefix group instead of lookbehind for Hermes compatibility.
  // Optional trailing s/es covers plural label forms ("gelatins", "duck feathers").
  const flexibleNeedle = escapeRegExp(needle).replace(/[\s-]+/g, '[\\s-]+');
  return new RegExp(`(^|[^-\\w])${flexibleNeedle}(?:s|es)?(?![-\\w])`, 'i').test(haystack);
}

/**
 * Searches the Knowledge Base for an additive definition by code or text.
 * Code paths are exact; name/alias paths require whole-word or exact matches
 * so short queries can never non-deterministically match the first entry.
 */
export function lookupAdditive(query: string): AdditiveDefinition | null {
  // Guard: oversized queries (paste accidents) never scan the database.
  if (query.trim().length > 120) return null;
  // Accept display forms such as "E471 / INS 471" by keeping the first code.
  const normalized = query.trim().toUpperCase().split('/')[0].replace(/[\s-]+/g, '');
  if (!normalized) return null;

  if (ADDITIVE_DATABASE[normalized]) return ADDITIVE_DATABASE[normalized];
  const insStripped = normalized.startsWith('INS') ? normalized.slice(3) : normalized;
  if (ADDITIVE_DATABASE[`E${insStripped}`]) return ADDITIVE_DATABASE[`E${insStripped}`];

  const queryLower = query.trim().toLowerCase();
  const queryNormalized = queryLower.replace(/[\s-]+/g, ' ');
  const querySingular = queryNormalized.endsWith('s') ? queryNormalized.slice(0, -1) : queryNormalized;

  for (const item of Object.values(ADDITIVE_DATABASE)) {
    if (
      item.aliases.some((alias) => {
        const aLower = alias.toLowerCase();
        const aNorm = aLower.replace(/[\s-]+/g, ' ');
        const aSingular = aNorm.endsWith('s') ? aNorm.slice(0, -1) : aNorm;
        return (
          aLower === queryLower ||
          aNorm === queryNormalized ||
          aSingular === querySingular
        );
      })
    ) {
      return item;
    }
  }

  // Name search: requires two or more meaningful tokens so a generic single
  // token ("acids") can never silently resolve to an unrelated entry.
  const tokens = queryLower.split(/[\s,]+/).filter((token) => token.length >= 4);
  if (tokens.length >= 2) {
    for (const item of Object.values(ADDITIVE_DATABASE)) {
      const haystack = `${item.name} ${item.aliases.join(' ')}`.toLowerCase();
      if (tokens.every((token) => matchesWholeWord(haystack, token))) return item;
    }
  }

  return null;
}

export interface AdditiveMatch {
  def: AdditiveDefinition;
  /** How the entry matched: prefixed E/INS code vs whole-word name/alias. */
  via: 'code' | 'name';
}

/**
 * Parses raw ingredient text and extracts all identifiable additives/INS codes
 * with match provenance. Coded matches require an E/INS prefix; name matches
 * require whole words, longest alias first — bare numbers never match.
 */
export function extractAdditiveMatches(rawText: string): AdditiveMatch[] {
  const matches: AdditiveMatch[] = [];
  const foundCodes = new Set<string>();
  const push = (def: AdditiveDefinition, via: AdditiveMatch['via']) => {
    if (!foundCodes.has(def.code)) {
      matches.push({ def, via });
      foundCodes.add(def.code);
    }
  };

  const codeRegex = /\b(?:INS|E)\s*[-]?\s*(\d{3,4}[a-z]?)(?:\([i-v]+\))?\b/gi;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(rawText)) !== null) {
    const num = match[1].toUpperCase();
    const def = lookupAdditive(`E${num}`) || lookupAdditive(num);
    if (def) push(def, 'code');
  }

  const pairs: Array<{ def: AdditiveDefinition; alias: string }> = [];
  for (const def of Object.values(ADDITIVE_DATABASE)) {
    for (const alias of def.aliases) {
      pairs.push({ def, alias });
    }
  }
  pairs.sort((a, b) => b.alias.length - a.alias.length);

  for (const { def, alias } of pairs) {
    if (foundCodes.has(def.code)) continue;
    if (matchesWholeWord(rawText, alias)) push(def, 'name');
  }

  return matches;
}

export function extractAdditivesFromText(rawText: string): AdditiveDefinition[] {
  return extractAdditiveMatches(rawText).map((m) => m.def);
}
