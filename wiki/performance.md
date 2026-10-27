# Performance (performance-optimizer scan)

## Bundle

- `query-string@7.1.3` + `react-dom@18.3.1` unused (zero imports in `src/`) — `npm uninstall` (keep `react-dom/web` only if web target real). Use `URLSearchParams`.
- PRD stack absent (NativeWind/Query/Zustand) → hand-rolled AsyncStorage + fetch with no dedupe/cache. Add Query + Zustand or amend PRD.
- `lucide-react-native@0.475` no babel/memo; `_layout.tsx:27-85` 9 static `Stack.Screen`, heavy `scan` (camera) not lazy.

## Lists / render (biggest win)

- 0 `React.memo` repo-wide. `home.tsx:111,234,274-284` nested FlatList + recreated `renderHeader` + closure `renderItem` → every keystroke re-renders all rows. `history.tsx:44,83,131-140` header unmemoized, no virtualization tuning.
- Fix: `React.memo(ProductCard/IngredientRow/VerdictCard/SearchBar/Badge)`, `useCallback` header/item, `removeClippedSubviews windowSize={7} maxToRenderPerBatch={10} initialNumToRender={10} getItemLayout`.
- `product/[id].tsx:114-237` ScrollView+map → FlatList with hero/verdict header.

## Images / network / memory

- 0 `expo-image` hits. Full-res OFF `image_url` in 64px thumbs (`?w=600` at 64×64, hero `w=800` at 200px). → `expo-image` (`memory-disk`, blurhash, `transition`), sized thumbs, `prefetch`/`loadAsync`.
- `searchOpenFoodFacts` no cache/abort — stale overwrites; `page_size=8` no pagination; engine runs sync per result on UI thread. → AbortController map + seq-id + 5-min cache (or React Query) + `onEndReached`.
- `product/[id]` + `scan` double I/O (cache-parse then fetch); scanner guard stale-closure. → request coalescing `Map<barcode,Promise>`, in-memory LRU, 1500ms cooldown + ref guard.
- `cacheProduct` unbounded dual-key + full-JSON rewrite per save (~750KB at 50 products). → LRU 100, `id→Product` + `barcode→id` index, or `expo-sqlite`.
- `mockProducts` bundled + written on first paint (`storage.ts:30-31`, `home.tsx:57-59`). → lazy `require` / asset / `__DEV__` gate.
- No `useFonts/SplashScreen/Asset` coordination (`_layout.tsx:1-89`) → white flash/FOUT. → `preventAutoHideAsync` + hide after warm-up.
- `profile.tsx:51-62` async I/O in updater (StrictMode double-write) + uncleaned `setTimeout`. → compute outside setter, `useRef` cleanup.
