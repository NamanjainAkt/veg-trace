import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  FileSearch,
  Package,
  ShieldCheck,
  Send,
  Database,
  FileText,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { VerdictCard } from '../../components/product/VerdictCard';
import { IngredientRow } from '../../components/ingredient/IngredientRow';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SourcingInquiryForm } from '../../components/forms/SourcingInquiryForm';
import { setProductCached } from '../../services/storage';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useProductResolution } from '../../hooks/useProductResolution';

export default function ProductResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const language = usePreferencesStore((s) => s.language);
  const hydrated = usePreferencesStore((s) => s.hydrated);
  const resolution = useProductResolution(id ?? null);
  const product = resolution.data?.product ?? null;
  const loading =
    !hydrated || (resolution.isPending && resolution.fetchStatus !== 'idle');
  const [showRawIngredients, setShowRawIngredients] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    setIsSavedOffline(Boolean(product?.isCachedOffline));
  }, [product?.isCachedOffline]);

  const handleToggleOffline = async () => {
    if (!product) return;
    const next = !isSavedOffline;
    setIsSavedOffline(next);
    await setProductCached(product, next);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.titleSm, styles.loadingText]}>
          {t('product.evaluating')}
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.notFoundContainer}>
        <Package size={48} color={colors.muted} />
        <Text style={[typography.titleMd, styles.notFoundTitle]}>
          {t('product.notFound')}
        </Text>
        <Text style={[typography.bodySm, styles.notFoundSubtitle]}>
          {t('product.notFoundBody', { id })}
        </Text>
        <Button
          title={t('common.backHome')}
          variant="outline"
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const isUndisclosedOrAmbiguous =
    product.verdict === 'sourceUndisclosed' || product.verdict === 'sourceDependent';
  const resolvedFromRegistry =
    /^\d+$/.test(product.barcode) && product.verdict !== 'unknown';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Status Pill Header */}
      <View style={styles.topStatusRow}>
        <View style={styles.offlinePill}>
          <Database size={13} color={colors.success} />
          <Text style={[typography.micro, styles.offlinePillText]}>
            {t('product.evaluatedPill')}
          </Text>
        </View>
        {isSavedOffline && (
          <Badge label={t('product.savedOffline')} status="neutral" size="sm" />
        )}
      </View>

      {/* Product Hero Card */}
      <View style={[styles.productHeaderCard, shadows.subtle]}>
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={28} color={colors.muted} />
            </View>
          )}
        </View>

        <View style={styles.titleInfo}>
          <View style={styles.brandRow}>
            <Text style={[typography.captionSm, styles.brandName]} numberOfLines={1} ellipsizeMode="tail">
              {product.brand.toUpperCase()}
            </Text>
            {resolvedFromRegistry && (
              <View style={styles.dbMatchTag}>
                <ShieldCheck size={12} color={colors.success} />
                <Text style={[typography.micro, styles.dbMatchText]}>{t('product.verifiedMatch')}</Text>
              </View>
            )}
          </View>

          <Text style={[typography.titleMd, styles.productName]} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={[typography.micro, styles.barcodeText]}>
            {t('product.barcode', { code: product.barcode })}
          </Text>
        </View>
      </View>

      {/* Primary Verdict Hero Card */}
      <VerdictCard
        verdict={product.verdict}
        confidence={product.confidence}
        summary={product.summary}
        language={language}
        style={styles.verdictHero}
      />

      {/* Primary Action Buttons */}
      <View style={styles.actionsContainer}>
        {isUndisclosedOrAmbiguous ? (
          <Button
            title={t('product.requestDisclosure')}
            icon={<Send size={16} color={colors.white} />}
            onPress={() => setShowInquiryModal(true)}
            variant="primary"
            size="md"
            fullWidth
            style={{ marginBottom: spacing.xs }}
          />
        ) : null}

        <Button
          title={t('product.inspectEvidence')}
          icon={<FileSearch size={16} color={colors.ink} />}
          variant="outline"
          size="md"
          onPress={() => router.push(`/verification/${product.id}` as any)}
          fullWidth
          style={{ marginBottom: spacing.xs }}
        />

        <Button
          title={isSavedOffline ? t('product.savedOffline') : t('product.saveOffline')}
          variant="secondary"
          size="sm"
          onPress={handleToggleOffline}
          fullWidth
        />
      </View>

      {/* Ingredients Breakdown Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={[typography.titleMd, styles.sectionTitle]}>
            {t('product.ingredientAnalysis')}
          </Text>
          <Badge
            label={t('product.identified', { count: product.ingredients.length })}
            status="neutral"
            size="sm"
          />
        </View>
        <Text style={[typography.micro, { color: colors.muted }]}>
          {t('product.tapRow')}
        </Text>
      </View>

      <View style={[styles.ingredientsCard, shadows.subtle]}>
        {product.ingredients.map((ingredient) => (
          <IngredientRow
            key={ingredient.id || `${ingredient.code || 'ing'}-${ingredient.name}`}
            ingredient={ingredient}
            onPress={() =>
              router.push(
                `/ingredient/${ingredient.code ? ingredient.code.split('/')[0].trim() : ingredient.name}` as any
              )
            }
          />
        ))}
      </View>

      {/* Raw Ingredients Text Accordion */}
      <Pressable
        onPress={() => setShowRawIngredients(!showRawIngredients)}
        style={[styles.accordionHeader, shadows.subtle]}
      >
        <View style={styles.accordionLeft}>
          <FileText size={18} color={colors.muted} />
          <Text style={[typography.titleSm, styles.accordionTitle]}>
            {t('product.rawText')}
          </Text>
        </View>
        {showRawIngredients ? (
          <ChevronUp size={18} color={colors.muted} />
        ) : (
          <ChevronDown size={18} color={colors.muted} />
        )}
      </Pressable>

      {showRawIngredients && (
        <View style={styles.rawTextContainer}>
          <Text style={[typography.bodySm, styles.rawText]}>
            {product.rawIngredientText}
          </Text>
        </View>
      )}

      {/* Sourcing Inquiry Modal */}
      <Modal
        visible={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        title={t('forms.inquiryTitle')}
      >
        <SourcingInquiryForm
          initialAdditive={
            (
              product.ingredients.find((i) => i.verdict === 'sourceUndisclosed')?.code ||
              product.ingredients.find((i) => i.verdict === 'sourceDependent')?.code ||
              product.ingredients.find((i) => Boolean(i.code))?.code ||
              ''
            ).split('/')[0].trim()
          }
          onSuccess={() => setShowInquiryModal(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    textAlign: 'center',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundTitle: {
    color: colors.ink,
    marginTop: spacing.md,
  },
  notFoundSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 1,
  },
  offlinePillText: {
    color: colors.body,
    fontSize: 11,
  },
  productHeaderCard: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  imageContainer: {
    width: 68,
    height: 68,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    marginRight: spacing.md,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  brandName: {
    color: colors.muted,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: spacing.xs,
  },
  dbMatchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  dbMatchText: {
    color: colors.muted,
    fontSize: 11,
  },
  productName: {
    color: colors.ink,
    marginBottom: 4,
  },
  barcodeText: {
    color: colors.mutedSoft,
  },
  verdictHero: {
    marginBottom: spacing.md,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
  },
  ingredientsCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  accordionTitle: {
    color: colors.ink,
  },
  rawTextContainer: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rawText: {
    color: colors.body,
    lineHeight: 20,
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
