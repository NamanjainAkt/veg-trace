import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';
import { Button } from '../../components/ui/Button';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { staggerDelay } from '../../design-system/motion';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '../../store/useSessionStore';

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
      <FadeSlideIn delay={staggerDelay(0)} style={styles.headerBlock}>
        <View style={styles.iconCircle}>
          <UserRound size={26} color={colors.primary} />
        </View>
        <Text style={[typography.titleSm, styles.title]}>{t('login.title')}</Text>
      </FadeSlideIn>

      <FadeSlideIn delay={staggerDelay(1)}>
        <Text style={[typography.captionSm, styles.subtitle]}>
          {t('login.body')}
        </Text>
      </FadeSlideIn>

      <FadeSlideIn delay={staggerDelay(2)} style={styles.actionsBlock}>
        {user ? (
          <Text style={[typography.micro, styles.signedIn]}>
            {user.email}
          </Text>
        ) : null}
        <Button
          title={signingIn ? t('login.signingIn') : t('login.google')}
          size="md"
          fullWidth
          disabled={signingIn}
          onPress={handleGoogle}
          style={styles.primaryBtn}
        />
        {errorText ? (
          <Text style={[typography.micro, styles.errorText]}>
            {errorText}
          </Text>
        ) : null}
        <Button
          title={t('login.continue')}
          size="sm"
          variant="ghost"
          fullWidth
          disabled={signingIn}
          onPress={() => router.replace('/(tabs)/home')}
        />
      </FadeSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  headerBlock: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 13,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  actionsBlock: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  signedIn: {
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  primaryBtn: {
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 11,
  },
});
