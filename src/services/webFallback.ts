import { DietaryPreferences, Product, VerdictStatus, VerificationEvidence } from '../types';
import { evaluateIngredients } from './ingredientEngine';
import {
  fetchJsonWithTimeout,
  fetchProductByBarcode,
  isValidBarcode,
  searchOpenFoodFacts,
} from './openFoodFacts';
import { verifyViaWorker, workerVerdictToProduct } from './verification';
import {
  PRODUCT_CACHE_TTL_MS,
  sqliteGetVerification,
  sqliteSaveVerification,
} from '../database/sqlite';

export type FallbackSource =
  | 'open_food_facts'
  | 'open_food_facts_search'
  | 'cloud_worker'
  | 'web_search'
  | 'label_text'
  | 'none';

export type OriginClaim = 'plant' | 'animal' | 'mixed' | null;

export interface ManufacturerDisclosure {
  disclosed: boolean;
  signals: string[];
  originClaim: OriginClaim;
  snippets: string[];
}

export interface FallbackResolution {
  product: Product;
  source: FallbackSource;
  disclosure: ManufacturerDisclosure;
}

export interface FallbackInput {
  barcode?: string;
  name?: string;
  brand?: string;
  prefs?: Partial<DietaryPreferences>;
}

const WEB_TIMEOUT_MS = 8000;
const MAX_SNIPPET = 600;

const PLANT_CLAIM_PATTERNS: RegExp[] = [
  /100\s?%\s?(plant|vegetarian|veg\b)/i,
  /plant[\s-]?based/i,
  /from vegetable (fat|oil)/i,
  /vegetable origin/i,
  /suitable for vegetarians?/i,
  /certified vegetarian/i,
  /veg logo/i,
  /green dot/i,
  /no animal (ingredients|derivatives|products)/i,
];

/** Explicit origin claims — these alone count as "disclosed" (PRD Sec 48 #3). */
const ANIMAL_CLAIM_PATTERNS: RegExp[] = [
  /contains (beef|pork|gelatin|gelatine|egg|eggs)/i,
  /animal (fat|shortening|derivatives)/i,
  /not suitable for vegetarians?/i,
  /contains animal (fat|product|derived)/i,
];

/**
 * Bare origin signals (ingredient names only). Presence of an ingredient is
 * NOT a manufacturer disclosure — it only hints at a claimed origin.
 */
const ANIMAL_ORIGIN_SIGNALS: RegExp[] = [
  /\btallow\b/i,
  /\blard\b/i,
  /carmine|cochineal/i,
  /shellac/i,
  /bone phosphate/i,
  /whey powder/i,
  /\begg (albumen|white|yolk|powder)\b/i,
  /\b(ovalbumin|mayonnaise)\b/i,
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function truncate(text: string, max = MAX_SNIPPET): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function isHttpsUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value);
}

/**
 * Inspects a block of manufacturer / web text for source-disclosure signals.
 * Returns whether the maker discloses the origin, which origin is claimed,
 * and the exact snippets backing that call — never inferred silently.
 */
export function checkManufacturerDisclosure(text: string): ManufacturerDisclosure {
  const haystack = text.slice(0, 8000);
  const animalHaystack = haystack.replace(
    /\b(?:eggless|egg[\s-]?free|vegan|plant[\s-]?based|dairy[\s-]?free)\s+(?:mayonnaise|egg|milk|butter|cheese|cream)s?\b/gi,
    ' '
  );
  const plantHits = PLANT_CLAIM_PATTERNS.filter((re) => re.test(haystack)).map((re) => re.source);
  const animalHits = ANIMAL_CLAIM_PATTERNS.filter((re) => re.test(animalHaystack)).map((re) => re.source);
  const animalSignals = ANIMAL_ORIGIN_SIGNALS.filter((re) => re.test(animalHaystack)).map((re) => re.source);

  const snippets: string[] = [];
  for (const re of [...PLANT_CLAIM_PATTERNS, ...ANIMAL_CLAIM_PATTERNS, ...ANIMAL_ORIGIN_SIGNALS]) {
    const m = haystack.match(re);
    if (m && m.index !== undefined) {
      const start = Math.max(0, m.index - 60);
      const snippet = truncate(haystack.slice(start, m.index + m[0].length + 80));
      if (!snippets.includes(snippet)) snippets.push(snippet);
      if (snippets.length >= 4) break;
    }
  }

  const hasPlantClaim = plantHits.length > 0;
  const hasAnimalEvidence = animalHits.length > 0 || animalSignals.length > 0;
  let originClaim: OriginClaim = null;
  if (hasPlantClaim && !hasAnimalEvidence) originClaim = 'plant';
  else if (hasAnimalEvidence && !hasPlantClaim) originClaim = 'animal';
  else if (hasPlantClaim && hasAnimalEvidence) originClaim = 'mixed';

  return {
    // Only explicit claim language counts as disclosure; a listed ingredient
    // name is a possibility signal, never proof of what the maker used.
    disclosed: hasPlantClaim || animalHits.length > 0,
    signals: [
      ...plantHits.map((s) => `plant:${s}`),
      ...animalHits.map((s) => `animal:${s}`),
      ...animalSignals.map((s) => `signal:${s}`),
    ],
    originClaim,
    snippets,
  };
}

