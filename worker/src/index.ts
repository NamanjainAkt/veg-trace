/**
 * VegTrace cloud verification worker (PRD Sec 21, 28–30).
 *
 * Mobile → Worker → Open Food Facts → (search provider) → evidence
 * structurer → 30-day edge cache → Mobile. API keys live here, never
 * in the Expo app.
 *
 * v0 is fully deterministic and keyless: OFF lookup + disclosure
 * heuristics + rule-based structurer. Plug a search provider where
 * marked (SEARCH_API_KEY) and a structured-output model where marked
 * (AI_API_KEY) without changing the response contract.
 */

interface Env {
  OFF_BASE_URL: string;
  CACHE_TTL_DAYS: string;
  SEARCH_API_KEY?: string;
  AI_API_KEY?: string;
}

type CanonicalStatus =
  | 'vegetarian'
  | 'non_vegetarian'
  | 'source_dependent'
  | 'source_undisclosed'
  | 'unknown';

interface VerifyRequest {
  barcode?: string;
  name?: string;
  brand?: string;
  ingredientText?: string;
  dietType?: string;
}

// PRD Sec 45 — request validation (dietType mirrors src/schemas.ts DietTypeSchema).
const DIET_TYPES = new Set(['strict_vegetarian', 'lacto_vegetarian', 'vegan', 'flexible']);
const VERIFY_BODY_KEYS = new Set(['barcode', 'name', 'brand', 'ingredientText', 'dietType']);
const BARCODE_PATTERN = /^\d{8,14}$/;
const MAX_INGREDIENT_TEXT_CHARS = 8000;
const MAX_NAME_BRAND_CHARS = 256;

// PRD Sec 45 — fixed-window per-IP rate limiter. In-memory per isolate, so
// production enforcement should also be backed by Cloudflare WAF rate
// limiting rules; this guards against unthrottled bursts at one edge site.
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_TRACKED_IPS = 10_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

// User queries are never publicly cacheable by intermediaries or browsers.
const NO_STORE_HEADERS = { 'Cache-Control': 'private, max-age=0, no-store' };

/** Static error responses — user input is never echoed back. */
function jsonError(
  message: string,
  status: number,
  headers: Record<string, string> = {}
): Response {
  return Response.json(
    { error: message },
    { status, headers: { ...NO_STORE_HEADERS, ...headers } }
  );
}

/** Returns Retry-After seconds when the IP is over budget, else 0. */
function retryAfterForIp(ip: string): number {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    if (rateBuckets.size >= RATE_LIMIT_MAX_TRACKED_IPS) {
      for (const [key, entry] of rateBuckets) {
        if (entry.resetAt <= now) rateBuckets.delete(key);
      }
    }
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return 0;
  }
  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  }
  bucket.count += 1;
  return 0;
}

/** Per-field validation; null means reject with 400 (unknown keys included). */
function validateVerifyBody(body: unknown): VerifyRequest | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const candidate = body as Record<string, unknown>;
  for (const key of Object.keys(candidate)) {
    if (!VERIFY_BODY_KEYS.has(key)) return null;
  }
  const { barcode, name, brand, ingredientText, dietType } = candidate;
  if (barcode !== undefined && (typeof barcode !== 'string' || !BARCODE_PATTERN.test(barcode))) {
    return null;
  }
  if (name !== undefined && (typeof name !== 'string' || name.length > MAX_NAME_BRAND_CHARS)) {
    return null;
  }
  if (brand !== undefined && (typeof brand !== 'string' || brand.length > MAX_NAME_BRAND_CHARS)) {
    return null;
  }
  if (
    ingredientText !== undefined &&
    (typeof ingredientText !== 'string' || ingredientText.length > MAX_INGREDIENT_TEXT_CHARS)
  ) {
    return null;
  }
  if (dietType !== undefined && (typeof dietType !== 'string' || !DIET_TYPES.has(dietType))) {
    return null;
  }
  return candidate as VerifyRequest;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Canonical cache identity (PRD Sec 45): barcode-or-ingredient-text hash
 * plus dietType. Raw user input never lands in the cache key; the Cache
 * API only accepts GET request keys, so a synthetic internal URL is used.
 */
