# VegTrace — Product Requirements Document (PRD)

## 1. Product Definition

**Working name:** VegTrace

**Core promise:**  
Scan a packaged food product and understand whether its ingredients are vegetarian, animal-derived, source-dependent, or undisclosed.

The product should not blindly label a product as vegetarian/non-vegetarian. It should trace:

Product → Ingredients → E-number / INS identification → Known origin → Manufacturer disclosure → Evidence → Verdict + confidence.

### Core principle

> **Known ≠ assumed.**

If an ingredient can come from either plants or animals and the manufacturer has not disclosed the source, the app should report **Source Undisclosed / Suspicious**, not automatically vegetarian or non-vegetarian.

---

# 2. Goals

## MVP Goals

- Scan product barcode.
- Scan ingredient label using camera.
- OCR ingredients locally.
- Identify products using Open Food Facts.
- Parse ingredient text.
- Identify E-numbers / INS numbers.
- Match ingredients against a knowledge base.
- Detect source-dependent ingredients.
- Search public manufacturer/product information when verification is required.
- Generate structured evidence.
- Provide a clear verdict.
- Save scan history.
- Support Google OAuth through Appwrite.
- Work offline for the local knowledge base and previously cached products/results.
- Keep server and AI costs extremely low.

## Non-Goals for MVP

Do not build:

- Social network.
- Product marketplace.
- Grocery delivery.
- Nutrition tracking.
- Full medical/allergy system.
- Custom large language model.
- Google Lens clone.
- General-purpose web crawler.

---

# 3. Core Verdict System

Use five states rather than only green/red.

| Status | Meaning |
|---|---|
| 🟢 Vegetarian | No identified animal-derived ingredient |
| 🔴 Non-Vegetarian | Evidence indicates an animal-derived ingredient |
| 🟡 Source Dependent | Ingredient can have plant/animal origins |
| 🟠 Source Undisclosed | Relevant source information is not disclosed |
| ⚪ Unknown | Insufficient evidence |

### Example

**E471 — Mono- and diglycerides of fatty acids**

Possible sources:
- Plant
- Animal

Manufacturer source:
- Not disclosed

Result:

> 🟠 SOURCE UNDISCLOSED

**Important:** "Suspicious" must never automatically mean "non-vegetarian".

---

# 4. High-Level Architecture

```text
                    ┌───────────────────┐
                    │ React Native Expo │
                    └─────────┬─────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
              Barcode                    Camera
                 │                         │
                 ↓                         ↓
          Open Food Facts              OCR Engine
                 │                         │
                 └────────────┬────────────┘
                              ↓
                    Product Resolver
                              ↓
                   Ingredient Parser
                              ↓
                 Local Knowledge Engine
                              ↓
                    Is verification
                       required?
                       /       \
                     NO         YES
                     ↓           ↓
                  Result     Cloudflare Worker
                                  │
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
                 OFF API      Web Search     Appwrite
                    │             │
                    └──────┬──────┘
                           ↓
                    AI Structurer
                           ↓
                    Evidence Engine
                           ↓
                     Appwrite Cache
                           ↓
                      Mobile App
```

---

# 5. Technology Decisions

## Mobile

Use:

- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind
- TanStack Query
- Zustand
- Zod
- SQLite

### Decision

Expo is the primary mobile framework. Keep the normal scan path client-first so the app does not depend on a continuously running backend.

---

# 6. UI / Design System

Use the supplied Airbnb-inspired design system as the visual source of truth.

## Design Principles

- White canvas.
- Deep near-black ink.
- One primary accent.
- Soft rounded surfaces.
- Modest typography.
- Generous but controlled whitespace.
- Minimal elevation.
- Photography/product imagery carries visual weight.
- Avoid excessive dashboard styling.

The source design system defines a pure-white canvas, `#222222` ink, Rausch `#FF385C` as the primary accent, soft rounded shapes, and a single main elevation tier.

## Product-specific semantic colors

The primary brand remains Rausch. Add semantic status colors only where necessary:

```text
Vegetarian       → green
Non-Vegetarian   → red
Source-dependent → amber
Unknown          → neutral
```

Do not turn the whole interface green/red.

---

# 7. Design Tokens

## Colors

