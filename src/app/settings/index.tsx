import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
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
      <View style={[styles.methodologyCard, shadows.card]}>
        <View style={styles.methodologyHeader}>
          <Info size={20} color={colors.primary} />
          <Text style={[typography.titleSm, styles.methodologyTitle]}>
            {t('settings.methodologyTitle')}
          </Text>
        </View>
        <Text style={[typography.bodySm, styles.methodologyBody]}>
          {t('settings.methodologyBody')}
        </Text>
      </View>

      {/* 5-Verdict Criteria Summary */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
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
              <Text style={[typography.bodySm, styles.criteriaDesc]}>
                {item.desc}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Offline Storage & Cache Management */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('settings.offlineTitle')}
        </Text>
        <View style={[styles.cacheCard, shadows.subtle]}>
          <View style={styles.cacheRow}>
            <View style={styles.cacheLeft}>
              <Database size={20} color={colors.ink} />
              <View>
                <Text style={[typography.titleSm, styles.cacheTitle]}>
                  {t('settings.kbTitle')}
                </Text>
                <Text style={[typography.captionSm, styles.cacheSubtitle]}>
                  {t('settings.kbBody', { count: additiveCount })}
                </Text>
              </View>
            </View>
            <Badge label="Pre-loaded" status="vegetarian" size="sm" />
          </View>

          <View style={styles.divider} />

          <View style={styles.cacheRow}>
            <View style={styles.cacheLeft}>
              <Trash2 size={20} color={colors.muted} />
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
              <Cloud size={20} color={colors.primary} />
              <View style={{ flex: 1, marginRight: spacing.sm }}>
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

      {/* Language / Internationalization (PRD Section 33) */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('settings.languageTitle')}
        </Text>
        <View style={styles.langCard}>
          <View style={styles.langRow}>
            <Globe size={20} color={colors.ink} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
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
              <Pressable
                key={option.code}
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
                <Text style={[typography.captionSm, styles.langSubtitle]}>
                  {option.sub}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Privacy Navigation Link */}
      <Pressable
        onPress={() => router.push('/settings/privacy' as any)}
        style={styles.navRow}
      >
        <View style={styles.navLeft}>
          <ShieldCheck size={20} color={colors.primary} />
          <Text style={[typography.titleSm, styles.navLabel]}>
            {t('settings.privacy')}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      {/* About Navigation Link */}
      <Pressable
        onPress={() => router.push('/settings/about' as any)}
        style={styles.navRow}
      >
        <View style={styles.navLeft}>
          <HelpCircle size={20} color={colors.primary} />
          <Text style={[typography.titleSm, styles.navLabel]}>
            {t('settings.about')}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>
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
  methodologyCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  methodologyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  methodologyTitle: {
    color: colors.ink,
  },
  methodologyBody: {
    color: colors.body,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  criteriaBox: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    gap: spacing.sm,
  },
  criteriaRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    paddingBottom: spacing.xs,
  },
  criteriaLabel: {
    color: colors.ink,
    marginBottom: 2,
  },
  criteriaDesc: {
    color: colors.muted,
  },
  cacheCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  cacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cacheLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  cacheTitle: {
    color: colors.ink,
  },
  cacheSubtitle: {
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairlineSoft,
    marginVertical: spacing.md,
  },
  langCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langTitle: {
    color: colors.ink,
  },
  langSubtitle: {
    color: colors.muted,
  },
  langOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  langOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  langOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langOptionText: {
    color: colors.ink,
  },
  langOptionTextActive: {
    color: colors.primaryActive,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navLabel: {
    color: colors.ink,
  },
});
