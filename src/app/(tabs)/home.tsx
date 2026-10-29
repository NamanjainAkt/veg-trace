import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Scan,
  Filter,
  ChevronRight,
  Barcode,
  FileText,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { staggerDelay } from '../../design-system/motion';
import { SearchBar } from '../../components/ui/SearchBar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { ScanHeroIllustration } from '../../components/illustrations/Illustrations';
import { ProductCard } from '../../components/product/ProductCard';
import { ManualBarcodeForm } from '../../components/forms/ManualBarcodeForm';
import { RawIngredientAnalyzerForm } from '../../components/forms/RawIngredientAnalyzerForm';
import { searchOpenFoodFacts } from '../../services/openFoodFacts';
import { lookupAdditive } from '../../services/knowledgeBase';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { getVerdictStrings } from '../../i18n/strings';
import { Product } from '../../types';

type FilterId = 'all' | 'undisclosed' | 'dependent' | 'vegetarian' | 'nonveg';
const CATEGORY_CHIPS: FilterId[] = ['all', 'undisclosed', 'dependent', 'vegetarian', 'nonveg'];
const CHIP_HEIGHT = 34;
const CHIP_TIMING = { duration: 200 };

function verdictForFilter(filter: FilterId): Product['verdict'] | null {
  switch (filter) {
    case 'undisclosed':
      return 'sourceUndisclosed';
    case 'dependent':
      return 'sourceDependent';
    case 'vegetarian':
      return 'vegetarian';
    case 'nonveg':
      return 'nonVegetarian';
    default:
      return null;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const prefs = usePreferencesStore((s) => s.prefs);
  const language = usePreferencesStore((s) => s.language);
  const productsList = useHistoryStore((s) => s.items);
  const refreshHistory = useHistoryStore((s) => s.refresh);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('all');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchSeq = useRef(0);

  // Modal forms
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);

  // Sliding filter pill: measured chip positions + animated X/width
  const chipLayouts = useRef<Partial<Record<FilterId, { x: number; width: number }>>>({});
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  const movePill = useCallback((id: FilterId, animate: boolean) => {
    const layout = chipLayouts.current[id];
    if (!layout) return;
    if (animate) {
      pillX.value = withTiming(layout.x, CHIP_TIMING);
      pillW.value = withTiming(layout.width, CHIP_TIMING);
    } else {
      pillX.value = layout.x;
      pillW.value = layout.width;
    }
  }, [pillX, pillW]);

  useEffect(() => {
    movePill(selectedFilter, true);
  }, [selectedFilter, movePill]);

  // Load persistent history on mount and when returning
  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  // Live Search: Open Food Facts API with user prefs + stale-response guard
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      const seq = ++searchSeq.current;
      setIsSearchingOnline(true);
      try {
        const onlineProducts = await searchOpenFoodFacts(searchQuery, prefs);
        if (searchSeq.current === seq) setSearchResults(onlineProducts);
      } catch (e) {
        if (__DEV__) console.warn('Search error:', e);
      } finally {
        if (searchSeq.current === seq) setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, prefs]);

  // Additive match from local Knowledge Base
  const matchedAdditive = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return lookupAdditive(searchQuery);
  }, [searchQuery]);

  // Active items to display (search results or history list)
  const displayItems = useMemo(() => {
    const source = searchQuery.trim().length > 1 ? searchResults : productsList;

    return source.filter((product) => {
      const wanted = verdictForFilter(selectedFilter);
      return wanted === null || product.verdict === wanted;
    });
  }, [searchQuery, searchResults, productsList, selectedFilter]);

  const handleProductPress = useCallback(
    (product: Product) => {
      router.push(`/product/${product.id}` as any);
    },
    [router]
  );

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.productCardWrapper}>
        <ProductCard product={item} onPress={() => handleProductPress(item)} />
      </View>
    ),
    [handleProductPress]
  );

  const showContinueAudit = searchQuery.trim() === '' && productsList.length > 0;

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Search Header */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('home.searchPlaceholder')}
          style={styles.searchBar}
        />

        {/* Additive Match Card if user searches E-number */}
        {matchedAdditive && (
          <FadeSlideIn delay={staggerDelay(0)}>
            <PressableScale
              onPress={() => router.push(`/ingredient/${matchedAdditive.code}` as any)}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel={t('home.inspectDossier')}
            >
              <View style={[styles.additiveMatchCard, shadows.subtle]}>
                <View style={styles.additiveTopTag}>
                  <View style={styles.additiveTagLeft}>
                    <FlaskConical size={13} color={colors.primary} />
                    <Text style={[typography.micro, styles.additiveTagText]}>
                      {t('home.registryMatch')}
                    </Text>
                  </View>
                  <Badge
                    label={getVerdictStrings(language)[matchedAdditive.defaultVerdict].label}
                    status={matchedAdditive.defaultVerdict}
                    size="sm"
                  />
                </View>

                <View style={styles.additiveMainRow}>
                  <View style={styles.additiveTextCol}>
                    <Text style={[typography.titleSm, styles.additiveCode]}>
                      {matchedAdditive.code} • INS {matchedAdditive.insNumber}
                    </Text>
                    <Text style={[typography.captionSm, styles.additiveName]} numberOfLines={1}>
                      {matchedAdditive.name}
                    </Text>
                  </View>
                </View>

                <Text style={[typography.captionSm, styles.additiveDesc]} numberOfLines={2}>
                  {matchedAdditive.description}
                </Text>

                <View style={styles.additiveFooter}>
                  <Text style={[typography.micro, styles.inspectLink]}>
                    {t('home.inspectDossier')}
                  </Text>
                  <ArrowRight size={13} color={colors.primary} />
                </View>
              </View>
            </PressableScale>
          </FadeSlideIn>
        )}

        {/* Hero Scan Banner */}
        <FadeSlideIn delay={staggerDelay(1)} style={styles.heroWrapper}>
          <PressableScale
            onPress={() => router.push('/scan' as any)}
            scaleTo={0.985}
            haptic
            accessibilityRole="button"
            accessibilityLabel={t('home.scanTitle')}
          >
            <View style={[styles.heroShell, shadows.subtle]}>
              <LinearGradient
                colors={[colors.heroFrom, colors.heroTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroIllustration} pointerEvents="none">
                  <ScanHeroIllustration size={56} />
                </View>

                <View style={styles.heroContent}>
                  <View style={styles.heroLeft}>
                    <Text style={[typography.micro, styles.heroEyebrow]}>
                      {t('home.readyToTrace')}
                    </Text>
                    <Text style={[typography.titleSm, styles.heroTitle]}>
                      {t('home.scanTitle')}
                    </Text>
                    <Text style={[typography.captionSm, styles.heroSubtitle]} numberOfLines={2}>
                      {t('home.scanSubtitle')}
                    </Text>
                    <View style={styles.heroPrivacyRow}>
                      <ShieldCheck size={12} color={colors.peach} />
                      <Text style={[typography.micro, styles.heroPrivacyText]}>
                        {t('home.heroPrivacy')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroScanCol}>
                    <View style={styles.heroScanCircle}>
                      <Scan size={20} color={colors.white} />
                    </View>
                    <Text style={[typography.micro, styles.heroScanLabel]}>
                      {t('home.heroScanCta')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </PressableScale>
        </FadeSlideIn>

        {/* Manual Input Action Buttons */}
        <FadeSlideIn delay={staggerDelay(2)} style={styles.actionShortcutsRow}>
          <PressableScale
            onPress={() => setShowBarcodeModal(true)}
            scaleTo={0.97}
            haptic
            accessibilityRole="button"
            accessibilityLabel={t('home.enterBarcode')}
            style={styles.shortcutSlot}
          >
            <View style={[styles.shortcutBtn, shadows.subtle]}>
              <Barcode size={16} color={colors.ink} />
              <Text style={[typography.captionSm, styles.shortcutLabel]}>
                {t('home.enterBarcode')}
              </Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => setShowAnalyzerModal(true)}
            scaleTo={0.97}
            haptic
            accessibilityRole="button"
            accessibilityLabel={t('home.pasteLabel')}
            style={styles.shortcutSlot}
          >
            <View style={[styles.shortcutBtn, shadows.subtle]}>
              <FileText size={16} color={colors.ink} />
              <Text style={[typography.captionSm, styles.shortcutLabel]}>
                {t('home.pasteLabel')}
              </Text>
            </View>
          </PressableScale>
        </FadeSlideIn>

        {/* Continue your last audit */}
        {showContinueAudit && (
          <FadeSlideIn delay={staggerDelay(2)} style={styles.continueWrapper}>
            <View style={styles.continueSection}>
              <Text style={[typography.micro, styles.continueLabel]}>
                {t('home.continueAudit')}
              </Text>
              <PressableScale
                onPress={() => router.push(`/product/${productsList[0].id}` as any)}
                scaleTo={0.985}
                haptic
                accessibilityRole="button"
                accessibilityLabel={`${t('home.continueAudit')}: ${productsList[0].name}`}
              >
                <View style={[styles.continueCard, shadows.subtle]}>
                  <View style={styles.continueIconWrap}>
                    <Barcode size={15} color={colors.ink} />
                  </View>
                  <Text style={[typography.captionSm, styles.continueName]} numberOfLines={1}>
                    {productsList[0].name}
                  </Text>
                  <Badge
                    label={getVerdictStrings(language)[productsList[0].verdict].label}
                    status={productsList[0].verdict}
                    size="sm"
                    style={{ flexShrink: 0 }}
                  />
                  <ChevronRight size={14} color={colors.muted} />
                </View>
              </PressableScale>
            </View>
          </FadeSlideIn>
        )}

        {/* Category / Verdict Filters */}
        <FadeSlideIn delay={staggerDelay(3)} style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <View style={styles.filterTitleRow}>
              <Filter size={13} color={colors.ink} />
              <Text style={[typography.titleSm, styles.filterTitle]}>
                {searchQuery.trim().length > 1
                  ? t('home.offResults')
                  : t('home.audited')}
              </Text>
            </View>
            {isSearchingOnline ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Badge label={`${displayItems.length}`} status="neutral" size="sm" />
            )}
          </View>

          {/* Sliding-selection chip row: ink pill glides under the active chip */}
          <View style={styles.chipTrack}>
            <View style={styles.chipRow}>
              <Animated.View
                pointerEvents="none"
                style={[styles.chipPill, pillAnimStyle]}
              />
              {CATEGORY_CHIPS.map((item) => {
                const isSelected = selectedFilter === item;
                const handleChipPress = () => {
                  if (item === selectedFilter) return;
                  setSelectedFilter(item);
                  try {
                    void Haptics.selectionAsync();
                  } catch {}
                };
                const handleChipLayout = (event: LayoutChangeEvent) => {
                  const { x, width } = event.nativeEvent.layout;
                  chipLayouts.current[item] = { x, width };
                  if (item === selectedFilter) movePill(item, false);
                };
                return (
                  <PressableScale
                    key={item}
                    onPress={handleChipPress}
                    onLayout={handleChipLayout}
                    scaleTo={0.985}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={t(`home.filters.${item}`)}
                    style={styles.chipSlot}
                  >
                    <View style={styles.chip}>
                      <Text
                        style={[
                          typography.micro,
                          {
                            color: isSelected ? colors.white : colors.body,
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: 11,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t(`home.filters.${item}`)}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        </FadeSlideIn>
      </View>
    ),
    [
      t,
      router,
      language,
      searchQuery,
      matchedAdditive,
      displayItems.length,
      isSearchingOnline,
      selectedFilter,
      productsList,
      showContinueAudit,
      movePill,
      pillAnimStyle,
    ]
  );

  return (
    <View style={styles.container}>
      <FadeSlideIn delay={staggerDelay(4)} style={styles.listWrap}>
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[typography.titleSm, styles.emptyTitle]}>
                {searchQuery.trim().length > 1
                  ? t('home.emptySearch', { query: searchQuery })
                  : t('home.emptyDefault')}
              </Text>
              <Text style={[typography.captionSm, styles.emptyText]}>
                {t('home.emptyBody')}
              </Text>
            </View>
          }
        />
      </FadeSlideIn>

      {/* Manual Barcode Modal */}
      <Modal
        visible={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        title={t('forms.barcodeTitle')}
      >
        <ManualBarcodeForm
          onSuccess={() => {
            setShowBarcodeModal(false);
            void refreshHistory();
          }}
          onFallbackToText={() => {
            setShowBarcodeModal(false);
            setShowAnalyzerModal(true);
          }}
        />
      </Modal>

      {/* Ingredient Text Analyzer Modal */}
      <Modal
        visible={showAnalyzerModal}
        onClose={() => setShowAnalyzerModal(false)}
        title={t('forms.analyzerTitle')}
      >
        <RawIngredientAnalyzerForm
          onSuccess={() => {
            setShowAnalyzerModal(false);
            void refreshHistory();
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    paddingHorizontal: spacing.sm + 2,
    paddingTop: spacing.xs,
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  additiveMatchCard: {
    backgroundColor: colors.canvas,
    borderColor: colors.hairlineSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  additiveTopTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  additiveTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  additiveTagText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  additiveMainRow: {
    marginBottom: spacing.xxs,
  },
  additiveTextCol: {
    flex: 1,
  },
  additiveCode: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  additiveName: {
    color: colors.body,
    fontSize: 12,
    marginTop: 1,
  },
  additiveDesc: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.xxs,
  },
  additiveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.xxs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
  },
  inspectLink: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  heroWrapper: {
    marginBottom: spacing.xs,
  },
  heroShell: {
    borderRadius: radius.md,
    backgroundColor: colors.heroFrom,
    overflow: 'hidden',
  },
  heroGradient: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  heroIllustration: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xs,
    opacity: 0.2,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  heroEyebrow: {
    color: colors.peach,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
    marginBottom: 2,
  },
  heroTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  heroPrivacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxs,
  },
  heroPrivacyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  heroScanCol: {
    alignItems: 'center',
    flexShrink: 0,
  },
  heroScanCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScanLabel: {
    color: colors.white,
    marginTop: 3,
    fontSize: 10,
    fontWeight: '600',
  },
  actionShortcutsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  shortcutSlot: {
    flex: 1,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.canvas,
    borderColor: colors.hairlineSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 40,
    paddingHorizontal: spacing.sm,
  },
  shortcutLabel: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 12,
  },
  continueWrapper: {
    marginBottom: spacing.xs,
  },
  continueSection: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
    paddingTop: spacing.xs,
  },
  continueLabel: {
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
    marginBottom: spacing.xxs,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radius.md,
    padding: spacing.xs + 2,
    minHeight: 42,
  },
  continueIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.peachSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  continueName: {
    flex: 1,
    color: colors.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  filterSection: {
    marginBottom: spacing.xs,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs + 2,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTrack: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.hairlineSoft,
    borderWidth: 1,
    borderRadius: radius.full,
    padding: 2,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chipPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: CHIP_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  chipSlot: {
    flex: 1,
  },
  chip: {
    flex: 1,
    height: CHIP_HEIGHT,
    paddingHorizontal: 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardWrapper: {
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.xs + 2,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
