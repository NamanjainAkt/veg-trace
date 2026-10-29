import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Sprout, Beef, FlaskConical, Mountain } from 'lucide-react-native';
import { OriginType } from '../../types';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing, radius } from '../../design-system/spacing';

export interface SourceCardProps {
  originType: OriginType;
  title: string;
  description: string;
  likelihood?: 'common' | 'occasional' | 'rare';
  isSuspected?: boolean;
  style?: ViewStyle;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  originType,
  title,
  description,
  likelihood,
  isSuspected = false,
  style,
}) => {
  const getIcon = () => {
    switch (originType) {
      case 'plant':
        return <Sprout size={16} color={colors.verdicts.vegetarian.color} />;
      case 'animal':
        return <Beef size={16} color={colors.verdicts.nonVegetarian.color} />;
      case 'synthetic':
        return <FlaskConical size={16} color={colors.muted} />;
      case 'mineral':
      default:
        return <Mountain size={16} color={colors.muted} />;
    }
  };

  const getBorderColor = () => {
    if (isSuspected) return colors.verdicts.sourceUndisclosed.border;
    if (originType === 'plant') return colors.verdicts.vegetarian.border;
    if (originType === 'animal') return colors.verdicts.nonVegetarian.border;
    return colors.hairlineSoft;
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: getBorderColor(),
          backgroundColor: isSuspected
            ? colors.verdicts.sourceUndisclosed.background
            : colors.canvas,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>{getIcon()}</View>
          <View>
            <Text style={[typography.titleSm, styles.title]}>{title}</Text>
            {likelihood && (
              <Text style={[typography.micro, styles.likelihood]}>
                Prevalence: {likelihood}
              </Text>
            )}
          </View>
        </View>
        {isSuspected && (
          <View style={styles.unverifiedTag}>
            <Text style={[typography.micro, styles.unverifiedTagText]}>
              Unverified Source
            </Text>
          </View>
        )}
      </View>
      <Text style={[typography.bodySm, styles.description]}>{description}</Text>
    </View>
  );
};

const ICON_BADGE_SIZE = 28;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: ICON_BADGE_SIZE,
    height: ICON_BADGE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  likelihood: {
    color: colors.muted,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  unverifiedTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    backgroundColor: colors.verdicts.sourceUndisclosed.border,
  },
  unverifiedTagText: {
    color: colors.verdicts.sourceUndisclosed.color,
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 16,
  },
});
