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
import { Database, WifiOff, Trash2, ChevronRight } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
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
    await clearHistory();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Offline Storage Status */}
      <View style={[styles.cacheBanner, shadows.subtle]}>
        <View style={styles.cacheLeft}>
          <View style={styles.cacheIconCircle}>
            <Database size={18} color={colors.primary} />
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
        <Badge label="Active" status="vegetarian" size="sm" style={{ flexShrink: 0 }} />
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('history.recent')}
        </Text>
        {historyItems.length > 0 && (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityLabel={t('history.clearAll')}
          >
            <Trash2 size={16} color={colors.muted} />
            <Text style={[typography.captionSm, styles.clearText]}>{t('history.clearLabel')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const config = colors.verdicts[item.verdict];
      return (
        <Pressable
          onPress={() => router.push(`/product/${item.id}` as any)}
          style={({ pressed }) => [
            styles.historyCard,
            shadows.subtle,
            { transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.brandRow}>
              <Text style={[typography.captionSm, styles.brandText]}>
                {item.brand}
              </Text>
              <Text style={[typography.captionSm, styles.timeText]}>
                {formatScannedAt(item.scannedAt)}
              </Text>
            </View>
            <Text style={[typography.titleMd, styles.productName]}>
              {item.name}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.tagsRow}>
              <Badge label={config.label} status={item.verdict} size="sm" />
              {item.isCachedOffline && (
                <View style={styles.offlineTag}>
                  <Database size={12} color={colors.muted} />
                  <Text style={[typography.micro, styles.offlineTagText]}>
                    {t('history.storedLocally')}
                  </Text>
                </View>
              )}
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </View>
        </Pressable>
      );
    },
    [router]
  );

  return (
    <View style={styles.container}>
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
          <View style={styles.emptyContainer}>
            <Database size={44} color={colors.mutedSoft} />
            <Text style={[typography.titleMd, styles.emptyTitle]}>
              {t('history.empty')}
            </Text>
            <Text style={[typography.bodySm, styles.emptySubtitle]}>
              {t('history.emptyBody')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cacheLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  cacheTextCol: {
    flex: 1,
  },
  cacheIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  cacheTitle: {
    color: colors.ink,
  },
  cacheSubtitle: {
    color: colors.muted,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearText: {
    color: colors.muted,
  },
  historyCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  brandText: {
    color: colors.muted,
  },
  timeText: {
    color: colors.mutedSoft,
  },
  productName: {
    color: colors.ink,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
    paddingTop: spacing.xs,
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
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  offlineTagText: {
    color: colors.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.muted,
    textAlign: 'center',
  },
});
