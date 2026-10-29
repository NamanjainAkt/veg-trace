import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Search,
  Database,
  Camera,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { UnknownAdditiveIllustration } from '../../components/illustrations/Illustrations';
import { motion, staggerDelay } from '../../design-system/motion';
import { EvidenceCard } from '../../components/verification/EvidenceCard';
import { useProductResolution } from '../../hooks/useProductResolution';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { formatScannedAt } from '../../utils/format';
import { Product, VerificationEvidence } from '../../types';
import { ManufacturerDisclosure } from '../../services/webFallback';
import {
  AdditiveDefinition,
  KNOWLEDGE_BASE_BUILD_DATE,
  lookupAdditive,
} from '../../services/knowledgeBase';

function resolveAdditive(raw: string | undefined): AdditiveDefinition | null {
  if (!raw) return null;
  const direct = lookupAdditive(raw);
  if (direct) return direct;
  const normalized = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!normalized) return null;
  const candidates = [normalized];
  if (/^INS\d{3,4}[A-Z]?$/.test(normalized)) candidates.push(`E${normalized.slice(3)}`);
  if (/^\d{3,4}[A-Z]?$/.test(normalized)) candidates.push(`E${normalized}`);
  for (const c of candidates) {
    const d = lookupAdditive(c);
    if (d) return d;
  }
  return null;
}

function additiveToVerificationProduct(additive: AdditiveDefinition): Product {
  return {
    id: additive.code,
    barcode: additive.code,
    name: additive.name,
    brand: `INS ${additive.insNumber}`,
    imageUrl: undefined,
    verdict: additive.defaultVerdict,
    confidence: 90,
    ingredients: [
      {
        id: `ing-${additive.code.toLowerCase()}`,
        name: additive.name,
        code: `${additive.code} / INS ${additive.insNumber}`,
        verdict: additive.defaultVerdict,
        origins: additive.possibleOrigins,
        manufacturerDisclosed: !additive.requiresDisclosure,
        disclosureText: additive.disclosureAdvice,
        description: additive.description,
        evidenceTrail: [
          {
            id: `ev-${additive.code.toLowerCase()}-kb`,
            sourceTitle: 'VegTrace Biochemical Taxonomy Database',
            date: KNOWLEDGE_BASE_BUILD_DATE,
            snippet: additive.description,
            confidenceScore: 90,
            verdict: additive.defaultVerdict,
          },
        ],
      },
    ],
    rawIngredientText: `${additive.code} ${additive.name}`,
    summary: additive.description,
    scannedAt: new Date().toISOString(),
    isCachedOffline: true,
  };
}

interface PipelineStage {
  step: number;
  title: string;
  detail: string;
  status: 'done' | 'pending';
  icon: typeof Camera;
}

function buildPipelineStages(
  product: Product,
  source: string | undefined,
  disclosure: ManufacturerDisclosure | null,
  t: (key: string, opt?: any) => string
): PipelineStage[] {
  const isOcr = source === 'ocr_label' || product.barcode.startsWith('custom-');
  const stage1Title = isOcr ? t('verification.stageOcr') : t('verification.stageBarcode');
  const stage1Detail = isOcr
    ? t('verification.stageOcrDetail', { count: product.rawIngredientText.length })
    : t('verification.stageBarcodeDetail', { code: product.barcode });

  const stage2Detail =
    source === 'open_food_facts'
      ? t('verification.stageOffDetail')
      : source === 'database'
        ? t('verification.stageDbDetail')
        : t('verification.stageKbDetail');

  const disclosedCount = product.ingredients.filter(
    (i) => i.manufacturerDisclosed
  ).length;

  return [
    {
      step: 1,
      title: stage1Title,
      detail: stage1Detail,
      status: 'done',
      icon: isOcr ? Camera : Search,
    },
    {
      step: 2,
      title: t('verification.stage2Title'),
      detail: stage2Detail,
      status: 'done',
      icon: Database,
    },
    {
      step: 3,
      title: t('verification.stage3Title'),
      detail: t('verification.stage3Detail', {
        identified: product.ingredients.length,
        disclosed: disclosedCount,
      }),
      status: 'done',
      icon: Cpu,
    },
    {
      step: 4,
      title: t('verification.stage4Title'),
      detail: disclosure?.disclosed
        ? t('verification.stage4Disclosure')
        : t('verification.stage4Applied', {
            rule: colors.verdicts[product.verdict].label,
          }),
      status: 'done',
      icon: ShieldCheck,
    },
  ];
}

