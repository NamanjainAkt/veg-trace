import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Database,
  Cpu,
  Scale,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { staggerDelay } from '../../design-system/motion';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';

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
      <FadeSlideIn delay={staggerDelay(0)}>
        <View style={[styles.headerCard, shadows.subtle]}>
          <View style={styles.badgeRow}>
            <Badge label="v1.0.0 Production" status="vegetarian" size="sm" showDot />
            <Badge label={t('about.offlineBadge')} status="neutral" size="sm" />
          </View>
          <Text style={[typography.titleMd, styles.brandTitle]}>VegTrace</Text>
          <Text style={[typography.captionSm, styles.tagline]}>
            {t('about.tagline')}
          </Text>
        </View>
      </FadeSlideIn>

      {/* Core Principle */}
      <FadeSlideIn delay={staggerDelay(1)}>
        <View style={styles.section}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
            {t('about.principle')}
          </Text>
          <View style={[styles.principleCard, shadows.subtle]}>
            <Text style={[typography.titleSm, styles.principleHighlight]}>
              {t('onboarding.heroTitle')}
            </Text>
            <Text style={[typography.captionSm, styles.principleBody]}>
              {t('about.principleBody')}
            </Text>
          </View>
        </View>
      </FadeSlideIn>

      {/* Data & Biochemical Taxonomies */}
      <FadeSlideIn delay={staggerDelay(2)}>
        <View style={styles.section}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
            {t('about.sources')}
          </Text>

          <View style={[styles.sourceItem, shadows.subtle]}>
            <Database size={16} color={colors.primary} />
            <View style={styles.sourceTextCol}>
              <Text style={[typography.titleSm, styles.sourceTitle]}>
                Open Food Facts
              </Text>
              <Text style={[typography.captionSm, styles.sourceDesc]}>
                {t('about.offBody')}
              </Text>
            </View>
          </View>

          <View style={[styles.sourceItem, shadows.subtle]}>
            <Cpu size={16} color={colors.primary} />
            <View style={styles.sourceTextCol}>
              <Text style={[typography.titleSm, styles.sourceTitle]}>
                INS & Codex Alimentarius
              </Text>
              <Text style={[typography.captionSm, styles.sourceDesc]}>
                {t('about.insBody')}
              </Text>
            </View>
          </View>

          <View style={[styles.sourceItem, shadows.subtle]}>
            <ShieldCheck size={16} color={colors.success} />
            <View style={styles.sourceTextCol}>
              <Text style={[typography.titleSm, styles.sourceTitle]}>
                {t('about.zeroTitle')}
              </Text>
              <Text style={[typography.captionSm, styles.sourceDesc]}>
                {t('about.zeroBody')}
              </Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Legal & Medical Disclaimer */}
      <FadeSlideIn delay={staggerDelay(3)}>
        <View style={styles.section}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
            {t('about.disclaimer')}
          </Text>
          <View style={[styles.disclaimerCard, shadows.subtle]}>
            <Scale size={16} color={colors.muted} />
            <Text style={[typography.captionSm, styles.disclaimerText]}>
              {t('about.disclaimerBody')}
            </Text>
          </View>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={staggerDelay(4)}>
        <Button
          title={t('about.back')}
          variant="outline"
          size="sm"
          onPress={() => router.back()}
          style={{ marginTop: spacing.xs }}
        />
      </FadeSlideIn>
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
  headerCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  brandTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  tagline: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xxs + 2,
  },
  principleCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  principleHighlight: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  principleBody: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 16,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  sourceTextCol: {
    flex: 1,
  },
  sourceTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  sourceDesc: {
    color: colors.body,
    fontSize: 11,
    lineHeight: 15,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  disclaimerText: {
    color: colors.muted,
    flex: 1,
    lineHeight: 15,
    fontSize: 11,
  },
});
