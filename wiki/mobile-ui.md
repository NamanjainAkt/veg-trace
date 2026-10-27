# Mobile UI (mobile-developer scan)

Files: `src/app/**`, `src/components/**`, `src/design-system/**`, `app.json`, `package.json`, PRD Sec 6–20.

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
