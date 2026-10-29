import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Database, Trash2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { ScanFirstIllustration } from '../../components/illustrations/Illustrations';
import { formatScannedAt } from '../../utils/format';
import { useHistoryStore } from '../../store/useHistoryStore';
import { Product } from '../../types';

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const historyItems = useHistoryStore((s) => s.items);
  const refreshHistory = useHistoryStore((s) => s.refresh);
  const clearHistory = useHistoryStore((s) => s.clear);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const handleClear = async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await clearHistory();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Offline Storage Status */}
      <View style={[styles.cacheBanner, shadows.subtle]}>
        <View style={styles.cacheLeft}>
          <View style={styles.cacheIconCircle}>
            <Database size={15} color={colors.primary} />
          </View>
          <View style={styles.cacheTextCol}>
            <Text style={[typography.titleSm, styles.cacheTitle]}>
              {t('history.storageTitle')}
            </Text>
            <Text style={[typography.captionSm, styles.cacheSubtitle]}>
              {t('history.storageBody', { count: historyItems.length })}
            </Text>
          </View>
        </View>
        <Badge label="Active" status="vegetarian" size="sm" showDot style={{ flexShrink: 0 }} />
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={[typography.titleSm, styles.sectionTitle]}>
          {t('history.recent')}
        </Text>
        {historyItems.length > 0 && (
          <Pressable
            onPress={handleClear}
            hitSlop={6}
            style={styles.clearBtn}
            accessibilityLabel={t('history.clearAll')}
          >
            <Trash2 size={13} color={colors.muted} />
            <Text style={[typography.micro, styles.clearText]}>{t('history.clearLabel')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const config = colors.verdicts[item.verdict];
      return (
        <PressableScale
          onPress={() => router.push(`/product/${item.id}` as any)}
          scaleTo={0.985}
          haptic
          accessibilityRole="button"
          accessibilityLabel={item.name}
        >
          <View style={[styles.historyCard, shadows.subtle]}>
            <View style={styles.cardHeader}>
              <View style={styles.brandRow}>
                <Text style={[typography.micro, styles.brandText]}>
                  {item.brand.toUpperCase()}
                </Text>
                <Text style={[typography.micro, styles.timeText]}>
                  {formatScannedAt(item.scannedAt)}
                </Text>
              </View>
              <Text style={[typography.titleSm, styles.productName]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.tagsRow}>
                <Badge label={config.label} status={item.verdict} size="sm" showDot />
                {item.isCachedOffline && (
                  <View style={styles.offlineTag}>
                    <View style={styles.offlineDot} />
                    <Text style={[typography.micro, styles.offlineTagText]}>
                      {t('history.stored')}
                    </Text>
                  </View>
                )}
              </View>
              <ChevronRight size={14} color={colors.muted} />
            </View>
          </View>
        </PressableScale>
      );
    },
    [router, t]
  );

  return (
    <View style={styles.container}>
      <FadeSlideIn style={styles.listWrap}>
        <FlatList
          data={historyItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <FadeSlideIn style={styles.emptyContainer}>
              <ScanFirstIllustration size={72} />
              <Text style={[typography.titleSm, styles.emptyTitle]}>
                {t('history.empty')}
              </Text>
              <Text style={[typography.captionSm, styles.emptySubtitle]}>
                {t('history.emptyBody')}
              </Text>
              <Button
                title={t('history.emptyCta')}
                variant="primary"
                size="sm"
                onPress={() => router.push('/scan' as any)}
                style={styles.emptyCta}
              />
            </FadeSlideIn>
          }
        />
      </FadeSlideIn>
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
    paddingHorizontal: spacing.sm + 2,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xs,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  cacheLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
    marginRight: spacing.xs,
  },
  cacheTextCol: {
    flex: 1,
  },
  cacheIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  cacheSubtitle: {
    color: colors.muted,
    fontSize: 11,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs + 2,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  clearText: {
    color: colors.muted,
    fontSize: 11,
  },
  historyCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardHeader: {
    marginBottom: spacing.xxs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  brandText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timeText: {
    color: colors.mutedSoft,
    fontSize: 10,
  },
  productName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
    paddingTop: spacing.xxs + 2,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  offlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  offlineDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.verdicts.vegetarian.color,
  },
  offlineTagText: {
    color: colors.muted,
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: spacing.md,
  },
});
