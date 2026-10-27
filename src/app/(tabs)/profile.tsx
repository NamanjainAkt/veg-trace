import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  User,
  ShieldCheck,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useSessionStore } from '../../store/useSessionStore';
import { DietaryPreferences } from '../../types';

const RADIO_OUTER = 20;
const RADIO_INNER = 10;

const DIET_OPTIONS: Array<{
  id: DietaryPreferences['dietType'];
  titleKey: string;
  descKey: string;
}> = [
  { id: 'strict_vegetarian', titleKey: 'profile.dietStrict', descKey: 'profile.dietStrictBody' },
  { id: 'lacto_vegetarian', titleKey: 'profile.dietLacto', descKey: 'profile.dietLactoBody' },
  { id: 'vegan', titleKey: 'profile.dietVegan', descKey: 'profile.dietVeganBody' },
  { id: 'flexible', titleKey: 'profile.dietFlexible', descKey: 'profile.dietFlexibleBody' },
];

const WATCHLIST: Array<{
  id: 'flagE471' | 'flagGelatin' | 'flagCarmine' | 'flagShellac';
  label: string;
}> = [
  { id: 'flagE471', label: 'INS 471 / E471 (Mono & Diglycerides)' },
  { id: 'flagGelatin', label: 'INS 441 / E441 (Gelatin)' },
  { id: 'flagCarmine', label: 'INS 120 / E120 (Carmine / Cochineal)' },
  { id: 'flagShellac', label: 'INS 904 / E904 (Shellac Glaze)' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const prefs = usePreferencesStore((s) => s.prefs);
  const updatePrefs = usePreferencesStore((s) => s.updatePrefs);
  const user = useSessionStore((s) => s.user);
  const syncing = useSessionStore((s) => s.syncing);
  const lastSync = useSessionStore((s) => s.lastSync);
  const signOut = useSessionStore((s) => s.signOut);
  const syncNow = useSessionStore((s) => s.syncNow);

  const [savedNotice, setSavedNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    []
  );

  const updatePreference = async <K extends keyof DietaryPreferences>(
    key: K,
    value: DietaryPreferences[K]
  ) => {
    await updatePrefs({ [key]: value } as Partial<DietaryPreferences>);
    setSavedNotice(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Account Info Card */}
      <View style={[styles.accountCard, shadows.subtle]}>
        <View style={styles.avatarCircle}>
          <User size={28} color={colors.white} />
        </View>
          <View style={styles.accountTextWrapper}>
            <View style={styles.accountNameRow}>
              <Text style={[typography.titleMd, styles.accountName]} numberOfLines={1}>
                {user?.name || t('profile.localProfile')}
              </Text>
              <Badge
                label={user ? t('profile.googleBadge') : t('profile.guest')}
                status="neutral"
                size="sm"
                style={{ flexShrink: 0 }}
              />
            </View>
            <Text style={[typography.captionSm, styles.accountEmail]}>
              {user?.email || t('profile.persistNote')}
            </Text>
          </View>
        </View>

        {/* Session & Sync */}
        {user ? (
          <View style={styles.section}>
            <Text style={[typography.captionSm, styles.sectionSubtitle]}>
              {t('profile.syncHint')}
            </Text>
            <View style={styles.sessionRow}>
              <Button
                title={syncing ? t('profile.syncing') : t('profile.syncNow')}
                variant="outline"
                size="md"
                disabled={syncing}
                onPress={() => void syncNow()}
                style={styles.sessionBtn}
              />
              <Button
                title={t('profile.signOut')}
                variant="ghost"
                size="md"
                onPress={() => void signOut()}
                style={styles.sessionBtn}
              />
            </View>
            {lastSync ? (
              <Text style={[typography.captionSm, styles.syncNote]}>
                {t('profile.synced', { pushed: lastSync.pushed })}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.section}>
            <Button
              title={t('profile.signIn')}
              variant="outline"
              size="md"
              fullWidth
              onPress={() => router.push('/(auth)/login' as any)}
            />
          </View>
        )}

      {/* Auto-save notification banner */}
      {savedNotice && (
        <View style={styles.savedBanner}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={[typography.captionSm, styles.savedBannerText]}>
            {t('profile.savedBanner')}
          </Text>
        </View>
      )}

      {/* Primary Diet Mode Selection */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('profile.dietTitle')}
        </Text>
        <Text style={[typography.captionSm, styles.sectionSubtitle]}>
          {t('profile.dietBody')}
        </Text>

        <View style={styles.dietOptionsContainer}>
          {DIET_OPTIONS.map((option) => {
            const isSelected = prefs.dietType === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => updatePreference('dietType', option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={t(option.titleKey)}
                style={[
                  styles.dietOptionCard,
                  {
                    borderColor: isSelected ? colors.primary : colors.hairline,
                    backgroundColor: isSelected ? colors.primaryLight : colors.canvas,
                  },
                ]}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isSelected ? colors.primary : colors.mutedSoft },
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[typography.titleSm, styles.optionTitle]}>
                      {t(option.titleKey)}
                    </Text>
                    <Text style={[typography.captionSm, styles.optionDesc]}>
                      {t(option.descKey)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Strict Undisclosed Mode Toggle (PRD Core Principle) */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('profile.verdictBehavior')}
        </Text>

        <View style={[styles.switchCard, shadows.subtle]}>
          <View style={styles.switchTextContainer}>
            <View style={styles.switchTitleRow}>
              <AlertTriangle size={18} color={colors.verdicts.sourceUndisclosed.color} />
              <Text style={[typography.titleSm, styles.switchTitle]}>
                {t('profile.strictTitle')}
              </Text>
            </View>
            <Text style={[typography.captionSm, styles.switchSubtitle]}>
              {t('profile.strictBody')}
            </Text>
          </View>
          <Switch
            value={prefs.strictUndisclosedMode}
            onValueChange={(val) => updatePreference('strictUndisclosedMode', val)}
            trackColor={{ false: colors.hairline, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Specific Additive Watchlist */}
      <View style={styles.section}>
        <Text style={[typography.titleMd, styles.sectionTitle]}>
          {t('profile.watchlist')}
        </Text>
        <Text style={[typography.captionSm, styles.sectionSubtitle]}>
          {t('profile.watchlistBody')}
        </Text>

        <View style={styles.watchlistContainer}>
          {WATCHLIST.map((item) => (
            <View key={item.id} style={styles.watchlistItem}>
              <Text style={[typography.bodySm, styles.watchlistLabel]}>
                {item.label}
              </Text>
              <Switch
                value={prefs[item.id]}
                onValueChange={(val) => updatePreference(item.id, val)}
                trackColor={{ false: colors.hairline, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Settings Navigation Links */}
      <View style={styles.section}>
        <Pressable
          onPress={() => router.push('/settings' as any)}
          style={styles.navRow}
        >
          <View style={styles.navLeft}>
            <Settings size={20} color={colors.ink} />
            <Text style={[typography.titleSm, styles.navLabel]}>
              {t('profile.settingsNav')}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings/privacy' as any)}
          style={styles.navRow}
        >
          <View style={styles.navLeft}>
            <ShieldCheck size={20} color={colors.ink} />
            <Text style={[typography.titleSm, styles.navLabel]}>
              {t('profile.privacyNav')}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  accountTextWrapper: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  accountName: {
    color: colors.ink,
  },
  accountEmail: {
    color: colors.muted,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.verdicts.vegetarian.background,
    borderColor: colors.verdicts.vegetarian.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  savedBannerText: {
    color: colors.verdicts.vegetarian.color,
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
  dietOptionsContainer: {
    gap: spacing.sm,
  },
  dietOptionCard: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioOuter: {
    width: RADIO_OUTER,
    height: RADIO_OUTER,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: spacing.sm,
  },
  radioInner: {
    width: RADIO_INNER,
    height: RADIO_INNER,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: colors.ink,
    marginBottom: 2,
  },
  optionDesc: {
    color: colors.body,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  switchTitle: {
    color: colors.ink,
  },
  switchSubtitle: {
    color: colors.muted,
  },
  watchlistContainer: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    minHeight: 48,
  },
  watchlistLabel: {
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    minHeight: 48,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  navLabel: {
    color: colors.ink,
  },
  sessionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sessionBtn: {
    flex: 1,
  },
  syncNote: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
