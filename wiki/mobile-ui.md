# Mobile UI (mobile-developer scan)

Files: `src/app/**`, `src/components/**`, `src/design-system/**`, `app.json`, `package.json`, PRD Sec 6–20.

## Motion system (2026-10-28 warm-minimalism pass)

App-wide animation vocabulary now lives in `src/design-system/motion.ts` — every screen consumes it, no ad-hoc timings:

- **Tokens**: `motion = {press:120, fast:150, base:220, slow:300, reveal:380, stagger:35, scanBeam:1600}`; `springs = {settle, snap, reveal}` (Reanimated v4 dampingRatio/duration form); `PRESS_SCALE=0.97` (buttons/cards), `ROW_SCALE=0.985` (full-width rows), `staggerDelay(index, base)` (35ms; usage caps the index so entrance totals stay ≤~350ms).
- **Shared primitives** (exported from `src/components/ui`): `PressableScale` (CSS-transition scale press, accepts PressableProps + `scaleTo`; content styling goes on child elements because the inner `Animated.View` breaks e.g. space-between on PressableScale's own style) and `FadeSlideIn` (fade + 10px-up entrance, reduced-motion aware — never on virtualized rows, container-level only).
- **Warm color layer** in `colors.ts`: peach/peachSoft/peachDeep/terracotta, heroFrom/heroTo (charcoal→warm-terracotta gradient; no purple/violet per brand rule) + `expo-linear-gradient` hero on Home.
- **Trust rule (non-negotiable)**: green/success motion (pulse, celebratory scale) ONLY for positively verified verdicts — vegetarian-only, one 1.05 pulse then settle. Source Undisclosed/Dependent/Unknown/no-evidence states get identical neutral reveals, no green tint, no pulse (no-evidence uses `UnknownAdditiveIllustration` on a neutral surfaceSoft card).
- **Honest progress**: scanner stage copy (`Reading label…` → `Checking ingredient registry…`) only while the real work runs; no fake "Building verdict" on the barcode path.
- **Haptics restraint**: one haptic per action, same frame as the visual — `selectionAsync()` for actual selections (filter chips, diet, language), `impactAsync(Light)` once per committed barcode detection (guarded behind the 1500ms dedupe), none on navigation/switches.
- **Reduced motion**: `useReducedMotion()` gates — FadeSlideIn renders static, scanner beam renders a static line, bracket springs static, verdict pulse/flash skipped.
- **Micro-illustrations** (`src/components/illustrations/Illustrations.tsx`): ScanFirst (history empty), ScanHero (home hero), OfflineShield, UnknownAdditive — one consistent rounded coral/ink-on-peach style, used sparingly, never random decoration.
- Known small i18n gap: continue-row/hero reuses existing strings; `common.continue` and `home.heroTitle` would make them fully localizable.

New deps: `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `expo-haptics`, `expo-linear-gradient` (SDK 57 compatible). Reanimated v4 rules: `.get()/.set()` (never `.value`), `scheduleOnRN` over `runOnJS`, no per-frame setState, no height/width animation.

## Navigation

- Missing routes (Critical): `(auth)/login.tsx`, `scan/barcode|ingredients|processing.tsx` — only `scan/index.tsx` + `(auth)/onboarding.tsx` exist. Either add or collapse IA to `scan/index?mode=`.
- Dead-end onboarding: `app/index.tsx:4-6` hard-redirects to `/(tabs)/home`; both onboarding buttons `replace('/(tabs)/home')` — no first-launch gate, no login.
- `as any` on every `router.push/replace` defeats `typedRoutes:true` — remove casts, let TS catch missing routes.
- Missing PRD components: `BottomSheet`, `ErrorState`, `Avatar` — `Modal` is centered fade only; profile hand-rolls avatar (`profile.tsx:290-298`).

## Design system

- Stack missing: NativeWind/TanStack/Zustand/SQLite/i18n — all `StyleSheet`, `AsyncStorage` + fetch. Amend PRD Sec 5/8 or install.
- Hardcoded colors: `#AAAAAA/#000/#EEE/#D0D0/rgba(0,0,0,.6/.7)` in scan/home; off-token `#FFE3D3` (`SourceCard.tsx:125`), `#A8250A` (`Button.tsx:53`). Add `overlay/scrim`, `errorActive`, `verdicts.sourceUndisclosed.tagBg` tokens.
- Radius drift: `spacing.ts:18-25` adds `lg:20/xl:28/xs:4` vs PRD `sm8/md14/full` only.
- Forced light: `app.json:9` + `_layout.tsx:10` `StatusBar dark`, zero dark tokens/`useColorScheme`.
- No `.ios/.android` variants; `Modal` ignores iOS-sheet vs Android-dialog.

## Lists / images / perf

- `home.tsx:234-284`: nested FlatList in `ListHeaderComponent`, inline renderItem, `ProductCard` unmemoized. Extract memoized rows + `useCallback` + `getItemLayout/removeClippedSubviews/windowSize`.
- `product/[id].tsx:114-237`: `ScrollView`+`map` — convert to FlatList with header.
- All images bare RN `<Image>` (ProductCard, product hero, onboarding Unsplash) — switch to `expo-image` + placeholder + `onError` + sized `?w=` thumbs.
- `EmptyState/Skeleton/Card/ScanButton` exist but unused — home/history/product hand-roll states. Migrate to shared components.
- Duplicate modal/offline-pill code across home + scan (×2 in scan).

## Touch + a11y + i18n

- Chips 34px (`home.tsx:493-501`), modal close 44px, `linkButton`/`modeBtn` under 48px — enforce 48px, keep `hitSlop` supplemental.
- Only `accessibilityRole="button"` — add `accessibilityLabel/hint/state(selected)` to chips, rows, cards, radios.
- All strings hardcoded English; `settings/index.tsx:157` static `EN` badge. Add `i18next` en+hi, keep E/INS codes visible (PRD Sec 40).