```ts
colors: {
  canvas: "#FFFFFF",
  ink: "#222222",
  body: "#3F3F3F",
  muted: "#6A6A6A",
  mutedSoft: "#929292",

  primary: "#FF385C",
  primaryActive: "#E00B41",
  primaryDisabled: "#FFD1DA",

  surfaceSoft: "#F7F7F7",
  surfaceStrong: "#F2F2F2",

  hairline: "#DDDDDD",
  hairlineSoft: "#EBEBEB",

  error: "#C13515",
}
```

## Typography

Use Inter as the open-source substitute for Airbnb Cereal/Circular.

```text
Display XL    28 / 700
Display LG    22 / 500
Display MD    21 / 700
Display SM    20 / 600

Title MD      16 / 600
Title SM      16 / 500

Body MD       16 / 400
Body SM       14 / 400

Caption       14 / 500
Caption SM    13 / 400
Badge         11 / 600
Micro         12 / 700

Button MD     16 / 500
Button SM     14 / 500
```

## Spacing

```text
2
4
8
12
16
24
32
48
64
```

## Radius

```text
sm      8px
md      14px
full    9999px
```

## Elevation

Use one primary shadow tier. Keep most surfaces flat.

---

# 8. NativeWind Rules

Do not scatter arbitrary Tailwind values throughout the application.

Create a token layer and use semantic classes/components.

Rules:

- Prefer reusable UI components.
- Avoid one-off styling.
- Never hard-code colors in screen components.
- Never hard-code spacing when a design token exists.
- Maintain consistent radius values.
- Maintain minimum 48px primary touch targets.
- Use 40px+ controls for compact interactive elements where appropriate.
- Keep status colors semantic and restrained.

---

# 9. Reusable Component Library

```text
components/
├── Button
├── IconButton
├── Input
├── SearchBar
├── ProductCard
├── IngredientRow
├── IngredientBadge
├── VerdictCard
├── ConfidenceIndicator
├── EvidenceCard
├── SourceCard
├── BarcodeScanner
├── OCRScanner
├── ScanButton
├── BottomSheet
├── Modal
├── Avatar
├── Skeleton
├── EmptyState
└── ErrorState
```

---

# 10. Navigation Architecture

Use Expo Router.

```text
app/
├── _layout.tsx
├── index.tsx
│
├── (auth)/
│   ├── login.tsx
│   └── onboarding.tsx
│
├── (tabs)/
│   ├── _layout.tsx
│   ├── home.tsx
│   ├── history.tsx
│   └── profile.tsx
│
├── scan/
│   ├── index.tsx
│   ├── barcode.tsx
│   ├── ingredients.tsx
│   └── processing.tsx
│
├── product/
│   └── [id].tsx
│
├── ingredient/
│   └── [code].tsx
│
├── verification/
│   └── [id].tsx
│
└── settings/
    ├── index.tsx
    ├── privacy.tsx
    └── about.tsx
```

---

# 11. Screen Map

## Onboarding

```text
Splash
 ↓
Value proposition
 ↓
How scanning works
 ↓
Privacy explanation
 ↓
Google Sign In / Continue without account
```

Do not force authentication before the user gets value.

---

# 12. Home Screen

```text
┌──────────────────────────┐
│ VegTrace          Profile│
│                          │
│ Know what's inside.      │
│                          │
│ ┌──────────────────────┐ │
│ │                      │ │
│ │      Scan Product    │ │
│ │                      │ │
│ └──────────────────────┘ │
│                          │
│ Search a product         │
│ ┌──────────────────────┐ │
│ │ 🔍 Product / barcode │ │
│ └──────────────────────┘ │
│                          │
│ Recent scans             │
│ Product cards            │
│                          │
├──────────────────────────┤
│ Home | History | Profile │
└──────────────────────────┘
```

---

# 13. Scan Screen

Camera-first.

```text
┌──────────────────────────┐
│ ← Scan product           │
│                          │
│      ┌────────────┐      │
│      │            │      │
│      │   CAMERA   │      │
│      │            │      │
│      └────────────┘      │
│                          │
│ Align barcode inside     │
│ the frame                │
│                          │
│ 📷 Scan ingredients      │
│ 🔢 Enter barcode         │
└──────────────────────────┘
```

Automatically attempt barcode detection first.

---

# 14. Product Result Screen

This is the most important screen.

