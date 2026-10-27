# VegTrace Real Dynamic Data & Interactive Forms Plan

## Goal
Implement real dynamic data ingestion from Open Food Facts API, build a comprehensive deterministic ingredient knowledge engine, integrate persistent local storage, and implement functional forms with proper input validation.

## Tasks
- [x] Task 1: Build comprehensive additive Knowledge Base (`src/services/knowledgeBase.ts`) -> Verify: Contains real E-numbers/INS with origins (E471, E120, E441, E904, E322, etc.) and regex extractor.
- [x] Task 2: Build Open Food Facts API service (`src/services/openFoodFacts.ts`) -> Verify: Can fetch real products by barcode (`world.openfoodfacts.org/api/v2/product/{barcode}.json`) and search products with typed output.
- [x] Task 3: Build Deterministic Ingredient Engine (`src/services/ingredientEngine.ts`) -> Verify: Evaluates ingredients and E-numbers into the 5 PRD verdict states (🟢, 🔴, 🟡, 🟠, ⚪) with confidence score calculation.
- [x] Task 4: Build Persistent Storage Service (`src/services/storage.ts`) using AsyncStorage -> Verify: Real scan history and dietary preferences persist across app sessions.
- [x] Task 5: Build Functional Forms (`src/components/forms/`): Manual Barcode Form, Raw Ingredient Text Form, Sourcing Inquiry Form -> Verify: Inputs have proper validation (barcode regex, non-empty, error states) and real-time execution.
- [x] Task 6: Connect Explore Screen & Additive Directory to live search across OFF API and local additive DB -> Verify: Typing in search bar queries live products and E-numbers.
- [x] Task 7: Connect Scan Screen to real barcode lookup & manual input modals -> Verify: Submitting a real barcode (or typing raw ingredients) evaluates and navigates to the real result screen.
- [x] Task 8: Update Product & Ingredient Screens to load live dynamic data with fallback to persistent cache -> Verify: Real Open Food Facts data (Nutella, Oreo, Maggi, etc.) loads with accurate ingredient extraction.
- [x] Task 9: Verify TypeScript and compilation -> Verify: `npx tsc --noEmit` and `npx expo export --platform web` compile with 0 errors.

## Done When
- [x] No dummy data dependency: Real Open Food Facts API calls and deterministic knowledge base evaluations work out of the box.
- [x] Search bar queries real items from OFF API and additive database.
- [x] Manual barcode and raw ingredient text input forms are functional with real validation and evaluation.
- [x] Scan history and user dietary preferences persist across app restarts.
