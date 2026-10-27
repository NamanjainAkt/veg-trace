# Services Logic (backend-specialist scan)

Files: `src/services/ingredientEngine.ts`, `knowledgeBase.ts`, `openFoodFacts.ts`, `storage.ts`, `src/types/index.ts`, `src/mocks/products.ts`.

## Verdict engine (`ingredientEngine.ts`)

- Empty-match → `vegetarian` (`:171-173`) — Critical, PRD Sec 27 violation. Only `vegetarian` on positive plant/synthetic/mineral evidence.
- Hierarchy `nonVeg > undisclosed > dependent` (`:157-174`) masks `requiresDisclosure` on E904/E422/E631. Compute `dependent && requiresDisclosure && !disclosed → undisclosed`.
- Confidence `85/82/40/98` (`:177-180`) arbitrary; `hasNonVeg → 98` on weak substring hit. Derive from evidence counts.
- `includes()` keyword scan (`:122-138`) — `beefsteak tomato`, `cream of tartar`, `curdlan`, `milk thistle` false positives. Use `\b` + allowlist.
- Dairy branch dead for default diet (`:141-155`); `strict_vegetarian` semantics undefined; summary (`:192`) claims dairy-safe without detecting it. Always extract dairy; add dietType mapping table.
- Dedupe (`:124`) name-fragile; dairy path has none → duplicate rows.

## Knowledge base (`knowledgeBase.ts`, 18 entries)

- Bare-number aliases + `includes()` (`:279-289`) — `"120g"` → E120, `"1500"` → E500. Remove bare numbers; longest-first `\b` regex; prefix-required numbers.
- `alias.includes(query)` (`:249`) non-deterministic for short queries. Reverse to anchored match.
- `E920` aliases include `'e921'` (`:105`) — wrong additive. `E160A` key vs `E160a` code case mismatch — dupe risk in `foundCodes` Set.
- `codeRegex` (`:265`) itself is sound (`E|INS` + 3–4 digits); the alias path undoes its safety.

## Open Food Facts (`openFoodFacts.ts`)

- No timeout/AbortController/retry (`:47-51,:100-105`) — hangs on flaky networks (PRD Sec 45 violation). Add 8–10s abort + 1 retry; distinguish timeout vs not-found.
- No Zod (`:58,:109`) — trusts crowdsourced `product_name/brands/image_url/ingredients_text`. Add schemas + `safeParse`.
- Placeholder-in-engine (`:81,:125`) — zero-data products render green. Pass `''`/null + `dataMissing`.
- No offline fallback; `isCachedOffline:false` hardcoded; prefs ignored (vegan gets lacto verdicts). Try `getCachedProduct`, thread prefs, set flag truthfully.
- UA inconsistent + personal GitHub URL hardcoded (`:49,:103`); barcode only trimmed (no EAN checksum); legacy `search.pl`, `page_size=8` hardcoded.

## Storage (`storage.ts`)

- Bare `JSON.parse` ×4 (`:34,:78,:102,:125`) — corruption masked by returning mocks (`:37`). Validate with Zod; return `[]`/defaults, keep mocks separate.
- History capped 50 but product cache unbounded, dual keys, no 30-day TTL (PRD Sec 30). Add `cachedAt/expiresAt` + LRU/size cap (~200).
- `getCachedProduct` checks mocks first (shadowing); prefs merge accepts any `dietType`; `scannedAt:'Just now'` static — use ISO + relative format at render.

## Missing stack (see `architecture.md`)

No `zod`, `@tanstack/react-query`, `zustand`, `expo-sqlite`, `appwrite`, `i18next`; no `store/`, `database/`, `services/appwrite|ai|search|translation`, Worker, AI structurer (`overall_status/evidence/confidence` Sec 28), query generator (Sec 29), 30-day verification cache (Sec 30).