async function buildCacheKey(body: VerifyRequest): Promise<Request> {
  const subject = body.barcode?.trim() || (await sha256Hex(body.ingredientText || ''));
  const digest = await sha256Hex(`${subject}|${body.dietType || 'unspecified'}`);
  return new Request(`https://cache.internal/verify/${digest}`, { method: 'GET' });
}

const PLANT_SIGNALS = [
  /100\s?%\s?(plant|vegetarian|veg\b)/i,
  /plant[\s-]?based/i,
  /from vegetable (fat|oil)/i,
  /suitable for vegetarians?/i,
  /certified vegetarian/i,
  /veg logo/i,
  /green dot/i,
];

const ANIMAL_SIGNALS = [
  /\btallow\b/i,
  /\blard\b/i,
  /gelatin|gelatine/i,
  /carmine|cochineal/i,
  /contains (beef|pork|egg|eggs)/i,
  /animal (fat|derivatives)/i,
  /\b(?:egg albumen|ovalbumin|egg white|egg yolk|egg powder|dried egg|whole egg|mayonnaise)\b/i,
];

const DUAL_ORIGIN_CODES = ['E471', 'E472', 'E920', 'E422', 'E631', 'E904'];
const ANIMAL_CODES = ['E120', 'E441', 'E542', 'E1105'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 60);
  return text.slice(start, index + length + 80).replace(/\s+/g, ' ').trim();
}

