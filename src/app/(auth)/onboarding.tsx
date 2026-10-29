import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Camera, FileSearch } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { staggerDelay } from '../../design-system/motion';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleFinish = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Badge */}
      <View style={styles.topHeader}>
        <View style={styles.logoRow}>
          <Text style={[typography.titleSm, styles.logoText]}>VegTrace</Text>
          <View style={styles.greenDot} />
        </View>
        <Badge label={t('onboarding.auditBadge')} status="vegetarian" size="sm" showDot />
      </View>

      {/* Hero Visual Card */}
      <FadeSlideIn delay={staggerDelay(0)} style={[styles.heroCard, shadows.subtle]}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
          }}
          style={styles.heroImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={styles.heroOverlay}>
          <Badge label={t('onboarding.liveBadge')} status="neutral" size="sm" />
        </View>
        <View style={styles.heroTextContainer}>
          <Text style={[typography.titleMd, styles.heroTitle]}>
            {t('onboarding.heroTitle')}
          </Text>
          <Text style={[typography.captionSm, styles.heroSubtitle]}>
            {t('onboarding.heroBody')}
          </Text>
        </View>
      </FadeSlideIn>

      {/* 3 Pillar Cards */}
      <View style={styles.pillarsSection}>
        <FadeSlideIn delay={staggerDelay(1)} style={[styles.pillarCard, shadows.subtle]}>
          <View style={styles.pillarIconCircle}>
            <Camera size={16} color={colors.primary} />
          </View>
          <View style={styles.pillarTextWrapper}>
            <View style={styles.pillarHeaderRow}>
              <Text style={[typography.titleSm, styles.pillarTitle]}>
                {t('onboarding.ocrTitle')}
              </Text>
              <Badge label={t('onboarding.ocrBadge')} status="vegetarian" size="sm" />
            </View>
            <Text style={[typography.captionSm, styles.pillarDesc]}>
              {t('onboarding.ocrBody')}
            </Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={staggerDelay(2)} style={[styles.pillarCard, shadows.subtle]}>
          <View style={styles.pillarIconCircle}>
            <ShieldCheck size={16} color={colors.primary} />
          </View>
          <View style={styles.pillarTextWrapper}>
            <View style={styles.pillarHeaderRow}>
              <Text style={[typography.titleSm, styles.pillarTitle]}>
                {t('onboarding.evidenceTitle')}
              </Text>
              <Badge label={t('onboarding.evidenceBadge')} status="brand" size="sm" />
            </View>
            <Text style={[typography.captionSm, styles.pillarDesc]}>
              {t('onboarding.evidenceBody')}
            </Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={staggerDelay(3)} style={[styles.pillarCard, shadows.subtle]}>
          <View style={styles.pillarIconCircle}>
            <FileSearch size={16} color={colors.primary} />
          </View>
          <View style={styles.pillarTextWrapper}>
            <View style={styles.pillarHeaderRow}>
              <Text style={[typography.titleSm, styles.pillarTitle]}>
                {t('onboarding.sourceTitle')}
              </Text>
              <Badge label={t('onboarding.sourceBadge')} status="sourceDependent" size="sm" />
            </View>
            <Text style={[typography.captionSm, styles.pillarDesc]}>
              {t('onboarding.sourceBody')}
            </Text>
          </View>
        </FadeSlideIn>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title={t('onboarding.startBtn')}
          onPress={handleFinish}
          variant="primary"
          size="md"
          fullWidth
          style={styles.primaryBtn}
        />
        <Button
          title={t('onboarding.guestBtn')}
          onPress={handleFinish}
          variant="ghost"
          size="sm"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const HERO_IMAGE_HEIGHT = 140;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  content: {
    paddingHorizontal: spacing.sm + 2,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  heroCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    marginBottom: spacing.xs,
  },
  heroImage: {
    width: '100%',
    height: HERO_IMAGE_HEIGHT,
  },
  heroOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  heroTextContainer: {
    padding: spacing.sm,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  heroSubtitle: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 16,
  },
  pillarsSection: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pillarCard: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  pillarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  pillarTextWrapper: {
    flex: 1,
  },
  pillarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pillarTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.xs,
  },
  pillarDesc: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  actionsContainer: {
    gap: spacing.xxs,
  },
  primaryBtn: {
    marginBottom: 2,
  },
});
