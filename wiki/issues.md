# Master Issue List (deduplicated, 2026-10-04 scan)

## Critical (fix first — wrong verdicts / data integrity)

- **C1 False-vegetarian on unrecognized text** — `src/services/ingredientEngine.ts:171-173`: empty `ingredientsList` + text>20 chars → `vegetarian/85`. Violates PRD Sec 27 (`UNKNOWN→VEGETARIAN` forbidden). Fix: default to `unknown`.
- **C2 Bare-number aliases match anywhere** — `src/services/knowledgeBase.ts:21+` aliases `'471','120','500',…` via `includes()` (`:281-282`): `"120g"` → E120 Carmine (non-veg), `"1500"` → E500. Fix: delete bare numbers, regex with `\b`, prefix-required.
- **C3 Placeholder text scored as vegetarian** — `src/services/openFoodFacts.ts:81,125`: `'Packaging ingredients pending upload.'` (33 chars) fed to engine → `vegetarian`. Fix: never feed placeholders; propagate `unknown` + `dataMissing`.
- **C4 Missing PRD routes** — `login.tsx`, `scan/barcode|ingredients|processing.tsx` absent; `as any` on every `router.push` (`home.tsx:106,124,167`, `scan/index.tsx:86`) hides it despite `typedRoutes:true`. Fix: add routes or collapse IA + drop casts.
- **C5 History seeded with mocks** — `src/services/storage.ts:25-39`: first launch writes 5 mock products as user scans; read-error also returns mocks. Safety risk (false veg). Fix: seed `[]`, gate samples behind `isSample:true` / `__DEV__`.
- **C6 i18n entirely missing (V1 Hindi mandate)** — no `src/i18n/`, no deps, all strings hardcoded; MVP acceptance test ends with Hindi switch. Fix: `i18next` + `en|hi.json` + snake_case canonical keys.
- **C7 Zero tests, no runner** — 0 `*.test.*`, no jest/vitest/playwright, no `test` script. Core verdict logic untested. Fix: add vitest + engine/KB matrix first.

## High

- **H1 Substring animal keywords, no boundaries** — `ingredientEngine.ts:122-138`: `beef`↔`beefsteak tomato`, `cream`↔`cream of tartar`, `curd`↔`curdlan`. Fix: `\b` regex + allowlist.
- **H2 sourceDependent vs sourceUndisclosed conflation** — `ingredientEngine.ts:157-174` hierarchy lets E904/E422/E631 (`requiresDisclosure:true`) surface as dependent not undisclosed. Fix: runtime `requiresDisclosure && !disclosed → undisclosed`.
- **H3 Magic confidence 85/82/40/98** — `ingredientEngine.ts:177-180`, per-ingredient `95` + static date `2026-09-15`. Fix: evidence-derived scoring.
- **H4 Dairy ignored for default diet** — `ingredientEngine.ts:141-155` only runs for `vegan`; `strict_vegetarian` never detects dairy while summary claims dairy-safe. Plus `Butter origins:['animal'] verdict:'vegetarian'` (`mocks/products.ts:62-65`). Fix: always extract dairy, per-dietType mapping table.
- **H5 No timeout/retry/validation on OFF** — `openFoodFacts.ts:47-51,100-105` no AbortController; `:58,109` no Zod; 500 vs 404 indistinguishable (null/[]). Prefs ignored, `isCachedOffline:false` always, no offline fallback. Fix: 8–10s timeout + 1 retry + Zod + cache fallback + thread prefs.
- **H6 Unencrypted AsyncStorage PII** — `storage.ts` history+prefs plaintext; dietary data = sensitive under DPDP Act. No SecureStore/SQLCipher. Fix: encrypted store + 90-day prune + fix privacy copy (also discloses nothing about OFF/Unsplash sharing, UA leaks repo URL).
- **H7 Unbounded product cache** — `storage.ts:99-111` dual keys (`id`+`barcode`), full-JSON rewrite per save, no 30-day TTL (PRD Sec 30). Fix: LRU cap + `cachedAt/expiresAt`.
- **H8 Bundle waste** — `query-string` unused, `react-dom` in native app (`package.json:18,20`). Fix: uninstall.
- **H9 Lists unvirtualized/unmemoized** — `home.tsx:234-284` nested FlatList + inline renderItem; `product/[id].tsx:114-237` ScrollView+map; 0 `React.memo` repo-wide. Fix: memo + useCallback + virtualization props.
- **H10 Images unoptimized** — bare RN `<Image>`, no `expo-image`, full-res OFF `image_url`, 64px thumbs fetch `?w=600`. Fix: `expo-image` + sized thumbs + prefetch.
- **H11 Search race, no abort/cache** — `openFoodFacts.ts:95-134` + `home.tsx:62-82`: 450ms debounce only, stale overwrites, `page_size=8` no pagination. Fix: AbortController + seq-id + 5-min cache.
- **H12 Expo 52 / RN 0.76.9 EOL + floating ranges** — `lucide ^`, `query-string ^`, no audit CI. Fix: upgrade, pin `~`, add `npm audit` + `expo-doctor` + Dependabot.
- **H13 A11y + touch targets** — chips 34px (`home.tsx:493-501`), modal close 44px, no `accessibilityLabel` on chips/rows/cards. Fix: 48px min, labels + `selected` state.
- **H14 Design-token drift** — hardcoded `#AAAAAA/#000/rgba()` (`scan/index.tsx`, `home.tsx:460`), `#FFE3D3/#A8250A` off-token, radius `lg/xl` vs PRD sm/md/full only. Fix: add overlay/errorActive tokens, remap or amend PRD.
- **H15 Auth/scanner/verification stacks missing** — no Appwrite/OAuth, OCR = photo-discarded manual modal (`scan/index.tsx:100-115`), no query-gen/search/AI/Zod/cache-expiry. See `prd-gaps.md`.
- **H16 False SQLite/scale copy** — `product/[id].tsx:124`, `settings/index.tsx:106`, `privacy.tsx:69` claim SQLite + "6,820 E-numbers (4.2MB)" vs 18-entry memory DB. Fix: reword until `expo-sqlite` lands.
- **H17 DEFAULT_PREFERENCES duplicated** — `ingredientEngine.ts:22` + `storage.ts:11`. Fix: `src/constants/preferences.ts`.
- **H18 Console PII in prod** — `console.warn/error` with barcode/query in OFF/storage/scan paths. Fix: `__DEV__` gate + release strip.