async function fetchJson(url: string, ms: number): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VegTrace-Verify-Worker/1.0.0' },
    });
    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }
    return { status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function structureVerdict(ingredientText: string, contextText: string) {
  const text = ingredientText.slice(0, 8000);
  const foundCodes: string[] = [];
  const codeRegex = /\b(?:INS|E)\s*[-]?\s*(\d{3,4}[a-z]?)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(text)) !== null) {
    foundCodes.push(`E${match[1].toUpperCase()}`);
  }

  const plantHit = PLANT_SIGNALS.find((re) => re.test(contextText));
  const isEggless = /\b(?:eggless|egg-free|vegan|eggplant)\b/i.test(contextText);
  const animalHit = ANIMAL_SIGNALS.find((re) => {
    if (/egg|mayonnaise/i.test(re.source) && isEggless) return false;
    return re.test(contextText);
  });
  const disclosed = Boolean(plantHit || animalHit);

  let overall: CanonicalStatus = 'unknown';
  if (foundCodes.some((c) => ANIMAL_CODES.includes(c)) || animalHit) {
    overall = 'non_vegetarian';
  } else if (foundCodes.some((c) => DUAL_ORIGIN_CODES.includes(c))) {
    overall = plantHit ? 'source_dependent' : 'source_undisclosed';
  } else if (text.trim().length > 0 && foundCodes.length > 0) {
    overall = 'vegetarian';
  }

  // AI hook: with AI_API_KEY set, send { text, foundCodes, disclosure }
  // to a structured-output model here and merge its evidence below.
  // Rule-based output below is the safe fallback (fail safely per PRD Sec 28).

  const evidence = [];
  if (plantHit || animalHit) {
    const re = (plantHit || animalHit) as RegExp;
    const m = contextText.match(re);
    if (m && m.index !== undefined) {
      evidence.push({
        source_title: 'Manufacturer disclosure signal',
        snippet: snippetAround(contextText, m.index, m[0].length),
      });
    }
  }

  const confidence =
    overall === 'non_vegetarian' ? 0.9 : overall === 'unknown' ? 0.3 : overall === 'vegetarian' ? 0.8 : 0.7;

  return {
    overall_status: overall,
    ingredients: foundCodes.map((code) => ({
      code,
      name: code,
      status: (ANIMAL_CODES.includes(code)
        ? 'non_vegetarian'
        : DUAL_ORIGIN_CODES.includes(code)
          ? plantHit
            ? 'source_dependent'
            : 'source_undisclosed'
          : 'vegetarian') as CanonicalStatus,
    })),
    manufacturer_disclosure: {
      disclosed,
      origin_claim: plantHit && !animalHit ? 'plant' : animalHit && !plantHit ? 'animal' : animalHit ? 'mixed' : null,
      snippets: evidence.map((e) => e.snippet),
    },
    confidence,
    evidence,
    explanation:
      overall === 'unknown'
        ? 'Insufficient structured data to verify origin. Unknown remains unknown.'
        : `Deterministic classification from E-number taxonomy${disclosed ? ' with manufacturer signals' : ' without manufacturer disclosure'}.`,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true });
    }

    if (request.method !== 'POST' || url.pathname !== '/verify') {
      return jsonError('Use POST /verify', 404);
    }

    // PRD Sec 45 — per-IP rate limit (isolate-local; production should also
    // enforce Cloudflare WAF rate-limiting rules at the zone level).
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const retryAfter = retryAfterForIp(clientIp);
    if (retryAfter > 0) {
      return jsonError('Too many requests', 429, { 'Retry-After': String(retryAfter) });
    }

    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      return jsonError('Invalid JSON', 400);
    }
    const body = validateVerifyBody(parsed);
    if (!body) {
      return jsonError('Invalid request', 400);
    }

    const cache = caches.default;
    const cacheKey = await buildCacheKey(body);
    let cached: Response | null = null;
    try {
      cached = await cache.match(cacheKey);
    } catch {
      cached = null; // Edge cache unavailable — serve fresh.
    }
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: { ...Object.fromEntries(cached.headers), ...NO_STORE_HEADERS },
      });
    }

    // Step 1 — authoritative OFF lookup (never trust client-supplied text alone).
    let ingredientText = body.ingredientText || '';
    let offName = body.name || '';
    let offBrand = body.brand || '';
    const barcode = body.barcode || '';
    if (BARCODE_PATTERN.test(barcode)) {
      try {
        const { status, json } = await fetchJson(
          `${env.OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`,
          8000
        );
        const data = json as {
          status?: number;
          product?: {
            product_name?: string;
            brands?: string;
            ingredients_text?: string;
            ingredients_text_en?: string;
          } | null;
        } | null;
        if (status === 200 && data && data.status === 1 && data.product) {
          ingredientText =
            data.product.ingredients_text || data.product.ingredients_text_en || ingredientText;
          offName = data.product.product_name || offName;
          offBrand = data.product.brands || offBrand;
        }
      } catch {
        // OFF unreachable — continue with client text, marked unknown-leaning.
      }
    }

    // Step 2 — (SEARCH_API_KEY) manufacturer web search goes here.

    const verdict = structureVerdict(ingredientText, `${offName} ${offBrand} ${ingredientText}`);
    const response = Response.json({
      ...verdict,
      product: {
        name: offName.slice(0, MAX_NAME_BRAND_CHARS),
        brand: offBrand.slice(0, MAX_NAME_BRAND_CHARS),
      },
    });
    // Privacy (PRD Sec 32/48): the client-facing response is never publicly
    // cacheable; only the canonical edge entry below carries the TTL.
    response.headers.set('Cache-Control', 'private, max-age=0, no-store');

    const ttlDays = Number.parseInt(env.CACHE_TTL_DAYS || '30', 10) || 30;
    try {
      const cacheEntry = response.clone();
      cacheEntry.headers.set('Cache-Control', `public, max-age=${ttlDays * 24 * 60 * 60}`);
      await cache.put(cacheKey, cacheEntry);
    } catch {
      // Edge cache is best-effort; the fresh response is still returned.
    }
    return response;
  },
};
