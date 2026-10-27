# Wiki Log

## [2026-10-04] Full codebase scan — 6 parallel specialists
- Agents: mobile-developer, backend-specialist, security-auditor, performance-optimizer, test-engineer, code-archaeologist
- Scope: `src/**` (40 ts/tsx), `app.json`, `package.json`, `VegTrace_PRD.md` Sec 1–50, `prd-real-data-and-forms.md`, `ui-scaffold-design-system.md`
- Output: ~75 deduplicated findings filed into `issues.md` + 7 topic pages. Wiki created (`wiki/` did not exist).
- Top risks: false-vegetarian defaults (engine empty-match + bare-number aliases + placeholder text), mock-seeded history, unencrypted AsyncStorage, zero tests, missing auth/OCR/i18n/verification stack, APK + Stitch dump in repo.

## [2026-10-04] Wiki bootstrapped
- Created `index.md`, `architecture.md`, `issues.md`, `services-logic.md`, `mobile-ui.md`, `security.md`, `performance.md`, `testing.md`, `prd-gaps.md`, `log.md`.

## [2026-10-04] Fix pass 1 — core verdict pipeline + web fallback (no new npm deps)
- `ingredientEngine.ts`: empty/unrecognized text → `unknown` (was false `vegetarian`); word-boundary keywords + allowlist; dairy always extracted with per-diet verdict; `requiresDisclosure` dual-origin without label proof → `sourceUndisclosed`; evidence-derived confidence; input capped 8k; prefs from single `constants/preferences.ts`.
- `knowledgeBase.ts`: bare-number aliases removed; `e921` dropped; `E160A` normalized; exact/whole-word lookup; longest-alias-first extractor.
- `openFoodFacts.ts`: 10s timeout + 1 retry, response guards, EAN validation, prefs threaded, no placeholder-in-engine, ISO timestamps, centralized UA, `__DEV__`-only logs.
- `storage.ts`: history seeds `[]`; JSON guards; prefs validated; 30-day TTL + LRU prune; cache-before-mocks; ISO timestamps; language + cache-clear APIs.
- NEW `services/webFallback.ts`: OFF barcode → OFF search → public web research with E-number parsing + `checkManufacturerDisclosure()`; honest `unknown` with attempt trail. Wired into scan, manual form, product screen.
- UI/copy honesty: SQLite/6,820/OCR claims reworded; real Clear Cache; live additive count; EN/हिं verdict toggle; relative timestamps; https-only evidence links; 48px targets; no auto camera prompt; 1.5s scan cooldown; analyzer 5k cap.
- NEW routes: `scan/barcode|ingredients|processing`, `(auth)/login`; registered in `_layout`.
- Verified: `tsc` clean + engine smoke test green.

## [2026-10-04] Slice pass 2 — tests+Zod, data layer, Hindi UI, OCR+cloud
- Deps: vitest, zod v4, zustand, @tanstack/react-query v5, expo-sqlite, i18next+react-i18next, expo-localization, expo-image-manipulator, expo-text-extractor (SDK52-pinned). Removed unused `query-string`. Scripts: `test`, `test:watch`, `typecheck`.
- Zod: NEW `src/schemas.ts` (Product, prefs, cache, OFF, worker contracts). storage.ts + openFoodFacts.ts validate via safeParse. Tests caught 2 real bugs pre-merge: `500ii-X` batch-code match (now hyphen-aware) + missing `gelatin`/`carmine` KB aliases (added).
- Tests: 32/32 green (`npm test`) — engine matrix, KB, disclosure, format, schemas, OCR cleanup.
- Data: zustand `usePreferencesStore` (hydrated once in _layout, zero-migration write-through) + `useHistoryStore`; react-query `useProductResolution` (cache→OFF→fallback, diet-keyed); SQLite `products`+`verifications` tables with 30-day TTL + LRU-200 + one-time legacy migration; product screen on the hook; settings/history on stores; `tsconfig` excludes `worker/`.
- Hindi: i18next with device-locale detection, persisted choice, full en+hi resources; scan/product/settings/history/privacy/forms/evidence/login migrated. Left: home, profile, onboarding, ingredient/[code], verification/[id], about, tab labels.
- OCR: NEW `services/ocr/` (expo-text-extractor w/ runtime probing + Expo-Go-safe fallback, preprocess downscale, pure cleanup) wired into shutter → direct engine eval; manual entry remains the fallback.
- Cloud: NEW `worker/` (wrangler + deterministic /verify with OFF + disclosure + 30-day edge cache; SEARCH/AI keys marked) + `services/verification.ts` (worker client, null when unconfigured) wired as fallback step 2.5. Deploy: `cd worker && npm i && wrangler secret put … && wrangler deploy`, then set EXPO_PUBLIC_VERIFY_URL.
- Verified: `tsc --noEmit` clean, 32/32 tests green.

