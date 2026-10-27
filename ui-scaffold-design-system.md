# VegTrace UI Scaffold & Design System Plan

## Goal
Build the tokenized design system, reusable component library, and screen layouts for VegTrace according to the Airbnb-inspired PRD specifications and Stitch visual references.

## Tasks
- [x] Task 1: Initialize Expo project with TypeScript, Expo Router, NativeWind/Tailwind, and lucide-react-native -> Verify: `package.json` exists with required packages and clean build configuration.
- [x] Task 2: Create design token architecture (`colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `verdicts.ts`) in `src/design-system/` -> Verify: Tokens export PRD Airbnb palette, Rausch `#FF385C`, `#222222` ink, and 5 verdict states.
- [x] Task 3: Build Core UI primitive components in `src/components/ui/` (`Button`, `IconButton`, `Input`, `SearchBar`, `Badge`, `Card`, `Modal`, `EmptyState`, `Skeleton`) -> Verify: Components support minimum 48px touch targets, dynamic type, and tokenized styling.
- [x] Task 4: Build Domain UI components in `src/components/product/`, `src/components/ingredient/`, and `src/components/verification/` (`VerdictCard`, `ConfidenceIndicator`, `IngredientRow`, `EvidenceCard`, `SourceCard`) -> Verify: Supports all 5 verdict states (🟢 Vegetarian, 🔴 Non-Vegetarian, 🟡 Source Dependent, 🟠 Source Undisclosed, ⚪ Unknown).
- [x] Task 5: Build Mock Fixtures in `src/mocks/` for products (e.g. Biscuit with E471, Gelatin candy, Apple juice) with complete ingredient breakdown and evidence sourcing trail -> Verify: Fixtures provide realistic data matching PRD schemas.
- [x] Task 6: Implement Expo Router navigation hierarchy and Tab screens in `src/app/` (`(tabs)/home.tsx`, `history.tsx`, `profile.tsx`, `(auth)/onboarding.tsx`) matching Stitch visual layouts -> Verify: Navigation tabs render and match PRD Airbnb white canvas + clean spacing.
- [x] Task 7: Implement Detail & Modal screens in `src/app/` (`product/[id].tsx`, `ingredient/[code].tsx`, `verification/[id].tsx`, `scan/index.tsx`, `settings/index.tsx`) with state switchers -> Verify: Screens display Stitch layout hierarchy adapted with PRD tokenized design and 5-state verdict toggling.
- [x] Task 8: Run TypeScript compiler check and mobile UX touch audit -> Verify: Zero TypeScript errors and compliance with 48px touch targets and list virtualization.

## Done When
- [x] Complete reusable component library exists matching PRD Section 9.
- [x] All 11 Stitch reference screen layouts are implemented with PRD Airbnb design tokens.
- [x] All 5 verdict states can be previewed and verified interactively with mock data.
- [x] TypeScript check compiles cleanly with no missing imports or broken props.

## Notes
- Strict adherence to PRD: Rausch `#FF385C` primary brand, `#222222` ink, `#FFFFFF` canvas. No purple/violet.
- Use `FlatList` with `useCallback` for all scrollable lists (never bare `ScrollView` for item collections).
- Stitch designs provide layout, typography hierarchy, and content structure; PRD dictates colors, status taxonomy, and touch targets.
