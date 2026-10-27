import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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
import { sqliteGetVerification } from '../../database/sqlite';

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

type StageStatus = 'done' | 'pending';

interface PipelineStage {
  step: number;
  title: string;
  icon: typeof Database;
  detail: string;
  status: StageStatus;
}

function buildPipelineStages(
  product: Product,
  source: string | undefined,
  disclosure: ManufacturerDisclosure | null,
  t: (key: string) => string
): PipelineStage[] {
  const webTrailHit =
    product.ingredients.some((ing) =>
      (ing.evidenceTrail ?? []).some((ev) => Boolean(ev.sourceUrl))
    ) || (disclosure?.snippets.length ?? 0) > 0;

  return [
    {
      step: 1,
      title: t('verification.stepOff'),
      icon: Database,
      detail: t('verification.stepOffBody'),
      status:
        source === 'open_food_facts' || source === 'open_food_facts_search' || /^\d+$/.test(product.barcode)
          ? 'done'
          : 'pending',
    },
    {
      step: 2,
      title: t('verification.stepOcr'),
      icon: Camera,
      detail: t('verification.stepOcrBody'),
      status: product.rawIngredientText.length > 0 ? 'done' : 'pending',
    },
    {
      step: 3,
      title: t('verification.stepKb'),
      icon: Cpu,
      detail: t('verification.stepKbBody'),
      status: product.ingredients.some((ing) => Boolean(ing.code)) ? 'done' : 'pending',
    },
    {
      step: 4,
      title: t('verification.stepWeb'),
      icon: Search,
      detail: t('verification.stepWebBody'),
      status:
        source === 'web_search' || source === 'cloud_worker' || webTrailHit
          ? 'done'
          : 'pending',
    },
    {
      step: 5,
      title: t('verification.stepVerdict'),
      icon: ShieldCheck,
      detail: t('verification.stepVerdictBody'),
      status: 'done',
    },
  ];
}

function collectEvidence(product: Product): VerificationEvidence[] {
  const byId = new Map<string, VerificationEvidence>();
  for (const ing of product.ingredients) {
    for (const ev of ing.evidenceTrail ?? []) {
      if (!byId.has(ev.id)) byId.set(ev.id, ev);
    }
  }
  return [...byId.values()];
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodySm, styles.loadingText]}>
          {t('product.evaluating')}
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Database size={44} color={colors.mutedSoft} />
        <Text style={[typography.titleMd, styles.loadingText, { color: colors.ink }]}>
          {t('product.notFound')}
        </Text>
        <Text style={[typography.bodySm, styles.notFoundBody]}>
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
        <Text style={[typography.displayLg, styles.title]}>
          {t('verification.title')}
        </Text>
        <Text style={[typography.bodySm, styles.subtitle]}>
          {t('verification.subtitle')}
        </Text>
        <Text style={[typography.micro, styles.verifiedAt]}>
          {t('verification.lastVerified', { date: formatScannedAt(product.scannedAt) })}
        </Text>
      </View>

      {/* Pipeline Stepper */}
      <View style={[styles.pipelineCard, shadows.card]}>
        <View style={styles.pipelineHeader}>
          <Text style={[typography.titleSm, styles.pipelineTitle]}>
            {t('verification.traceTitle')}
          </Text>
          <Badge label={t('verification.complete')} status="neutral" size="sm" />
        </View>
        <Text style={[typography.titleSm, styles.pipelineProductName]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.stepperContainer}>
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isLast = idx === pipelineStages.length - 1;
            const done = stage.status === 'done';
            return (
              <View key={stage.step} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View style={[styles.stepIconCircle, !done && styles.stepIconCirclePending]}>
                    {done ? (
                      <CheckCircle2 size={16} color={colors.success} />
                    ) : (
                      <Clock size={16} color={colors.muted} />
                    )}
                  </View>
                  {!isLast && <View style={styles.stepLine} />}
                </View>

                <View style={styles.stepContentCol}>
                  <Text style={[typography.titleSm, styles.stepTitle]}>
                    {stage.title}
                  </Text>
                  <Text style={[typography.bodySm, styles.stepDetail]}>
                    {stage.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Manufacturer Disclosure Summary */}
      {disclosure && (
        <View style={[styles.disclosureCard, shadows.subtle]}>
          <View style={styles.disclosureHeader}>
            <ShieldCheck
              size={16}
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
        <Text style={[typography.titleMd, styles.sectionTitle]}>
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
            <Database size={24} color={colors.muted} style={{ marginBottom: spacing.xs }} />
            <Text style={[typography.bodySm, styles.emptyEvidenceText]}>
              {t('verification.noEvidence')}
            </Text>
          </View>
        )}

        {onDeviceOnly.length > 0 && (
          <View style={styles.onDeviceNote}>
            <Cpu size={14} color={colors.muted} />
            <Text style={[typography.captionSm, styles.onDeviceText]}>
              {`${onDeviceOnly.join(', ')} — ${t('product.evaluatedPill')}`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const STEP_WIDTH = 28;
const STEP_ICON_DIM = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
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
  notFoundBody: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
  },
  verifiedAt: {
    color: colors.mutedSoft,
    marginTop: spacing.xs,
  },
  pipelineCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  pipelineTitle: {
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  pipelineProductName: {
    color: colors.body,
    marginBottom: spacing.md,
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
    marginVertical: 4,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.lg,
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 14,
  },
  stepDetail: {
    color: colors.body,
    lineHeight: 18,
  },
  disclosureCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  disclosureTitle: {
    color: colors.ink,
    flex: 1,
  },
  disclosureSnippet: {
    color: colors.body,
    lineHeight: 18,
    marginTop: spacing.xxs,
    fontStyle: 'italic',
  },
  evidenceSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.ink,
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
  onDeviceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  onDeviceText: {
    color: colors.muted,
    flex: 1,
    lineHeight: 18,
  },
  emptyEvidenceCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyEvidenceText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