function collectEvidence(product: Product): VerificationEvidence[] {
  const map = new Map<string, VerificationEvidence>();
  for (const ing of product.ingredients) {
    for (const ev of ing.evidenceTrail ?? []) {
      if (!map.has(ev.id)) map.set(ev.id, ev);
    }
  }
  return Array.from(map.values());
}

function StepConnector({ delay }: { delay: number }) {
  const reduced = useReducedMotion();
  const scaleY = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      scaleY.value = 1;
      return;
    }
    scaleY.value = withDelay(
      delay,
      withTiming(1, { duration: motion.base, easing: Easing.out(Easing.cubic) })
    );
  }, [reduced, delay, scaleY]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[styles.stepLine, { transformOrigin: 'center top' }, lineStyle]}
    />
  );
}

export default function VerificationTrailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const hydrated = usePreferencesStore((s) => s.hydrated);
  const resolution = useProductResolution(id ?? null);
  const additiveMatch = !resolution.data?.product ? resolveAdditive(id) : null;
  const product =
    resolution.data?.product ?? (additiveMatch ? additiveToVerificationProduct(additiveMatch) : null);
  const disclosure = resolution.data?.disclosure ?? null;
  const loading =
    !hydrated || (resolution.isPending && resolution.fetchStatus !== 'idle');

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
      <View style={styles.loadingContainer}>
        <Database size={36} color={colors.mutedSoft} />
        <Text style={[typography.titleSm, styles.loadingText, { color: colors.ink }]}>
          {t('product.notFound')}
        </Text>
        <Text style={[typography.captionSm, styles.notFoundBody]}>
          {t('product.notFoundBody', { id })}
        </Text>
      </View>
    );
  }

  const pipelineStages = buildPipelineStages(
    product,
    resolution.data?.source ?? (additiveMatch ? 'knowledge_base' : undefined),
    disclosure,
    t
  );
  const evidenceTrail = collectEvidence(product);
  const onDeviceOnly = product.ingredients
    .filter((ing) => (ing.evidenceTrail ?? []).length === 0)
    .map((ing) => ing.name);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.titleSm, styles.title]}>
          {t('verification.title')}
        </Text>
        <Text style={[typography.captionSm, styles.subtitle]}>
          {t('verification.subtitle')}
        </Text>
        <Text style={[typography.micro, styles.verifiedAt]}>
          {t('verification.lastVerified', { date: formatScannedAt(product.scannedAt) })}
        </Text>
      </View>

      {/* Pipeline Stepper */}
      <View style={[styles.pipelineCard, shadows.subtle]}>
        <View style={styles.pipelineHeader}>
          <Text style={[typography.titleSm, styles.pipelineTitle]}>
            {t('verification.traceTitle')}
          </Text>
          <Badge label={t('verification.complete')} status="vegetarian" size="sm" showDot />
        </View>
        <Text style={[typography.captionSm, styles.pipelineProductName]} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.stepperContainer}>
          {pipelineStages.map((stage, idx) => {
            const isLast = idx === pipelineStages.length - 1;
            const done = stage.status === 'done';
            return (
              <FadeSlideIn key={stage.step} delay={staggerDelay(idx, 35)} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View style={[styles.stepIconCircle, !done && styles.stepIconCirclePending]}>
                    {done ? (
                      <CheckCircle2 size={13} color={colors.success} />
                    ) : (
                      <Clock size={13} color={colors.muted} />
                    )}
                  </View>
                  {!isLast && <StepConnector delay={staggerDelay(idx, 35) + 100} />}
                </View>

                <View style={styles.stepContentCol}>
                  <Text style={[typography.titleSm, styles.stepTitle]}>
                    {stage.title}
                  </Text>
                  <Text style={[typography.captionSm, styles.stepDetail]}>
                    {stage.detail}
                  </Text>
                </View>
              </FadeSlideIn>
            );
          })}
        </View>
      </View>

      {/* Manufacturer Disclosure Summary */}
      {disclosure && (
        <View style={[styles.disclosureCard, shadows.subtle]}>
          <View style={styles.disclosureHeader}>
            <ShieldCheck
              size={15}
              color={disclosure.disclosed ? colors.success : colors.muted}
            />
            <Text style={[typography.titleSm, styles.disclosureTitle]}>
              {disclosure.disclosed
                ? t('verification.disclosureFound')
                : t('verification.disclosureMissing')}
            </Text>
          </View>
          {disclosure.snippets.slice(0, 2).map((snippet, idx) => (
            <Text key={idx} style={[typography.captionSm, styles.disclosureSnippet]}>
              {`"${snippet}"`}
            </Text>
          ))}
        </View>
      )}

      {/* Sourcing Evidence Entries */}
      <View style={styles.evidenceSection}>
        <Text style={[typography.titleSm, styles.sectionTitle]}>
          {t('verification.evidenceTitle')}
        </Text>
        <Text style={[typography.captionSm, styles.sectionSubtitle]}>
          {t('verification.evidenceBody')}
        </Text>

        {evidenceTrail.length > 0 ? (
          evidenceTrail.map((ev) => (
            <EvidenceCard key={ev.id} evidence={ev} />
          ))
        ) : (
          <View style={styles.emptyEvidenceCard}>
            <View style={{ marginBottom: spacing.xs }}>
              <UnknownAdditiveIllustration size={48} />
            </View>
            <Text style={[typography.captionSm, styles.emptyEvidenceText]}>
              {t('verification.noEvidence')}
            </Text>
          </View>
        )}

        {onDeviceOnly.length > 0 && (
          <View style={styles.onDeviceNote}>
            <Cpu size={13} color={colors.muted} />
            <Text style={[typography.micro, styles.onDeviceText]}>
              {`${onDeviceOnly.join(', ')} — ${t('product.evaluatedPill')}`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const STEP_WIDTH = 24;
const STEP_ICON_DIM = 20;

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
    fontSize: 13,
  },
  notFoundBody: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xxs,
    lineHeight: 18,
    fontSize: 12,
  },
  header: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  verifiedAt: {
    color: colors.mutedSoft,
    marginTop: spacing.xxs,
    fontSize: 10,
  },
  pipelineCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pipelineTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.xs,
  },
  pipelineProductName: {
    color: colors.body,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  stepperContainer: {},
  stepRow: {
    flexDirection: 'row',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: STEP_WIDTH,
  },
  stepIconCircle: {
    width: STEP_ICON_DIM,
    height: STEP_ICON_DIM,
    borderRadius: radius.full,
    backgroundColor: colors.verdicts.vegetarian.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCirclePending: {
    backgroundColor: colors.surfaceStrong,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.hairlineSoft,
    marginVertical: 2,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: spacing.xs + 2,
    paddingBottom: spacing.sm,
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  stepDetail: {
    color: colors.body,
    fontSize: 11,
    lineHeight: 15,
  },
  disclosureCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  disclosureTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  disclosureSnippet: {
    color: colors.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: spacing.xxs,
    fontStyle: 'italic',
  },
  evidenceSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  onDeviceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  onDeviceText: {
    color: colors.muted,
    flex: 1,
    lineHeight: 15,
    fontSize: 10,
  },
  emptyEvidenceCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyEvidenceText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 12,
  },
});
