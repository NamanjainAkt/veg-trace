import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  ShieldAlert,
  Send,
  Search,
} from 'lucide-react-native';
import { colors, VerdictStatus } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { getVerdictStrings } from '../../i18n/strings';
import { SourceCard } from '../../components/verification/SourceCard';
import { SourcingInquiryForm } from '../../components/forms/SourcingInquiryForm';
import { AdditiveDefinition, lookupAdditive } from '../../services/knowledgeBase';

function resolveAdditive(raw: string | undefined): AdditiveDefinition | null {
  if (!raw) return null;
  const direct = lookupAdditive(raw);
  if (direct) return direct;

  const normalized = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!normalized) return null;

  const candidates = [normalized];
  if (/^INS\d{3,4}[A-Z]?$/.test(normalized)) candidates.push(`E${normalized.slice(3)}`);
  if (/^\d{3,4}[A-Z]?$/.test(normalized)) candidates.push(`E${normalized}`);
  for (const candidate of candidates) {
    const def = lookupAdditive(candidate);
    if (def) return def;
  }
  return null;
}

export default function IngredientDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const language = usePreferencesStore((s) => s.language);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const additive = resolveAdditive(code);

  if (!additive) {
    return (
      <View style={styles.missingContainer}>
        <Search size={44} color={colors.mutedSoft} />
        <Text style={[typography.titleMd, styles.missingTitle]}>
          {t('ingredient.unknownTitle')}
        </Text>
        <Text style={[typography.bodySm, styles.missingBody]}>
          {t('ingredient.unknownBody', { code: code ?? '' })}
        </Text>
        <Button
          title={t('ingredient.submitDisclosure')}
          variant="outline"
          onPress={() => setShowInquiryModal(true)}
          style={{ marginTop: spacing.md }}
        />
        <Button
          title={t('common.backHome')}
          variant="outline"
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginTop: spacing.sm }}
        />
        <Modal
          visible={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          title={t('forms.inquiryTitle')}
        >
          <SourcingInquiryForm
            initialAdditive={code ?? ''}
            onSuccess={() => setShowInquiryModal(false)}
          />
        </Modal>
      </View>
    );
  }

  const displayCode = `${additive.code} / INS ${additive.insNumber}`;
  const displayVerdict = additive.defaultVerdict;
  const origins = additive.possibleOrigins;

  const verdictConfig =
    colors.verdicts[displayVerdict as VerdictStatus] ||
    colors.verdicts.sourceUndisclosed;
  const verdictText =
    getVerdictStrings(language)[displayVerdict as VerdictStatus] ||
    getVerdictStrings(language).sourceUndisclosed;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Information */}
      <View style={styles.header}>
        <View style={styles.codeRow}>
          <View style={styles.codeBadgeContainer}>
            <Text style={[typography.micro, styles.codeBadgeText]}>
              {displayCode}
            </Text>
          </View>
          <Badge label={verdictText.label} status={displayVerdict} size="sm" style={{ flexShrink: 0 }} />
        </View>

        <Text style={[typography.displayLg, styles.name]}>{additive.name}</Text>
        <Text style={[typography.bodySm, styles.scientificName]}>
          {t('ingredient.classification', { origins: origins.join(' / ') })}
        </Text>
      </View>

      {/* Philosophy Dilemma Card */}
      <View style={[styles.dilemmaCard, shadows.card]}>
        <View style={styles.dilemmaHeader}>
          <Scale size={20} color={colors.primary} />
          <Text style={[typography.titleSm, styles.dilemmaTitle]}>
            {t('ingredient.dualTitle')}
          </Text>
        </View>
        <Text style={[typography.bodySm, styles.dilemmaBody]}>
          {additive.description}
        </Text>
        {additive.disclosureAdvice && (
          <View style={styles.disclosureAlert}>
            <ShieldAlert size={18} color={verdictConfig.color} />
            <Text style={[typography.captionSm, styles.disclosureText]}>
              {additive.disclosureAdvice}
            </Text>
          </View>
        )}
      </View>

      {/* Possible Origin Breakdown */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('ingredient.originsTitle')}
        </Text>
        <Text style={[typography.captionSm, styles.sectionSubtitle]}>
          {t('ingredient.originsBody')}
        </Text>

        {origins.includes('plant') && (
          <SourceCard
            originType="plant"
            title={t('ingredient.plantTitle')}
            description={t('ingredient.plantBody')}
            likelihood="common"
          />
        )}

        {origins.includes('animal') && (
          <SourceCard
            originType="animal"
            title={t('ingredient.animalTitle')}
            description={t('ingredient.animalBody')}
            likelihood="occasional"
            isSuspected={displayVerdict === 'sourceUndisclosed'}
          />
        )}

        {origins.includes('synthetic') && (
          <SourceCard
            originType="synthetic"
            title={t('ingredient.syntheticTitle')}
            description={t('ingredient.syntheticBody')}
            likelihood="occasional"
          />
        )}

        {origins.includes('mineral') && (
          <SourceCard
            originType="mineral"
            title={t('ingredient.mineralTitle')}
            description={t('ingredient.mineralBody')}
            likelihood="common"
          />
        )}
      </View>

      {/* Action CTA */}
      <View style={styles.actionContainer}>
        <Button
          title={t('ingredient.submitDisclosure')}
          icon={<Send size={16} color={colors.white} />}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => setShowInquiryModal(true)}
        />
      </View>

      {/* Sourcing Inquiry Modal Form */}
      <Modal
        visible={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        title={t('forms.inquiryTitle')}
      >
        <SourcingInquiryForm
          initialAdditive={additive.code}
          onSuccess={() => setShowInquiryModal(false)}
        />
      </Modal>
    </ScrollView>
  );
}

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
  missingContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.ink,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  missingBody: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  header: {
    marginBottom: spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  codeBadgeContainer: {
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    flexShrink: 0,
  },
  codeBadgeText: {
    color: colors.ink,
    fontWeight: '600',
  },
  name: {
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  scientificName: {
    color: colors.muted,
  },
  dilemmaCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  dilemmaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dilemmaTitle: {
    color: colors.ink,
  },
  dilemmaBody: {
    color: colors.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  disclosureAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.verdicts.sourceUndisclosed.border,
    padding: spacing.md,
  },
  disclosureText: {
    color: colors.verdicts.sourceUndisclosed.color,
    flex: 1,
    lineHeight: 18,
  },
  section: {
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
  actionContainer: {
    marginTop: spacing.md,
  },
});
