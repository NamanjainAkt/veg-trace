# PRD Gaps (code-archaeologist scan, PRD Sec 44)

| Phase | Verdict | Notes |
|---|---|---|
| 1 Foundation | Partial | Done: Expo+TS, Router, tokens, Button/Input/Card Badge Modal Skeleton. Missing: NativeWind, Inter, Zustand, Query, SQLite |
| 2 Auth | Missing | No Appwrite/OAuth/session; only `(auth)/onboarding.tsx`, both buttons → home |
| 3 Scanner | Partial | Perms + live barcode + validation done. No real OCR — `scan/index.tsx:100` discards photo, opens manual modal |
| 4 OFF | Partial | Barcode + search done. Cache = AsyncStorage ≤50, no TTL, no SQLite |
| 5 Knowledge | Partial | 18-entry DB + regex done. Settings claims "6,820 / 4.2MB" — false; 37 animal + 9 dairy keywords only |
| 6 Verification | Missing | Naive confidence only. No query-gen, manufacturer search, AI structurer, Zod, 30-day cache |
| 7 i18n | Missing | 0/12. No `i18n/`, locales, terminology, selector, Hindi |
| 8 UI | Partial | Most screens exist; `scan/barcode|ingredients|processing` collapsed to modals; no language selection |

## Debt highlights

- `stitch_vegtrace_design_system_ui/` (11× html+png, ~19KB+233KB each) — unimported reference dump → `docs/reference/` or gitignore.
- `VegTrace-release.apk` (~81MB) in root → delete, gitignore `*.apk *.aab`, EAS + Releases.
- 0 commits; `node_modules/.expo` present but gitignored — first commit must be curated.
- `query-string` unused; `react-dom` questionable for native-first.
- `Clear Cache`/offline toggle `useState`-only (`settings/index.tsx:29-30`) — wire to `clearScanHistory`/`saveDietaryPreferences`.
- Confidence/evidence hardcoded (`95`, `2026-09-15`, `verification/[id].tsx:50` "SQLite query matched…") — add `verifiedAt/expiresAt`, surface real "last checked".
