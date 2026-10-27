import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  Filter,
  ChevronRight,
  Barcode,
  FileText,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { SearchBar } from '../../components/ui/SearchBar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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
const ARROW_DIM = 32;

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
        <Pressable
          onPress={() => router.push(`/ingredient/${matchedAdditive.code}` as any)}
          style={[styles.additiveMatchCard, shadows.card]}
        >
          <View style={styles.additiveTopTag}>
            <View style={styles.additiveTagLeft}>
              <FlaskConical size={14} color={colors.primary} />
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
              <Text style={[typography.titleMd, styles.additiveCode]}>
                {matchedAdditive.code} • INS {matchedAdditive.insNumber}
              </Text>
              <Text style={[typography.bodySm, styles.additiveName]} numberOfLines={1}>
                {matchedAdditive.name}
              </Text>
            </View>
          </View>

          <Text style={[typography.captionSm, styles.additiveDesc]} numberOfLines={2}>
            {matchedAdditive.description}
          </Text>

          <View style={styles.additiveFooter}>
            <Text style={[typography.captionSm, styles.inspectLink]}>
              {t('home.inspectDossier')}
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </View>
        </Pressable>
      )}

      {/* Hero Scan Banner */}
      <Pressable
        onPress={() => router.push('/scan' as any)}
        accessibilityRole="button"
        accessibilityLabel={t('home.scanTitle')}
        style={({ pressed }) => [
          styles.scanBanner,
          shadows.card,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={styles.scanBannerContent}>
          <View style={styles.scanIconBubble}>
            <Scan size={26} color={colors.white} />
          </View>
          <View style={styles.scanTextWrapper}>
            <Text style={[typography.titleMd, styles.scanTitle]}>
              {t('home.scanTitle')}
            </Text>
            <Text style={[typography.captionSm, styles.scanSubtitle]}>
              {t('home.scanSubtitle')}
            </Text>
          </View>
          <View style={styles.scanActionPill}>
            <ArrowRight size={16} color={colors.white} />
          </View>
        </View>
      </Pressable>

      {/* Manual Input Action Buttons */}
      <View style={styles.actionShortcutsRow}>
        <Pressable
          onPress={() => setShowBarcodeModal(true)}
          style={[styles.shortcutBtn, shadows.subtle]}
        >
          <Barcode size={18} color={colors.ink} />
          <Text style={[typography.captionSm, styles.shortcutLabel]}>
            {t('home.enterBarcode')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowAnalyzerModal(true)}
          style={[styles.shortcutBtn, shadows.subtle]}
        >
          <FileText size={18} color={colors.ink} />
          <Text style={[typography.captionSm, styles.shortcutLabel]}>
            {t('home.pasteLabel')}
          </Text>
        </Pressable>
      </View>

      {/* Category / Verdict Filters */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleRow}>
            <Filter size={15} color={colors.ink} />
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

        <FlatList
          data={CATEGORY_CHIPS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipsContainer}
          windowSize={5}
          initialNumToRender={6}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item;
            return (
              <Pressable
                onPress={() => setSelectedFilter(item)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={t(`home.filters.${item}`)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.ink : colors.surfaceStrong,
                    borderColor: isSelected ? colors.ink : colors.hairline,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.micro,
                    {
                      color: isSelected ? colors.white : colors.body,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {t(`home.filters.${item}`)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
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
    ]
  );

  return (
    <View style={styles.container}>
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
            <Text style={[typography.bodySm, styles.emptyText]}>
              {t('home.emptyBody')}
            </Text>
          </View>
        }
      />

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
  listContent: {
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
  additiveMatchCard: {
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  additiveTopTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  additiveTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  additiveTagText: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  additiveMainRow: {
    marginBottom: spacing.xs,
  },
  additiveTextCol: {
    flex: 1,
  },
  additiveCode: {
    color: colors.ink,
    fontWeight: '700',
  },
  additiveName: {
    color: colors.body,
    marginTop: 2,
  },
  additiveDesc: {
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  additiveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
  },
  inspectLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  actionShortcutsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  shortcutLabel: {
    color: colors.ink,
    fontWeight: '500',
  },
  scanBanner: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  scanBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  scanTextWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  scanTitle: {
    color: colors.white,
    fontWeight: '700',
    marginBottom: 2,
  },
  scanSubtitle: {
    color: '#D0D0D0',
    lineHeight: 16,
  },
  scanActionPill: {
    width: ARROW_DIM,
    height: ARROW_DIM,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterTitle: {
    color: colors.ink,
  },
  chipsContainer: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