```text
Product image

Brand
Product name

┌─────────────────────────┐
│ 🟢 VEGETARIAN           │
│                         │
│ No animal-derived       │
│ ingredients identified. │
└─────────────────────────┘

Ingredient analysis

✓ Sugar
✓ Wheat flour
⚠ E471

View ingredient details

Evidence
────────────────
Open Food Facts
Manufacturer
Other sources
```

---

# 15. Suspicious / Undisclosed Result

```text
┌─────────────────────────────┐
│ 🟠 SOURCE UNDISCLOSED       │
│                             │
│ E471 was found in this      │
│ product.                    │
│                             │
│ E471 can originate from     │
│ plant or animal fats.       │
│                             │
│ Manufacturer source:        │
│ Not disclosed               │
└─────────────────────────────┘
```

Then show:

- Why this matters
- What we found
- What the manufacturer says
- Sources

---

# 16. Ingredient Detail Screen

```text
E471

Mono- and diglycerides
of fatty acids

Source possibilities

🌱 Plant
🐄 Animal

Vegetarian classification

SOURCE DEPENDENT

Manufacturer disclosure

Not found

Evidence

Open Food Facts
Manufacturer website
Reference source
```

---

# 17. Evidence Screen

Never hide the evidence behind the AI answer.

```text
Verification

Product:
XYZ Chocolate

Ingredient:
E471

Evidence

✓ Open Food Facts
✓ Manufacturer product page
⚠ Manufacturer does not specify source

Last checked:
2 Oct 2026

Confidence:
Medium
```

---

# 18. Search Screen

Support:

- Product name
- Brand
- Barcode
- E-number
- Ingredient

Example:

```text
Search "E471"

→ E471
→ Mono/diglycerides
→ Products containing E471
```

---

# 19. History Screen

```text
Recent scans

🟢 Product A
🟠 Product B
🔴 Product C

2 Oct
1 Oct
29 Sep
```

Store locally first and sync to Appwrite for authenticated users.

---

# 20. Profile Screen

```text
Profile

Google account

Scan history
Saved products

Preferences
Language
Notifications

Privacy
About
Sources & methodology
```

---

# 21. Backend Architecture

## Appwrite

Use Appwrite for:

- Authentication
- Google OAuth
- Database
- User profiles
- Scan history
- Verified product cache
- Ingredient knowledge
- Verification records

## Cloudflare Worker

Use a small Cloudflare Worker as the cloud orchestration layer:

```text
Mobile
 ↓
Cloudflare Worker
 ↓
Open Food Facts
 ↓
Search provider
 ↓
AI structured extraction
 ↓
Appwrite
```

Never put private API keys directly inside the Expo application.

---

# 22. Database Schema

## products

```text
id
barcode
name
brand
image_url
ingredients_text
country
off_id
created_at
updated_at
```

## ingredients

```text
id
code
name
aliases
possible_sources
classification
description
```

## ingredient_sources

```text
id
ingredient_id
source_type
source_name
source_url
origin
confidence
```

## verifications

```text
id
product_id
ingredient_id
status
manufacturer_disclosure
evidence
confidence
verified_at
```

## user_scans

```text
id
user_id
product_id
result
scanned_at
```

---

# 23. Local SQLite Database

Keep these locally:

```text
E-number database
Ingredient mappings
Recent products
Recent scans
Cached verification
Language packs
Translation terminology
```

The app should remain useful without internet.

---

# 24. Product Resolution Flow

### Step 1 — Barcode

```text
Barcode found?
YES
 ↓
Open Food Facts
```

### Step 2 — Product

```text
Product found?
YES → use product data
NO → OCR
```

### Step 3 — Ingredients

```text
Ingredient text available?
YES → parse
NO → request ingredient-panel capture
```

### Step 4 — Extract

```text
E120
E322
E441
E471
...
```

### Step 5

Check local knowledge base.

### Step 6

Only ambiguous ingredients trigger cloud verification.

---

# 25. OCR and Barcode Strategy

The normal path must be on-device.

```text
Camera
 ↓
Barcode detection
 ↓
Open Food Facts
```

If barcode isn't available:

```text
Ingredient camera
 ↓
On-device OCR
 ↓
Text cleanup
 ↓
Ingredient parser
```

