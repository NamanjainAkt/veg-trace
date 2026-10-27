# Architecture — Actual vs PRD

## Actual `src/` tree

```text
src/
├── app/              # 13 routes: _layout, index, (auth)/onboarding, (tabs)/home|history|profile|_layout,
│                     #   scan/index, product/[id], ingredient/[code], verification/[id], settings/index|privacy|about
├── components/       # ui/ (9), product/ (3), ingredient/ (1), verification/ (2), scanner/ (1), forms/ (3)
├── design-system/    # colors.ts (incl. verdicts), typography.ts, spacing.ts (incl. radius/shadows), index.ts
├── mocks/            # products.ts (5 products + mockE471Ingredient)
├── services/         # ingredientEngine.ts, knowledgeBase.ts (18 additives), openFoodFacts.ts, storage.ts
└── types/            # index.ts (re-exports VerdictStatus from colors)
```

## PRD Sec 43 expects (missing)

```text
features/auth|scanning|products|ingredients|verification|history/  — MISSING
services/openFoodFacts|appwrite|ocr|barcode|search|ai|translation/ — FLAT (4 files, no subdirs)
database/sqlite|migrations|seed/                                    — MISSING (AsyncStorage instead)
i18n/locales|terminology|formatters/                                — MISSING (0/12 items, no Hindi)
store/ hooks/ utils/ constants/                                     — MISSING
design-system/radius.ts verdicts.ts shadows.ts                      — FOLDED into spacing.ts / colors.ts
```

## Stack: PRD mandate vs installed

| PRD Sec 5/49 | Status |
|---|---|
| Expo + TS + Router | DONE |
| NativeWind | MISSING (StyleSheet only, no tailwind config) |
| TanStack Query | MISSING (raw fetch) |
| Zustand | MISSING (useState + AsyncStorage per screen) |
| Zod | MISSING (type assertions + bare JSON.parse) |
| SQLite | MISSING (AsyncStorage JSON blobs) |
| Appwrite + Google OAuth | MISSING (guest-only) |
| i18next (en+hi) | MISSING (hardcoded English) |
| Inter font | MISSING (fontWeight only) |
| Cloudflare Worker + AI structurer | MISSING |

## Type design flaw

`VerdictStatus = keyof colors.verdicts` (`colors.ts:86`) re-exported by `types/index.ts:1` — domain depends on presentation (layer inversion). Keys are camelCase (`sourceUndisclosed`) but PRD canonical AI/DB values are snake_case (`source_undisclosed`, Sec 28/36). `OriginType` includes `'multiple'` used once. `ScanHistoryItem` denormalizes `Product` instead of `{productId, result}`. `settings/index.tsx:56` re-lists verdict labels with emojis (drift source).

## Data flow today

```text
scan/index (barcode live | photo→manual modal | manual barcode)
 → openFoodFacts.fetch (no timeout/retry/validation) → evaluateIngredients (defaults, prefs ignored in search path)
 → storage.saveScanProduct (history ≤50, cache unbounded, mocks seeded) → product/[id] renders
```

No Worker, no search-query generator, no AI structurer, no 30-day TTL, no Appwrite sync.

## Fix order (cheapest first)

1. `zod` → validate OFF + prefs + cache
2. `zustand` → prefs/history store (kill DEFAULT_PREFERENCES duplication)
3. `@tanstack/react-query` → OFF caching/dedupe
4. `expo-sqlite` → migrate off AsyncStorage; fix false SQLite copy
5. `i18next` en+hi with snake_case canonical keys
6. `features/` + `store/hooks/database/i18n` shells (strangler-fig, keep services/ as-is)
