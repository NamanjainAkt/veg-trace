import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Scale,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, VerdictStatus } from '../../design-system/colors';
import { AppLanguage, getVerdictStrings } from '../../i18n/strings';
import { typography } from '../../design-system/typography';
import { spacing, radius, shadows } from '../../design-system/spacing';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { Badge } from '../ui/Badge';

const VERDICT_ICON_DIM = 36;
const COMPACT_ICON_DIM = 30;

export interface VerdictCardProps {
  verdict: VerdictStatus;
  confidence: number;
  summary?: string;
  style?: ViewStyle;
  compact?: boolean;
  language?: AppLanguage;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  verdict,
  confidence,
  summary,
  style,
  compact = false,
  language = 'en',
}) => {
  const config = colors.verdicts[verdict];
  const text = getVerdictStrings(language)[verdict];

  const renderIcon = (size: number) => {
    switch (verdict) {
      case 'vegetarian':
        return <CheckCircle2 size={size} color={config.color} />;
      case 'nonVegetarian':
        return <XCircle size={size} color={config.color} />;
      case 'sourceUndisclosed':
        return <ShieldAlert size={size} color={config.color} />;
      case 'sourceDependent':
        return <AlertTriangle size={size} color={config.color} />;
      case 'unknown':
      default:
        return <HelpCircle size={size} color={config.color} />;
    }
  };

  if (compact) {
    return (
      <View
        style={[
          styles.compactCard,
          {
            backgroundColor: config.background,
            borderColor: config.border,
          },
          style,
        ]}
      >
        <View style={styles.compactRow}>
          <View style={[styles.compactIconCircle, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
            {renderIcon(18)}
          </View>
          <View style={styles.compactTextContainer}>
            <Text style={[typography.titleSm, { color: config.color }]} numberOfLines={1}>
              {text.label}
            </Text>
            <Text
              style={[typography.captionSm, { color: colors.body }]}
              numberOfLines={1}
            >
              {text.description}
            </Text>
          </View>
          <Badge label={text.badge} status={verdict} size="sm" />
        </View>
      </View>
    );
  }

  const isSuspiciousOrAmbiguous =
    verdict === 'sourceUndisclosed' || verdict === 'sourceDependent';

  return (
    <View
      style={[
        styles.heroCard,
        shadows.subtle,
        {
          backgroundColor: config.background,
          borderColor: config.border,
        },
        style,
      ]}
    >
      {/* Top Accent Strip */}
      <View style={[styles.accentStrip, { backgroundColor: config.color }]} />

      {/* Header Row */}
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          {renderIcon(22)}
        </View>

        <View style={styles.titleCol}>
          <Text style={[typography.titleMd, styles.verdictTitle, { color: config.color }]}>
            {text.label.toUpperCase()}
          </Text>
          <Text style={[typography.captionSm, styles.verdictSubtitle]} numberOfLines={1}>
            {text.description}
          </Text>
        </View>

        <Badge label={text.badge} status={verdict} size="sm" />
      </View>

      {/* Summary Explanation */}
      {summary && (
        <Text style={[typography.bodySm, styles.summaryText]}>
          {summary}
        </Text>
      )}

      {/* Philosophy Callout (PRD Section 1: Known ≠ Assumed) */}
      {isSuspiciousOrAmbiguous && (
        <View style={styles.philosophyBox}>
          <Scale size={16} color={config.color} style={{ marginTop: 2 }} />
          <Text style={[typography.captionSm, styles.philosophyText]}>
            <Text style={styles.philosophyBold}>Known ≠ Assumed. </Text>
            VegTrace does not classify dual-origin ingredients as vegetarian without manufacturer verification.
          </Text>
        </View>
      )}

      {/* Bottom Confidence & Verification Footer */}
      <View style={styles.bottomRow}>
        <ConfidenceIndicator score={confidence} size="sm" />
        <View style={styles.verifiedTag}>
          <ShieldCheck size={14} color={colors.muted} />
          <Text style={[typography.micro, styles.verifiedText]}>
            VegTrace Verified Engine
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
  },
  iconCircle: {
    width: VERDICT_ICON_DIM,
    height: VERDICT_ICON_DIM,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  verdictTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verdictSubtitle: {
    color: colors.body,
    marginTop: 1,
  },
  summaryText: {
    color: colors.ink,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  philosophyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  philosophyText: {
    flex: 1,
    color: colors.body,
    lineHeight: 18,
  },
  philosophyBold: {
    fontWeight: '600',
    color: colors.ink,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: colors.muted,
  },
  compactCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactIconCircle: {
    width: COMPACT_ICON_DIM,
    height: COMPACT_ICON_DIM,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  compactTextContainer: {
    flex: 1,
    minWidth: 0,
  },
});