Do not upload images by default.

---

# 26. Knowledge Base

Initial knowledge base fields:

```text
E-number / INS number
Name
Aliases
Function
Possible origin
Animal risk
Vegetarian classification
Description
Evidence/reference
```

Example:

```json
{
  "code": "E471",
  "name": "Mono- and diglycerides of fatty acids",
  "possible_sources": ["plant", "animal"],
  "classification": "source_dependent",
  "requires_manufacturer_confirmation": true
}
```

---

# 27. Deterministic Ingredient Engine

The deterministic engine should be responsible for known classifications.

Rules:

### Known animal origin

```text
NON_VEGETARIAN
```

### Known plant/synthetic/mineral origin

```text
VEGETARIAN
```

### Plant OR animal possible

```text
SOURCE_DEPENDENT
```

### Possible animal origin + no manufacturer disclosure

```text
SOURCE_UNDISCLOSED
```

### Insufficient information

```text
UNKNOWN
```

Never convert:

```text
UNKNOWN → VEGETARIAN
```

based only on AI confidence.

---

# 28. AI Rules

AI is a research/evidence structuring layer, not the primary source of truth.

Give the model structured input:

```json
{
  "product": {},
  "ingredients": [],
  "knowledge_base": [],
  "web_evidence": []
}
```

Require structured output:

```json
{
  "overall_status": "source_undisclosed",
  "ingredients": [],
  "manufacturer_disclosure": {},
  "confidence": 0.0,
  "evidence": [],
  "explanation": ""
}
```

Validate output with Zod.

If JSON validation fails:

```text
retry once
→ otherwise fail safely
```

### AI must never:

- Invent sources.
- Invent manufacturer statements.
- Treat search snippets as definitive proof.
- Turn unknown information into a positive classification.
- Hide conflicting evidence.

---

# 29. Web Verification Strategy

Do not attempt to reproduce Google Lens/Google AI Mode.

Use a controlled search pipeline:

```text
Search query generator
        ↓
Search provider
        ↓
Relevant pages
        ↓
Text extraction
        ↓
AI evidence extraction
```

Prioritize:

1. Manufacturer website
2. Manufacturer product/specification page
3. Product packaging
4. Reliable regulatory/reference sources
5. Open Food Facts
6. Reliable secondary sources

Example queries:

```text
"Brand Product E471 source"
"Brand Product E471 vegetable"
"Brand Product E471 animal"
"Brand Product ingredients"
"Brand Product manufacturer FAQ"
```

---

# 30. Verification Cache

Research once and reuse the result.

```text
User A
 ↓
Research Product X + E471
 ↓
Store verification
 ↓
User B
 ↓
Product X
 ↓
Cached verification
```

Recommended initial cache lifetime:

**30 days**

Re-check when:

- Cache expires.
- Product information changes.
- User explicitly requests verification.

---

# 31. Authentication

Support:

## Guest

```text
Scan
Search
View results
```

## Google account

```text
History sync
Saved products
Cross-device access
```

Do not force account creation before scanning.

---

# 32. Privacy

Preferred pipeline:

```text
Camera
 ↓
OCR locally
 ↓
Extract ingredients
 ↓
Discard image
```

Only send structured data to cloud verification when necessary.

Communicate clearly that product images are processed on-device whenever possible.

---

# 33. Internationalization / Multilingual Architecture

## Product Requirement

Hindi must be fully supported in V1.

The architecture must be designed from the beginning to support India's major regional languages and eventually the 22 scheduled Indian languages.

### V1

```text
English
Hindi
```

### Later rollout

Expand based on usage, starting with additional high-demand Indian languages.

---

# 34. Localization Architecture

Use:

- `i18next`
- `react-i18next`

Structure:

```text
src/
└── i18n/
    ├── index.ts
    ├── locales/
    │   ├── en.json
    │   ├── hi.json
    │   ├── bn.json
    │   ├── mr.json
    │   ├── ta.json
    │   ├── te.json
    │   └── ...
    │
    ├── terminology/
    │   ├── ingredients.json
    │   ├── statuses.json
    │   └── categories.json
    │
    └── formatters/
        ├── number.ts
        ├── date.ts
        └── text.ts
```

---

# 35. Language-Neutral Data

Never store localized status values in the database.

Bad:

