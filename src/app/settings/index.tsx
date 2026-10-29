import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Database,
  Globe,
  ShieldCheck,
  Info,
  ChevronRight,
  Trash2,
  HelpCircle,
  Cloud,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { staggerDelay } from '../../design-system/motion';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { ADDITIVE_DATABASE } from '../../services/knowledgeBase';
import {
  clearProductCache,
  clearScanHistory,
  getCloudSyncConsent,
  setCloudSyncConsent,
} from '../../services/storage';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { AppLanguage, SUPPORTED_LANGUAGES } from '../../i18n/strings';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [cacheCleared, setCacheCleared] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cloudConsent, setCloudConsent] = useState(false);
  const language = usePreferencesStore((s) => s.language);
  const setStoreLanguage = usePreferencesStore((s) => s.setLanguage);

  React.useEffect(() => {
    void getCloudSyncConsent().then(setCloudConsent);
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    await clearScanHistory();
    await clearProductCache();
    await useHistoryStore.getState().refresh();
    setCacheCleared(true);
    setClearing(false);
  };

  const handleToggleCloudConsent = async (val: boolean) => {
    setCloudConsent(val);
    await setCloudSyncConsent(val);
  };

  const handleLanguageChange = (code: AppLanguage) => {
    try {
      void Haptics.selectionAsync();
    } catch {}
    void setStoreLanguage(code);
  };

  const additiveCount = Object.keys(ADDITIVE_DATABASE).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Transparency & Core Principle */}
      <FadeSlideIn delay={staggerDelay(0)}>
        <View style={[styles.methodologyCard, shadows.subtle]}>
          <View style={styles.methodologyHeader}>
            <Info size={16} color={colors.primary} />
            <Text style={[typography.titleSm, styles.methodologyTitle]}>
              {t('settings.methodologyTitle')}
            </Text>
          </View>
          <Text style={[typography.captionSm, styles.methodologyBody]}>
            {t('settings.methodologyBody')}
          </Text>
        </View>
      </FadeSlideIn>

      {/* 5-Verdict Criteria Summary */}
      <FadeSlideIn delay={staggerDelay(1)}>
        <View style={styles.section}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
            {t('settings.verdictCriteria')}
          </Text>
          <View style={styles.criteriaBox}>
            {[
              {
                status: 'vegetarian',
                label: '🟢 Vegetarian',
                desc: 'No animal-derived ingredients identified.',
              },
              {
                status: 'nonVegetarian',
                label: '🔴 Non-Vegetarian',
                desc: 'Direct evidence of animal-derived ingredients.',
              },
              {
                status: 'sourceDependent',
                label: '🟡 Source Dependent',
                desc: 'Ingredient can have plant or animal origins.',
              },
              {
                status: 'sourceUndisclosed',
                label: '🟠 Source Undisclosed',
                desc: 'Manufacturer disclosure missing on packaging.',
              },
              {
                status: 'unknown',
                label: '⚪ Unknown',
                desc: 'Insufficient evidence to classify.',
              },
            ].map((item) => (
              <View key={item.status} style={styles.criteriaRow}>
                <Text style={[typography.caption, styles.criteriaLabel]}>
                  {item.label}
                </Text>
                <Text style={[typography.captionSm, styles.criteriaDesc]}>
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </FadeSlideIn>

      {/* Offline Storage & Cache Management */}
      <FadeSlideIn delay={staggerDelay(2)}>
        <View style={styles.section}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
            {t('settings.offlineTitle')}
          </Text>
          <View style={[styles.cacheCard, shadows.subtle]}>
            <View style={styles.cacheRow}>
              <View style={styles.cacheLeft}>
                <Database size={16} color={colors.ink} />
                <View>
                  <Text style={[typography.titleSm, styles.cacheTitle]}>
                    {t('settings.kbTitle')}
                  </Text>
                  <Text style={[typography.captionSm, styles.cacheSubtitle]}>
                    {t('settings.kbBody', { count: additiveCount })}
                  </Text>
                </View>
              </View>
              <Badge label="Pre-loaded" status="vegetarian" size="sm" showDot />
            </View>

            <View style={styles.divider} />

            <View style={styles.cacheRow}>
              <View style={styles.cacheLeft}>
                <Trash2 size={16} color={colors.muted} />
                <View>
                  <Text style={[typography.titleSm, styles.cacheTitle]}>
                    {t('settings.cachedTitle')}
                  </Text>
                  <Text style={[typography.captionSm, styles.cacheSubtitle]}>
                    {cacheCleared ? t('settings.clearedHistory') : t('settings.clearsDevice')}
                  </Text>
                </View>
              </View>
              <Button
                title={clearing ? t('settings.clearing') : cacheCleared ? t('settings.cleared') : t('settings.clearCache')}
                variant="outline"
                size="sm"
                disabled={cacheCleared || clearing}
                onPress={handleClearCache}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.cacheRow}>
              <View style={styles.cacheLeft}>
                <Cloud size={16} color={colors.primary} />
                <View style={{ flex: 1, marginRight: spacing.xs }}>
                  <Text style={[typography.titleSm, styles.cacheTitle]}>
                    {t('settings.cloudSyncTitle')}
                  </Text>
                  <Text style={[typography.captionSm, styles.cacheSubtitle]}>
                    {t('settings.cloudSyncDesc')}
                  </Text>
                </View>
              </View>
              <Switch
                value={cloudConsent}
                onValueChange={handleToggleCloudConsent}
                trackColor={{ false: colors.hairline, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Language / Internationalization (PRD Section 33) */}
      <FadeSlideIn delay={staggerDelay(3)}>
        <View style={styles.section}>
          <Text style={[typography.titleSm, styles.sectionTitle]}>
            {t('settings.languageTitle')}
          </Text>
          <View style={styles.langCard}>
            <View style={styles.langRow}>
              <Globe size={16} color={colors.ink} />
              <View style={{ flex: 1, marginLeft: spacing.xs + 2 }}>
                <Text style={[typography.titleSm, styles.langTitle]}>
                  {t('settings.interfaceLanguage')}
                </Text>
                <Text style={[typography.captionSm, styles.langSubtitle]}>
                  {t('settings.languageBody')}
                </Text>
              </View>
            </View>
            <View style={styles.langOptions}>
              {SUPPORTED_LANGUAGES.map((option) => (
                <PressableScale
                  key={option.code}
                  scaleTo={0.97}
                  onPress={() => handleLanguageChange(option.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: language === option.code }}
                  accessibilityLabel={`Use ${option.label}`}
                  style={[
                    styles.langOption,
                    language === option.code && styles.langOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      typography.titleSm,
                      styles.langOptionText,
                      language === option.code && styles.langOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={[typography.micro, styles.langOptionSub]}>
                    {option.sub}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Privacy Navigation Link */}
      <FadeSlideIn delay={staggerDelay(4)}>
        <PressableScale
          onPress={() => router.push('/settings/privacy' as any)}
          scaleTo={0.985}
          haptic
          style={styles.navRow}
        >
          <View style={styles.navContent}>
            <View style={styles.navLeft}>
              <ShieldCheck size={16} color={colors.primary} />
              <Text style={[typography.titleSm, styles.navLabel]}>
                {t('settings.privacy')}
              </Text>
            </View>
            <ChevronRight size={15} color={colors.muted} />
          </View>
        </PressableScale>
      </FadeSlideIn>

      {/* About Navigation Link */}
      <FadeSlideIn delay={staggerDelay(5)}>
        <PressableScale
          onPress={() => router.push('/settings/about' as any)}
          scaleTo={0.985}
          haptic
          style={styles.navRow}
        >
          <View style={styles.navContent}>
            <View style={styles.navLeft}>
              <HelpCircle size={16} color={colors.primary} />
              <Text style={[typography.titleSm, styles.navLabel]}>
                {t('settings.about')}
              </Text>
            </View>
            <ChevronRight size={15} color={colors.muted} />
          </View>
        </PressableScale>
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
  methodologyCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  methodologyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  methodologyTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  methodologyBody: {
    color: colors.body,
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
  criteriaBox: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  criteriaRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    paddingBottom: spacing.xxs + 2,
  },
  criteriaLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 1,
  },
  criteriaDesc: {
    color: colors.muted,
    fontSize: 11,
  },
  cacheCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  cacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cacheLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
    marginRight: spacing.xs,
  },
  cacheTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  cacheSubtitle: {
    color: colors.muted,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairlineSoft,
    marginVertical: spacing.xs + 2,
  },
  langCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  langSubtitle: {
    color: colors.muted,
    fontSize: 11,
  },
  langOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs + 2,
  },
  langOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radius.md,
    padding: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langOptionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  langOptionTextActive: {
    color: colors.primaryActive,
  },
  langOptionSub: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 1,
  },
  navRow: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  navLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
});
