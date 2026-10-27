import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Linking } from 'react-native';
import { ExternalLink, ShieldCheck, FileText } from 'lucide-react-native';
import { VerificationEvidence } from '../../types';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { Badge } from '../ui/Badge';
import { useTranslation } from 'react-i18next';

export interface EvidenceCardProps {
  evidence: VerificationEvidence;
  style?: ViewStyle;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, style }) => {
  const verdictConfig = colors.verdicts[evidence.verdict];
  const { t } = useTranslation();

  const handleOpenSource = () => {
    if (evidence.sourceUrl && /^https:\/\/[^\s]+$/.test(evidence.sourceUrl)) {
      Linking.openURL(evidence.sourceUrl).catch(() => {});
    }
  };

  return (
    <View style={[styles.card, shadows.subtle, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FileText size={18} color={colors.primary} style={styles.icon} />
          <View style={styles.titleTextWrapper}>
            <Text style={[typography.titleSm, styles.title]} numberOfLines={1}>
              {evidence.sourceTitle}
            </Text>
            <Text style={[typography.micro, styles.date]}>{evidence.date}</Text>
          </View>
        </View>
        <Badge label={verdictConfig.label} status={evidence.verdict} size="sm" />
      </View>

      <View style={styles.snippetContainer}>
        <Text style={[typography.bodySm, styles.snippet]}>"{evidence.snippet}"</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.confidenceRow}>
          <ShieldCheck size={14} color={colors.muted} />
          <Text style={[typography.micro, styles.confidenceText]}>
            {t('evidence.quality', { score: evidence.confidenceScore })}
          </Text>
        </View>

        {evidence.sourceUrl && (
          <Pressable
            onPress={handleOpenSource}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.linkButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[typography.micro, styles.linkText]}>{t('evidence.viewAudit')}</Text>
            <ExternalLink size={12} color={colors.primary} style={{ marginLeft: 3 }} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  titleTextWrapper: {
    flex: 1,
  },
  title: {
    color: colors.ink,
  },
  date: {
    color: colors.mutedSoft,
  },
  snippetContainer: {
    backgroundColor: colors.surfaceSoft,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  snippet: {
    color: colors.body,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    color: colors.muted,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