```json
{
  "status": "शाकाहारी"
}
```

Correct:

```json
{
  "status": "vegetarian"
}
```

The UI translates the canonical identifier.

Example:

```text
vegetarian
 ↓
English → Vegetarian
Hindi   → शाकाहारी
```

---

# 36. Canonical AI Output

AI must return language-neutral structured data:

```json
{
  "status": "source_undisclosed",
  "ingredient": {
    "code": "E471",
    "name": "mono_and_diglycerides"
  },
  "reason": "manufacturer_source_not_disclosed",
  "confidence": "medium"
}
```

Do not ask the AI to produce the final UI text in every language.

---

# 37. Controlled Translation Catalogue

Important UI and ingredient terminology should be human-reviewed and stored as translations.

Example:

```json
{
  "E471": {
    "en": "Mono- and diglycerides of fatty acids",
    "hi": "फैटी एसिड के मोनो और डाइग्लिसराइड्स"
  }
}
```

Status example:

```json
{
  "vegetarian": {
    "en": "Vegetarian",
    "hi": "शाकाहारी"
  },
  "non_vegetarian": {
    "en": "Non-Vegetarian",
    "hi": "मांसाहारी"
  },
  "source_undisclosed": {
    "en": "Source Undisclosed",
    "hi": "स्रोत की जानकारी उपलब्ध नहीं है"
  }
}
```

---

# 38. Translation Model Strategy

Investigate an Indian-language translation model such as **AI4Bharat / IndicTrans2** for the multilingual translation layer.

Do not initially run a large translation model directly inside the mobile app.

Use:

```text
English structured result
        ↓
Translation service/model
        ↓
Hindi / regional language
        ↓
Cache
        ↓
App
```

### Important cost optimization

Translate once and cache permanently.

Do not translate the same canonical content repeatedly.

---

# 39. What Should and Should Not Use AI Translation

## Human-reviewed translations

Use controlled translations for:

- Buttons
- Navigation
- Verdicts
- Status labels
- Core ingredient terminology
- Safety warnings
- Legal/privacy text
- Methodology text

## AI translation

Use primarily for:

- Long explanations
- Ingredient descriptions
- Evidence summaries
- Educational content

Every generated translation should be validated before becoming a permanent canonical translation.

---

# 40. Technical Terminology Display

Do not completely hide international ingredient names.

Example:

```text
E471

Mono- and diglycerides of fatty acids
फैटी एसिड के मोनो और डाइग्लिसराइड्स
```

This gives users:

- International identifier
- English technical term
- Local-language explanation

This is especially useful for E-numbers and INS numbers.

---

# 41. Language Packs and Offline Support

Bundle English and Hindi translations with the app.

For later languages:

```text
App
 ↓
Language selected
 ↓
Language pack available?
 ├── YES → use local pack
 └── NO  → download/cache pack
```

Once downloaded, basic UI should work offline.

---

# 42. Translation Pipeline

```text
                    PRODUCT
                       │
                       ↓
              INGREDIENT ENGINE
                       │
                       ↓
               VERIFICATION
                       │
                       ↓
              CANONICAL JSON
                       │
          ┌────────────┴────────────┐
          │                         │
       Evidence                 Translation
          │                         │
          │                  IndicTrans2 /
          │                  translation model
          │                         │
          └────────────┬────────────┘
                       ↓
                  Appwrite Cache
                       ↓
                  React Native
                       ↓
             User's selected language
```

---

# 43. Final Folder Architecture

```text
src/
│
├── app/
│
├── components/
│   ├── ui/
│   ├── product/
│   ├── ingredient/
│   ├── verification/
│   └── scanner/
│
├── features/
│   ├── auth/
│   ├── scanning/
│   ├── products/
│   ├── ingredients/
│   ├── verification/
│   └── history/
│
├── services/
│   ├── openFoodFacts/
│   ├── appwrite/
│   ├── ocr/
│   ├── barcode/
│   ├── search/
│   ├── ai/
│   └── translation/
│
├── database/
│   ├── sqlite/
│   ├── migrations/
│   └── seed/
│
├── i18n/
│   ├── locales/
│   ├── terminology/
│   └── formatters/
│
├── store/
├── hooks/
├── utils/
├── constants/
├── types/
└── design-system/
    ├── colors.ts
    ├── typography.ts
    ├── spacing.ts
    ├── radius.ts
    └── shadows.ts
```

