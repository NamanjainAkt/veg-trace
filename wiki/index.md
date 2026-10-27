# VegTrace Wiki — Index

Source of synthesised truth for the VegTrace Expo codebase. Raw sources (`VegTrace_PRD.md`, `src/`, `app.json`, `package.json`) are inputs; pages here are LLM-owned.

## Pages

- `architecture.md` — actual vs PRD Sec 43 folder architecture, stack, type design
- `issues.md` — master prioritized issue list (Critical → Low), deduplicated across all 6 scans
- `services-logic.md` — ingredientEngine / knowledgeBase / openFoodFacts / storage findings
- `mobile-ui.md` — Expo Router, navigation, design-system, a11y findings
- `security.md` — defensive audit (OWASP Mobile), privacy findings
- `performance.md` — bundle, lists, images, network, memory findings
- `testing.md` — coverage gaps + reliability checklist status
- `prd-gaps.md` — PRD Phase 1–8 table + missing modules (auth, OCR, i18n, verification)
- `log.md` — chronological scan / ingest log

## Project snapshot (2026-10-04 full scan)

- Stack: Expo ~52.0.49, RN 0.76.9, expo-router ~4.0.17, TS strict, AsyncStorage (no SQLite/Zustand/Query/Zod/i18n)
- Routes: `src/app/` 13 files; PRD-missing: `(auth)/login`, `scan/barcode|ingredients|processing`
- Services: `ingredientEngine.ts`, `knowledgeBase.ts` (18 additives), `openFoodFacts.ts`, `storage.ts`
- Tests: 0 files, no runner, no test script
- Artifacts in repo root: `VegTrace-release.apk` (~81MB), `stitch_vegtrace_design_system_ui/`, `node_modules/`, `.expo/` untracked (0 commits)

## How to use

1. Start here, then drill into the page matching your task.
2. After any non-trivial change, update the relevant page + append to `log.md`.
3. `issues.md` is the backlog source — pick Critical first.
