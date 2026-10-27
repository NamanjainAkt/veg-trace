# Security (security-auditor scan, defensive only)

No hardcoded secrets / `http://` fetch / `eval` found. `encodeURIComponent` correct in both OFF calls. `ManualBarcodeForm` `^\d{8,14}$` + strip-non-numeric is the retain-as-pattern.

## High

- **Unencrypted store** — `storage.ts:27,31,53,101-107`: history + cache + prefs in plaintext AsyncStorage; diet data sensitive under DPDP Act. → `expo-secure-store` (tokens) / SQLCipher-MMKV (history), 90-day prune, document in `privacy.tsx`.

## Medium

- **Unvalidated parse** — `storage.ts:34,78,102,125` + `openFoodFacts.ts:58,109`: `JSON.parse`/`response.json()` cast without Zod; crowdsourced OFF fields rendered + fed to engine. → Zod `Product/DietaryPreferences/OFF` schemas; drop corrupt keys; cap `ingredients_text`.
- **No auth** — guest-only (`profile.tsx:78-80`, `onboarding.tsx:20-22`); PRD Sec 31 Appwrite/OAuth + Sec 45 DB rules absent. → keep guest default; when adding Appwrite use SecureStore sessions + row-level perms + explicit cloud opt-in.
- **Undisclosed sharing + UA leak** — every barcode/search → OFF (+ Unsplash hero); privacy copy claims on-device-only; UA embeds personal GitHub URL (`openFoodFacts.ts:49`). → disclose, single UA with contact email, offline-only opt-out, bundle hero asset.
- **False SQLite/Zero-Upload copy + no pinning/timeout** — `product/[id].tsx:124`, `privacy.tsx:69` claim SQLite; fetch HTTPS (good) but no pinning/timeout/retry. → fix copy, `AbortSignal.timeout(8000)` + 1 retry + offline banner.
- **Linking without allowlist** — `EvidenceCard.tsx:18-22` + `SourcingInquiryForm.tsx:82-90` free-text URL → `openURL`. → `^https://` validation + `canOpenURL` + confirm.

## Low

- Supply chain: Expo 52/RN 0.76.9 EOL, floating `^`, no audit CI → upgrade + `npm audit` + `expo-doctor` + Dependabot + SBOM.
- Search no-abort/race (`home.tsx:62-82`), unbounded label input (add `maxLength={5000}` + `slice(0,8000)`), `console.*` with barcode/query (`__DEV__` gate + release strip).
- Camera auto-prompt on mount (`scan/index.tsx:49-53`); frame discarded but kept in RAM; debug `usesCleartextTraffic=true` (keep debug-only).
- History seeded with mocks + no expiry/confirm (`storage.ts:25-39`, `history.tsx:39-42`) → seed `[]`, `isSample:true` toggle, confirm sheet, per-item delete, `expiresAt`.