---

# 44. Implementation Checklist

## Phase 1 — Foundation

- [ ] Create Expo TypeScript project
- [ ] Configure Expo Router
- [ ] Configure NativeWind
- [ ] Add Inter font
- [ ] Create design tokens
- [ ] Create Button
- [ ] Create Input
- [ ] Create Card
- [ ] Create Badge
- [ ] Create Modal/Sheet
- [ ] Create Skeleton
- [ ] Configure Zustand
- [ ] Configure TanStack Query
- [ ] Configure SQLite

## Phase 2 — Authentication

- [ ] Create Appwrite project
- [ ] Configure Google OAuth
- [ ] Implement guest mode
- [ ] Implement authenticated mode
- [ ] Persist session
- [ ] Create profile collection

## Phase 3 — Scanner

- [ ] Camera permissions
- [ ] Barcode detection
- [ ] Barcode validation
- [ ] OCR implementation
- [ ] Ingredient image capture
- [ ] Image preprocessing
- [ ] OCR cleanup
- [ ] Ingredient text parser

## Phase 4 — Open Food Facts

- [ ] Barcode lookup
- [ ] Product lookup
- [ ] Product image retrieval
- [ ] Ingredient retrieval
- [ ] Search fallback
- [ ] API error handling
- [ ] Offline cache

## Phase 5 — Knowledge Base

- [ ] E-number database
- [ ] INS mappings
- [ ] Aliases
- [ ] Source classifications
- [ ] Vegetarian classifications
- [ ] Evidence references
- [ ] Local database seeding
- [ ] E-number parser
- [ ] Ingredient resolver

## Phase 6 — Verification

- [ ] Detect ambiguous ingredients
- [ ] Generate search queries
- [ ] Search manufacturer information
- [ ] Extract evidence
- [ ] AI structured analysis
- [ ] Zod validation
- [ ] Confidence calculation
- [ ] Cache results
- [ ] Expiration system

## Phase 7 — Internationalization

- [ ] Install i18next
- [ ] Build English locale
- [ ] Build Hindi locale
- [ ] Build terminology dictionary
- [ ] Build status translations
- [ ] Build language selector
- [ ] Persist selected language
- [ ] Bundle language packs
- [ ] Add translation service abstraction
- [ ] Integrate IndicTrans2-compatible translation path
- [ ] Add translation caching
- [ ] Add regional languages incrementally

## Phase 8 — UI

- [ ] Onboarding
- [ ] Home
- [ ] Scanner
- [ ] OCR capture
- [ ] Processing
- [ ] Product result
- [ ] Ingredient detail
- [ ] Evidence
- [ ] Search
- [ ] History
- [ ] Profile
- [ ] Settings
- [ ] Language selection
- [ ] Privacy
- [ ] About/methodology

---

# 45. Production Checklist

## Reliability

- [ ] Offline scan works
- [ ] API timeout handling
- [ ] Retry strategy
- [ ] Empty states
- [ ] Loading states
- [ ] OCR failure handling
- [ ] Barcode failure handling
- [ ] AI failure handling
- [ ] Invalid JSON handling

## Security

- [ ] No API secrets in Expo
- [ ] Worker validates requests
- [ ] Appwrite permissions configured
- [ ] Database rules tested
- [ ] Rate limiting
- [ ] Abuse protection

## AI

- [ ] AI cannot invent sources
- [ ] Every claim has evidence
- [ ] Unknown remains unknown
- [ ] Confidence is not treated as proof
- [ ] Manufacturer claims are clearly attributed
- [ ] Conflicting evidence is displayed

## Internationalization

- [ ] No hard-coded UI strings
- [ ] No hard-coded localized status values
- [ ] All UI uses translation keys
- [ ] Hindi reviewed
- [ ] Long Hindi strings tested
- [ ] Font supports all selected scripts
- [ ] RTL-ready architecture for Urdu
- [ ] Date/number formatting localized
- [ ] Technical terms retain E/INS identifiers

## UX

- [ ] Major touch targets ≥48px
- [ ] Accessible text
- [ ] Screen-reader labels
- [ ] Camera permission explanation
- [ ] Clear errors
- [ ] No unnecessary login wall