function extractIngredientSection(text: string): string {
  const m = text.match(/ingredients?\s*[:\-–]\s*([^]{20,1500})/i);
  if (!m) return '';
  const section = m[1].split(/\n\s*\n/)[0];
  return section.slice(0, 1500).trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');
}

interface WebResearch {
  ingredientText: string;
  combinedText: string;
  evidence: VerificationEvidence[];
}

interface SourcePull {
  texts: string[];
  evidence: VerificationEvidence[];
  officialUrl?: string;
}

async function researchWikipedia(query: string): Promise<SourcePull> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const { status, json } = await fetchJsonWithTimeout(url, {}, WEB_TIMEOUT_MS, 0);
    if (status >= 200 && status < 300 && typeof json === 'object' && json !== null) {
      const page = json as Record<string, unknown>;
      const extract = typeof page.extract === 'string' ? page.extract : '';
      const canonical =
        typeof page.content_urls === 'object' && page.content_urls !== null
          ? ((page.content_urls as Record<string, unknown>).desktop as Record<string, unknown> | undefined)
          : undefined;
      const sourceUrl = canonical && isHttpsUrl(canonical.page) ? canonical.page : undefined;
      if (extract) {
        return {
          texts: [extract],
          evidence: [
            {
              id: `ev-web-wiki-${Date.now()}`,
              sourceTitle: typeof page.title === 'string' ? `Wikipedia — ${page.title}` : 'Wikipedia',
              sourceUrl,
              date: today(),
              snippet: truncate(extract),
              confidenceScore: 55,
              verdict: 'unknown',
            },
          ],
        };
      }
    }
  } catch {
    // Wikipedia miss — fall through to the next source.
  }
  return { texts: [], evidence: [] };
}

