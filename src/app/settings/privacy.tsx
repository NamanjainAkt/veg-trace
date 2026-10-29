import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, EyeOff, ServerOff, Cloud } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { staggerDelay } from '../../design-system/motion';
import { Badge } from '../../components/ui/Badge';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { getCloudSyncConsent, setCloudSyncConsent } from '../../services/storage';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const [cloudConsent, setCloudConsent] = useState(false);

  useEffect(() => {
    void getCloudSyncConsent().then(setCloudConsent);
  }, []);

  const handleToggleConsent = async (val: boolean) => {
    setCloudConsent(val);
    await setCloudSyncConsent(val);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeSlideIn delay={staggerDelay(0)}>
        <View style={styles.header}>
          <ShieldCheck size={32} color={colors.primary} />
          <Text style={[typography.titleMd, styles.title]}>
            {t('privacy.title')}
          </Text>
          <Text style={[typography.captionSm, styles.subtitle]}>
            {t('privacy.subtitle')}
          </Text>
        </View>
      </FadeSlideIn>

      {/* Cloud Sync Consent Control (DPDP / PRD Sec 32) */}
      <FadeSlideIn delay={staggerDelay(1)}>
        <View style={[styles.consentCard, shadows.subtle]}>
          <View style={styles.consentHeader}>
            <View style={styles.consentIconCircle}>
              <Cloud size={16} color={colors.primary} />
            </View>
            <View style={styles.consentTextCol}>
              <Text style={[typography.titleSm, styles.consentTitle]}>
                {t('settings.cloudSyncTitle')}
              </Text>
              <Text style={[typography.captionSm, styles.consentDesc]}>
                {t('settings.cloudSyncDesc')}
              </Text>
            </View>
            <Switch
              value={cloudConsent}
              onValueChange={handleToggleConsent}
              trackColor={{ false: colors.hairline, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Badge
            label={cloudConsent ? t('settings.cloudSyncEnabled') : t('settings.cloudSyncDisabled')}
            status={cloudConsent ? 'vegetarian' : 'neutral'}
            size="sm"
            showDot
            style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
          />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={staggerDelay(2)}>
        <View style={[styles.pledgeCard, shadows.subtle]}>
          <View style={styles.pledgeHeader}>
            <Text style={[typography.titleSm, styles.pledgeTitle]}>
              {t('privacy.pledgeTitle')}
            </Text>
            <Badge label="Pledge" status="vegetarian" size="sm" showDot />
          </View>

          <View style={styles.pledgeList}>
            <View style={styles.pledgeItem}>
              <View style={styles.iconCircle}>
                <ServerOff size={16} color={colors.primary} />
              </View>
              <View style={styles.pledgeTextWrapper}>
                <Text style={[typography.titleSm, styles.itemTitle]}>
                  {t('privacy.engineTitle')}
                </Text>
                <Text style={[typography.captionSm, styles.itemDesc]}>
                  {t('privacy.engineBody')}
                </Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <View style={styles.iconCircle}>
                <EyeOff size={16} color={colors.primary} />
              </View>
              <View style={styles.pledgeTextWrapper}>
                <Text style={[typography.titleSm, styles.itemTitle]}>
                  {t('privacy.trackingTitle')}
                </Text>
                <Text style={[typography.captionSm, styles.itemDesc]}>
                  {t('privacy.trackingBody')}
                </Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <View style={styles.iconCircle}>
                <Lock size={16} color={colors.primary} />
              </View>
              <View style={styles.pledgeTextWrapper}>
                <Text style={[typography.titleSm, styles.itemTitle]}>
                  {t('privacy.storageTitle')}
                </Text>
                <Text style={[typography.captionSm, styles.itemDesc]}>
                  {t('privacy.storageBody')}
                </Text>
              </View>
            </View>
          </View>
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  consentCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  consentTextCol: {
    flex: 1,
    marginRight: spacing.xs,
  },
  consentTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  consentDesc: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  pledgeCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  pledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pledgeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  pledgeList: {
    gap: spacing.sm,
  },
  pledgeItem: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 2,
  },
  pledgeTextWrapper: {
    flex: 1,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  itemDesc: {
    color: colors.body,
    fontSize: 11,
    lineHeight: 15,
  },
});
