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
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  User,
  ShieldCheck,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Milk,
  Sprout,
  Egg,
} from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { motion, springs, staggerDelay } from '../../design-system/motion';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useSessionStore } from '../../store/useSessionStore';
import { DietaryPreferences } from '../../types';

const RADIO_OUTER = 18;
const RADIO_INNER = 8;

const DIET_OPTIONS: Array<{
  id: DietaryPreferences['dietType'];
  icon: typeof Leaf;
  titleKey: string;
  descKey: string;
}> = [
  { id: 'strict_vegetarian', icon: Leaf, titleKey: 'profile.dietStrict', descKey: 'profile.dietStrictBody' },
  { id: 'lacto_vegetarian', icon: Milk, titleKey: 'profile.dietLacto', descKey: 'profile.dietLactoBody' },
  { id: 'vegan', icon: Sprout, titleKey: 'profile.dietVegan', descKey: 'profile.dietVeganBody' },
  { id: 'flexible', icon: Egg, titleKey: 'profile.dietFlexible', descKey: 'profile.dietFlexibleBody' },
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

interface DietOptionProps {
  icon: typeof Leaf;
  title: string;
  description: string;
  selected: boolean;
}

function DietOption({ icon: Icon, title, description, selected }: DietOptionProps) {
  const reduced = useReducedMotion();
  const dotScale = useSharedValue(selected ? 1 : 0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    dotScale.value = selected ? (reduced ? 1 : withSpring(1, springs.snap)) : 0;
    cardScale.value = selected ? (reduced ? 1.01 : withSpring(1.01, springs.snap)) : 1;
  }, [selected, reduced, dotScale, cardScale]);

  const cardAnimator = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  const dotAnimator = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dietOptionCard,
        selected ? styles.dietOptionCardSelected : null,
        cardAnimator,
      ]}
    >
      <View style={styles.optionRow}>
        <View style={styles.iconChip}>
          <Icon size={14} color={selected ? colors.terracotta : colors.ink} />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[typography.titleSm, styles.optionTitle]}>{title}</Text>
          <Text style={[typography.captionSm, styles.optionDesc]}>{description}</Text>
        </View>
        <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
          <Animated.View style={[styles.radioDot, dotAnimator]} />
        </View>
      </View>
    </Animated.View>
  );
}