async function researchDuckDuckGo(query: string, barcode?: string): Promise<SourcePull> {
  try {
    const ddgQuery = barcode ? `${query} ${barcode} ingredients` : `${query} ingredients`;
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(ddgQuery)}&format=json&no_html=1&skip_disambig=1`;
    const { status, json } = await fetchJsonWithTimeout(url, {}, WEB_TIMEOUT_MS, 0);
    if (status >= 200 && status < 300 && typeof json === 'object' && json !== null) {
      const data = json as Record<string, unknown>;
      const abstract = typeof data.AbstractText === 'string' ? data.AbstractText : '';
      const abstractUrl = isHttpsUrl(data.AbstractURL) ? (data.AbstractURL as string) : undefined;
      const texts: string[] = [];
      const evidence: VerificationEvidence[] = [];
      if (abstract) {
        texts.push(abstract);
        evidence.push({
          id: `ev-web-ddg-${Date.now()}`,
          sourceTitle: 'Web search summary',
          sourceUrl: abstractUrl,
          date: today(),
          snippet: truncate(abstract),
          confidenceScore: 45,
          verdict: 'unknown',
        });
      }
      const topics = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
      for (const topic of topics.slice(0, 3)) {
        if (typeof topic === 'object' && topic !== null) {
          const t = topic as Record<string, unknown>;
          if (typeof t.Text === 'string' && t.Text.length > 40) {
            texts.push(t.Text);
          }
        }
      }
      return { texts, evidence, officialUrl: abstractUrl };
    }
  } catch {
    // DDG miss — continue with whatever we have.
  }
  return { texts: [], evidence: [] };
}

async function researchManufacturerPage(officialUrl: string): Promise<SourcePull> {
  if (/wikipedia\.org|duckduckgo\.com/i.test(officialUrl)) return { texts: [], evidence: [] };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEB_TIMEOUT_MS);
    try {
      const response = await fetch(officialUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'VegTrace-Mobile/1.0.0 (vegtrace-app)' },
      });
      if (response.ok) {
        const html = await response.text();
        const text = stripHtml(html.slice(0, 20000));
        const section = extractIngredientSection(text);
        const texts = section ? [section, text.slice(0, 4000)] : [text.slice(0, 4000)];
        return {
          texts,
          evidence: [
            {
              id: `ev-web-mfr-${Date.now()}`,
              sourceTitle: 'Manufacturer / reference page',
              sourceUrl: officialUrl,
              date: today(),
              snippet: truncate(section || text.slice(0, 400)),
              confidenceScore: section ? 70 : 40,
              verdict: 'unknown',
            },
          ],
        };
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Manufacturer page unreachable — evidence so far still stands.
  }
  return { texts: [], evidence: [] };
}

async function researchProductOnWeb(query: string, barcode?: string): Promise<WebResearch> {
  // Independent structured sources run concurrently; only the manufacturer
  // page depends on DDG's official URL.
  const [wiki, ddg] = await Promise.all([
    researchWikipedia(query),
    researchDuckDuckGo(query, barcode),
  ]);
  const evidence: VerificationEvidence[] = [...wiki.evidence, ...ddg.evidence];
  const texts: string[] = [...wiki.texts, ...ddg.texts];

  if (ddg.officialUrl) {
    const mfr = await researchManufacturerPage(ddg.officialUrl);
    evidence.push(...mfr.evidence);
    texts.unshift(...mfr.texts);
  }

  const combinedText = texts.join('\n').slice(0, 8000);
  return {
    ingredientText: extractIngredientSection(combinedText),
    combinedText,
    evidence,
  };
}

function buildVerdict(
  evaluation: ReturnType<typeof evaluateIngredients>,
  evidence: VerificationEvidence[],
  verdict: VerdictStatus
): VerificationEvidence[] {
  return evidence.map((item) => ({ ...item, verdict }));
}

function verificationCacheId(barcode: string, dietType: string): string {
  return `verify:${barcode}:${dietType}`;
}

async function readCachedResolution(
  barcode: string,
  dietType: string
): Promise<FallbackResolution | null> {
  const cached = await sqliteGetVerification(verificationCacheId(barcode, dietType));
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached.payload) as Partial<FallbackResolution>;
    if (
      parsed.product &&
      parsed.source &&
      parsed.disclosure &&
      typeof parsed.product === 'object'
    ) {
      return parsed as FallbackResolution;
    }
  } catch {
    // Corrupt payload — treat as a cache miss.
  }
  return null;
}

function isCacheable(resolution: FallbackResolution): boolean {
  if (resolution.source === 'web_search') {
    return resolution.product.verdict !== 'unknown';
  }
  return resolution.source !== 'none';
}

async function cacheResolution(resolution: FallbackResolution, cacheId: string): Promise<void> {
  try {
    const now = Date.now();
    await sqliteSaveVerification({
      id: cacheId,
      productId: resolution.product.id,
      payload: JSON.stringify({
        product: resolution.product,
        source: resolution.source,
        disclosure: resolution.disclosure,
      }),
      verifiedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + PRODUCT_CACHE_TTL_MS).toISOString(),
    });
  } catch {
    // Cache is best-effort; research must never fail because of it.
  }
}

/**
 * Full resolution pipeline for the app's core promise:
 * Product → Ingredients → E-number identification → Known origin →
 * Manufacturer disclosure → Evidence → Verdict + confidence.
 *
 * 0. Local 30-day verification cache (PRD Sec 30: research once, reuse).
 * 1. Open Food Facts by barcode (authoritative, structured).
 * 2. Open Food Facts keyword search (same product, different listing).
 * 3. Public web research (Wikipedia + web search + manufacturer page):
 *    only an explicit ingredient-list section is evaluated; generic prose
 *    never becomes the label, and unknown is never upgraded to vegetarian.
 */
export async function resolveProductWithFallback(input: FallbackInput): Promise<FallbackResolution | null> {
  const { barcode, name, brand, prefs = {} } = input;
  const cleanBarcode = (barcode || '').trim();
  const query = [brand, name].filter(Boolean).join(' ').trim() || cleanBarcode;
  if (!cleanBarcode && !query) return null;
  const dietKey = prefs.dietType || 'strict_vegetarian';

  // Step 0 — cached research for this barcode + diet (30-day TTL).
  if (cleanBarcode && isValidBarcode(cleanBarcode)) {
    const cached = await readCachedResolution(cleanBarcode, dietKey);
    if (cached) return cached;
  }

  // Step 1 — authoritative OFF barcode lookup.
  if (isValidBarcode(cleanBarcode)) {
    const offProduct = await fetchProductByBarcode(cleanBarcode, prefs);
    if (offProduct && offProduct.rawIngredientText) {
      const resolution: FallbackResolution = {
        product: offProduct,
        source: 'open_food_facts',
        disclosure: checkManufacturerDisclosure(
          `${offProduct.name} ${offProduct.brand} ${offProduct.rawIngredientText}`
        ),
      };
      if (isCacheable(resolution)) {
        await cacheResolution(resolution, verificationCacheId(cleanBarcode, dietKey));
      }
      return resolution;
    }
  }

  // Step 2 — OFF keyword search fallback.
  if (query.length >= 2) {
    const results = await searchOpenFoodFacts(query.slice(0, 120), prefs);
    const withIngredients = results.find((p) => p.rawIngredientText && p.rawIngredientText.length > 10);
    if (withIngredients) {
      const resolution: FallbackResolution = {
        product: withIngredients,
        source: 'open_food_facts_search',
        disclosure: checkManufacturerDisclosure(
          `${withIngredients.name} ${withIngredients.brand} ${withIngredients.rawIngredientText}`
        ),
      };
      if (isCacheable(resolution) && cleanBarcode && isValidBarcode(cleanBarcode)) {
        await cacheResolution(resolution, verificationCacheId(cleanBarcode, dietKey));
      }
      return resolution;
    }
  }

  // Step 2.5 — Cloudflare verification worker (only when configured).
  const workerVerdict = await verifyViaWorker({
    barcode: cleanBarcode || undefined,
    name: name || undefined,
    brand: brand || undefined,
  });
  if (workerVerdict) {
    const product = workerVerdictToProduct(workerVerdict, {
      barcode: cleanBarcode || undefined,
      name: name || undefined,
      brand: brand || undefined,
    });
    return {
      product,
      source: 'cloud_worker',
      disclosure: {
        disclosed: workerVerdict.manufacturer_disclosure.disclosed,
        signals: [],
        originClaim: workerVerdict.manufacturer_disclosure.origin_claim,
        snippets: workerVerdict.manufacturer_disclosure.snippets,
      },
    };
  }

  // Step 3 — public web research fallback.
  if (query.length >= 2) {
    const research = await researchProductOnWeb(query.slice(0, 120), cleanBarcode || undefined);
    const disclosure = checkManufacturerDisclosure(research.combinedText);
    // Only an explicit ingredient-list section may be scored. Generic web
    // prose (encyclopedia facts about a food category) must never become
    // the product's label (PRD Sec 28).
    const evaluation = evaluateIngredients(research.ingredientText, prefs, { sourcePenalty: 10 });
    const idBase = cleanBarcode && /^\d+$/.test(cleanBarcode) ? cleanBarcode : `web-${Date.now()}`;

    const product: Product = {
      id: idBase,
      barcode: cleanBarcode || idBase,
      name: name || query.slice(0, 80) || 'Unlisted Food Product',
      brand: brand || 'Manufacturer Not Stated',
      imageUrl: undefined,
      verdict: evaluation.verdict,
      confidence: evaluation.confidence,
      ingredients: evaluation.ingredients,
      rawIngredientText: research.ingredientText || '',
      summary:
        evaluation.verdict === 'unknown'
          ? `Not found in Open Food Facts and no verifiable ingredient list surfaced on the public web for "${query}". Known ≠ Assumed — paste the label text for a deterministic check.`
          : `${evaluation.summary} Resolved via public web sources; manufacturer disclosure ${disclosure.disclosed ? `found (${disclosure.originClaim || 'see snippets'})` : 'not found'}.`,
      scannedAt: new Date().toISOString(),
      isCachedOffline: false,
    };

    const trail: VerificationEvidence[] = [
      ...buildVerdict(evaluation, research.evidence, evaluation.verdict),
      ...evaluation.ingredients.flatMap((ing) => ing.evidenceTrail || []),
    ];
    if (trail.length > 0 && product.ingredients.length > 0) {
      const shared = trail.slice(0, 2);
      product.ingredients = product.ingredients.map((ing) => ({
        ...ing,
        evidenceTrail: [...(ing.evidenceTrail || []), ...shared],
      }));
    }

    const resolution: FallbackResolution = { product, source: 'web_search', disclosure };
    if (isCacheable(resolution) && cleanBarcode && isValidBarcode(cleanBarcode)) {
      await cacheResolution(resolution, verificationCacheId(cleanBarcode, dietKey));
    }
    return resolution;
  }

  return null;
}
