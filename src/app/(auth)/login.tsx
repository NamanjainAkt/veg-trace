import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '../../store/useSessionStore';

/**
 * Guest-first auth (PRD Sec 31). Google OAuth via Appwrite when the
 * provider is enabled in the console; guest mode always works offline.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const signingIn = useSessionStore((s) => s.signingIn);
  const error = useSessionStore((s) => s.error);
  const signInWithGoogle = useSessionStore((s) => s.signInWithGoogle);
  const user = useSessionStore((s) => s.user);

  const handleGoogle = async () => {
    const ok = await signInWithGoogle();
    if (ok) router.replace('/(tabs)/home');
  };

  const errorText =
    error === 'not_configured'
      ? t('login.notConfigured')
      : error === 'cancelled'
        ? t('login.cancelled')
        : error
          ? t('login.failed')
          : null;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <UserRound size={32} color={colors.primary} />
      </View>
      <Text style={[typography.titleMd, styles.title]}>{t('login.title')}</Text>
      <Text style={[typography.bodySm, styles.subtitle]}>
        {t('login.body')}
      </Text>
      {user ? (
        <Text style={[typography.bodySm, styles.signedIn]}>
          {user.email}
        </Text>
      ) : null}
      <Button
        title={signingIn ? t('login.signingIn') : t('login.google')}
        size="lg"
        fullWidth
        disabled={signingIn}
        onPress={handleGoogle}
        style={styles.primaryBtn}
      />
      {errorText ? (
        <Text style={[typography.captionSm, styles.errorText]}>
          {errorText}
        </Text>
      ) : null}
      <Button
        title={t('login.continue')}
        size="md"
        variant="ghost"
        fullWidth
        disabled={signingIn}
        onPress={() => router.replace('/(tabs)/home')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.ink,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  signedIn: {
    color: colors.success,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
});