## Still open
- App wiring: `react-native-appwrite` SDK + Google OAuth → login stub → profile sync (next slice).
- Encrypted store (SecureStore/SQLCipher); Expo 52 upgrade + CI; dark mode; `as any` typed-route cleanup; worker search-provider + AI structurer keys; APK + Stitch removal (needs user confirm).

## [2026-10-04] Slice pass 3 — remaining Hindi screens + home/product polish
- i18n: NEW namespaces `home/profile/onboarding/ingredient/verification/about/tabs/card` (en+hi). Migrated: tab bar, home (incl. filter chips via id-keyed filters), profile, onboarding, ingredient detail (verdict badge localized via STRINGS), verification (rewrote pipeline stages inside component with t(); dropped fabricated 142/85/12/340/8ms latencies and "Total: 587ms"), about, login (already), ProductCard (memo + a11y label + localized badge/count).
- Profile now runs on `usePreferencesStore` (kills the async-I/O-in-updater double-write + stacked-timer leak; radios/switches typed, no `as any`).
- Home: search threads user prefs (vegans get vegan verdicts), stale-response sequence guard, `__DEV__`-only warnings, history via `useHistoryStore`, memoized header/item, FlatList virtualization props, chips at 48px with radio semantics, modal titles translated.
- Media: `expo-image` (memory-disk cache + transition) in ProductCard, product hero, onboarding hero.
- Verified: `tsc --noEmit` clean, 32/32 tests green.

## [2026-10-04] Appwrite backend provisioned (sgp cloud, project 6ac2…9200546e)
- Via REST (MCP invoke fns not exposed in this session; same calls the MCP would make).
- Database `vegtrace` + collections `profiles` (doc-security on, unique `idx_user`), `products` (`idx_barcode`, fulltext `idx_name`), `verifications` (`idx_product`), `inquiries` (`idx_additive`, `idx_status`).
- Quotas learned: no defaults on required attrs; collection attr-size budget (~64–80KB) → products text sizes trimmed (ingredients 16k, raw 4k, summary 2k, disclosure 2k).
- Smoke test: create → indexed `Query.equal(barcode)` → delete green via node-appwrite SDK (raw-REST shorthand queries 400 on this endpoint — SDK JSON serialization is the supported path).
- `.env` (untracked, no secrets) holds endpoint/project/database IDs; API key stays in console only.
- Manual console step left: Auth → enable Google OAuth provider with a Google Cloud client ID (no API for this).

## [2026-10-04] App wiring — SDK, session, Google login, sync
- Deps: `react-native-appwrite`, `expo-web-browser`, `expo-auth-session` (SDK52-pinned). Scheme `vegtrace` already registered.
- NEW `services/appwrite.ts` (env-driven client, unconfigured-safe), `services/appwriteMappers.ts` (pure, tested), `services/sync.ts` (profile pull/push + shared-cache product upsert, all best-effort), `store/useSessionStore.ts` (hydrate, Google OAuth via system browser + `vegtrace://` redirect, sign-out, sync-now; handles both SDK token shapes and cancellation).
- Login screen: real Google button with graceful states (`not_configured` until you enable the provider, cancelled, failed) + guest path. Profile: shows signed-in account, Sync now with pushed count, sign-out; guests get a sign-in entry point.
- Verified: `tsc --noEmit` clean, 35/35 tests green (incl. 3 mapper tests).

## [2026-10-04] Slice pass 4 — encrypted prefs, CI, hygiene
- Privacy: dietary prefs + language now in encrypted SecureStore (Keychain/Keystore; web/dev fallback), with one-time silent migration from plaintext and schema validation intact. Privacy copy updated (en+hi).
- CI: NEW `.github/workflows/ci.yml` (`npm ci` → typecheck → tests on push/PR).
- Hygiene: deleted `VegTrace-release.apk` (~81MB, regenerable via EAS); `*.apk/*.aab` gitignored.
- Verified: `tsc --noEmit` clean, 35/35 tests green.