---

# 46. MVP Acceptance Test

The MVP is complete when this works end-to-end:

```text
User
 ↓
Opens app
 ↓
Scans biscuit
 ↓
Barcode detected
 ↓
Open Food Facts
 ↓
Ingredients retrieved
 ↓
E-numbers detected
 ↓
Local knowledge database checked
 ↓
Ambiguous E471 detected
 ↓
Manufacturer verification requested
 ↓
Evidence collected
 ↓
Structured result
 ↓
🟠 SOURCE UNDISCLOSED
 ↓
User can inspect WHY
 ↓
User switches to Hindi
 ↓
Same result is presented in Hindi
```

The normal scan path must not require a paid backend.

---

# 47. Cost Strategy

Target architecture:

```text
React Native / Expo       ₹0
Native OCR                ₹0
Barcode scanning           ₹0
SQLite                     ₹0
Open Food Facts            ₹0*
Appwrite                   ₹0 initially*
Cloudflare Worker          ₹0 initially*
Google OAuth               ₹0
Local knowledge base       ₹0
Language packs             ₹0
```

The potentially variable cost is web search / AI verification.

Therefore:

> **AI/web search is an exception path, not the default scan path.**

The exact free-tier limits and service terms must be checked before production deployment.

---

# 48. Product Principles

1. **Known ≠ assumed.**
2. **Evidence > AI confidence.**
3. **Manufacturer disclosure is different from ingredient possibility.**
4. **Unknown must remain unknown.**
5. **Source-dependent must not be automatically classified as non-vegetarian.**
6. **AI structures evidence; it does not invent evidence.**
7. **Barcode/OCR should happen locally whenever possible.**
8. **Cache expensive verification.**
9. **Canonical data stays language-neutral.**
10. **English and Hindi are first-class V1 languages.**
11. **Technical ingredient identifiers remain visible across languages.**
12. **Privacy-first: don't upload product images unless necessary.**
13. **Guest users should receive core value without creating an account.**
14. **The UI should feel like a polished consumer product, not an AI dashboard.**

---

# 49. Final Technical Decision

```text
Mobile
→ React Native + Expo + TypeScript
→ Expo Router
→ NativeWind
→ TanStack Query
→ Zustand
→ SQLite

Authentication
→ Appwrite
→ Google OAuth

Database
→ SQLite locally
→ Appwrite remotely

Product data
→ Open Food Facts

Barcode
→ On-device

OCR
→ On-device

Ingredient intelligence
→ Local deterministic knowledge base

Web verification
→ Cloudflare Worker
→ Search provider
→ Manufacturer/reference pages

AI
→ Small structured-output model
→ Only for ambiguous evidence synthesis

Translation
→ i18next
→ English + Hindi in V1
→ Controlled terminology catalogue
→ IndicTrans2-compatible translation layer for scalable Indian-language support
→ Translation cache

Deployment
→ Expo/EAS
→ Cloudflare Worker
→ Appwrite
```

---

# 50. Core MVP Philosophy

The app is not fundamentally an "AI app".

It is:

```text
                KNOWLEDGE ENGINE
                       +
              PRODUCT DATABASE
                       +
               LOCAL SCANNER
                       +
              EVIDENCE SEARCH
                       +
              SMALL AI LAYER
                       +
              MULTILINGUAL UI
```

That is why a production-quality MVP is realistic.

The real moat is not the OCR or the AI model. It is the **ingredient-origin knowledge base + manufacturer disclosure database + evidence/caching system + transparent classification methodology**.

---

## Recommended build order

```text
1. Design system
        ↓
2. Home + scanner UI
        ↓
3. Barcode + Open Food Facts
        ↓
4. Local ingredient/E-number engine
        ↓
5. Product result screen
        ↓
6. SQLite/offline cache
        ↓
7. Appwrite + Google auth
        ↓
8. Verification Worker
        ↓
9. AI evidence structuring
        ↓
10. Evidence UI
        ↓
11. English i18n
        ↓
12. Hindi i18n
        ↓
13. Translation/cache architecture
        ↓
14. Production testing
        ↓
15. Additional Indian languages
```

*Source note: the design-system portions above are based on the Airbnb design-system specification you supplied, including its color, typography, spacing, component, elevation, and responsive rules.*
