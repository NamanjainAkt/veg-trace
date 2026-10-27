import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, EyeOff, ServerOff, Cloud } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
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
      <View style={styles.header}>
        <ShieldCheck size={40} color={colors.primary} />
        <Text style={[typography.displayLg, styles.title]}>
          {t('privacy.title')}
        </Text>
        <Text style={[typography.bodySm, styles.subtitle]}>
          {t('privacy.subtitle')}
        </Text>
      </View>

      {/* Cloud Sync Consent Control (DPDP / PRD Sec 32) */}
      <View style={[styles.consentCard, shadows.card]}>
        <View style={styles.consentHeader}>
          <View style={styles.consentIconCircle}>
            <Cloud size={20} color={colors.primary} />
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
          style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
        />
      </View>

      <View style={[styles.pledgeCard, shadows.card]}>
        <View style={styles.pledgeHeader}>
          <Text style={[typography.titleSm, styles.pledgeTitle]}>
            {t('privacy.pledgeTitle')}
          </Text>
          <Badge label="Pledge" status="vegetarian" size="sm" />
        </View>

        <View style={styles.pledgeList}>
          <View style={styles.pledgeItem}>
            <View style={styles.iconCircle}>
              <ServerOff size={20} color={colors.primary} />
            </View>
            <View style={styles.pledgeTextWrapper}>
              <Text style={[typography.titleSm, styles.itemTitle]}>
                {t('privacy.engineTitle')}
              </Text>
              <Text style={[typography.bodySm, styles.itemDesc]}>
                {t('privacy.engineBody')}
              </Text>
            </View>
          </View>

          <View style={styles.pledgeItem}>
            <View style={styles.iconCircle}>
              <EyeOff size={20} color={colors.primary} />
            </View>
            <View style={styles.pledgeTextWrapper}>
              <Text style={[typography.titleSm, styles.itemTitle]}>
                {t('privacy.trackingTitle')}
              </Text>
              <Text style={[typography.bodySm, styles.itemDesc]}>
                {t('privacy.trackingBody')}
              </Text>
            </View>
          </View>

          <View style={styles.pledgeItem}>
            <View style={styles.iconCircle}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.pledgeTextWrapper}>
              <Text style={[typography.titleSm, styles.itemTitle]}>
                {t('privacy.storageTitle')}
              </Text>
              <Text style={[typography.bodySm, styles.itemDesc]}>
                {t('privacy.storageBody')}
              </Text>
            </View>
          </View>
        </View>
      </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
  },
  consentCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  consentTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  consentTitle: {
    color: colors.ink,
    marginBottom: 2,
  },
  consentDesc: {
    color: colors.muted,
    lineHeight: 18,
  },
  pledgeCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
  },
  pledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  pledgeTitle: {
    color: colors.ink,
  },
  pledgeList: {
    gap: spacing.lg,
  },
  pledgeItem: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pledgeTextWrapper: {
    flex: 1,
  },
  itemTitle: {
    color: colors.ink,
    marginBottom: 2,
  },
  itemDesc: {
    color: colors.body,
    lineHeight: 20,
  },
});