## Medium

- M1 `E920` alias `'e921'` misattributes real E921; `E160A` key/case mismatch (`E160a`) risks dupes.
- M2 `lookupAdditive` `alias.includes(query)` returns first entry containing `a` for short queries.
- M3 Mock-shadowing: `getCachedProduct` checks mocks before cache; prefs merge accepts any `dietType`; `scannedAt:'Just now'` static.
- M4 `SourcingInquiryForm` URL unvalidated + `EvidenceCard Linking.openURL` no allowlist (future stored-XSS/open-redirect).
- M5 Camera auto-prompt on mount; captured frame retained in RAM; debug `usesCleartextTraffic=true` (verify release).
- M6 `Clear Cache`/offline toggle are `useState` only (`settings/index.tsx:29-30`); `Clear All` history has no confirm, no per-item delete, no expiry.
- M7 Dead UI: `Skeleton` never imported; bespoke empty/loading blocks instead of `EmptyState`; missing `BottomSheet/ErrorState/Avatar` (PRD Sec 9).
- M8 No `.ios/.android` variants; `Modal` ignores sheet-vs-dialog divergence; forced-light (`userInterfaceStyle:light` + `StatusBar dark`).
- M9 Startup: `expo-font/splash/asset` installed but `useFonts/SplashScreen/Asset.loadAsync` never called; mocks block first paint.
- M10 `profile.tsx:51-62` async I/O inside state updater + stacked `setTimeout` leak.
- M11 Unbounded label `TextInput` (no `maxLength`) → `O(n·m)` alias scan freezes on 100KB paste.
- M12 No rate-limit/backoff on OFF; `VegTrace-release.apk` + Stitch dump + `node_modules/.expo` in repo (0 commits); `CleartextTraffic` debug-only to verify.

## Low

- L1 Duplicate modal blocks (`home.tsx:302-332` vs `scan/index.tsx:399-423`), offline pill styles re-declared.
- L2 `query-string`/`react-dom` removal also covers web-target decision (`expo start --web`).
- L3 Verdict-type layer inversion note: single source (`colors.verdicts`) is consistent; risk is coupling + casing (see H-casing in architecture.md).
