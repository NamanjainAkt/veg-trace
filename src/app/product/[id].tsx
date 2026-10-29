import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useReducedMotion,
} from 'react-native-reanimated';
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
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { PressableScale } from '../../components/ui/PressableScale';
import { SourcingInquiryForm } from '../../components/forms/SourcingInquiryForm';
import { motion, staggerDelay } from '../../design-system/motion';
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
  const reducedMotion = useReducedMotion();

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
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[typography.captionSm, styles.loadingText]}>
          {t('product.evaluating')}
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.notFoundContainer}>
        <Package size={40} color={colors.muted} />
        <Text style={[typography.titleSm, styles.notFoundTitle]}>
          {t('product.notFound')}
        </Text>
        <Text style={[typography.captionSm, styles.notFoundSubtitle]}>
          {t('product.notFoundBody', { id })}
        </Text>
        <Button
          title={t('common.backHome')}
          variant="outline"
          size="sm"
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginTop: spacing.sm }}
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
          <Database size={11} color={colors.success} />
          <Text style={[typography.micro, styles.offlinePillText]}>
            {t('product.evaluatedPill')}
          </Text>
        </View>
        {isSavedOffline && (
          <Badge label={t('product.savedOffline')} status="neutral" size="sm" showDot />
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
              <Package size={22} color={colors.muted} />
            </View>
          )}
        </View>

        <View style={styles.titleInfo}>
          <View style={styles.brandRow}>
            <Text style={[typography.micro, styles.brandName]} numberOfLines={1} ellipsizeMode="tail">
              {product.brand.toUpperCase()}
            </Text>
            {resolvedFromRegistry && (
              <View style={styles.dbMatchTag}>
                <ShieldCheck size={11} color={colors.success} />
                <Text style={[typography.micro, styles.dbMatchText]}>{t('product.verifiedMatch')}</Text>
              </View>
            )}
          </View>

          <Text style={[typography.titleSm, styles.productName]} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={[typography.micro, styles.barcodeText]}>
            {t('product.barcode', { code: product.barcode })}
          </Text>
        </View>
      </View>

      {/* Primary Verdict Hero Card */}
      <FadeSlideIn delay={staggerDelay(0)} style={styles.verdictHero}>
        <VerdictCard
          verdict={product.verdict}
          confidence={product.confidence}
          summary={product.summary}
          language={language}
        />
      </FadeSlideIn>

      {/* Primary Action Buttons */}
      <FadeSlideIn delay={staggerDelay(1)} style={styles.actionsContainer}>
        {isUndisclosedOrAmbiguous ? (
          <Button
            title={t('product.requestDisclosure')}
            icon={<Send size={14} color={colors.white} />}
            onPress={() => setShowInquiryModal(true)}
            variant="primary"
            size="sm"
            fullWidth
            style={{ marginBottom: spacing.xs }}
          />
        ) : null}

        <View style={styles.actionRow}>
          <Button
            title={t('product.inspectEvidence')}
            icon={<FileSearch size={14} color={colors.ink} />}
            variant="outline"
            size="sm"
            onPress={() => router.push(`/verification/${product.id}` as any)}
            style={{ flex: 1 }}
          />
          <Button
            title={isSavedOffline ? t('product.savedOffline') : t('product.saveOffline')}
            variant="secondary"
            size="sm"
            onPress={handleToggleOffline}
            style={{ flex: 1 }}
          />
        </View>
      </FadeSlideIn>

      {/* Ingredients Breakdown Section */}
      <FadeSlideIn delay={staggerDelay(2)} style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
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
      </FadeSlideIn>

      <FadeSlideIn delay={staggerDelay(3)} style={[styles.ingredientsCard, shadows.subtle]}>
        {product.ingredients.map((ingredient, index) => (
          <FadeSlideIn
            key={ingredient.id || `${ingredient.code || 'ing'}-${ingredient.name}`}
            delay={index <= 7 ? staggerDelay(index, 30) : 0}
          >
            <IngredientRow
              ingredient={ingredient}
              onPress={() =>
                router.push(
                  `/ingredient/${ingredient.code ? ingredient.code.split('/')[0].trim() : ingredient.name}` as any
                )
              }
            />
          </FadeSlideIn>
        ))}
      </FadeSlideIn>

      {/* Raw Ingredients Text Accordion */}
      <PressableScale
        onPress={() => setShowRawIngredients(!showRawIngredients)}
        scaleTo={0.985}
        haptic
        accessibilityRole="button"
        style={[styles.accordionHeader, shadows.subtle]}
      >
        <View style={styles.accordionLeft}>
          <FileText size={15} color={colors.muted} />
          <Text style={[typography.captionSm, styles.accordionTitle]}>
            {t('product.rawText')}
          </Text>
        </View>
        {showRawIngredients ? (
          <ChevronUp size={15} color={colors.muted} />
        ) : (
          <ChevronDown size={15} color={colors.muted} />
        )}
      </PressableScale>

      {showRawIngredients && (
        <Animated.View
          style={styles.rawTextContainer}
          entering={reducedMotion ? undefined : FadeInDown.duration(motion.base)}
          exiting={reducedMotion ? undefined : FadeOutUp.duration(motion.fast)}
        >
          <Text style={[typography.micro, styles.rawText]}>
            {product.rawIngredientText}
          </Text>
        </Animated.View>
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
    paddingHorizontal: spacing.sm + 2,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
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
    marginTop: spacing.sm,
  },
  notFoundSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    flexShrink: 1,
  },
  offlinePillText: {
    color: colors.body,
    fontSize: 10,
    fontWeight: '600',
  },
  productHeaderCard: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  imageContainer: {
    width: 54,
    height: 54,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    marginRight: spacing.sm,
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
    fontSize: 10,
    letterSpacing: 0.4,
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
    color: colors.success,
    fontSize: 10,
    fontWeight: '600',
  },
  productName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  barcodeText: {
    color: colors.mutedSoft,
    fontSize: 10,
  },
  verdictHero: {
    marginBottom: spacing.xs,
  },
  actionsContainer: {
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs + 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  ingredientsCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  accordionHeader: {
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
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  accordionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  rawTextContainer: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  rawText: {
    color: colors.body,
    lineHeight: 16,
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
