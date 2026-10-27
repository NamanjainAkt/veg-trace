# VegTrace 🌱

[![CI](https://github.com/NamanjainAkt/veg-trace/actions/workflows/ci.yml/badge.svg)](https://github.com/NamanjainAkt/veg-trace/actions/workflows/ci.yml)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat&logo=expo)](https://expo.dev)
[![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat&logo=react)](https://reactnative.dev)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?style=flat&logo=vitest)](https://vitest.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **"Known ≠ Assumed"** — Absence of explicit animal disclosures is never proof of vegetarian origin.

**VegTrace** is a privacy-first, on-device food ingredient analysis and verification application built with React Native and Expo. It empowers consumers—especially lacto-vegetarians, vegans, and conscious shoppers—to audit packaged foods with zero guesswork, transparent sourcing trails, and full support for English and Hindi.

---

## 📖 The Core Philosophy

Conventional food scanners frequently make a hazardous assumption: if an ingredient is not recognized or an E-number's source isn't stated on the label, they treat the product as vegetarian.

**VegTrace rejects this assumption.** Under the **Known ≠ Assumed** mandate:
1. Every additive, emulsifier, and derivative is evaluated against a curated biochemical registry.
2. Dual-origin additives (such as **E471 Mono- and diglycerides of fatty acids**) default strictly to **Source Undisclosed** unless positive manufacturer sourcing evidence or plant-origin certifications are present.
3. Unrecognized or unparsed ingredients remain **Unknown** and will never flip an overall verdict to Vegetarian.

---

## 🚦 5-Tier Verdict Taxonomy

Every product and ingredient is classified into one of five deterministic states:

```
                  ┌──────────────────────┐
                  │   Non-Vegetarian     │  Highest Severity (Direct Animal Derivatives)
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │  Source Undisclosed  │  Dual-Origin Additive without Certification
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │   Source Dependent   │  Verified Plant/Animal based on brand/region
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │     Vegetarian       │  Positively Verified Plant / Dairy / Mineral
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │       Unknown        │  Lowest State (Known ≠ Assumed; Needs Evidence)
                  └──────────────────────┘
```

| Verdict State | Description | Example Ingredients |
| :--- | :--- | :--- |
| **Vegetarian** | Verified plant, microbial, dairy, or mineral origin. | Wheat flour, cocoa butter, milk, sugar, E322 (soy lecithin) |
| **Non-Vegetarian** | Positively identified animal derivative or slaughtered source. | Gelatin (E441), carmine (E120), shellac (E904), animal rennet |
| **Source Undisclosed** | Dual-origin ingredient where packaging fails to state plant origin. | E471, E472, glycerin (E422), stearic acid |
| **Source Dependent** | Origin fluctuates based on manufacturer batches, regions, or lines. | E1105 (Lysozyme), commercial whey, enzymes |
| **Unknown** | Unrecognized ingredients or unparsed text. *Never assumes vegetarian.* | Unmapped botanicals, unparsed text chunks |

---

## ✨ Features & Capabilities

- **⚡ Instant Barcode Scanning**:
  - Direct integration with Open Food Facts API with in-flight request deduplication and local memory caching.
- **📷 On-Device Ingredient OCR**:
  - High-performance text extraction using `expo-text-extractor` with multi-shape normalization (handling `string[]`, nested block objects, and line segments).
- **🧪 Additive Knowledge Base**:
  - Comprehensive database covering E-numbers, INS codes, synonyms, plural forms, and biochemical origins.
  - Interactive Additive Dossiers detailing manufacturing processes and common commercial sourcing practices.
- **🛡️ Evidence Verification Trail**:
  - Inspect exact timestamps, manufacturer disclosures, regulatory filings, and transparent empty states (`verification.noEvidence`).
- **📝 Sourcing Inquiries**:
  - File direct inquiries for undisclosed ingredients; inquiries are persisted locally with offline fallback.
- **🔒 Privacy-First Architecture**:
  - Image OCR and analysis occur 100% on-device.
  - Zero camera photos or custom label captures are sent to the cloud.
  - Optional, explicit **Cloud Sync Consent** gate (disabled by default) stored securely in `expo-secure-store`.
  - Automatic **90-day scan history auto-pruning**.
  - Android backup rules explicitly exclude all SQLite databases, AsyncStorage backends, and SecureStore preferences.
- **🌐 Bilingual Localization**:
  - Full native support for English (`en`) and Hindi (`hi`) with dynamic language switching and 100% string key parity.
- **☁️ Cloudflare Worker Edge Fallback**:
  - Privacy-preserving edge worker with fixed-window per-IP rate limiting (30 req/min), input caps (8,000 chars), and strict `private, max-age=0, no-store` caching.

---

## 🛠️ Architecture & Tech Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                      VegTrace Mobile App                     │
   │               (React Native 0.86 / Expo SDK 57)              │
   ├──────────────────────────────┬───────────────────────────────┤
   │          UI Layer            │         Core Logic            │
   │  • Expo Router (Tabs/Stack)  │  • Deterministic Engine       │
   │  • Lucide React Native       │  • OCR Normalizer             │
   │  • i18next (English & Hindi) │  • Knowledge Base Registry    │
   ├──────────────────────────────┼───────────────────────────────┤
   │         Local Data           │        External Layer         │
   │  • Expo SQLite Cache         │  • Open Food Facts API        │
   │  • Expo SecureStore          │  • Cloudflare Worker Edge     │
   │  • Zustand State Stores      │  • Appwrite Auth (Optional)   │
   └──────────────────────────────┴───────────────────────────────┘
```

- **Framework**: [Expo SDK 57](https://expo.dev) + [React Native 0.86](https://reactnative.dev)
- **Routing**: [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching & Cache**: [TanStack Query v5](https://tanstack.com/query) + In-memory deduplicators
- **Local Storage**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- **Validation**: [Zod v4.6.7](https://zod.dev)
- **Testing**: [Vitest](https://vitest.dev)
- **Edge Worker**: [Cloudflare Workers](https://workers.cloudflare.com/) + TypeScript

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+ (LTS recommended)
- [npm](https://www.npmjs.com/) v10+
- [Android Studio & SDK](https://developer.android.com/studio) (for local Android development/builds)
- [JDK 17](https://learn.microsoft.com/en-us/java/openjdk/download) (`JAVA_HOME` configured)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NamanjainAkt/veg-trace.git
   cd veg-trace
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (optional for local mock/guest mode):
   ```env
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_APPWRITE_DATABASE_ID=vegtrace
   ```

---

## 💻 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm start` | Starts the Expo development server / Metro bundler |
| `npm run android` | Starts Metro and boots the application on an Android emulator or connected device |
| `npm run typecheck` | Runs the TypeScript compiler (`tsc --noEmit`) to verify types |
| `npm test` | Runs the Vitest test suite in single-run mode |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm audit --audit-level=high` | Audits dependencies for high/critical security vulnerabilities |

---

## 🧪 Testing & Verification

VegTrace maintains 100% test passing rates across core calculation modules, OCR normalization, and storage rules:

```bash
# Run unit & integration tests
npm test

# Run TypeScript typecheck
npm run typecheck
```

Current test suites:
- `ingredientEngine.test.ts` (Dietary preferences, egg detection, dairy alternatives, allowlist filtering)
- `knowledgeBase.test.ts` (Additive lookup, INS codes, synonyms, plural forms)
- `normalize.test.ts` (OCR block, array, and string sanitization)
- `storage.test.ts` (90-day history auto-pruning, inquiry persistence, consent storage)
- `webFallback.test.ts` (Edge heuristics and origin signals)
- `schemas.test.ts` & `appwriteMappers.test.ts` (Data contracts and DTO mappers)

---

## 📱 Building the Production APK

To assemble a signed release Android APK locally:

```bash
cd android
.\gradlew.bat assembleRelease --console=plain
```

The compiled APK will be output to:
```text
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🤝 Contributing & Guidelines

1. **Maintain "Known ≠ Assumed"**: Never introduce heuristics that default ambiguous or unknown items to vegetarian without explicit proof.
2. **Localization Parity**: Any new user-facing strings must have matching entries in both `src/i18n/locales/en.json` and `src/i18n/locales/hi.json`.
3. **Keep CI Clean**: Ensure `npm run typecheck`, `npm test`, and `npm audit --audit-level=high` pass before opening a Pull Request.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
