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
import { ShieldCheck, Camera, FileSearch, Sparkles } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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
          <Text style={[typography.displayMd, styles.logoText]}>VegTrace</Text>
          <View style={styles.greenDot} />
        </View>
        <Badge label={t('onboarding.auditBadge')} status="vegetarian" size="sm" />
      </View>

      {/* Hero Visual Card */}
      <View style={[styles.heroCard, shadows.card]}>
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
          <Text style={[typography.displayXl, styles.heroTitle]}>
            {t('onboarding.heroTitle')}
          </Text>
          <Text style={[typography.bodyMd, styles.heroSubtitle]}>
            {t('onboarding.heroBody')}
          </Text>
        </View>
      </View>

      {/* 3 Pillar Cards */}
      <View style={styles.pillarsSection}>
        <View style={[styles.pillarCard, shadows.subtle]}>
          <View style={styles.pillarIconCircle}>
            <Camera size={22} color={colors.primary} />
          </View>
          <View style={styles.pillarTextWrapper}>
            <View style={styles.pillarHeaderRow}>
              <Text style={[typography.titleSm, styles.pillarTitle]}>
                {t('onboarding.ocrTitle')}
              </Text>
              <Badge label={t('onboarding.ocrBadge')} status="vegetarian" size="sm" />
            </View>
            <Text style={[typography.bodySm, styles.pillarDesc]}>
              {t('onboarding.ocrBody')}
            </Text>
          </View>
        </View>

        <View style={[styles.pillarCard, shadows.subtle]}>
          <View style={styles.pillarIconCircle}>
            <ShieldCheck size={22} color={colors.primary} />
          </View>
          <View style={styles.pillarTextWrapper}>
            <View style={styles.pillarHeaderRow}>
              <Text style={[typography.titleSm, styles.pillarTitle]}>
                {t('onboarding.evidenceTitle')}
              </Text>
              <Badge label={t('onboarding.evidenceBadge')} status="brand" size="sm" />
            </View>
            <Text style={[typography.bodySm, styles.pillarDesc]}>
              {t('onboarding.evidenceBody')}
            </Text>
          </View>
        </View>

        <View style={[styles.pillarCard, shadows.subtle]}>
          <View style={styles.pillarIconCircle}>
            <FileSearch size={22} color={colors.primary} />
          </View>
          <View style={styles.pillarTextWrapper}>
            <View style={styles.pillarHeaderRow}>
              <Text style={[typography.titleSm, styles.pillarTitle]}>
                {t('onboarding.sourceTitle')}
              </Text>
              <Badge label={t('onboarding.sourceBadge')} status="sourceDependent" size="sm" />
            </View>
            <Text style={[typography.bodySm, styles.pillarDesc]}>
              {t('onboarding.sourceBody')}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title={t('onboarding.startBtn')}
          onPress={handleFinish}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.primaryBtn}
        />
        <Button
          title={t('onboarding.guestBtn')}
          onPress={handleFinish}
          variant="ghost"
          size="md"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const HERO_IMAGE_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    color: colors.ink,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  heroCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.xl,
  },
  heroImage: {
    width: '100%',
    height: HERO_IMAGE_HEIGHT,
  },
  heroOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  heroTextContainer: {
    padding: spacing.xl,
  },
  heroTitle: {
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    color: colors.body,
    lineHeight: 22,
  },
  pillarsSection: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  pillarCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  pillarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pillarTextWrapper: {
    flex: 1,
  },
  pillarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  pillarTitle: {
    color: colors.ink,
    flex: 1,
    marginRight: spacing.xs,
  },
  pillarDesc: {
    color: colors.muted,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: spacing.xs,
  },
  primaryBtn: {
    marginBottom: spacing.xs,
  },
});
