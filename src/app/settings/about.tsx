import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Database,
  Cpu,
  Heart,
  Scale,
  ExternalLink,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Header */}
      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.badgeRow}>
          <Badge label="v1.0.0 Production" status="vegetarian" size="sm" />
          <Badge label={t('about.offlineBadge')} status="neutral" size="sm" />
        </View>
        <Text style={[typography.displayLg, styles.brandTitle]}>VegTrace</Text>
        <Text style={[typography.bodyMd, styles.tagline]}>
          {t('about.tagline')}
        </Text>
      </View>

      {/* Core Principle */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('about.principle')}
        </Text>
        <View style={styles.principleCard}>
          <Text style={[typography.titleSm, styles.principleHighlight]}>
            {t('onboarding.heroTitle')}
          </Text>
          <Text style={[typography.bodySm, styles.principleBody]}>
            {t('about.principleBody')}
          </Text>
        </View>
      </View>

      {/* Data & Biochemical Taxonomies */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('about.sources')}
        </Text>

        <View style={styles.sourceItem}>
          <Database size={20} color={colors.primary} />
          <View style={styles.sourceTextCol}>
            <Text style={[typography.titleSm, styles.sourceTitle]}>
              Open Food Facts
            </Text>
            <Text style={[typography.bodySm, styles.sourceDesc]}>
              {t('about.offBody')}
            </Text>
          </View>
        </View>

        <View style={styles.sourceItem}>
          <Cpu size={20} color={colors.primary} />
          <View style={styles.sourceTextCol}>
            <Text style={[typography.titleSm, styles.sourceTitle]}>
              INS & Codex Alimentarius
            </Text>
            <Text style={[typography.bodySm, styles.sourceDesc]}>
              {t('about.insBody')}
            </Text>
          </View>
        </View>

        <View style={styles.sourceItem}>
          <ShieldCheck size={20} color={colors.success} />
          <View style={styles.sourceTextCol}>
            <Text style={[typography.titleSm, styles.sourceTitle]}>
              {t('about.zeroTitle')}
            </Text>
            <Text style={[typography.bodySm, styles.sourceDesc]}>
              {t('about.zeroBody')}
            </Text>
          </View>
        </View>
      </View>

      {/* Legal & Medical Disclaimer */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('about.disclaimer')}
        </Text>
        <View style={styles.disclaimerCard}>
          <Scale size={18} color={colors.muted} />
          <Text style={[typography.captionSm, styles.disclaimerText]}>
            {t('about.disclaimerBody')}
          </Text>
        </View>
      </View>

      <Button
        title={t('about.back')}
        variant="outline"
        size="md"
        onPress={() => router.back()}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  brandTitle: {
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  tagline: {
    color: colors.muted,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  principleCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  principleHighlight: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  principleBody: {
    color: colors.body,
    lineHeight: 20,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  sourceTextCol: {
    flex: 1,
  },
  sourceTitle: {
    color: colors.ink,
    marginBottom: 2,
  },
  sourceDesc: {
    color: colors.muted,
    lineHeight: 18,
  },
  disclaimerCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  disclaimerText: {
    flex: 1,
    color: colors.muted,
    lineHeight: 18,
  },
});
