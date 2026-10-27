# Testing (test-engineer scan)

**Baseline: 0 `*.test.*`, 0 `*.spec.*`, 0 `__tests__`, 0 runner configs, no `test` script (`package.json:31-36`).**

## Bring-up

1. Add `vitest + @testing-library/react-native + playwright`; scripts `test`, `test:coverage`.
2. `vitest.config.ts` with `@ → ./src` alias (per `tsconfig.json:6-10`) + expo-router mocks.

## Highest-value test matrix

| Target | Cases |
|---|---|
| `ingredientEngine` empty/threshold/confidence (`:54-62,:171-180`) | `""`→unknown/10, `"water"`→unknown, 21-char benign, `"E471"`→undisclosed/82, `"gelatin"`→nonVeg/98, E471+gelatin→nonVeg wins, snapshot summaries |
| `strictUndisclosedMode` + vegan dairy (`:74-77,:141-155`) | INS471+strict→nonVeg+reason; `"milk"` vegan→nonVeg vs strict_veg→ignored; `"buttermilk"` tokenization pinned |
| `extractAdditivesFromText` (`knowledgeBase.ts:265,278-289`) | `"Net weight 120g"`→no E120; `"471 calories"`→no E471; `INS-471/e 471/E472e` variants; `e921` pinned |
| `lookupAdditive` (`:238-255`) | `E471/e471/" 471 "/INS 471/ins471/E160a` → canonical code |
| `storage.ts:34` (+`:78,:102,:125`) | corrupt JSON→fallback (not mocks); `{}`→schema reject; prefs `{dietType:"pizza"}`→defaults; cache missing `verdict`→null |
| `openFoodFacts.ts:58,109` + `:86-89` | `{status:1}` no product→null; `products:null`→[]; 404→notFound vs 500→serverError (not silent null/[]); offline→cache |
| Timeouts/retry (PRD Sec 45) | >8s aborts; 503→retry→success; `NetInfo` offline short-circuits |
| `scan/index.tsx:91-115` | mocked 500→outage banner (not "not found"); `takePictureAsync` reject→error (not silent modal); double-scan dedupes |
| Forms | barcode strip/paste, 7 vs 15 digits; lookup null→error+fallback; analyzer empty→inline error, success→`saveScanProduct(isCachedOffline:true)` |
| Nav + states | remove `as any` → `tsc --noEmit` passes; `EmptyState`/`Skeleton`/offline-badge render tests |

## Reliability checklist (PRD Sec 45) status

Offline scan, API timeout, retry, OCR/barcode/AI/invalid-JSON handling — all missing. Storage `catch` returns mocks / swallows quota errors, masking corruption.