function SavedCheckIcon() {
  const reduced = useReducedMotion();
  const checkScale = useSharedValue(0.6);

  useEffect(() => {
    checkScale.value = reduced ? 1 : withSpring(1, springs.snap);
  }, [reduced, checkScale]);

  const checkAnimator = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={checkAnimator}>
      <CheckCircle2 size={15} color={colors.success} />
    </Animated.View>
  );
}

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

  const handleDietPress = (id: DietaryPreferences['dietType']) => {
    if (prefs.dietType === id) return;
    try {
      void Haptics.selectionAsync();
    } catch {}
    void updatePreference('dietType', id);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Account Info Card */}
      <FadeSlideIn delay={staggerDelay(0)} style={[styles.accountCard, shadows.subtle]}>
        <View style={styles.avatarCircle}>
          <User size={20} color={colors.white} />
        </View>
        <View style={styles.accountTextWrapper}>
          <View style={styles.accountNameRow}>
            <Text style={[typography.titleSm, styles.accountName]} numberOfLines={1}>
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
      </FadeSlideIn>

      {/* Session & Sync */}
      {user ? (
        <FadeSlideIn delay={staggerDelay(0)} style={styles.section}>
          <Text style={[typography.captionSm, styles.sectionSubtitle]}>
            {t('profile.syncHint')}
          </Text>
          <View style={styles.sessionRow}>
            <Button
              title={syncing ? t('profile.syncing') : t('profile.syncNow')}
              variant="outline"
              size="sm"
              disabled={syncing}
              onPress={() => void syncNow()}
              style={styles.sessionBtn}
            />
            <Button
              title={t('profile.signOut')}
              variant="ghost"
              size="sm"
              onPress={() => void signOut()}
              style={styles.sessionBtn}
            />
          </View>
          {lastSync ? (
            <Text style={[typography.micro, styles.syncNote]}>
              {t('profile.synced', { pushed: lastSync.pushed })}
            </Text>
          ) : null}
        </FadeSlideIn>
      ) : (
        <FadeSlideIn delay={staggerDelay(0)} style={styles.section}>
          <Button
            title={t('profile.signIn')}
            variant="outline"
            size="sm"
            fullWidth
            onPress={() => router.push('/(auth)/login' as any)}
          />
        </FadeSlideIn>
      )}

      {/* Auto-save notification banner */}
      {savedNotice && (
        <Animated.View
          entering={FadeInDown.duration(motion.fast)}
          exiting={FadeOutDown.duration(motion.fast)}
          style={styles.savedBanner}
        >
          <SavedCheckIcon />
          <Text style={[typography.captionSm, styles.savedBannerText]}>
            {t('profile.savedBanner')}
          </Text>
        </Animated.View>
      )}

      {/* Primary Diet Mode Selection */}
      <FadeSlideIn delay={staggerDelay(1)} style={styles.section}>
        <Text style={[typography.titleSm, styles.sectionTitle]}>
          {t('profile.dietTitle')}
        </Text>
        <Text style={[typography.captionSm, styles.sectionSubtitle]}>
          {t('profile.dietBody')}
        </Text>

        <View style={styles.dietOptionsContainer}>
          {DIET_OPTIONS.map((option) => {
            const isSelected = prefs.dietType === option.id;
            return (
              <PressableScale
                key={option.id}
                scaleTo={0.985}
                onPress={() => handleDietPress(option.id)}
                haptic
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={t(option.titleKey)}
              >
                <DietOption
                  icon={option.icon}
                  title={t(option.titleKey)}
                  description={t(option.descKey)}
                  selected={isSelected}
                />
              </PressableScale>
            );
          })}
        </View>
      </FadeSlideIn>

      {/* Strict Undisclosed Mode Toggle (PRD Core Principle) */}
      <FadeSlideIn delay={staggerDelay(2)} style={styles.section}>
        <Text style={[typography.titleSm, styles.sectionTitle]}>
          {t('profile.verdictBehavior')}
        </Text>

        <View style={[styles.switchCard, shadows.subtle]}>
          <View style={styles.switchTextContainer}>
            <View style={styles.switchTitleRow}>
              <AlertTriangle size={15} color={colors.verdicts.sourceUndisclosed.color} />
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
      </FadeSlideIn>

      {/* Specific Additive Watchlist */}
      <FadeSlideIn delay={staggerDelay(3)} style={styles.section}>
        <Text style={[typography.titleSm, styles.sectionTitle]}>
          {t('profile.watchlist')}
        </Text>
        <Text style={[typography.captionSm, styles.sectionSubtitle]}>
          {t('profile.watchlistBody')}
        </Text>

        <View style={styles.watchlistContainer}>
          {WATCHLIST.map((item) => (
            <View key={item.id} style={styles.watchlistItem}>
              <Text style={[typography.captionSm, styles.watchlistLabel]}>
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
      </FadeSlideIn>

      {/* Settings Navigation Links */}
      <FadeSlideIn delay={staggerDelay(4)} style={styles.section}>
        <Pressable
          onPress={() => router.push('/settings' as any)}
          style={styles.navRow}
        >
          <View style={styles.navLeft}>
            <Settings size={16} color={colors.ink} />
            <Text style={[typography.captionSm, styles.navLabel]}>
              {t('profile.settingsNav')}
            </Text>
          </View>
          <ChevronRight size={15} color={colors.muted} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings/privacy' as any)}
          style={styles.navRow}
        >
          <View style={styles.navLeft}>
            <ShieldCheck size={16} color={colors.ink} />
            <Text style={[typography.captionSm, styles.navLabel]}>
              {t('profile.privacyNav')}
            </Text>
          </View>
          <ChevronRight size={15} color={colors.muted} />
        </Pressable>
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
    paddingBottom: spacing.xxl,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  accountTextWrapper: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  accountName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  accountEmail: {
    color: colors.muted,
    fontSize: 11,
  },
  sessionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  sessionBtn: {
    flex: 1,
  },
  syncNote: {
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.verdicts.vegetarian.background,
    borderColor: colors.verdicts.vegetarian.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  savedBannerText: {
    color: colors.verdicts.vegetarian.color,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  dietOptionsContainer: {
    gap: spacing.xs,
  },
  dietOptionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
  },
  dietOptionCardSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.peachSoft,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 2,
  },
  radioOuter: {
    width: RADIO_OUTER,
    height: RADIO_OUTER,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    borderColor: colors.hairline,
  },
  radioOuterSelected: {
    borderColor: colors.terracotta,
  },
  radioDot: {
    width: RADIO_INNER,
    height: RADIO_INNER,
    borderRadius: radius.full,
    backgroundColor: colors.terracotta,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  optionDesc: {
    color: colors.body,
    fontSize: 11,
    lineHeight: 14,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  switchTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  switchSubtitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  watchlistContainer: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    overflow: 'hidden',
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  watchlistLabel: {
    color: colors.ink,
    fontSize: 12,
    flex: 1,
    marginRight: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
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
